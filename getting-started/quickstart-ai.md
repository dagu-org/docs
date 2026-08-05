---
description: Run an AI workflow in under five minutes. Launch a coding agent with harness.run, or let an LLM direct the workflow with a controller.
---

# AI Quickstart

Dagu supports two different roles for AI:

| What you want | Start with |
|---|---|
| Run Codex, Claude Code, Copilot, OpenCode, or another agent inside a predictable workflow | [`harness.run`](#_3-run-a-coding-agent) |
| Let an LLM decide which declared action should run next | [`type: controller`](#_4-try-an-adaptive-controller) |

Start with `harness.run` when the workflow order is known and the agent has a specific job. Reach for a controller when choosing the next action is itself part of the problem. This quickstart tries both with one OpenRouter key.

## 1. Install Dagu

```bash
curl -fsSL https://raw.githubusercontent.com/dagucloud/dagu/main/scripts/installer.sh | bash
```

Other platforms and methods: [Quickstart](/getting-started/quickstart) and the [Installation Guide](/getting-started/installation/).

## 2. Get an OpenRouter key

One [OpenRouter](https://openrouter.ai) key reaches models from every major vendor. Sign in, create a key under **Keys**, and export it:

```bash
export OPENROUTER_API_KEY=sk-or-...
```

The examples below use a low-cost model. To try without adding payment, OpenRouter also serves free model variants.

::: tip No payment method?
Swap the model for a free variant such as `openrouter/openai/gpt-oss-20b:free` in the harness workflow and `openai/gpt-oss-20b:free` in the controller workflow. Free variants are rate-limited and the lineup changes; browse the current list at [openrouter.ai/models](https://openrouter.ai/models).
:::

## 3. Run a coding agent

Save this as `review.yaml` in a Git repository. It installs a pinned OpenCode CLI for the run, asks it to review the latest commit without modifying files, and stores the response as a Markdown artifact:

```yaml
working_dir: .

tools:
  - anomalyco/opencode@v1.18.11

secrets:
  - name: OPENROUTER_API_KEY
    provider: env
    key: OPENROUTER_API_KEY

steps:
  - id: review
    action: harness.run
    with:
      provider: opencode
      model: openrouter/deepseek/deepseek-v4-flash
      prompt: |
        Review the most recent commit in this repository.
        Do not modify any files.
        Return short Markdown with: summary, risks, and verdict.
    stdout:
      artifact: ai/repository-review.md
```

Run it:

```bash
dagu start review.yaml
```

The first run downloads the pinned OpenCode release. `harness.run` is an ordinary workflow step, so it composes with dependencies, retries, approvals, and every other graph feature. The agent's response is stored at `ai/repository-review.md` in the run's artifacts.

Start the Web UI from the same directory:

```bash
dagu start-all --dags .
```

Open <http://localhost:8080>, select the `review` run, and open the **Artifacts** tab to preview or download the result.

Already have Codex, Claude Code, Copilot, or another agent installed and authenticated? Remove the `tools` block and choose that provider instead. The [Harness Run examples](/writing-workflows/examples/harness-run) cover those setups, structured results, custom harnesses, and more artifact patterns.

## 4. Try an adaptive controller

A controller solves a different problem: the model chooses which declared step runs next. Save this as `triage.yaml`:

```yaml
type: controller

secrets:
  - name: OPENROUTER_API_KEY
    provider: env
    key: OPENROUTER_API_KEY

llm:
  provider: openrouter
  model: deepseek/deepseek-v4-flash

steps:
  - id: disk
    description: Show filesystem usage.
    run: df -h
    output: DISK

  - id: load
    description: Show uptime and load average.
    run: uptime
    output: LOAD

  - id: processes
    description: List processes with CPU and memory usage.
    run: ps aux | head -20

  - id: summarize
    description: Write the health summary. Run last, after the checks.
    action: chat.completion
    with:
      prompt: |
        Summarize this machine's health in three sentences:
        ${DISK}
        ${LOAD}

tasks:
  - name: triage
    description: >
      Finished when the machine has been checked and a health summary has been
      written. Inspect processes only if disk or load looks unhealthy.
```

There is no `depends` anywhere: the steps are a catalog, the task states the goal, and the model picks what runs next.

Run it:

```bash
dagu start triage.yaml
```

On a healthy machine the controller checks disk and load, skips the process listing, runs `summarize` last, and settles the task with a reason in its own words. Under load it can inspect processes first. Run it twice and the order can differ; the goal is what stays fixed.

The run page shows each decision in a timeline. Its **Chat** tab holds the full transcript: what the controller saw after each step and why it settled the task.

## How the patterns differ

| | `harness.run` | `type: controller` |
|---|---|---|
| AI's job | Perform one scoped task | Choose the next workflow action |
| Workflow order | Declared with normal graph dependencies | Decided at runtime from the step catalog |
| Best fit | Coding, review, research, or generation inside a predictable pipeline | Triage and other workflows whose path depends on what earlier actions reveal |
| Output | Step logs, declared outputs, or artifacts | Decision timeline, transcript, and results from chosen steps |

The patterns also compose: a controller can dispatch a graph workflow containing a `harness.run` step when both adaptive planning and agent execution are useful.

## Next steps

- [Harness Run Examples](/writing-workflows/examples/harness-run) covers Codex patch review, validated JSON, zero-install OpenCode, and custom harnesses.
- [Harness](/step-types/harness/) covers providers, configuration, approvals, fallbacks, and sandboxed execution.
- [Controller Examples](/writing-workflows/examples/controller) builds controller capabilities step by step: failure recovery, asking a person, and dispatching sub-workflows.
- [Controllers & Completions](/step-types/llm/controller-completions) shows how scheduling decisions and LLM generation fit together.
- [LLM Overview](/step-types/llm/) covers `chat.completion`, local models, and provider configuration.
