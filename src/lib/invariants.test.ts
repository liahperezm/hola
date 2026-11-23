import { describe, expect, it } from "vitest";
import { PICKABLE_DIALECTS, type DialectCode } from "./dialects";
import { suggestCountry } from "./detect";
import { detectLanguage } from "./detect-language";
import { allEntries, normalize } from "./dictionary";
import { translateWithDictionary } from "./translate";

/*
 * Checks over every word in the dictionary, so they grow with it: each word's
 * example sentence, typed as that word's country, must be understood as that
 * country's Spanish and translate cleanly.
 */

const entries = allEntries().filter((e) => e.example && e.dialect !== "US");
// A few other countries per word, different for each, to cover every pair over the whole dictionary.
const targetsFor = (i: number, from: DialectCode) =>
  [0, 7, 13].map((k) => PICKABLE_DIALECTS[(i + k) % PICKABLE_DIALECTS.length]).filter((d) => d !== from);

describe("every word's example sentence", () => {
  it("never makes Hola ask whether it's another country's Spanish", () => {
    const wrong = entries.flatMap((e, i) =>
      targetsFor(i, e.dialect)
        .map((to) => [to, suggestCountry(e.example!, e.dialect, to)] as const)
        .filter(([, hint]) => hint)
        .map(([to, hint]) => `${e.id} → ${to}: «${e.example}» asks about ${hint}`),
    );
    expect(wrong).toEqual([]);
  });

  it("is never taken for another language", () => {
    const wrong = entries
      .map((e) => [e, detectLanguage(e.example!)] as const)
      .filter(([, lang]) => lang && lang !== "es")
      .map(([e, lang]) => `${e.id}: «${e.example}» looks like ${lang}`);
    expect(wrong).toEqual([]);
  });

  it("never comes out vulgar when the word isn't", () => {
    const vulgar = new Set(
      allEntries()
        .filter((e) => e.register)
        .map((e) => normalize(e.text)),
    );
    const wrong = entries
      .filter((e) => !e.register)
      .flatMap((e, i) =>
        targetsFor(i, e.dialect).flatMap((to) => {
          const r = translateWithDictionary(e.example!, e.dialect, to);
          const swappedIn = r.target.filter((s) => s.highlight).map((s) => normalize(s.text));
          return swappedIn
            .filter((w) => vulgar.has(w) && !r.warnings.length)
            .map((w) => `${e.id} → ${to}: «${e.example}» brings in «${w}»`);
        }),
      );
    expect(wrong).toEqual([]);
  });
});
