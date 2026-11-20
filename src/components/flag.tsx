import { AR, CL, CO, CU, DO, ES, MX, PE, PR, UY, VE } from "country-flag-icons/react/1x1";
import { DIALECTS, type DialectCode } from "@/lib/dialects";

const FLAGS = { AR, CL, CO, CU, DO, ES, MX, PE, PR, UY, VE };

export function Flag({
  code,
  size = 26,
}: {
  code: DialectCode;
  size?: number;
}) {
  const Svg = FLAGS[code];
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-black/15"
      style={{ width: size, height: size }}
    >
      <Svg className="block h-full w-full" />
    </span>
  );
}

/** "🇩🇴 REPÚBLICA DOMINICANA" label above a text. */
export function CountryLabel({ code }: { code: DialectCode }) {
  return (
    <div className="flex items-center gap-4">
      <Flag code={code} />
      <span className="text-[13px] font-bold tracking-[0.14em] uppercase">
        {DIALECTS[code].name}
      </span>
    </div>
  );
}
