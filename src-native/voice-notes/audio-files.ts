import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

/**
 * Moves a fresh native recording out of the cache into the documents
 * folder, so the note survives cache clears. On web the recorder hands back
 * a `blob:` URL that dies with the page, so it becomes a `data:` URL instead.
 */
export async function keepRecording(uri: string): Promise<string> {
  if (Platform.OS === "web") return blobToDataUrl(await (await fetch(uri)).blob());
  const dir = new Directory(Paths.document, "voice-notes");
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(uri);
  file.move(dir);
  return file.uri;
}

/** Deletes a recording the user discarded. Web blobs need no cleanup. */
export function discardRecording(uri: string) {
  if (Platform.OS === "web") return;
  const file = new File(uri);
  if (file.exists) file.delete();
}

/**
 * Something the native player can open. Native players do not read `data:`
 * URLs, so those are written to the cache once (keyed by `cacheKey`) and
 * played from there; everything else plays as is.
 */
export async function playableUri(src: string, cacheKey: string): Promise<string> {
  if (Platform.OS === "web" || !src.startsWith("data:")) return src;
  const [header = "", payload = ""] = src.split(",", 2);
  const ext = /audio\/(\w+)/.exec(header)?.[1] ?? "bin";
  const file = new File(Paths.cache, `voice-note-${cacheKey}.${ext}`);
  if (!file.exists) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    file.write(bytes);
  }
  return file.uri;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("could not read the recording"));
    reader.readAsDataURL(blob);
  });
}
