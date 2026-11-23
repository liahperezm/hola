/*
 * Runs every persona's phrases through Hola's free engine (dictionary,
 * dichos, sayings, detection) and writes results.json and results.md.
 *
 *   npx vitest run --config research/vitest.config.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { it } from "vitest";
import { isDialectCode, type DialectCode } from "@/lib/dialects";
import { suggestCountry } from "@/lib/detect";
import { detectLanguage } from "@/lib/detect-language";
import { knownEntry, normalize } from "@/lib/dictionary";
import { learnWithDictionary } from "@/lib/learn";
import { isLanguageCode } from "@/lib/languages";
import { translateWithDictionary, worthAskingAi } from "@/lib/translate";

const dir = path.resolve(import.meta.dirname);
type Phrase = { text: string; expect: string[] };
type Persona = { country: string; name: string; age: number; city: string; role: string; scenario: string; target: string; phrases: Phrase[] };

function load(): Persona[] {
  const personas: Persona[] = [];
  let country = "";
  for (const file of ["personas-1.txt", "personas-2.txt"]) {
    for (const raw of readFileSync(path.join(dir, file), "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      if (line.startsWith("@")) country = line.slice(1).trim();
      else if (line.startsWith(">")) {
        const [text, expect = ""] = line.slice(1).split("|").map((s) => s.trim());
        personas.at(-1)!.phrases.push({ text, expect: expect.split(";").map((s) => s.trim()).filter(Boolean) });
      } else {
        const [name, age, city, role, scenario, target] = line.split("|").map((s) => s.trim());
        personas.push({ country, name, age: Number(age), city, role, scenario, target, phrases: [] });
      }
    }
  }
  return personas;
}

const join = (s: { text: string }[]) => s.map((x) => x.text).join("");

it("runs the personas", () => {
  const personas = load();
  const rows: Record<string, unknown>[] = [];
  for (const p of personas) {
    for (const phrase of p.phrases) {
      if (p.country === "FOREIGN") {
        const [lang, dialect] = p.scenario.split(":");
        const detected = detectLanguage(phrase.text);
        const learned =
          isLanguageCode(lang) && isDialectCode(dialect)
            ? learnWithDictionary(phrase.text, dialect, "to-spanish", lang)
            : null;
        rows.push({
          persona: p.name, country: "FOREIGN", language: lang, dialect, text: phrase.text,
          detectedLanguage: detected, languageOk: detected === lang,
          offline: learned ? join(learned.target) : "", needsService: Boolean(learned && learned.target.length === 0),
        });
        continue;
      }
      const from = p.country as DialectCode;
      const to = p.target as DialectCode;
      const r = translateWithDictionary(phrase.text, from, to);
      const found = r.pairs.map((x) => normalize(x.from.text));
      const sourceHits = r.source.filter((s) => s.highlight).map((s) => normalize(s.text));
      const missed = phrase.expect.filter((w) => {
        const k = normalize(w);
        return !found.some((f) => f.includes(k) || k.includes(f)) && !sourceHits.some((f) => f.includes(k) || k.includes(f));
      });
      // Not swapped because the target says it the same is fine; a gap is a
      // word the source country's dictionary doesn't have.
      const gaps = missed.filter((w) => knownEntry(w, from)?.dialect !== from);
      const otherCountry = suggestCountry(phrase.text, from, to);
      const language = detectLanguage(phrase.text);
      rows.push({
        persona: p.name, country: from, target: to, scenario: p.scenario, text: phrase.text,
        output: join(r.target), via: r.via, expected: phrase.expect, missed: gaps, shared: missed.filter((w) => !gaps.includes(w)),
        wrongCountryHint: otherCountry,
        wrongLanguageHint: language && language !== "es" ? language : null,
        wouldAskAi: r.via === "none" && worthAskingAi(phrase.text),
      });
    }
  }
  writeFileSync(path.join(dir, "results.json"), JSON.stringify(rows, null, 2));

  const spanish = rows.filter((r) => r.country !== "FOREIGN");
  const expected = spanish.reduce((n, r) => n + (r.expected as string[]).length, 0);
  const missed = spanish.reduce((n, r) => n + (r.missed as string[]).length, 0);
  const byCountry = new Map<string, { exp: number; miss: number; words: string[] }>();
  for (const r of spanish) {
    const c = byCountry.get(r.country as string) ?? { exp: 0, miss: 0, words: [] };
    c.exp += (r.expected as string[]).length;
    c.miss += (r.missed as string[]).length;
    c.words.push(...(r.missed as string[]));
    byCountry.set(r.country as string, c);
  }
  const lines = [
    `Personas: ${personas.length}. Phrases: ${rows.length}.`,
    `Regional words expected: ${expected}; recognized: ${expected - missed} (${Math.round(((expected - missed) / expected) * 100)}%).`,
    `Wrong country hints: ${spanish.filter((r) => r.wrongCountryHint).length}. Wrong language hints: ${spanish.filter((r) => r.wrongLanguageHint).length}. Would ask the AI: ${spanish.filter((r) => r.wouldAskAi).length}.`,
    "",
    ...[...byCountry].map(([c, v]) => `${c}: ${v.exp - v.miss}/${v.exp}  missed: ${v.words.join(", ") || "-"}`),
    "",
    "Wrong hints:",
    ...spanish.filter((r) => r.wrongCountryHint || r.wrongLanguageHint).map((r) => `  ${r.country} «${r.text}» → ${r.wrongCountryHint ?? r.wrongLanguageHint}`),
    "",
    "Foreign speakers:",
    ...rows.filter((r) => r.country === "FOREIGN").map((r) => `  ${r.language}→${r.dialect} «${r.text}» detected=${r.detectedLanguage} ok=${r.languageOk} offline="${r.offline}"`),
  ];
  writeFileSync(path.join(dir, "summary.txt"), lines.join("\n") + "\n");
});
