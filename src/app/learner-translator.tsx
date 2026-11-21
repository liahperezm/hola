"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Mic,
  Snail,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CountryList } from "@/components/dialect-switcher";
import { Flag } from "@/components/flag";
import { Sheet } from "@/components/sheet";
import { ListCard, SectionTitle, TabScreen, TopBar, capitalize } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { learnWithDictionary, speechLangFor, type LearnDirection, type LearnResult } from "@/lib/learn";
import { speak, useDictation } from "@/lib/speech";
import { useDialectPair } from "@/lib/storage";
import type { Segment } from "@/lib/translate";

const join = (segments: Segment[]) => segments.map((s) => s.text).join("");

/**
 * Learner mode's translator: English ⇄ the Spanish of the country being
 * learned. Sentences go to the AI; single words come straight from the
 * dictionary, and without the AI the dictionary lists the words it knows.
 */
export function LearnerTranslator() {
  const { t, countryShort, countryInSentence } = useT();
  const [pair, setPair] = useDialectPair();
  const dialect = pair.to;
  const [direction, setDirection] = useState<LearnDirection>("to-spanish");
  const [text, setText] = useState("");
  const [result, setResult] = useState<LearnResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [picking, setPicking] = useState(false);
  const request = useRef(0);
  const resultCard = useRef<HTMLElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/learn")
      .then((r) => r.json() as Promise<{ sentences?: boolean }>)
      .then((r) => setAiAvailable(Boolean(r.sentences)))
      .catch(() => setAiAvailable(false));
  }, []);

  const hasResult = result !== null;
  useEffect(() => {
    if (hasResult) resultCard.current?.focus();
  }, [hasResult]);

  const toSpanish = direction === "to-spanish";
  const spanishLang = speechLangFor(dialect);
  const dictation = useDictation(toSpanish ? "en-US" : spanishLang, (heard, final) => {
    setText(heard);
    if (final) void translate(heard);
  });

  async function translate(input: string, dir = direction, to = dialect) {
    const clean = input.trim();
    if (!clean) return;
    const id = ++request.current;
    setError(null);
    const local = learnWithDictionary(clean, to, dir);
    setResult(local);
    if (local.target.length > 0 || !aiAvailable) return;
    setLoading(true);
    try {
      const res = await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, dialect: to, direction: dir }),
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

  const swap = () => {
    const next: LearnDirection = toSpanish ? "to-english" : "to-spanish";
    setDirection(next);
    setText("");
    edit();
  };

  const english = (
    <span className="flex items-center gap-2">
      <span aria-hidden className="grid size-6 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
        EN
      </span>
      {t("Inglés")}
    </span>
  );
  const spanish = (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <Flag code={dialect} />
      {countryShort(dialect)}
    </span>
  );
  const label = (side: "from" | "to") =>
    (side === "from") === toSpanish ? t("Inglés") : t("Español de {country}", { country: countryInSentence(dialect) });

  const targetText = result ? join(result.target) : "";

  return (
    <TabScreen>
      <TopBar />
      <div className="mt-4 grid grid-cols-[1fr_40px_1fr] items-center gap-2">
        <div className="flex h-12 items-center justify-center rounded-full bg-white px-3 text-[14.5px] font-semibold shadow-card">
          {toSpanish ? english : spanish}
        </div>
        <button
          type="button"
          aria-label={t("Cambiar la dirección")}
          onClick={swap}
          className="grid size-10 place-items-center rounded-full bg-navy text-white transition active:rotate-180"
        >
          <ArrowLeftRight className="size-[18px]" />
        </button>
        {toSpanish ? (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-white px-2 text-[14.5px] font-semibold whitespace-nowrap shadow-card"
          >
            {spanish}
            <ChevronDown aria-hidden className="size-4" />
            <span className="sr-only">. {t("Cambiar el español que aprendes")}</span>
          </button>
        ) : (
          <div className="flex h-12 items-center justify-center rounded-full bg-white px-3 text-[14.5px] font-semibold shadow-card">
            {english}
          </div>
        )}
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
              lang={toSpanish ? "en" : "es"}
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
                    lang={toSpanish ? "es" : "en"}
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
                      <RoundButton label={t("Escuchar")} onClick={() => speak(targetText, spanishLang, 1)}>
                        <Volume2 className="size-[18px]" />
                      </RoundButton>
                      <RoundButton
                        label={t("Escuchar despacio")}
                        onClick={() => speak(targetText, spanishLang, 0.55)}
                      >
                        <Snail className="size-[18px]" />
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
                        label={`${t("Escuchar despacio")}: ${w.spanish}`}
                        onClick={() => speak(w.spanish, spanishLang, 0.55)}
                      >
                        <Snail className="size-[18px]" />
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
            lang={toSpanish ? "en" : "es"}
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
                  ? t("Escribe en inglés…")
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

      <Sheet open={picking} title="¿Qué español quieres aprender?" onClose={() => setPicking(false)}>
        <CountryList
          selected={dialect}
          onChoose={(code) => {
            setPair({ from: pair.from === code ? pair.to : pair.from, to: code });
            setPicking(false);
            if (result) void translate(result.source, direction, code);
          }}
        />
      </Sheet>
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
