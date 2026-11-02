/**
 * A random unique id. `crypto.randomUUID` exists only in secure contexts
 * (https, localhost), and Hermes ships no `crypto` at all, so fall back to
 * `getRandomValues` and then to `Math.random`. Ids only need to be unique
 * within one chat, not unguessable.
 */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof c?.getRandomValues === "function") c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
