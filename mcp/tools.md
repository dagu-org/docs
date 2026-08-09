# MCP Tools

Dagu intentionally exposes three MCP tools.

| Tool | Purpose |
|------|---------|
| `dagu_read` | Read DAGs, Markdown Wiki pages, DAG runs, logs, list views, and Dagu MCP reference resources. |
| `dagu_change` | Preview or apply DAG YAML and workspace-aware Wiki page changes. |
| `dagu_execute` | Start, enqueue, retry, or stop DAG runs. |

## `dagu_read`

Use `dagu_read` for current Dagu state.

| Input | Values |
|-------|--------|
| `target` | `dags`, `dag`, `dag_spec`, `wiki`, `wiki_page`, `wiki_search`, `runs`, `run`, `run_logs`, `step_log`, or `reference` |
| `name` | DAG name for DAG and run targets |
| `dagRunId` | DAG-run ID for run and log targets |
| `stepName` | Step name for the `step_log` target |
| `query` | URL query string for list and log targets, such as `page=1&perPage=100` or `tail=100` |
| `workspace` | `all`, `default`, or a workspace name for Wiki page targets. Required for `wiki_page`; optional for `wiki` and `wiki_search`. |
| `path` | Wiki page path without `.md`; required for `wiki_page` |
| `search` | Search text; required for `wiki_search` |
| `prefix` | Wiki page path prefix without `.md`; optional for `wiki` and `wiki_search` |
| `cursor` | Opaque cursor from the preceding `wiki_search` result page |
| `limit` | Maximum `wiki_search` results from 1 to 50; defaults to 20 |
| `uri` | Direct resource URI, such as `dagu://reference/authoring` |

Examples:

```json
{ "target": "dags", "query": "page=1&perPage=100" }
```

```json
{ "target": "dag_spec", "name": "nightly-report" }
```

List Wiki pages in one workspace:

```json
{
  "target": "wiki",
  "workspace": "operations",
  "prefix": "runbooks",
  "query": "flat=true&perPage=100&sort=mtime&order=desc"
}
```

In tree mode, `page` and `perPage` select direct children of the workspace or `prefix`, and each returned directory includes its descendants. In flat mode, they select individual Wiki pages. Wiki page lists accept up to 200 entries per page.

Read or search Markdown Wiki pages:

```json
{ "target": "wiki_page", "workspace": "operations", "path": "runbooks/restart" }
```

```json
{
  "target": "wiki_search",
  "workspace": "operations",
  "prefix": "runbooks",
  "search": "database failover",
  "limit": 20
}
```

Search results include matching snippets and `modifiedAt`. If `hasMore` is true, pass `nextCursor` as `cursor` in the next call and keep `search`, `workspace`, and `prefix` unchanged.

The legacy `docs`, `doc`, and `doc_search` targets remain available as deprecated exact aliases. New clients should use the Wiki target names.

```json
{ "uri": "dagu://runs/nightly-report/latest/logs?tail=100" }
```

Read stdout and stderr for one step:

```json
{
  "target": "step_log",
  "name": "nightly-report",
  "dagRunId": "20260522T010000",
  "stepName": "generate-report"
}
```

## `dagu_change`

Use `dagu_change` for DAG YAML and Markdown Wiki page changes. Preview does not write; apply uses the same workspace authorization, path validation, Git Sync write policy, mutation notifications, and audit path as the REST API.

| Input | Values |
|-------|--------|
| `mode` | `preview` or `apply`; defaults to `preview` |
| `type` | `upsert_dag`, `upsert_wiki_page`, `rename_wiki_page`, or `delete_wiki_page`; defaults to `upsert_dag` |
| `name` | DAG name for `upsert_dag` |
| `spec` | Full DAG YAML specification for `upsert_dag` |
| `workspace` | `default` or a named workspace for Wiki page changes; `all` is not allowed |
| `path` | Wiki page or directory path without `.md` for Wiki page changes |
| `content` | Full Markdown content for `upsert_wiki_page`; empty content is allowed |
| `newPath` | Destination Wiki page or directory path for `rename_wiki_page` |

The legacy `upsert_doc`, `rename_doc`, and `delete_doc` types remain available as deprecated exact aliases.

Preview validates the spec without writing it:

```json
{
  "mode": "preview",
  "type": "upsert_dag",
  "name": "nightly-report",
  "spec": "steps:\n  - name: hello\n    command: echo hello\n"
}
```

Apply writes only after validation succeeds:

```json
{
  "mode": "apply",
  "type": "upsert_dag",
  "name": "nightly-report",
  "spec": "steps:\n  - name: hello\n    command: echo hello\n"
}
```

Preview a Wiki page create or update:

```json
{
  "mode": "preview",
  "type": "upsert_wiki_page",
  "workspace": "operations",
  "path": "runbooks/restart",
  "content": "# Restart procedure\n\n..."
}
```

Rename or move a Wiki page or directory:

```json
{
  "mode": "apply",
  "type": "rename_wiki_page",
  "workspace": "operations",
  "path": "runbooks",
  "newPath": "procedures"
}
```

Delete a Wiki page or directory:

```json
{
  "mode": "preview",
  "type": "delete_wiki_page",
  "workspace": "operations",
  "path": "procedures/obsolete"
}
```

## `dagu_execute`

Use `dagu_execute` for run control.

| Input | Values |
|-------|--------|
| `action` | `start`, `enqueue`, `retry`, or `stop` |
| `targetType` | `dag`, `inline_spec`, or `run`; inferred when omitted |
| `name` | DAG name or optional inline spec name |
| `spec` | Inline DAG YAML for `start` or `enqueue` with `targetType=inline_spec` |
| `dagRunId` | Run ID override for start/enqueue, or target run for retry/stop |
| `params` | Runtime parameters as a JSON string |
| `queue` | Queue override for `enqueue` |
| `singleton` | Prevent duplicate running or queued runs when supported |
| `labels` | Labels as `key=value` or key-only strings |
| `stepName` | Optional step name for retry |

Start a stored DAG:

```json
{ "action": "start", "targetType": "dag", "name": "nightly-report" }
```

Enqueue a stored DAG:

```json
{ "action": "enqueue", "name": "nightly-report", "queue": "default" }
```

Retry a run:

```json
{ "action": "retry", "name": "nightly-report", "dagRunId": "20260522T010000" }
```

Stop a run:

```json
{ "action": "stop", "name": "nightly-report", "dagRunId": "20260522T010000" }
```

When a run can be identified, `dagu_execute` returns resource links for run details and logs. Clients that support subscriptions can subscribe to the returned run resource.

`dagu_execute` can start or enqueue a root DAG containing human tasks, locally or on a distributed worker, but it cannot complete a waiting human task. Use the [Web UI](/writing-workflows/human-tasks#web-ui), [REST API](/web-ui/api#human-task-endpoints), or local [`dagu human-task complete`](/getting-started/cli#human-task-complete) command. Human-task completion is not available through MCP, including `dagu_execute` retry or stop actions.
