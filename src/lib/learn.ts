import { DIALECTS, type DialectCode } from "./dialects";
import type { LanguageCode } from "./languages";
import { allEntries, normalize, type Entry } from "./dictionary";
import type { Segment } from "./translate";

/*
 * Learner mode: English ⇄ the Spanish of one country. Full sentences are
 * translated by the AI (see ai.ts); without it, the dictionary still answers
 * single words and short phrases through each concept's English meaning.
 */

export type LearnDirection = "to-spanish" | "from-spanish";

export type LearnWord = {
  /** The Spanish word or phrase, as used in that country. */
  spanish: string;
  english: string;
  pronunciation?: string;
  /** Dictionary entry, when Hola has a page for it. */
  id?: string;
};

export type LearnResult = {
  direction: LearnDirection;
  dialect: DialectCode;
  /** The other language. */
  language: LanguageCode;
  source: string;
  target: Segment[];
  words: LearnWord[];
  via: "ai" | "dictionary" | "none";
  /** The translation service used, credited under the result. */
  credit?: string;
};

/** "cell phone / mobile" → ["cell phone", "mobile"]; drops notes in brackets. */
function glosses(en: string): string[] {
  return en
    .replace(/\([^)]*\)/g, "")
    .split(/[/,;]| or /)
    .map((g) => normalize(g).replace(/^(a|an|the|to) /, ""))
    .filter((g) => g.length > 1);
}

function wordFor(entry: Entry): LearnWord {
  return {
    spanish: entry.text,
    english: entry.en ?? entry.meaning,
    pronunciation: entry.pronunciation,
    id: entry.id,
  };
}

/** The first word a country uses for each concept, with an English meaning. */
function dialectWords(dialect: DialectCode): Entry[] {
  const seen = new Set<string>();
  return allEntries().filter((e) => {
    if (e.dialect !== dialect || !e.en || e.register || seen.has(e.conceptId)) return false;
    seen.add(e.conceptId);
    return true;
  });
}

/**
 * Dictionary-only answer. English → Spanish: a single word or phrase that
 * matches an English meaning gets the country's word; otherwise the known
 * words found in the sentence are listed. Spanish → English: the country's
 * words found in the text, with their meanings.
 */
export function learnWithDictionary(
  text: string,
  dialect: DialectCode,
  direction: LearnDirection,
  language: LanguageCode = "en",
): LearnResult {
  const words = dialectWords(dialect);
  const query = normalize(text).replace(/^(a|an|the|to) /, "");
  const base = { direction, dialect, language, source: text };
  // The dictionary's meanings are in English; other languages need a service.
  if (language !== "en" && direction === "to-spanish") {
    return { ...base, target: [], words: [], via: "none" };
  }

  if (direction === "to-spanish") {
    const exact = words.find((e) => glosses(e.en ?? "").includes(query));
    if (exact) {
      return { ...base, target: [{ text: exact.text, highlight: true }], words: [wordFor(exact)], via: "dictionary" };
    }
    const padded = ` ${normalize(text)} `;
    const found = words.filter((e) =>
      glosses(e.en ?? "").some((g) => padded.includes(` ${g} `) || padded.includes(` ${g}s `)),
    );
    return { ...base, target: [], words: found.map(wordFor), via: found.length ? "dictionary" : "none" };
  }

  const padded = ` ${normalize(text)} `;
  const found = allEntries().filter(
    (e) => e.dialect === dialect && e.en && padded.includes(` ${normalize(e.text)} `),
  );
  return { ...base, target: [], words: found.map(wordFor), via: found.length ? "dictionary" : "none" };
}

/** Hints for the AI: how this country says things, from Hola's dictionary. */
export function dictionaryHints(dialect: DialectCode, limit = 160): string[] {
  return dialectWords(dialect)
    .slice(0, limit)
    .map((e) => `${e.en} → ${e.text}`);
}

export function speechLangFor(dialect: DialectCode): string {
  return DIALECTS[dialect].speechLang;
}
