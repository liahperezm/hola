"use client";

import { useMemo, useState } from "react";
import { Flag } from "@/components/flag";
import { CardLink, SearchField, SectionLabel, TitleBar, capitalize } from "@/components/ui";
import { DIALECTS } from "@/lib/dialects";
import { GUIDES, allEntries, normalize } from "@/lib/dictionary";
import { useFavorites } from "@/lib/storage";

export default function Dictionary() {
  const [query, setQuery] = useState("");
  const { favorites } = useFavorites();
  const results = useMemo(() => search(query), [query]);

  return (
    <div className="flex min-h-dvh flex-col bg-gray">
      <TitleBar title="Mi diccionario" />
      <div className="bg-white px-8 py-6">
        <SearchField value={query} onChange={setQuery} />
      </div>

      <main className="flex-1 space-y-8 px-6 pt-12 pb-12">
        {query.trim() ? (
          <section aria-label="Resultados">
            {results.length === 0 ? (
              <p className="px-4 text-lg text-muted">
                No encontramos «{query.trim()}» en el diccionario.
              </p>
            ) : (
              <ul className="space-y-4">
                {results.map((entry) => (
                  <li key={entry.id}>
                    <CardLink href={`/frase/${entry.id}`}>
                      <div className="flex items-center gap-4">
                        <Flag code={entry.dialect} />
                        <div className="min-w-0">
                          <p className="text-xl font-bold text-navy">
                            {capitalize(entry.text)}
                          </p>
                          <p className="truncate text-[15px] text-muted">
                            {entry.meaning} · {DIALECTS[entry.dialect].name}
                          </p>
                        </div>
                      </div>
                    </CardLink>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <>
            <CardLink href="/diccionario/favoritos">
              <span className="flex items-center gap-5 text-xl text-muted">
                <span className="text-4xl" aria-hidden>
                  🌟
                </span>
                Favoritos
                {favorites.length > 0 && (
                  <span className="text-base text-muted/70">
                    {favorites.length}
                  </span>
                )}
              </span>
            </CardLink>

            <section className="space-y-6">
              <div className="pt-4">
                <SectionLabel>Mini guías</SectionLabel>
              </div>
              <ul className="space-y-6">
                {GUIDES.map((guide) => (
                  <li key={guide.id}>
                    <CardLink href={`/guias/${guide.id}`}>
                      <span className="flex items-center gap-5 text-xl text-muted">
                        <span className="text-4xl" aria-hidden>
                          {guide.emoji}
                        </span>
                        {guide.title}
                      </span>
                    </CardLink>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
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
