import "server-only";
import type { DialectCode } from "./dialects";
import { getEntry } from "./dictionary";
import { findFalseFriends } from "./false-friends";
import type { LearnDirection, LearnResult, LearnWord } from "./learn";
import { PROVIDER_NAMES, machineTranslate, mtProvider } from "./machine-translation";
import { localizeFromNeutral, neutralize } from "./translate";

/*
 * Learner translation without the AI: a translation service does English ⇄
 * standard Spanish, and Hola's dictionary does standard Spanish ⇄ the country.
 */

// Translation services often write "coger" (Spain) for "take". Where that is
// vulgar, the learner gets the safe verb instead: they didn't choose the word.
const SAFE_VERBS: Record<string, string> = {
  coger: "tomar", cojo: "tomo", coges: "tomas", coge: "toma", cogemos: "tomamos",
  cogen: "toman", cogí: "tomé", cogiste: "tomaste", cogió: "tomó", cogimos: "tomamos",
  cogieron: "tomaron", cogía: "tomaba", cogías: "tomabas", cogían: "tomaban",
  coja: "tome", cojas: "tomes", cojan: "tomen", cogiendo: "tomando", cogido: "tomado",
  cogida: "tomada", cógelo: "tómalo", cógela: "tómala", cogerlo: "tomarlo",
  cogerla: "tomarla", cogeré: "tomaré", cogerá: "tomará",
};

export function safeForCountry(spanish: string, dialect: DialectCode): string {
  const rude = findFalseFriends(spanish, "ES", dialect).some((f) => f.base === "coger");
  if (!rude) return spanish;
  return spanish.replace(/\p{L}+/gu, (word) => {
    const safe = SAFE_VERBS[word.toLowerCase()];
    if (!safe) return word;
    return word[0] === word[0].toUpperCase() ? safe[0].toUpperCase() + safe.slice(1) : safe;
  });
}

export function serviceAvailable(): boolean {
  return mtProvider() !== null;
}

export async function learnWithService(
  text: string,
  dialect: DialectCode,
  direction: LearnDirection,
): Promise<LearnResult & { credit: string }> {
  const provider = mtProvider();
  const credit = provider ? PROVIDER_NAMES[provider] : "";

  if (direction === "to-spanish") {
    const standard = safeForCountry(await machineTranslate(text, "en", "es"), dialect);
    const local = localizeFromNeutral(standard, dialect);
    const words: LearnWord[] = local.pairs.map((p) => ({
      spanish: p.to.text,
      english: p.en ?? p.meaning,
      pronunciation: p.to.id ? getEntry(p.to.id)?.pronunciation : undefined,
      id: p.to.id,
    }));
    return { direction, dialect, source: text, target: local.target, words, via: "dictionary", credit };
  }

  const { text: standard, found } = neutralize(text, dialect);
  const english = await machineTranslate(standard, "es", "en");
  const words: LearnWord[] = found.map((e) => ({
    spanish: e.text,
    english: e.en ?? e.meaning,
    pronunciation: e.pronunciation,
    id: e.id,
  }));
  return { direction, dialect, source: text, target: [{ text: english }], words, via: "dictionary", credit };
}
