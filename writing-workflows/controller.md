# Controller Workflows

A `graph` or `chain` workflow says *what runs in what order*. A **controller**
workflow says *what must be true when the run is finished*, and lets an LLM
decide the order.

Set `type: controller`, configure an `llm`, and declare a `tasks` list. Your
steps stop being a plan and become a catalog of actions the model can choose
from. The run succeeds once every task is marked complete.

```yaml
type: controller

env:
  - ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}

llm:
  provider: anthropic
  model: claude-opus-5

steps:
  - name: design
    action: dag.run
    with: { dag: design }

  - name: implement
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
    run: ./design.sh

---
name: implement
steps:
  - name: build
    run: ./implement.sh
```

The `env:` line is not optional: Dagu only propagates `DAGU_*`, `DAG_*`, `LC_*`,
and `KUBERNETES_*` from your shell, so an exported API key needs binding before
the provider can see it. See [Providers](/step-types/llm/providers).

Each turn the controller picks one action, watches what happens, and picks
again. When a task's criteria are met it calls `complete_task`. When every task
is complete, the run concludes.

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

## Actions

Every step becomes one tool the model can call.

- Give each step a clear `description`. It is what the model reads when deciding
  what to run. Without one, a `dag.run` action falls back to the target
  workflow's own description.
- A `dag.run` step advertises its target's parameters, so the controller can
  pass arguments through.
- Every other step is a plain action with no arguments.

`depends` is not allowed: ordering belongs to the controller. Router steps are
not allowed either.

## Waiting for a person

An `action: human.task` step works exactly as it does elsewhere, and it is the
reason controllers are durable. When the controller opens one, the run reports
`waiting` and the process exits, releasing the worker slot. Completing the task
resumes the same run, and the controller picks the conversation back up with the
submitted answer as its next observation.

```bash
dagu human-task complete --run-id <id> --step review \
  --inputs-json '{"approved":true,"notes":"ship it"}'
```

Human tasks stay root-only, so declare them on the controller itself rather than
inside a child workflow.

## Failure and repetition

A failing action does not abort a controller run. The error and a tail of the
step's logs are handed back to the controller, which can retry the action, try
something else, or give up and fail the run.

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

The DAG-run view gains a **Tasks** tab showing each goal, whether it is
complete, and the reason the controller gave. The **Chat** tab shows the full
decision transcript, turn by turn, including the tool results the controller
saw.

Steps the controller never chose are marked skipped when the run finishes.
