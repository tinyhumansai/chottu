import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_CONNECT_MS, useCallStore } from "./call";

describe("call store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useCallStore.setState({ status: "idle", connectedAt: null, muted: false });
  });
  afterEach(() => vi.useRealTimers());

  it("goes connecting → connected → ended → idle", () => {
    const call = () => useCallStore.getState();
    call().start();
    expect(call().status).toBe("connecting");
    vi.advanceTimersByTime(MOCK_CONNECT_MS);
    expect(call().status).toBe("connected");
    expect(call().connectedAt).not.toBeNull();
    call().end();
    expect(call().status).toBe("ended");
    vi.runAllTimers();
    expect(call()).toMatchObject({ status: "idle", connectedAt: null });
  });

  it("hanging up while connecting never connects", () => {
    useCallStore.getState().start();
    useCallStore.getState().end();
    vi.advanceTimersByTime(MOCK_CONNECT_MS * 2);
    expect(useCallStore.getState().status).toBe("idle");
  });

  it("mute only works on a connected call and resets on the next call", () => {
    const call = () => useCallStore.getState();
    call().start();
    call().toggleMute();
    expect(call().muted).toBe(false);
    vi.advanceTimersByTime(MOCK_CONNECT_MS);
    call().toggleMute();
    expect(call().muted).toBe(true);
    call().end();
    vi.runAllTimers();
    call().start();
    expect(call().muted).toBe(false);
  });
});
