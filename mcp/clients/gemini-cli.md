# Gemini CLI

Gemini CLI supports Streamable HTTP MCP servers through `gemini mcp add` or `settings.json`.

## Add The Server

For a Dagu server without authentication:

```bash
gemini mcp add --transport http dagu "$DAGU_MCP_URL"
```

For a Dagu server using `builtin` authentication:

```bash
gemini mcp add --transport http dagu "$DAGU_MCP_URL" \
  --header "Authorization: Bearer $DAGU_MCP_API_KEY"
```

The command shape is `gemini mcp add [options] <name> <commandOrUrl> [args...]`, and `--transport` defaults to `stdio`, so `--transport http` is required for Dagu.

## Configuration File

Gemini CLI stores servers in `~/.gemini/settings.json` for all projects, or `.gemini/settings.json` for one project:

```json
{
  "mcpServers": {
    "dagu": {
      "httpUrl": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer ${DAGU_MCP_API_KEY}"
      }
    }
  }
}
```

Use `httpUrl`. Gemini CLI treats `httpUrl` as Streamable HTTP and `url` as an SSE endpoint, and Dagu only serves Streamable HTTP, so an entry written with `url` fails to connect.

Values can reference environment variables with `$VAR_NAME` or `${VAR_NAME}`, so a project-level settings file can be committed while the key stays in each user's environment.

## Verify

```bash
gemini mcp list
```

Inside a session, `/mcp` shows the server list, connection status, and discovered tools.

Reference: [Gemini CLI MCP documentation](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html).
