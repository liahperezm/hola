"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
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
import { normalize } from "@/lib/dictionary";
import { useFavorites, useHydrated } from "@/lib/storage";

export default function Saved() {
  const { favorites, toggle } = useFavorites();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = normalize(query);
    const shown = favorites.filter(
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
      <TopBar title="Guardados" />
      {!hydrated ? null : favorites.length === 0 ? (
        <EmptyState icon={Bookmark} title="Todavía no guardaste nada">
          Toca el marcador en cualquier palabra para tenerla aquí.
        </EmptyState>
      ) : (
        <>
          <div className="mt-4">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Busca en tus guardados"
            />
          </div>
          {groups.length === 0 ? (
            <EmptyState title={`Nada coincide con «${query.trim()}»`} />
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
                          <p className="truncate text-sm text-muted">{entry.meaning}</p>
                        </Link>
                        <button
                          type="button"
                          aria-label={`Quitar ${entry.text} de guardados`}
                          onClick={() => toggle(entry)}
                          className="-mr-2 grid size-10 place-items-center rounded-full hover:bg-bg"
                        >
                          <Bookmark className="size-5 fill-navy" />
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
