---
description: Choose the shortest persistent Dagu deployment for a major cloud platform.
---

# Cloud Deployment

Choose a platform. Each guide creates one persistent Dagu server with builtin authentication and HTTPS.

| Platform | Runtime | Access |
| --- | --- | --- |
| [exe.dev](./exe-dev) | Managed VM | Private platform HTTPS; public access is optional |
| [Google Cloud](./google-cloud) | Compute Engine VM | Private Tailscale HTTPS |
| [AWS](./aws) | Lightsail VM | Private Tailscale HTTPS |
| [Azure](./azure) | Azure VM | Private Tailscale HTTPS |
| [DigitalOcean](./digitalocean) | Droplet | Private Tailscale HTTPS |
| [Railway](./railway) | Container and Volume | Public platform HTTPS |
| [Render](./render) | Web Service and Persistent Disk | Public platform HTTPS |
| [Fly.io](./fly-io) | Machine and Fly Volume | Public platform HTTPS |

All guides use:

- `ghcr.io/dagucloud/dagu:latest`
- one running server instance
- persistent storage at `/var/lib/dagu`
- builtin authentication
- platform HTTPS or private HTTPS through Tailscale Serve

`latest` is convenient for a first deployment. Pin a [versioned image](../docker-images) for production. These guides use one instance because Dagu stores its control-plane state in files.

The Google Cloud, AWS, Azure, and DigitalOcean guides share one [private HTTPS setup](./tailscale-vm). exe.dev, Railway, Render, and Fly.io provide HTTPS directly.
