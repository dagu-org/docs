# Migrating Shared-Filesystem Workers

Current `dagu worker` processes require coordinator addresses and exchange tasks, profiles, Dagu-managed secrets, status, logs, artifacts, and persistent state over gRPC.

This page remains at its old URL for upgrade guidance. For current setup instructions, see [Worker Deployment](./shared-nothing).

## Current Worker Contract

- Set `worker.coordinators` or `DAGU_WORKER_COORDINATORS`.
- Give every coordinator a stable address reachable from workers.
- Keep server data, DAG definitions, profiles, Dagu-managed secrets, logs, and artifacts off worker mounts.
- Use worker-local or ephemeral storage for work directories and caches.
- Declare DAG-local files with [`dependencies`](/writing-workflows/file-dependencies); Dagu transfers them with the task.

Server-side processes may still share persistent storage when deployed separately. The Web UI/API server, scheduler, and coordinator need a consistent view of server-owned state.

## Migration

1. Keep existing worker mounts while upgrading every coordinator to a version that supports coordinator-side profile and managed-secret resolution.
2. Bind the coordinator to a worker-reachable interface and set its advertise address:

   ```bash
   dagu coordinator \
     --coordinator.host=0.0.0.0 \
     --coordinator.advertise=coordinator.internal \
     --coordinator.port=50055
   ```

3. Drain and stop existing workers.
4. Configure each worker with one or more coordinator addresses:

   ```bash
   dagu worker \
     --worker.coordinators=coordinator.internal:50055 \
     --worker.labels=region=us-east-1
   ```

5. Remove server data and DAG-directory mounts from worker containers or pods.
6. Keep coordinator-owned state on persistent storage when it must survive coordinator replacement.
7. Configure [peer TLS or mTLS](/server-admin/distributed/transport-security) when coordinator traffic crosses an untrusted network.

## Docker Compose

Workers on the same Compose network can use the coordinator service name:

```yaml
services:
  dagu-coordinator:
    image: ghcr.io/dagucloud/dagu:latest
    command: ["dagu", "coordinator"]
    environment:
      - DAGU_COORDINATOR_HOST=0.0.0.0
      - DAGU_COORDINATOR_ADVERTISE=dagu-coordinator
      - DAGU_COORDINATOR_PORT=50055

  dagu-worker:
    image: ghcr.io/dagucloud/dagu:latest
    command: ["dagu", "worker"]
    environment:
      - DAGU_WORKER_COORDINATORS=dagu-coordinator:50055
    depends_on:
      - dagu-coordinator
```

No worker volume is required. External workers also require publishing port `50055` and an advertise address they can resolve.
