# Cline

Cline adds remote MCP servers through its UI or through the MCP settings JSON.

## Add Through The UI

In the Cline panel, click the **MCP Servers** icon in the top toolbar, open the **Remote Servers** tab, then enter:

| Field | Value |
|-------|-------|
| Server Name | `dagu` |
| Server URL | `$DAGU_MCP_URL` |
| Transport Type | Streamable HTTP |

Click **Add Server**.

## Configuration

**Configure MCP Servers** opens the MCP settings JSON used by the extension. The Cline CLI reads `~/.cline/mcp.json`.

```json
{
  "mcpServers": {
    "dagu": {
      "type": "streamableHttp",
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer dagu_..."
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Set `"type": "streamableHttp"` explicitly. Omitting `type` falls back to the legacy SSE transport, which Dagu does not serve.

`autoApprove` lists tools Cline may call without asking. Leave it empty, or limit it to `dagu_read` so that workflow edits and run control still require confirmation.

The key is stored literally in the settings file. Use a key scoped to the `mcp` surface with the narrowest role that fits the work, described in [Authentication](/mcp/authentication).

## Verify

Reopen the **MCP Servers** panel and confirm `dagu` is connected and that `dagu_read`, `dagu_change`, and `dagu_execute` are listed.

Reference: [Cline remote MCP documentation](https://docs.cline.bot/mcp/connecting-to-a-remote-server).
