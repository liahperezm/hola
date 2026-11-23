"use client";

import { Rich } from "@/components/rich";
import Link from "next/link";
import { ChevronRight, Heart, Share, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { CountryLabel, Flag } from "@/components/flag";
import { EmptyState, IconButton, ListCard, PageHeader, capitalize } from "@/components/ui";
import { DIALECTS, termLabel, termLabelEn } from "@/lib/dialects";
import { useT } from "@/lib/i18n";
import { getEntry, knownEntry, normalize, otherWays, otherWaysByWord, type Entry } from "@/lib/dictionary";
import type { PhraseEntry } from "@/lib/phrase";
import { speak } from "@/lib/speech";
import { useAiEntry, useFavorites, useHydrated, useSeen } from "@/lib/storage";
import { isInstalled } from "@/lib/install";
import { InstallSheet } from "@/components/install-sheet";
import { SuggestButton } from "@/components/suggest";

type Tab = "definicion" | "origen" | "otros";

export function Phrase({ id }: { id: string }) {
  const { t } = useT();
  const aiEntry = useAiEntry(id);
  const { favorites } = useFavorites();
  const hydrated = useHydrated();
  const saved = favorites.find((f) => f.id === id);
  // A page the AI wrote for a word the dictionary knows shows the dictionary's.
  const written = aiEntry ?? saved;
  const dictionaryEntry =
    getEntry(id) ?? (written ? knownEntry(written.text, written.dialect) : undefined);
  const entry: PhraseEntry | undefined = dictionaryEntry ?? written;

  if (!entry) {
    return (
      <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <PageHeader />
        {hydrated && (
          <EmptyState title={t("No encontramos esta palabra")}>
            <Link href="/" className="font-bold text-navy underline">
              {t("Volver al traductor")}
            </Link>
          </EmptyState>
        )}
      </main>
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
    // Only the sections there is something to show in.
    ...(entry.origin ? [{ id: "origen" as const, label: "Origen" }] : []),
    ...(others.length > 0 ? [{ id: "otros" as const, label: "Otros países" }] : []),
  ];
  const [tab, setTab] = useState<Tab>("definicion");
  const { t, language, country } = useT();
  const learner = language === "en";
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { favorites, isFavorite, toggle } = useFavorites();
  const saved = isFavorite(entry.id);
  const installTip = useSeen("install-tip");
  const [installOpen, setInstallOpen] = useState(false);

  const save = () => {
    // After the very first saved word, suggest installing so it is kept safe.
    if (!saved && favorites.length === 0 && !installTip.seen && !isInstalled()) {
      installTip.markSeen();
      setInstallOpen(true);
    }
    toggle(entry);
  };
  const label = learner ? termLabelEn(entry.text, entry.dialect) : termLabel(entry.text, entry.dialect);
  const summary = `${capitalize(entry.text)} (${label.toLowerCase()}): ${(entry.definition ?? entry.meaning).replace(/[«»]/g, "")}`;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: entry.text, text: summary, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${summary}\n${url}`);
    }
  };

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-14">
      <PageHeader>
        <IconButton label={t("Compartir")} onClick={() => void share()}>
          <Share className="size-[19px]" />
        </IconButton>
        <IconButton
          label={t("Favorito")}
          pressed={saved}
          onClick={save}
        >
          <Heart className={`size-[19px] ${saved ? "fill-navy" : ""}`} />
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
          className="-ml-2 flex min-h-11 items-center gap-2 rounded-full px-2 text-[14.5px] text-muted hover:text-navy"
        >
          <Volume2 className="size-4" />
          <span className="sr-only">{t("Escuchar")}: </span>
          {entry.pronunciation ?? t("Escuchar")}
        </button>
      </div>

      {tabs.length > 1 && (
      <div
        role="tablist"
        aria-label={t("Secciones de la palabra")}
        className="mx-1 mb-6 flex gap-[26px] border-b border-line max-[359px]:gap-4"
      >
        {tabs.map((tab_, i) => (
          <button
            key={tab_.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`tab-${tab_.id}`}
            type="button"
            role="tab"
            aria-selected={tab === tab_.id}
            aria-controls={`panel-${tab_.id}`}
            tabIndex={tab === tab_.id ? 0 : -1}
            onClick={() => setTab(tab_.id)}
            onKeyDown={(e) => {
              const last = tabs.length - 1;
              const next =
                e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
                : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
                : e.key === "Home" ? 0
                : e.key === "End" ? last
                : null;
              if (next === null) return;
              e.preventDefault();
              setTab(tabs[next].id);
              tabRefs.current[next]?.focus();
            }}
            className={`-mb-px border-b-[3px] pb-3 text-[15.5px] whitespace-nowrap transition max-[359px]:text-[14.5px] ${
              tab === tab_.id
                ? "border-navy font-bold text-navy"
                : "border-transparent font-semibold text-muted hover:text-navy"
            }`}
          >
            {t(tab_.label)}
          </button>
        ))}
      </div>
      )}

      <div
        {...(tabs.length > 1
          ? { role: "tabpanel", id: `panel-${tab}`, "aria-labelledby": `tab-${tab}`, tabIndex: 0 }
          : {})}
        className="rounded-[22px]"
      >
        {tab === "definicion" && (
          <div className="rounded-[22px] bg-white px-5 py-5 shadow-card">
            {entry.register && (
              <p className="mb-4 inline-block rounded-full bg-butter px-3 py-1 text-[13.5px] font-semibold text-navy">
                {entry.register === "vulgar" ? t("Vulgar") : t("Ofensiva")}
              </p>
            )}
            {learner && entry.en && (
              <p lang="en" className="mb-4 text-[19px] leading-snug font-bold">
                {t("Significa")}: {entry.en}
              </p>
            )}
            {learner && (
              <p className="mb-1 text-[13px] font-bold text-muted">{t("En español")}</p>
            )}
            <p lang="es" className="text-[17px] leading-relaxed text-body">
              <Rich text={entry.definition ?? entry.meaning} />
            </p>
            {entry.example && (
              <blockquote className="mt-5 border-l-[3px] border-lavender pl-4 text-[16.5px] leading-normal text-muted italic">
                <Example text={entry.example} term={entry.text} />
              </blockquote>
            )}
            {entry.antonyms && entry.antonyms.length > 0 && (
              <p className="mt-6 border-t border-line pt-5 text-[15.5px] leading-normal text-muted">
                <span className="mb-1 block text-[13px] font-bold text-navy">
                  {t("Lo contrario")}
                </span>
                {entry.antonyms.join(", ")}
              </p>
            )}
          </div>
        )}

        {tab === "origen" && (
          <div className="rounded-[22px] bg-white px-5 py-5 shadow-card">
            <CountryLabel code={entry.dialect} />
            <p lang="es" className="mt-4 text-[17px] leading-relaxed text-body">
              <Rich text={entry.origin ?? ""} />
            </p>
            {learner && (
              <p className="mt-3 text-[13.5px] text-muted">{t("La historia está en español.")}</p>
            )}
            {entry.origin && entry.source && (
              <p className="mt-4 text-[13.5px] text-muted">
                {t("Fuente: {source}", { source: entry.source })}
              </p>
            )}
          </div>
        )}

        {tab === "otros" && (
          <div>
            <ListCard>
              {otherWaysByWord(dictionaryEntry!.conceptId, entry.dialect).map((group) => {
                const same = normalize(group.text) === normalize(entry.text);
                return (
                  <li key={group.id}>
                    <Link href={`/frase/${group.id}`} className="flex items-center gap-3 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] font-bold">
                          {capitalize(group.text)}
                          {same && (
                            <span className="ml-2 rounded-full bg-bg px-2 py-0.5 align-middle text-[12px] font-semibold text-muted">
                              {t("igual")}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted">
                          {group.dialects.map((d) => (
                            <Flag key={d} code={d} className="text-[15px]" />
                          ))}
                          <span className="ml-0.5">{group.dialects.map((d) => country(d)).join(", ")}</span>
                        </p>
                      </div>
                      <ChevronRight aria-hidden className="size-[18px] shrink-0 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ListCard>
          </div>
        )}

        {entry.id.startsWith("ai.") && (
          <p className="mx-1 mt-6 text-sm text-muted">
            {t("Explicación generada con IA. Puede contener errores.")}
          </p>
        )}
      </div>
      <SuggestButton
        variant="card"
        label="¿Conoces su historia u otra forma de decirlo?"
        className="mt-6"
        word={entry.text}
        country={entry.dialect}
        context={`Página de la palabra: ${entry.id}`}
      />
      <InstallSheet
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        reason={t("¡Guardaste tu primera palabra!")}
      />
    </main>
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
