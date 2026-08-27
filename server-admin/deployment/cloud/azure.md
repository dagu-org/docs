---
description: Run Dagu on an Azure VM without an SSH setup step.
---

# Azure

This setup uses Azure VM custom data and Tailscale Serve. The normal setup needs no inbound port or SSH session.

## Deploy

1. Complete the shared [private HTTPS setup](./tailscale-vm).
2. Open **Virtual machines > Create > Azure virtual machine**.
3. Select an Ubuntu LTS image and set **Public inbound ports** to `None`.
4. Choose one outbound path: attach a Standard public IP to the VM, or select **Public IP: None** after associating a NAT Gateway with its subnet.
5. Under **Disks**, clear **Delete with VM** for the OS disk.
6. Under **Advanced > Custom data and cloud-init**, paste this script after replacing both placeholders:

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

7. Create the VM.
8. Open the exact HTTPS name on Tailscale's **Machines** page and create the first administrator.

`docker.io` is Ubuntu's Docker package and keeps this bootstrap short. The named Docker Volume is stored on the OS disk. Snapshot it before deletion. The script does not upgrade an existing container; pin and update a [versioned image](../docker-images) separately for production.

If setup fails, use **Operations > Run command** or **Help > Boot diagnostics** to inspect cloud-init. Revoke an unused auth key before retrying.

See Azure's [custom data and cloud-init](https://learn.microsoft.com/azure/virtual-machines/custom-data), [explicit outbound access](https://learn.microsoft.com/azure/virtual-network/ip-services/default-outbound-access), and Tailscale [Serve](https://tailscale.com/docs/reference/tailscale-cli/serve) documentation.
