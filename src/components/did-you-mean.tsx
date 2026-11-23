"use client";

import { useT } from "@/lib/i18n";

/**
 * "Did you mean…?": Hola noticed the text looks like another country's
 * Spanish or another language, and offers to switch instead of switching on
 * its own. Announced politely to screen readers; the button does the switch.
 */
export function DidYouMean({
  question,
  action,
  onAccept,
  onDismiss,
}: {
  question: string;
  action: string;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { t } = useT();
  return (
    <div role="status" className="mt-4 rounded-[22px] bg-white px-5 py-4 shadow-card">
      <p className="text-[15.5px] font-semibold">{question}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="h-11 rounded-full bg-navy px-5 text-[15px] font-bold text-white"
        >
          {action}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="h-11 rounded-full px-4 text-[15px] font-semibold text-muted hover:text-navy"
        >
          {t("No, gracias")}
        </button>
      </div>
    </div>
  );
}
