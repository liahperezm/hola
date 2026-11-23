"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Flag } from "@/components/flag";
import { EmptyState, ListCard, PageHeader, ResultCount, SearchField, capitalize } from "@/components/ui";
import { normalize } from "@/lib/dictionary";
import { useT } from "@/lib/i18n";
import { allSayings, sayingSlug } from "@/lib/sayings";

export default function Sayings() {
  const { t, language } = useT();
  const [query, setQuery] = useState("");
  const sayings = useMemo(() => {
    const q = normalize(query);
    return allSayings().filter(
      (s) => !q || [s.text, s.es, s.en].some((field) => normalize(field).includes(q)),
    );
  }, [query]);

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-12">
      <PageHeader fallback="/explorar" />
      <div className="mx-1 mt-5 mb-5">
        <span aria-hidden className="text-[34px]">
          🗣️
        </span>
        <h1 className="mt-1 text-[32px] font-extrabold tracking-[-0.03em]">{t("Refranes y dichos")}</h1>
        <p className="text-muted">{t("Lo que se dice en cada país, y lo que quiere decir")}</p>
      </div>
      <SearchField value={query} onChange={setQuery} placeholder="Busca un refrán" />
      {sayings.length === 0 ? (
        <EmptyState title={t("Nada coincide con «{query}»", { query: query.trim() })} />
      ) : (
        <div className="mt-4">
          <ListCard>
            {sayings.map((s) => (
              <li key={s.text}>
                <Link href={`/refranes/${sayingSlug(s)}`} className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[16.5px] font-extrabold">{capitalize(s.text)}</p>
                    <p className="text-[14px] text-muted" lang={language === "en" ? "en" : "es"}>
                      {capitalize(language === "en" ? s.en : s.es)}
                    </p>
                    {s.countries.length > 0 && (
                      <p className="mt-1 flex gap-1 text-sm" aria-hidden>
                        {s.countries.map((c) => (
                          <Flag key={c} code={c} className="text-sm" />
                        ))}
                      </p>
                    )}
                  </div>
                  <ChevronRight aria-hidden className="size-[18px] shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ListCard>
        </div>
      )}
      <ResultCount count={sayings.length} active={query.trim() !== ""} />
    </main>
  );
}
