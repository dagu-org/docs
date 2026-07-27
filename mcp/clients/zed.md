# Zed

Zed connects to remote MCP servers through the `context_servers` key in `settings.json`. Open the file with the `zed: open settings file` command, or use **Settings → AI → MCP Servers → Add Server**.

## Configuration

```json
{
  "context_servers": {
    "dagu": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer dagu_..."
      }
    }
  }
}
```

Drop the `headers` block when the Dagu server runs with authentication disabled.

Zed's documented schema takes the header value literally, so the API key is stored in `settings.json`. Use a key scoped to the `mcp` surface with the narrowest role that fits the work, keep the settings file out of version control, and rotate the key if the file is ever shared. See [Authentication](/mcp/authentication) for surfaces and roles.

## Verify

Open the Agent Panel and check that `dagu` is connected with `dagu_read`, `dagu_change`, and `dagu_execute` listed.

Reference: [Zed MCP documentation](https://zed.dev/docs/ai/mcp).
