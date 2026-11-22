"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Sheet } from "@/components/sheet";
import { useT } from "@/lib/i18n";
import { FREE_SENTENCES_PER_DAY, PLUS_GUIDES } from "@/lib/plus";

/** Shown when today's free sentence translations are used up. */
export function PlusLimitSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  return (
    <Sheet open={open} title="Ya usaste tus frases de hoy" onClose={onClose}>
      <p className="text-[15.5px] leading-relaxed text-muted">
        {t(
          "Con la versión gratis traduces {free} frases al día. Mañana tienes {free} más; las palabras sueltas y Explorar siguen gratis.",
          { free: FREE_SENTENCES_PER_DAY },
        )}
      </p>
      <Link
        href="/plus"
        onClick={onClose}
        className="mt-5 flex h-13 items-center justify-center gap-2 rounded-full bg-navy text-[16px] font-bold text-white"
      >
        <Sparkles aria-hidden className="size-5" />
        {t("Conoce Hola Plus")}
      </Link>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 h-12 w-full rounded-full text-[15px] font-semibold text-muted"
      >
        {t("Ahora no")}
      </button>
    </Sheet>
  );
}

/** The Plus card in Preferencias. */
export function PlusCard() {
  const { t } = useT();
  return (
    <Link href="/plus" className="mt-6 flex items-center gap-4 rounded-[22px] bg-navy px-5 py-4 text-white shadow-card">
      <Sparkles aria-hidden className="size-6 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold">Hola Plus</span>
        <span className="block text-[14px] text-white/85">
          {t("Frases sin límite, sin conexión y más guías.")}
        </span>
      </span>
    </Link>
  );
}

/** Plus phrasebooks in Explore; each opens the Plus page. */
export function PlusGuideTiles() {
  const { t } = useT();
  return (
    <ul className="mt-3 grid grid-cols-2 gap-3">
      {PLUS_GUIDES.map((guide) => (
        <li key={guide.id}>
          <Link
            href="/plus"
            className={`relative flex h-[126px] flex-col justify-end rounded-[24px] px-[18px] py-4 transition active:scale-[0.98] ${guide.color}`}
          >
            <span aria-hidden className="absolute top-3 left-4 text-[32px]">
              {guide.emoji}
            </span>
            <span className="absolute top-3.5 right-3.5 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11.5px] font-bold">
              <Lock aria-hidden className="size-3" />
              Plus
            </span>
            <span className="text-[18px] font-bold">{t(guide.title)}</span>
            <span className="text-[12.5px] text-body">{t(guide.subtitle)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
