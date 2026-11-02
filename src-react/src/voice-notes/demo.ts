import type { NewMessage } from "@/store/chat";
import { toWaveform, voiceNotePart, type VoiceNote } from "./types";

/** Small deterministic PRNG so demo notes look the same every time. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

/**
 * Synthesises a short, speech-like WAV (pitched tones in syllable-shaped bursts)
 * so demo voice notes are playable without shipping audio files.
 */
export function synthVoiceNote(seconds: number, seed: number, pitch = 170): VoiceNote {
  const rate = 8000;
  const n = Math.round(seconds * rate);
  const rand = rng(seed);

  // Syllables: bursts of 120–280 ms separated by short gaps, with longer pauses now and then.
  const envelope = new Float32Array(n);
  for (let t = Math.round(0.15 * rate); t < n - rate * 0.2; ) {
    const len = Math.round((0.12 + rand() * 0.16) * rate);
    const peak = 0.5 + rand() * 0.5;
    for (let i = 0; i < len && t + i < n; i++) envelope[t + i] = peak * Math.sin((Math.PI * i) / len);
    t += len + Math.round((rand() < 0.15 ? 0.3 : 0.04 + rand() * 0.06) * rate);
  }

  const samples = new Uint8Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const f0 = pitch * (1 + 0.08 * Math.sin((2 * Math.PI * i) / (rate * 0.9)));
    phase += (2 * Math.PI * f0) / rate;
    const voice = 0.6 * Math.sin(phase) + 0.25 * Math.sin(2 * phase) + 0.15 * Math.sin(3 * phase);
    samples[i] = 128 + Math.round(90 * envelope[i] * voice);
  }

  const levels: number[] = [];
  const step = Math.round(rate * 0.08);
  for (let i = 0; i < n; i += step) levels.push(Math.max(...envelope.subarray(i, i + step)));

  return { src: wavDataUrl(samples, rate), durationMs: Math.round(seconds * 1000), waveform: toWaveform(levels) };
}

function wavDataUrl(samples: Uint8Array, rate: number) {
  const header = new DataView(new ArrayBuffer(44));
  const text = (o: number, s: string) => [...s].forEach((c, i) => header.setUint8(o + i, c.charCodeAt(0)));
  text(0, "RIFF");
  header.setUint32(4, 36 + samples.length, true);
  text(8, "WAVE");
  text(12, "fmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true); // PCM
  header.setUint16(22, 1, true); // mono
  header.setUint32(24, rate, true);
  header.setUint32(28, rate, true); // byte rate (8-bit mono)
  header.setUint16(32, 1, true);
  header.setUint16(34, 8, true);
  text(36, "data");
  header.setUint32(40, samples.length, true);
  const bytes = new Uint8Array(44 + samples.length);
  bytes.set(new Uint8Array(header.buffer), 0);
  bytes.set(samples, 44);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

/** A short sample conversation with voice notes on both sides. */
export function demoConversation(): NewMessage[] {
  const t = Date.now() - 10 * 60 * 1000;
  return [
    { role: "user", content: "hey chottu 👋", createdAt: t },
    { role: "assistant", content: "Hey! What can I do for you?", createdAt: t + 20_000 },
    { role: "user", content: [voiceNotePart(synthVoiceNote(6, 7, 190))], createdAt: t + 60_000 },
    { role: "assistant", content: [voiceNotePart(synthVoiceNote(9, 21, 130))], createdAt: t + 90_000 },
    { role: "assistant", content: "Done. I'll remind you at **6 pm** to pick up the groceries.", createdAt: t + 95_000 },
    { role: "user", content: [voiceNotePart(synthVoiceNote(3, 42, 200))], createdAt: t + 180_000 },
    { role: "assistant", content: "Haha, anytime 🙌", createdAt: t + 200_000 },
  ];
}
