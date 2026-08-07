# Webhooks

Webhooks let an external caller trigger one specific DAG through `POST /api/v1/webhooks/{fileName}`. Each DAG can have at most one webhook configuration.

Webhook management uses the normal authenticated API. Trigger requests use the webhook token instead of API keys or session JWTs.

## Requirements

Webhook management requires builtin auth:

```yaml
auth:
  mode: builtin
```

Behavior when builtin auth is not available:

- Management endpoints return `401 Unauthorized`
- The trigger endpoint returns `404 Not Found`

Most webhook management endpoints require developer, manager, or admin role. Configuring which runtime profiles webhook callers may select is admin-only.

## Create a Webhook

Create the webhook with a user that has developer, manager, or admin role:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}' | jq -r '.token')

curl -X POST http://localhost:8080/api/v1/dags/my-dag/webhook \
  -H "Authorization: Bearer $TOKEN"
```

Response:

```json
{
  "webhook": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "dagName": "my-dag",
    "tokenPrefix": "dagu_wh_7Kq9",
    "enabled": true,
    "authMode": "token_only",
    "hmac": {
      "enabled": false,
      "secretConfigured": false
    },
    "profileSelection": {
      "allowedProfiles": []
    },
    "createdAt": "2026-04-29T10:00:00Z",
    "updatedAt": "2026-04-29T10:00:00Z",
    "createdBy": "user-id"
  },
  "token": "dagu_wh_7Kq9mXxN3pLwR5tY2vZa8bCdEfGhJk4n6sUwXy0zA1B"
}
```

The full `token` value is only returned when the webhook is created or when the token is regenerated.

## Trigger Requests

New webhooks use token authentication by default. Trigger requests send the webhook token as a bearer token:

```bash
curl -X POST http://localhost:8080/api/v1/webhooks/my-dag \
  -H "Authorization: Bearer $WEBHOOK_TOKEN"
```

Trigger with payload:

```bash
curl -X POST http://localhost:8080/api/v1/webhooks/my-dag \
  -H "Authorization: Bearer $WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payload":{"branch":"main","commit":"abc123"}}'
```

Response:

```json
{
  "dagRunId": "0196808c-04ff-73bb-a63e-83791b321ac0",
  "dagName": "my-dag"
}
```

## Select a Runtime Profile

Webhook callers can select a [runtime profile](/writing-workflows/runtime-profiles) only when an admin has added that profile to the webhook's allowlist. Without an allowlist, the `X-Dagu-Profile` header is rejected.

In the Web UI, open the DAG's **Webhook** tab, find **Runtime profile selection**, select the active profiles callers may use, and save the policy. Non-admin users can view the policy, but only admins can change it.

The same policy can be replaced through the API:

```bash
curl -X PUT http://localhost:8080/api/v1/dags/my-dag/webhook/profile-selection \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"allowedProfiles":["staging","prod"]}'
```

`allowedProfiles` is required. Every listed profile must exist and be active when the policy is saved. Send an explicit empty list to disable caller selection:

```json
{
  "allowedProfiles": []
}
```

Once a profile is allowed, select it on a trigger request:

```bash
curl -X POST http://localhost:8080/api/v1/webhooks/my-dag \
  -H "Authorization: Bearer $WEBHOOK_TOKEN" \
  -H "X-Dagu-Profile: staging" \
  -H "Content-Type: application/json" \
  -d '{"payload":{"branch":"main"}}'
```

Dagu verifies the allowlist and confirms that the selected profile still exists and is active before starting the run. If `X-Dagu-Profile` is omitted, the run uses the DAG's normal default-profile resolution. Policy changes take effect on subsequent trigger requests without restarting the server.

Treat the webhook credential as permission to use every profile in its allowlist, including protected profiles. Keep each allowlist as narrow as possible and rotate the credential if it is exposed.

When managing or triggering a webhook through a remote node, include the same `remoteNode` query parameter on the management and trigger URLs.

### Sign Requests That Select a Profile

For webhooks with HMAC enabled, the signature input depends on whether the request selects a profile:

- Without `X-Dagu-Profile`, sign the exact raw request body.
- With `X-Dagu-Profile`, sign `x-dagu-profile:<profile>\n<raw-request-body>`.

The prefix uses the lowercase literal `x-dagu-profile`, followed by a colon, the selected profile, one newline byte, and the exact raw body. Send the lowercase hexadecimal digest as `X-Dagu-Signature: sha256=<hex>`.

```bash
body='{"payload":{"branch":"main"}}'
profile='staging'
signature_input=$(printf 'x-dagu-profile:%s\n%s' "$profile" "$body")
signature=$(printf '%s' "$signature_input" | \
  openssl dgst -sha256 -hmac "$DAGU_HMAC_SECRET" -hex | sed 's/^.* //')

