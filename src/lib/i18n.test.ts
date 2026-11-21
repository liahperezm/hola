import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDES } from "./dictionary";
import { EN } from "./i18n-en";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}

describe("English for learners", () => {
  it("has English for every t(\"…\") in the app", () => {
    const src = path.resolve(import.meta.dirname, "..");
    const keys = new Set<string>();
    for (const file of files(src)) {
      for (const m of readFileSync(file, "utf8").matchAll(/\bt\(\s*"((?:[^"\\]|\\.)+)"/g)) {
        keys.add(JSON.parse(`"${m[1]}"`));
      }
    }
    // Text passed through props and translated where it is shown.
    for (const g of GUIDES) keys.add(g.title).add(g.subtitle);
    for (const k of ["Definición", "Origen", "Otros países", "Traducir", "Explorar", "Favoritos",
      "Preferencias", "Busca una palabra o frase", "Busca en esta guía", "Busca en tus favoritos",
      "¿Algo no suena bien? Sugiere un cambio", "¿Falta esta palabra? Sugiérela",
      "Sugerir un cambio", "Instala Hola en tu teléfono", "¿Qué español quieres aprender?",
      "Traducir de", "Traducir a", "normal", "lenta"]) keys.add(k);
    const missing = [...keys].filter((k) => !(k in EN));
    expect(missing).toEqual([]);
  });
});
