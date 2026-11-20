import { DIALECTS, type DialectCode } from "./dialects";
import { IMPORTED_CONCEPTS } from "./lexicon.generated";

export type GuideId = "basicos" | "oficina" | "viaje" | "comida";

export const GUIDES: {
  id: GuideId;
  title: string;
  emoji: string;
  subtitle: string;
}[] = [
  { id: "basicos", title: "Básicos", emoji: "👋", subtitle: "Saludos y el día a día" },
  { id: "viaje", title: "Viaje", emoji: "✈️", subtitle: "Transporte y hoteles" },
  { id: "comida", title: "Comida", emoji: "🍲", subtitle: "Mercado y mesa" },
  { id: "oficina", title: "Oficina", emoji: "💼", subtitle: "Reuniones y trabajo" },
];

export type TermDetail = {
  /** Pronunciation guide in English-style syllables, stressed syllable in caps. */
  pronunciation?: string;
  definition?: string;
  antonyms?: string[];
  example?: string;
  origin?: string;
};

type Concept = {
  id: string;
  /** What it means in neutral Spanish. Used when a dialect has no word of its own. */
  meaning: string;
  /** Which mini guide lists it. Without one it is only in the translator and search. */
  guide?: GuideId;
  /** Local ways to say it. The first is the one a translation uses. */
  terms: Partial<Record<DialectCode, string[]>>;
  /** Extra detail for the first term of a dialect. */
  details?: Partial<Record<DialectCode, TermDetail>>;
  /** Extra detail for any other word, by its text. */
  wordDetails?: Record<string, TermDetail>;
  /** Words that are vulgar or offensive, by their text. Never used as a translation. */
  registers?: Record<string, Register>;
};

export type Register = "vulgar" | "offensive";

/*
 * Starter dictionary. Each concept lists only words that are distinctive in a
 * country; a country without its own word falls back to `meaning`.
 */
