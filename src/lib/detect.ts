import { DIALECT_CODES, type DialectCode } from "./dialects";
import { allEntries, neutralWords, normalize } from "./dictionary";

/*
 * Which country's Spanish a text is in, from its regional words. A word used
 * in one country counts fully; one shared by several counts a little for
 * each. Standard Spanish words count for nothing.
 */

let index: Map<string, Set<DialectCode>> | null = null;
let longest = 1;

function buildIndex() {
  const standard = new Set(neutralWords().map((w) => normalize(w.text)));
  const map = new Map<string, Set<DialectCode>>();
  for (const entry of allEntries()) {
    const key = normalize(entry.text);
    if (!key || standard.has(key) || entry.dialect === "US") continue;
    const set = map.get(key) ?? new Set<DialectCode>();
    set.add(entry.dialect);
    map.set(key, set);
    longest = Math.max(longest, key.split(" ").length);
  }
  // Words said almost everywhere don't tell countries apart.
  for (const [key, set] of map) {
    if (set.size > DIALECT_CODES.length / 2) map.delete(key);
  }
  return map;
}

function lookup(words: string[]): Set<DialectCode> | undefined {
  index ??= buildIndex();
  const key = words.join(" ");
  const hit = index.get(key);
  if (hit || words.length > 1) return hit;
  // Plurals of single words: "carajitos", "pibes".
  const word = words[0];
  return (
    (word.endsWith("es") ? index.get(word.slice(0, -2)) : undefined) ??
    (word.endsWith("s") ? index.get(word.slice(0, -1)) : undefined)
  );
}

export type Detection = { dialect: DialectCode; words: string[] };

/**
 * The country the text most likely comes from, or null when its words don't
 * say. When `current` scores as well as any other country, it is kept.
 */
export function detectDialect(text: string, current?: DialectCode): Detection | null {
  const tokens = normalize(text).split(" ").filter(Boolean);
  index ??= buildIndex();
  const scores = new Map<DialectCode, number>();
  const evidence = new Map<DialectCode, string[]>();
  let i = 0;
  while (i < tokens.length) {
    let matched = 0;
    for (let n = Math.min(longest, tokens.length - i); n >= 1; n--) {
      const words = tokens.slice(i, i + n);
      const dialects = lookup(words);
      if (!dialects) continue;
      for (const d of dialects) {
        scores.set(d, (scores.get(d) ?? 0) + 1 / dialects.size);
        evidence.set(d, [...(evidence.get(d) ?? []), words.join(" ")]);
      }
      matched = n;
      break;
    }
    i += matched || 1;
  }
  if (scores.size === 0) return null;
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [best, top] = ranked[0];
  if (current && (scores.get(current) ?? 0) >= top - 1e-9) return null;
  // Needs a word only that country uses, or several pointing the same way,
  // and a clear lead over the next country.
  if (top < 0.5) return null;
  const second = ranked[1]?.[1] ?? 0;
  if (top - second < 0.25) return null;
  return { dialect: best, words: evidence.get(best) ?? [] };
}
