"use client";

import { ArrowLeftRight, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DIALECT_CODES, DIALECTS, type DialectCode } from "@/lib/dialects";
import type { DialectPair } from "@/lib/storage";
import { Flag } from "./flag";

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
      aria-label={`${label}: ${DIALECTS[code].name}. Cambiar`}
      onClick={onClick}
      className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-full bg-white px-3 text-[14.5px] font-semibold whitespace-nowrap shadow-card transition hover:bg-lavender/50"
    >
      <Flag code={code} />
      <span className="truncate">{DIALECTS[code].short}</span>
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
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="sheet m-0 mt-auto max-h-[85dvh] w-full max-w-none bg-transparent p-0 backdrop:bg-navy/40 sm:mx-auto sm:max-w-md"
    >
      <div className="rounded-t-[30px] bg-white px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] text-navy">
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-line" />
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="-mr-2 grid size-10 place-items-center rounded-full hover:bg-bg"
          >
            <X className="size-5" />
          </button>
        </div>
        <ul className="max-h-[65dvh] overflow-y-auto">
          {DIALECT_CODES.map((code) => (
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
      </div>
    </dialog>
  );
}
