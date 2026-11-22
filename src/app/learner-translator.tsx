"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  LoaderCircle,
  Mic,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PlusLimitSheet } from "@/components/plus";
import { SidesBar } from "@/components/sides";
import { ListCard, SectionTitle, TabScreen, TopBar, capitalize } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { learnWithDictionary, speechLangFor, type LearnDirection, type LearnResult } from "@/lib/learn";
import { speak, useDictation } from "@/lib/speech";
import { LANGUAGES } from "@/lib/languages";
import { useSentenceAllowance } from "@/lib/plus";
import { useDraft } from "@/lib/draft";
import { useDialectPair, useOtherLanguage } from "@/lib/storage";
import type { Segment } from "@/lib/translate";

const join = (segments: Segment[]) => segments.map((s) => s.text).join("");

/**
 * Learner mode's translator: English ⇄ the Spanish of the country being
 * learned. Sentences go to the AI; single words come straight from the
 * dictionary, and without the AI the dictionary lists the words it knows.
 */
export function LearnerTranslator() {
  const { t, countryInSentence } = useT();
  const [pair] = useDialectPair();
  const [other] = useOtherLanguage();
  const dialect = pair.to;
  const language = other?.code ?? "en";
  const direction: LearnDirection = other?.side === "to" ? "from-spanish" : "to-spanish";
  const languageName = LANGUAGES[language].name;
  const [draft, setDraft] = useDraft();
  const text = draft.text;
  const setText = (value: string) => setDraft({ text: value });
  // Coming from the other translator with a translation on screen.
  const restore = useRef(draft.shown && draft.text.trim() !== "");
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<LearnResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const allowance = useSentenceAllowance();
  const [limitOpen, setLimitOpen] = useState(false);
  const request = useRef(0);
  const resultCard = useRef<HTMLElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/learn")
      .then((r) => r.json() as Promise<{ sentences?: boolean }>)
      .then((r) => setAiAvailable(Boolean(r.sentences)))
      .catch(() => setAiAvailable(false))
      .finally(() => setReady(true));
  }, []);

  const hasResult = result !== null;
  useEffect(() => {
    if (hasResult) resultCard.current?.focus();
  }, [hasResult]);

  useEffect(() => {
    setDraft({ shown: hasResult });
  }, [hasResult, setDraft]);

  useEffect(() => {
    if (!ready || !restore.current) return;
    restore.current = false;
    void translate(text);
  }, [ready]);

  // A new language or country translates the same text again; switching
  // direction carries the translation over as the new text.
  const last = useRef({ dialect, direction, language });
  useEffect(() => {
    const before = last.current;
    if (before.dialect === dialect && before.direction === direction && before.language === language) return;
    last.current = { dialect, direction, language };
    if (!result) return;
    if (before.direction !== direction) {
      const carried = join(result.target);
      setText(carried);
      void translate(carried);
    } else {
      void translate(text);
    }
  }, [dialect, direction, language]);

  const toSpanish = direction === "to-spanish";
  const spanishLang = speechLangFor(dialect);
  const dictation = useDictation(toSpanish ? LANGUAGES[language].speech : spanishLang, (heard, final) => {
    setText(heard);
    if (final) void translate(heard);
  });

  async function translate(input: string, dir = direction, to = dialect) {
    const clean = input.trim();
    if (!clean) return;
    const id = ++request.current;
    setError(null);
    const local = learnWithDictionary(clean, to, dir, language);
    setResult(local);
    if (local.target.length > 0 || !aiAvailable) return;
    if (!allowance.spend()) {
      setLimitOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, dialect: to, direction: dir, language }),
      });
      const body = (await res.json()) as { result?: LearnResult; error?: string };
      if (id !== request.current) return;
      if (body.result) setResult(body.result);
      if (body.error) setError(body.error);
    } catch {
      if (id === request.current) setError(t("No hay conexión. Intenta otra vez."));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }

  const edit = () => {
    request.current++;
    setResult(null);
    setLoading(false);
    setError(null);
    requestAnimationFrame(() => textArea.current?.focus());
  };

  const label = (side: "from" | "to") =>
    (side === "from") === toSpanish
      ? languageName
      : t("Español de {country}", { country: countryInSentence(dialect) });

  const targetText = result ? join(result.target) : "";

  return (
    <TabScreen>
      <TopBar />
      <div className="mt-4">
        <SidesBar />
      </div>

      {result ? (
        <>
          <section
            ref={resultCard}
            tabIndex={-1}
            aria-label={t("Traducción")}
            className="mt-4 rounded-[26px] bg-white px-5 py-[18px] shadow-card focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13.5px] font-semibold text-muted">{label("from")}</p>
              <button
                type="button"
                aria-label={t("Borrar texto")}
                onClick={() => {
                  setText("");
                  edit();
                }}
                className="-mr-2 grid size-9 place-items-center rounded-full text-muted hover:bg-bg"
              >
                <X className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={edit}
              lang={toSpanish ? language : "es"}
              className="mt-2.5 block w-full text-left text-[23px] leading-snug font-medium text-body"
            >
              {result.source}
              <span className="sr-only">{t(". Editar texto")}</span>
            </button>

            <hr className="my-[18px] border-line" />

            <div aria-live="polite">
              <p className="text-[13.5px] font-semibold text-muted">{label("to")}</p>
              {loading ? (
                <p className="mt-3 flex items-center gap-3 text-[18px] text-muted">
                  <LoaderCircle className="size-5 animate-spin" />
                  {t("Traduciendo…")}
                </p>
              ) : targetText ? (
                <>
                  <p
                    lang={toSpanish ? "es" : language}
                    className="mt-2.5 text-[23px] leading-snug font-medium"
                  >
                    {result.target.map((s, i) =>
                      s.highlight ? (
                        <strong key={i} className="font-extrabold">
                          {s.text}
                        </strong>
                      ) : (
                        <span key={i}>{s.text}</span>
                      ),
                    )}
                  </p>
                  {result.credit && (
                    <p className="mt-2 text-[13px] text-muted">
                      {t("Traducido con {service} y el diccionario de Hola.", { service: result.credit })}
                    </p>
                  )}
                  {toSpanish && (
                    <div className="mt-3 flex gap-2">
                      <RoundButton label={t("Escuchar")} onClick={() => speak(targetText, spanishLang)}>
                        <Volume2 className="size-[18px]" />
                      </RoundButton>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-3 text-[15px] text-muted">
                  {aiAvailable
                    ? t("No pudimos traducir esto.")
                    : t(
                        "Para traducir frases completas hace falta la traducción con IA, que todavía no está activada. Estas son las palabras que conocemos:",
                      )}
                </p>
              )}
            </div>
          </section>

          {error && (
            <p role="alert" className="mt-3 text-center text-sm text-danger">
              {error}
            </p>
          )}

          {!loading && result.words.length > 0 && (
            <section>
              <SectionTitle>{t("Palabras que conviene saber")}</SectionTitle>
              <ListCard>
                {result.words.map((w) => {
                  const body = (
                    <div className="min-w-0 flex-1">
                      <p lang="es" className="text-[16px] font-extrabold">
                        {w.spanish}
                      </p>
                      <p lang="en" className="text-sm text-body">
                        {capitalize(w.english)}
                      </p>
                      {w.pronunciation && (
                        <p className="text-[13px] text-muted italic">{w.pronunciation}</p>
                      )}
                    </div>
                  );
                  return (
                    <li key={w.spanish} className="flex items-center gap-2 py-3">
                      {w.id ? (
                        <Link href={`/frase/${w.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                          {body}
                          <ChevronRight aria-hidden className="size-[18px] text-muted" />
                        </Link>
                      ) : (
                        body
                      )}
                      <RoundButton
                        label={`${t("Escuchar")}: ${w.spanish}`}
                        onClick={() => speak(w.spanish, spanishLang)}
                      >
                        <Volume2 className="size-[18px]" />
                      </RoundButton>
                    </li>
                  );
                })}
              </ListCard>
            </section>
          )}
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void translate(text);
          }}
          className="mt-4 flex min-h-[420px] flex-1 flex-col rounded-[26px] bg-white px-[22px] py-[22px] shadow-card focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-navy"
        >
          <p className="text-[13.5px] font-semibold text-muted">{label("from")}</p>
          <textarea
            ref={textArea}
            value={text}
            lang={toSpanish ? language : "es"}
            dir="auto"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void translate(text);
              }
            }}
            enterKeyHint="go"
            maxLength={500}
            placeholder={
              dictation.listening
                ? t("Te escucho…")
                : toSpanish
                  ? t("Escribe en {language}…", { language: languageName })
                  : t("Escribe en español…")
            }
            aria-label={label("from")}
            className="mt-4 w-full flex-1 resize-none bg-transparent text-[28px] leading-snug font-medium tracking-[-0.015em] placeholder:text-placeholder focus-visible:outline-none"
          />
          <div className="mt-4 flex h-[68px] items-center justify-center">
            {text.trim() ? (
              <button
                type="submit"
                className="flex h-14 items-center gap-2 rounded-full bg-navy px-7 text-[16px] font-bold text-white shadow-[0_8px_20px_rgb(3_0_80/0.25)] active:scale-95"
              >
                {t("Traducir")}
                <ArrowRight className="size-5" />
              </button>
            ) : (
              dictation.supported && (
                <button
                  type="button"
                  aria-label={dictation.listening ? t("Dejar de escuchar") : t("Hablar")}
                  aria-pressed={dictation.listening}
                  onClick={dictation.listening ? dictation.stop : dictation.start}
                  className={`grid size-[68px] place-items-center rounded-full bg-navy text-white shadow-[0_8px_20px_rgb(3_0_80/0.25)] ${
                    dictation.listening ? "animate-pulse ring-8 ring-navy/15" : ""
                  }`}
                >
                  <Mic className="size-7" />
                </button>
              )
            )}
          </div>
        </form>
      )}

      <PlusLimitSheet open={limitOpen} onClose={() => setLimitOpen(false)} />
    </TabScreen>
  );
}

function RoundButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-full bg-bg hover:bg-lavender active:scale-95"
    >
      {children}
    </button>
  );
}
