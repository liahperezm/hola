import { DIALECTS, type DialectCode } from "./dialects";
import { entriesFor, equivalent, normalize, plainWordsFor, type Entry } from "./dictionary";
import { findFalseFriends, type FalseFriendWarning } from "./false-friends";
import {
  agreeAfter,
  agreeBefore,
  fixAccents,
  genderFromArticle,
  nounGender,
  type Gender,
} from "./grammar";

export type Segment = { text: string; highlight?: boolean };

export type TermRef = { text: string; id?: string };

export type TermPair = { from: TermRef; to: TermRef; meaning: string };

export type Translation = {
  from: DialectCode;
  to: DialectCode;
  source: Segment[];
  target: Segment[];
  pairs: TermPair[];
  /** Words in the text that are vulgar or offensive in the target country. */
  warnings: FalseFriendWarning[];
  via: "dictionary" | "ai" | "none";
};

type Token = { norm: string; start: number; end: number };

/**
 * A word to look for: a dialect's own word (with its entry) or the plain
 * Spanish word for an everyday object the dialect has no word of its own for.
 */
type Pattern = {
  tokens: string[];
  conceptId: string;
  text: string;
  meaning: string;
  entry?: Entry;
};

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
    const own: Pattern[] = entriesFor(dialect).map((entry) => ({
      tokens: normalize(entry.text).split(" "),
      conceptId: entry.conceptId,
      text: entry.text,
      meaning: entry.meaning,
      entry,
    }));
    const plain: Pattern[] = plainWordsFor(dialect).map((w) => ({
      tokens: normalize(w.text).split(" "),
      conceptId: w.conceptId,
      text: w.text,
      meaning: w.meaning,
    }));
    // Longest first; on a tie the dialect's own word wins (stable sort).
    patterns = [...own, ...plain].sort((a, b) => b.tokens.length - a.tokens.length);
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

type Match = { start: number; end: number; pattern: Pattern; plural: boolean };

function findMatches(text: string, dialect: DialectCode): Match[] {
  const tokens = tokenize(text);
  const patterns = patternsFor(dialect);
  const matches: Match[] = [];
  let i = 0;
  while (i < tokens.length) {
    let found: Match | null = null;
    let length = 0;
    for (const pattern of patterns) {
      const words = pattern.tokens;
      if (i + words.length > tokens.length) continue;
      if (words.length === 1) {
        const kind = matchesWord(tokens[i].norm, words[0]);
        if (!kind) continue;
        found = {
          start: tokens[i].start,
          end: tokens[i].end,
          pattern,
          plural: kind === "plural",
        };
        length = 1;
        break;
      }
      if (words.every((w, k) => tokens[i + k].norm === w)) {
        found = {
          start: tokens[i].start,
          end: tokens[i + words.length - 1].end,
          pattern,
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

type Edit =
  | { kind: "word"; start: number; end: number; match: Match }
  | { kind: "false-friend"; start: number; end: number; friend: FalseFriendWarning };

/**
 * Swaps every regional word or phrase the dictionary knows, and writes words
 * that mean something else there as the listener would hear them: "Voy a
 * coger un taxi" for Uruguay becomes "Voy a tener sexo con un taxi".
 */
export function translateWithDictionary(
  text: string,
  from: DialectCode,
  to: DialectCode,
): Translation {
  const friends = findFalseFriends(text, from, to);
  const overlaps = (m: Match) => friends.some((f) => m.start < f.end && m.end > f.start);
  const edits: Edit[] = [
    ...friends.map((friend) => ({
      kind: "false-friend" as const,
      start: friend.start,
      end: friend.end,
      friend,
    })),
    ...findMatches(text, from)
      .filter((m) => !overlaps(m))
      .map((match) => ({ kind: "word" as const, start: match.start, end: match.end, match })),
  ].sort((x, y) => x.start - y.start);

  const source: Segment[] = [];
  const target: Segment[] = [];
  // For each target segment, the gender change a swapped noun brought, so the
  // words around it can agree afterwards.
  const shifts: ({ from: Gender; to: Gender } | null)[] = [];
  const pushTarget = (segment: Segment, shift: { from?: Gender; to?: Gender } | null = null) => {
    target.push(segment);
    shifts.push(shift?.from && shift.to && shift.from !== shift.to ? { from: shift.from, to: shift.to } : null);
  };
  const pairs: TermPair[] = [];
  const seen = new Set<string>();
  let cursor = 0;

  for (const edit of edits) {
    const before = text.slice(cursor, edit.start);
    const original = text.slice(edit.start, edit.end);
    cursor = edit.end;

    if (edit.kind === "false-friend") {
      const { friend } = edit;
      if (before) {
        source.push({ text: before });
        pushTarget({ text: before });
      }
      source.push({ text: original, highlight: true });
      pushTarget(
        { text: matchCase(friend.literal, original), highlight: true },
        friend.gender && {
          from: genderFromArticle(before) ?? nounGender(original),
          to: friend.gender,
        },
      );
      const key = `ff.${normalize(original)}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({
          from: { text: original.toLowerCase() },
          to: { text: friend.literal },
          meaning: `${friend.meaning} (vulgar en ${DIALECTS[to].name})`,
        });
      }
      continue;
    }

    if (before) {
      source.push({ text: before });
      pushTarget({ text: before });
    }
    const { match } = edit;
    const { pattern } = match;
    const { text: word, entry: toEntry } = equivalent(pattern.conceptId, to);
    const clean = word.replace(EDGE_PUNCTUATION, "");
    const replaced = matchCase(match.plural ? pluralize(clean) : clean, original);

    // A plain word the other country also uses stays as ordinary text.
    if (!pattern.entry && normalize(clean) === normalize(pattern.text)) {
      source.push({ text: original });
      pushTarget({ text: original });
      continue;
    }
    source.push({ text: original, highlight: true });
    pushTarget(
      { text: replaced, highlight: true },
      { from: genderFromArticle(before) ?? nounGender(original), to: nounGender(clean) },
    );

    const key = pattern.entry?.id ?? `plain.${pattern.conceptId}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({
        from: { text: pattern.text, id: pattern.entry?.id },
        to: { text: word, id: toEntry?.id },
        meaning: pattern.meaning,
      });
    }
  }

  const rest = text.slice(cursor);
  if (rest) {
    source.push({ text: rest });
    pushTarget({ text: rest });
  }

  // Make articles and adjectives agree with swapped nouns of the other gender
  // ("la pajita roja" → "el carrizo rojo"), then restore missing accents in
  // the words that were not swapped ("plastico" → "plástico").
  shifts.forEach((shift, i) => {
    if (!shift) return;
    const prev = target[i - 1];
    const next = target[i + 1];
    if (prev && !prev.highlight) prev.text = agreeBefore(prev.text, shift.from, shift.to);
    if (next && !next.highlight) next.text = agreeAfter(next.text, shift.from, shift.to);
  });
  for (const segment of target) {
    if (!segment.highlight) segment.text = fixAccents(segment.text);
  }

  return {
    from,
    to,
    source,
    target,
    pairs,
    warnings: friends,
    via: pairs.length > 0 ? "dictionary" : "none",
  };
}
