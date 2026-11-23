// Builds the browser extension from the same code and dictionary as the app:
// bundles extension-src/ into extension-build/ (with the static files from
// extension/ and a version stamped from the date), and zips it into
// public/hola-extension.zip for download. Runs on every deploy (pnpm build).
import { build } from "esbuild";
import { zipSync } from "fflate";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const out = "extension-build";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const name of readdirSync("extension")) {
  if (name !== "README.md") cpSync(path.join("extension", name), path.join(out, name), { recursive: true });
}

await build({
  entryPoints: { content: "extension-src/content.ts", popup: "extension-src/popup.ts" },
  outdir: path.join(out, "dist"),
  bundle: true,
  format: "iife",
  target: ["chrome120", "safari17"],
  minify: true,
  legalComments: "none",
});

// Chrome's versions are up to four numbers under 65536: major.minor.day.build,
// where day counts from 2026-01-01, so each day's build is newer.
const manifestPath = path.join(out, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const [major, minor] = manifest.version.split(".");
const now = new Date();
const day = Math.floor((now - Date.UTC(2026, 0, 1)) / 86_400_000);
const minute = now.getUTCHours() * 60 + now.getUTCMinutes();
manifest.version = `${major}.${minor}.${day}.${minute}`;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

const files = {};
(function add(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) add(full);
    else files[path.relative(out, full)] = readFileSync(full);
  }
})(out);
writeFileSync("public/hola-extension.zip", zipSync(files, { level: 9 }));
console.log(`Extension ${manifest.version} built in ${out}/ and zipped to public/hola-extension.zip`);
