# Other Clients

Any MCP client that speaks Streamable HTTP can use Dagu without a client-specific page.

## Generic Setup

Add an HTTP or Streamable HTTP MCP server with these values:

| Field | Value |
|-------|-------|
| Name | `dagu` |
| URL | `$DAGU_MCP_URL`, for example `https://dagu.example.com/mcp` |
| Auth | `Authorization: Bearer $DAGU_MCP_API_KEY` when Dagu authentication is enabled |

Most client configurations are one of two JSON shapes:

```json
{
  "mcpServers": {
    "dagu": {
      "type": "http",
      "url": "https://dagu.example.com/mcp",
      "headers": {
        "Authorization": "Bearer dagu_..."
      }
    }
  }
}
```

Clients that derive the transport from the presence of a URL accept the same entry without `type`. See the [configuration shapes table](./#configuration-shapes) for the field names each documented client uses.

## Clients That Cannot Send Headers

Dagu accepts a `token` query parameter on the MCP endpoint and converts it into an `Authorization: Bearer` header:

```text
https://dagu.example.com/mcp?token=dagu_...
```

Query strings are commonly recorded in web server access logs, proxy logs, and client history, so a token sent this way should be treated as exposed to anything on that path. Use a dedicated key limited to the `mcp` surface with the narrowest role that fits the work, and rotate it. The parameter is ignored when an `Authorization` header is present.

## Stdio-Only Clients

Dagu serves Streamable HTTP and does not expose an SSE endpoint. A client that only launches stdio servers can reach Dagu through the `mcp-remote` bridge, which runs locally and forwards to the HTTP endpoint:

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

| Flag | Purpose |
|------|---------|
| `--transport http-only` | Skip SSE negotiation. Dagu only serves Streamable HTTP. |
| `--header "Name:${VAR}"` | Send a header. Writing the value without a space and passing it through `env` is the documented workaround for clients that mangle spaces in arguments. |
| `--allow-http` | Permit a plain `http://` URL, for a trusted private network. |

`mcp-remote` needs Node.js 18 or higher.

Reference: [mcp-remote](https://github.com/geelen/mcp-remote).
