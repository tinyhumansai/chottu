const STEPS: [unit: string, ms: number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/**
 * "5 minutes ago", "yesterday", "in 2 hours". Written out by hand because
 * Hermes has no `Intl.RelativeTimeFormat`.
 */
export function timeAgo(at: number, now = Date.now()) {
  const diff = at - now;
  for (const [unit, ms] of STEPS) {
    const n = Math.round(Math.abs(diff) / ms);
    if (n < 1) continue;
    if (unit === "day" && n === 1) return diff < 0 ? "yesterday" : "tomorrow";
    const units = n === 1 ? unit : `${unit}s`;
    return diff < 0 ? `${n} ${units} ago` : `in ${n} ${units}`;
  }
  return "just now";
}
