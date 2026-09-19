export function safeInternalPath(value: string | null | undefined, fallback = "/trips") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://triply.local");
    if (url.origin !== "http://triply.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
