const CDN_HOSTS = [
  "fermar-images.sfo3.digitaloceanspaces.com",
  "fermar-images.sfo3.cdn.digitaloceanspaces.com",
];

export function normalizeImageUrl(url: string | null): string {
  if (!url) return "";

  // Already a proxy path
  if (url.startsWith("/api/images/")) return url;

  // Convert CDN URLs to proxy paths
  try {
    const parsed = new URL(url);
    if (CDN_HOSTS.includes(parsed.hostname)) {
      // pathname is e.g. "/products/abc.png"
      return `/api/images${parsed.pathname}`;
    }
  } catch {
    // Not a valid URL — return as-is (local paths, data URIs, etc.)
  }

  return url;
}
