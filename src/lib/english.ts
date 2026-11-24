import ENGLISH from "../../lexicon/data/english.json";
import { DIALECTS } from "./dialects";
import type { PhraseEntry } from "./phrase";

/*
 * Word pages in English: the hand-written definitions and origin stories
 * have English versions in lexicon/data/english.json (keyed by the Spanish
 * text); the other definitions follow one pattern, written here.
 */

const DEFINITIONS: Record<string, string> = ENGLISH.definitions;
const ORIGINS: Record<string, string> = ENGLISH.origins;

/** The hand-written English explanation of a word, when there is one. */
export function writtenEnglish(entry: PhraseEntry): string | undefined {
  return entry.definition ? DEFINITIONS[entry.definition] : undefined;
}

/** The definition in the app's language. */
export function definitionIn(entry: PhraseEntry, language: "es" | "en"): string {
  const spanish = entry.definition ?? entry.meaning;
  if (language !== "en") return spanish;
  const written = entry.definition ? DEFINITIONS[entry.definition] : undefined;
  if (written) return written;
  return entry.en ? `Used in ${DIALECTS[entry.dialect].nameEn} to say «${entry.en}».` : spanish;
}

/** The origin story in the app's language, and whether it is in that language. */
export function originIn(entry: PhraseEntry, language: "es" | "en"): { text: string; translated: boolean } | undefined {
  if (!entry.origin) return undefined;
  const english = language === "en" ? ORIGINS[entry.origin] : undefined;
  return { text: english ?? entry.origin, translated: language !== "en" || Boolean(english) };
}

/** Spanish texts with no English yet, for the tests. */
export function untranslated(texts: { definitions: string[]; origins: string[] }) {
  return {
    definitions: texts.definitions.filter((d) => !d.startsWith("Se usa en ") && !DEFINITIONS[d]),
    origins: texts.origins.filter((o) => !ORIGINS[o]),
  };
}
