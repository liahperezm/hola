"use client";

import Link from "next/link";
import { CircleArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { DialectSwitcher } from "@/components/dialect-switcher";
import { SearchField, TitleBar, TermPairText } from "@/components/ui";
import { DIALECTS } from "@/lib/dialects";
import { guideRows, normalize, type GuideId } from "@/lib/dictionary";
import { useGuidePair } from "@/lib/storage";

export function Guide({ id, title }: { id: GuideId; title: string }) {
  const [pair, setPair] = useGuidePair();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = normalize(query);
    return guideRows(id, pair.from, pair.to).filter(
      (r) =>
        !q ||
        normalize(r.from.display).includes(q) ||
        normalize(r.to.text).includes(q),
    );
  }, [id, pair.from, pair.to, query]);

  return (
    <div className="min-h-dvh bg-white">
      <TitleBar title={title} back="/diccionario">
        <div className="mt-12 mb-11">
          <DialectSwitcher value={pair} onChange={setPair} />
        </div>
      </TitleBar>

      <main className="px-8 pt-10 pb-12">
        <SearchField value={query} onChange={setQuery} />
        {rows.length === 0 ? (
          <p className="mt-10 text-lg text-muted">
            {query.trim()
              ? `Nada coincide con «${query.trim()}».`
              : `Todavía no hay palabras de ${title.toLowerCase()} para ${DIALECTS[pair.from].name} y ${DIALECTS[pair.to].name}.`}
          </p>
        ) : (
          <ul className="mt-6">
            {rows.map((row) => {
              const target = row.from.entry ?? row.to.entry;
              const content = (
                <>
                  <div className="min-w-0 flex-1">
                    <TermPairText from={row.from.display} to={row.to.display} />
                  </div>
                  {target && (
                    <CircleArrowRight
                      className="size-7 shrink-0 text-muted"
                      strokeWidth={2}
                    />
                  )}
                </>
              );
              return (
                <li key={row.conceptId} className="border-b border-[#7f7f7f]/70">
                  {target ? (
                    <Link
                      href={`/frase/${target.id}`}
                      className="flex items-center gap-4 py-6 hover:bg-field/60"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 py-6">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