curl -X POST http://localhost:8080/api/v1/webhooks/my-dag \
  -H "Authorization: Bearer $WEBHOOK_TOKEN" \
  -H "X-Dagu-Profile: $profile" \
  -H "X-Dagu-Signature: sha256=$signature" \
  -H "Content-Type: application/json" \
  -d "$body"
```

Changing either the selected profile or the body invalidates the signature. The Web UI's **Generate HMAC** examples automatically use an active profile from the webhook policy; if none is active, they omit the profile header.

### Payload Handling

Dagu injects `WEBHOOK_PAYLOAD` for webhook-triggered runs.

`WEBHOOK_PAYLOAD` is always a JSON string:

- If the request body contains a top-level `payload` field, Dagu serializes that field into `WEBHOOK_PAYLOAD`
- Otherwise, if the raw request body is valid JSON, Dagu serializes the entire raw body into `WEBHOOK_PAYLOAD`
- If no JSON body is available, `WEBHOOK_PAYLOAD` is `{}`

Webhook request bodies are limited to `1048576` bytes by default. Self-hosted operators can change this in `config.yaml`:

```yaml
webhooks:
  max_payload_size: 2097152
```

Or with `DAGU_WEBHOOKS_MAX_PAYLOAD_SIZE`. Very large payloads may still exceed operating-system limits because Dagu exposes the payload to steps as environment data.

If you want to set `dagRunId` without mixing it into `WEBHOOK_PAYLOAD`, use the wrapper form:

```json
{
  "dagRunId": "deploy-abc123",
  "payload": {
    "branch": "main",
    "commit": "abc123"
  }
}
```

Example DAG step that reads the payload:

```yaml
tools:
  - jqlang/jq@jq-1.7.1

steps:
  - id: inspect_webhook
    run: |
      echo "$WEBHOOK_PAYLOAD" | jq .
      echo "$WEBHOOK_PAYLOAD" | jq -r '.branch'
```

## Other Management Operations

List all webhooks:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/webhooks
```

Get the webhook for one DAG:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/dags/my-dag/webhook
```

Rotate the webhook token:

```bash
curl -X POST http://localhost:8080/api/v1/dags/my-dag/webhook/regenerate \
  -H "Authorization: Bearer $TOKEN"
```

Enable or disable the webhook:

```bash
curl -X POST http://localhost:8080/api/v1/dags/my-dag/webhook/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled":false}'
```

Replace the profiles callers may select (admin only):

```bash
curl -X PUT http://localhost:8080/api/v1/dags/my-dag/webhook/profile-selection \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"allowedProfiles":["staging"]}'
```

Delete the webhook:

```bash
curl -X DELETE http://localhost:8080/api/v1/dags/my-dag/webhook \
  -H "Authorization: Bearer $TOKEN"
```

## Common Trigger Responses

- `200 OK`: DAG run was enqueued
- `400 Bad Request`: invalid `X-Dagu-Profile` header, invalid request body, or the selected profile is disabled
- `401 Unauthorized`: missing or invalid webhook token, or missing or invalid HMAC signature when strict HMAC enforcement is active
- `403 Forbidden`: webhook is disabled, or the selected profile is not in the webhook allowlist
- `404 Not Found`: no webhook is configured for the DAG, the DAG or selected profile was not found, or webhook triggering is not configured on the server
- `409 Conflict`: the supplied `dagRunId` already exists
- `413 Payload Too Large`: request body exceeded `webhooks.max_payload_size`
