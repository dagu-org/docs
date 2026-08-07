---
description: Reuse unchanged file-producing steps while preserving safe, atomic publication of their outputs.
---

# Incremental Workflows

Incremental workflows avoid repeating file transformations whose recipe, declared inputs, and existing output have not changed. They are useful for builds, reports, media pipelines, and other local workflows where each stage produces a regular file at a stable path.

Set `type: incremental`, declare file inputs with `inputs`, and give a reusable step one path-backed output:

```yaml
type: incremental
working_dir: /srv/report-pipeline

steps:
  - id: normalize
    inputs:
      - name: source
        path: source.csv
    outputs:
      - name: normalized
        path: normalized.csv
    run: ./normalize.sh "${inputs.source}" "${outputs.normalized}"

  - id: render
    inputs:
      - name: data
        path: normalized.csv
    outputs:
      - name: report
        path: report.html
    run: ./render.sh "${inputs.data}" "${outputs.report}"

  - id: announce
    depends: render
    run: echo "Report ready at ${steps.render.outputs.report}"
```

The working directory and the parent directories of declared outputs must already exist. The first run executes all three steps. On a later run with the same inputs and recipe, Dagu reuses `normalize` and `render`; `announce` still runs because it has no reusable path output.

`render` does not need `depends: normalize`. Its `normalized.csv` input matches `normalize`'s output, so Dagu infers that dependency. Keep explicit `depends` entries for ordering that is not represented by a file.

## How Reuse Is Decided

A reusable step executes when no prior successful materialization exists. After it succeeds, Dagu records a manifest containing the step recipe, input content hashes, output content hash, and producer run.

On later runs, Dagu reuses the step only when all of these still match:

- the resolved command or script, parameters, non-secret environment, tools, platform, and effective working directory
- the names, paths, and SHA-256 content hashes of every declared input
- the declared output path and the content of the file currently at that path

Changing an input, command, parameter, environment value, tool configuration, working directory, or output file causes the step to execute again. If the final output is missing or modified, Dagu recomputes it; incremental workflows do not restore a separate cached copy.

A reused step is reported as succeeded. It is not skipped, and `${steps.<id>.outputs.<name>}` still publishes the final output path to dependent steps.

## Path References

Incremental paths have three reference forms:

| Reference | Value | Availability |
|---|---|---|
| `${inputs.<name>}` | Absolute final path of a declared input | The owning step |
| `${outputs.<name>}` | Fresh staging path beside the final output | The owning executor attempt, including `run` and step `env` |
| `${steps.<id>.outputs.<name>}` | Absolute final path after commit or reuse | Dependent steps |

The producer must write to `${outputs.<name>}`, not directly to the final path. Each execution attempt receives a new, initially absent staging path. Dagu verifies the staged file and publishes it to the final path only after the step succeeds.

Do not use `${outputs.<name>}` in `working_dir`, preconditions, retry settings, or other fields evaluated outside an executor attempt.

## Paths and Inferred Dependencies

Paths may be absolute or relative. Relative paths use the workflow's stable working directory or the source DAG file's directory. An inline workflow with relative incremental paths must be given a stable default working directory, such as `dagu.WithDefaultWorkingDir` in the [embedded Go API](/embedding/go-api).

Path expressions must resolve before step execution. They may use stable values such as parameters and environment values, but cannot use step-output references or command substitution.

Dagu canonicalizes paths before comparing them. This has several consequences:

- `artifact.bin` and `./artifact.bin` identify the same output.
- Only one step may produce a given canonical output path.
- A step cannot declare the same canonical path as both its input and output.
- Matching producer outputs and consumer inputs add dependencies to the graph.
- Explicit and inferred dependencies must form an acyclic graph.

Inputs and outputs must be regular, non-symlink files. Missing inputs fail evaluation. The parent directory of an output must exist before the run starts.

## Which Steps Can Be Reused

A step is eligible for reuse when it:

- has an `id`
- declares exactly one output, and that output has `path`
- runs a host command or shell without a DAG-level or step-level container
- does not publish dynamic or scalar outputs
- does not use secrets, repeat, human tasks, approvals, `parallel`, `foreach`, or a child DAG lifecycle

Other valid steps in an incremental workflow execute normally and show an `always` decision. Path declarations themselves are supported only on host command and shell steps; built-in actions and containerized steps cannot declare incremental paths.

Incremental execution is currently local-only. A distributed execution request is rejected because workers do not yet share the required file fencing. If the server's default execution mode is distributed, set `worker_selector: local` on the workflow.

## Publication, Retries, and Concurrent Runs

Dagu holds shared locks for declared inputs and an exclusive lock for the output while it evaluates and executes a path-backed step. Incremental runs using the same local Dagu data store therefore cannot publish conflicting materializations. Dagu also verifies input contents again before commit, so an external change fails the attempt instead of publishing an inconsistent output.

`stdout`, `stderr`, `stdout.artifact`, and `stderr.artifact` destinations cannot resolve to a declared incremental input or output. This keeps stream capture from modifying an input or final materialization before verification and commit.

Each retry gets a fresh staging path. If an attempt fails, times out, or is aborted, Dagu removes its staging file and leaves the previous final output and manifest unchanged. Before commit, Dagu also verifies that the declared inputs did not change during execution.

## Preview or Disable Reuse

Use `dagu dry` to preview incremental decisions without executing commands or creating locks, staging files, manifests, or run history:

```bash
dagu dry report-pipeline.yaml
```

A downstream decision can be `deferred` when its input depends on an upstream step that the dry run predicts will execute. The actual run evaluates it after the upstream output is known.

Use `--no-reuse` to recompute every otherwise eligible step for one run. Successful steps safely replace their materializations; failures still preserve the previous output.

```bash
dagu start --no-reuse report-pipeline.yaml
dagu enqueue --no-reuse report-pipeline.yaml
dagu dry --no-reuse report-pipeline.yaml
```

The Web UI exposes the same behavior as **Disable reuse for this run** in the start dialog. API clients can send `noReuse: true`, and embedded applications can pass `dagu.WithNoReuse(true)`.

## Inspect Decisions

The CLI and Web UI show whether each step will `execute`, has a `reuse` decision, must `always` run, or is `deferred` during a dry run. The step detail includes a stable reason and a human-readable explanation. Reused steps also link to the DAG run that produced the materialization.

The REST DAG-run response exposes the same data under each node's `incremental` field. See [REST API](/web-ui/api#incremental-execution-data) for the response shape.

## Related Pages

- [Data Flow](/writing-workflows/data-flow)
- [Outputs](/writing-workflows/outputs)
- [Durable Execution](/writing-workflows/durable-execution)
- [YAML Specification](/writing-workflows/yaml-specification)
