---
description: Start with any command and grow it into a scheduled, observable, reliable DAG using simple YAML.
---

# Writing Workflows

A Dagu workflow is a YAML file with a `steps` list. Start with a command you already run, then add dependencies and operational behavior only when the workflow needs them.

## Start with one command

Save this as `hello.yaml`:

```yaml
steps:
  - run: echo "Hello from Dagu"
```

Run it:

```bash
dagu start hello.yaml
```

That is a complete workflow. A name, schedule, queue, parameter block, and runner configuration are not required.

An `id` is optional for an isolated step. Add one when another step needs to depend on it or reference its output:

```yaml
steps:
  - id: hello
    run: echo "Hello from Dagu"

  - run: echo "Finished"
    depends: hello
```

## Add dependencies to build a DAG

Each step's `depends` field lists the steps that must succeed first. Dagu starts every step whose dependencies are ready.

```yaml
steps:
  - id: fetch
    run: ./fetch.sh

  - id: clean
    run: ./clean.sh
    depends: fetch

  - id: analyze
    run: ./analyze.sh
    depends: fetch

  - id: report
    run: ./report.sh
    depends: [clean, analyze]
```

```mermaid
graph LR
  fetch --> clean
  fetch --> analyze
  clean --> report
  analyze --> report
```

The run proceeds in three stages:

1. `fetch` runs first.
2. `clean` and `analyze` become ready together, so they run in parallel.
3. `report` waits for both branches.

There is no separate parallel-execution configuration. Parallelism follows directly from the graph.

## Validate, preview, and inspect runs

Use the CLI while developing a workflow:

```bash
dagu validate pipeline.yaml  # Check the YAML
dagu dry pipeline.yaml       # Show the execution plan
dagu start pipeline.yaml     # Run it now
dagu history pipeline        # List recent runs
```

Start the server to inspect the same workflows in the Web UI:

```bash
dagu start-all --dags .
```

Open <http://localhost:8080> to see the graph, live step status, logs, run history, and controls for starting, stopping, and retrying runs.

## Add operational behavior when needed

Top-level fields configure the workflow as a whole. Fields inside a step configure that command.

### Schedule it and retry failures

```yaml
schedule: "0 2 * * *"

steps:
  - run: ./nightly-sync.sh
    retry_policy:
      limit: 3
      interval_sec: 30
```

The scheduler starts this workflow every day at 02:00. A failed command is retried up to three times with 30 seconds between attempts. See [Scheduling](/writing-workflows/scheduling) and [Durable Execution](/writing-workflows/durable-execution).

### Accept parameters

```yaml
params:
  - ENVIRONMENT: staging

steps:
  - run: ./deploy.sh "${params.ENVIRONMENT}"
```

Override the value when starting the workflow:

```bash
dagu start deploy.yaml -- ENVIRONMENT=production
```

Parameters can also be typed and validated before a run starts. See [Parameters](/writing-workflows/parameters).

### Run steps in a container

```yaml
container:
  image: python:3.13

steps:
  - run: python report.py
```

All steps share one workflow container and its filesystem. See [Container](/writing-workflows/container).

### Wait for a person

```yaml
steps:
  - id: confirm
    action: human.task
    with:
      prompt: Deploy to production?

  - id: deploy
    run: ./deploy.sh
    depends: confirm
```

The run enters `Waiting` at `confirm` and releases its worker slot. Complete the task from the Web UI, REST API, or CLI to resume the same run. See [Human Tasks](/writing-workflows/human-tasks).

## Find the next topic

| When you want to… | Read |
|---|---|
| Learn step fields, scripts, dependencies, and defaults | [Workflow Basics](/writing-workflows/basics) |
| Pass parameters, outputs, and files between steps | [Data & Variables](/writing-workflows/data-variables) |
| Add conditions, loops, parallel iteration, or sub-DAGs | [Control Flow](/writing-workflows/control-flow) |
| Configure retries, timeouts, handlers, and failure behavior | [Durable Execution](/writing-workflows/durable-execution) and [Error Handling](/writing-workflows/error-handling) |
| Run HTTP, SQL, SSH, Docker, Kubernetes, or other actions | [Built-in Actions](/step-types/shell) |
| Start from copyable workflows | [Examples](/writing-workflows/examples) |
| Look up every supported field | [YAML Specification](/writing-workflows/yaml-specification) |

::: tip Dagu working for you?
[Star Dagu on GitHub](https://github.com/dagucloud/dagu) to bookmark the project and help other engineers discover it.
:::
