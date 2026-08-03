# OpenCode

[OpenCode](https://opencode.ai) is an open-source AI coding agent.

## Installation

See the [OpenCode installation guide](https://opencode.ai).

For containerized Dagu runs, see [Run OpenCode in a Container](./sandbox/opencode).

## Zero-Install via Tools

Declare OpenCode under DAG-level [`tools`](/writing-workflows/tools) and Dagu installs the pinned release before the run starts, with nothing preinstalled on the worker:

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
        Reply with: what changed, one risk, a verdict.
```

The managed toolset is prepended to `PATH`, so the pinned release wins even when another OpenCode version is installed on the worker. OpenCode reads the OpenRouter credential from the environment; the `secrets` block is required because Dagu does not propagate arbitrary shell variables to steps.

## Base Invocation

```text
opencode run "<prompt>"
```

## Common Flags

| Flag | Type | Description |
|------|------|-------------|
| `--model` | string | Model in `provider/model` format |
| `--variant` | string | Provider-specific reasoning effort, such as `high` |
| `--pure` | boolean | Run without external plugins |

## Example

```yaml
steps:
  - name: review
    action: harness.run
    with:
      provider: opencode
      prompt: |
        Review the current branch and list problems
      model: claude-sonnet-4
```

Generated invocation:

```text
opencode run "Review the current branch and list problems" --model claude-sonnet-4
```

## YOLO Mode

OpenCode runs non-interactively by default when using `run` mode. For fully autonomous execution without any interactive prompts, ensure you are using the `run` subcommand and not the interactive TUI:

```yaml
steps:
  - name: auto-implement
    action: harness.run
    with:
      provider: opencode
      prompt: |
        Implement the feature described in the issue
      auto: true
```

Generated invocation:

```text
opencode run "Implement the feature described in the issue" --auto
```

For CI/CD environments, you may also want to set the `OPENCODE_API_KEY` environment variable to avoid authentication prompts.

## See Also

- [OpenCode CLI Docs](https://opencode.ai/docs/cli/)
- [Providers Directory](https://opencode.ai/docs/providers/)
- [Configuration](https://opencode.ai/docs/config/)
- [Custom Commands](https://opencode.ai/docs/commands/)
- [OpenCode on GitHub](https://github.com/anomalyco/opencode)
