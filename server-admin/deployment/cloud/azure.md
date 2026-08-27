---
description: Run Dagu on an Azure VM without an SSH setup step.
---

# Azure

This setup uses Azure VM custom data and Tailscale Serve. It creates a private HTTPS URL available to your tailnet, with no inbound firewall rule or SSH session.

## Deploy

1. Enable Tailscale [MagicDNS and HTTPS](https://tailscale.com/docs/how-to/set-up-https-certificates), then create a one-off auth key.
2. Open **Virtual machines > Create > Azure virtual machine**.
3. Select an Ubuntu LTS image and set **Public inbound ports** to `None`.
4. Under **Advanced > Custom data and cloud-init**, paste:

```bash
#!/bin/bash
set -eu
apt-get update
apt-get install -y curl docker.io
systemctl enable --now docker
command -v tailscale >/dev/null || curl -fsSL https://tailscale.com/install.sh | sh
tailscale status >/dev/null 2>&1 || \
  tailscale up --auth-key='<one-off-auth-key>' --hostname=dagu
if ! docker container inspect dagu >/dev/null 2>&1; then
  docker run -d \
    --name dagu \
    --restart unless-stopped \
    -p 127.0.0.1:8080:8080 \
    -e DAGU_AUTH_MODE=builtin \
    -v dagu-data:/var/lib/dagu \
    ghcr.io/dagucloud/dagu:latest
else
  docker start dagu
fi
tailscale serve --bg --yes 8080
```

5. Create the VM.
6. From a device in the tailnet, open `https://dagu.<tailnet>.ts.net` and create the first administrator. If that hostname was already taken, use the name shown on Tailscale's **Machines** page.

See Azure's [custom data and cloud-init](https://learn.microsoft.com/azure/virtual-machines/custom-data) and Tailscale [Serve](https://tailscale.com/docs/reference/tailscale-cli/serve) documentation.
