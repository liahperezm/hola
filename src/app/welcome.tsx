"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CountryList } from "@/components/dialect-switcher";
import { Logo } from "@/components/logo";
import type { DialectCode } from "@/lib/dialects";
import { useT, useUiLanguage, type UiLanguage } from "@/lib/i18n";
import type { DialectPair } from "@/lib/storage";

type Step = "hola" | "from" | "to" | "learn";

/**
 * First run. In Spanish: a welcome, then the two countries the translator
 * opens with. In English (learners): which Spanish they want to learn.
 */
export function Welcome({ onDone }: { onDone: (pair: DialectPair) => void }) {
  const [step, setStep] = useState<Step>("hola");
  const [from, setFrom] = useState<DialectCode | null>(null);
  const [language, setLanguage] = useUiLanguage();
  const { t } = useT();
  const heading = useRef<HTMLHeadingElement>(null);

  // Each step replaces the screen, so move focus to its heading.
  useEffect(() => {
    if (step !== "hola") heading.current?.focus();
  }, [step]);

  if (step === "hola") {
    return (
      <main className="flex min-h-dvh flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),2rem)]">
        <LanguageToggle value={language} onChange={setLanguage} />
        <div className="flex flex-1 flex-col justify-center">
          <Logo className="h-16 self-start" />
          <h1 className="mt-8 text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em]">
            {language === "en"
              ? "Learn the Spanish people actually speak"
              : t("Traduce entre los dialectos del español")}
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-body">
            {language === "en" ? (
              <>
                A Dominican says <b lang="es">guagua</b>, an Argentine says{" "}
                <b lang="es">colectivo</b>: both mean bus. Learn the words, the meanings
                and how they sound, country by country.
              </>
            ) : (
              <>
                Del <b>carajito</b> dominicano al <b>pibe</b> argentino: entiende y hazte
                entender en cualquier país.
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStep(language === "en" ? "learn" : "from")}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-navy text-[16px] font-bold text-white"
        >
          {t("Empezar")}
          <ArrowRight className="size-5" />
        </button>
      </main>
    );
  }

  const copy: Record<Exclude<Step, "hola">, { title: string; hint: string; n: number; total: number }> = {
    from: {
      title: t("¿De dónde es tu español?"),
      hint: t("Traduciremos desde tu forma de hablar."),
      n: 1,
      total: 2,
    },
    to: {
      title: t("¿Con quién quieres hablar?"),
      hint: t("Elige el país de la persona o del lugar. Puedes cambiarlo cuando quieras."),
      n: 2,
      total: 2,
    },
    learn: {
      title: t("¿Qué español quieres aprender?"),
      hint: t(
        "Verás cada palabra como se dice allí, con su significado en inglés y cómo pronunciarla.",
      ),
      n: 1,
      total: 1,
    },
  };
  const { title, hint, n, total } = copy[step];

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-10">
      <div className="flex h-12 items-center justify-between">
        <button
          type="button"
          aria-label={t("Atrás")}
          onClick={() => setStep(step === "to" ? "from" : "hola")}
          className="grid size-10 place-items-center rounded-full bg-white shadow-card"
        >
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-[13.5px] font-semibold text-muted">
          {t("Paso {n} de {total}", { n, total })}
        </p>
      </div>
      <h1
        ref={heading}
        tabIndex={-1}
        className="mx-1 mt-6 text-[30px] leading-tight font-extrabold tracking-[-0.03em] focus:outline-none"
      >
        {title}
      </h1>
      <p className="mx-1 mt-2 mb-5 text-[15.5px] text-muted">{hint}</p>
      <div className="rounded-[22px] bg-white px-2 py-1 shadow-card">
        <CountryList
          key={step}
          selected={step === "from" ? (from ?? undefined) : undefined}
          exclude={step === "to" ? (from ?? undefined) : undefined}
          onChoose={(code) => {
            if (step === "from") {
              setFrom(code);
              setStep("to");
            } else if (step === "to" && from) {
              onDone({ from, to: code });
            } else if (step === "learn") {
              // Learners read Spanish from anywhere; the translator starts
              // from Mexican Spanish, the most widely taught.
              onDone({ from: code === "MX" ? "ES" : "MX", to: code });
            }
          }}
        />
      </div>
    </main>
  );
}

function LanguageToggle({
  value,
  onChange,
}: {
  value: UiLanguage;
  onChange: (language: UiLanguage) => void;
}) {
  return (
    <fieldset className="self-end">
      <legend className="sr-only">Idioma / Language</legend>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-card">
        {(
          [
            ["es", "Español"],
            ["en", "English"],
          ] as [UiLanguage, string][]
        ).map(([code, label]) => (
          <label
            key={code}
            lang={code}
            className={`flex h-9 cursor-pointer items-center justify-center rounded-full px-4 text-[14px] font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy ${
              value === code ? "bg-navy text-white" : "text-navy"
            }`}
          >
            <input
              type="radio"
              name="ui-language"
              value={code}
              checked={value === code}
              onChange={() => onChange(code)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export { LanguageToggle };
