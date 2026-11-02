import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { discardRecording, keepRecording } from "./audio-files";
import { toWaveform, type VoiceNote } from "./types";

const SAMPLE_MS = 80;
const MIN_MS = 500;

/** Maps a metering reading in dBFS (-160..0) to 0..1; speech sits roughly in -50..-5. */
export const levelFromDb = (db: number | undefined) =>
  db === undefined || !Number.isFinite(db) ? 0 : Math.min(1, Math.max(0, (db + 50) / 45));

export type RecorderState = "idle" | "starting" | "recording" | "error";

/**
 * Records a voice note with expo-audio: `start()`, then `finish()` for the
 * note or `cancel()` to throw it away. Works on iOS, Android and web (on web
 * only in a secure context: https, localhost or the desktop app).
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const status = useAudioRecorderState(recorder, SAMPLE_MS);
  const [state, setState] = useState<RecorderState>("idle");
  const levels = useRef<number[]>([]);
  const level = levelFromDb(status.metering);

  // Each status tick while recording is one waveform sample.
  useEffect(() => {
    if (state === "recording" && status.isRecording) levels.current.push(level);
  }, [state, status.isRecording, status.durationMillis, level]);

  const start = useCallback(async () => {
    if (state !== "idle" && state !== "error") return;
    setState("starting");
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) throw new Error("microphone permission denied");
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      levels.current = [];
      recorder.record();
      setState("recording");
    } catch {
      setState("error");
    }
  }, [recorder, state]);

  const stop = useCallback(async () => {
    const durationMs = status.durationMillis;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    setState("idle");
    return { uri: recorder.uri, durationMs };
  }, [recorder, status.durationMillis]);

  /** Stops and returns the note, or null if it was too short to keep. */
  const finish = useCallback(async (): Promise<VoiceNote | null> => {
    const { uri, durationMs } = await stop();
    if (!uri) return null;
    if (durationMs < MIN_MS) {
      discardRecording(uri);
      return null;
    }
    return { src: await keepRecording(uri), durationMs, waveform: toWaveform(levels.current) };
  }, [stop]);

  const cancel = useCallback(async () => {
    if (state === "error") return setState("idle");
    const { uri } = await stop();
    if (uri) discardRecording(uri);
  }, [state, stop]);

  return { state, elapsedMs: status.durationMillis, level, start, finish, cancel };
}
