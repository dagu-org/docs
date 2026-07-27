# Team Setup

Share the MCP server definition through the repository and keep each person's API key in their own environment.

## Keys

Create one Dagu API key per person rather than a shared key. Individual keys keep [audit events](/mcp/auditability) attributable, and revoking one person's access does not disturb anyone else.

| Setting | Guidance |
|---------|----------|
| Surface | Limit the key to `mcp` when the tool should not call the REST API directly. |
| Role | `viewer` for read-only inspection, `operator` to run and stop workflows, `developer` to create or edit workflows. |
| Attribution | `user_owned` for individual accountability, `service_account` for shared automation such as a CI runner. |

See [Authentication](/mcp/authentication) for the full model.

## Committed Configuration

Each client reads a different file and uses a different placeholder syntax for the secret.

| Client | Commit | Secret placeholder |
|--------|--------|--------------------|
| [Claude Code](./claude-code) | `.mcp.json` | `${DAGU_MCP_API_KEY}` |
| [Cursor](./cursor) | `.cursor/mcp.json` | `${env:DAGU_MCP_API_KEY}` |
| [VS Code](./vscode) | `.vscode/mcp.json` | `${input:dagu-api-key}`, prompted on first use |
| [Gemini CLI](./gemini-cli) | `.gemini/settings.json` | `${DAGU_MCP_API_KEY}` |
| [OpenCode](./opencode) | `opencode.json` | `{env:DAGU_MCP_API_KEY}` |
| [Codex](./codex) | Not repository-scoped | `bearer_token_env_var` in `~/.codex/config.toml` |
| [Zed](./zed), [Cline](./cline) | Do not commit | Value is stored literally |

Teammates export `DAGU_MCP_URL` and their own `DAGU_MCP_API_KEY` before starting the client. VS Code is the exception: it prompts for the key and stores it in the OS secret store.

## Claude Code Example

```bash
claude mcp add --transport http --scope project dagu "$DAGU_MCP_URL"
```

Then edit the generated `.mcp.json` so both values come from the environment:

```json
{
  "mcpServers": {
    "dagu": {
      "type": "http",
      "url": "${DAGU_MCP_URL:-http://localhost:8080/mcp}",
      "headers": {
        "Authorization": "Bearer ${DAGU_MCP_API_KEY}"
      }
    }
  }
}
```

Claude Code prompts each teammate to approve a project-scoped server the first time they use it.

## Shared Servers

When several people point at one Dagu server, prefer a role per purpose over one broad key. A reviewer connecting for read-only inspection needs `viewer`, while an on-call operator needs `operator`. Workspace access limits are enforced for MCP requests through the same API service used by the Web UI and REST API, so a client sees only what its credential is allowed to see.
