import type { ChatPart } from "@/store/chat";

/** Name of the data part that carries a voice note (`data-voice-note` in a message). */
export const VOICE_NOTE = "voice-note";

export type VoiceNote = {
  /**
   * Playable audio: a `data:` URL (demo notes, web recordings) or a `file://`
   * URI in the app's documents folder (native recordings). Both survive restarts.
   */
  src: string;
  durationMs: number;
  /** Loudness per bar, 0..1, for drawing the waveform. */
  waveform: number[];
};

export const voiceNotePart = (note: VoiceNote): ChatPart => ({ type: `data-${VOICE_NOTE}`, data: note });

export const isVoiceNotePart = (part: ChatPart): part is ChatPart & { data: VoiceNote } =>
  part.type === `data-${VOICE_NOTE}`;

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Squash `levels` into `bars` buckets (peak per bucket), normalised to 0..1. */
export function toWaveform(levels: number[], bars = 40): number[] {
  if (levels.length === 0) return Array(bars).fill(0.1);
  const out = Array.from({ length: bars }, (_, i) => {
    const from = Math.floor((i * levels.length) / bars);
    const to = Math.max(from + 1, Math.floor(((i + 1) * levels.length) / bars));
    return Math.max(...levels.slice(from, to));
  });
  const peak = Math.max(...out, 1e-6);
  return out.map((v) => Math.max(0.08, v / peak));
}
