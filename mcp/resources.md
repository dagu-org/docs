# MCP Resources

Dagu exposes MCP resources for DAG specs, Markdown documents, DAG-run details, scheduler and step logs, and built-in references.

## Resource URIs

| URI | MIME type | Description |
|-----|-----------|-------------|
| `dagu://reference/authoring` | `text/markdown` | Guidance for writing and editing Dagu DAG YAML through MCP. |
| `dagu://reference/tools` | `text/markdown` | Compact tool reference for `dagu_read`, `dagu_change`, and `dagu_execute`. |
| `dagu://reference/notifications` | `text/markdown` | How run-completion notifications work over MCP resources. |
| `dagu://dags/{name}/spec` | `application/yaml` | Current YAML spec for a DAG. |
| `dagu://docs` | `application/json` | Document tree across accessible workspaces. |
| `dagu://docs/{workspace}` | `application/json` | Document tree for `default` or one named workspace. |
| `dagu://docs/{workspace}/{path}` | `text/markdown` | Current Markdown content for one document. |
| `dagu://runs/{name}/{dagRunId}` | `application/json` | Current DAG-run details. |
| `dagu://runs/{name}/{dagRunId}/logs` | `application/json` | Scheduler log and step log metadata. |
| `dagu://runs/{name}/{dagRunId}/steps/{stepName}/logs` | `application/json` | Standard output and standard error for one step. |

Use `dagu_read` with a `uri` to read any resource directly:

```json
{ "uri": "dagu://reference/tools" }
```

```json
{ "uri": "dagu://dags/nightly-report/spec" }
```

Document resources use an explicit workspace so an identical path in two workspaces is unambiguous. Encode a nested document path as one URI segment:

```text
dagu://docs/operations/runbooks%2Frestart
```

The `dagu_read` list and search targets return these canonical URIs. `dagu://docs` and workspace collection resources accept the same `page`, `perPage`, `flat`, `sort`, `order`, and `prefix` query parameters as `target=docs`. Document lists accept up to 200 entries per page.

In tree mode, pagination selects direct children of the workspace or `prefix`; a returned directory still contains its descendants. In flat mode, pagination selects individual documents.

For example, this resource lists the newest individual documents below `runbooks` in the `operations` workspace:

```text
dagu://docs/operations?prefix=runbooks&flat=true&sort=mtime&order=desc&perPage=20
```

Log resources accept query parameters supported by Dagu's log readers, such as `tail=100`:

```text
dagu://runs/nightly-report/20260522T010000/logs?tail=100
```

## Run Subscriptions

`dagu_execute` returns run and log resource links when a run can be identified.

Clients that support MCP resource subscriptions can subscribe to:

```text
dagu://runs/{name}/{dagRunId}
```

Dagu sends a resource update notification when the run reaches a terminal state:

- `success`
- `failed`
- `aborted`
- `partial success`
- `rejected`

Clients without resource subscription support should poll `dagu_read` with `target=run` and the same `name` and `dagRunId`.

## MCP App Run Inspector

Hosts that support MCP Apps can render run-related `dagu_read` and `dagu_execute` results in an interactive inspector. It provides run and step status, scheduler and per-step logs, refresh, stop, and retry.

## Built-in Prompts

Dagu also exposes MCP prompts for common workflows:

| Prompt | Arguments | Purpose |
|--------|-----------|---------|
| `dagu_create_dag` | `goal` | Draft, validate, and apply a new DAG using Dagu's compact MCP tool surface. |
| `dagu_edit_dag` | `name`, `change` | Read an existing DAG spec, make a scoped edit, preview validation, then apply. |
| `dagu_create_doc` | `workspace`, `path`, `goal` | Draft, preview, and create a Markdown document. |
| `dagu_edit_doc` | `workspace`, `path`, `change` | Read a Markdown document, make a scoped edit, preview, then apply. |
| `dagu_debug_failed_run` | `name`, `dagRunId` | Read a run and logs, explain the likely failure, then offer retry or stop when appropriate. |
