"use client";

import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Copy,
  LoaderCircle,
  Mic,
  Share,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { DialectSwitcher } from "@/components/dialect-switcher";
import { CountryLabel } from "@/components/flag";
import { ListCard, SectionTitle, TabScreen, TopBar } from "@/components/ui";
import { DIALECTS, type DialectCode } from "@/lib/dialects";
import type { PhraseEntry } from "@/lib/phrase";
import { warningText } from "@/lib/false-friends";
import { photoToJpegBase64 } from "@/lib/photo";
import { speak, useDictation } from "@/lib/speech";
import { rememberAiEntries, useDialectPair, useSeen } from "@/lib/storage";
import {
  translateWithDictionary,
  type Segment,
  type TermPair,
  type Translation,
} from "@/lib/translate";

type ApiResponse = {
  translation?: Translation;
  entries?: PhraseEntry[];
  aiAvailable?: boolean;
  error?: string;
};

const join = (segments: Segment[]) => segments.map((s) => s.text).join("");

export function Translator() {
  const [pair, setPair] = useDialectPair();
  const [text, setText] = useState("");
  const [result, setResult] = useState<Translation | null>(null);
  const [loading, setLoading] = useState<"ai" | "photo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const tip = useSeen("translate-tip");
  const fileInput = useRef<HTMLInputElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const resultCard = useRef<HTMLElement>(null);
  const request = useRef(0);
  const hasResult = result !== null;

  // The text field disappears once there is a result, so keyboard and screen
  // reader users are taken to the translation instead of the top of the page.
  useEffect(() => {
    if (hasResult) resultCard.current?.focus();
  }, [hasResult]);

  useEffect(() => {
    fetch("/api/translate")
      .then((r) => r.json() as Promise<{ aiAvailable?: boolean }>)
      .then((r) => setAiAvailable(Boolean(r.aiAvailable)))
      .catch(() => setAiAvailable(false));
  }, []);

  const askAi = useCallback(
    async (input: string, from: DialectCode, to: DialectCode, force: boolean) => {
      const id = ++request.current;
      setLoading("ai");
      setError(null);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input, from, to, useAi: force }),
        });
        const body = (await res.json()) as ApiResponse;
        if (id !== request.current) return;
        if (body.entries) rememberAiEntries(body.entries);
        if (body.translation) setResult(body.translation);
        if (body.error) setError(body.error);
      } catch {
        if (id === request.current) setError("No hay conexión. Intenta otra vez.");
      } finally {
        if (id === request.current) setLoading(null);
      }
    },
    [],
  );

  const translate = useCallback(
    (input: string, from = pair.from, to = pair.to) => {
      const clean = input.trim();
      if (!clean) return;
      request.current++;
      setLoading(null);
      setError(null);
      const local = translateWithDictionary(clean, from, to);
      setResult(local);
      tip.markSeen();
      if (local.via === "none" && aiAvailable && from !== to) {
        void askAi(clean, from, to, false);
      }
    },
    [aiAvailable, askAi, pair.from, pair.to, tip.markSeen],
  );

  const changePair = (next: { from: DialectCode; to: DialectCode }) => {
    setPair(next);
    if (result) translate(text, next.from, next.to);
  };

  const dictation = useDictation(DIALECTS[pair.from].speechLang, (heard, final) => {
    setText(heard);
    if (final) translate(heard);
  });

  const edit = () => {
    request.current++;
    setResult(null);
    setLoading(null);
    setError(null);
    requestAnimationFrame(() => textArea.current?.focus());
  };

  const clear = () => {
    setText("");
    edit();
  };

  const readPhoto = async (file: File) => {
    setLoading("photo");
    setError(null);
    try {
      const image = await photoToJpegBase64(file);
      const res = await fetch("/api/read-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mediaType: "image/jpeg" }),
      });
      const body = (await res.json()) as { text?: string; error?: string };
      setLoading(null);
      if (body.text) {
        setText(body.text);
        translate(body.text);
      } else {
        setError(body.error ?? "No pudimos leer la foto.");
      }
    } catch {
      setLoading(null);
      setError("No pudimos leer la foto.");
    }
  };

  const errorMessage = error ?? dictation.error;

  return (
    <TabScreen>
      <TopBar />
      <div className="mt-4">
        <DialectSwitcher value={pair} onChange={changePair} />
      </div>

      {result ? (
        <>
          <section
            ref={resultCard}
            tabIndex={-1}
            aria-label="Traducción"
            className="mt-4 rounded-[26px] bg-white px-5 py-[18px] shadow-card focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <CountryLabel code={result.from} />
              <ClearButton onClick={clear} />
            </div>
            <button
              type="button"
              onClick={edit}
              className="mt-2.5 block w-full text-left text-[23px] leading-snug font-medium tracking-[-0.01em] text-body"
            >
              <Highlighted segments={result.source} />
              <span className="sr-only">. Editar texto</span>
            </button>
            <div className="mt-3 flex gap-2">
              <ActionButton
                label="Escuchar"
                onClick={() =>
                  speak(join(result.source), DIALECTS[result.from].speechLang)
                }
              >
                <Volume2 className="size-[18px]" />
              </ActionButton>
            </div>

            <hr className="my-[18px] border-line" />

            <div aria-live="polite">
              <CountryLabel code={result.to} />
              {loading === "ai" ? (
                <p className="mt-3 flex items-center gap-3 text-[18px] text-muted">
                  <LoaderCircle className="size-5 animate-spin" />
                  Traduciendo…
                </p>
              ) : (
                <>
                  <p className="mt-2.5 text-[23px] leading-snug font-medium tracking-[-0.01em]">
                    <Highlighted segments={result.target} />
                  </p>
                  {result.via === "none" && (
                    <p className="mt-2 text-sm text-muted">
                      {`No encontramos palabras que se digan distinto en ${DIALECTS[result.to].name}.`}
                    </p>
                  )}
                  {/* The dictionary writes these into the text; the AI does not. */}
                  {result.via === "ai" && (result.warnings ?? []).map((w) => (
                    <p
                      key={w.word}
                      className="mt-3 rounded-2xl bg-butter px-4 py-3 text-[14.5px] leading-snug text-navy"
                    >
                      {warningText(w)}{" "}
                      <span className="font-semibold">(vulgar)</span>
                    </p>
                  ))}
                  <TargetActions
                    text={join(result.target)}
                    lang={DIALECTS[result.to].speechLang}
                  />
                </>
              )}
            </div>
          </section>

          {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

          {!loading && result.via === "dictionary" && aiAvailable && (
            <button
              type="button"
              onClick={() =>
                void askAi(join(result.source), result.from, result.to, true)
              }
              className="mx-auto mt-4 flex items-center gap-2 text-[13.5px] font-semibold text-muted hover:text-navy"
            >
              <Sparkles className="size-4" />
              Revisar toda la frase con IA
            </button>
          )}
          {!loading && result.via === "ai" && (
            <p className="mt-4 flex items-center justify-center gap-2 text-[13.5px] text-muted">
              <Sparkles className="size-4" />
              Traducido con IA. Puede contener errores.
            </p>
          )}

          {!loading && result.pairs.length > 0 && (
            <RegionalWords pairs={result.pairs} />
          )}
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            translate(text);
          }}
          className="mt-4 flex min-h-[420px] flex-1 flex-col rounded-[26px] bg-white px-[22px] py-[22px] shadow-card focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-navy"
        >
          <div className="flex items-center justify-between">
            <CountryLabel code={pair.from} />
            {text && <ClearButton onClick={clear} />}
          </div>
          <textarea
            ref={textArea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                translate(text);
              }
            }}
            enterKeyHint="go"
            maxLength={500}
            placeholder={dictation.listening ? "Te escucho…" : "Escribe o habla…"}
            aria-label={`Texto en español de ${DIALECTS[pair.from].name}`}
            className="mt-4 w-full flex-1 resize-none bg-transparent text-[28px] leading-snug font-medium tracking-[-0.015em] placeholder:text-placeholder focus-visible:outline-none"
          />
          {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
          {!tip.seen && !text && (
            <p className="text-center text-[14px] text-muted">
              {aiAvailable
                ? "Escribe una frase, dicta con el micrófono o toma una foto."
                : "Escribe una frase o dicta con el micrófono."}
            </p>
          )}
          <div className="relative mt-4 flex h-[68px] items-center justify-center">
            {text.trim() ? (
              <button
                type="submit"
                className="flex h-14 items-center gap-2 rounded-full bg-navy px-7 text-[16px] font-bold text-white shadow-[0_8px_20px_rgb(3_0_80/0.25)] active:scale-95"
              >
                Traducir
                <ArrowRight className="size-5" />
              </button>
            ) : (
              dictation.supported && (
                <button
                  type="button"
                  aria-label={dictation.listening ? "Dejar de escuchar" : "Hablar"}
                  aria-pressed={dictation.listening}
                  onClick={dictation.listening ? dictation.stop : dictation.start}
                  className={`grid size-[68px] place-items-center rounded-full bg-navy text-white shadow-[0_8px_20px_rgb(3_0_80/0.25)] transition active:scale-95 ${
                    dictation.listening ? "animate-pulse ring-8 ring-navy/15" : ""
                  }`}
                >
                  <Mic className="size-7" />
                </button>
              )
            )}
            {aiAvailable && (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void readPhoto(file);
                  }}
                />
                <button
                  type="button"
                  aria-label="Traducir una foto"
                  onClick={() => fileInput.current?.click()}
                  disabled={loading === "photo"}
                  className="absolute right-0 grid size-12 place-items-center rounded-full bg-bg hover:bg-lavender/60"
                >
                  {loading === "photo" ? (
                    <LoaderCircle className="size-[22px] animate-spin" />
                  ) : (
                    <Camera className="size-[22px]" />
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      )}
    </TabScreen>
  );
}

