"use client";

import Link from "next/link";
import { ChevronRight, Snail, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DialectSwitcher } from "@/components/dialect-switcher";
import { LearningChip } from "@/components/learning";
import {
  EmptyState,
  ListCard,
  PageHeader,
  ResultCount,
  SearchField,
  capitalize,
} from "@/components/ui";
import { DIALECTS } from "@/lib/dialects";
import { guideRows, normalize, type GuideId, type GuideRow } from "@/lib/dictionary";
import { useT } from "@/lib/i18n";
import { speak } from "@/lib/speech";
import { useDialectPair } from "@/lib/storage";

export function Guide({
  id,
  title,
  emoji,
  subtitle,
}: {
  id: GuideId;
  title: string;
  emoji: string;
  subtitle: string;
}) {
  const [pair, setPair] = useDialectPair();
  const [query, setQuery] = useState("");
  const { t, language, country } = useT();
  const learner = language === "en";

  const rows = useMemo(() => {
    const q = normalize(query);
    return guideRows(id, pair.from, pair.to).filter(
      (r) =>
        !q ||
        normalize(r.from.display).includes(q) ||
        normalize(r.to.display).includes(q) ||
        (r.en ? normalize(r.en).includes(q) : false),
    );
  }, [id, pair.from, pair.to, query]);

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-12">
      <PageHeader fallback="/explorar" />
      <div className="mx-1 mt-5 mb-5 flex flex-col">
        <span aria-hidden className="text-[34px]">
          {emoji}
        </span>
        <h1 className="mt-1 text-[32px] font-extrabold tracking-[-0.03em]">{t(title)}</h1>
        <p className="text-muted">{t(subtitle)}</p>
        <LearningChip />
      </div>
      {!learner && <DialectSwitcher value={pair} onChange={setPair} />}
      <div className="mt-3">
        <SearchField value={query} onChange={setQuery} placeholder="Busca en esta guía" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            query.trim()
              ? t("Nada coincide con «{query}»", { query: query.trim() })
              : t("Aún no hay palabras para {a} y {b}", {
                  a: country(pair.from),
                  b: country(pair.to),
                })
          }
        />
      ) : (
        <div className="mt-4">
          <ListCard>
            {rows.map((row) =>
              learner ? (
                <PhrasebookRow key={row.conceptId} row={row} lang={DIALECTS[pair.to].speechLang} />
              ) : (
                <TranslatorRow key={row.conceptId} row={row} />
              ),
            )}
          </ListCard>
        </div>
      )}
      <ResultCount count={rows.length} active={query.trim() !== ""} />
    </main>
  );
}

/** Spanish mode: how one country says it, then the other. */
function TranslatorRow({ row }: { row: GuideRow }) {
  const target = row.from.entry ?? row.to.entry;
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-muted">{capitalize(row.from.display)}</p>
        <p className="text-[17px] font-extrabold">
          {capitalize(row.to.display)}
          {normalize(row.from.display) === normalize(row.to.display) && (
            <span className="ml-2 rounded-full bg-bg px-2 py-0.5 align-middle text-[12px] font-semibold text-muted">
              igual
            </span>
          )}
        </p>
      </div>
      {target && <ChevronRight className="size-[18px] shrink-0 text-muted" />}
    </>
  );
  return (
    <li>
      {target ? (
        <Link href={`/frase/${target.id}`} className="flex items-center gap-3 py-3.5">
          {content}
        </Link>
      ) : (
        <div className="flex items-center gap-3 py-3.5">{content}</div>
      )}
    </li>
  );
}

/**
 * Learner mode: the word in the Spanish they are learning, what it means in
 * English, how to say it, and buttons to hear it at normal and slow speed.
 */
function PhrasebookRow({ row, lang }: { row: GuideRow; lang: string }) {
  const { t } = useT();
  const word = row.to.text;
  const entry = row.to.entry;
  const pronunciation = entry?.pronunciation;
  const words = (
    <div className="min-w-0 flex-1">
      <p lang="es" className="text-[18px] font-extrabold">
        {capitalize(row.to.display)}
      </p>
      {row.en && (
        <p lang="en" className="text-[15px] text-body">
          {capitalize(row.en)}
        </p>
      )}
      {pronunciation && (
        <p className="mt-0.5 text-[13.5px] text-muted italic">{pronunciation}</p>
      )}
    </div>
  );
  return (
    <li className="flex items-center gap-2 py-3">
      {entry ? (
        <Link href={`/frase/${entry.id}`} className="min-w-0 flex-1">
          {words}
        </Link>
      ) : (
        words
      )}
      <button
        type="button"
        onClick={() => speak(word, lang, 1)}
        aria-label={`${t("Escuchar")}: ${word}`}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-bg hover:bg-lavender"
      >
        <Volume2 aria-hidden className="size-[18px]" />
      </button>
      <button
        type="button"
        onClick={() => speak(word, lang, 0.55)}
        aria-label={`${t("Escuchar despacio")}: ${word}`}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-bg hover:bg-lavender"
      >
        <Snail aria-hidden className="size-[18px]" />
      </button>
    </li>
  );
}
