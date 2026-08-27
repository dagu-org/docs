---
description: Run Dagu on a DigitalOcean Droplet without an SSH setup step.
---

# DigitalOcean

This setup uses Droplet user data and Tailscale Serve. The normal setup needs no inbound port or SSH session.

## Deploy

1. Complete the shared [private HTTPS setup](./tailscale-vm).
2. Select **Create > Droplets** and choose Ubuntu LTS.
3. Above **Finalize Details**, expand **Additional Options**, enable **Startup scripts**, and paste this script after replacing both placeholders:

```bash
#!/bin/bash
set -eu
apt-get update
apt-get install -y curl docker.io
systemctl enable --now docker
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
curl --retry 30 --retry-delay 2 --retry-connrefused -fsS \
  http://127.0.0.1:8080/api/v1/health >/dev/null
command -v tailscale >/dev/null || curl -fsSL https://tailscale.com/install.sh | sh
tailscale status >/dev/null 2>&1 || \
  tailscale up --auth-key='<one-off-auth-key>' --hostname='<dagu-hostname>'
tailscale serve --bg --yes 8080
```

4. Attach a Cloud Firewall with no inbound rules and outbound TCP and UDP allowed.
5. Create the Droplet.
6. Open the exact HTTPS name on Tailscale's **Machines** page and create the first administrator.

`docker.io` is Ubuntu's Docker package and keeps this bootstrap short. The named Docker Volume is stored on the Droplet disk. Power off and snapshot the Droplet before deleting it; attaching a DigitalOcean Volume later does not move Docker's data. The script does not upgrade an existing container; pin and update a [versioned image](../docker-images) separately for production.

User data runs only on the first boot and cannot be edited later. If setup fails, use the Recovery Console to inspect `/var/log/cloud-init-output.log`. Revoke an unused auth key before rebuilding.

See DigitalOcean's [Droplet user data](https://docs.digitalocean.com/products/droplets/how-to/provide-user-data/) and Tailscale [Serve](https://tailscale.com/docs/reference/tailscale-cli/serve) documentation.
