# Claude Code

Claude Code supports Streamable HTTP MCP servers through `claude mcp add --transport http`.

## Add The Server

For a Dagu server without authentication:

```bash
claude mcp add --transport http dagu "$DAGU_MCP_URL"
```

For a Dagu server using `builtin` authentication:

```bash
claude mcp add --transport http dagu "$DAGU_MCP_URL" \
  --header "Authorization: Bearer ${DAGU_MCP_API_KEY}"
```

`--transport` and `--header` also accept the short forms `-t` and `-H`.

## Scopes

| Scope | Loads in | Stored in |
|-------|----------|-----------|
| `local` (default) | Current project only, private to you | `~/.claude.json` |
| `user` | All your projects, private to you | `~/.claude.json` |
| `project` | Current project, shared through version control | `.mcp.json` in the project root |

To make Dagu available in every Claude Code project on your machine:

```bash
claude mcp add --transport http --scope user dagu "$DAGU_MCP_URL" \
  --header "Authorization: Bearer ${DAGU_MCP_API_KEY}"
```

For the shared repository setup, see [Team Setup](./team-setup).

## Configuration File

The equivalent JSON entry, in `.mcp.json` for project scope or `~/.claude.json` for local and user scope:

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

Claude Code expands `${VAR}` and `${VAR:-default}` in `url` and `headers`, so the file can be committed while the key stays in each user's environment. If a referenced variable is unset and has no default, the server still loads and `claude mcp list` reports a missing-variable warning.

The `type` field is required. An entry with a `url` and no `type` is read as a stdio server, and Claude Code skips it with a configuration error. `streamable-http` is accepted as an alias for `http`.

## Verify

```bash
claude mcp list
claude mcp get dagu
```

Inside Claude Code, use `/mcp` to inspect connection status.

Project-scoped servers from `.mcp.json` require approval the first time. Until then they appear as pending approval in `claude mcp list`. Run `claude` in the project to approve, or reset earlier choices with `claude mcp reset-project-choices`.

## Rotating Credentials

If Dagu tokens are issued by a script instead of a static API key, use `headersHelper` in place of `headers`. Claude Code runs the command at connection time and merges its JSON output into the request headers:

```json
{
  "mcpServers": {
    "dagu": {
      "type": "http",
      "url": "${DAGU_MCP_URL}",
      "headersHelper": "/opt/bin/dagu-mcp-auth-header"
    }
  }
}
```

Reference: [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp).
