/** Validates a same-origin redirect target so a crafted URL cannot send users elsewhere. */
export function safeRedirect(raw: string | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://") && !raw.includes("\\")) {
    return raw;
  }
  return fallback;
}
