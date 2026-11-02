import { describe, expect, it } from "vitest";
import { textOf } from "@/store/chat";
import { synthVoiceNote } from "./demo";
import { formatDuration, isVoiceNotePart, toWaveform, voiceNotePart } from "./types";

describe("voice notes", () => {
  it("formats durations as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(4_400)).toBe("0:04");
    expect(formatDuration(75_000)).toBe("1:15");
  });

  it("squashes levels into normalised bars with a visible floor", () => {
    const bars = toWaveform([0, 0.5, 1, 0.25], 2);
    expect(bars).toEqual([0.5, 1]);
    expect(toWaveform([0, 0, 0, 0], 2).every((v) => v >= 0.08)).toBe(true);
    expect(toWaveform([], 5)).toHaveLength(5);
  });

  it("text-only backends see a voice note as a placeholder", () => {
    const part = voiceNotePart({ src: "data:,", durationMs: 7_200, waveform: [] });
    expect(isVoiceNotePart(part)).toBe(true);
    expect(textOf({ content: [part] })).toBe("[voice note 0:07]");
  });

  it("synthesises a playable WAV of the requested length", () => {
    const note = synthVoiceNote(2, 1);
    expect(note.durationMs).toBe(2000);
    expect(note.src.startsWith("data:audio/wav;base64,UklGR")).toBe(true); // "RIFF"
    expect(note.waveform).toHaveLength(40);
    expect(synthVoiceNote(2, 1).src).toBe(note.src); // deterministic
  });
});
