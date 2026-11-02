/**
 * A random unique id. `crypto.randomUUID` exists only in secure contexts
 * (https, localhost, the Tauri webview), so fall back to `getRandomValues`,
 * which works everywhere, when the app is served over plain http.
 */
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
