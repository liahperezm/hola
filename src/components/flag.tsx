import { DIALECTS, type DialectCode } from "@/lib/dialects";

/** "DO" → 🇩🇴, drawn by the device's emoji font. */
export function flagEmoji(code: DialectCode): string {
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export function Flag({
  code,
  className = "text-xl",
}: {
  code: DialectCode;
  className?: string;
}) {
  return (
    <span aria-hidden className={`leading-none ${className}`}>
      {flagEmoji(code)}
    </span>
  );
}

/** "🇩🇴 República Dominicana" label above a text. */
export function CountryLabel({ code }: { code: DialectCode }) {
  return (
    <div className="flex items-center gap-2 text-[13.5px] font-semibold text-muted">
      <Flag code={code} className="text-[17px]" />
      {DIALECTS[code].name}
    </div>
  );
}
