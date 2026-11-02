import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests cover the stores, backend and helpers: plain TypeScript, no
// React Native renderer needed.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { include: ["**/*.test.ts"], exclude: ["node_modules/**"] },
});
