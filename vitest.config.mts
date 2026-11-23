import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "test/empty.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // Tests never reach the real storage or services, even on Vercel, where
    // the build has the project's keys. Tests that need one stub it.
    env: {
      BLOB_READ_WRITE_TOKEN: "",
      ANTHROPIC_API_KEY: "",
      DEEPL_API_KEY: "",
      AZURE_TRANSLATOR_KEY: "",
      SUGGESTIONS_GITHUB_TOKEN: "",
      LEARNER_ENGINE: "",
      AI_MODEL: "",
    },
  },
});
