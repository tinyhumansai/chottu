import { useCallback, useEffect, useRef, useState } from "react";
import { toWaveform, type VoiceNote } from "./types";

const MAX_MS = 2 * 60 * 1000;
const SAMPLE_MS = 80;

/**
 * Microphone recording needs a secure context (https, localhost or the Tauri
 * webview). Over plain http, `navigator.mediaDevices` does not exist.
 */
export const canRecord = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getUserMedia === "function" &&
  typeof MediaRecorder !== "undefined";

const pickMimeType = () =>
  ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

type Session = {
  recorder: MediaRecorder;
  stream: MediaStream;
  ctx: AudioContext;
  sampler: ReturnType<typeof setInterval>;
  levels: number[];
  startedAt: number;
};

export type RecorderState = "idle" | "starting" | "recording" | "error";

/** Records a voice note: start(), then finish() for the note or cancel() to throw it away. */
export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const session = useRef<Session | null>(null);

  const teardown = useCallback(() => {
    const s = session.current;
    if (!s) return;
    clearInterval(s.sampler);
    s.stream.getTracks().forEach((t) => t.stop());
    void s.ctx.close();
    session.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(async () => {
    if (session.current || !canRecord()) return;
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const levels: number[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() || undefined });
      const startedAt = Date.now();
      const sampler = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        const rms = Math.sqrt(sum / buf.length);
        levels.push(rms);
        setLevel(rms);
        const elapsed = Date.now() - startedAt;
        setElapsedMs(elapsed);
        if (elapsed >= MAX_MS && recorder.state === "recording") recorder.requestData();
      }, SAMPLE_MS);
      recorder.start();
      session.current = { recorder, stream, ctx, sampler, levels, startedAt };
      setElapsedMs(0);
      setState("recording");
    } catch (err) {
      console.warn("voice note: microphone unavailable", err);
      teardown();
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [teardown]);

  const cancel = useCallback(() => {
    const s = session.current;
    if (s && s.recorder.state !== "inactive") s.recorder.stop();
    teardown();
    setState("idle");
  }, [teardown]);

  const finish = useCallback(async (): Promise<VoiceNote | null> => {
    const s = session.current;
    if (!s) return null;
    const durationMs = Date.now() - s.startedAt;
    const chunks: Blob[] = [];
    s.recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    const stopped = new Promise<void>((resolve) => (s.recorder.onstop = () => resolve()));
    s.recorder.stop();
    await stopped;
    const levels = s.levels;
    const type = s.recorder.mimeType;
    teardown();
    setState("idle");
    if (durationMs < 500 || chunks.length === 0) return null;
    return { src: await toDataUrl(new Blob(chunks, { type })), durationMs, waveform: toWaveform(levels) };
  }, [teardown]);

  return { state, elapsedMs, level, start, cancel, finish };
}
