import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const docsRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const daguBin = process.env.DAGU_BIN || process.argv[2] || "dagu";
const excludedDirectories = new Set([".git", "node_modules", "superpowers"]);
const markdownFiles = [];

function collectMarkdown(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    if (extname(path) === ".md") {
      markdownFiles.push(path);
    }
    return;
  }

  for (const entry of readdirSync(path)) {
    if (!excludedDirectories.has(entry)) {
      collectMarkdown(join(path, entry));
    }
  }
}

function isWorkflow(yaml) {
  return (
    /^steps:\s*(?:#.*)?$/m.test(yaml) ||
    /^type:\s*(?:graph|chain|controller|agent)\b/m.test(yaml)
  );
}

function isExcluded(source, fenceStart) {
  const prefix = source.slice(0, fenceStart);
  return /<!--\s*dagu-example:\s*no-validate\b[\s\S]*?-->\s*$/.test(prefix);
}

function formatCommandFailure(result) {
  if (result.error?.code === "ENOENT") {
    return `Dagu executable not found: ${daguBin}`;
  }
  if (result.error) {
    return result.error.message;
  }

  return [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
}

collectMarkdown(docsRoot);

const fixtureDir = mkdtempSync(join(tmpdir(), "dagu-doc-examples-"));
const failures = [];
let candidateCount = 0;
let excludedCount = 0;

try {
  for (const file of markdownFiles.sort()) {
    const source = readFileSync(file, "utf8");
    const fencePattern = /^```(?:yaml|yml)(?:[^\n]*)\n([\s\S]*?)^```[ \t]*$/gm;
    let match;

    while ((match = fencePattern.exec(source)) !== null) {
      const yaml = match[1];
      if (!isWorkflow(yaml)) {
        continue;
      }

      if (isExcluded(source, match.index)) {
        excludedCount++;
        continue;
      }

      candidateCount++;
      const line = source.slice(0, match.index).split("\n").length;
      const fixture = join(
        fixtureDir,
        `${String(candidateCount).padStart(4, "0")}.yaml`,
      );
      writeFileSync(fixture, yaml);

      const result = spawnSync(daguBin, ["validate", fixture], {
        encoding: "utf8",
        env: {
          ...process.env,
          DAGU_AUTH_MODE: "none",
          DAGU_HOME: join(fixtureDir, "home"),
          DAGU_SKIP_EXAMPLES: "true",
        },
        timeout: 20_000,
      });

      if (result.status !== 0) {
        failures.push({
          file: relative(docsRoot, file),
          line,
          output: formatCommandFailure(result),
        });
      }
    }
  }
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`\n${failure.file}:${failure.line}`);
    console.error(failure.output);
  }
  console.error(
    `\nFailed to validate ${failures.length} of ${candidateCount} workflow examples.`,
  );
  process.exit(1);
}

console.log(
  `Validated ${candidateCount} workflow examples (${excludedCount} explicitly contextual or invalid examples skipped).`,
);
