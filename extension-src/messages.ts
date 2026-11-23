import type { DialectCode } from "../src/lib/dialects";
import type { LanguageCode } from "../src/lib/languages";

/** One side of a translation: a country's Spanish, or another language. */
export type Side = { kind: "dialect"; code: DialectCode } | { kind: "language"; code: LanguageCode };

export type Detection = {
  /** "es", another language Hola knows, or null when it can't tell. */
  language: "es" | LanguageCode | null;
  /** For Spanish, the country its words point to, when they do. */
  dialect: DialectCode | null;
};

export type Request =
  | { type: "detect" }
  | { type: "translate"; from: Side; to: Side }
  | { type: "restore" }
  | { type: "status" };

export type Response =
  | { ok: true; detection?: Detection; translated?: boolean; changed?: number }
  | { ok: false; error: "needs-translator" | "needs-download" | "same" | "failed"; detail?: string };
