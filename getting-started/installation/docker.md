---
description: Run Dagu with Docker or Docker Compose and persist workflows, history, logs, and settings on a host volume.
---

# Install with Docker

Run Dagu in Docker and keep your workflows, history, logs, and settings on a host volume.

## One-off run

```bash
docker run --rm \
  -p 8080:8080 \
  -v ~/.dagu:/var/lib/dagu \
  ghcr.io/dagucloud/dagu:latest \
  dagu start-all
```

Visit <http://localhost:8080>.

## Detached

```bash
docker run -d \
  --name dagu \
  -p 8080:8080 \
  -v ~/.dagu:/var/lib/dagu \
  ghcr.io/dagucloud/dagu:latest \
  dagu start-all
```

## Docker Compose

```yaml
services:
  dagu:
    image: ghcr.io/dagucloud/dagu:latest
    ports:
      - "8080:8080"
    environment:
      - DAGU_TZ=America/New_York
      - DAGU_PORT=8080        # optional, default 8080
      - PUID=1000             # optional, default 1000
      - PGID=1000             # optional, default 1000
    volumes:
      - dagu:/var/lib/dagu
volumes:
  dagu: {}
```

Start with `docker compose up -d`.

The image defaults `DAGU_HOME` to `/var/lib/dagu`, matching the volume mount. If `DAGU_HOME` is customized, mount the persistent volume at the same path and ensure it is writable by `PUID`/`PGID`.

## Giving DAGs access to the host Docker daemon

Use this layout when workflows run `container:`, `docker.run`, or
containerized `harness.run` steps and should reuse the host's Docker engine:

```yaml
services:
  dagu:
    image: ghcr.io/dagucloud/dagu:latest
    ports:
      - "8080:8080"
    volumes:
      - dagu:/var/lib/dagu
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DAGU_CONTAINER_RUNTIME=docker
    entrypoint: ["/usr/local/bin/tini", "-g", "--"]  # keep Tini as PID 1
    user: "0:0"      # root is needed for socket access
volumes:
  dagu: {}
```

This example bypasses `/entrypoint.sh` so Dagu can run as root for Docker socket access, but it keeps Tini as PID 1. Do not change it to `entrypoint: []`; that removes process reaping.

::: warning Security
Mounting `/var/run/docker.sock` grants the container full control of the host Docker daemon. Only do this on trusted hosts and behind authentication.
:::

For AI and coding-agent CLI sandboxes, see
[Harness Sandboxed Execution](/step-types/harness/sandbox/).

## Image tags

| Tag | Contents |
|---|---|
| `latest` | Latest stable release |
| `<version>` | Specific release, such as `2.11.1` |
| `alpine`, `<version>-alpine` | Alpine-based runtime image |
| `dev`, `<version>-dev` | Development image with compilers, SDKs, and common CLI tools |

Full list: [Docker Images](/server-admin/deployment/docker-images).

## Running one-off DAG commands

```bash
# Validate
docker run --rm -v ~/.dagu:/var/lib/dagu ghcr.io/dagucloud/dagu:latest \
  dagu validate hello

# Start
docker run --rm -v ~/.dagu:/var/lib/dagu ghcr.io/dagucloud/dagu:latest \
  dagu start hello

# History
docker run --rm -v ~/.dagu:/var/lib/dagu ghcr.io/dagucloud/dagu:latest \
  dagu history hello
```

## Verify

```bash
docker exec dagu dagu version
```

Next: [Quickstart](/getting-started/quickstart).
