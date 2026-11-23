"use client";

import Link from "next/link";
import { ChevronRight, Volume2 } from "lucide-react";
import { Flag } from "@/components/flag";
import { SuggestButton } from "@/components/suggest";
import { ListCard, PageHeader, SectionTitle, capitalize } from "@/components/ui";
import { DIALECTS } from "@/lib/dialects";
import { useT } from "@/lib/i18n";
import { getSaying, sameMeaning, sayingSlug } from "@/lib/sayings";
import { speak } from "@/lib/speech";
import { useDialectPair } from "@/lib/storage";

export function SayingView({ slug }: { slug: string }) {
  const { t, language, country } = useT();
  const [pair] = useDialectPair();
  const saying = getSaying(slug);
  if (!saying) return null;
  const learner = language === "en";
  const voice = DIALECTS[saying.countries[0] ?? (learner ? pair.to : pair.from)].speechLang;
  const others = sameMeaning(saying);

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-12">
      <PageHeader fallback="/refranes" />
      <p className="mx-1 mt-5 text-[13.5px] font-semibold text-muted">{t("Refrán")}</p>
      <h1 lang="es" className="mx-1 mt-1 text-[30px] leading-tight font-extrabold tracking-[-0.02em]">
        {capitalize(saying.text)}
      </h1>
      <button
        type="button"
        onClick={() => speak(saying.text, voice)}
        className="mt-3 flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold shadow-card"
      >
        <Volume2 aria-hidden className="size-[18px]" />
        {t("Escuchar")}
      </button>

      <section className="mt-5 rounded-[22px] bg-white px-5 py-4 shadow-card">
        <h2 className="text-[13.5px] font-semibold text-muted">{t("Significa")}</h2>
        <p className="mt-1 text-[18px] leading-snug font-semibold" lang={learner ? "en" : "es"}>
          {capitalize(learner ? saying.en : saying.es)}.
        </p>
        {learner ? (
          <p className="mt-2 text-[15px] text-muted" lang="es">
            {t("En español")}: {saying.es}.
          </p>
        ) : (
          <p className="mt-2 text-[15px] text-muted" lang="en">
            {t("En inglés")}: {saying.en}.
          </p>
        )}
      </section>

      <SectionTitle>{t("Dónde se dice")}</SectionTitle>
      <div className="rounded-[22px] bg-white px-5 py-4 text-[16px] shadow-card">
        {saying.countries.length === 0 ? (
          <p>{t("En todos los países de habla hispana.")}</p>
        ) : (
          <ul className="space-y-2">
            {saying.countries.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <Flag code={c} className="text-lg" />
                {country(c)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {others.length > 0 && (
        <>
          <SectionTitle>{t("Otras formas de decirlo")}</SectionTitle>
          <ListCard>
            {others.map((o) => (
              <li key={o.text}>
                <Link href={`/refranes/${sayingSlug(o)}`} className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{capitalize(o.text)}</p>
                    <p className="text-sm text-muted">
                      {o.countries.length === 0
                        ? t("En todos los países")
                        : o.countries.map((c) => country(c)).join(", ")}
                    </p>
                  </div>
                  <ChevronRight aria-hidden className="size-[18px] shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ListCard>
        </>
      )}

      <SuggestButton
        variant="card"
        kind="corregir"
        label="¿Conoces otra forma de decirlo?"
        word={saying.text}
        context={`Refrán: ${saying.text}`}
        className="mt-6"
      />
    </main>
  );
}
