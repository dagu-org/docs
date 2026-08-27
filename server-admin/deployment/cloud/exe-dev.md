---
description: Run Dagu on exe.dev with its automatic HTTPS proxy.
---

# exe.dev

exe.dev automatically proxies the exposed Dagu port to a generated `https://<vm-name>.exe.xyz` URL. It is not a fixed Dagu URL. No domain, certificate, or proxy configuration is needed.

## Deploy

```bash
ssh exe.dev new \
  --image=ghcr.io/dagucloud/dagu:latest \
  --env DAGU_AUTH_MODE=builtin
```

`ssh exe.dev new` is the exe.dev management command; it does not start an interactive setup session. Open the URL printed by the command and create the first administrator. The VM disk persists Dagu's `/var/lib/dagu` data.

The endpoint is private to users with VM access by default. Only after creating the administrator, make it public if needed:

```bash
ssh exe.dev share set-public <vm-name>
```

Use a [versioned Dagu image](../docker-images) for production.

See the exe.dev [`new`](https://exe.dev/docs/cli-new), [persistent disk](https://exe.dev/docs/serverful), and [HTTPS proxy](https://exe.dev/docs/proxy) documentation.
