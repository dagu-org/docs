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
dagu human-task complete --run-id <id> --step review \
  --inputs-json '{"approved":true,"notes":"looks good"}'
```


The `env:` line is not optional: Dagu only propagates `DAGU_*`, `DAG_*`, `LC_*`,
and `KUBERNETES_*` from your shell, so an exported API key needs binding before
the provider can see it. See [Providers](/step-types/llm/providers).

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

## Asking a person

Not every question can be written down in advance. When the controller hits one,
it calls `ask_user` with a question of its own wording. The run reports
`waiting`, exactly as a declared human task does, and the reply comes back as the
controller's next observation.

```bash
dagu human-task complete --run-id <id> --step ask_user \
  --inputs-json '{"answer":"staging-eu, never production"}'
```

No configuration is needed: every controller can ask. Three things keep it from
pestering anyone. The answers so far are restated to the controller every turn,
an exact repeat is refused with the answer it already got, and a run may ask at
most 5 questions. A controller running as somebody's child cannot ask at all,
since nobody is watching a sub-workflow.

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
