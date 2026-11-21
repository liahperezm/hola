"use client";

import { Check, MessageSquarePlus } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { DIALECT_CODES, DIALECTS, type DialectCode } from "@/lib/dialects";
import { useT } from "@/lib/i18n";
import { Sheet } from "./sheet";

const FEEDBACK_EMAIL = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL;

type Kind = "agregar" | "corregir";

let enabledPromise: Promise<boolean> | undefined;
/** Whether the server can deliver suggestions (asked once per visit). */
function suggestionsEnabled(): Promise<boolean> {
  enabledPromise ??= fetch("/api/suggestions")
    .then((r) => r.json() as Promise<{ enabled?: boolean }>)
    .then((r) => Boolean(r.enabled))
    .catch(() => false);
  return enabledPromise;
}

/**
 * "¿Algo no suena bien?": opens the suggestion form, filled in with what the
 * person was looking at. Hidden when suggestions can't be delivered.
 */
/** True once we know a suggestion can be delivered (server or email). */
export function useSuggestionsEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    void suggestionsEnabled().then((on) => live && setEnabled(on || Boolean(FEEDBACK_EMAIL)));
    return () => {
      live = false;
    };
  }, []);
  return enabled;
}

export function SuggestButton({
  label = "¿Algo no suena bien? Sugiere un cambio",
  kind = "corregir",
  word = "",
  country,
  context = "",
  className = "",
  variant = "pill",
}: {
  label?: string;
  kind?: Kind;
  word?: string;
  country?: DialectCode;
  context?: string;
  className?: string;
  /** "pill": a button; "card": a card that explains why suggestions matter. */
  variant?: "pill" | "card";
}) {
  const enabled = useSuggestionsEnabled();
  const [open, setOpen] = useState(false);
  const { t } = useT();

  if (!enabled) return null;
  return (
    <>
      {variant === "card" ? (
        <div className={`rounded-[22px] bg-lavender px-5 py-4 ${className}`}>
          <p className="text-[16px] font-bold">{t(label)}</p>
          <p className="mt-1 text-[14.5px] text-body">
            {t("Las personas de cada país son nuestra mejor fuente. Cuéntanos qué falta o qué no suena bien.")}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-[14.5px] font-bold text-white"
          >
            <MessageSquarePlus aria-hidden className="size-4" />
            {t("Sugerir un cambio")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-[14px] font-semibold text-navy shadow-card hover:bg-lavender/50 ${className}`}
        >
          <MessageSquarePlus aria-hidden className="size-4" />
          {t(label)}
        </button>
      )}
      <SuggestSheet
        open={open}
        onClose={() => setOpen(false)}
        initial={{ kind, word, country, context }}
      />
    </>
  );
}

export function SuggestSheet({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: { kind: Kind; word: string; country?: DialectCode; context: string };
}) {
  const [kind, setKind] = useState<Kind>(initial.kind);
  const [country, setCountry] = useState<DialectCode>(initial.country ?? "DO");
  const [word, setWord] = useState(initial.word);
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [fromThere, setFromThere] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const ids = useId();
  const { t, country: countryName } = useT();

  // Start fresh each time the form opens.
  useEffect(() => {
    if (!open) return;
    setKind(initial.kind);
    setCountry(initial.country ?? "DO");
    setWord(initial.word);
    setMeaning("");
    setExample("");
    setFromThere(false);
    setState("idle");
    setError(null);
  }, [open, initial.kind, initial.country, initial.word]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("sending");
    const payload = {
      kind,
      country,
      word,
      meaning,
      example,
      fromThere,
      context: initial.context,
      website,
    };
    const server = await suggestionsEnabled();
    if (!server && FEEDBACK_EMAIL) {
      const body = [
        `País: ${DIALECTS[country].name}`,
        `Palabra o frase: ${word}`,
        `${kind === "agregar" ? "Qué significa" : "Qué está mal / cómo es"}: ${meaning}`,
        example ? `Ejemplo: ${example}` : "",
        `¿Soy de ese país? ${fromThere ? "Sí" : "No"}`,
      ]
        .filter(Boolean)
        .join("\n");
      window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
        `Hola: ${word}`,
      )}&body=${encodeURIComponent(body)}`;
      setState("sent");
      return;
    }
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) throw new Error(body.error ?? "No pudimos enviar tu sugerencia.");
      setState("sent");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "No pudimos enviar tu sugerencia.");
    }
  };

  const field =
    "mt-1.5 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-[16px] text-navy placeholder:text-muted";

  return (
    <Sheet open={open} title="Sugerir un cambio" onClose={onClose}>
      {state === "sent" ? (
        <div className="space-y-4 pb-2 text-center" role="status">
          <Check aria-hidden className="mx-auto mt-2 size-10" />
          <p className="text-lg font-bold">{t("¡Gracias!")}</p>
          <p className="text-muted">
            {t("Revisamos cada sugerencia. Las personas de cada país son quienes mejor conocen su español.")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-full bg-navy font-bold text-white"
          >
            {t("Listo")}
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="max-h-[70dvh] space-y-4 overflow-y-auto pb-2">
          <p className="text-[15px] text-muted">
            {t("Las personas de cada país son nuestra mejor fuente. Cuéntanos qué falta o qué no suena bien.")}
          </p>

          <fieldset>
            <legend className="text-[14px] font-bold">{t("¿Qué quieres hacer?")}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["agregar", "Agregar algo"],
                  ["corregir", "Corregir algo"],
                ] as [Kind, string][]
              ).map(([value, text]) => (
                <label
                  key={value}
                  className={`flex h-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy ${
                    kind === value ? "bg-navy text-white" : "bg-bg text-navy"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${ids}-kind`}
                    value={value}
                    checked={kind === value}
                    onChange={() => setKind(value)}
                    className="sr-only"
                  />
                  {t(text)}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-[14px] font-bold">
            {t("País")}
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as DialectCode)}
              className={field}
            >
              {DIALECT_CODES.map((code) => (
                <option key={code} value={code}>
                  {countryName(code)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[14px] font-bold">
            {t("Palabra o frase")}
            <input
              required
              maxLength={120}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={t("Ej.: cocaleca")}
              className={field}
            />
          </label>

          <label className="block text-[14px] font-bold">
            {kind === "agregar" ? t("¿Qué significa?") : t("¿Qué está mal? ¿Cómo se dice?")}
            <textarea
              required
              maxLength={1000}
              rows={3}
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder={kind === "agregar" ? t("Ej.: palomitas de maíz") : t("Ej.: en mi país se dice…")}
              className={`${field} resize-none`}
            />
          </label>

          <label className="block text-[14px] font-bold">
            {t("Un ejemplo")} <span className="font-normal text-muted">{t("(opcional)")}</span>
            <input
              maxLength={500}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder={t("Ej.: Vamos a hacer cocaleca para la película.")}
              className={field}
            />
          </label>

          <label className="flex min-h-11 items-center gap-3 text-[15px]">
            <input
              type="checkbox"
              checked={fromThere}
              onChange={(e) => setFromThere(e.target.checked)}
              className="size-5 accent-navy"
            />
            {t("Soy de {country}", { country: countryName(country) })}
          </label>

          {/* Left empty by people; bots fill it in. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={state === "sending"}
            className="h-[52px] w-full rounded-full bg-navy text-[16px] font-bold text-white disabled:opacity-60"
          >
            {state === "sending" ? t("Enviando…") : t("Enviar sugerencia")}
          </button>
        </form>
      )}
    </Sheet>
  );
}
