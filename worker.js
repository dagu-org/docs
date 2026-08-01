const CANONICAL_HOST = "docs.dagu.sh";
const LEGACY_HOSTS = new Set(["docs.daguit.dev", "docs.dagu.cloud"]);
const PUBLIC_HOSTS = new Set([CANONICAL_HOST, ...LEGACY_HOSTS]);
const SOCIAL_IMAGE_PATH = "/og-7c9f9ca5.png";

function canonicalRedirect(url) {
  if (!PUBLIC_HOSTS.has(url.hostname)) {
    return null;
  }

  if (url.protocol === "https:" && !LEGACY_HOSTS.has(url.hostname)) {
    return null;
  }

  const canonicalUrl = new URL(url);
  canonicalUrl.protocol = "https:";
  if (LEGACY_HOSTS.has(canonicalUrl.hostname)) {
    canonicalUrl.hostname = CANONICAL_HOST;
  }
  canonicalUrl.port = "";
  return canonicalUrl;
}

export { canonicalRedirect };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const redirectUrl = canonicalRedirect(url);
    if (redirectUrl) {
      return Response.redirect(redirectUrl, 308);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("Strict-Transport-Security", "max-age=31536000");
    if (url.pathname === SOCIAL_IMAGE_PATH) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
