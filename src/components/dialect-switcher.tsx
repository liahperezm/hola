"use client";

import { ArrowLeftRight, Check } from "lucide-react";
import { useState } from "react";
import { DIALECT_CODES, DIALECTS, type DialectCode } from "@/lib/dialects";
import type { DialectPair } from "@/lib/storage";
import { Flag } from "./flag";
import { Sheet } from "./sheet";

type Side = "from" | "to";

/** "🇩🇴 Rep. Dom. ⇄ 🇨🇴 Colombia". Tap a country to change it. */
export function DialectSwitcher({
  value,
  onChange,
}: {
  value: DialectPair;
  onChange: (pair: DialectPair) => void;
}) {
  const [picking, setPicking] = useState<Side | null>(null);

  const choose = (code: DialectCode) => {
    if (!picking) return;
    const other: Side = picking === "from" ? "to" : "from";
    // Picking the country already on the other side swaps them.
    if (value[other] === code) {
      onChange({ from: value.to, to: value.from });
    } else {
      onChange({ ...value, [picking]: code });
    }
    setPicking(null);
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-2">
        <CountryChip
          code={value.from}
          label="Traducir de"
          onClick={() => setPicking("from")}
        />
        <button
          type="button"
          aria-label="Intercambiar países"
          onClick={() => onChange({ from: value.to, to: value.from })}
          className="grid size-10 place-items-center rounded-full bg-navy text-white transition active:rotate-180"
        >
          <ArrowLeftRight className="size-[18px]" />
        </button>
        <CountryChip
          code={value.to}
          label="Traducir a"
          onClick={() => setPicking("to")}
        />
      </div>
      <DialectPicker
        open={picking !== null}
        title={picking === "to" ? "Traducir a" : "Traducir de"}
        selected={picking ? value[picking] : undefined}
        onClose={() => setPicking(null)}
        onChoose={choose}
      />
    </>
  );
}

function CountryChip({
  code,
  label,
  onClick,
}: {
  code: DialectCode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-full bg-white px-3 text-[14.5px] font-semibold whitespace-nowrap shadow-card transition hover:bg-lavender/50"
    >
      <Flag code={code} />
      <span className="sr-only">{label}: </span>
      <span className="truncate">{DIALECTS[code].short}</span>
      {DIALECTS[code].short !== DIALECTS[code].name && (
        <span className="sr-only"> ({DIALECTS[code].name})</span>
      )}
      <span className="sr-only">. Cambiar país</span>
    </button>
  );
}

function DialectPicker({
  open,
  title,
  selected,
  onClose,
  onChoose,
}: {
  open: boolean;
  title: string;
  selected?: DialectCode;
  onClose: () => void;
  onChoose: (code: DialectCode) => void;
}) {
  return (
    <Sheet open={open} title={title} onClose={onClose}>
      <CountryList selected={selected} onChoose={onChoose} />
    </Sheet>
  );
}

/** Every country as a list of buttons; used by the picker and the welcome. */
export function CountryList({
  selected,
  onChoose,
  exclude,
}: {
  selected?: DialectCode;
  onChoose: (code: DialectCode) => void;
  exclude?: DialectCode;
}) {
  return (
    <ul className="max-h-[65dvh] overflow-y-auto">
      {DIALECT_CODES.filter((code) => code !== exclude).map((code) => (
        <li key={code}>
          <button
            type="button"
            onClick={() => onChoose(code)}
            aria-current={code === selected}
            className="flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left text-[16px] font-medium hover:bg-bg"
          >
            <Flag code={code} className="text-2xl" />
            <span className="flex-1">{DIALECTS[code].name}</span>
            {code === selected && <Check className="size-5" strokeWidth={3} />}
          </button>
        </li>
      ))}
    </ul>
  );
}
