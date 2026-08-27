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
fly secrets set DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD='<strong-password>'
fly deploy --ha=false
```

Open `https://<app-name>.fly.dev` and sign in as `admin`.

See Fly.io's [existing image](https://fly.io/docs/reference/fly-launch/) and [Volume](https://fly.io/docs/launch/volume-storage/) documentation.
