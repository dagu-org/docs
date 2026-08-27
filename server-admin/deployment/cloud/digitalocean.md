---
description: Run Dagu on a DigitalOcean Droplet without an SSH setup step.
---

# DigitalOcean

This setup uses Droplet user data and Tailscale Serve. It creates a private HTTPS URL available to your tailnet, with no inbound firewall rule or SSH session.

## Deploy

1. Enable Tailscale [MagicDNS and HTTPS](https://tailscale.com/docs/how-to/set-up-https-certificates), then create a one-off auth key.
2. Select **Create > Droplets** and choose Ubuntu LTS.
3. Under **Advanced Options**, enable **Add Initialization scripts** and paste:

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

4. Create the Droplet.
5. From a device in the tailnet, open `https://dagu.<tailnet>.ts.net` and create the first administrator. If that hostname was already taken, use the name shown on Tailscale's **Machines** page.

See DigitalOcean's [Droplet user data](https://docs.digitalocean.com/products/droplets/how-to/provide-user-data/) and Tailscale [Serve](https://tailscale.com/docs/reference/tailscale-cli/serve) documentation.
