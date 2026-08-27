---
description: Run Dagu from its Docker image on Railway.
---

# Railway

## Deploy

1. Select **New Project > Empty project**.
2. Select **Add a Service > Docker Image**.
3. Enter `ghcr.io/dagucloud/dagu:latest`.
4. Add a Volume mounted at `/var/lib/dagu`.
5. Add these variables:

```dotenv
DAGU_AUTH_MODE=builtin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD=<strong-password>
PUID=0
PGID=0
RAILWAY_RUN_UID=0
```

6. Keep **Serverless** disabled and replicas at `1`.
7. Under **Networking**, generate a public domain for port `8080`.
8. Add `DAGU_PUBLIC_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}` and deploy the staged changes.

Open the generated HTTPS URL and sign in as `admin`. Remove the two `DAGU_AUTH_BUILTIN_INITIAL_ADMIN_*` variables, then deploy the staged change.

Railway mounts Volumes as root, so this direct-image setup runs Dagu and its workflows as root. A non-root setup needs a custom startup init that changes `/var/lib/dagu` ownership before Dagu drops to UID `1000`.

A service can have one Volume and cannot use replicas while it is attached. Deployments can have brief downtime. Configure [Volume backups](https://docs.railway.com/volumes/backups). Use a [versioned Dagu image](../docker-images) for production.

See Railway's [quick start](https://docs.railway.com/quick-start), [Volume](https://docs.railway.com/volumes), and [public networking](https://docs.railway.com/networking/public-networking) documentation.
