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
  }[];
  /** What to say instead, when there is a clear alternative. */
  instead?: string[];
};

export type FalseFriendWarning = {
  /** As written in the text. */
  word: string;
  country: DialectCode;
  instead?: string[];
};

const RUDE = new Set(["vulgar", "offensive"]);

function registerIn(friend: FalseFriend, country: DialectCode): string | undefined {
  const sense =
    friend.senses.find((s) => s.countries.includes(country)) ??
    friend.senses.find((s) => s.everywhereElse);
  return sense?.register;
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
 * Words in the text that are vulgar or offensive where it is going, though
 * harmless where it comes from: "Cogí el bus" from Spain to Argentina.
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
    const there = registerIn(friend, to);
    const here = registerIn(friend, from);
    if (there && RUDE.has(there) && !(here && RUDE.has(here))) {
      seen.add(friend.word);
      warnings.push({ word: match[0], country: to, instead: friend.instead });
    }
  }
  return warnings;
}

/** "En Argentina, «cogí» es una palabra vulgar. Mejor usa «tomar» o «agarrar»." */
export function warningText(w: FalseFriendWarning): string {
  const base = `En ${DIALECTS[w.country].name}, «${w.word.toLowerCase()}» es una palabra vulgar.`;
  if (!w.instead?.length) return base;
  const options = w.instead.map((x) => `«${x}»`);
  const list =
    options.length === 1
      ? options[0]
      : `${options.slice(0, -1).join(", ")} o ${options[options.length - 1]}`;
  return `${base} Mejor usa ${list}.`;
}
