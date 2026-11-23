// Bundles the extension's scripts (with Hola's dictionary) into extension/dist
// and zips the extension into public/hola-extension.zip for download.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

await build({
  entryPoints: { content: "extension-src/content.ts", popup: "extension-src/popup.ts" },
  outdir: "extension/dist",
  bundle: true,
  format: "iife",
  target: ["chrome120", "safari17"],
  minify: true,
  legalComments: "none",
});
rmSync("public/hola-extension.zip", { force: true });
execFileSync("zip", ["-qr", "../public/hola-extension.zip", ".", "-x", ".*", "README.md"], { cwd: "extension" });
console.log("extension/dist built, public/hola-extension.zip written");
