---
description: Run an LLM-directed workflow in under five minutes with OpenRouter, a controller that triages the machine it runs on and explains its decisions.
---

# AI Quickstart

From zero to an LLM-directed workflow in under five minutes: a controller that checks this machine's health, decides for itself what to inspect, and writes the summary.

## 1. Install Dagu

```bash
curl -fsSL https://raw.githubusercontent.com/dagucloud/dagu/main/scripts/installer.sh | bash
```

Other platforms and methods: [Quickstart](/getting-started/quickstart) and the [Installation Guide](/getting-started/installation/).

## 2. Get an OpenRouter key

One [OpenRouter](https://openrouter.ai) key reaches models from every major vendor, and it is the key every example in these docs uses. Sign in, create a key under **Keys**, and export it:

```bash
export OPENROUTER_API_KEY=sk-or-...
```

The model below costs well under a cent per run. To try without adding payment at all, OpenRouter also serves free model variants; see step 3.

## 3. Create the workflow

Save as `triage.yaml`:

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
  - name: disk
    description: Show filesystem usage.
    run: df -h
    output: DISK
  - name: load
    description: Show uptime and load average.
    run: uptime
    output: LOAD
  - name: processes
    description: List processes with CPU and memory usage.
    run: ps aux | head -20
  - name: summarize
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

The `secrets` block matters. Dagu does not pass your shell environment through to workflows, so an exported key alone produces a `401`; the `secrets` entry reads the key from the Dagu process and masks it in logs. See [making the key reachable](/step-types/llm/providers#making-the-key-reachable).

::: tip No payment method?
Swap the model line for a free variant such as `model: openai/gpt-oss-20b:free`. Free variants are rate-limited and the lineup changes; browse the current list at [openrouter.ai/models](https://openrouter.ai/models).
:::

## 4. Run it

```bash
dagu start triage.yaml
```

The run prints each decision as it happens. On a healthy machine the controller checks disk and load, skips the process listing, runs `summarize` last, and settles the task with a reason in its own words:

```text
├─disk (0s)      [succeeded]
├─load (0s)      [succeeded]
├─processes      [skipped]
├─summarize (5s) [succeeded]
│  └─ The system is stable with moderate load averages. The primary
│     volume is 5% full, but the main data volume is 72% utilized...
```

Under load it inspects processes first and says so. Run it twice and the order can differ; the goal is what stays fixed.

## 5. Watch it think

```bash
dagu start-all
```

Open `http://localhost:8080`, find the `triage` run, and open it. The run page shows the decision timeline (which action, which turn, what happened), and the **Chat** tab holds the full transcript: what the controller saw after each step and why it settled the task. Start another run from the UI to watch it live.

## What just happened

- Every step was offered to the model as a callable tool, described by its `description`. The model picked one action per turn and observed each result.
- The task description steered judgment: "inspect processes only if disk or load looks unhealthy" is the entire branching logic. No edges, no conditions.
- The `summarize` step is a `chat.completion` call inside the catalog, sharing the workflow's `llm` block: one model decides, the same model writes.

## Next steps

- [Controller Examples](/writing-workflows/examples/controller) builds every capability step by step: failure recovery, asking a person, dispatching sub-workflows.
- [Controllers & Completions](/step-types/llm/controller-completions) walks from a single completion to LLM at both layers.
- [LLM Overview](/step-types/llm/) covers `chat.completion` and everything it can do.
- [AI Examples](/writing-workflows/examples/ai) has runnable copy-paste cards for each pattern.
