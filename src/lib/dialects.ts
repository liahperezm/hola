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
  /** In English, for the learner mode: "Dominican Republic". */
  nameEn: string;
  shortEn: string;
  /** "Dominican", as in "Dominican Spanish". */
  adjectiveEn: string;
};

export const DIALECTS: Record<DialectCode, Dialect> = {
  AR: {
    code: "AR",
    name: "Argentina",
    short: "Argentina",
    demonymF: "argentina",
    demonymM: "argentino",
    speechLang: "es-AR",
    nameEn: "Argentina",
    shortEn: "Argentina",
    adjectiveEn: "Argentine",
  },
  BO: {
    code: "BO",
    name: "Bolivia",
    short: "Bolivia",
    demonymF: "boliviana",
    demonymM: "boliviano",
    speechLang: "es-BO",
    nameEn: "Bolivia",
    shortEn: "Bolivia",
    adjectiveEn: "Bolivian",
  },
  CL: {
    code: "CL",
    name: "Chile",
    short: "Chile",
    demonymF: "chilena",
    demonymM: "chileno",
    speechLang: "es-CL",
    nameEn: "Chile",
    shortEn: "Chile",
    adjectiveEn: "Chilean",
  },
  CO: {
    code: "CO",
    name: "Colombia",
    short: "Colombia",
    demonymF: "colombiana",
    demonymM: "colombiano",
    speechLang: "es-CO",
    nameEn: "Colombia",
    shortEn: "Colombia",
    adjectiveEn: "Colombian",
  },
  CR: {
    code: "CR",
    name: "Costa Rica",
    short: "Costa Rica",
    demonymF: "costarricense",
    demonymM: "costarricense",
    speechLang: "es-CR",
    nameEn: "Costa Rica",
    shortEn: "Costa Rica",
    adjectiveEn: "Costa Rican",
  },
  CU: {
    code: "CU",
    name: "Cuba",
    short: "Cuba",
    demonymF: "cubana",
    demonymM: "cubano",
    speechLang: "es-CU",
    nameEn: "Cuba",
    shortEn: "Cuba",
    adjectiveEn: "Cuban",
  },
  EC: {
    code: "EC",
    name: "Ecuador",
    short: "Ecuador",
    demonymF: "ecuatoriana",
    demonymM: "ecuatoriano",
    speechLang: "es-EC",
    nameEn: "Ecuador",
    shortEn: "Ecuador",
    adjectiveEn: "Ecuadorian",
  },
  SV: {
    code: "SV",
    name: "El Salvador",
    short: "El Salvador",
    demonymF: "salvadoreña",
    demonymM: "salvadoreño",
    speechLang: "es-SV",
    nameEn: "El Salvador",
    shortEn: "El Salvador",
    adjectiveEn: "Salvadoran",
  },
  ES: {
    code: "ES",
    name: "España",
    short: "España",
    demonymF: "española",
    demonymM: "español",
    speechLang: "es-ES",
    nameEn: "Spain",
    shortEn: "Spain",
    adjectiveEn: "Spanish (Spain)",
  },
  US: {
    code: "US",
    name: "Estados Unidos",
    short: "EE. UU.",
    demonymF: "estadounidense",
    demonymM: "estadounidense",
    speechLang: "es-US",
    nameEn: "United States",
    shortEn: "USA",
    adjectiveEn: "US Spanish",
  },
  GT: {
    code: "GT",
    name: "Guatemala",
    short: "Guatemala",
    demonymF: "guatemalteca",
    demonymM: "guatemalteco",
    speechLang: "es-GT",
    nameEn: "Guatemala",
    shortEn: "Guatemala",
    adjectiveEn: "Guatemalan",
  },
  GQ: {
    code: "GQ",
    name: "Guinea Ecuatorial",
    short: "G. Ecuatorial",
    demonymF: "ecuatoguineana",
    demonymM: "ecuatoguineano",
    speechLang: "es-GQ",
    nameEn: "Equatorial Guinea",
    shortEn: "Eq. Guinea",
    adjectiveEn: "Equatoguinean",
  },
  HN: {
    code: "HN",
    name: "Honduras",
    short: "Honduras",
    demonymF: "hondureña",
    demonymM: "hondureño",
    speechLang: "es-HN",
    nameEn: "Honduras",
    shortEn: "Honduras",
    adjectiveEn: "Honduran",
  },
  MX: {
    code: "MX",
    name: "México",
    short: "México",
    demonymF: "mexicana",
    demonymM: "mexicano",
    speechLang: "es-MX",
    nameEn: "Mexico",
    shortEn: "Mexico",
    adjectiveEn: "Mexican",
  },
  NI: {
    code: "NI",
    name: "Nicaragua",
    short: "Nicaragua",
    demonymF: "nicaragüense",
    demonymM: "nicaragüense",
    speechLang: "es-NI",
    nameEn: "Nicaragua",
    shortEn: "Nicaragua",
    adjectiveEn: "Nicaraguan",
  },
  PA: {
    code: "PA",
    name: "Panamá",
    short: "Panamá",
    demonymF: "panameña",
    demonymM: "panameño",
    speechLang: "es-PA",
    nameEn: "Panama",
    shortEn: "Panama",
    adjectiveEn: "Panamanian",
  },
  PY: {
    code: "PY",
    name: "Paraguay",
    short: "Paraguay",
    demonymF: "paraguaya",
    demonymM: "paraguayo",
    speechLang: "es-PY",
    nameEn: "Paraguay",
    shortEn: "Paraguay",
    adjectiveEn: "Paraguayan",
  },
  PE: {
    code: "PE",
    name: "Perú",
    short: "Perú",
    demonymF: "peruana",
    demonymM: "peruano",
    speechLang: "es-PE",
    nameEn: "Peru",
    shortEn: "Peru",
    adjectiveEn: "Peruvian",
  },
  PR: {
    code: "PR",
    name: "Puerto Rico",
    short: "Puerto Rico",
    demonymF: "puertorriqueña",
    demonymM: "puertorriqueño",
    speechLang: "es-PR",
    nameEn: "Puerto Rico",
    shortEn: "Puerto Rico",
    adjectiveEn: "Puerto Rican",
  },
  DO: {
    code: "DO",
    name: "República Dominicana",
    short: "Rep. Dom.",
    demonymF: "dominicana",
    demonymM: "dominicano",
    speechLang: "es-DO",
    nameEn: "Dominican Republic",
    shortEn: "Dom. Rep.",
    adjectiveEn: "Dominican",
  },
  UY: {
    code: "UY",
    name: "Uruguay",
    short: "Uruguay",
    demonymF: "uruguaya",
    demonymM: "uruguayo",
    speechLang: "es-UY",
    nameEn: "Uruguay",
    shortEn: "Uruguay",
    adjectiveEn: "Uruguayan",
  },
  VE: {
    code: "VE",
    name: "Venezuela",
    short: "Venezuela",
    demonymF: "venezolana",
    demonymM: "venezolano",
    speechLang: "es-VE",
    nameEn: "Venezuela",
    shortEn: "Venezuela",
    adjectiveEn: "Venezuelan",
  },
};

export function isDialectCode(value: unknown): value is DialectCode {
  return (
    typeof value === "string" &&
    (DIALECT_CODES as readonly string[]).includes(value)
  );
}

/** "Dominican phrase" / "Dominican word", for the learner mode. */
export function termLabelEn(text: string, dialect: DialectCode): string {
  return `${DIALECTS[dialect].adjectiveEn} ${text.trim().includes(" ") ? "phrase" : "word"}`;
}

/** "Frase dominicana" for phrases, "Palabra dominicana" for single words. */
export function termLabel(text: string, dialect: DialectCode): string {
  const kind = text.trim().includes(" ") ? "Frase" : "Palabra";
  return `${kind} ${DIALECTS[dialect].demonymF}`;
}
