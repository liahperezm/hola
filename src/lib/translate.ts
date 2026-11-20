import { type DialectCode } from "./dialects";
import { entriesFor, equivalent, normalize, type Entry } from "./dictionary";

export type Segment = { text: string; highlight?: boolean };

export type TermRef = { text: string; id?: string };

export type TermPair = { from: TermRef; to: TermRef; meaning: string };

export type Translation = {
  from: DialectCode;
  to: DialectCode;
  source: Segment[];
  target: Segment[];
  pairs: TermPair[];
  via: "dictionary" | "ai" | "none";
};

type Token = { norm: string; start: number; end: number };

type Pattern = { tokens: string[]; entry: Entry };

const WORD = /[\p{L}\p{N}]+/gu;
const EDGE_PUNCTUATION = /^[¿¡\s]+|[?!.\s]+$/g;

function tokenize(text: string): Token[] {
  return [...text.matchAll(WORD)].map((m) => ({
    norm: normalize(m[0]),
    start: m.index,
    end: m.index + m[0].length,
  }));
}

const patternCache = new Map<DialectCode, Pattern[]>();

function patternsFor(dialect: DialectCode): Pattern[] {
  let patterns = patternCache.get(dialect);
  if (!patterns) {
    patterns = entriesFor(dialect)
      .map((entry) => ({ tokens: normalize(entry.text).split(" "), entry }))
      .sort((a, b) => b.tokens.length - a.tokens.length);
    patternCache.set(dialect, patterns);
  }
  return patterns;
}

/** Plural of a single word: "pibe" → "pibes", "gil" → "giles". */
function pluralize(phrase: string): string {
  return phrase
    .split(" ")
    .map((word) => {
      if (/[aeiouáéíóú]$/i.test(word)) return `${word}s`;
      if (/z$/i.test(word)) return `${word.slice(0, -1)}ces`;
      return `${word}es`;
    })
    .join(" ");
}

function matchesWord(token: string, word: string): "exact" | "plural" | null {
  if (token === word) return "exact";
  if (token === `${word}s` || token === `${word}es`) return "plural";
  return null;
}

type Match = { start: number; end: number; entry: Entry; plural: boolean };

function findMatches(text: string, dialect: DialectCode): Match[] {
  const tokens = tokenize(text);
  const patterns = patternsFor(dialect);
  const matches: Match[] = [];
  let i = 0;
  while (i < tokens.length) {
    let found: Match | null = null;
    let length = 0;
    for (const { tokens: words, entry } of patterns) {
      if (i + words.length > tokens.length) continue;
      if (words.length === 1) {
        const kind = matchesWord(tokens[i].norm, words[0]);
        if (!kind) continue;
        found = {
          start: tokens[i].start,
          end: tokens[i].end,
          entry,
          plural: kind === "plural",
        };
        length = 1;
        break;
      }
      if (words.every((w, k) => tokens[i + k].norm === w)) {
        found = {
          start: tokens[i].start,
          end: tokens[i + words.length - 1].end,
          entry,
          plural: false,
        };
        length = words.length;
        break;
      }
    }
    if (found) {
      matches.push(found);
      i += length;
    } else {
      i += 1;
    }
  }
  return matches;
}

function matchCase(replacement: string, original: string): string {
  const first = original.charAt(0);
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** Swaps every regional word or phrase the dictionary knows. */
export function translateWithDictionary(
  text: string,
  from: DialectCode,
  to: DialectCode,
): Translation {
  const matches = findMatches(text, from);
  const source: Segment[] = [];
  const target: Segment[] = [];
  const pairs: TermPair[] = [];
  const seen = new Set<string>();
  let cursor = 0;

  for (const match of matches) {
    const before = text.slice(cursor, match.start);
    if (before) {
      source.push({ text: before });
      target.push({ text: before });
    }
    const original = text.slice(match.start, match.end);
    const { text: word, entry: toEntry } = equivalent(match.entry.conceptId, to);
    const clean = word.replace(EDGE_PUNCTUATION, "");
    const replaced = matchCase(match.plural ? pluralize(clean) : clean, original);
    source.push({ text: original, highlight: true });
    target.push({ text: replaced, highlight: true });

    if (!seen.has(match.entry.id)) {
      seen.add(match.entry.id);
      pairs.push({
        from: { text: match.entry.text, id: match.entry.id },
        to: { text: word, id: toEntry?.id },
        meaning: match.entry.meaning,
      });
    }
    cursor = match.end;
  }

  const rest = text.slice(cursor);
  if (rest) {
    source.push({ text: rest });
    target.push({ text: rest });
  }

  return {
    from,
    to,
    source,
    target,
    pairs,
    via: pairs.length > 0 ? "dictionary" : "none",
  };
}
