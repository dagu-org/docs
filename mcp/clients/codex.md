# Codex

Codex supports Streamable HTTP MCP servers through `config.toml`. The CLI and IDE extension share this configuration.

## Add The Server

For a Dagu server without authentication:

```bash
codex mcp add dagu --url "$DAGU_MCP_URL"
```

For a Dagu server using `builtin` authentication:

```bash
codex mcp add dagu \
  --url "$DAGU_MCP_URL" \
  --bearer-token-env-var DAGU_MCP_API_KEY
```

`--bearer-token-env-var` stores the variable name, not the key. Codex reads `DAGU_MCP_API_KEY` from its own environment when it connects, so export it before starting Codex.

## Configuration File

Both commands write to `~/.codex/config.toml`:

```toml
[mcp_servers.dagu]
url = "https://dagu.example.com/mcp"
bearer_token_env_var = "DAGU_MCP_API_KEY"
```

Keys accepted for a Streamable HTTP server:

| Key | Purpose |
|-----|---------|
| `url` | MCP endpoint. Required. |
| `bearer_token_env_var` | Environment variable holding the bearer token. |
| `http_headers` | Static request headers. |
| `env_http_headers` | Request headers whose values come from environment variables. |
| `auth` | OAuth-based authentication instead of a bearer token. |
| `enabled` | Set to `false` to keep the entry but stop connecting. |
| `startup_timeout_sec`, `tool_timeout_sec` | Connection and tool call timeouts. |

Codex profiles layer on top of the base user config, so a Dagu entry can be limited to one profile by putting it in `$CODEX_HOME/<name>.config.toml`.

## Verify

```bash
codex mcp list
codex mcp get dagu
```

`codex mcp list --json` prints the resolved configuration, which is useful when checking that the right URL and token variable were written. In an interactive Codex session, use `/mcp` to see whether the `dagu` server is connected and which tools are available.

Remove the server with `codex mcp remove dagu`.

Reference: [Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
