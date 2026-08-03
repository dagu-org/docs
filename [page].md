---
title: Local-first orchestration that just works
description: Local-first workflow orchestration in declarative YAML. One open-source binary with schedules, retries, approvals, logs, and a Web UI. No external database, no framework.
---

# Local-first orchestration that just works

Define workflows in declarative YAML over your existing commands and tools. One open-source binary adds schedules, retries, approvals, logs, and a Web UI, with state in local files. No database, no decorators, no framework. The same engine runs AI: coding agents as steps, LLM calls, and human approval gates.

<div class="hero-section">
  <div class="hero-actions">
    <a href="#run-your-first-workflow" class="VPButton brand">Get started</a>
    <a href="https://dagu-demo-f5e33d0e.dagu.sh/" class="VPButton alt">Try the Live Demo</a>
    <a href="/writing-workflows/examples" class="VPButton alt">View Examples</a>
  </div>
</div>

## Run your first workflow

Install Dagu on macOS or Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/dagucloud/dagu/main/scripts/installer.sh | bash
```

The installer can add Dagu to your `PATH`, set up a background service, and create the first admin account. See [Installation](/getting-started/installation/) for Windows, Docker, Homebrew, npm, and manual options.

Save this as `hello.yaml`:

```yaml
steps:
  - id: hello
    run: echo "Hello from Dagu!"
  - id: done
    run: echo "Workflow finished"
    depends: hello
```

Run it from the terminal:

```bash
dagu start hello.yaml
```

Then start the Web UI with the same directory:

```bash
dagu start-all --dags .
```

Open <http://localhost:8080> to see the workflow, step logs, and run history. The [full quickstart](/getting-started/quickstart) includes expected output, Docker commands, validation, and common next steps.

## See the Web UI

<video src="/cockpit-demo.mp4" poster="/cockpit-demo-poster.jpg" controls preload="none" playsinline aria-label="Dagu Cockpit demo" style="width: 100%; border-radius: 12px; margin: 8px 0 24px;"></video>

Want to explore without installing anything? Open the [live demo](https://dagu-demo-f5e33d0e.dagu.sh/) and sign in with `demouser` / `demouser`.

## What Dagu adds

<div class="overview-card-grid overview-strengths-grid">
  <div class="overview-card">
    <h3><a href="/writing-workflows/">Keep your existing tools</a></h3>
    <p>Run shell commands, scripts, containers, SSH commands, SQL, HTTP requests, and other tools without rewriting them into a framework.</p>
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

## Choose your next step

<div class="next-steps">
  <div class="step-card">
    <h3><a href="/getting-started/quickstart">Quickstart</a></h3>
    <p>Install Dagu, run a workflow, and open the Web UI.</p>
  </div>
  <div class="step-card">
    <h3><a href="/getting-started/quickstart-ai">AI workflows</a></h3>
    <p>Run coding agents as steps, call LLMs, or let a controller pick the path. Five minutes to your first AI workflow.</p>
  </div>
  <div class="step-card">
    <h3><a href="/writing-workflows/examples">Workflow examples</a></h3>
    <p>Start from practical YAML for scripts, data jobs, containers, and operations.</p>
  </div>
  <div class="step-card">
    <h3><a href="/getting-started/concepts">Core concepts</a></h3>
    <p>Learn how steps, dependencies, parameters, runs, and schedules fit together.</p>
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
    <h3><a href="/overview/self-host-license">Teams and licensing</a></h3>
    <p>Compare Community and licensed self-host. Review enterprise features, support, and <a href="https://dagu.sh/pricing#self-host">pricing</a>.</p>
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
