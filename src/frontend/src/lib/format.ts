/** Convert a Motoko nanosecond timestamp into a JS Date, or null when invalid. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Short clock time for chat bubbles, e.g. "14:05". */
export function formatClock(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Friendly relative label for history entries. */
export function formatRelative(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
