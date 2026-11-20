export const DIALECT_CODES = [
  "DO",
  "CO",
  "AR",
  "MX",
  "VE",
  "PR",
  "CU",
  "ES",
  "CL",
  "UY",
  "PE",
] as const;

export type DialectCode = (typeof DIALECT_CODES)[number];

export type Dialect = {
  code: DialectCode;
  /** Full country name, shown above each text. */
  name: string;
  /** Short name for the dialect switcher. */
  short: string;
  /** Demonym, feminine, for "Frase dominicana". */
  demonymF: string;
  /** Demonym, masculine, for "Término dominicano". */
  demonymM: string;
  /** BCP 47 tag for speech synthesis and recognition. */
  speechLang: string;
};

export const DIALECTS: Record<DialectCode, Dialect> = {
  DO: {
    code: "DO",
    name: "República Dominicana",
    short: "Rep. Dom.",
    demonymF: "dominicana",
    demonymM: "dominicano",
    speechLang: "es-DO",
  },
  CO: {
    code: "CO",
    name: "Colombia",
    short: "Colombia",
    demonymF: "colombiana",
    demonymM: "colombiano",
    speechLang: "es-CO",
  },
  AR: {
    code: "AR",
    name: "Argentina",
    short: "Argentina",
    demonymF: "argentina",
    demonymM: "argentino",
    speechLang: "es-AR",
  },
  MX: {
    code: "MX",
    name: "México",
    short: "México",
    demonymF: "mexicana",
    demonymM: "mexicano",
    speechLang: "es-MX",
  },
  VE: {
    code: "VE",
    name: "Venezuela",
    short: "Venezuela",
    demonymF: "venezolana",
    demonymM: "venezolano",
    speechLang: "es-VE",
  },
  PR: {
    code: "PR",
    name: "Puerto Rico",
    short: "Puerto Rico",
    demonymF: "puertorriqueña",
    demonymM: "puertorriqueño",
    speechLang: "es-PR",
  },
  CU: {
    code: "CU",
    name: "Cuba",
    short: "Cuba",
    demonymF: "cubana",
    demonymM: "cubano",
    speechLang: "es-CU",
  },
  ES: {
    code: "ES",
    name: "España",
    short: "España",
    demonymF: "española",
    demonymM: "español",
    speechLang: "es-ES",
  },
  CL: {
    code: "CL",
    name: "Chile",
    short: "Chile",
    demonymF: "chilena",
    demonymM: "chileno",
    speechLang: "es-CL",
  },
  UY: {
    code: "UY",
    name: "Uruguay",
    short: "Uruguay",
    demonymF: "uruguaya",
    demonymM: "uruguayo",
    speechLang: "es-UY",
  },
  PE: {
    code: "PE",
    name: "Perú",
    short: "Perú",
    demonymF: "peruana",
    demonymM: "peruano",
    speechLang: "es-PE",
  },
};

export function isDialectCode(value: unknown): value is DialectCode {
  return (
    typeof value === "string" &&
    (DIALECT_CODES as readonly string[]).includes(value)
  );
}

/** "Frase dominicana" for phrases, "Palabra dominicana" for single words. */
export function termLabel(text: string, dialect: DialectCode): string {
  const kind = text.trim().includes(" ") ? "Frase" : "Palabra";
  return `${kind} ${DIALECTS[dialect].demonymF}`;
}
