---
description: Deploy one persistent Dagu server from the official Docker image on major cloud VM and container platforms.
---

# Cloud Deployment

Run one persistent, always-on Dagu server from the official Docker image. This guide covers the shortest public HTTPS path on eight cloud platforms.

## Choose a Platform

| Platform | Compute | Persistent storage | Public HTTPS | Docker executor |
| --- | --- | --- | --- | --- |
| [exe.dev](#exe-dev) | VM | VM disk and Docker volume | Included HTTPS proxy | Supported with host Docker access |
| [Google Cloud](#google-cloud) | Compute Engine VM | Persistent Disk and Docker volume | Dagu Tailscale Funnel | Supported with host Docker access |
| [AWS](#aws) | Lightsail VM | Instance disk and Docker volume | Dagu Tailscale Funnel | Supported with host Docker access |
| [Azure](#azure) | Azure VM | Managed Disk and Docker volume | Dagu Tailscale Funnel | Supported with host Docker access |
| [DigitalOcean](#digitalocean) | Docker Droplet | Droplet disk and Docker volume | Dagu Tailscale Funnel | Supported with host Docker access |
| [Railway](#railway) | Managed container | Railway Volume | Included domain | Not supported |
| [Render](#render) | Managed container | Persistent Disk | Included domain | Not supported |
| [Fly.io](#flyio) | Fly Machine | Fly Volume | Included domain | Not supported |

Use a VM when workflows need the host Docker daemon, private networks, or host-installed tools. Use a managed container platform when the workflows can run entirely inside the Dagu image.

::: warning Required deployment settings
- Keep exactly one Dagu server replica.
- Persist `/var/lib/dagu`.
- Keep the service running so schedules and queues continue to work.
- Configure the initial administrator before publishing the service.
- Do not mount a Docker socket unless workflows require Docker execution.
:::

The examples use `ghcr.io/dagucloud/dagu:latest` for initial setup. Pin a [version tag](./docker-images) before production use.

## Prepare VM Authentication

Run this on the VM before starting Dagu. It writes the initial administrator credentials to an owner-readable environment file without putting the password in shell history.

```bash
read -rsp "Dagu admin password: " DAGU_ADMIN_PASSWORD
printf '\n'
umask 077
{
  printf 'DAGU_AUTH_MODE=builtin\n'
  printf 'DAGU_SERVER_METRICS=private\n'
  printf 'DAGU_AUTH_TOKEN_SECRET=%s\n' "$(openssl rand -hex 32)"
  printf 'DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin\n'
  printf 'DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD=%s\n' "$DAGU_ADMIN_PASSWORD"
} > dagu.env
unset DAGU_ADMIN_PASSWORD
```

The password must contain at least eight characters. Dagu only uses the initial administrator variables while the user store is empty.

## exe.dev

[exe.dev](https://exe.dev/) provides a persistent VM, Docker, and an HTTPS proxy. The proxy is private until explicitly made public.

Create and connect to a VM:

```bash
ssh exe.dev new --name=dagu
ssh dagu.exe.xyz
```

Create `dagu.env` with [Prepare VM Authentication](#prepare-vm-authentication), then start Dagu:

```bash
docker run -d \
  --name dagu \
  --restart unless-stopped \
  --env-file ./dagu.env \
  -p 8080:8080 \
  -v dagu-data:/var/lib/dagu \
  ghcr.io/dagucloud/dagu:latest
```

Configure the proxy and make it public from the local machine:

```bash
ssh exe.dev share port dagu 8080
ssh exe.dev share set-public dagu
```

Open `https://dagu.exe.xyz`. Replace `dagu` when a different VM name was used.

View logs:

```bash
ssh dagu.exe.xyz docker logs -f dagu
```

Delete the deployment when it is no longer needed:

```bash
ssh exe.dev rm dagu
```

See the exe.dev [Docker](https://exe.dev/docs/faq/docker) and [HTTPS proxy](https://exe.dev/docs/proxy) documentation.

## Cloud VMs

Google Cloud, AWS, Azure, and DigitalOcean use the same Dagu container. Create one Ubuntu VM, connect to it, and follow [Run Dagu on the VM](#run-dagu-on-the-vm).

### Google Cloud

1. Open **Compute Engine > VM instances > Create instance**.
2. Select an Ubuntu LTS boot disk.
3. Keep SSH enabled. Do not open ports `80`, `443`, or `8080`; Tailscale Funnel provides HTTPS.
4. Create the VM and use the **SSH** button to connect.

See the [Compute Engine instance guide](https://cloud.google.com/compute/docs/instances/create-start-instance).

### AWS

1. Open **Lightsail > Create instance**.
2. Select **Linux/Unix**, **OS Only**, and Ubuntu.
3. Choose an instance plan and create the instance.
4. Open the browser-based SSH client.

Only SSH needs to be open in the Lightsail firewall. See the [Lightsail instance guide](https://docs.aws.amazon.com/lightsail/latest/userguide/getting-started-with-amazon-lightsail.html).

### Azure

1. Open **Virtual machines > Create > Azure virtual machine**.
2. Select an Ubuntu LTS image and SSH public-key authentication.
3. Allow inbound SSH only.
4. Create the VM and connect with the SSH command shown by Azure.

See the [Azure Linux VM guide](https://learn.microsoft.com/azure/virtual-machines/linux/quick-create-portal).

### DigitalOcean

1. Open the [Docker 1-Click App](https://marketplace.digitalocean.com/apps/docker).
2. Create one Droplet with SSH-key authentication.
3. Connect through the Droplet console or `ssh root@<droplet-ip>`.

Docker is already installed. Continue with [Run Dagu on the VM](#run-dagu-on-the-vm).

### Run Dagu on the VM

Install Docker on Google Cloud, AWS, or Azure. Skip this on the DigitalOcean Docker Droplet.

```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl enable --now docker
```

Create `dagu.env` with [Prepare VM Authentication](#prepare-vm-authentication).

Dagu's built-in [Tailscale Funnel](../tunnel#funnel-public-internet) supplies a public HTTPS URL without a firewall rule, domain, certificate, or reverse proxy. Enable Funnel for the tailnet, create a reusable auth key, then add its settings:

```bash
read -rsp "Tailscale auth key: " TAILSCALE_AUTH_KEY
printf '\n'
{
  printf 'DAGU_TUNNEL_ENABLED=true\n'
  printf 'DAGU_TUNNEL_TAILSCALE_AUTH_KEY=%s\n' "$TAILSCALE_AUTH_KEY"
  printf 'DAGU_TUNNEL_TAILSCALE_HOSTNAME=dagu\n'
  printf 'DAGU_TUNNEL_TAILSCALE_FUNNEL=true\n'
} >> dagu.env
unset TAILSCALE_AUTH_KEY
```

Start Dagu:

```bash
sudo docker run -d \
  --name dagu \
  --restart unless-stopped \
  --env-file ./dagu.env \
  -v dagu-data:/var/lib/dagu \
  ghcr.io/dagucloud/dagu:latest
```

Read the assigned URL from the logs:

```bash
sudo docker logs -f dagu
```

Open the displayed `https://dagu.<tailnet>.ts.net` URL. No inbound Dagu port is required.

To remove Dagu while preserving its volume:

```bash
sudo docker rm -f dagu
```

Delete the VM from its cloud console to stop all VM charges. Delete attached disks separately if the provider retains them.

## Railway

Railway runs the public Dagu image as one persistent service.

1. Create a project and select **New > Docker Image**.
2. Enter `ghcr.io/dagucloud/dagu:latest`.
3. Add a Volume mounted at `/var/lib/dagu`.
4. Add these variables before creating a public domain:

```dotenv
DAGU_HOST=0.0.0.0
DAGU_PORT=8080
DAGU_AUTH_MODE=builtin
DAGU_SERVER_METRICS=private
DAGU_AUTH_TOKEN_SECRET=<random-32-byte-value>
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD=<strong-password>
PUID=0
PGID=0
RAILWAY_RUN_UID=0
```

Generate the token secret locally with `openssl rand -hex 32`. The root UID settings allow the Dagu image to write to Railway's root-owned Volume.

5. Keep **Serverless** disabled and the replica count at `1`.
6. Set the health-check path to `/api/v1/health`.
7. Under **Networking**, generate a public domain targeting port `8080`.

Open the generated HTTPS URL. View logs from the service's **Observability** page.

To update, change the image tag or redeploy the current tag. To stop charges, delete both the service and its Volume.

See Railway's [Docker image](https://docs.railway.com/services#deploying-a-public-docker-image), [Volume](https://docs.railway.com/volumes), and [public networking](https://docs.railway.com/guides/public-networking) documentation.

## Render

Render requires a paid service for persistent disk storage.

1. Select **New > Web Service > Existing Image**.
2. Enter `ghcr.io/dagucloud/dagu:latest`.
3. Select a paid instance type.
4. Under **Advanced**, add a Persistent Disk mounted at `/var/lib/dagu`.
5. Add these environment variables before creating the service:

```dotenv
PORT=8080
DAGU_HOST=0.0.0.0
DAGU_PORT=8080
DAGU_AUTH_MODE=builtin
DAGU_SERVER_METRICS=private
DAGU_AUTH_TOKEN_SECRET=<random-32-byte-value>
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD=<strong-password>
PUID=0
PGID=0
```

Generate the token secret locally with `openssl rand -hex 32`. The root UID settings allow the Dagu image to write to the mounted disk.

6. Set the health-check path to `/api/v1/health`.
7. Create the Web Service and open its `onrender.com` HTTPS URL.

Render image-backed services update only when manually redeployed. Use **Manual Deploy > Deploy latest reference**, or change the image to a newer version tag. Delete the service and confirm disk deletion to stop charges.

See Render's [prebuilt image](https://render.com/docs/deploying-an-image), [Persistent Disk](https://render.com/docs/disks), and [health check](https://render.com/docs/health-checks) documentation.

## Fly.io

Fly.io runs Dagu on one Machine with one attached Volume. This configuration accepts downtime during host failures and deployments because Dagu's file-backed state is not replicated.

Install `flyctl`, sign in, and create an empty directory:

```bash
mkdir dagu-fly
cd dagu-fly
fly launch \
  --image ghcr.io/dagucloud/dagu:latest \
  --ha=false \
  --no-deploy
```

Replace the generated `fly.toml` with this configuration, keeping the generated `app` and `primary_region` values:

```toml
app = "<app-name>"
primary_region = "<region>"
kill_signal = "SIGTERM"
kill_timeout = "30s"

[build]
  image = "ghcr.io/dagucloud/dagu:latest"

[env]
  DAGU_HOST = "0.0.0.0"
  DAGU_PORT = "8080"
  DAGU_AUTH_MODE = "builtin"
  DAGU_SERVER_METRICS = "private"
  DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME = "admin"
  PUID = "0"
  PGID = "0"

[deploy]
  strategy = "rolling"
  max_unavailable = 1

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "off"
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/api/v1/health"
    timeout = "5s"

[[mounts]]
  source = "dagu_data"
  destination = "/var/lib/dagu"
  initial_size = "1gb"
```

Set the secrets before the first deployment:

```bash
read -rsp "Dagu admin password: " DAGU_ADMIN_PASSWORD
printf '\n'
fly secrets set \
  DAGU_AUTH_TOKEN_SECRET="$(openssl rand -hex 32)" \
  DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD="$DAGU_ADMIN_PASSWORD"
unset DAGU_ADMIN_PASSWORD
```

Deploy exactly one Machine:

```bash
fly deploy --ha=false
fly status
fly volumes list
```

Open `https://<app-name>.fly.dev`. View logs with `fly logs`.

To update, change the image tag in `fly.toml` and run `fly deploy --ha=false`. To stop charges, delete the app and its Volume:

```bash
fly apps destroy <app-name>
```

See Fly.io's [existing image](https://fly.io/docs/reference/fly-launch/), [Volume](https://fly.io/docs/launch/volume-storage/), and [autostop](https://fly.io/docs/blueprints/long-running-tasks/) documentation.

## Verify the Deployment

Every platform should return a healthy response:

```bash
curl -fsS https://<dagu-url>/api/v1/health
```

Sign in as `admin`, then follow the [Quickstart](/getting-started/quickstart) to create and run the first workflow. Restart or redeploy the service and confirm that the workflow and run history remain available.

## Updates and Backups

Before an update:

1. Stop or drain active runs.
2. Snapshot the VM disk or platform Volume.
3. Replace the image tag.
4. Restart the single Dagu instance.
5. Check `/api/v1/health` and a recent run.

Do not run old and new Dagu versions against the same volume at the same time. Use provider snapshots for recovery and test restoration before relying on them.

For additional controls, see [Docker deployment](./docker), [Builtin authentication](../authentication/builtin), [Operations](../operations), and [Deployment Models](/overview/deployment-models).