const HAND_CONCEPTS: Concept[] = [
  // Básicos
  {
    id: "oye",
    meaning: "oye",
    guide: "basicos",
    terms: {
      DO: ["ey tú"],
      AR: ["che"],
      UY: ["bo"],
      MX: ["oye güey", "güey", "wey"],
      CO: ["parce", "parcero"],
      VE: ["pana"],
      ES: ["tío", "tía"],
    },
    details: {
      AR: {
        pronunciation: "CHEH",
        definition:
          "Interjección para llamar la atención de alguien o dirigirse a un amigo. Se usa todo el tiempo en Argentina y Uruguay.",
        example: "Che, ¿venís a comer?",
      },
      UY: {
        pronunciation: "BOH",
        definition:
          "Forma uruguaya de llamar a alguien con confianza, parecida al «che» argentino.",
        example: "Bo, ¿qué hacés?",
      },
    },
  },
  {
    id: "como-estas",
    meaning: "¿cómo estás?",
    guide: "basicos",
    terms: {
      DO: ["¿cómo tú tá?", "¿qué lo que?"],
      AR: ["¿cómo andás?"],
      UY: ["¿cómo andás?"],
      MX: ["¿qué onda?"],
      CO: ["¿qué más?", "¿quiubo?"],
      VE: ["¿qué más?"],
      PR: ["¿qué es la que hay?"],
      CU: ["¿qué volá?"],
      ES: ["¿qué tal?"],
    },
  },
  {
    id: "verdad",
    meaning: "de verdad",
    guide: "basicos",
    terms: {
      DO: ["verdá"],
      AR: ["posta"],
      MX: ["neta"],
    },
  },
  {
    id: "lio",
    meaning: "un lío",
    guide: "basicos",
    terms: {
      DO: ["un lío", "un arroz con mango"],
      AR: ["quilombo"],
      UY: ["quilombo"],
      MX: ["desmadre"],
      CO: ["despelote"],
      ES: ["follón"],
    },
    details: {
      AR: {
        pronunciation: "kee-LOHM-boh",
        definition: "Desorden, lío o situación caótica.",
        antonyms: ["orden", "calma", "tranquilidad"],
        example: "Esta oficina es un quilombo.",
        origin:
          "Viene del kimbundu «kilombo», que nombraba los asentamientos de personas esclavizadas que escapaban en Brasil. En el Río de la Plata pasó a significar primero un prostíbulo y luego cualquier desorden.",
      },
    },
  },
  {
    id: "hablar-tonterias",
    meaning: "decir tonterías",
    guide: "basicos",
    terms: {
      DO: ["hablar disparate"],
      AR: ["mandar fruta"],
      CO: ["hablar paja"],
      VE: ["hablar paja"],
      ES: ["decir chorradas"],
    },
  },
  {
    id: "nino",
    meaning: "niño",
    guide: "basicos",
    terms: {
      DO: ["carajito", "carajita", "chamaquito", "chamaquita"],
      CO: ["pelado", "pelada"],
      AR: ["pibe", "piba"],
      UY: ["gurí", "gurisa"],
      MX: ["chamaco", "chamaca", "escuincle"],
      VE: ["chamo", "chama"],
      PR: ["nene", "nena"],
      ES: ["chaval", "chavala"],
      CL: ["cabro chico", "cabra chica"],
      PE: ["chibolo", "chibola"],
    },
    details: {
      AR: {
        pronunciation: "PEE-beh",
        definition: "Niño o joven. En femenino, «piba».",
        example: "Ese pibe juega muy bien al fútbol.",
      },
    },
  },
  {
    id: "genial",
    meaning: "genial",
    guide: "basicos",
    terms: {
      DO: ["nítido", "chévere"],
      AR: ["copado", "piola"],
      MX: ["chido", "padre"],
      CO: ["bacano", "chévere"],
      VE: ["chévere", "fino"],
      PR: ["chévere"],
      ES: ["guay"],
      CL: ["bacán"],
      PE: ["bacán", "chévere"],
    },
  },
  {
    id: "dinero",
    meaning: "dinero",
    guide: "basicos",
    terms: {
      DO: ["cuartos"],
      AR: ["guita"],
      MX: ["lana"],
      VE: ["reales"],
      PR: ["chavos"],
      CU: ["baro"],
      ES: ["pasta"],
      CL: ["lucas"],
    },
  },
  {
    id: "fiesta",
    meaning: "fiesta",
    guide: "basicos",
    terms: {
      DO: ["coro"],
      AR: ["joda"],
      MX: ["pachanga"],
      CO: ["rumba"],
      VE: ["rumba"],
      ES: ["juerga"],
      CL: ["carrete"],
    },
  },
  {
    id: "tonto",
    meaning: "persona tonta o tímida",
    guide: "basicos",
    terms: {
      DO: ["pariguayo", "pariguaya"],
      AR: ["gil"],
      MX: ["menso", "mensa"],
      ES: ["pardillo", "pardilla"],
    },
    details: {
      DO: {
        pronunciation: "pah-ree-GWAH-yoh",
        definition:
          "Persona lenta, tímida, ingenua o tonta; el que se queda mirando la fiesta sin participar.",
        antonyms: ["avispado", "lanzado", "despierto"],
        example: "No seas pariguayo y sácala a bailar.",
        origin:
          "Según la historia popular, viene del inglés «party watcher»: durante la ocupación estadounidense (1916–1924), los dominicanos llamaban así a los soldados que miraban las fiestas sin bailar.",
      },
    },
  },
  {
    id: "deprisa",
    meaning: "deprisa y mal hecho",
    guide: "basicos",
    terms: {
      DO: ["a la brigandina"],
      CO: ["a las carreras"],
      AR: ["a las apuradas"],
      MX: ["al aventón"],
      ES: ["a lo loco"],
    },
    details: {
      DO: {
        pronunciation: "ah lah bree-gahn-DEE-nah",
        definition:
          "«A la brigandina» sugiere que algo se hizo deprisa y con precipitación, resultado de mala calidad, sin prestar atención.",
        antonyms: [
          "bueno",
          "excelente",
          "buena terminación",
          "organizado",
          "pensativo",
          "maduro",
        ],
        example: "Esa tarea la hiciste a la brigandina.",
        origin:
          "La palabra «brigandina» se deriva de «Bridge and Dinna», una compañía norteamericana que construía puentes en la República Dominicana durante la tiranía de Rafael Leonidas Trujillo. Se dieron a conocer por hacer una mala labor, descuidada, al construir estos puentes.",
      },
      CO: {
        pronunciation: "ah lahs kah-RREH-rahs",
        definition: "Hecho con prisa, sin cuidado y, por lo tanto, mal hecho.",
        antonyms: ["con calma", "con cuidado", "bien hecho"],
        example: "Hizo el informe a las carreras y le salió mal.",
      },
    },
  },

  // Oficina
  {
    id: "trabajo",
    meaning: "trabajo",
    guide: "oficina",
    terms: {
      AR: ["laburo"],
      UY: ["laburo"],
      MX: ["chamba"],
      PE: ["chamba"],
      CO: ["camello"],
      CL: ["pega"],
      ES: ["curro"],
    },
    details: {
      AR: {
        pronunciation: "lah-BOO-roh",
        definition: "Trabajo, empleo.",
        example: "Mañana tengo laburo temprano.",
        origin:
          "Del italiano «lavoro». Entró al lunfardo de Buenos Aires con la inmigración italiana de finales del siglo XIX.",
      },
    },
  },
  {
    id: "computadora",
    meaning: "computadora",
    guide: "oficina",
    terms: {
      ES: ["ordenador"],
      CO: ["computador"],
      CL: ["computador"],
    },
  },
  {
    id: "boligrafo",
    meaning: "bolígrafo",
    guide: "oficina",
    terms: {
      DO: ["lapicero"],
      AR: ["birome"],
      MX: ["pluma"],
      CO: ["esfero"],
      ES: ["boli"],
      CL: ["lápiz pasta"],
    },
  },
  {
    id: "grapadora",
    meaning: "grapadora",
    guide: "oficina",
    terms: {
      MX: ["engrapadora"],
      AR: ["abrochadora"],
      CO: ["cosedora"],
      ES: ["grapadora"],
    },
  },
  {
    id: "celular",
    meaning: "teléfono celular",
    guide: "oficina",
    terms: {
      ES: ["móvil"],
    },
  },

  // Viaje
  {
    id: "autobus",
    meaning: "autobús",
    guide: "viaje",
    terms: {
      DO: ["guagua"],
      PR: ["guagua"],
      CU: ["guagua"],
      AR: ["colectivo", "bondi"],
      UY: ["ómnibus", "bondi"],
      MX: ["camión"],
      CO: ["buseta"],
      VE: ["camionetica"],
      CL: ["micro"],
      PE: ["combi"],
      ES: ["autobús"],
    },
    details: {
      DO: {
        pronunciation: "GWAH-gwah",
        definition:
          "Autobús. Ojo: en Argentina, Chile y otros países andinos «guagua» significa bebé.",
        example: "Me voy en guagua para Santiago.",
        origin:
          "Una teoría popular dice que viene del inglés «wagon». Se usa igual en Puerto Rico, Cuba y las Islas Canarias.",
      },
      AR: {
        definition: "Autobús urbano.",
        example: "Tomé el colectivo para ir al centro.",
      },
    },
    wordDetails: {
      bondi: {
        pronunciation: "BOHN-dee",
        definition: "Forma coloquial de llamar al colectivo o autobús.",
        example: "Se me pasó el bondi.",
        origin:
          "Del portugués de Brasil «bonde» (tranvía). Se cuenta que los tranvías de Río se financiaron con bonos («bonds» en inglés) y el nombre pasó a los vehículos.",
      },
    },
  },
  {
    id: "carro",
    meaning: "carro",
    guide: "viaje",
    terms: {
      ES: ["coche"],
      AR: ["auto"],
      UY: ["auto"],
      CL: ["auto"],
    },
  },
  {
    id: "boleto",
    meaning: "boleto",
    guide: "viaje",
    terms: {
      ES: ["billete"],
      CO: ["tiquete"],
      AR: ["pasaje"],
    },
  },
  {
    id: "maleta",
    meaning: "maleta",
    guide: "viaje",
    terms: {
      AR: ["valija"],
      UY: ["valija"],
    },
  },
  {
    id: "taxi-compartido",
    meaning: "taxi de ruta compartido",
    guide: "viaje",
    terms: {
      DO: ["concho", "carro público"],
      MX: ["pesero"],
      VE: ["por puesto"],
      CL: ["colectivo"],
    },
  },
  {
    id: "mototaxi",
    meaning: "mototaxi",
    guide: "viaje",
    terms: {
      DO: ["motoconcho"],
    },
  },
  {
    id: "alquilar",
    meaning: "alquilar",
    guide: "viaje",
    terms: {
      MX: ["rentar"],
    },
  },

  // Comida
  {
    id: "banana",
    meaning: "banana",
    guide: "comida",
    terms: {
      DO: ["guineo"],
      PR: ["guineo"],
      VE: ["cambur"],
      CO: ["banano"],
      MX: ["plátano"],
      ES: ["plátano"],
      CL: ["plátano"],
      AR: ["banana"],
    },
    details: {
      VE: {
        pronunciation: "kahm-BOOR",
        definition:
          "Banana o plátano dulce que se come crudo. En Venezuela «plátano» es el que se cocina.",
        example: "Échame un cambur en la lonchera.",
      },
      DO: {
        pronunciation: "gee-NEH-oh",
        definition: "Banana o plátano dulce que se come maduro.",
        example: "Me comí un guineo de merienda.",
        origin:
          "Se suele explicar porque los primeros bananos llegaron al Caribe desde la costa de Guinea, en África.",
      },
    },
  },
  {
    id: "aguacate",
    meaning: "aguacate",
    guide: "comida",
    terms: {
      AR: ["palta"],
      CL: ["palta"],
      PE: ["palta"],
      UY: ["palta"],
    },
    details: {
      AR: {
        pronunciation: "PAHL-tah",
        definition: "Aguacate.",
        origin: "Del quechua «pallta».",
      },
    },
  },
  {
    id: "maiz",
    meaning: "mazorca de maíz",
    guide: "comida",
    terms: {
      MX: ["elote"],
      AR: ["choclo"],
      CL: ["choclo"],
      PE: ["choclo"],
      ES: ["mazorca"],
    },
    details: {
      AR: { origin: "Del quechua «choqllo»." },
    },
  },
  {
    id: "frijoles",
    meaning: "frijoles",
    guide: "comida",
    terms: {
      DO: ["habichuelas"],
      PR: ["habichuelas"],
      MX: ["frijoles"],
      AR: ["porotos"],
      CL: ["porotos"],
      UY: ["porotos"],
      VE: ["caraotas"],
      ES: ["alubias", "judías"],
    },
    details: {
      AR: { origin: "Del quechua «purutu»." },
    },
  },
  {
    id: "fresa",
    meaning: "fresa",
    guide: "comida",
    terms: {
      AR: ["frutilla"],
      UY: ["frutilla"],
      CL: ["frutilla"],
    },
  },
  {
    id: "palomitas",
    meaning: "palomitas de maíz",
    guide: "comida",
    terms: {
      MX: ["palomitas"],
      ES: ["palomitas"],
      AR: ["pochoclo"],
      VE: ["cotufas"],
      CO: ["crispetas"],
      CL: ["cabritas"],
    },
  },
  {
    id: "durazno",
    meaning: "durazno",
    guide: "comida",
    terms: {
      ES: ["melocotón"],
    },
  },
  {
    id: "jugo",
    meaning: "jugo",
    guide: "comida",
    terms: {
      ES: ["zumo"],
    },
  },
  {
    id: "pastel",
    meaning: "pastel",
    guide: "comida",
    terms: {
      DO: ["bizcocho"],
      AR: ["torta"],
      VE: ["torta"],
      CO: ["ponqué"],
      ES: ["tarta"],
      PR: ["bizcocho"],
    },
  },
];

