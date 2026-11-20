import type { DialectCode } from "./dialects";
import type { TermDetail } from "./dictionary";

/** A word or phrase the detail page can show: from the dictionary or the AI. */
export type PhraseEntry = TermDetail & {
  id: string;
  dialect: DialectCode;
  text: string;
  meaning: string;
};
