"use client";

import Link from "next/link";
import {
  BookText,
  Camera,
  CircleArrowRight,
  LoaderCircle,
  Mic,
  Settings,
  Sparkles,
  Volume1,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CountryLabel } from "@/components/flag";
import { DialectSwitcher } from "@/components/dialect-switcher";
import { Logo } from "@/components/logo";
import { CardLink, TermPairText } from "@/components/ui";
import { DIALECTS, type DialectCode } from "@/lib/dialects";
import type { PhraseEntry } from "@/lib/phrase";
import { photoToJpegBase64 } from "@/lib/photo";
import { speak, useDictation } from "@/lib/speech";
import { rememberAiEntries, useDialectPair } from "@/lib/storage";
import {
  isSingleTerm,
  translateWithDictionary,
  type Segment,
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
  const fileInput = useRef<HTMLInputElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const request = useRef(0);

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
      if (local.via === "none" && aiAvailable && from !== to) {
        void askAi(clean, from, to, false);
      }
    },
    [aiAvailable, askAi, pair.from, pair.to],
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

  const single = result && result.via !== "none" && isSingleTerm(result);
  const singleFromId = single ? result.pairs[0].from.id : undefined;
  const singleToId = single ? result.pairs[0].to.id : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-navy px-8 pt-[max(env(safe-area-inset-top),1.25rem)] pb-16 text-white">
        <div className="flex h-12 items-center justify-between">
          <Link
            href="/diccionario"
            aria-label="Mi diccionario"
            className="-ml-2 rounded-full p-2 hover:bg-white/10"
          >
            <BookText className="size-7" strokeWidth={2.25} />
          </Link>
          <Logo className="h-11" />
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            className="-mr-2 rounded-full p-2 hover:bg-white/10"
          >
            <Settings className="size-7" strokeWidth={2.25} />
          </Link>
        </div>
        <div className="mt-12">
          <DialectSwitcher value={pair} onChange={changePair} />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="bg-white px-8 pt-6 pb-8">
          <div className="flex items-center justify-between">
            <CountryLabel code={pair.from} />
            {text && (
              <button
                type="button"
                aria-label="Borrar texto"
                onClick={clear}
                className="-mr-2 rounded-full p-2 text-muted hover:bg-field"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          {result ? (
            <>
              <div className="mt-6 flex items-start gap-3">
                <button
                  type="button"
                  onClick={edit}
                  className="flex-1 text-left text-2xl leading-snug"
                  aria-label="Editar texto"
                >
                  <Highlighted segments={result.source} />
                </button>
                {singleFromId && <DetailArrow id={singleFromId} />}
              </div>
              <SpeakButton
                text={join(result.source)}
                lang={DIALECTS[result.from].speechLang}
              />
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                translate(text);
              }}
            >
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
                rows={3}
                maxLength={500}
                placeholder={dictation.listening ? "Te escucho…" : "Escribe"}
                aria-label={`Texto en español de ${DIALECTS[pair.from].name}`}
                className="mt-4 w-full resize-none bg-transparent text-2xl leading-snug outline-none placeholder:text-placeholder"
              />
              <div className="mt-2 flex items-center justify-end gap-5">
                {text.trim() && (
                  <button
                    type="submit"
                    className="mr-auto rounded-full bg-field px-5 py-2.5 text-sm font-bold tracking-[0.12em] text-navy uppercase hover:bg-[#e6e6ee]"
                  >
                    Traducir
                  </button>
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
                      className="rounded-full p-2 hover:bg-field"
                    >
                      {loading === "photo" ? (
                        <LoaderCircle className="size-8 animate-spin" />
                      ) : (
                        <Camera className="size-8" strokeWidth={2} />
                      )}
                    </button>
                  </>
                )}
                {dictation.supported && (
                  <button
                    type="button"
                    aria-label={dictation.listening ? "Dejar de escuchar" : "Dictar"}
                    aria-pressed={dictation.listening}
                    onClick={dictation.listening ? dictation.stop : dictation.start}
                    className={`grid size-[52px] place-items-center rounded-full bg-navy text-white transition ${
                      dictation.listening ? "animate-pulse ring-8 ring-navy/15" : ""
                    }`}
                  >
                    <Mic className="size-7" strokeWidth={2.25} />
                  </button>
                )}
              </div>
            </form>
          )}
          {(error || dictation.error) && (
            <p role="alert" className="mt-4 text-[15px] text-[#a1262b]">
              {error ?? dictation.error}
            </p>
          )}
        </section>

        {result && (
          <section className="bg-white px-8 pb-8" aria-live="polite">
            <hr className="mb-7 border-[#7f7f7f]/60" />
            <CountryLabel code={result.to} />
            {loading === "ai" ? (
              <p className="mt-6 flex items-center gap-3 text-xl text-muted">
                <LoaderCircle className="size-5 animate-spin" />
                Traduciendo…
              </p>
            ) : result.via === "none" ? (
              <NothingFound
                text={join(result.source)}
                aiAvailable={aiAvailable}
              />
            ) : (
              <>
                <div className="mt-6 flex items-start gap-3">
                  <p className="flex-1 text-2xl leading-snug text-navy">
                    <Highlighted segments={result.target} />
                  </p>
                  {singleToId && <DetailArrow id={singleToId} navy />}
                </div>
                <SpeakButton
                  text={join(result.target)}
                  lang={DIALECTS[result.to].speechLang}
                  navy
                />
                {result.via === "dictionary" && aiAvailable && (
                  <button
                    type="button"
                    onClick={() =>
                      void askAi(join(result.source), result.from, result.to, true)
                    }
                    className="mt-6 flex items-center gap-2 text-sm font-bold tracking-[0.08em] text-muted uppercase hover:text-navy"
                  >
                    <Sparkles className="size-4" />
                    Revisar toda la frase con IA
                  </button>
                )}
                {result.via === "ai" && (
                  <p className="mt-6 flex items-center gap-2 text-sm text-muted">
                    <Sparkles className="size-4" />
                    Traducido con IA. Puede contener errores.
                  </p>
                )}
              </>
            )}
          </section>
        )}

        <section className="flex-1 bg-gray px-6 pt-5 pb-[max(env(safe-area-inset-bottom),2rem)]">
          {result && !single && result.pairs.length > 0 && !loading && (
            <ul className="space-y-6">
              {result.pairs.map((p) => (
                <li key={`${p.from.text}-${p.to.text}`}>
                  {p.from.id ? (
                    <CardLink href={`/frase/${p.from.id}`}>
                      <TermPairText from={p.from.text} to={p.to.text} />
                    </CardLink>
                  ) : (
                    <div className="rounded-[22px] bg-white px-7 py-4">
                      <TermPairText from={p.from.text} to={p.to.text} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Highlighted({ segments }: { segments: Segment[] }) {
  return segments.map((s, i) =>
    s.highlight ? (
      <strong key={i} className="font-bold">
        {s.text}
      </strong>
    ) : (
      <span key={i}>{s.text}</span>
    ),
  );
}

function SpeakButton({
  text,
  lang,
  navy,
}: {
  text: string;
  lang: string;
  navy?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="Escuchar"
      onClick={() => speak(text, lang)}
      className={`mt-5 -ml-2 rounded-full p-2 hover:bg-field ${navy ? "text-navy" : "text-ink"}`}
    >
      <Volume1 className="size-7 fill-current" strokeWidth={2} />
    </button>
  );
}

function DetailArrow({ id, navy }: { id: string; navy?: boolean }) {
  return (
    <Link
      href={`/frase/${id}`}
      aria-label="Ver definición y origen"
      className={`mt-0.5 rounded-full p-1 hover:bg-field ${navy ? "text-navy/60" : "text-muted"}`}
    >
      <CircleArrowRight className="size-8" strokeWidth={2} />
    </Link>
  );
}

function NothingFound({
  text,
  aiAvailable,
}: {
  text: string;
  aiAvailable: boolean;
}) {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-2xl leading-snug text-navy">{text}</p>
      <p className="text-[15px] text-muted">
        {aiAvailable
          ? "No encontramos nada regional que cambiar."
          : "Esta frase no está en el diccionario de Hola todavía."}
      </p>
    </div>
  );
}
