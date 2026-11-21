"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { DIALECTS } from "@/lib/dialects";
import { useT } from "@/lib/i18n";
import { useDialectPair } from "@/lib/storage";
import { CountryList } from "./dialect-switcher";
import { Flag } from "./flag";
import { Sheet } from "./sheet";

/**
 * Learner mode only: "🇩🇴 Learning Dominican Spanish ⌄". Tapping it changes the
 * Spanish they are learning (the translator's "to" country).
 */
export function LearningChip() {
  const { t, language } = useT();
  const [pair, setPair] = useDialectPair();
  const [open, setOpen] = useState(false);
  if (language !== "en") return null;

  const learning = t("español {adjective}", { adjective: DIALECTS[pair.to].adjectiveEn });
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex min-h-11 items-center gap-2 self-start rounded-full bg-lavender px-4 text-[14.5px] font-semibold"
      >
        <Flag code={pair.to} />
        <span>
          {t("Aprendiendo")}: {learning}
        </span>
        <ChevronDown aria-hidden className="size-4" />
        <span className="sr-only">. {t("Cambiar el español que aprendes")}</span>
      </button>
      <Sheet open={open} title="¿Qué español quieres aprender?" onClose={() => setOpen(false)}>
        <CountryList
          selected={pair.to}
          onChoose={(code) => {
            setPair({ from: pair.from === code ? pair.to : pair.from, to: code });
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}
