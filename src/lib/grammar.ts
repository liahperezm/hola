import { ACCENTED } from "./accents.generated";

export type Gender = "m" | "f";

/*
 * Small grammar helpers for the translator: a noun's gender, making the words
 * around a swapped noun agree with it, and restoring missing accents.
 */

const strip = (w: string) =>
  w.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC");

const FEMININE = new Set([
  "mano", "foto", "moto", "radio", "calle", "leche", "carne", "gente", "noche",
  "clase", "parte", "muerte", "suerte", "llave", "nube", "fuente", "frase",
  "base", "fe", "tarde", "sangre", "torre", "nave", "flor", "miel", "sal",
  "piel", "cárcel", "señal", "luz", "vez", "nariz", "paz", "voz", "cruz",
  "red", "pared", "sed", "imagen", "razón", "canción",
]);

const MASCULINE = new Set([
  "día", "mapa", "problema", "sistema", "programa", "tema", "idioma", "clima",
  "sofá", "planeta", "pijama", "lápiz", "maíz", "pez", "arroz", "bus",
  "ómnibus", "celu", "bondi", "taxi", "menú", "champú", "colibrí",
]);

/** A noun's gender from its spelling, or undefined when it can't tell. */
export function nounGender(phrase: string): Gender | undefined {
  const word = phrase.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!word) return undefined;
  if (FEMININE.has(word)) return "f";
  if (MASCULINE.has(word)) return "m";
  const singular = word.replace(/(?<=[aeiou])s$/, "");
  if (FEMININE.has(singular)) return "f";
  if (MASCULINE.has(singular)) return "m";
  if (/(ción|sión|dad|tad|tud|umbre|ez|triz)$/.test(singular)) return "f";
  if (/a$/.test(singular)) return "f";
  if (/(o|or|aje|ón|e|é)$/.test(singular)) return "m";
  return undefined;
}

export type GrammaticalNumber = "s" | "p";

/** A noun's form: gender when known, and singular or plural. */
export type NounForm = { gender?: Gender; number: GrammaticalNumber };

// Singular nouns that end in -s.
const SINGULAR_IN_S = new Set([
  "bus", "ómnibus", "autobús", "lunes", "martes", "miércoles", "jueves", "viernes",
  "crisis", "tesis", "análisis", "virus", "cactus", "tos", "mes", "gas", "dios",
  "país", "anís", "francés", "inglés", "interés", "compás", "atlas", "vals",
]);

/** Singular or plural, from the first word: "palomitas" → plural, "cocaleca" → singular. */
export function nounNumber(phrase: string): GrammaticalNumber {
  const word = phrase.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!word.endsWith("s") || SINGULAR_IN_S.has(word)) return "s";
  if (/[áéíóú]s$/.test(word)) return "s"; // autobús, país
  return "p";
}

// Determiners and words before a noun: [masc. sing., fem. sing., masc. pl., fem. pl.].
const DETERMINER_FORMS: [string, string, string, string][] = [
  ["el", "la", "los", "las"], ["un", "una", "unos", "unas"],
  ["este", "esta", "estos", "estas"], ["ese", "esa", "esos", "esas"],
  ["aquel", "aquella", "aquellos", "aquellas"], ["otro", "otra", "otros", "otras"],
  ["mucho", "mucha", "muchos", "muchas"], ["poco", "poca", "pocos", "pocas"],
  ["todo", "toda", "todos", "todas"], ["nuestro", "nuestra", "nuestros", "nuestras"],
  ["vuestro", "vuestra", "vuestros", "vuestras"], ["algún", "alguna", "algunos", "algunas"],
  ["ningún", "ninguna", "ningunos", "ningunas"], ["cuánto", "cuánta", "cuántos", "cuántas"],
  ["dicho", "dicha", "dichos", "dichas"], ["buen", "buena", "buenos", "buenas"],
  ["mal", "mala", "malos", "malas"], ["primer", "primera", "primeros", "primeras"],
  ["tercer", "tercera", "terceros", "terceras"], ["demasiado", "demasiada", "demasiados", "demasiadas"],
  ["tanto", "tanta", "tantos", "tantas"], ["mi", "mi", "mis", "mis"],
  ["tu", "tu", "tus", "tus"], ["su", "su", "sus", "sus"],
];
const DETERMINER_INDEX = new Map<string, [string, string, string, string]>();
for (const row of DETERMINER_FORMS) for (const w of row) if (!DETERMINER_INDEX.has(w)) DETERMINER_INDEX.set(w, row);