/** A concept from the imported lexicon (see lexicon/README.md). */
export type ImportedConcept = {
  id: string;
  meaning: string;
  guide?: GuideId;
  terms: Partial<Record<DialectCode, string[]>>;
  /** Id of a hand-made concept to add these words to. */
  mergeInto?: string;
  registers?: Record<string, Register>;
};

/**
 * Hand-made concepts plus the imported lexicon. Hand-made words always come
 * first, and a word a dialect already lists elsewhere is never added twice.
 */
function mergeConcepts(hand: Concept[], imported: ImportedConcept[]): Concept[] {
  const byId = new Map(hand.map((c) => [c.id, { ...c, terms: { ...c.terms } }]));
  const taken = new Set<string>();
  for (const c of byId.values()) {
    for (const [code, words] of Object.entries(c.terms)) {
      words?.forEach((w) => taken.add(`${code}.${slugify(w)}`));
    }
  }
  for (const item of imported) {
    const target = item.mergeInto ? byId.get(item.mergeInto) : undefined;
    if (!target && byId.has(item.id)) continue;
    const concept: Concept = target ?? {
      id: item.id,
      meaning: item.meaning,
      guide: item.guide,
      terms: {},
    };
    for (const [code, words] of Object.entries(item.terms)) {
      const dialect = code as DialectCode;
      const fresh = (words ?? []).filter((w) => {
        const key = `${dialect}.${slugify(w)}`;
        if (taken.has(key)) return false;
        taken.add(key);
        return true;
      });
      if (fresh.length) concept.terms[dialect] = [...(concept.terms[dialect] ?? []), ...fresh];
    }
    if (item.registers) concept.registers = { ...concept.registers, ...item.registers };
    if (!target && Object.keys(concept.terms).length) byId.set(concept.id, concept);
  }
  return [...byId.values()];
}

