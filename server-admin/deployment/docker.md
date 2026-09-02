# Docker

See [Docker Images](./docker-images.md) to choose between the standard, alpine, and dev tags.

## Local Evaluation

This example is for local evaluation on a machine you control. It is intentionally minimal and should not be treated as an internet-facing production deployment.

```bash
docker run -d \
  --name dagu \
  -p 8525:8080 \
  -v dagu-data:/var/lib/dagu \
  ghcr.io/dagucloud/dagu:latest
```

## Production-Minded Example

For a self-hosted production deployment, keep authentication enabled, expose the port only to a trusted reverse proxy or private network, and persist Dagu state:

```bash
docker run -d \
  --name dagu \
  -p 127.0.0.1:8080:8080 \
  -v dagu-data:/var/lib/dagu \
  -e DAGU_HOST=0.0.0.0 \
  -e DAGU_AUTH_MODE=builtin \
  -e DAGU_SERVER_METRICS=private \
  -e DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin \
  -e DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD='replace-with-a-strong-password' \
  ghcr.io/dagucloud/dagu:latest
```

Recommended follow-up controls:

- Terminate TLS at Dagu itself or at a trusted reverse proxy
- Keep `terminal.enabled` disabled unless the instance is tightly controlled
- Prefer API keys over shared basic-auth credentials for automation
- Restrict who can edit DAGs if the instance is meant to execute reviewed workflows only

## With Custom DAGs Directory

```bash
docker run -d \
  --name dagu \
  -p 8525:8080 \
  -v ./dags:/var/lib/dagu/dags \
  -v dagu-data:/var/lib/dagu \
  -e DAGU_HOST=0.0.0.0 \
  -e DAGU_PORT=8080 \
  ghcr.io/dagucloud/dagu:latest
```

## Run Container Steps

```bash
docker run -d \
  --name dagu \
  -p 8525:8080 \
  -v dagu-data:/var/lib/dagu \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --user 0:0 \
  --entrypoint /usr/local/bin/tini \
  ghcr.io/dagucloud/dagu:latest \
  -g -- dagu start-all
```

The entrypoint override keeps Tini as PID 1 while running Dagu as root. Mounting
`/var/run/docker.sock` gives workflows control of the host Docker daemon. Use
this only for trusted workflows on an authenticated server. See the
[container-step setup](/getting-started/installation/docker#run-container-steps-when-dagu-runs-in-docker)
for the execution model and remote-daemon alternative.

## Environment Variables

```bash
docker run -d \
  --name dagu \
  -p 8525:8080 \
  -v dagu-data:/var/lib/dagu \
  -e DAGU_HOST=0.0.0.0 \
  -e DAGU_PORT=8080 \
  -e DAGU_TZ=America/New_York \
  -e DAGU_AUTH_MODE=builtin \
  -e DAGU_AUTH_BUILTIN_INITIAL_ADMIN_USERNAME=admin \
  -e DAGU_AUTH_BUILTIN_INITIAL_ADMIN_PASSWORD=replace-with-a-strong-password \
  ghcr.io/dagucloud/dagu:latest
```

## Container Management

```bash
# View logs
docker logs -f dagu

# Stop container
docker stop dagu

# Start container
docker start dagu

# Remove container
docker rm -f dagu
```

## Access

Open `http://localhost:8525` in your browser, or use whichever host port you mapped with `-p`.
