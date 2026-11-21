"use client";

import { EllipsisVertical, Share, SquarePlus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { installKind, promptInstall, type InstallKind } from "@/lib/install";
import { Sheet } from "./sheet";

export function InstallSheet({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  /** Optional first line, e.g. why now is a good moment. */
  reason?: string;
}) {
  const [kind, setKind] = useState<InstallKind>("manual");

  useEffect(() => {
    if (open) setKind(installKind());
  }, [open]);

  return (
    <Sheet open={open} title="Instala Hola en tu teléfono" onClose={onClose}>
      <div className="space-y-4 pb-2 text-[15.5px] leading-relaxed text-body">
        {reason && <p>{reason}</p>}
        <p>Así se abre como una app y tus favoritos quedan seguros en este teléfono.</p>

        {kind === "prompt" && (
          <button
            type="button"
            onClick={async () => {
              await promptInstall();
              onClose();
            }}
            className="flex h-[52px] w-full items-center justify-center rounded-full bg-navy text-[16px] font-bold text-white"
          >
            Instalar
          </button>
        )}

        {kind === "ios" && (
          <ol className="space-y-3">
            <Step n={1}>
              Toca <Share className="mx-1 inline size-[18px] align-[-3px]" aria-hidden />
              <b>Compartir</b> en la barra de Safari.
            </Step>
            <Step n={2}>
              Elige <SquarePlus className="mx-1 inline size-[18px] align-[-3px]" aria-hidden />
              <b>Agregar a pantalla de inicio</b>.
            </Step>
            <Step n={3}>
              Toca <b>Agregar</b>.
            </Step>
          </ol>
        )}

        {kind === "manual" && (
          <ol className="space-y-3">
            <Step n={1}>
              Abre el menú del navegador (
              <EllipsisVertical className="inline size-[18px] align-[-3px]" aria-hidden />
              <span className="sr-only">tres puntos</span>).
            </Step>
            <Step n={2}>
              Elige <b>Instalar app</b> o <b>Agregar a pantalla de inicio</b>.
            </Step>
          </ol>
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-full text-[15px] font-semibold text-muted hover:bg-bg"
        >
          Ahora no
        </button>
      </div>
    </Sheet>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-full bg-lavender text-sm font-bold text-navy"
      >
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
