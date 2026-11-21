"use client";

import { ChevronRight, Download, MessageSquarePlus, Volume2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { InstallSheet } from "@/components/install-sheet";
import { useT, useUiLanguage } from "@/lib/i18n";
import { LanguageToggle } from "../welcome";
import { SuggestSheet, useSuggestionsEnabled } from "@/components/suggest";
import { ListCard, PageHeader, SectionTitle } from "@/components/ui";
import { DIALECTS } from "@/lib/dialects";
import { isInstalled } from "@/lib/install";
import { speak } from "@/lib/speech";
import {
  useDialectPair,
  useHydrated,
  useVoiceSpeed,
  type VoiceSpeed,
} from "@/lib/storage";

export default function Settings() {
  const { t, language } = useT();
  const [uiLanguage, setUiLanguage] = useUiLanguage();
  const hydrated = useHydrated();
  const [pair] = useDialectPair();
  const [speed, setSpeed] = useVoiceSpeed();
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [installOpen, setInstallOpen] = useState(false);

  useEffect(() => {
    fetch("/api/translate")
      .then((r) => r.json() as Promise<{ aiAvailable?: boolean }>)
      .then((r) => setAiAvailable(Boolean(r.aiAvailable)))
      .catch(() => setAiAvailable(false));
  }, []);

  const suggestions = useSuggestionsEnabled();
  const [suggestOpen, setSuggestOpen] = useState(false);

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-12">
      <PageHeader />
      <h1 className="mx-1 mt-5 text-[32px] font-extrabold tracking-[-0.03em]">{t("Preferencias")}</h1>

      <SectionTitle>{t("Idioma de la app")}</SectionTitle>
      <div className="flex">
        <LanguageToggle value={uiLanguage} onChange={setUiLanguage} />
      </div>


      <SectionTitle>{t("Voz")}</SectionTitle>
      <fieldset className="rounded-[22px] bg-white px-5 py-4 shadow-card">
        <legend className="float-left mb-3 w-full text-[15px] text-muted">
          {t("Velocidad de la voz")}
        </legend>
        <div className="clear-both grid grid-cols-2 gap-2">
          {(["normal", "lenta"] as VoiceSpeed[]).map((s) => (
            <label
              key={s}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold capitalize transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy ${
                speed === s ? "bg-navy text-white" : "bg-bg text-navy"
              }`}
            >
              <input
                type="radio"
                name="voice-speed"
                value={s}
                checked={speed === s}
                onChange={() => setSpeed(s)}
                className="sr-only"
              />
              {t(s)}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            speak(
              "Hola, ¿cómo estás?",
              DIALECTS[language === "en" ? pair.to : pair.from].speechLang,
            )
          }
          className="mt-3 -ml-2 flex min-h-11 items-center gap-2 rounded-full px-2 text-[14.5px] font-semibold text-muted hover:text-navy"
        >
          <Volume2 aria-hidden className="size-4" />
          {t("Probar la voz")}
        </button>
      </fieldset>

      <SectionTitle>{t("Más")}</SectionTitle>
      <ListCard>
        {hydrated && !isInstalled() && (
          <Row icon={<Download className="size-5" />} onClick={() => setInstallOpen(true)}>
            {t("Instalar la app")}
          </Row>
        )}
        {suggestions && (
          <Row icon={<MessageSquarePlus className="size-5" />} onClick={() => setSuggestOpen(true)}>
            {t("Sugerir una palabra o corrección")}
          </Row>
        )}
      </ListCard>

      <SectionTitle>{t("Sobre Hola")}</SectionTitle>
      <div className="space-y-3 rounded-[22px] bg-white px-5 py-5 text-[15px] leading-relaxed text-muted shadow-card">
        <p>{t("Hola traduce entre dialectos del español con un diccionario hecho a mano.")}</p>
        <p>
          {t("No necesitas una cuenta: tus países y tus favoritos se quedan en este teléfono.")}
        </p>
        {aiAvailable !== null && (
          <p>
            {aiAvailable
              ? t("Lo que no está en el diccionario, y las fotos, se traducen con IA (Claude). Esas respuestas pueden contener errores.")
              : t("La traducción con IA y la cámara no están activadas en este servidor.")}
          </p>
        )}
      </div>

      <InstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
      <SuggestSheet
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        initial={{ kind: "agregar", word: "", country: pair.from, context: "Preferencias" }}
      />
    </main>
  );
}

function Row({
  icon,
  href,
  onClick,
  children,
}: {
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = "flex w-full items-center gap-3 py-3.5 text-left text-[16px] font-semibold";
  const content = (
    <>
      <span aria-hidden className="text-muted">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      <ChevronRight aria-hidden className="size-[18px] text-muted" />
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} className={className}>
          {content}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {content}
        </button>
      )}
    </li>
  );
}
