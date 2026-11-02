import { describe, expect, it } from "vitest";
import { timeAgo } from "./time";

describe("timeAgo", () => {
  const now = Date.UTC(2026, 10, 2, 12);
  const min = 60_000;

  it("reads naturally in both directions", () => {
    expect(timeAgo(now - 10_000, now)).toBe("just now");
    expect(timeAgo(now - min, now)).toBe("1 minute ago");
    expect(timeAgo(now - 20 * min, now)).toBe("20 minutes ago");
    expect(timeAgo(now - 3 * 60 * min, now)).toBe("3 hours ago");
    expect(timeAgo(now - 24 * 60 * min, now)).toBe("yesterday");
    expect(timeAgo(now - 6 * 24 * 60 * min, now)).toBe("6 days ago");
    expect(timeAgo(now + 2 * 60 * min, now)).toBe("in 2 hours");
    expect(timeAgo(now + 24 * 60 * min, now)).toBe("tomorrow");
  });
});
