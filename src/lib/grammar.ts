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

// Determiners and pre-noun adjectives, masculine ↔ feminine.
const DETERMINERS: [string, string][] = [
  ["el", "la"], ["un", "una"], ["los", "las"], ["unos", "unas"],
  ["este", "esta"], ["estos", "estas"], ["ese", "esa"], ["esos", "esas"],
  ["aquel", "aquella"], ["aquellos", "aquellas"], ["otro", "otra"],
  ["otros", "otras"], ["mucho", "mucha"], ["muchos", "muchas"],
  ["poco", "poca"], ["pocos", "pocas"], ["nuestro", "nuestra"],
  ["nuestros", "nuestras"], ["vuestro", "vuestra"], ["vuestros", "vuestras"],
  ["algún", "alguna"], ["algunos", "algunas"], ["ningún", "ninguna"],
  ["buen", "buena"], ["mal", "mala"], ["primer", "primera"],
  ["tercer", "tercera"], ["todo", "toda"], ["todos", "todas"],
  ["cuánto", "cuánta"], ["cuántos", "cuántas"], ["dicho", "dicha"],
];
const TO_F = new Map(DETERMINERS.map(([m, f]) => [m, f]));
const TO_M = new Map(DETERMINERS.map(([m, f]) => [f, m]));

/*
 * Adjectives that follow a noun. Only these, words ending in a participle
 * suffix, or common adjective suffixes are changed: plenty of verbs end in -o
 * or -a too ("cuesta", "llevo"), and those must not be touched.
 */
const ADJECTIVES = new Set(
  `nuevo viejo rojo blanco negro amarillo morado rosado dorado plateado
  bonito lindo feo caro barato rico sabroso frío pequeño chiquito largo corto
  alto bajo gordo flaco delgado lleno vacío limpio sucio roto mojado seco
  último primero mismo propio bueno malo cómodo rápido lento duro blando
  oscuro claro salado maduro fresco perfecto raro típico precioso hermoso
  enorme famoso nuevecito tranquilo bravo lindo guapo listo cansado contento
  enojado ocupado abierto cerrado cubierto puesto hecho dicho escrito
  propio ajeno entero medio junto solo cierto extraño ancho estrecho
  redondo cuadrado tibio crudo cocido fino grueso liso suave áspero
  plástico eléctrico mágico público mexicano dominicano colombiano argentino
  americano cubano peruano chileno venezolano uruguayo boliviano paraguayo
  ecuatoriano panameño hondureño salvadoreño guatemalteco nicaragüense`
    .split(/\s+/)
    .filter(Boolean),
);
const ADJECTIVE_SUFFIX = /(ado|ido|oso|ito|ísimo|ico|ivo|ario|ero|ano|eño)$/;

function isAdjective(word: string, from: Gender): boolean {
  const w = word.toLowerCase();
  const base = from === "m" ? w.replace(/os?$/, "o") : w.replace(/as?$/, "o");
  const ends = from === "m" ? /os?$/.test(w) : /as?$/.test(w);
  return ends && (ADJECTIVES.has(base) || ADJECTIVE_SUFFIX.test(base));
}

function flipAdjective(word: string, to: Gender): string {
  return word.replace(/[oa](s?)$/i, (_, s: string) => (to === "f" ? "a" : "o") + s);
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

/** The gender a determiner right before the noun shows, if any. */
export function genderFromArticle(before: string): Gender | undefined {
  const m = before.match(/(\p{L}+)\s+$/u);
  const word = m?.[1].toLowerCase();
  if (!word) return undefined;
  if (TO_F.has(word)) return "m";
  if (TO_M.has(word)) return "f";
  if (word === "del" || word === "al") return "m";
  return undefined;
}

const COPULAS = new Set([
  "es", "está", "esta", "era", "estaba", "fue", "son", "están", "eran",
  "estaban", "parece", "parecía", "queda", "quedó", "se", "ve", "veía",
]);
const INTENSIFIERS = new Set(["muy", "bien", "tan", "super", "súper", "bastante", "demasiado", "medio", "re"]);

/**
 * Text before a swapped noun, with its determiners and adjectives agreeing:
 * "de la nueva " + carrizo → "del nuevo ".
 */
export function agreeBefore(before: string, from: Gender, to: Gender): string {
  if (from === to) return before;
  const tokens = before.split(/(\s+)/);
  let changed = 0;
  for (let i = tokens.length - 1; i >= 0 && changed < 3; i--) {
    const t = tokens[i];
    if (!t || /^\s+$/.test(t)) continue;
    const lower = t.toLowerCase();
    const swap = to === "f" ? TO_F.get(lower) : TO_M.get(lower);
    if (swap) {
      tokens[i] = keepCase(swap, t);
      changed++;
      continue;
    }
    if (to === "f" && (lower === "del" || lower === "al")) {
      tokens[i] = keepCase(lower === "del" ? "de la" : "a la", t);
      break;
    }
    if (isAdjective(t, from)) {
      tokens[i] = flipAdjective(t, to);
      changed++;
      continue;
    }
    break;
  }
  let out = tokens.join("");
  // "de el" / "a el" contract when the noun becomes masculine.
  if (to === "m") {
    out = out.replace(/\b([Dd])e el(\s+)$/u, "$1el$2").replace(/\b([Aa]) el(\s+)$/u, "$1l$2");
  }
  return out;
}

/**
 * Text after a swapped noun, with the adjectives describing it agreeing:
 * carrizo + " roto y sucio" → " roto y sucio"; vulva + " pequeño" → " pequeña".
 * Also one adjective after "es", "está"… ("la pajita está rota").
 */
export function agreeAfter(after: string, from: Gender, to: Gender): string {
  if (from === to) return after;
  const tokens = after.split(/(\s+|[,.;:!?¡¿()]+)/);
  let afterCopula = false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t || /^[\s,]+$/.test(t)) continue;
    const lower = t.toLowerCase();
    if (/^[.;:!?¡¿()]+$/.test(t)) break;
    if (lower === "y" || lower === "e") continue;
    if (isAdjective(t, from)) {
      tokens[i] = flipAdjective(t, to);
      afterCopula = false;
      continue;
    }
    if (!afterCopula && COPULAS.has(lower)) {
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
