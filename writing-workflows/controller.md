# Controller Workflows

A `graph` or `chain` workflow says *what runs in what order*. A **controller**
workflow says *what must be true when the run is finished*, and lets an LLM
decide the order.

Set `type: controller`, configure an `llm`, and declare a `tasks` list. Your
steps stop being a plan and become a catalog of actions the model can choose
from. The run succeeds once every task is marked complete. For runnable
workflows that build the feature up capability by capability, see
[Controller Examples](/writing-workflows/examples/controller).

```yaml
type: controller

env:
  - ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}

llm:
  provider: anthropic
  model: claude-opus-5

steps:
  - name: design
    description: Write the design note.
    action: dag.run
    with: { dag: design }

  - name: implement
    description: Build what the design describes.
    action: dag.run
    with: { dag: implement }

  - id: review
    name: review
    action: human.task
    with:
      prompt: Approve the design before implementation starts?
      form:
        type: object
        properties:
          approved: { type: boolean }
          notes: { type: string }
        required: [approved]

tasks:
  - name: designed
    description: Finished when the design workflow ran and a person approved it.
  - name: implemented
    description: Finished when the implement workflow succeeded.

---
name: design
steps:
  - name: draft
    run: echo "design drafted"

---
name: implement
steps:
  - name: build
    run: echo "implemented"
```

Save that as `ship-feature.yaml` in your DAGs directory and run it. The
controller runs `design`, opens the review, and the run reports `waiting` until
someone answers:

```bash
dagu start ship-feature
dagu human-task complete ship-feature --run-id <id> --step review \
  --inputs-json '{"approved":true,"notes":"looks good"}'
```


The `env:` line is not optional: Dagu only propagates `DAGU_*`, `DAG_*`, `LC_*`,
and `KUBERNETES_*` from your shell, so an exported API key needs binding before
the provider can see it.

`llm.provider` takes `openai`, `anthropic`, `gemini`, `openrouter`, `zai`,
`opencode`, or `local`. Add `base_url` to send the same provider at a proxy or
an OpenAI-compatible server of your own, and `api_key_name` when the credential
lives under a variable other than the provider's default:

```yaml
llm:
  provider: local
  model: qwen3:8b
  base_url: http://localhost:11434/v1
```

[Providers & Endpoints](/step-types/llm/providers) lists the credential variable
each provider reads. [Local Models](/step-types/llm/local-models) covers what a
local base URL has to look like.

Each turn the controller picks one action, watches what happens, and picks
again. It settles each task with `set_task_status` as it goes. The run ends once
no task is open.

## Parameterising the instructions

`llm.system` and each task `description` take variables, so the same controller
can be pointed at different work per run:

```yaml
type: controller

params:
  - TARGET: staging

env:
  - ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}

llm:
  provider: anthropic
  model: claude-opus-5
  system: |
    Deploy to ${params.TARGET}. Never touch any other environment.

steps:
  - name: deploy
    description: Deploy to the target environment.
    run: echo "deploying to ${TARGET}"

tasks:
  - name: deployed
    description: Finished when the deploy to ${params.TARGET} succeeded.
```

```bash
dagu start release                      # deploys to staging
dagu start release -- TARGET=production # deploys to production
```

## When to use it

Reach for a controller when the order genuinely cannot be written down in
advance: the next step depends on what a reviewer says, on what an earlier step
produced, or on how many times something has already been tried.

If you can draw the graph, draw the graph. `type: graph` is cheaper, faster, and
reproducible.

## Tasks

`tasks` is both the goal list and the termination condition.

```yaml
tasks:
  - name: designed
    description: Finished when the design workflow ran and a person approved it.
```

The `description` is what the controller judges against, so write it as a
completion test rather than a summary. "Finished when the PR URL has been
produced" gives the model something to check; "open a PR" does not.

Both fields are required, and names must be unique.

Every task starts open, and the controller settles it with one call:

| Status | When | Run outcome |
|---|---|---|
| `completed` | the criteria are met | — |
| `skipped` | it turned out there was nothing to do | still succeeds |
| `failed` | it cannot be achieved | run fails, naming the task |
| `open` | undo a decision later work invalidated | back into the loop |

`skipped` matters more than it looks. Without it, a task that is moot — signing
a Windows build for a project that has none — leaves the controller with no
honest move: it either burns turns pretending to work, or stalls out and fails
a run that was fine.

