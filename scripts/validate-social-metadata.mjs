import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const SITE_URL = "https://docs.dagu.sh";
const SOCIAL_IMAGE = `${SITE_URL}/og-a736f269.png`;
const TITLE_LIMIT = 70;
const DESCRIPTION_LIMIT = 200;
const outputRoot = resolve(process.argv[2] || ".vitepress/dist");

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

function attributes(tag) {
  const values = {};
  for (const match of tag.matchAll(/([:\w-]+)=(?:"([^"]*)"|'([^']*)')/g)) {
    values[match[1]] = match[2] ?? match[3];
  }
  return values;
}

function decodedLength(value) {
  const decoded = value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|amp|quot|apos|lt|gt);/gi,
    (entity, decimal, hexadecimal) => {
      if (decimal) {
        return String.fromCodePoint(Number.parseInt(decimal, 10));
      }
      if (hexadecimal) {
        return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      }
      return {
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&lt;": "<",
        "&gt;": ">",
      }[entity.toLowerCase()] ?? entity;
    },
  );
  return Array.from(decoded).length;
}

const imageName = basename(new URL(SOCIAL_IMAGE).pathname);
const fingerprint = imageName.match(/^og-([a-f\d]{8})\.png$/)?.[1];
const imageHash = createHash("sha256")
  .update(readFileSync(resolve("public", imageName)))
  .digest("hex");
const failures = [];

if (!fingerprint || !imageHash.startsWith(fingerprint)) {
  failures.push(`${imageName}: filename does not match the image content hash`);
}

let checked = 0;
for (const file of filesIn(outputRoot).filter(
  (path) => path.endsWith(".html") && basename(path) !== "404.html",
)) {
  const html = readFileSync(file, "utf8");
  const metadata = [...html.matchAll(/<meta\s+[^>]*>/g)].map((match) =>
    attributes(match[0]),
  );
  const links = [...html.matchAll(/<link\s+[^>]*>/g)].map((match) =>
    attributes(match[0]),
  );
  const values = (key, name) =>
    metadata.filter((item) => item[key] === name).map((item) => item.content);
  const socialNames = [
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:image"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
  ];

  checked++;
  for (const [key, name] of socialNames) {
    const found = values(key, name);
    if (found.length !== 1 || !found[0]) {
      failures.push(`${file}: expected one ${name}, found ${found.length}`);
    }
  }

  const canonical = links
    .filter((link) => link.rel === "canonical")
    .map((link) => link.href);
  const openGraphUrl = values("property", "og:url");
  if (canonical.length !== 1 || canonical[0] !== openGraphUrl[0]) {
    failures.push(`${file}: canonical URL and og:url differ`);
  }
  if (
    values("property", "og:image")[0] !== SOCIAL_IMAGE ||
    values("name", "twitter:image")[0] !== SOCIAL_IMAGE
  ) {
    failures.push(`${file}: social image is not ${SOCIAL_IMAGE}`);
  }
  if (values("name", "twitter:card")[0] !== "summary_large_image") {
    failures.push(`${file}: twitter:card is not summary_large_image`);
  }

  for (const [key, name, limit] of [
    ["property", "og:title", TITLE_LIMIT],
    ["name", "twitter:title", TITLE_LIMIT],
    ["property", "og:description", DESCRIPTION_LIMIT],
    ["name", "twitter:description", DESCRIPTION_LIMIT],
  ]) {
    const value = values(key, name)[0] || "";
    if (decodedLength(value) > limit) {
      failures.push(`${file}: ${name} exceeds ${limit} characters`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.slice(0, 30).join("\n"));
  if (failures.length > 30) {
    console.error(`...and ${failures.length - 30} more failures`);
  }
  process.exit(1);
}

console.log(`Validated social metadata for ${checked} documentation pages.`);
