import { beforeEach, describe, expect, it } from "vitest";
import { selectByKind, selectUnseenCount, useIdeasStore, type Idea } from "./ideas";

const ideas: Idea[] = [
  { id: "s", kind: "suggestion", title: "", body: "", prompt: "p", at: 1 },
  { id: "c", kind: "schedule", title: "", body: "", cron: "* * * * *", enabled: false, at: 2 },
  { id: "n1", kind: "notification", title: "", body: "", read: false, at: 3 },
  { id: "n2", kind: "notification", title: "", body: "", read: true, at: 4 },
];

describe("ideas store", () => {
  beforeEach(() => useIdeasStore.setState({ ideas }));

  it("counts waiting suggestions and unread notifications as unseen", () => {
    expect(selectUnseenCount(useIdeasStore.getState())).toBe(2);
    useIdeasStore.getState().markRead("n1");
    useIdeasStore.getState().dismiss("s");
    expect(selectUnseenCount(useIdeasStore.getState())).toBe(0);
  });

  it("toggles a schedule and ignores toggles aimed at other kinds", () => {
    useIdeasStore.getState().toggleSchedule("c");
    useIdeasStore.getState().toggleSchedule("n1");
    expect(selectByKind("schedule")(useIdeasStore.getState())[0].enabled).toBe(true);
    expect(selectByKind("notification")(useIdeasStore.getState()).find((n) => n.id === "n1")).toMatchObject({ read: false });
  });

  it("selects one kind, newest first", () => {
    expect(selectByKind("notification")(useIdeasStore.getState()).map((n) => n.id)).toEqual(["n2", "n1"]);
  });
});
