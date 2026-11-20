"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { DialectSwitcher } from "@/components/dialect-switcher";
import {
  EmptyState,
  ListCard,
  PageHeader,
  SearchField,
  capitalize,
} from "@/components/ui";
import { DIALECTS } from "@/lib/dialects";
import { guideRows, normalize, type GuideId } from "@/lib/dictionary";
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

  const rows = useMemo(() => {
    const q = normalize(query);
    return guideRows(id, pair.from, pair.to).filter(
      (r) =>
        !q ||
        normalize(r.from.display).includes(q) ||
        normalize(r.to.display).includes(q),
    );
  }, [id, pair.from, pair.to, query]);

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-12">
      <PageHeader fallback="/explorar" />
      <div className="mx-1 mt-5 mb-5">
        <span aria-hidden className="text-[34px]">
          {emoji}
        </span>
        <h1 className="mt-1 text-[32px] font-extrabold tracking-[-0.03em]">{title}</h1>
        <p className="text-muted">{subtitle}</p>
      </div>
      <DialectSwitcher value={pair} onChange={setPair} />
      <div className="mt-3">
        <SearchField value={query} onChange={setQuery} placeholder="Busca en esta guía" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            query.trim()
              ? `Nada coincide con «${query.trim()}»`
              : `Aún no hay palabras para ${DIALECTS[pair.from].name} y ${DIALECTS[pair.to].name}`
          }
        />
      ) : (
        <div className="mt-4">
          <ListCard>
            {rows.map((row) => {
              const target = row.from.entry ?? row.to.entry;
              const content = (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-muted">
                      {capitalize(row.from.display)}
                    </p>
                    <p className="text-[17px] font-extrabold">
                      {capitalize(row.to.display)}
                      {normalize(row.from.display) === normalize(row.to.display) && (
                        <span className="ml-2 rounded-full bg-bg px-2 py-0.5 align-middle text-[12px] font-semibold text-muted">
                          igual
                        </span>
                      )}
                    </p>
                  </div>
                  {target && (
                    <ChevronRight className="size-[18px] shrink-0 text-muted" />
                  )}
                </>
              );
              return (
                <li key={row.conceptId}>
                  {target ? (
                    <Link
                      href={`/frase/${target.id}`}
                      className="flex items-center gap-3 py-3.5"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-3.5">{content}</div>
                  )}
                </li>
              );
            })}
          </ListCard>
        </div>
      )}
    </div>
  );
}
