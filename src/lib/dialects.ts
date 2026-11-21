export const DIALECT_CODES = [
  "AR",
  "BO",
  "CL",
  "CO",
  "CR",
  "CU",
  "EC",
  "SV",
  "ES",
  "US",
  "GT",
  "GQ",
  "HN",
  "MX",
  "NI",
  "PA",
  "PY",
  "PE",
  "PR",
  "DO",
  "UY",
  "VE",
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
  AR: {
    code: "AR",
    name: "Argentina",
    short: "Argentina",
    demonymF: "argentina",
    demonymM: "argentino",
    speechLang: "es-AR",
  },
  BO: {
    code: "BO",
    name: "Bolivia",
    short: "Bolivia",
    demonymF: "boliviana",
    demonymM: "boliviano",
    speechLang: "es-BO",
  },
  CL: {
    code: "CL",
    name: "Chile",
    short: "Chile",
    demonymF: "chilena",
    demonymM: "chileno",
    speechLang: "es-CL",
  },
  CO: {
    code: "CO",
    name: "Colombia",
    short: "Colombia",
    demonymF: "colombiana",
    demonymM: "colombiano",
    speechLang: "es-CO",
  },
  CR: {
    code: "CR",
    name: "Costa Rica",
    short: "Costa Rica",
    demonymF: "costarricense",
    demonymM: "costarricense",
    speechLang: "es-CR",
  },
  CU: {
    code: "CU",
    name: "Cuba",
    short: "Cuba",
    demonymF: "cubana",
    demonymM: "cubano",
    speechLang: "es-CU",
  },
  EC: {
    code: "EC",
    name: "Ecuador",
    short: "Ecuador",
    demonymF: "ecuatoriana",
    demonymM: "ecuatoriano",
    speechLang: "es-EC",
  },
  SV: {
    code: "SV",
    name: "El Salvador",
    short: "El Salvador",
    demonymF: "salvadoreña",
    demonymM: "salvadoreño",
    speechLang: "es-SV",
  },
  ES: {
    code: "ES",
    name: "España",
    short: "España",
    demonymF: "española",
    demonymM: "español",
    speechLang: "es-ES",
  },
  US: {
    code: "US",
    name: "Estados Unidos",
    short: "EE. UU.",
    demonymF: "estadounidense",
    demonymM: "estadounidense",
    speechLang: "es-US",
  },
  GT: {
    code: "GT",
    name: "Guatemala",
    short: "Guatemala",
    demonymF: "guatemalteca",
    demonymM: "guatemalteco",
    speechLang: "es-GT",
  },
  GQ: {
    code: "GQ",
    name: "Guinea Ecuatorial",
    short: "G. Ecuatorial",
    demonymF: "ecuatoguineana",
    demonymM: "ecuatoguineano",
    speechLang: "es-GQ",
  },
  HN: {
    code: "HN",
    name: "Honduras",
    short: "Honduras",
    demonymF: "hondureña",
    demonymM: "hondureño",
    speechLang: "es-HN",
  },
  MX: {
    code: "MX",
    name: "México",
    short: "México",
    demonymF: "mexicana",
    demonymM: "mexicano",
    speechLang: "es-MX",
  },
  NI: {
    code: "NI",
    name: "Nicaragua",
    short: "Nicaragua",
    demonymF: "nicaragüense",
    demonymM: "nicaragüense",
    speechLang: "es-NI",
  },
  PA: {
    code: "PA",
    name: "Panamá",
    short: "Panamá",
    demonymF: "panameña",
    demonymM: "panameño",
    speechLang: "es-PA",
  },
  PY: {
    code: "PY",
    name: "Paraguay",
    short: "Paraguay",
    demonymF: "paraguaya",
    demonymM: "paraguayo",
    speechLang: "es-PY",
  },
  PE: {
    code: "PE",
    name: "Perú",
    short: "Perú",
    demonymF: "peruana",
    demonymM: "peruano",
    speechLang: "es-PE",
  },
  PR: {
    code: "PR",
    name: "Puerto Rico",
    short: "Puerto Rico",
    demonymF: "puertorriqueña",
    demonymM: "puertorriqueño",
    speechLang: "es-PR",
  },
  DO: {
    code: "DO",
    name: "República Dominicana",
    short: "Rep. Dom.",
    demonymF: "dominicana",
    demonymM: "dominicano",
    speechLang: "es-DO",
  },
  UY: {
    code: "UY",
    name: "Uruguay",
    short: "Uruguay",
    demonymF: "uruguaya",
    demonymM: "uruguayo",
    speechLang: "es-UY",
  },
  VE: {
    code: "VE",
    name: "Venezuela",
    short: "Venezuela",
    demonymF: "venezolana",
    demonymM: "venezolano",
    speechLang: "es-VE",
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
