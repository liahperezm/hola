"use client";

import { Rich } from "@/components/rich";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Flag } from "@/components/flag";
import { PlusGuideTiles } from "@/components/plus";
import { SuggestButton } from "@/components/suggest";
import {
  EmptyState,
  ListCard,
  ResultCount,
  SearchField,
  SectionTitle,
  TabScreen,
  TopBar,
  capitalize,
} from "@/components/ui";
import { PICKABLE_DIALECTS, isDialectCode, termLabel, termLabelEn } from "@/lib/dialects";
import { useT } from "@/lib/i18n";
import { useDialectPair, useWordOfDayCountry } from "@/lib/storage";
import { LearningChip } from "@/components/learning";
import {
  GUIDES,
  allEntries,
  normalize,
  dayNumber,
  wordForDay,
  type GuideId,
} from "@/lib/dictionary";

const TILE_COLORS: Record<GuideId, string> = {
  basicos: "bg-blush",
  viaje: "bg-sky",
  comida: "bg-butter",
  oficina: "bg-mint",
  dichos: "bg-aqua",
};

export default function Explore() {
  const { t, language, country } = useT();
  const [query, setQuery] = useState("");
  const results = useMemo(() => search(query), [query]);

  return (
    <TabScreen>
      <TopBar title="Explorar" />
      <LearningChip />
      <div className="mt-4">
        <SearchField value={query} onChange={setQuery} />
      </div>

      <ResultCount count={results.length} active={query.trim() !== ""} />
      {query.trim() ? (
        results.length === 0 ? (
          <>
            <EmptyState title={t("No encontramos «{query}»", { query: query.trim() })}>
              {t("Prueba con otra palabra o tradúcela en la pestaña Traducir.")}
            </EmptyState>
            <SuggestButton
              className="mx-auto mt-4"
              kind="agregar"
              label="¿Falta esta palabra? Sugiérela"
              word={query.trim()}
              context="Búsqueda en Explorar"
            />
          </>
        ) : (
          <div className="mt-4">
            <ListCard>
              {results.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/frase/${entry.id}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <Flag code={entry.dialect} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{capitalize(entry.text)}</p>
                      <p className="truncate text-sm text-muted">
                        {(language === "en" && entry.en) || entry.meaning} · {country(entry.dialect)}
                      </p>
                    </div>
                    <ChevronRight className="size-[18px] shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ListCard>
          </div>
        )
      ) : (
        <>
          <WordOfTheDay />
          <SectionTitle>{t("Mini guías")}</SectionTitle>
          <ul className="grid grid-cols-2 gap-3">
            {GUIDES.map((guide) => (
              // An odd one out takes the whole row.
              <li key={guide.id} className={guide.id === "dichos" ? "col-span-2" : undefined}>
                <Link
                  href={`/guias/${guide.id}`}
                  className={`flex min-h-[126px] flex-col rounded-[24px] px-[18px] pt-3 pb-4 transition active:scale-[0.98] ${TILE_COLORS[guide.id]}`}
                >
                  <span aria-hidden className="text-[30px] leading-none">
                    {guide.emoji}
                  </span>
                  <span className="mt-auto pt-3 text-[18px] leading-tight font-bold">{t(guide.title)}</span>
                  <span className="text-[12.5px] text-body">{t(guide.subtitle)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <SectionTitle>{t("Con Hola Plus")}</SectionTitle>
          <PlusGuideTiles />
          <SuggestButton
            variant="card"
            kind="agregar"
            label="Ayuda a Hola a crecer"
            className="mt-6"
            context="Explorar"
          />
        </>
      )}
    </TabScreen>
  );
}

/** Today's date, refreshed at midnight and whenever the app comes back into view. */
function useToday(): number | null {
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setDay(dayNumber(new Date()));
    update();
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(update, midnight.getTime() - now.getTime() + 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [day]);
  return day;
}

function WordOfTheDay() {
  const today = useToday();
  const { t, language, country } = useT();
  const [pair] = useDialectPair();
  const [chosen, setChosen] = useWordOfDayCountry();
  const countries = useMemo(
    () => [...PICKABLE_DIALECTS].sort((a, b) => country(a).localeCompare(country(b), language)),
    [country, language],
  );
  // The day comes from the reader's own clock, so it is chosen after hydration.
  if (today === null) {
    return <div className="mt-4 h-[146px] rounded-[26px] bg-white shadow-card" />;
  }
  // Every country unless one is chosen; learners start with the Spanish they learn.
  const entry = wordForDay(today, chosen ?? (language === "en" ? pair.to : undefined));
  return (
    <div className="mt-4 rounded-[26px] bg-white px-5 py-[18px] shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-muted">{t("Palabra del día")}</p>
        <label className="relative">
          <span className="sr-only">{t("De qué país")}</span>
          <select
            value={chosen ?? ""}
            onChange={(e) => setChosen(isDialectCode(e.target.value) ? e.target.value : null)}
            className="h-9 appearance-none rounded-full bg-bg py-0 pr-8 pl-3 text-[13px] font-semibold text-navy"
          >
            <option value="">{t("Todos los países")}</option>
            {countries.map((code) => (
              <option key={code} value={code}>
                {country(code)}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
        </label>
      </div>
      <Link href={`/frase/${entry.id}`} className="block transition active:scale-[0.99]">
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[26px] leading-tight font-extrabold tracking-[-0.02em]">
            {capitalize(entry.text)}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13.5px] font-semibold text-muted">
            <Flag code={entry.dialect} className="text-sm" />
            {language === "en" ? termLabelEn(entry.text, entry.dialect) : termLabel(entry.text, entry.dialect)}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bg">
          <ChevronRight className="size-5" />
        </span>
      </div>
      <p className="mt-2.5 line-clamp-2 text-[15px] leading-normal text-muted">
        {language === "en" && entry.en ? (
          <span lang="en">{capitalize(entry.en)}</span>
        ) : (
          <Rich text={entry.definition ?? entry.meaning} />
        )}
      </p>
      </Link>
    </div>
  );
}

function search(query: string) {
  const q = normalize(query);
  if (!q) return [];
  return allEntries()
    .filter(
      (e) => normalize(e.text).includes(q) || normalize(e.meaning).includes(q),
    )
    .sort(
      (a, b) =>
        Number(!normalize(a.text).startsWith(q)) -
        Number(!normalize(b.text).startsWith(q)),
    )
    .slice(0, 40);
}
