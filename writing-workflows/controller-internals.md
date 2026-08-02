# Controller Internals

[Controller Workflows](/writing-workflows/controller) explains how to write a
controller. This page explains how one runs: what the model is actually sent
each turn, where every limit sits, which failures end a run, and what survives
a crash or a retry. It is the page to read before putting a controller into
production, because in a controller the conversation *is* the run — its size
sets the cost, and its persistence sets the recovery story.

## The conversation

Each turn, the controller makes one completion request built from two parts:

- **A system prompt, rebuilt every turn.** Your `llm.system` text, the
  controller's own framing, every task with its current status and reason, every
  answer a person has given so far, and the rules of the loop. Task
  descriptions and collected answers are therefore paid for on every turn, not
  once.
- **The full message history.** One assistant message per decision (the tool
  call the model made), one tool result per observation, plus any reminders the
  loop injected. Nothing is ever removed, summarized, or compressed.

History is append-only, so requests grow monotonically: an observation added on
turn 10 of a 40-turn run is resent 30 times. That is why
[keeping reports small](/writing-workflows/controller#what-the-controller-sees)
is the main cost lever — a line saved in an observation is saved once per
remaining turn.

## Context window

There is no context management. The transcript grows until the run settles or
the model's context limit is reached — Dagu never trims, slides, or compacts
the conversation to make it fit.

When a request exceeds the model's window, the provider rejects it as an
invalid request. That class of error is not retried: the decision fails and the
run fails with the provider's error.

Overflow is terminal for that conversation. `dagu retry` restores both the
transcript and the definition recorded with the run — the DAG is replayed from
its snapshot, not re-read from the source file — so a retry sends the same
oversized conversation to the same model and hits the same wall. Recovery is a
new run with a fresh conversation; task progress does not carry over.

Prevention is the whole game:

- Publish selectively from children with `outputs.write`, so internal
  variables never enter the transcript.
- Keep `llm.system` and task descriptions tight; they are resent every turn.
- Lower `llm.max_tool_iterations` for runs that should be short — the turn cap
  also caps how large the conversation can grow.
- Pick a model whose window fits the expected turn count times the expected
  observation size, with room to spare.

## Limits

| Limit | Default | Configurable | When hit |
|---|---|---|---|
| Turns per run | 50 | `llm.max_tool_iterations` | Run fails, naming the tasks still open. |
| Runs per action | 5 | No | The call is refused with an error the model reads; the run continues. |
| Questions per run | 5 | No | `ask_user` is refused; the model is told to decide with what it has. |
| Silent turns | 1 reminder | No | A second consecutive turn without a tool call fails the run. |
| Log observation | Last 40 lines each of stdout and stderr | No | Older lines never reach the model. |
| Child outputs (default listing) | 2,000 characters per value | No | Longer values are cut at the limit. |
| Published outputs | `max_output_size` (1 MiB) | Yes, per DAG | The whole published value enters the transcript. |

Three details worth knowing:

- **A rejected call still costs a turn.** Calling a tool that does not exist,
  or with arguments that do not decode, produces an error observation and
  advances the turn counter like any other decision.
- **The turn counter survives suspension and retry.** A run that spent 30 turns
  before waiting on a person resumes with 20 left. Retrying a failed run
  continues the same budget; it does not reset it.
- **Published outputs are the unbounded path.** The 40-line and 2,000-character
  caps apply to scraped logs and default child listings. A value a step
  publishes explicitly is trusted at full size, up to
  [`max_output_size`](/writing-workflows/yaml-specification#history-and-output-limits) —
  publishing a large value puts it in every remaining turn.

## Decision calls

Every turn is a single non-streaming completion. The request carries the
model, the conversation, `temperature`, `max_tokens`, `top_p`, and the action
catalog as tools. `llm.stream` and `llm.thinking` are not applied to decision
calls. `llm.max_tokens` caps one reply, not the run.

**The controller uses one model.** The array form of `llm.model` is accepted,
but only the first entry drives the loop —
[model fallback](/step-types/llm/reliability#model-fallback) is a
`chat.completion` behavior and does not apply to a decision loop.

Transient failures are retried in two layers before a decision fails:

1. **Transport retries.** The HTTP client retries rate limits (`429`), server
   errors (`500`–`504`), and network failures up to 3 times, backing off
   exponentially from 1 second up to 30 seconds, with a 5-minute timeout per
   request.
2. **Logical retries.** Above that, the whole request is re-attempted, up to 3
   attempts in total, backing off from 1 second to 2 seconds. This catches
   interrupted responses — a decode failure, a connection dropped mid-body —
   and transient failures that outlived the transport retries.

Authentication failures, invalid requests, unknown models, and context
overflow are not retried. When retries are exhausted or the failure is not
retryable, the run fails with that error. There is no step-level `retry_policy`
for decisions — the controller is not a step you configure. Recovery is
`dagu retry`, which resumes the conversation rather than starting over.

## Durability and recovery

After every decision, the controller persists its state on the run: task
statuses and reasons, the decision timeline, per-action run counts, the turn
count, collected answers, and the action currently in flight. The conversation
is stored as the run's chat transcript — the same data the **Chat** tab
renders.

That persistence is what makes three things work:

- **Suspension.** When an action opens a human task, the run reports `waiting`
  and the process exits. Completing the task starts a new process that
  restores the state, reports what became of the pending action as the next
  observation, and asks for the next decision.
- **Retry as resume.** `dagu retry` on a failed run restores the same state
  and transcript. The controller continues from where it failed — it does not
  replay decisions or re-run actions that already succeeded.
- **A pinned definition.** Retry and resume replay the DAG recorded with the
  run, not the current source file. Editing the YAML between attempts changes
  future runs, never a run already underway — the model, prompt, and catalog a
  run started with are the ones it finishes with.

## Cost observability

Every decision records the provider, the model, and the prompt, completion,
and total token counts on the assistant message. The **Chat** tab shows them
per message, so the growth of the conversation is visible turn by turn.

There is no aggregate budget: Dagu does not sum tokens per run or stop a run
at a spend threshold. The working caps are `llm.max_tool_iterations`, which
bounds how many completions a run can make, and observation size, which bounds
what each one costs.

## Secrets in the transcript

Values resolved from the run scope can include secrets, and they appear in
prompts and observations. The copy sent to the provider is masked — the values
of declared `secrets` are replaced before the request leaves. The transcript
the run stores is not: it keeps the resolved values readable, so the **Chat**
tab and the run's data on disk contain them. Two consequences: treat access to
controller run data as access to the secrets the run resolved, and declare
sensitive values as `secrets` rather than plain `env` entries — masking covers
only what is declared.
