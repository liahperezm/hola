"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useMemo, useState } from "react";
import { CountryLabel } from "@/components/flag";
import { SearchField, TitleBar, capitalize } from "@/components/ui";
import { DIALECT_CODES, DIALECTS } from "@/lib/dialects";
import { normalize } from "@/lib/dictionary";
import { useFavorites } from "@/lib/storage";

export default function Favorites() {
  const { favorites, toggle } = useFavorites();
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
    <div className="min-h-dvh bg-white">
      <TitleBar title="Favoritos" back="/diccionario" />
      <main className="px-8 pt-6 pb-12">
        <SearchField value={query} onChange={setQuery} />

        {favorites.length === 0 ? (
          <div className="mt-16 space-y-3 text-center">
            <Bookmark className="mx-auto size-10 text-muted" />
            <p className="text-xl">Todavía no tienes favoritos</p>
            <p className="text-muted">
              Toca el marcador en cualquier palabra o frase para guardarla aquí.
            </p>
          </div>
        ) : groups.length === 0 ? (
          <p className="mt-10 text-lg text-muted">
            Ningún favorito coincide con «{query.trim()}».
          </p>
        ) : (
          <div className="mt-10 space-y-14">
            {groups.map((group) => (
              <section key={group.code} aria-label={DIALECTS[group.code].name}>
                <CountryLabel code={group.code} />
                <ul className="mt-3">
                  {group.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center border-b border-[#7f7f7f]/70"
                    >
                      <Link
                        href={`/frase/${entry.id}`}
                        className="flex-1 py-5 text-xl text-muted hover:text-navy"
                      >
                        {capitalize(entry.text)}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Quitar ${entry.text} de favoritos`}
                        onClick={() => toggle(entry)}
                        className="-mr-2 rounded-full p-2 hover:bg-field"
                      >
                        <Bookmark className="size-6 fill-muted text-muted" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
