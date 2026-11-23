import type { LanguageCode } from "./languages";

/*
 * Which language a text is in, without a service: the writing system for
 * Chinese, Japanese, Korean and Arabic, and common little words for the
 * rest. Only words that don't also exist in another of these languages
 * are listed, so a single hit means something.
 */

const WORDS: Record<"es" | "en" | "pt" | "fr" | "de" | "it" | "ht", string> = {
  es: "el los las del al y es está estoy estás están por para pero muy qué cómo dónde cuándo quiero quieres tengo tiene hay hola gracias mucho mucha muchos muchas antes después también ahora aquí bueno buena usted ustedes nosotros ellos ellas eso esto esta este cuando donde porque señor sí ya hacer voy vas va vamos tenemos puedo puede",
  en: "the and is are was were you i to of what it this that with have has my we want before take do don't how where for be can not your our they them there their just like about will would should could from but if when who which hello thanks please very much bus need go going let's after at on i'm it's grab meeting",
  pt: "não você vocês é uma um com eu ele ela isso isto muito muita obrigado obrigada olá tem são também quero onde nós meu minha ônibus agora aqui depois antes então mas pelo pela fazer vou",
  fr: "le les est et je vous nous une des du pas avec pour dans ce cette suis veux avant prendre bonjour merci très il elle sont ai avez mon ma mes où mais aussi maintenant ici c'est combien comment pourquoi quand voudrais",
  de: "der die das und ist ich du nicht ein eine mit zu wir sie was wie auf den dem bin möchte bitte danke hallo vor nehmen haben habe auch jetzt hier aber oder ja nein",
  it: "è di che non sono gli della io voglio prima prendere ciao grazie molto questo ho sei siamo anche dove adesso qui ma il",
  ht: "mwen ou li nou pa ak nan sa ki pou vle bonjou mèsi anvan pran bis kounye kijan kote tanpri anpil bezwen demen maten travay konnen manje ale",
};

const LISTS = Object.fromEntries(
  Object.entries(WORDS).map(([code, words]) => [code, new Set(words.split(" "))]),
) as Record<keyof typeof WORDS, Set<string>>;

export type TextLanguage = LanguageCode | "es";

/** The text's language, or null when it is too short or unclear to say. */
export function detectLanguage(text: string): TextLanguage | null {
  const letters = text.replace(/[\s\p{P}\p{N}\p{S}]/gu, "");
  if (!letters) return null;
  const share = (re: RegExp) => (letters.match(re)?.length ?? 0) / letters.length;
  if (share(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu) > 0.1) return "ja";
  if (share(/\p{Script=Hangul}/gu) > 0.3) return "ko";
  if (share(/\p{Script=Han}/gu) > 0.3) return "zh";
  if (share(/\p{Script=Arabic}/gu) > 0.3) return "ar";

  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  // One or two words are usually a dictionary lookup: leave them be.
  if (words.length < 3) return null;
  const scores = (Object.keys(LISTS) as (keyof typeof WORDS)[])
    .map((code) => ({ code, hits: words.filter((w) => LISTS[code].has(w)).length }))
    .sort((a, b) => b.hits - a.hits);
  const [first, second] = scores;
  if (first.hits < 2 || first.hits < second.hits * 2) return null;
  return first.code;
}
