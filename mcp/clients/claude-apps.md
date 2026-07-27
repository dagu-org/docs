# Claude Desktop And claude.ai

Claude Desktop, claude.ai, Cowork, and the mobile apps add remote MCP servers as **custom connectors**. Custom connectors are available on Free, which allows one, and on Pro, Max, Team, and Enterprise plans.

Custom connectors support OAuth-based and unauthenticated remote servers. There is no field for a custom `Authorization` header, which shapes both setups below.

## Add A Custom Connector

On Pro and Max:

1. Go to **Customize → Connectors**.
2. Click **+**, then **Add custom connector**.
3. Add the Dagu MCP server URL.
4. Click **Add**.

On Team and Enterprise, an organization owner does this from **Organization settings → Connectors → Add**, hovers over **Custom**, and selects **Web**.

**Advanced settings** accepts an OAuth Client ID and Client Secret, which is the path for a Dagu deployment fronted by an identity provider. See [Enterprise OIDC/SSO for MCP](/mcp/authentication#enterprise-oidc-sso-for-mcp).

Use a URL the client can reach. For claude.ai and the mobile apps that means a publicly resolvable HTTPS address, not `localhost`.

## API Keys Without A Header Field

Dagu accepts a `token` query parameter on the MCP endpoint and converts it into an `Authorization: Bearer` header, which lets a connector authenticate without header support:

```text
https://dagu.example.com/mcp?token=dagu_...
```

A token in a URL is weaker than a header. Query strings are commonly written to web server access logs, proxy logs, and browser or client history, so treat the token as exposed to anything on that path. If you use this form, create a dedicated API key limited to the `mcp` surface with the narrowest role that fits the work, and rotate it on a schedule. Where a client can send headers, prefer that.

A `token` parameter is ignored when the request already carries an `Authorization` header.

## Local Bridge For Claude Desktop

Claude Desktop also runs local stdio MCP servers, so `mcp-remote` can bridge to a Dagu server that requires a header. Open **Settings → Developer → Edit Config**, which opens:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dagu": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://dagu.example.com/mcp",
        "--transport",
        "http-only",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer dagu_..."
      }
    }
  }
}
```

The header is written without a space after the colon and the value is passed through `AUTH_HEADER`, which is the workaround `mcp-remote` documents for clients that mangle spaces in arguments. Add `--allow-http` when pointing at a plain `http://` URL on a trusted network. `mcp-remote` needs Node.js 18 or higher.

Quit and reopen Claude Desktop after saving. MCP connection logs are written to `~/Library/Logs/Claude` on macOS and `%APPDATA%\Claude\logs` on Windows.

Reference: [Custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp).
