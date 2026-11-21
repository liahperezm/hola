"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useT } from "@/lib/i18n";

/** Bottom sheet on the native <dialog>: focus is trapped and Esc closes it. */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useT();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="sheet m-0 mt-auto max-h-[85dvh] w-full max-w-none bg-transparent p-0 backdrop:bg-navy/40 sm:mx-auto sm:max-w-md"
    >
      <div className="rounded-t-[30px] bg-white px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] text-navy">
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-line" />
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold">
            {t(title)}
          </h2>
          <button
            type="button"
            aria-label={t("Cerrar")}
            onClick={onClose}
            className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-bg"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
