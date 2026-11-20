"use client";

import { ArrowLeftRight, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DIALECT_CODES, DIALECTS, type DialectCode } from "@/lib/dialects";
import type { DialectPair } from "@/lib/storage";
import { Flag } from "./flag";

type Side = "from" | "to";

/** White pill: "REP. DOM. ⇄ COLOMBIA". Tap a side to pick its country. */
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
      <div className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center rounded-full bg-white text-ink">
        <SideButton
          code={value.from}
          label="Dialecto de origen"
          onClick={() => setPicking("from")}
        />
        <button
          type="button"
          aria-label="Intercambiar dialectos"
          onClick={() => onChange({ from: value.to, to: value.from })}
          className="rounded-full p-2 transition hover:bg-field active:rotate-180"
        >
          <ArrowLeftRight className="size-6" strokeWidth={2.25} />
        </button>
        <SideButton
          code={value.to}
          label="Dialecto de destino"
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

function SideButton({
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
      className="mx-2 h-14 rounded-full px-3 text-[15px] leading-tight font-bold tracking-[0.14em] uppercase transition hover:bg-field"
    >
      {DIALECTS[code].short}
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
      className="sheet m-0 mt-auto max-h-[85dvh] w-full max-w-none bg-transparent p-0 backdrop:bg-black/40 sm:mx-auto sm:max-w-md"
    >
      <div className="rounded-t-[28px] bg-white px-6 pt-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] text-ink">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="-mr-2 rounded-full p-2 hover:bg-field"
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
                className="flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left text-lg hover:bg-field"
              >
                <Flag code={code} size={30} />
                <span className="flex-1">{DIALECTS[code].name}</span>
                {code === selected && (
                  <Check className="size-5 text-navy" strokeWidth={3} />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
