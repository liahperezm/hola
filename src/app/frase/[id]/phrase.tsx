"use client";

import Link from "next/link";
import { Bookmark, Share, Volume2 } from "lucide-react";
import { useState } from "react";
import { CountryLabel, Flag } from "@/components/flag";
import { EmptyState, IconButton, ListCard, PageHeader, capitalize } from "@/components/ui";
import { DIALECTS, termLabel } from "@/lib/dialects";
import { getEntry, otherWays, type Entry } from "@/lib/dictionary";
import type { PhraseEntry } from "@/lib/phrase";
import { speak } from "@/lib/speech";
import { useAiEntry, useFavorites, useHydrated } from "@/lib/storage";

type Tab = "definicion" | "origen" | "otros";

export function Phrase({ id }: { id: string }) {
  const dictionaryEntry = getEntry(id);
  const aiEntry = useAiEntry(id);
  const { favorites } = useFavorites();
  const hydrated = useHydrated();
  const entry: PhraseEntry | undefined =
    dictionaryEntry ?? aiEntry ?? favorites.find((f) => f.id === id);

  if (!entry) {
    return (
      <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <PageHeader />
        {hydrated && (
          <EmptyState title="No encontramos esta palabra">
            <Link href="/" className="font-bold text-navy underline">
              Volver al traductor
            </Link>
          </EmptyState>
        )}
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
  const others = dictionaryEntry
    ? otherWays(dictionaryEntry.conceptId, entry.dialect)
    : [];
  const tabs: { id: Tab; label: string }[] = [
    { id: "definicion", label: "Definición" },
    { id: "origen", label: "Origen" },
    ...(others.length > 0 ? [{ id: "otros" as const, label: "Otros países" }] : []),
  ];
  const [tab, setTab] = useState<Tab>("definicion");
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(entry.id);
  const label = termLabel(entry.text, entry.dialect);
  const summary = `${capitalize(entry.text)} (${label.toLowerCase()}): ${entry.definition ?? entry.meaning}`;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: entry.text, text: summary, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${summary}\n${url}`);
    }
  };

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-14">
      <PageHeader>
        <IconButton label="Compartir" onClick={() => void share()}>
          <Share className="size-[19px]" />
        </IconButton>
        <IconButton
          label={saved ? "Quitar de guardados" : "Guardar"}
          pressed={saved}
          onClick={() => toggle(entry)}
        >
          <Bookmark className={`size-[19px] ${saved ? "fill-navy" : ""}`} />
        </IconButton>
      </PageHeader>

      <div className="mx-1 mt-6 mb-6">
        <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-muted">
          <Flag code={entry.dialect} className="text-sm" />
          {label}
        </p>
        <h1 className="mt-2 mb-2.5 text-[36px] leading-[1.1] font-extrabold tracking-[-0.03em]">
          {capitalize(entry.text)}
        </h1>
        <button
          type="button"
          onClick={() => speak(entry.text, DIALECTS[entry.dialect].speechLang)}
          className="-ml-1 flex items-center gap-2 rounded-full px-1 text-[14.5px] text-muted hover:text-navy"
        >
          <Volume2 className="size-4" />
          {entry.pronunciation ?? "Escuchar"}
        </button>
      </div>

      <div role="tablist" className="mx-1 mb-6 flex gap-[26px] border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-[3px] pb-3 text-[15.5px] transition ${
              tab === t.id
                ? "border-navy font-bold text-navy"
                : "border-transparent font-semibold text-muted hover:text-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "definicion" && (
          <div className="rounded-[22px] bg-white px-5 py-5 shadow-card">
            <p className="text-[17px] leading-relaxed text-body">
              {entry.definition ?? entry.meaning}
            </p>
            {entry.example && (
              <blockquote className="mt-5 border-l-[3px] border-lavender pl-4 text-[16.5px] leading-normal text-muted italic">
                <Example text={entry.example} term={entry.text} />
              </blockquote>
            )}
            {entry.antonyms && entry.antonyms.length > 0 && (
              <p className="mt-6 border-t border-line pt-5 text-[15.5px] leading-normal text-muted">
                <span className="mb-1 block text-[13px] font-bold text-navy">
                  Lo contrario
                </span>
                {entry.antonyms.join(", ")}
              </p>
            )}
          </div>
        )}

        {tab === "origen" && (
          <div className="rounded-[22px] bg-white px-5 py-5 shadow-card">
            <CountryLabel code={entry.dialect} />
            <p className="mt-4 text-[17px] leading-relaxed text-body">
              {entry.origin ??
                "Todavía no tenemos la historia de esta palabra. ¿La conoces? Pronto podrás contarla."}
            </p>
          </div>
        )}

        {tab === "otros" && (
          <div>
            <ListCard>
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/frase/${o.id}`} className="flex items-center gap-3 py-3.5">
                    <Flag code={o.dialect} />
                    <span className="flex-1 text-[16px] font-semibold">{o.text}</span>
                    <span className="text-[13px] text-muted">{DIALECTS[o.dialect].name}</span>
                  </Link>
                </li>
              ))}
            </ListCard>
          </div>
        )}

        {entry.id.startsWith("ai.") && (
          <p className="mx-1 mt-6 text-sm text-muted">
            Explicación generada con IA. Puede contener errores.
          </p>
        )}
      </div>
    </div>
  );
}

/** The example in italics with the word itself upright and bold. */
function Example({ text, term }: { text: string; term: string }) {
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (at === -1) return <p>{text}</p>;
  return (
    <p>
      {text.slice(0, at)}
      <b className="font-bold text-navy not-italic">{text.slice(at, at + term.length)}</b>
      {text.slice(at + term.length)}
    </p>
  );
}