## Actions

Every step becomes one tool the model can call.

- Give each step a clear `description`. It is what the model reads when deciding
  what to run. Without one, a `dag.run` action falls back to the target
  workflow's own description.
- A `dag.run` step advertises its target's parameters, so the controller can
  pass arguments through.
- Every other step is a plain action with no arguments.

Write a value in `params` for anything the controller should not decide. A
parameter the step supplies is not advertised, so the model cannot supply its
own value for it, and a step that supplies every parameter takes no arguments at
all. Use this to fix what a step is for and leave the model only the genuine
choices:

```yaml
steps:
  - name: check_vocabulary
    description: Grade the draft for AI word choice.
    action: dag.run
    with:
      dag: check
      params:
        aspect: vocabulary      # fixed: the model only picks `depth`

  - name: check_structure
    description: Grade the draft for sentence shape.
    action: dag.run
    with:
      dag: check
      params:
        aspect: structure

---
name: check
params:
  - name: aspect
    type: string
  - name: depth
    type: string
    default: normal

steps:
  - id: grade
    run: ./check.sh "${params.aspect}" "${params.depth}"
```

Without the fixed `aspect`, both tools would look the same to the model and it
would have to reproduce the right value each call. Leaving a parameter open when
it should be fixed is the more expensive mistake: a model that guesses wrong, or
sends an empty string, produces a child run that does the wrong work and still
reports success.

`depends` is not allowed: ordering belongs to the controller. Router steps are
not allowed either.

## Driving a coding agent

An [`action: harness.run`](/step-types/harness/) step runs a coding agent CLI,
which makes it the natural action for work too open-ended to write down. Declare
it on the controller and the model can fire it, but not aim it: only `dag.run`
advertises parameters, so every other action is a tool that takes no arguments
and the prompt stays whatever the author wrote.

To let the controller write the instruction, put the harness in a child workflow
and expose the prompt as a parameter:

```yaml
type: controller

llm:
  provider: anthropic
  model: claude-opus-5

steps:
  - name: write_slogan
    description: Have a coding agent write one slogan line. Tell it exactly what to write.
    action: dag.run
    with:
      dag: agent

  - id: review
    name: review
    action: human.task
    with:
      prompt: Approve this slogan?
      form:
        type: object
        properties:
          approved: { type: boolean }
          feedback: { type: string }
        required: [approved]

tasks:
  - name: approved
    description: Finished when write_slogan produced a slogan and the reviewer set approved=true.

---
name: agent
params:
  - name: INSTRUCTION
    type: string
    description: What the agent should write, in full.

harness:
  provider: claude
  model: sonnet

steps:
  - id: work
    action: harness.run
    with:
      prompt: ${INSTRUCTION}
    output: RESULT

  - id: publish
    depends: [work]
    action: outputs.write
    with:
      values:
        slogan: ${RESULT}
```

Rejecting the review resumes the run, and the controller reaches for the same
action with a new `INSTRUCTION` written against the feedback. That cycle is what
the pairing buys: a person judges, and the controller re-aims the agent.

The `publish` step is not decoration. An agent CLI writes a lot to stdout, and a
step that publishes nothing is reported as the last 40 lines of its log, resent
on every remaining turn. Ending the child with `outputs.write` keeps the
transcript to the line that matters.

Budget the redo cycle against the per-step cap: any one action runs at most 5
times per run, so five rejections exhaust `write_slogan`. Split the work across
distinct steps when a longer cycle is expected.

A DAG-level `harness:` block sets defaults for the harness steps under it. Steps
that declare a command are unaffected and still run it.

## Waiting for a person

An `action: human.task` step works exactly as it does elsewhere, and it is the
reason controllers are durable. When the controller opens one, the run reports
`waiting` and the process exits, releasing the worker slot. Completing the task
resumes the same run, and the controller picks the conversation back up with the
submitted answer as its next observation.

```bash
dagu human-task complete ship-feature --run-id <id> --step review \
  --inputs-json '{"approved":true,"notes":"ship it"}'
```

Human tasks stay root-only, so declare them on the controller itself rather than
inside a child workflow.

## Asking a person

Not every question can be written down in advance. When the controller hits one,
it calls `ask_user` with a question of its own wording. The run reports
`waiting`, exactly as a declared human task does, and the reply comes back as the
controller's next observation.

