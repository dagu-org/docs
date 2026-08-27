---
description: Run Dagu on Amazon Lightsail without an SSH setup step.
---

# AWS

This setup uses an Amazon Lightsail launch script and Tailscale Serve. The normal setup needs no inbound Dagu port or SSH session.

## Deploy

1. Complete the shared [private HTTPS setup](./tailscale-vm).
2. Open **Lightsail > Create instance**.
3. Select **Linux/Unix > OS Only > Ubuntu 24.04 LTS**.
4. Scroll down, choose **Add launch script**, and paste this script after replacing both placeholders:

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

5. Create the instance.
6. On its **Networking** tab, remove the default IPv4 and IPv6 rules for SSH port `22` and HTTP port `80`. Tailscale only needs outbound traffic.
7. Open the exact HTTPS name on Tailscale's **Machines** page and create the first administrator.

`docker.io` is Ubuntu's Docker package and keeps this bootstrap short. The named Docker Volume is stored on the instance disk. Take a manual snapshot before deleting the instance; after restoring it, repeat the firewall cleanup. The script does not upgrade an existing container; pin and update a [versioned image](../docker-images) separately for production.

If setup fails before the instance joins Tailscale, revoke the unused auth key and recreate the instance with a corrected launch script.

See the Lightsail [launch script](https://docs.aws.amazon.com/lightsail/latest/userguide/lightsail-how-to-configure-server-additional-data-shell-script.html), [firewall](https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-firewall-and-port-mappings-in-amazon-lightsail.html), and Tailscale [Serve](https://tailscale.com/docs/reference/tailscale-cli/serve) documentation.