const CONCEPTS = mergeConcepts(HAND_CONCEPTS, IMPORTED_CONCEPTS);

export type Entry = TermDetail & {
  /** Stable id used in URLs and favorites: "DO.a-la-brigandina". */
  id: string;
  dialect: DialectCode;
  text: string;
  meaning: string;
  conceptId: string;
  guide?: GuideId;
  /** Set when the word is vulgar or offensive. */
  register?: Register;
};

export function slugify(text: string): string {
  return normalize(text).replace(/\s+/g, "-");
}

/** Lowercase, no accents, no punctuation, single spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function defaultDefinition(meaning: string, dialect: DialectCode) {
  return `Se usa en ${DIALECTS[dialect].name} para decir «${meaning}».`;
}

function buildEntries(): Map<string, Entry> {
  const entries = new Map<string, Entry>();
  for (const concept of CONCEPTS) {
    for (const [code, words] of Object.entries(concept.terms)) {
      const dialect = code as DialectCode;
      words?.forEach((text, index) => {
        const id = `${dialect}.${slugify(text)}`;
        if (entries.has(id)) return;
        const detail =
          (index === 0 ? concept.details?.[dialect] : undefined) ??
          concept.wordDetails?.[text];
        entries.set(id, {
          id,
          dialect,
          text,
          meaning: concept.meaning,
          conceptId: concept.id,
          guide: concept.guide,
          register: concept.registers?.[text],
          ...detail,
          definition:
            detail?.definition ?? defaultDefinition(concept.meaning, dialect),
        });
      });
    }
  }
  return entries;
}

const ENTRIES = buildEntries();
const CONCEPT_BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));

export function getEntry(id: string): Entry | undefined {
  return ENTRIES.get(id);
}

export function entriesFor(dialect: DialectCode): Entry[] {
  return [...ENTRIES.values()].filter((e) => e.dialect === dialect);
}

/** A dialect's words for a concept, without vulgar or offensive ones. */
function cleanWords(concept: Concept, dialect: DialectCode): string[] {
  return (concept.terms[dialect] ?? []).filter((w) => !concept.registers?.[w]);
}