```bash
dagu human-task complete ship-feature --run-id <id> --step ask_user \
  --inputs-json '{"answer":"staging-eu, never production"}'
```

No configuration is needed: every controller can ask. Three things keep it from
pestering anyone. The answers so far are restated to the controller every turn,
an exact repeat is refused with the answer it already got, and a run may ask at
most 5 questions. A controller running as somebody's child cannot ask at all,
since nobody is watching a sub-workflow.

## What the controller sees

After an action runs, the controller reads a short report of it and nothing
else. It never sees the step's command, its environment, or the state of any
other step. Everything it knows about the run it built up from these reports,
one per turn.

A report carries the step's status, and then whichever of these apply:

| Line | When it appears |
|------|-----------------|
| `error:` | The step failed. |
| `answer:` / `submitted:` | A human task was completed. |
| `outputs:` | The step published outputs explicitly. |
| `output:` | Nothing was published explicitly, but the step set `output:`. |
| `child run:` | The step ran a sub-workflow. |
| `log:` / `stderr:` | Otherwise: the last 40 lines of each. |

```text
status: succeeded
outputs: {"verdict":"VERDICT: ISSUES (4)","aspect":"word choice"}
child run: check (succeeded)
```

Every report stays in the transcript and is sent again on every later turn, so
what a step reports is paid for once per remaining turn of the run. Keeping
reports small is the main lever on what a controller run costs.

### Reporting from a sub-workflow

A `dag.run` action is reported from the child run rather than from the step's
own stdout, which only mirrors the child's status JSON.

By default the report lists every output variable the child's steps set. That
includes variables the child only uses internally, such as a file loaded to
build a prompt, and a large one costs tokens on every turn that follows.

End the child with `outputs.write` (or `stdout.outputs`) to decide what crosses
the boundary. When a child publishes outputs that way, the controller reports
those and stops listing the child's internal variables:

```yaml
# check.yaml
steps:
  - id: load_standard
    run: cat standard.txt      # internal: never reported to the controller
    output: STANDARD

  - id: grade
    depends: [load_standard]
    action: chat.completion
    with: { prompt: "..." }
    output: FINDINGS

  - id: publish                # the report the controller reads
    depends: [grade]
    action: outputs.write
    with:
      values:
        verdict: ${FINDINGS}
```

A child that publishes nothing keeps the default listing. Failed steps in the
child are reported either way. See
[Reading Child Results](/writing-workflows/sub-dags#reading-child-results) for
how the same two mechanisms work for an ordinary caller.

## Failure and repetition

A failing action does not abort a controller run. The failure is reported to the
controller like any other outcome, and it can retry the action, try something
else, or give up and fail the run.

The controller may also re-run an action it has already run, which is what makes
a review-and-redo cycle work. Any single action runs at most 5 times per run.

Final status follows the steps as they ended up. If a failed action was re-run
and passed, the run is **succeeded**. If an action was left failed and the
controller completed every task anyway, the run is **partially succeeded**.

## Limits

`llm.max_tool_iterations` caps the number of decisions in one run; it defaults
to 50 for controllers. Hitting the cap with tasks still open fails the run and
names the tasks that were left open.

If the model answers without choosing an action while tasks remain open, it gets
one reminder. A second silent turn fails the run.

## Watching a run

A controller has no dependency edges, so a graph of it carries no information.
The **Status** tab shows a decision timeline in that slot instead: one row per
turn, in the order things happened.

```
1  ▶ run_tests      failed      76.0s
2  ▶ run_tests      failed      76.0s   #2
3  ▶ fix_flaky      succeeded    0.0s
4  ▶ run_tests      succeeded    0.0s   #3
5  ✓ tests_green    task complete
6  ▶ build_notes    succeeded    0.0s
7  ✓ notes_drafted  task complete
8  ⏸ sign_off       waiting
```

Repeated actions carry an attempt number, and durations are wall time, so a step
that retried internally reads as the time it actually consumed. The steps table
sits below, showing each step's latest attempt.

The **Tasks** tab shows each goal, whether it is complete, and the reason the
controller gave. The **Chat** tab has the full transcript, including the tool
results the controller saw.

Steps the controller never chose are marked skipped when the run finishes.
