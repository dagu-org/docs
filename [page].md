---
title: Local-first orchestration that just works
description: Local-first workflow orchestration in declarative YAML. One open-source binary with schedules, retries, approvals, logs, and a Web UI. No external database, no framework.
sidebar: false
aside: false
pageClass: overview-page
---

<script setup>
import OverviewWorkflowDemo from '/.vitepress/theme/components/OverviewWorkflowDemo.vue'
</script>

<OverviewWorkflowDemo />

<p class="overview-demo-guides">Explore the building blocks: <a href="/writing-workflows/scheduling">Scheduling</a> · <a href="/step-types/docker">Docker</a> · <a href="/writing-workflows/sub-dags">Nested workflows</a> · <a href="/step-types/harness/opencode">OpenCode</a> · <a href="/writing-workflows/human-tasks">Human tasks</a> · <a href="/step-types/ssh">SSH</a> · <a href="/step-types/mail">Email</a></p>

## Run your first workflow

Install Dagu on Windows, macOS, or Linux:

::: code-group

```powershell [Windows]
irm https://raw.githubusercontent.com/dagucloud/dagu/main/scripts/installer.ps1 | iex
```

```bash [macOS/Linux]
curl -fsSL https://raw.githubusercontent.com/dagucloud/dagu/main/scripts/installer.sh | bash
```

:::

The installers can add Dagu to your `PATH`, set up a background service, and create the first admin account. See [Installation](/getting-started/installation/) for Docker, Homebrew, npm, and manual options.

Save this as `health.yaml`. Two checks run in parallel, then Dagu turns their output into a Markdown artifact:

```yaml
steps:
  - id: version
    run: dagu version
    output: VERSION

  - id: ready
    run: echo Dagu is ready
    output: READY

  - id: report
    action: template.render
    with:
      template: |
        # Dagu health

        ## Version

        ~~~text
        {{ .version }}
        ~~~

        ## Check

        ~~~text
        {{ .ready }}
        ~~~
      data:
        version: ${VERSION}
        ready: ${READY}
    stdout:
      artifact: health-report.md
    depends: [version, ready]
```

Start the scheduler and Web UI in the same directory:

```bash
dagu start-all --dags .
```

Open <http://localhost:8080> and start `health` from the UI. The `version` and `ready` steps run in parallel, and `report` waits for both. Open the run's **Artifacts** tab to preview or download `health-report.md`. The dependency graph, per-step logs, and full run history are all there. The [full quickstart](/getting-started/quickstart) covers command-line runs, Docker, parameters, retries, and other fundamentals.

## See the Web UI

<video src="/cockpit-demo.mp4" poster="/cockpit-demo-poster.jpg" controls preload="none" playsinline aria-label="Dagu Cockpit demo" style="width: 100%; border-radius: 12px; margin: 8px 0 24px;"></video>

Want to explore without installing anything? Open the [live demo](https://dagu-demo-f5e33d0e.dagu.sh/) and sign in with `demouser` / `demouser`.

## Why Dagu exists

Most teams that land here are not looking for a workflow platform. Their scripts and containers already work. The scheduler around them is the problem: it takes more time to operate than it saves.

**Orchestration is not your main work.** A big platform brings its own database, worker fleet, upgrades, and alerts. You wanted to schedule some jobs. Now you operate a second system.

**A workflow is configuration, not a program.** Order, retries, schedules, and approvals are declared; there is no framework logic to write or dependency environment to maintain.

**A script should not know its schedule.** The script that moves data does not need to know when it runs, where it runs, or who approved it.

Dagu keeps workflow structure in one YAML file next to the tools that do the work. Delete the YAML and the scripts still run. Keep it, and every run gets a dependency graph, retries, per-step logs, history, and a Web UI.

## What Dagu adds

<div class="overview-card-grid overview-strengths-grid">
  <div class="overview-card">
    <h3><a href="/writing-workflows/">Keep your existing tools</a></h3>
    <p>Run shell commands, scripts, containers, SSH commands, SQL, HTTP requests, and other tools without rewriting them into a framework.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/writing-workflows/sub-dags">Compose reusable workflows</a></h3>
    <p>Call a child DAG from a parent, pass parameters, wait for its result, and inspect every nested run independently.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/overview/web-ui">See every run</a></h3>
    <p>Use the Web UI to inspect live status, read step logs, review history, retry failures, and edit workflow YAML.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/writing-workflows/error-handling">Make jobs reliable</a></h3>
    <p>Add dependencies, schedules, retries, timeouts, approvals, notifications, and artifacts in the workflow file.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/overview/deployment-models">Start on one machine</a></h3>
    <p>Use local file-backed state first. Add queues or distributed workers later if the workload outgrows one machine.</p>
  </div>
</div>

## What Dagu is not

- Dagu is not a durable-execution SDK. If you want workflow logic as typed code with replay guarantees inside your application, use Temporal; that is what it is built for.
- It is not a Python data platform either. Teams that live inside Airflow operators and providers get real value from that ecosystem, and Dagu does not try to replace it.
- It does not manage infrastructure. Dagu runs commands wherever you put the binary, and provisioning the machines stays your job.

## Choose your next step

<div class="next-steps">
  <div class="step-card">
    <h3><a href="/getting-started/quickstart">Quickstart</a></h3>
    <p>Install Dagu, run a workflow, and open the Web UI.</p>
  </div>
  <div class="step-card">
    <h3><a href="/getting-started/quickstart-ai">AI workflows</a></h3>
    <p>Run coding agents as steps, call LLMs, or let a controller pick the path.</p>
  </div>
  <div class="step-card">
    <h3><a href="/writing-workflows/examples">Workflow examples</a></h3>
    <p>Start from practical YAML for scripts, data jobs, containers, and operations.</p>
  </div>
  <div class="step-card">
    <h3><a href="/overview/deployment-models">Deployment models</a></h3>
    <p>Compare a local server, headless execution, and distributed workers.</p>
  </div>
  <div class="step-card">
    <h3><a href="/server-admin/">Server administration</a></h3>
    <p>Configure authentication, queues, storage, Git sync, and production operation.</p>
  </div>
  <div class="step-card">
    <h3><a href="/mcp/">MCP server</a></h3>
    <p>Let MCP clients inspect workflows, start runs, and read results through the built-in endpoint.</p>
  </div>
</div>

## Community

<div class="community-links">
  <a href="https://discord.gg/gpahPUjGRk" class="community-link">
    <span class="icon">Discord</span>
  </a>
  <a href="https://github.com/dagucloud/dagu/issues" class="community-link">
    <span class="icon">Issues</span>
  </a>
</div>