function slot(form: NounForm): number {
  return (form.number === "p" ? 2 : 0) + (form.gender === "f" ? 1 : 0);
}

/*
 * Adjectives that describe a noun. Only these, words with a participle or
 * adjective suffix, and a few that only change for number are changed: plenty
 * of verbs end in -o or -a too ("cuesta", "llevo"), and those must not be touched.
 */
const ADJECTIVES = new Set(
  `nuevo viejo rojo blanco negro amarillo morado rosado dorado plateado
  bonito lindo feo caro barato rico sabroso frío pequeño chiquito largo corto
  alto bajo gordo flaco delgado lleno vacío limpio sucio roto mojado seco
  último primero mismo propio bueno malo cómodo rápido lento duro blando
  oscuro claro salado maduro fresco perfecto raro típico precioso hermoso
  enorme famoso tranquilo bravo guapo listo cansado contento enojado ocupado
  abierto cerrado cubierto puesto hecho dicho escrito ajeno entero medio junto
  solo cierto extraño ancho estrecho redondo cuadrado tibio crudo cocido fino
  grueso liso suave áspero plástico eléctrico mágico público mexicano dominicano
  colombiano argentino americano cubano peruano chileno venezolano uruguayo
  boliviano paraguayo ecuatoriano panameño hondureño salvadoreño guatemalteco`
    .split(/\s+/)
    .filter(Boolean),
);
// Adjectives with one form for both genders: only number changes.
const BOTH_GENDERS = new Set(
  `grande verde caliente dulce picante alegre triste fuerte suave azul gris fácil
  difícil mejor peor joven feliz pobre interesante importante increíble terrible
  horrible agradable amable útil inútil normal especial genial chévere`
    .split(/\s+/)
    .filter(Boolean),
);
const ADJECTIVE_SUFFIX = /(ado|ido|oso|ito|ísimo|ico|ivo|ario|ero|ano|eño)$/;

/** The adjective in the noun's new form, or null if the word is not one. */
function reinflectAdjective(word: string, from: NounForm, to: NounForm): string | null {
  const w = word.toLowerCase();
  // -o / -a adjectives: four forms.
  const m = w.match(/^(.+)([oa])(s?)$/);
  if (m) {
    const [, stem, vowel, plural] = m;
    const base = `${stem}o`;
    const agrees =
      (from.gender === undefined || (vowel === "o") === (from.gender === "m")) &&
      (plural === "s") === (from.number === "p");
    if (agrees && (ADJECTIVES.has(base) || ADJECTIVE_SUFFIX.test(base))) {
      const gender = to.gender ?? from.gender ?? (vowel === "a" ? "f" : "m");
      return stem + (gender === "f" ? "a" : "o") + (to.number === "p" ? "s" : "");
    }
  }
  // One form for both genders: number only.
  const singular = from.number === "p" ? w.replace(/ces$/, "z").replace(/(?<=[^aeiouáéíóú])es$|(?<=[aeiouáéíóú])s$/, "") : w;
  if (BOTH_GENDERS.has(singular)) {
    if (to.number === "s") return singular;
    if (/z$/.test(singular)) return `${singular.slice(0, -1)}ces`;
    return /[aeiouáéíóú]$/.test(singular) ? `${singular}s` : `${singular}es`;
  }
  return null;
}

function keepCase(replacement: string, original: string): string {
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  const first = original.charAt(0);
  return first === first.toUpperCase() && first !== first.toLowerCase()
    ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
    : replacement;
}

/** The gender and number a determiner right before the noun shows, if any. */
export function formFromArticle(before: string): Partial<NounForm> {
  const m = before.match(/(\p{L}+)\s+$/u);
  const word = m?.[1].toLowerCase();
  if (!word) return {};
  if (word === "del" || word === "al") return { gender: "m", number: "s" };
  const row = DETERMINER_INDEX.get(word);
  if (!row) return {};
  const i = row.indexOf(word);
  const ambiguousGender = row[0] === row[1];
  return { gender: ambiguousGender ? undefined : i % 2 ? "f" : "m", number: i >= 2 ? "p" : "s" };
}

/** Kept for callers that only need the gender. */
export function genderFromArticle(before: string): Gender | undefined {
  return formFromArticle(before).gender;
}

