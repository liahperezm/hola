"use client";

import Link from "next/link";
import { Bookmark, Check, Copy, Quote, Share } from "lucide-react";
import { useState } from "react";
import { CountryLabel, Flag } from "@/components/flag";
import { BackButton, capitalize } from "@/components/ui";
import { DIALECTS, termLabel } from "@/lib/dialects";
import { getEntry, otherWays, type Entry } from "@/lib/dictionary";
import type { PhraseEntry } from "@/lib/phrase";
import { useAiEntry, useFavorites, useHydrated } from "@/lib/storage";

type Tab = "definicion" | "origen";

export function Phrase({ id }: { id: string }) {
  const dictionaryEntry = getEntry(id);
  const aiEntry = useAiEntry(id);
  const { favorites } = useFavorites();
  const entry: PhraseEntry | undefined =
    dictionaryEntry ?? aiEntry ?? favorites.find((f) => f.id === id);
  const hydrated = useHydrated();

  if (!entry && !hydrated) return <div className="min-h-dvh bg-navy" />;
  if (!entry) {
    return (
      <div className="min-h-dvh bg-white">
        <header className="bg-navy px-6 pt-[max(env(safe-area-inset-top),1.25rem)] pb-8 text-white">
          <div className="relative h-9">
            <BackButton />
          </div>
        </header>
        <main className="space-y-3 px-8 pt-10">
          <p className="text-xl">No encontramos esta palabra.</p>
          <Link href="/" className="font-bold text-navy underline">
            Volver al traductor
          </Link>
        </main>
      </div>
    );
  }

  return <PhraseView entry={entry} dictionaryEntry={dictionaryEntry} />;
}

function PhraseView({
  entry,
  dictionaryEntry,
}: {
  entry: PhraseEntry;
  dictionaryEntry?: Entry;
}) {
  const [tab, setTab] = useState<Tab>("definicion");
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(entry.id);
  const others = dictionaryEntry
    ? otherWays(dictionaryEntry.conceptId, entry.dialect)
    : [];
  const fromAi = entry.id.startsWith("ai.");

  return (
    <div className="min-h-dvh bg-white">
      <header className="bg-navy px-12 pt-[max(env(safe-area-inset-top),1.25rem)] pb-7 text-white">
        <div className="relative -mx-6 h-9">
          <BackButton />
        </div>
        <div className="mt-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[32px] leading-tight font-bold">
              {capitalize(entry.text)}
            </h1>
            <p className="mt-2 text-xl italic">
              {termLabel(entry.text, entry.dialect)}
            </p>
          </div>
          <button
            type="button"
            aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-pressed={saved}
            onClick={() => toggle(entry)}
            className="-mr-2 rounded-full p-2 hover:bg-white/10"
          >
            <Bookmark
              className={`size-8 ${saved ? "fill-white" : ""}`}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </header>

      <main className="px-12 pb-12">
        <div role="tablist" className="flex gap-14 pt-12">
          <TabButton active={tab === "definicion"} onClick={() => setTab("definicion")}>
            Definición
          </TabButton>
          <TabButton active={tab === "origen"} onClick={() => setTab("origen")}>
            Origen
          </TabButton>
        </div>

        <div role="tabpanel" className="pt-10">
          {tab === "definicion" ? (
            <div className="space-y-10">
              <div>
                {entry.pronunciation && (
                  <p className="mb-4 text-lg font-light text-muted italic">
                    {entry.pronunciation}
                  </p>
                )}
                <p className="text-xl leading-relaxed text-muted">
                  {entry.definition ?? entry.meaning}
                </p>
              </div>

              {entry.antonyms && entry.antonyms.length > 0 && (
                <div>
                  <h2 className="font-bold tracking-wide uppercase">Antónimos</h2>
                  <p className="mt-1 text-xl leading-relaxed text-muted">
                    {entry.antonyms.join(", ")}
                  </p>
                </div>
              )}

              {entry.example && (
                <blockquote className="flex gap-4 text-xl">
                  <Quote className="mt-0.5 size-7 shrink-0 rotate-180 fill-ink" strokeWidth={0} />
                  <Example text={entry.example} term={entry.text} />
                </blockquote>
              )}

              {others.length > 0 && (
                <div>
                  <h2 className="font-bold tracking-wide uppercase">
                    En otros países
                  </h2>
                  <ul className="mt-3 divide-y divide-[#7f7f7f]/30">
                    {others.map((o) => (
                      <li key={o.id}>
                        <Link
                          href={`/frase/${o.id}`}
                          className="flex items-center gap-4 py-3 hover:text-navy"
                        >
                          <Flag code={o.dialect} size={22} />
                          <span className="flex-1 text-lg">{capitalize(o.text)}</span>
                          <span className="text-sm text-muted">
                            {DIALECTS[o.dialect].short}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              <CountryLabel code={entry.dialect} />
              <div>
                <h2 className="text-lg font-bold uppercase">Un poco de historia</h2>
                <p className="mt-4 text-xl leading-relaxed text-muted">
                  {entry.origin ??
                    "Todavía no tenemos la historia de esta palabra. ¿La conoces? Pronto podrás contarla."}
                </p>
              </div>
            </div>
          )}

          {fromAi && (
            <p className="mt-10 text-sm text-muted">
              Explicación generada con IA. Puede contener errores.
            </p>
          )}
          <Actions entry={entry} />
        </div>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`border-b-[5px] pb-2 text-xl uppercase transition ${
        active ? "border-navy font-bold text-navy" : "border-transparent text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Example sentence in italics with the term itself upright, as in the design. */
function Example({ text, term }: { text: string; term: string }) {
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (at === -1) return <p className="italic">{text}</p>;
  return (
    <p>
      <span className="italic">{text.slice(0, at)}</span>
      {text.slice(at, at + term.length)}
      <span className="italic">{text.slice(at + term.length)}</span>
    </p>
  );
}

function Actions({ entry }: { entry: PhraseEntry }) {
  const [copied, setCopied] = useState(false);
  const summary = `${capitalize(entry.text)} (${termLabel(entry.text, entry.dialect).toLowerCase()}): ${entry.definition ?? entry.meaning}`;

  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: entry.text, text: summary, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${summary}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="mt-12 flex items-center gap-10">
      <button
        type="button"
        aria-label="Copiar"
        onClick={() => void copy()}
        className="-ml-2 rounded-full p-2 hover:bg-field"
      >
        {copied ? (
          <Check className="size-7 text-navy" strokeWidth={3} />
        ) : (
          <Copy className="size-7" strokeWidth={2.5} />
        )}
      </button>
      <button
        type="button"
        aria-label="Compartir"
        onClick={() => void share()}
        className="rounded-full p-2 hover:bg-field"
      >
        <Share className="size-7" strokeWidth={2.5} />
      </button>
      <span aria-live="polite" className="text-sm text-muted">
        {copied ? "Copiado" : ""}
      </span>
    </div>
  );
}
