import { DIALECTS, PICKABLE_DIALECTS, type DialectCode } from "./dialects";
import {
  ADJECTIVE_CONCEPTS,
  entriesFor,
  equivalent,
  conceptMeaning,
  neutralWords,
  normalize,
  plainWordsFor,
  type Entry,
} from "./dictionary";
import { findFalseFriends, type FalseFriendWarning } from "./false-friends";
import { findSayings, type SayingMatch } from "./sayings";
import {
  agreeAfter,
  agreeBefore,
  fixAccents,
  formFromArticle,
  nounGender,
  nounNumber,
  type Gender,
  type NounForm,
} from "./grammar";

export type Segment = { text: string; highlight?: boolean };

export type TermRef = { text: string; id?: string };

export type TermPair = {
  from: TermRef;
  to: TermRef;
  meaning: string;
  /** In English, for learners. */
  en?: string;
};

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
  en?: string;
  entry?: Entry;
  /** The feminine form of an adjective ("chida" for "chido"). */
  feminine?: boolean;
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

/** Where a text comes from: a country, or standard Spanish (learner mode). */
type Source = DialectCode | "neutral";

const patternCache = new Map<Source, Pattern[]>();

function patternsFor(dialect: Source): Pattern[] {
  let patterns = patternCache.get(dialect);
  if (!patterns && dialect === "neutral") {
    patterns = neutralWords()
      .map((w) => ({
        tokens: normalize(w.text).split(" "),
        conceptId: w.conceptId,
        text: w.text,
        meaning: w.meaning,
        en: w.en,
      }))
      .sort((a, b) => b.tokens.length - a.tokens.length);
    patternCache.set(dialect, patterns);
  }
  if (!patterns) {
    dialect = dialect as DialectCode;
    const own: Pattern[] = entriesFor(dialect).flatMap((entry) => {
      const pattern: Pattern = {
        tokens: normalize(entry.text).split(" "),
        conceptId: entry.conceptId,
        text: entry.text,
        meaning: entry.meaning,
        en: entry.en,
        entry,
      };
      // Adjectives also match their feminine form: "chida", "nítida".
      const last = pattern.tokens.at(-1) ?? "";
      if (!ADJECTIVE_CONCEPTS.has(entry.conceptId) || !last.endsWith("o")) return [pattern];
      return [
        pattern,
        { ...pattern, tokens: [...pattern.tokens.slice(0, -1), `${last.slice(0, -1)}a`], feminine: true },
      ];
    });
    const plain: Pattern[] = plainWordsFor(dialect).map((w) => ({
      tokens: normalize(w.text).split(" "),
      conceptId: w.conceptId,
      text: w.text,
      meaning: w.meaning,
      en: w.en,
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
  // "gurí" → "gurises"
  if (/[iu]$/.test(word) && token === `${word}ses`) return "plural";
  return null;
}

type Match = { start: number; end: number; pattern: Pattern; plural: boolean };

/**
 * Patterns by their first word, so each word of the text is only compared
 * with the phrases that could start there (and in the dictionary's order:
 * longest first). A plural like "camiones" looks under "camion" too.
 */
const indexCache = new Map<Source, Map<string, number[]>>();

function candidates(dialect: Source, token: string): Pattern[] {
  const patterns = patternsFor(dialect);
  let index = indexCache.get(dialect);
  if (!index) {
    index = new Map();
    patterns.forEach((p, i) => {
      const first = p.tokens[0] ?? "";
      index!.set(first, [...(index!.get(first) ?? []), i]);
    });
    indexCache.set(dialect, index);
  }
  const keys = new Set([token, token.replace(/s$/, ""), token.replace(/es$/, ""), token.replace(/ses$/, "")]);
  const found: number[] = [];
  for (const key of keys) found.push(...(index.get(key) ?? []));
  return found.sort((a, b) => a - b).map((i) => patterns[i]);
}

function findMatches(text: string, dialect: Source): Match[] {
  const tokens = tokenize(text);
  const matches: Match[] = [];
  let i = 0;
  while (i < tokens.length) {
    let found: Match | null = null;
    let length = 0;
    for (const pattern of candidates(dialect, tokens[i].norm)) {
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

/** Words for people: their gender is the person's, not the word's. */
const PERSON_CONCEPTS = new Set([
  "nino", "bebe", "amigo", "novio", "tipo", "policia", "rubio", "esnob", "tonto",
  "chismoso", "tacano", "borracho", "hermano", "picaro", "extranjero", "chanta",
]);

/** The article of the last noun in the sentence so far: "la fiesta estuvo …". */
function subjectForm(before: string): NounForm | undefined {
  const sentence = before.split(/[.!?¡¿]/).at(-1) ?? "";
  const articles = [...sentence.matchAll(/\b(el|la|los|las|un|una|unos|unas|ese|esa|esos|esas|este|esta|estos|estas|mi|mis)\b/gi)];
  const last = articles.at(-1);
  if (!last) return undefined;
  const form = formFromArticle(`${last[0]} `);
  return form.gender || form.number === "p" ? { gender: form.gender, number: form.number ?? "s" } : undefined;
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
  | { kind: "false-friend"; start: number; end: number; friend: FalseFriendWarning }
  | { kind: "saying"; start: number; end: number; saying: SayingMatch };

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
  return translateFrom(text, from, to);
}

/**
 * Like translateWithDictionary, but when the chosen country's words find
 * nothing, the text may use another country's words ("palta" typed with
 * Mexico chosen): the country whose dictionary explains the most of it
 * translates it, before anyone thinks of asking the AI.
 */
export function translateAnyCountry(text: string, from: DialectCode, to: DialectCode): Translation {
  const own = translateWithDictionary(text, from, to);
  if (own.via !== "none") return own;
  let best = own;
  let found = 0;
  for (const other of PICKABLE_DIALECTS) {
    if (other === from || other === to) continue;
    const result = translateWithDictionary(text, other, to);
    const words = result.pairs.filter((p) => p.from.id).length;
    if (words > found) {
      best = result;
      found = words;
    }
  }
  return best;
}

/** Few words: a lookup, not a sentence. The AI is only worth it for sentences. */
export function worthAskingAi(text: string): boolean {
  return (text.match(/[\p{L}\p{N}]+/gu) ?? []).length >= 3;
}

/**
 * Standard Spanish (from a translation service) made local: "Quiero palomitas
 * en el autobús" for the Dominican Republic is "Quiero cocaleca en la guagua".
 */
export function localizeFromNeutral(text: string, to: DialectCode): Translation {
  return translateFrom(text, "neutral", to);
}

function translateFrom(text: string, origin: Source, to: DialectCode): Translation {
  const from: DialectCode = origin === "neutral" ? to : origin;
  const sayings = findSayings(text);
  const inSaying = (x: { start: number; end: number }) =>
    sayings.some((m) => x.start < m.end && x.end > m.start);
  const friends = (origin === "neutral" ? [] : findFalseFriends(text, origin, to)).filter(
    (f) => !inSaying(f),
  );
  const overlaps = (m: Match) =>
    inSaying(m) || friends.some((f) => m.start < f.end && m.end > f.start);
  const edits: Edit[] = [
    ...sayings.map((saying) => ({
      kind: "saying" as const,
      start: saying.start,
      end: saying.end,
      saying,
    })),
    ...friends.map((friend) => ({
      kind: "false-friend" as const,
      start: friend.start,
      end: friend.end,
      friend,
    })),
    ...findMatches(text, origin)
      .filter((m) => !overlaps(m))
      .map((match) => ({ kind: "word" as const, start: match.start, end: match.end, match })),
  ].sort((x, y) => x.start - y.start);

  const source: Segment[] = [];
  const target: Segment[] = [];
  // For each target segment, the gender change a swapped noun brought, so the
  // words around it can agree afterwards.
  const shifts: ({ from: NounForm; to: NounForm } | null)[] = [];
  const pushTarget = (segment: Segment, shift: { from: NounForm; to: NounForm } | null = null) => {
    target.push(segment);
    shifts.push(shift);
  };
  /** The swapped noun's form before and after, from its article and spelling. */
  const formsOf = (
    before: string,
    original: string,
    replacement: string,
    plural: boolean,
    toGender?: Gender,
  ) => {
    const article = formFromArticle(before);
    return {
      from: {
        gender: article.gender ?? nounGender(original),
        number: plural ? "p" : (article.number ?? nounNumber(original)),
      } as NounForm,
      to: {
        gender: toGender ?? nounGender(replacement),
        number: plural ? "p" : nounNumber(replacement),
      } as NounForm,
    };
  };
  const pairs: TermPair[] = [];
  const seen = new Set<string>();
  // Swapped adjectives, to agree with their noun at the end.
  const adjectives: { index: number; base: string; original: string }[] = [];
  let cursor = 0;

  for (const edit of edits) {
    const before = text.slice(cursor, edit.start);
    const original = text.slice(edit.start, edit.end);
    cursor = edit.end;

    if (edit.kind === "saying") {
      const { saying, replacement } = edit.saying;
      if (before) {
        source.push({ text: before });
        pushTarget({ text: before });
      }
      source.push({ text: original, highlight: true });
      pushTarget({ text: matchCase(replacement, original), highlight: true });
      if (!seen.has(`saying.${replacement}`)) {
        seen.add(`saying.${replacement}`);
        pairs.push({
          from: { text: saying.text, id: "refran" },
          to: { text: replacement },
          // The translation already says what it means.
          meaning: replacement === saying.es ? "refrán" : saying.es,
          en: saying.en,
        });
      }
      continue;
    }

    if (edit.kind === "false-friend") {
      const { friend } = edit;
      if (before) {
        source.push({ text: before });
        pushTarget({ text: before });
      }
      source.push({ text: original, highlight: true });
      pushTarget(
        { text: matchCase(friend.literal, original), highlight: true },
        friend.gender ? formsOf(before, original, friend.literal, friend.plural, friend.gender) : null,
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
    let { text: word, entry: toEntry } = equivalent(pattern.conceptId, to);
    // A plain word never becomes a vulgar one: use its plain meaning instead.
    if (toEntry?.register && !pattern.entry?.register) {
      word = conceptMeaning(pattern.conceptId) ?? pattern.meaning;
      toEntry = undefined;
    }
    let clean = word.replace(EDGE_PUNCTUATION, "");
    // "¡Qué chimba!" → "¡Qué copado!", not "¡Copado!"
    if (
      ADJECTIVE_CONCEPTS.has(pattern.conceptId) &&
      normalize(pattern.text).startsWith("que ") &&
      !normalize(clean).startsWith("que ")
    ) {
      clean = `qué ${clean}`;
    }
    // People keep their gender ("la canche" → "la rubia", "su jeva" → "su
    // jeva"), and so do adjectives: from the word's own ending, or for a word
    // like "bacán" from the noun it describes ("la fiesta estuvo bacana").
    let keep: Gender | undefined;
    const adjective = ADJECTIVE_CONCEPTS.has(pattern.conceptId) && !PERSON_CONCEPTS.has(pattern.conceptId);
    if (PERSON_CONCEPTS.has(pattern.conceptId)) {
      const last = normalize(original).split(" ").at(-1) ?? "";
      keep = formFromArticle(before).gender ?? (/a$/.test(last) ? "f" : /o$/.test(last) ? "m" : undefined);
      if (keep === "f") clean = clean.replace(/o$/, "a");
    } else if (adjective) {
      // Settled at the end, once the nouns around it are in place.
      keep = pattern.feminine ? "f" : /o$/.test(normalize(original)) ? "m" : undefined;
      if (keep === "f") clean = clean.replace(/o$/, "a");
      adjectives.push({ index: target.length, base: clean.replace(/a$/, "o"), original });
    }
    const plural = match.plural;
    const replaced = matchCase(plural ? pluralize(clean) : clean, original);

    // A plain word the other country also uses stays as ordinary text.
    if (!pattern.entry && normalize(clean) === normalize(pattern.text)) {
      source.push({ text: original });
      pushTarget({ text: original });
      continue;
    }
    source.push({ text: original, highlight: true });
    // The same word in both countries leaves everything around it alone.
    const same = normalize(clean) === normalize(original);
    pushTarget(
      { text: replaced, highlight: true },
      same ? null : formsOf(before, original, clean, match.plural, keep),
    );

    const key = pattern.entry?.id ?? `plain.${pattern.conceptId}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({
        from: { text: pattern.text, id: pattern.entry?.id },
        to: { text: word, id: toEntry?.id },
        meaning: pattern.meaning,
        en: pattern.en,
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
  // "la joda estuvo bacán" → "la joda estuvo copada": an adjective takes the
  // gender and number of the last noun before it in the translation.
  for (const { index, base, original } of adjectives) {
    if (!/o$/.test(base)) continue;
    const subject = subjectForm(target.slice(0, index).map((s) => s.text).join(""));
    if (!subject) continue;
    let word = subject.gender === "f" ? base.replace(/o$/, "a") : base;
    if (subject.number === "p") word = pluralize(word);
    target[index].text = matchCase(word, original);
  }
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

/**
 * A country's words replaced by standard Spanish, so a translation service
 * understands them: "Vamos en guagua" → "Vamos en autobús". Returns the words
 * it replaced, for the learner's word list.
 */
export function neutralize(
  text: string,
  from: DialectCode,
): { text: string; found: Entry[] } {
  // Sayings in their usual form, so a service understands "regalao".
  for (const m of findSayings(text).reverse()) {
    text = text.slice(0, m.start) + m.saying.text + text.slice(m.end);
  }
  const found: Entry[] = [];
  let out = "";
  let cursor = 0;
  for (const match of findMatches(text, from)) {
    const entry = match.pattern.entry;
    const meaning = entry ? conceptMeaning(entry.conceptId) : undefined;
    out += text.slice(cursor, match.start);
    out += entry && meaning ? meaning : text.slice(match.start, match.end);
    if (entry && meaning && !found.some((f) => f.id === entry.id)) found.push(entry);
    cursor = match.end;
  }
  return { text: out + text.slice(cursor), found };
}