const COPULA_NUMBER: [string, string][] = [
  ["es", "son"], ["está", "están"], ["esta", "están"], ["era", "eran"],
  ["estaba", "estaban"], ["fue", "fueron"], ["parece", "parecen"],
  ["parecía", "parecían"], ["queda", "quedan"], ["quedó", "quedaron"],
  ["cuesta", "cuestan"], ["sabe", "saben"], ["huele", "huelen"],
];
const TO_PLURAL_VERB = new Map(COPULA_NUMBER);
const TO_SINGULAR_VERB = new Map(COPULA_NUMBER.map(([s, p]) => [p, s === "esta" ? "está" : s]));
const COPULAS = new Set([...TO_PLURAL_VERB.keys(), ...TO_SINGULAR_VERB.keys(), "se", "ve", "veía"]);
const INTENSIFIERS = new Set(["muy", "bien", "tan", "super", "súper", "bastante", "demasiado", "medio", "re"]);

function changed(from: NounForm, to: NounForm): boolean {
  return (from.gender !== undefined && to.gender !== undefined && from.gender !== to.gender) || from.number !== to.number;
}

/**
 * Text before a swapped noun, with its determiners and adjectives agreeing:
 * "de la nueva " + carrizo → "del nuevo "; "mucha " + palomitas → "muchas ".
 */
export function agreeBefore(before: string, from: NounForm, to: NounForm): string {
  if (!changed(from, to)) return before;
  const target: NounForm = { gender: to.gender ?? from.gender, number: to.number };
  const tokens = before.split(/(\s+)/);
  let count = 0;
  for (let i = tokens.length - 1; i >= 0 && count < 3; i--) {
    const t = tokens[i];
    if (!t || /^\s+$/.test(t)) continue;
    const lower = t.toLowerCase();
    if (lower === "del" || lower === "al") {
      const article = DETERMINER_INDEX.get("el")![slot(target)];
      if (article !== "el") tokens[i] = keepCase(`${lower === "del" ? "de" : "a"} ${article}`, t);
      break;
    }
    const row = DETERMINER_INDEX.get(lower);
    if (row) {
      tokens[i] = keepCase(row[slot(target)], t);
      count++;
      continue;
    }
    const adjective = reinflectAdjective(t, from, target);
    if (adjective) {
      tokens[i] = keepCase(adjective, t);
      count++;
      continue;
    }
    break;
  }
  let out = tokens.join("");
  // "de el" / "a el" contract.
  out = out.replace(/\b([Dd])e el(\s+)$/u, "$1el$2").replace(/\b([Aa]) el(\s+)$/u, "$1l$2");
  return out;
}

/**
 * Text after a swapped noun, with the words describing it agreeing:
 * vulva + " pequeño" → " pequeña"; palomitas + " está rica" → " están ricas".
 */
export function agreeAfter(after: string, from: NounForm, to: NounForm): string {
  if (!changed(from, to)) return after;
  const target: NounForm = { gender: to.gender ?? from.gender, number: to.number };
  const tokens = after.split(/(\s+|[,.;:!?¡¿()]+)/);
  let afterCopula = false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t || /^[\s,]+$/.test(t)) continue;
    const lower = t.toLowerCase();
    if (/^[.;:!?¡¿()]+$/.test(t)) break;
    if (lower === "y" || lower === "e") continue;
    const adjective = reinflectAdjective(t, from, target);
    if (adjective) {
      tokens[i] = keepCase(adjective, t);
      afterCopula = false;
      continue;
    }
    if (!afterCopula && COPULAS.has(lower)) {
      if (from.number !== target.number) {
        const verb = target.number === "p" ? TO_PLURAL_VERB.get(lower) : TO_SINGULAR_VERB.get(lower);
        if (verb) tokens[i] = keepCase(verb, t);
      }
      afterCopula = true;
      continue;
    }
    if (afterCopula && INTENSIFIERS.has(lower)) continue;
    break;
  }
  return tokens.join("");
}

let accentMap: Map<string, string> | undefined;

function accents(): Map<string, string> {
  if (!accentMap) {
    accentMap = new Map();
    for (const w of ACCENTED.split(" ")) accentMap.set(strip(w).replace(/ñ/g, "n"), w);
  }
  return accentMap;
}

/** "plastico" → "plástico", "nino" → "niño"; words valid either way stay. */
export function fixAccents(text: string): string {
  return text.replace(/\p{L}+/gu, (word) => {
    const lower = word.toLowerCase();
    if (lower !== strip(lower).replace(/ñ/g, "n")) return word; // already accented
    const fixed = accents().get(lower);
    return fixed ? keepCase(fixed, word) : word;
  });
}
