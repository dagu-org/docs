---
description: Run one persistent Dagu Machine on Fly.io.
---

# Fly.io

## Deploy

Install `flyctl`, sign in, and create the app without deploying it:

```bash
mkdir dagu-fly
cd dagu-fly
fly launch --image ghcr.io/dagucloud/dagu:latest --ha=false --no-deploy
```

Replace `fly.toml` with the following, keeping the generated app name and region:

```toml
app = "<app-name>"
primary_region = "<region>"
kill_signal = "SIGTERM"
kill_timeout = 60

[build]
  image = "ghcr.io/dagucloud/dagu:latest"

[env]
  DAGU_AUTH_MODE = "builtin"
  DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME = "admin"
  PUID = "0"
  PGID = "0"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "off"

[[mounts]]
  source = "dagu_data"
  destination = "/var/lib/dagu"
  initial_size = "1GB"
```

Set the password and deploy one Machine. Fly creates the Volume from the mount configuration:

```bash
fly secrets set DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD='<strong-password>' --stage
fly deploy --ha=false
```

Open `https://<app-name>.fly.dev` and sign in as `admin`.

Remove the bootstrap username from `[env]`, then stage removal of the password and deploy both changes together:

```bash
fly secrets unset DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD --stage
fly deploy --ha=false
```

This direct-image setup runs Dagu and its workflows as root so the Fly Volume is writable. Use a custom image that fixes the Volume ownership to run as UID `1000`.

This is one Machine with one local Volume, not a highly available deployment. Do not clone or scale it without replicating Dagu's file-backed state. Before production, configure and test external backups for `/var/lib/dagu`; Fly snapshots are not a primary backup. Use the same [versioned Dagu image](../docker-images) in `fly launch` and `[build]` for production.

See Fly.io's [configuration](https://fly.io/docs/reference/configuration/), [secrets](https://fly.io/docs/apps/secrets/), and [Volume](https://fly.io/docs/volumes/overview/) documentation.
