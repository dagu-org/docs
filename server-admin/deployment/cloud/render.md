---
description: Run Dagu from its Docker image on Render.
---

# Render

Render requires a paid Web Service because Dagu needs a Persistent Disk.

## Deploy

1. Select **New > Web Service > Existing Image**.
2. Enter `ghcr.io/dagucloud/dagu:latest`.
3. Select a paid instance type.
4. Add a Persistent Disk mounted at `/var/lib/dagu`.
5. Add these variables:

```dotenv
PORT=8080
DAGU_AUTH_MODE=builtin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD=<strong-password>
PUID=0
PGID=0
```

6. Create the service.

Open its `onrender.com` HTTPS URL and sign in as `admin`. After the account exists, remove the two `DAGU_AUTH_BUILTIN_INITIAL_ADMIN_*` variables. The disk limits the service to one instance, which matches Dagu's file-backed storage model.

See Render's [prebuilt image](https://render.com/docs/deploying-an-image) and [Persistent Disk](https://render.com/docs/disks) documentation.
