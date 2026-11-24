"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { CountryLabel } from "@/components/flag";
import {
  EmptyState,
  ListCard,
  SearchField,
  TabScreen,
  TopBar,
  capitalize,
} from "@/components/ui";
import { DIALECT_CODES, DIALECTS } from "@/lib/dialects";
import { knownEntry, normalize } from "@/lib/dictionary";
import { useT } from "@/lib/i18n";
import { useFavorites, useHydrated } from "@/lib/storage";

export default function Favorites() {
  const { t, language } = useT();
  const { favorites, toggle } = useFavorites();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = normalize(query);
    // A word saved from an AI page goes under the country it really comes from.
    const placed = favorites.map((f) => {
      const known = f.id.startsWith("ai.") ? knownEntry(f.text, f.dialect) : undefined;
      if (known) return { ...f, dialect: known.dialect, meaning: known.meaning, en: known.en };
      // Older favorites were saved before every word had its English.
      return f.en ? f : { ...f, en: knownEntry(f.text, f.dialect)?.en };
    });
    const shown = placed.filter(
      (f) =>
        !q || normalize(f.text).includes(q) || normalize(f.meaning).includes(q),
    );
    return DIALECT_CODES.map((code) => ({
      code,
      entries: shown
        .filter((f) => f.dialect === code)
        .sort((a, b) => a.text.localeCompare(b.text, "es")),
    })).filter((g) => g.entries.length > 0);
  }, [favorites, query]);

  return (
    <TabScreen>
      <TopBar title="Favoritos" />
      {!hydrated ? null : favorites.length === 0 ? (
        <EmptyState icon={Heart} title={t("Todavía no tienes favoritos")}>
          {t("Toca el corazón en cualquier palabra para tenerla aquí.")}
        </EmptyState>
      ) : (
        <>
          <div className="mt-4">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Busca en tus favoritos"
            />
          </div>
          {groups.length === 0 ? (
            <EmptyState title={t("Nada coincide con «{query}»", { query: query.trim() })} />
          ) : (
            <div className="mt-2 space-y-1">
              {groups.map((group) => (
                <section key={group.code} aria-label={DIALECTS[group.code].name}>
                  <div className="mx-1 mt-5 mb-2.5">
                    <CountryLabel code={group.code} />
                  </div>
                  <ListCard>
                    {group.entries.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-2">
                        <Link
                          href={`/frase/${entry.id}`}
                          className="min-w-0 flex-1 py-3.5"
                        >
                          <p className="font-bold">{capitalize(entry.text)}</p>
                          <p className="truncate text-sm text-muted" lang={language === "en" && entry.en ? "en" : "es"}>
                            {(language === "en" && entry.en) || entry.meaning}
                          </p>
                        </Link>
                        <button
                          type="button"
                          aria-label={t("Quitar {word} de favoritos", { word: entry.text })}
                          onClick={() => toggle(entry)}
                          className="-mr-2 grid size-10 place-items-center rounded-full hover:bg-bg"
                        >
                          <Heart className="size-5 fill-navy" />
                        </button>
                      </li>
                    ))}
                  </ListCard>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </TabScreen>
  );
}
