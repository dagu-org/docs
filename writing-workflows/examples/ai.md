# AI Examples

Examples for chat completions, DAG-level LLM configuration, sessions, and extended thinking.

<div class="examples-grid">

<div class="example-card">

### Chat / LLM Request

```yaml
steps:
  - action: chat.completion
    with:
      provider: openai
      model: gpt-4o
      messages:
        - role: user
          content: |
            What is 2+2?
    output: ANSWER
```

<a href="/features/chat/" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Chat with DAG-Level Config

```yaml
params:
  - name: topic
    default: Dagu workflows

llm:
  provider: openai
  model: gpt-4o
  system: |
    You are a helpful assistant.

steps:
  - action: chat.completion
    with:
      messages:
        - role: user
          content: |
            Explain ${params.topic} briefly.
```

Steps inherit LLM config from DAG level.

<a href="/step-types/llm/providers#dag-level-defaults" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Multi-turn Session

```yaml
steps:
  - id: ask
    action: chat.completion
    with:
      provider: openai
      model: gpt-4o
      messages:
        - role: user
          content: |
            What is 2+2?

  - id: follow_up
    action: chat.completion
    with:
      provider: openai
      model: gpt-4o
      messages:
        - role: user
          content: |
            Now multiply that by 3.
    depends: ask
```

Steps inherit session history from previous steps.

<a href="/step-types/llm/outputs#sessions" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Extended Thinking Mode

```yaml
steps:
  - action: chat.completion
    with:
      provider: anthropic
      model: claude-sonnet-4-20250514
      thinking:
        enabled: true
        effort: high
      messages:
        - role: user
          content: |
            Analyze this complex problem...
```

Enable deeper reasoning for complex tasks.

<a href="/step-types/llm/reasoning-web-search#reasoning" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Controller Workflow

```yaml
type: controller

env:
  - ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514

steps:
  - name: run_tests
    description: Run the test suite.
    run: |
      test -f /tmp/dagu-flaky-cleared || { echo "FAIL"; exit 1; }
      echo "all green"

  - name: fix_flaky
    description: Quarantine the known flaky test.
    run: touch /tmp/dagu-flaky-cleared

tasks:
  - name: tests_green
    description: Finished when run_tests succeeded on its most recent run.
```

The steps become a catalog of actions, and `tasks` says when the run is done.
The model picks what runs next, so a failing test can be fixed and retried
without wiring that path yourself.

<a href="/writing-workflows/controller" class="learn-more">Learn more →</a>

</div>

</div>
