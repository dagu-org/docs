# Cursor

Cursor reads MCP servers from `mcp.json`. Use `~/.cursor/mcp.json` for every project, or `.cursor/mcp.json` in a repository for one project.

## Configuration

```json
{
  "mcpServers": {
    "dagu": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer ${env:DAGU_MCP_API_KEY}"
      }
    }
  }
}
```

Drop the `headers` block when the Dagu server runs with authentication disabled.

Cursor interpolates `${env:NAME}` from the environment, so the API key never has to be written into the file. Path placeholders such as `${userHome}` and `${workspaceFolder}` are also available.

Cursor must inherit `DAGU_MCP_API_KEY` from the environment it was launched in. Set it in your shell profile, or launch Cursor from a shell that exports it, so the value is present when the app starts.

## Verify

Open **Customize** in the sidebar to see configured MCP servers and toggle them on or off without deleting the entry. The `dagu` server should list `dagu_read`, `dagu_change`, and `dagu_execute`.

## Remote Servers With OAuth

For a Dagu deployment fronted by an OAuth-based identity provider, Cursor accepts static OAuth credentials through an `auth` object with `CLIENT_ID`, an optional `CLIENT_SECRET`, and `scopes`. OIDC/SSO-backed MCP access to Dagu is an enterprise deployment path, described in [Authentication](/mcp/authentication#enterprise-oidc-sso-for-mcp).

Reference: [Cursor MCP documentation](https://cursor.com/docs/context/mcp).
