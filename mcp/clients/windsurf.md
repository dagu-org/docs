# Windsurf

Windsurf Cascade reads MCP servers from `~/.codeium/windsurf/mcp_config.json`. Open it from **Settings → Cascade → MCP Servers**, or from the **MCPs** icon in the Cascade panel.

## Configuration

```json
{
  "mcpServers": {
    "dagu": {
      "serverUrl": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer ${env:DAGU_MCP_API_KEY}"
      }
    }
  }
}
```

Use `serverUrl` for an HTTP MCP server. Windsurf does not use the `url` field that most other clients use, so an entry copied from another client's example will not connect.

`mcp_config.json` supports interpolation: `${env:VAR_NAME}` reads an environment variable, and `${file:/path/to/file}` reads file contents. Either keeps the API key out of the config file.

Drop the `headers` block when the Dagu server runs with authentication disabled.

## Verify

Open the MCP Servers panel in Cascade and confirm `dagu` is connected with `dagu_read`, `dagu_change`, and `dagu_execute` available.

Reference: [Windsurf Cascade MCP documentation](https://docs.devin.ai/desktop/cascade/mcp).
