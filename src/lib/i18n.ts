"use client";

import { useCallback } from "react";
import { DIALECTS, type DialectCode } from "./dialects";
import { EN } from "./i18n-en";
import { useStored } from "./storage";

/*
 * The app's own text is Spanish in the code, and the Spanish is the key:
 * t("Traducir"). English (for learners) lives in i18n-en.ts; anything missing
 * there falls back to Spanish. Recipe-style content (words, definitions,
 * origin stories) is never translated here.
 */

export type UiLanguage = "es" | "en";

const asLanguage = (v: unknown): UiLanguage => (v === "en" ? "en" : "es");

export function useUiLanguage() {
  return useStored<UiLanguage>("hola.ui-language", "es", asLanguage);
}

export function translate(
  language: UiLanguage,
  text: string,
  vars?: Record<string, string | number>,
): string {
  const template = language === "en" ? (EN[text] ?? text) : text;
  return vars
    ? template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
    : template;
}

export function useT() {
  const [language] = useUiLanguage();
  const t = useCallback(
    (text: string, vars?: Record<string, string | number>) => translate(language, text, vars),
    [language],
  );
  /** Country name in the app's language. */
  const country = useCallback(
    (code: DialectCode) => (language === "en" ? DIALECTS[code].nameEn : DIALECTS[code].name),
    [language],
  );
  const countryShort = useCallback(
    (code: DialectCode) => (language === "en" ? DIALECTS[code].shortEn : DIALECTS[code].short),
    [language],
  );
  /** For use inside a sentence: "the Dominican Republic" in English. */
  const countryInSentence = useCallback(
    (code: DialectCode) =>
      language === "en" && (code === "DO" || code === "US")
        ? `the ${DIALECTS[code].nameEn}`
        : language === "en"
          ? DIALECTS[code].nameEn
          : DIALECTS[code].name,
    [language],
  );
  return { t, language, country, countryShort, countryInSentence };
}
