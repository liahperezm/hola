import type { DialectCode } from "./dialects";
import { normalize } from "./dictionary";
import { SAYINGS } from "./sayings.generated";

/** A fixed saying ("a caballo regalado no se le mira el diente"). */
export type Saying = {
  text: string;
  /** Where it is said; empty means everywhere. */
  countries: DialectCode[];
  /** What it means, in Spanish and in English. */
  es: string;
  en: string;
};

export type SayingMatch = {
  start: number;
  end: number;
  saying: Saying;
  /** What the target country reads: its own saying, or the meaning. */
  replacement: string;
};

/** The saying's address: "a-caballo-regalado-no-se-le-mira-el-diente". */
export function sayingSlug(saying: Saying): string {
  return normalize(saying.text).replace(/\s+/g, "-");
}

export function allSayings(): Saying[] {
  return [...SAYINGS].sort((a, b) => a.text.localeCompare(b.text, "es"));
}

export function getSaying(slug: string): Saying | undefined {
  return SAYINGS.find((s) => sayingSlug(s) === slug);
}

/** Other sayings that mean the same ("a quien madruga…" and "el que madruga…"). */
export function sameMeaning(saying: Saying): Saying[] {
  return SAYINGS.filter((s) => s.en === saying.en && s.text !== saying.text);
}

const ARTICLES = new Set(["el", "la", "lo", "los", "las"]);

/**
 * A word as it sounds, so spoken spellings match the written saying:
 * "regalao" is "regalado", "lo diente" is "el diente", "miran" is "mira",
 * "pa'" is "para".
 */
function loose(word: string): string {
  let w = normalize(word);
  if (ARTICLES.has(w)) return "el";
  if (w === "pa") return "para";
  w = w.replace(/ado$/, "ao").replace(/ido$/, "io");
  if (w.length > 3) w = w.replace(/[sn]$/, "");
  return w.replace(/d$/, "");
}

const WORD = /[\p{L}\p{N}]+/gu;

const PATTERNS = SAYINGS.map((saying) => ({
  saying,
  words: (saying.text.match(WORD) ?? []).map(loose),
})).sort((a, b) => b.words.length - a.words.length);

/**
 * What the listener in `to` should read: the country's own saying when it has
 * a different one ("a quien madruga, Dios le ayuda" in Spain), or else what
 * the saying means, in plain words.
 */
function forListener(saying: Saying, to: DialectCode): string {
  const said = (s: Saying) => s.countries.length === 0 || s.countries.includes(to);
  const others = SAYINGS.filter((s) => s.en === saying.en && s.text !== saying.text);
  const own = others.find((s) => s.countries.includes(to)) ?? others.find(said);
  return own?.text ?? saying.es;
}

/**
 * Sayings in a text, however they are spelled. Long sayings may differ in one
 * word ("se le miran", "un diente"), since people say them a little
 * differently everywhere.
 */
export function findSayings(text: string, to: DialectCode): SayingMatch[] {
  const tokens = [...text.matchAll(WORD)].map((m) => ({
    word: loose(m[0]),
    start: m.index,
    end: m.index + m[0].length,
  }));
  const found: SayingMatch[] = [];
  let i = 0;
  while (i < tokens.length) {
    let hit: { saying: Saying; length: number } | null = null;
    for (const { saying, words } of PATTERNS) {
      if (i + words.length > tokens.length) continue;
      const misses = words.filter((w, k) => tokens[i + k].word !== w).length;
      const allowed = words.length >= 6 ? 1 : 0;
      // The first two words must match, so a sentence isn't taken for a saying.
      if (misses <= allowed && tokens[i].word === words[0] && tokens[i + 1]?.word === words[1]) {
        hit = { saying, length: words.length };
        break;
      }
    }
    if (hit) {
      found.push({
        start: tokens[i].start,
        end: tokens[i + hit.length - 1].end,
        saying: hit.saying,
        replacement: forListener(hit.saying, to),
      });
      i += hit.length;
    } else {
      i += 1;
    }
  }
  return found;
}
