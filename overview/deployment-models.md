# Deployment Models

Dagu runs on one machine, on temporary workers your platform creates for each run, or on workers you keep running. All three are self-hosted, and the same workflow YAML runs on any of them.

## Terms

| Term | Meaning |
|------|---------|
| **Dagu server** | The Web UI, REST API, scheduler, queues, run history, logs, and coordinator service when distributed execution is enabled. If the coordinator runs as a separate process, it must be configured to use the same shared Dagu data as the other server components. |
| **Worker** | A `dagu worker` process that connects to a coordinator and executes dispatched DAG runs. Selectable by labels. |
| **Temporary worker** | Compute your platform provisions for a single run. It invokes `dagu start` rather than running `dagu worker`, and is destroyed when the run ends. |
| **Execution** | The place where workflow steps actually run: the Dagu server itself, a worker you operate, or a temporary worker that your platform provisions for one run on a machine sharing the same volume. |

## Common Topologies

Each topology below uses its own diagram so the labels stay readable in the docs.

### Single server

<img src="/deployment-models/local.gif" alt="Local single-server Dagu deployment with the Web UI, API, scheduler, executor, and persistent volume on one host." style="width: 100%; border-radius: 8px; border: 1px solid var(--vp-c-divider); margin: 16px 0 24px;" />

Use this model when one machine is enough. `dagu start-all` runs the Web UI, scheduler, and execution engine in one process. History and logs stay on the same machine by default.

### Temporary workers

<img src="/deployment-models/shared-volume.gif" alt="Deployment model where a launcher provisions a temporary worker for each run, the worker runs the Dagu binary and writes state to a shared volume before being destroyed, and an always-on Dagu server reads that state." style="width: 100%; border-radius: 8px; border: 1px solid var(--vp-c-divider); margin: 16px 0 24px;" />

Use this model when each run should get its own compute, provisioned on demand and destroyed once the run finishes. Your platform starts a container or job that runs the binary and exits:

```bash
dagu start etl.yaml
dagu retry --run-id="$RUN_ID" etl
```

The worker and the Dagu server share one volume and nothing else. There is no coordinator, no gRPC, and no network path between them. Status, history, and logs reach the Web UI because both read and write the same files.

Anything that can start a container against the volume can drive it:

- Cloud Run Jobs, AWS Batch, or Azure Container Apps Jobs
- Kubernetes Jobs and CronJobs with the volume attached
- Nomad batch jobs or Slurm
- a CI job on GitHub Actions, GitLab CI, or Jenkins
- cron or a systemd timer on a host that already mounts the volume

Because a worker exists only while its run is in flight, execution capacity falls to zero between jobs and scales out by starting more of them. Distributed workers hold a daemon on every execution host; here a worker lives no longer than the run it was created for.

**Concurrency.** Each dag-run owns a directory, and Dagu locks it by creating a directory, an operation that is atomic on POSIX filesystems and over NFS. Two processes therefore cannot operate on the same dag-run. Separate runs never contend, because each has its own ID and its own directory. Pass `--run-id` when the launcher already has a stable identifier, so a restarted Kubernetes Job or a rerun CI build resumes its run instead of creating a duplicate.

**Scheduling.** The `schedule:` field and queues are handled by the scheduler process, so neither takes effect unless a `dagu scheduler` runs somewhere. In this model the launcher owns scheduling. Keep DAG definitions on the shared volume under `paths.dags_dir` so the server can render and edit the same files the launcher runs.

### Distributed workers

<img src="/deployment-models/self-hosted.gif" alt="Distributed-worker deployment where the Dagu server dispatches tasks into a coordinator and workers on separate hosts poll it over gRPC, reporting status and logs back, with the server and persistent volume sharing the same data." style="width: 100%; border-radius: 8px; border: 1px solid var(--vp-c-divider); margin: 16px 0 24px;" />

Use this model when execution should sit on hosts you keep running and pick by label. The server dispatches tasks into a coordinator; workers connect outbound over gRPC, poll for tasks matching their labels, and report status, logs, and artifacts back. Nothing is pushed to a worker, so workers need no inbound port.

The coordinator writes worker output to the same Dagu data as the rest of the server side: run status through the DAG-run repository, plus streamed logs and artifacts under `paths.log_dir` and `paths.artifact_dir`. Workers do not access that server storage directly.

Unlike temporary workers, these stay up between runs, which is what buys label routing, warm toolchains, and a fixed place for private-network access. Workers are useful for:

- Docker step execution on dedicated hosts
- Access to private networks or private APIs
- Custom toolchains and local runtimes
- Workflows that must run near data or secrets
- Distributing heavier workloads across multiple execution hosts

## Choosing a Topology

| Requirement | Topology |
|-------------|----------|
| Try Dagu, or run scheduled work on a single host. | Single server |
| Give each run its own compute and hold no capacity between jobs. | Temporary workers |
| Route Docker, private-network, or data-local steps to hosts you keep running. | Distributed workers |

## Pricing and Licensing Links

- [Community self-host](https://dagu.sh/pricing#self-host): open-source Dagu for self-hosted use.
- [Team and Pro self-host licenses](https://dagu.sh/pricing#self-host): enterprise controls and more API keys for self-hosted Dagu servers.
- [License Comparison](/overview/self-host-license): feature comparison for Community, Team, and Pro self-host.
- [Contact](https://dagu.sh/contact): sizing, deployment, or security review questions.

For setup details and operating guides, use:

- [Install Dagu](/getting-started/installation/)
- [Deploy Dagu](/server-admin/deployment/)
- [Distributed Execution](/server-admin/distributed/)
- [Workers](/server-admin/distributed/workers/)
- [Docker action](/step-types/docker)
