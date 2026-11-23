"use client";

import { ArrowLeftRight, Check } from "lucide-react";
import { useState } from "react";
import { PICKABLE_DIALECTS, type DialectCode } from "@/lib/dialects";
import { useT } from "@/lib/i18n";
import { LANGUAGE_CODES, LANGUAGES, type LanguageCode } from "@/lib/languages";
import { useDialectPair, useOtherLanguage } from "@/lib/storage";
import { Flag } from "./flag";
import { Sheet } from "./sheet";

type Side = "from" | "to";
type Choice = { kind: "dialect"; code: DialectCode } | { kind: "language"; code: LanguageCode };

/** A language badge, like a flag but for "EN", "FR"… */
export function LanguageBadge({ code }: { code: LanguageCode }) {
  return (
    <span
      aria-hidden
      className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-[10px] font-bold text-white"
    >
      {LANGUAGES[code].short}
    </span>
  );
}

/**
 * The translator's two sides. Each is a Spanish dialect or another language;
 * at least one is always Spanish. "🇲🇽 México ⇄ 🇩🇴 Rep. Dom." or
 * "EN English ⇄ 🇩🇴 Rep. Dom.".
 */
export function SidesBar({ onChange }: { onChange?: () => void }) {
  const { t, country, countryShort } = useT();
  const [pair, setPair] = useDialectPair();
  const [other, setOther] = useOtherLanguage();
  const [picking, setPicking] = useState<Side | null>(null);

  const choiceOn = (side: Side): Choice =>
    other?.side === side
      ? { kind: "language", code: other.code }
      : { kind: "dialect", code: other ? pair.to : pair[side] };

  const choose = (side: Side, choice: Choice) => {
    const opposite: Side = side === "from" ? "to" : "from";
    if (choice.kind === "language") {
      // The dialect stays on the other side.
      if (!other) setPair({ ...pair, to: side === "from" ? pair.to : pair.from });
      setOther({ code: choice.code, side });
    } else if (other && other.side === side) {
      // Back to dialect ⇄ dialect.
      const learning = pair.to;
      setOther(null);
      setPair(side === "from" ? { from: choice.code, to: learning } : { from: learning, to: choice.code });
    } else if (other) {
      setPair({ ...pair, to: choice.code });
    } else if (pair[opposite] === choice.code) {
      setPair({ from: pair.to, to: pair.from });
    } else {
      setPair({ ...pair, [side]: choice.code });
    }
    setPicking(null);
    onChange?.();
  };

  const swap = () => {
    if (other) setOther({ ...other, side: other.side === "from" ? "to" : "from" });
    else setPair({ from: pair.to, to: pair.from });
    onChange?.();
  };

  const Chip = ({ side }: { side: Side }) => {
    const c = choiceOn(side);
    const name = c.kind === "language" ? LANGUAGES[c.code].name : countryShort(c.code);
    const full = c.kind === "language" ? LANGUAGES[c.code].name : country(c.code);
    return (
      <button
        type="button"
        onClick={() => setPicking(side)}
        className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-full bg-white px-3 text-[14.5px] font-semibold whitespace-nowrap shadow-card transition hover:bg-lavender/50"
      >
        {c.kind === "language" ? <LanguageBadge code={c.code} /> : <Flag code={c.code} />}
        <span className="sr-only">{side === "from" ? t("Traducir de") : t("Traducir a")}: </span>
        <span className="truncate" lang={c.kind === "language" ? c.code : undefined}>
          {name}
        </span>
        {name !== full && <span className="sr-only"> ({full})</span>}
        <span className="sr-only">{t(". Cambiar país")}</span>
      </button>
    );
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-2">
        <Chip side="from" />
        <button
          type="button"
          aria-label={t("Intercambiar países")}
          onClick={swap}
          className="grid size-10 place-items-center rounded-full bg-navy text-white transition active:rotate-180"
        >
          <ArrowLeftRight className="size-[18px]" />
        </button>
        <Chip side="to" />
      </div>
      <Sheet
        open={picking !== null}
        title={picking === "to" ? "Traducir a" : "Traducir de"}
        onClose={() => setPicking(null)}
      >
        {picking && (
          <SideList
            selected={choiceOn(picking)}
            // Only one side can be another language.
            allowLanguages={!other || other.side === picking}
            onChoose={(c) => choose(picking, c)}
          />
        )}
      </Sheet>
    </>
  );
}

function SideList({
  selected,
  allowLanguages,
  onChoose,
}: {
  selected: Choice;
  allowLanguages: boolean;
  onChoose: (choice: Choice) => void;
}) {
  const { t, country, language } = useT();
  const dialects = [...PICKABLE_DIALECTS].sort((a, b) => country(a).localeCompare(country(b), language));
  const row = "flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left text-[16px] font-medium hover:bg-bg";
  const isSelected = (c: Choice) => c.kind === selected.kind && c.code === selected.code;
  return (
    <div className="max-h-[65dvh] overflow-y-auto">
      <h3 className="mx-2 mt-1 mb-1 text-[13px] font-bold text-muted">{t("Español")}</h3>
      <ul>
        {dialects.map((code) => (
          <li key={code}>
            <button type="button" className={row} aria-current={isSelected({ kind: "dialect", code })} onClick={() => onChoose({ kind: "dialect", code })}>
              <Flag code={code} className="text-2xl" />
              <span className="flex-1">{country(code)}</span>
              {isSelected({ kind: "dialect", code }) && <Check className="size-5" strokeWidth={3} />}
            </button>
          </li>
        ))}
      </ul>
      {allowLanguages && (
        <>
          <h3 className="mx-2 mt-4 mb-1 text-[13px] font-bold text-muted">{t("Otros idiomas")}</h3>
          <ul>
            {LANGUAGE_CODES.map((code) => (
              <li key={code}>
                <button type="button" className={row} aria-current={isSelected({ kind: "language", code })} onClick={() => onChoose({ kind: "language", code })}>
                  <LanguageBadge code={code} />
                  <span className="flex-1" lang={code}>
                    {LANGUAGES[code].name}
                  </span>
                  {isSelected({ kind: "language", code }) && <Check className="size-5" strokeWidth={3} />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
