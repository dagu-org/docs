---
description: Run Dagu from its Docker image on Render.
---

# Render

Render requires a paid Web Service because Dagu needs a Persistent Disk.

## Deploy

1. Select **+ New > Web Service**.
2. Under **Source Code**, select **Existing Image**.
3. Enter `ghcr.io/dagucloud/dagu:latest` and select **Connect**.
4. Select a paid instance type.
5. Under **Advanced**, add a `1 GB` Persistent Disk mounted at `/var/lib/dagu`.
6. Add these variables:

```dotenv
PORT=8080
DAGU_AUTH_MODE=builtin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD=<strong-password>
PUID=0
PGID=0
```

7. Create the service.

Open its `onrender.com` HTTPS URL and sign in as `admin`. Remove the two `DAGU_AUTH_BUILTIN_INITIAL_ADMIN_*` variables, then deploy the change.

This direct-image setup runs Dagu and its workflows as root so the mounted disk is writable. Use a custom image that fixes the disk ownership to run as UID `1000`.

The disk limits the service to one instance and disables zero-downtime deploys. Render creates daily disk snapshots. Render does not redeploy an image-backed service when a mutable tag changes; use **Manual Deploy > Deploy latest reference**. Use a [versioned Dagu image](../docker-images) for production.

See Render's [prebuilt image](https://render.com/docs/deploying-an-image) and [Persistent Disk](https://render.com/docs/disks) documentation.
