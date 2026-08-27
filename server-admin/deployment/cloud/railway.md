---
description: Run Dagu from its Docker image on Railway.
---

# Railway

## Deploy

1. Create a project and select **New > Docker Image**.
2. Enter `ghcr.io/dagucloud/dagu:latest`.
3. Add a Volume mounted at `/var/lib/dagu`.
4. Add these variables:

```dotenv
DAGU_AUTH_MODE=builtin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin
DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD=<strong-password>
PUID=0
PGID=0
RAILWAY_RUN_UID=0
```

5. Keep **Serverless** disabled and replicas at `1`.
6. Under **Networking**, generate a public domain for port `8080`.

Open the generated HTTPS URL and sign in as `admin`. After the account exists, remove the two `DAGU_AUTH_BUILTIN_INITIAL_ADMIN_*` variables.

See Railway's [Docker image](https://docs.railway.com/services#deploying-a-public-docker-image), [Volume](https://docs.railway.com/volumes), and [public networking](https://docs.railway.com/networking/public-networking) documentation.