/** The word a dialect uses for a concept, or the neutral meaning. Never vulgar. */
export function equivalent(
  conceptId: string,
  dialect: DialectCode,
): { text: string; entry?: Entry } {
  const concept = CONCEPT_BY_ID.get(conceptId);
  if (!concept) return { text: "" };
  const first = cleanWords(concept, dialect)[0];
  if (!first) return { text: concept.meaning };
  return { text: first, entry: ENTRIES.get(`${dialect}.${slugify(first)}`) };
}

export type GuideRow = {
  conceptId: string;
  from: { text: string; entry?: Entry; display: string };
  to: { text: string; entry?: Entry; display: string };
};

/** "carajito, carajita, chamaquito" → "carajito(a), chamaquito". */
export function withGender(words: string[]): string {
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const next = words[i + 1];
    if (next && /[oe]$/.test(word) && next === `${word.slice(0, -1)}a`) {
      out.push(`${word}(a)`);
      i++;
    } else {
      out.push(word);
    }
  }
  return out.join(", ");
}

/**
 * Rows of a mini guide between two dialects. Every guide always lists all of
 * its concepts; a country without a word of its own shows the neutral meaning.
 */
export function guideRows(
  guide: GuideId,
  from: DialectCode,
  to: DialectCode,
): GuideRow[] {
  return CONCEPTS.filter((c) => c.guide === guide).map((c) => {
    const toWords = cleanWords(c, to);
    return {
      conceptId: c.id,
      from: {
        ...equivalent(c.id, from),
        display: withGender(cleanWords(c, from).length ? cleanWords(c, from) : [c.meaning]),
      },
      to: {
        ...equivalent(c.id, to),
        display: toWords.length ? withGender(toWords.slice(0, 2)).split(", ")[0] : c.meaning,
      },
    };
  });
}

/** Every entry for search, dialect by dialect. */
export function allEntries(): Entry[] {
  return [...ENTRIES.values()];
}

/** How the other countries say the same thing, for the detail page. */
export function otherWays(
  conceptId: string,
  except: DialectCode,
): { dialect: DialectCode; text: string; id: string }[] {
  const concept = CONCEPT_BY_ID.get(conceptId);
  if (!concept) return [];
  return Object.entries(concept.terms).flatMap(([code, words]) => {
    const dialect = code as DialectCode;
    const first = words?.find((w) => !concept.registers?.[w]);
    if (dialect === except || !first) return [];
    return [{ dialect, text: first, id: `${dialect}.${slugify(first)}` }];
  });
}

/** A word with a story, different each day, the same for everyone. */
export function wordOfTheDay(date: Date): Entry {
  const candidates = [...ENTRIES.values()]
    .filter((e) => e.origin && e.pronunciation)
    .sort((a, b) => a.id.localeCompare(b.id));
  const day = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return candidates[day % candidates.length];
}
