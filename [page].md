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

## Why Dagu exists

Most teams that end up on this page are not shopping for a workflow platform. They have scripts and containers that already work, and a scheduler situation that has started to eat the time it was supposed to save.

The complaints behind Dagu are specific.

Orchestration is not your main work. A scheduler exists to serve your jobs. When it brings its own database, its own worker fleet, and its own on-call surprises, the relationship inverts and you start working for the orchestrator.

A workflow is configuration, not a program. Order, retries, schedules, approvals: these are declarations. Write them as Python and the workflow definition itself starts having bugs and dependency conflicts.

Decorators pull the engine into your code. After `@dag` and `@task` spread through a codebase, the orchestrator is no longer next to your logic. It is inside it, and getting it back out is a migration.

And the script that moves data has no reason to know what schedules it or who approved it.

Dagu takes the opposite bet: the workflow is a file. YAML declares the structure, your scripts and containers do the work in whatever language they are already written in, and the engine is one process writing state to local files.

## The idea in one file

Your repository already has the logic:

```text
scripts/extract.py
scripts/build-report.sh
```

Add one file that holds only the structure:

```yaml
schedule: "0 2 * * *"

steps:
  - id: extract
    run: python scripts/extract.py
    retry_policy:
      limit: 3
      interval_sec: 30

  - id: report
    run: ./scripts/build-report.sh
    depends: extract
```

That is the entire integration. No imports, no decorators, nothing rewritten. Delete the YAML and your scripts still run. Keep it, and every run gets a dependency graph, retries, per-step logs, history, and a Web UI.

## Run your first workflow

Install Dagu on macOS or Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/dagucloud/dagu/main/scripts/installer.sh | bash
```

The installer can add Dagu to your `PATH`, set up a background service, and create the first admin account. See [Installation](/getting-started/installation/) for Windows, Docker, Homebrew, npm, and manual options.

Save this as `health.yaml`. Two probes run in parallel, an LLM summarizes their output, and a human approves before anything is published:

```yaml
secrets:
  - name: OPENROUTER_API_KEY
    provider: env
    key: OPENROUTER_API_KEY

llm:
  provider: openrouter
  model: deepseek/deepseek-v4-flash

steps:
  - id: disk
    run: df -h | head -5
    output: DISK
  - id: load
    run: uptime
    output: LOAD
  - id: summarize
    action: chat.completion
    with:
      prompt: |
        Summarize this machine's health in three sentences:
        ${DISK}
        ${LOAD}
    output: SUMMARY
    depends: [disk, load]
  - id: approve
    action: human.task
    with:
      prompt: Publish this health summary?
    depends: summarize
  - id: publish
    run: echo "$SUMMARY"
    depends: approve
```

Export an API key (any [LLM provider](/step-types/llm/providers) works, including local models), then start the scheduler and Web UI in the same directory:

```bash
export OPENROUTER_API_KEY=your-key
dagu start-all --dags .
```

Open <http://localhost:8080> and start `health` from the UI. The run pauses at `approve`; click Approve, and the model's summary prints in the `publish` step's log. The dependency graph, per-step logs, and full run history are all there. Prefer to start without an API key? The [full quickstart](/getting-started/quickstart) covers the basics offline.

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
