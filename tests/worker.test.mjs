import assert from "node:assert/strict";
import test from "node:test";

import worker, { canonicalRedirect } from "../worker.js";

test("HTTP documentation requests redirect to HTTPS", () => {
  const result = canonicalRedirect(
    new URL("http://docs.dagu.sh/getting-started/quickstart?ref=card"),
  );

  assert.equal(
    result?.href,
    "https://docs.dagu.sh/getting-started/quickstart?ref=card",
  );
});

test("legacy documentation domains redirect to the canonical host", () => {
  const result = canonicalRedirect(
    new URL("https://docs.dagu.cloud/writing-workflows/"),
  );

  assert.equal(result?.href, "https://docs.dagu.sh/writing-workflows/");
});

test("canonical HTTPS documentation requests continue without redirecting", () => {
  assert.equal(canonicalRedirect(new URL("https://docs.dagu.sh/")), null);
  assert.equal(canonicalRedirect(new URL("http://localhost:8787/")), null);
});

test("asset responses include transport security and cache fingerprinted social images", async () => {
  const env = {
    ASSETS: {
      fetch: async () =>
        new Response("image", {
          headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
        }),
    },
  };

  const response = await worker.fetch(
    new Request("https://docs.dagu.sh/og-7c9f9ca5.png"),
    env,
  );

  assert.equal(
    response.headers.get("strict-transport-security"),
    "max-age=31536000",
  );
  assert.equal(
    response.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
  );
});