function RegionalWords({ pairs }: { pairs: TermPair[] }) {
  return (
    <section>
      <SectionTitle>
        {pairs.length === 1 ? "1 palabra regional" : `${pairs.length} palabras regionales`}
      </SectionTitle>
      <ListCard>
        {pairs.map((p) => {
          const content = (
            <>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-[15.5px]">
                  <span className="font-semibold text-muted">{p.from.text}</span>
                  <ArrowRight className="size-[15px] text-muted" />
                  <span className="font-extrabold">{p.to.text}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted">{capitalizeFirst(p.meaning)}.</p>
              </div>
              {(p.from.id ?? p.to.id) && (
                <ChevronRight className="size-[18px] shrink-0 text-muted" />
              )}
            </>
          );
          // A plain word has no page of its own; open the other country's word.
          const id = p.from.id ?? p.to.id;
          return (
            <li key={`${p.from.text}-${p.to.text}`}>
              {id ? (
                <Link
                  href={`/frase/${id}`}
                  className="flex items-center gap-3 py-3"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 py-3">{content}</div>
              )}
            </li>
          );
        })}
      </ListCard>
    </section>
  );
}

function capitalizeFirst(text: string) {
  const clean = text.replace(/[.\s]+$/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function Highlighted({ segments }: { segments: Segment[] }) {
  return segments.map((s, i) =>
    s.highlight ? (
      <strong key={i} className="font-extrabold">
        {s.text}
      </strong>
    ) : (
      <span key={i}>{s.text}</span>
    ),
  );
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full bg-bg transition hover:bg-lavender active:scale-95"
    >
      {children}
    </button>
  );
}

function TargetActions({ text, lang }: { text: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="mt-3 flex items-center gap-2">
      <ActionButton label="Escuchar" onClick={() => speak(text, lang)}>
        <Volume2 className="size-[18px]" />
      </ActionButton>
      <ActionButton label="Copiar" onClick={() => void copy()}>
        {copied ? <Check className="size-[18px]" /> : <Copy className="size-[18px]" />}
      </ActionButton>
      <ActionButton
        label="Compartir"
        onClick={() => {
          if (navigator.share) void navigator.share({ text }).catch(() => {});
          else void copy();
        }}
      >
        <Share className="size-[18px]" />
      </ActionButton>
      <span role="status" className="ml-1 text-[13px] font-semibold text-muted">
        {copied ? "Copiado" : ""}
      </span>
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Borrar texto"
      onClick={onClick}
      className="-mr-2 grid size-9 place-items-center rounded-full text-muted hover:bg-bg"
    >
      <X className="size-4" />
    </button>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-3 text-center text-sm text-danger">
      {children}
    </p>
  );
}
