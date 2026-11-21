import { DIALECTS, type DialectCode } from "./dialects";
import { normalize } from "./dictionary";
import { FALSE_FRIENDS } from "./false-friends.generated";

export type FalseFriend = {
  word: string;
  /** Written forms to look for (the plural of each is matched too). */
  forms: string[];
  senses: {
    countries: string[];
    /** The sense used in every country not listed in another sense. */
    everywhereElse: boolean;
    register: string;
    /** In Spanish; set on vulgar and offensive senses. */
    meaning?: string;
    /** What a listener there hears, to write into the translation. */
    literal?: string;
    gender?: "m" | "f";
  }[];
  /** Verbs: the literal replacement for each written form. */
  literalForms?: Record<string, string>;
};

export type FalseFriendWarning = {
  /** As written in the text. */
  word: string;
  /** The dictionary form: "coger" for "cogí". */
  base: string;
  country: DialectCode;
  /** What it means in that country. */
  meaning: string;
  /** Where the word is in the text. */
  start: number;
  end: number;
  /** The literal replacement in the target country, already conjugated. */
  literal: string;
  /** Gender of the replacement, so the article before it can agree. */
  gender?: "m" | "f";
  plural: boolean;
};

const RUDE = new Set(["vulgar", "offensive"]);

function senseIn(friend: FalseFriend, country: DialectCode) {
  return (
    friend.senses.find((s) => s.countries.includes(country)) ??
    friend.senses.find((s) => s.everywhereElse)
  );
}

type Found = { friend: FalseFriend; form: string; plural: boolean };

const lookup = new Map<string, Found>();
for (const friend of FALSE_FRIENDS) {
  for (const form of friend.forms) {
    const n = normalize(form);
    if (!lookup.has(n)) lookup.set(n, { friend, form, plural: false });
    for (const key of [`${n}s`, `${n}es`]) {
      if (!lookup.has(key)) lookup.set(key, { friend, form, plural: true });
    }
  }
}

function pluralize(phrase: string): string {
  const [first, ...rest] = phrase.split(" ");
  const p = /[aeiouáéíóú]$/i.test(first)
    ? `${first}s`
    : /z$/i.test(first)
      ? `${first.slice(0, -1)}ces`
      : `${first.replace(/ón$/, "on")}es`;
  return [p, ...rest].join(" ");
}

/**
 * Words in the text that mean something vulgar or offensive where it is going,
 * with what a listener there hears: "coger" read in Uruguay is "tener sexo con".
 */
export function findFalseFriends(
  text: string,
  from: DialectCode,
  to: DialectCode,
): FalseFriendWarning[] {
  if (from === to) return [];
  const warnings: FalseFriendWarning[] = [];
  for (const match of text.matchAll(/[\p{L}]+/gu)) {
    const found = lookup.get(normalize(match[0]));
    if (!found) continue;
    const { friend, form, plural } = found;
    // How the listener hears it is what matters, wherever the text comes from.
    const there = senseIn(friend, to);
    if (!there?.meaning || !RUDE.has(there.register)) continue;
    const literal = friend.literalForms?.[form] ?? there.literal ?? there.meaning;
    warnings.push({
      word: match[0],
      base: friend.word,
      country: to,
      meaning: there.meaning,
      start: match.index,
      end: match.index + match[0].length,
      literal: plural && !friend.literalForms ? pluralize(literal) : literal,
      gender: there.gender,
      plural,
    });
  }
  return warnings;
}

/** "En Argentina, «coger» significa: tener sexo." */
export function warningText(w: FalseFriendWarning): string {
  return `En ${DIALECTS[w.country].name}, «${w.base}» significa: ${w.meaning}.`;
}
