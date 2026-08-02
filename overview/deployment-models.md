# Deployment Models

Dagu can run as a local single-server process or as a self-hosted production server, with or without distributed workers. The same workflow YAML can move between these models; the main decision is where the Dagu server runs and where workflow steps execute.

For the visual version on the website, see [Deployment models](https://dagu.sh/product#deployment-model). For commercial plans, see [Pricing](https://dagu.sh/pricing).

## Terms

| Term | Meaning |
|------|---------|
| **Dagu server** | The Web UI, REST API, scheduler, queues, run history, logs, and coordinator service when distributed execution is enabled. If the coordinator runs as a separate process, it must be configured to use the same shared Dagu data as the other server components. |
| **Worker** | A `dagu worker` process that connects to a coordinator and executes assigned DAG runs. Workers can be selected by labels. |
| **Execution** | The place where workflow steps actually run: the Dagu server itself or a worker you operate. |

## Models

| Model | Dagu server runs in | Workflow execution | Best for | More information |
|-------|--------------------|--------------------|----------|------------------|
| **Local single server** | One machine you operate. | On the same machine. | Development, small internal automation, edge devices, or a first production host. | [Quickstart](/getting-started/quickstart), [Installation](/getting-started/installation/) |
| **Self-hosted** | Your infrastructure, using the open-source Dagu server. | On the server or on workers you operate. | Teams that want Dagu inside their own network and security boundary. | [Deployment](/server-admin/deployment/), [Distributed Execution](/server-admin/distributed/) |
| **Licensed self-hosted** | Your infrastructure, with a paid self-host license when enterprise features are needed. | On the server or on self-hosted workers. Workers are not licensed separately. | Teams that need enterprise controls such as SSO, RBAC, audit logging, more API keys, and support while keeping Dagu self-hosted. | [License comparison](/overview/self-host-license), [Self-host pricing](https://dagu.sh/pricing#self-host) |

## Common Topologies

Each topology below uses its own diagram so the labels stay readable in the docs.

### Local single server

<img src="/deployment-models/local.gif" alt="Local single-server Dagu deployment with the Web UI, API, scheduler, executor, and persistent volume on one host." style="width: 100%; border-radius: 8px; border: 1px solid var(--vp-c-divider); margin: 16px 0 24px;" />

Use this model when one machine is enough. `dagu start-all` runs the Web UI, scheduler, and execution engine in one process. History and logs stay on the same machine by default.

### Self-hosted with workers

<img src="/deployment-models/self-hosted.gif" alt="Self-hosted Dagu deployment where the Web UI, scheduler, queue, coordinator, and workers run in your infrastructure and the server-side components share the same persistent volume." style="width: 100%; border-radius: 8px; border: 1px solid var(--vp-c-divider); margin: 16px 0 24px;" />

Use this model when you want to keep the server, workers, secrets, logs, and workflow execution inside your own infrastructure. The server-side components, including the coordinator, share the same Dagu data. Workers either use that shared storage directly or report status and logs back through the coordinator in shared-nothing mode.

Workers are useful for:

- Docker step execution on dedicated hosts
- Access to private networks or private APIs
- Custom toolchains and local runtimes
- Workflows that must run near data or secrets
- Distributing heavier workloads across multiple execution hosts

## Choosing a Model

| Requirement | Recommended model |
|-------------|-------------------|
| Try Dagu locally or run small automation on one host. | Local single server |
| Keep all control, state, and execution in your own environment. | Self-hosted |
| Add enterprise controls while staying self-hosted. | Licensed self-hosted |
| Run Docker/private-network/data-local steps on dedicated hosts. | Self-hosted with workers |

## Pricing and Licensing Links

- [Community self-host](https://dagu.sh/pricing#self-host): open-source Dagu for self-hosted use.
- [Paid self-host licenses](https://dagu.sh/pricing#self-host): enterprise controls and more API keys for self-hosted Dagu servers.
- [License Comparison](/overview/self-host-license): feature comparison for Community and licensed self-host.
- [Contact](https://dagu.sh/contact): sizing, deployment, or security review questions.

For setup details and operating guides, use:

- [Install Dagu](/getting-started/installation/)
- [Deploy Dagu](/server-admin/deployment/)
- [Distributed Execution](/server-admin/distributed/)
- [Workers](/server-admin/distributed/workers/)
- [Docker action](/step-types/docker)
