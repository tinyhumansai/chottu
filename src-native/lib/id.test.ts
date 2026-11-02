import { afterEach, describe, expect, it, vi } from "vitest";
import { newId } from "./id";

describe("newId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("works without any crypto global (Hermes)", () => {
    vi.stubGlobal("crypto", undefined);
    const ids = new Set(Array.from({ length: 100 }, newId));
    expect(ids.size).toBe(100);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("uses getRandomValues when randomUUID is missing (plain http)", () => {
    const getRandomValues = vi.fn((b: Uint8Array) => b.fill(0xab));
    vi.stubGlobal("crypto", { getRandomValues });
    expect(newId()).toBe("ab".repeat(16));
    expect(getRandomValues).toHaveBeenCalledOnce();
  });
});
