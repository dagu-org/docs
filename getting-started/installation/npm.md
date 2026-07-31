---
description: Install the official Dagu command-line binary through the @dagucloud/dagu npm package on supported platforms.
---

# Install via npm

The `@dagucloud/dagu` package is a thin wrapper that downloads the correct Dagu binary for your platform during postinstall.

## Install

```bash
npm install -g --ignore-scripts=false @dagucloud/dagu
```

`--ignore-scripts=false` is required because the postinstall script is what downloads the binary.

## Verify

```bash
dagu version
```

## Why `--ignore-scripts=false`?

Some organizations set `ignore-scripts=true` in their npm config to block arbitrary postinstall scripts. For `@dagucloud/dagu` that disables the binary download, so you must opt in explicitly on the install command.

## Uninstall

```bash
npm uninstall -g @dagucloud/dagu
```

## When to use npm

This method is useful on systems where Node.js is already the primary runtime, or in CI pipelines that already invoke npm. For most users the [script installer](/getting-started/installation/linux) or [Homebrew](/getting-started/installation/macos) is simpler.

Next: [Quickstart](/getting-started/quickstart).
