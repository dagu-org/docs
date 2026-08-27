---
description: Run Dagu on exe.dev with its automatic HTTPS proxy.
---

# exe.dev

exe.dev automatically proxies the exposed Dagu port to `https://<vm>.exe.xyz`. No domain, certificate, or proxy configuration is needed.

## Deploy

```bash
ssh exe.dev new \
  --name=dagu \
  --image=ghcr.io/dagucloud/dagu:latest \
  --env DAGU_AUTH_MODE=builtin
```

Open `https://dagu.exe.xyz` and create the first administrator. The VM disk persists Dagu's `/var/lib/dagu` data.

The HTTPS endpoint is private to users with VM access by default. To make it public while keeping Dagu authentication enabled:

```bash
ssh exe.dev share set-public dagu
```

See the exe.dev [`new`](https://exe.dev/docs/cli-new), [persistent disk](https://exe.dev/docs/serverful), and [HTTPS proxy](https://exe.dev/docs/proxy) documentation.
