---
description: Choose the shortest persistent Dagu deployment for a major cloud platform.
---

# Cloud Deployment

Choose a platform. Each guide creates one persistent Dagu server with authentication and HTTPS.

| Platform | Best for | Setup |
| --- | --- | --- |
| [exe.dev](./exe-dev) | Fastest VM setup | One command; HTTPS included |
| [Railway](./railway) | Fastest dashboard setup | Container image and Volume |
| [Render](./render) | Managed container | Web Service and Persistent Disk |
| [Fly.io](./fly-io) | Managed VM close to users | `flyctl` and Fly Volume |
| [Google Cloud](./google-cloud) | Existing GCP users | Startup script and Tailscale |
| [AWS](./aws) | Existing AWS users | Launch script and Tailscale |
| [Azure](./azure) | Existing Azure users | Custom data and Tailscale |
| [DigitalOcean](./digitalocean) | Simple VPS | User data and Tailscale |

All guides use:

- `ghcr.io/dagucloud/dagu:latest`
- one running server instance
- persistent storage at `/var/lib/dagu`
- builtin authentication
- platform HTTPS or private HTTPS through Tailscale Serve

Pin a [versioned image](../docker-images) for production. Do not scale the server beyond one instance because its state is file-backed.

The VM guides use Tailscale for HTTPS and require a Tailscale account. Managed container platforms and exe.dev provide HTTPS directly.
