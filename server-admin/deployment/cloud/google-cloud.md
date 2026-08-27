---
description: Run Dagu on Google Compute Engine without an SSH setup step.
---

# Google Cloud

This setup uses a Compute Engine startup script and Tailscale Serve. The normal setup needs no inbound port or SSH session.

## Deploy

1. Complete the shared [private HTTPS setup](./tailscale-vm).
2. Open **Compute Engine > VM instances > Create instance**.
3. Under **OS and storage**, select an Ubuntu LTS boot disk and set its **Deletion rule** to **Keep disk**.
4. Use a VPC with no SSH ingress rule. If you use the default VPC, delete or restrict `default-allow-ssh`. Give the VM outbound access with an external IPv4 address or Cloud NAT. Keep **Allow HTTP traffic** and **Allow HTTPS traffic** cleared.
5. Under **Advanced > Automation**, paste this startup script after replacing both placeholders:

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

6. Create the VM.
7. Open the exact HTTPS name on Tailscale's **Machines** page and create the first administrator.
8. Edit the VM, clear the startup script under **Advanced > Automation**, and save. The spent auth key does not need to remain in metadata.

`docker.io` is Ubuntu's Docker package and keeps this bootstrap short. The named Docker Volume is stored on the boot disk. Snapshot it before deleting that disk. The script does not upgrade an existing container; pin and update a [versioned image](../docker-images) separately for production.

If the VM does not appear in Tailscale, view **Serial port 1** output in the Google Cloud console and find `google_metadata_script_runner`. Revoke an unused auth key before retrying.

See Google Cloud's [startup script](https://cloud.google.com/compute/docs/instances/startup-scripts/linux) and Tailscale's [Serve](https://tailscale.com/docs/reference/tailscale-cli/serve) documentation.
