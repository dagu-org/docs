# Scripts & Runtime Examples

Examples for shell scripts, Python scripts, working directories, shell selection, and reproducible runtimes.

<div class="examples-grid">

<div class="example-card">

### Shell Scripts

```yaml
steps:
  - run: |
      #!/bin/bash
      cd /tmp
      echo "hello world" > hello
      cat hello
      ls -la
```

Run shell script with default shell.

```mermaid
flowchart LR
    A["shell script · /bin/bash"]
    style A stroke:green,stroke-width:1.6px,color:#333
```

<a href="/writing-workflows/basics#scripts" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Shebang Script

```yaml
tools:
  - astral-sh/uv@0.11.14

steps:
  - run: |
      #!/usr/bin/env -S uv run --python 3.13.9 python
      import platform
      print(platform.python_version())
```

Runs with the interpreter declared in the shebang.

```mermaid
flowchart LR
    T["tools · uv@0.11.14"] --> A["shebang · uv run python 3.13.9"]
    style T stroke:lightblue,stroke-width:1.6px,color:#333
    style A stroke:green,stroke-width:1.6px,color:#333
```

<a href="/writing-workflows/basics#scripts" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Python Scripts

```yaml
tools:
  - astral-sh/uv@0.11.14

steps:
  - run: |
      import os
      import datetime
      
      print(f"Current directory: {os.getcwd()}")
      print(f"Current time: {datetime.datetime.now()}")
    with:
      shell: uv run --python 3.13.9 python
```

Execute script with specific interpreter.

```mermaid
flowchart LR
    T["tools · uv@0.11.14"] --> A["python script · uv run python 3.13.9"]
    style T stroke:lightblue,stroke-width:1.6px,color:#333
    style A stroke:green,stroke-width:1.6px,color:#333
```

<a href="/writing-workflows/basics#scripts" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Multi-Step Scripts

```yaml
steps:
  - run: |
      #!/bin/bash
      set -e
      
      echo "Starting process..."
      echo "Preparing environment"
      
      echo "Running main task..."
      echo "Running main process"
      
      echo "Cleaning up..."
      echo "Cleaning up"
```

```mermaid
flowchart LR
    A["prepare"] --> B["main task"]
    B --> C["cleanup"]
    style A stroke:lightblue,stroke-width:1.6px,color:#333
    style B stroke:lightblue,stroke-width:1.6px,color:#333
    style C stroke:green,stroke-width:1.6px,color:#333
```

<a href="/writing-workflows/basics#scripts" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Working Directory

```yaml
working_dir: /tmp
steps:
  - id: show_default_dir
    run: pwd               # Outputs: /tmp

  - id: create_data_dir
    run: mkdir -p data
    depends: show_default_dir

  - id: show_data_dir
    working_dir: /tmp/data
    run: pwd      # Outputs: /tmp/data
    depends: create_data_dir
```

```mermaid
flowchart LR
    A["show_default_dir · /tmp"] --> B["create_data_dir"]
    B --> C["show_data_dir · /tmp/data"]
    style A stroke:lightblue,stroke-width:1.6px,color:#333
    style B stroke:lightblue,stroke-width:1.6px,color:#333
    style C stroke:green,stroke-width:1.6px,color:#333
```

<a href="/writing-workflows/basics#working-directory" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Shell Selection

```yaml
shell: /bin/bash             # Default shell for all steps
shell_args: ["-e"]           # Default shell args for all steps
steps:
  - run: echo hello world | xargs echo
  - run: echo "from zsh"     # Override for a single step
    with:
      shell: /bin/zsh
```

```mermaid
flowchart LR
    A["step 1 · /bin/bash"] --> B["step 2 · /bin/zsh"]
    style A stroke:lightblue,stroke-width:1.6px,color:#333
    style B stroke:green,stroke-width:1.6px,color:#333
```

<a href="/writing-workflows/basics#shell" class="learn-more">Learn more →</a>

</div>

<div class="example-card">

### Reproducible Env with Nix Shell

> **Note:** Requires nix-shell to be installed separately. Not included in Dagu binary or container.

```yaml
steps:
  - run: |
      python3 --version
      curl --version
      jq --version
    with:
      shell: nix-shell
      shell_packages: [python3, curl, jq]
```

```mermaid
flowchart LR
    A["step · nix-shell"] --> P["python3"]
    A --> C["curl"]
    A --> J["jq"]
    style A stroke:lightblue,stroke-width:1.6px,color:#333
    style P stroke:lime,stroke-width:1.6px,color:#333
    style C stroke:lime,stroke-width:1.6px,color:#333
    style J stroke:lime,stroke-width:1.6px,color:#333
```

<a href="/step-types/shell#nix-shell" class="learn-more">Learn more →</a>

</div>

</div>
