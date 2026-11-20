import "server-only";

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/**
 * Best-effort per-IP limit for the paid AI calls. It lives in memory, so each
 * server instance counts on its own.
 */
export function allowRequest(
  key: string,
  limit = 20,
  windowMs = 60 * 60 * 1000,
): boolean {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}
