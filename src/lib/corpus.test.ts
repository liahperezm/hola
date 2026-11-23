import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { isDialectCode } from "./dialects";
import { suggestCountry } from "./detect";
import { detectLanguage } from "./detect-language";
import { translateWithDictionary } from "./translate";

/*
 * Every phrase from the user test (research/user-test/personas-*.txt), with
 * what Hola does with it today, kept in research/user-test/approved.txt. Any
 * change shows up here as a diff: if it's an improvement, accept it with
 *
 *   pnpm test -u
 *
 * and commit approved.txt; if not, it's a regression to fix. Add phrases to
 * the personas files whenever something is reported or fixed.
 */

const dir = path.resolve(import.meta.dirname, "../../research/user-test");

function phrases() {
  const out: { country: string; target: string; text: string; scenario: string }[] = [];
  let country = "";
  let target = "";
  let scenario = "";
  for (const file of ["personas-1.txt", "personas-2.txt"]) {
    for (const raw of readFileSync(path.join(dir, file), "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      if (line.startsWith("@")) country = line.slice(1).trim();
      else if (line.startsWith(">")) out.push({ country, target, scenario, text: line.slice(1).split("|")[0].trim() });
      else {
        const parts = line.split("|").map((s) => s.trim());
        scenario = parts[4];
        target = parts[5];
      }
    }
  }
  return out;
}

it("translates every user test phrase as approved", async () => {
  const lines = phrases().map(({ country, target, text, scenario }) => {
    if (country === "FOREIGN") return `${scenario} | ${text} => idioma: ${detectLanguage(text) ?? "?"}`;
    if (!isDialectCode(country) || !isDialectCode(target)) return `${country}→${target} | ${text} => ?`;
    const r = translateWithDictionary(text, country, target);
    const out = r.target.map((s) => s.text).join("");
    const hint = suggestCountry(text, country, target);
    return `${country}→${target} | ${text} => ${out}${hint ? `  [pregunta: ${hint}]` : ""}`;
  });
  await expect(lines.join("\n") + "\n").toMatchFileSnapshot(path.join(dir, "approved.txt"));
});

it("never asks a persona whether they speak another country's Spanish", () => {
  // Each persona speaks their own country's Spanish, so a question is always wrong.
  const asked = phrases()
    .filter(({ country, target }) => isDialectCode(country) && isDialectCode(target))
    .filter(({ country, target, text }) => suggestCountry(text, country as never, target as never))
    .map(({ country, text }) => `${country}: ${text}`);
  expect(asked).toEqual([]);
});
