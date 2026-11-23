import { defineConfig } from "vitest/config";
import path from "node:path";

// Runs the user test in research/ (not part of pnpm test).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "../src"),
      "server-only": path.resolve(import.meta.dirname, "../test/empty.ts"),
    },
  },
  test: { include: ["research/**/*.run.ts"], root: path.resolve(import.meta.dirname, "..") },
});
