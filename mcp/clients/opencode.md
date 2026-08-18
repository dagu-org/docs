# OpenCode

OpenCode configures MCP servers under the `mcp` key in its JSON config. Use `~/.config/opencode/opencode.json` for every project, or `opencode.json` in a repository root for one project. Project config takes precedence over global config for conflicting keys.

## Configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "dagu": {
      "type": "remote",
      "url": "http://localhost:8080/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer {env:DAGU_MCP_API_KEY}"
      }
    }
  }
}
```

`"type": "remote"` selects an HTTP MCP server. Drop the `headers` block when the Dagu server runs with authentication disabled, and set `"enabled": false` to keep the entry without connecting.

OpenCode interpolates `{env:VARIABLE_NAME}` from the environment, substituting an empty string when the variable is unset. `{file:path}` reads a value from a file, which suits a key kept outside the repository.

## Verify

```bash
opencode mcp list
```

## Related

OpenCode can also run as a workflow step through the [harness executor](/step-types/harness/opencode), which is the inverse relationship: Dagu drives OpenCode instead of OpenCode driving Dagu.

This MCP configuration is always opt-in. Managed OpenCode harness sessions do not create it, enable it, or modify configuration files. Existing user MCP entries are honored. If an entry references an environment variable, add that exact name to the Dagu service's `opencode.env_passthrough` list; DAG-level secrets are available only to CLI steps.

Reference: [OpenCode MCP servers documentation](https://opencode.ai/docs/mcp-servers/).
