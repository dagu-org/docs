# VS Code

VS Code agent mode and GitHub Copilot read MCP servers from `mcp.json`. Use `.vscode/mcp.json` for one workspace, or run **MCP: Open User Configuration** from the Command Palette to edit the `mcp.json` in your user profile, which applies to every workspace.

## Configuration

```json
{
  "servers": {
    "dagu": {
      "type": "http",
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer ${input:dagu-api-key}"
      }
    }
  },
  "inputs": [
    {
      "type": "promptString",
      "id": "dagu-api-key",
      "description": "Dagu MCP API key",
      "password": true
    }
  ]
}
```

The top-level key is `servers`, not `mcpServers`. HTTP servers accept `type`, `url`, `headers`, and `oauth`.

`${input:dagu-api-key}` makes VS Code prompt for the key the first time the server starts and store it securely afterwards, which keeps the key out of a committed file. `"password": true` masks the input. Drop the `headers` block and the `inputs` array when the Dagu server runs with authentication disabled.

## Verify

Run **MCP: List Servers** or **MCP: Show Installed Servers** from the Command Palette, then select `dagu` to inspect its state and tools. Other useful commands:

| Command | Purpose |
|---------|---------|
| `MCP: Add Server` | Guided flow for adding a server |
| `MCP: Open User Configuration` | Edit the profile-level `mcp.json` |
| `MCP: Open Workspace Folder MCP Configuration` | Edit `.vscode/mcp.json` |
| `MCP: Reset Cached Tools` | Re-read the tool list after a Dagu upgrade |
| `MCP: Reset Trust` | Re-prompt for workspace server trust |

Reference: [VS Code MCP configuration reference](https://code.visualstudio.com/docs/agents/reference/mcp-configuration).
