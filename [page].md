---
title: Local-first orchestration that just works
description: Local-first workflow orchestration in declarative YAML. One open-source binary with schedules, retries, human tasks, logs, and a Web UI. No external database, no framework.
---

# Local-first orchestration that just works

Define workflows in declarative YAML over your existing commands and tools. One open-source binary adds schedules, retries, human tasks, logs, and a Web UI, with state in local files. No database, no decorators, no framework. The same engine runs AI coding agents and LLM calls.

<div class="hero-section">
  <div class="hero-actions">
    <a href="#run-your-first-workflow" class="VPButton brand">Get started</a>
    <a href="https://dagu-demo-f5e33d0e.dagu.sh/" class="VPButton alt">Try the Live Demo</a>
    <a href="/writing-workflows/examples" class="VPButton alt">View Examples</a>
  </div>
  <p>Live demo login: username <code>demouser</code>, password <code>demouser</code>.</p>
</div>

## What Dagu adds

<div class="overview-card-grid overview-strengths-grid">
  <div class="overview-card">
    <h3><a href="/writing-workflows/">Commands, containers, and SSH</a></h3>
    <p>Run shell commands, scripts, Docker containers, Kubernetes Jobs, SSH commands, SQL, HTTP requests, and other tools without rewriting them into a framework.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/writing-workflows/sub-dags">Parallel and reusable Sub-DAGs</a></h3>
    <p>Call child DAGs with parameters, run them over lists of items with concurrency limits, and inspect every nested run independently.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/writing-workflows/scheduling">Scheduling and execution control</a></h3>
    <p>Use cron schedules, timezones, overlap policies, catch-up windows, queues, retries, timeouts, and human tasks in workflow YAML.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/web-ui/notifications">Notifications and webhooks</a></h3>
    <p>Route run events to notification providers and trigger workflows from external systems through per-DAG webhooks.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/overview/web-ui">Logs and run history</a></h3>
    <p>Use the Web UI to inspect live status, read step logs, review history, retry failures, and edit workflow YAML.</p>
  </div>
  <div class="overview-card">
    <h3><a href="/getting-started/installation/">One binary, no external database</a></h3>
    <p>Run Dagu on Linux, macOS, or Windows with local file-backed state. Add queues or distributed workers when needed.</p>
  </div>
</div>

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

**A workflow is configuration, not a program.** Order, retries, schedules, and human tasks are declared; there is no framework logic to write or dependency environment to maintain.

**A script should not know its schedule.** The script that moves data does not need to know when it runs, where it runs, or how operator input is collected.

Dagu keeps workflow structure in one YAML file next to the tools that do the work. Delete the YAML and the scripts still run. Keep it, and every run gets a dependency graph, retries, per-step logs, history, and a Web UI.

## What Dagu is not

- Dagu is not a durable-execution SDK. If you want workflow logic as typed code with replay guarantees inside your application, use Temporal; that is what it is built for.
- It is not a Python data platform either. Teams that live inside Airflow operators and providers get real value from that ecosystem, and Dagu does not try to replace it.
- It does not manage infrastructure. Dagu runs commands wherever you put the binary, and provisioning the machines stays your job.

## Choose your next step

<div class="next-steps">
  <div class="step-card">
    <h3><a href="/writing-workflows/sub-dags">Parallel Sub-DAGs</a></h3>
    <p>Compose reusable child workflows and run them over items with concurrency limits.</p>
  </div>
  <div class="step-card">
    <h3><a href="/step-types/ssh">SSH execution</a></h3>
    <p>Run commands on remote hosts while keeping status and logs in Dagu.</p>
  </div>
  <div class="step-card">
    <h3><a href="/writing-workflows/scheduling">Scheduling</a></h3>
    <p>Configure cron expressions, timezones, overlap policies, and catch-up behavior.</p>
  </div>
  <div class="step-card">
    <h3><a href="/web-ui/notifications">Notifications and webhooks</a></h3>
    <p>Route workflow events and trigger DAGs from external systems.</p>
  </div>
  <div class="step-card">
    <h3><a href="/writing-workflows/examples">Workflow examples</a></h3>
    <p>Start from practical YAML for scripts, data jobs, containers, and operations.</p>
  </div>
  <div class="step-card">
    <h3><a href="/overview/deployment-models">Deployment models</a></h3>
    <p>Compare a local server, headless execution, and distributed workers.</p>
  </div>
</div>

### Optional AI integrations

<div class="next-steps">
  <div class="step-card">
    <h3><a href="/getting-started/quickstart-ai">AI workflows</a></h3>
    <p>Run coding agents as steps, call LLMs, or let a controller pick the path.</p>
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
