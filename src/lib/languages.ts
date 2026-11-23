/*
 * Languages people can translate from or into, besides the Spanish dialects.
 * Their names are shown in the language itself.
 */
export const LANGUAGE_CODES = ["en", "pt", "fr", "de", "it", "ht", "zh", "ja", "ko", "ar"] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const LANGUAGES: Record<LanguageCode, { name: string; short: string; speech: string }> = {
  en: { name: "English", short: "EN", speech: "en-US" },
  pt: { name: "Português", short: "PT", speech: "pt-BR" },
  fr: { name: "Français", short: "FR", speech: "fr-FR" },
  de: { name: "Deutsch", short: "DE", speech: "de-DE" },
  it: { name: "Italiano", short: "IT", speech: "it-IT" },
  ht: { name: "Kreyòl ayisyen", short: "HT", speech: "ht-HT" },
  zh: { name: "中文", short: "中", speech: "zh-CN" },
  ja: { name: "日本語", short: "日", speech: "ja-JP" },
  ko: { name: "한국어", short: "한", speech: "ko-KR" },
  ar: { name: "العربية", short: "ع", speech: "ar-SA" },
};

/** The language's name in the app's own language, for sentences. */
export const LANGUAGE_NAMES: Record<"es" | "en", Record<LanguageCode, string>> = {
  es: {
    en: "inglés", pt: "portugués", fr: "francés", de: "alemán", it: "italiano",
    ht: "criollo haitiano", zh: "chino", ja: "japonés", ko: "coreano", ar: "árabe",
  },
  en: {
    en: "English", pt: "Portuguese", fr: "French", de: "German", it: "Italian",
    ht: "Haitian Creole", zh: "Chinese", ja: "Japanese", ko: "Korean", ar: "Arabic",
  },
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && (LANGUAGE_CODES as readonly string[]).includes(value);
}
