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
  }[];
};

export type FalseFriendWarning = {
  /** As written in the text. */
  word: string;
  /** The dictionary form: "coger" for "cogí". */
  base: string;
  country: DialectCode;
  /** What it means in that country. */
  meaning: string;
};

const RUDE = new Set(["vulgar", "offensive"]);

function senseIn(friend: FalseFriend, country: DialectCode) {
  return (
    friend.senses.find((s) => s.countries.includes(country)) ??
    friend.senses.find((s) => s.everywhereElse)
  );
}

const lookup = new Map<string, FalseFriend>();
for (const friend of FALSE_FRIENDS) {
  for (const form of friend.forms) {
    const n = normalize(form);
    for (const key of [n, `${n}s`, `${n}es`]) {
      if (!lookup.has(key)) lookup.set(key, friend);
    }
  }
}

/**
 * Words in the text that mean something vulgar or offensive where it is going,
 * though harmless where it comes from: "Cogí el bus" from Spain to Argentina.
 */
export function findFalseFriends(
  text: string,
  from: DialectCode,
  to: DialectCode,
): FalseFriendWarning[] {
  if (from === to) return [];
  const warnings: FalseFriendWarning[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(/[\p{L}]+/gu)) {
    const friend = lookup.get(normalize(match[0]));
    if (!friend || seen.has(friend.word)) continue;
    const there = senseIn(friend, to);
    const here = senseIn(friend, from);
    if (there?.meaning && RUDE.has(there.register) && !(here && RUDE.has(here.register))) {
      seen.add(friend.word);
      warnings.push({ word: match[0], base: friend.word, country: to, meaning: there.meaning });
    }
  }
  return warnings;
}

/** "En Argentina, «coger» significa: tener sexo." */
export function warningText(w: FalseFriendWarning): string {
  return `En ${DIALECTS[w.country].name}, «${w.base}» significa: ${w.meaning}.`;
}
