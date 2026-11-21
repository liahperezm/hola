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
  /** Where the origin story comes from. */
  source?: string;
};

type Concept = {
  id: string;
  /** What it means in neutral Spanish. Used when a dialect has no word of its own. */
  meaning: string;
  /** What it means in English, for learners. */
  en?: string;
  /** Which mini guide lists it. Without one it is only in the translator and search. */
  guide?: GuideId;
  /** Local ways to say it. The first is the one a translation uses. */
  terms: Partial<Record<DialectCode, string[]>>;
  /** Extra detail for the first term of a dialect. */
  details?: Partial<Record<DialectCode, TermDetail>>;
  /** Extra detail for any other word, by its text. */
  wordDetails?: Record<string, TermDetail>;
  /** Words that are vulgar or offensive, by their text. Shown with a label. */
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
    en: "hey (to get someone's attention)",
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
    en: "how are you? / what's up?",
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
    en: "really / for real",
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
    en: "a mess, chaos",
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
    en: "to talk nonsense",
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
    en: "kid, child",
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
    en: "cool, great",
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
    en: "money",
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
    en: "party",
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
    en: "a shy, awkward or naive person",
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
    en: "done in a rush, sloppily",
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
    en: "job, work",
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
    en: "computer",
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
    en: "ballpoint pen",
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
    en: "stapler",
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
    en: "cell phone",
    guide: "oficina",
    terms: {
      ES: ["móvil"],
    },
  },

  // Viaje
  {
    id: "autobus",
    meaning: "autobús",
    en: "bus",
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
          "Del portugués de Brasil «bonde» (tranvía). Según la historia popular, los tranvías de Río se financiaron con bonos («bonds» en inglés) y el nombre pasó a los vehículos.",
      },
    },
  },
  {
    id: "carro",
    meaning: "carro",
    en: "car",
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
    en: "ticket",
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
    en: "suitcase",
    guide: "viaje",
    terms: {
      AR: ["valija"],
      UY: ["valija"],
    },
  },
  {
    id: "taxi-compartido",
    meaning: "taxi de ruta compartido",
    en: "shared route taxi",
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
    en: "motorcycle taxi",
    guide: "viaje",
    terms: {
      DO: ["motoconcho"],
    },
  },
  {
    id: "alquilar",
    meaning: "alquilar",
    en: "to rent",
    guide: "viaje",
    terms: {
      MX: ["rentar"],
    },
  },

  // Comida
  {
    id: "banana",
    meaning: "banana",
    en: "banana",
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
    en: "avocado",
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
    en: "corn on the cob",
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
    en: "beans",
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
    en: "strawberry",
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
    en: "popcorn",
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
    en: "peach",
    guide: "comida",
    terms: {
      ES: ["melocotón"],
    },
  },
  {
    id: "jugo",
    meaning: "jugo",
    en: "juice",
    guide: "comida",
    terms: {
      ES: ["zumo"],
    },
  },
  {
    id: "pastel",
    meaning: "pastel",
    en: "cake",
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

/*
 * Origin stories, researched and attached to specific entries: the same
 * spelling can be a different word elsewhere (guagua is a bus in the Caribbean
 * and a baby in Chile). Uncertain origins say so; popular stories are labeled.
 */
const ORIGINS: { ids: string[]; detail: TermDetail }[] = [
  {
    ids: ["DO.guagua", "PR.guagua", "CU.guagua"],
    detail: {
      origin:
        "Su origen se discute. La explicación más citada es el inglés «wagon» (vagón, carreta). La palabra se usaba en Cuba antes de llegar a las Islas Canarias, donde aparece a comienzos del siglo XX. El diccionario de la RAE la da como de etimología discutida.",
      source: "RAE, Diccionario histórico del español de Canarias",
    },
  },
  {
    ids: ["CL.guagua", "PE.guagua"],
    detail: {
      origin:
        "Del quechua «wawa», 'niño pequeño, bebé'. No tiene relación con la guagua (autobús) del Caribe: son dos palabras distintas que se escriben igual.",
      source: "Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["DO.chevere", "CO.chevere", "VE.chevere", "PR.chevere", "PE.chevere", "EC.chevere", "PA.chevere", "CU.chevere"],
    detail: {
      origin:
        "No se sabe con certeza. La explicación más citada es africana: vendría del efik, una lengua de Calabar (en la actual Nigeria), llegada a Cuba con personas esclavizadas y difundida luego por el Caribe. El etnólogo cubano Fernando Ortiz defendió ese origen. Otras teorías, como el automóvil Chevrolet, no se sostienen.",
      source: "Fernando Ortiz; BBC Mundo, «Qué chévere»",
    },
  },
  {
    ids: ["VE.pana", "EC.pana", "PR.pana", "DO.pana", "PA.pana"],
    detail: {
      origin:
        "Origen incierto. Mucha gente cree que viene del inglés «pal» ('compañero'), pero no está documentado.",
      source: "El Tiempo; Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["MX.chamba", "PE.chamba"],
    detail: {
      origin:
        "Se suele contar que nació con los braceros mexicanos que fueron a trabajar a Estados Unidos en los años cuarenta, pero la palabra ya aparece con el sentido de 'trabajo' en el Diccionario de mejicanismos de Félix Ramos y Duarte, de 1895. Su etimología sigue sin resolverse.",
      source: "Félix Ramos y Duarte, Diccionario de mejicanismos (1895)",
    },
  },
  {
    ids: ["VE.chamo"],
    detail: {
      origin:
        "Origen incierto. Se suele relacionar con el inglés «chum» ('amigo'), pero no está documentado.",
    },
  },
  {
    ids: ["AR.pibe", "UY.pibe"],
    detail: {
      origin:
        "Registrada en el Río de la Plata desde 1894. La hipótesis más aceptada es el genovés «pivetto», 'muchacho', traído por la inmigración italiana. El etimólogo Joan Corominas, en cambio, la relacionaba con «pebete».",
      source: "José Gobello; Joan Corominas; Antonio Dellepiane, El idioma del delito (1894)",
    },
  },
  {
    ids: ["AR.birome", "UY.birome", "PY.birome"],
    detail: {
      origin:
        "Del nombre comercial Birome, formado con los apellidos de László Biró, el inventor húngaro radicado en Argentina, y de su socio Juan Jorge Meyne. El bolígrafo salió a la venta en Buenos Aires a mediados de los años cuarenta.",
      source: "RAE, Diccionario histórico de la lengua española",
    },
  },
  {
    ids: ["VE.cotufas"],
    detail: {
      origin:
        "Origen incierto. La historia de que viene del inglés «corn to fry» es popular pero no tiene respaldo: «cotufa» ya existía en el español de España para nombrar un tubérculo, y también se usa en Canarias.",
      source: "Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["MX.elote", "GT.elote", "HN.elote", "SV.elote", "NI.elote", "CR.elote"],
    detail: {
      origin: "Del náhuatl «élotl», 'mazorca tierna de maíz'.",
      source: "Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["MX.popote"],
    detail: {
      origin:
        "Del náhuatl «popotl», el tallo hueco de una planta, que se usaba como pajita.",
      source: "Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["MX.escuincle"],
    detail: {
      origin:
        "Del náhuatl «itzcuintli», 'perro'. Primero nombró al perro sin pelo mexicano (el xoloitzcuintle) y luego, en broma, pasó a los niños.",
      source: "Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["DO.zafacon", "PR.zafacon"],
    detail: {
      origin:
        "Probablemente del inglés, aunque no se sabe de qué palabra: se proponen «safety can» y el lema «save a can» de los contenedores de reciclaje de la Segunda Guerra Mundial. Ninguna está comprobada.",
    },
  },
  {
    ids: ["DO.cocaleca"],
    detail: {
      definition:
        "Palomitas de maíz. Se dice sobre todo en Santo Domingo; en el suroeste del país se les llama «gallitos».",
      example: "Vamos a hacer cocaleca para ver la película.",
      source: "Acento.com.do",
    },
  },
  {
    ids: ["AR.pucho", "UY.pucho", "CL.pucho", "PE.pucho"],
    detail: {
      origin: "Del quechua «puchu», 'sobra, resto': primero fue la colilla del cigarrillo y luego el cigarrillo.",
      source: "Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["AR.anana", "UY.anana", "PY.anana"],
    detail: {
      origin: "Del guaraní «naná», a través del portugués «ananás».",
      source: "Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["PE.canchita"],
    detail: {
      origin: "Diminutivo de «cancha», del quechua «kamcha», 'maíz tostado'.",
      source: "Diccionario de la lengua española (RAE)",
    },
  },
  {
    ids: ["DO.jevi"],
    detail: {
      origin: "Del inglés «heavy», adaptado a la pronunciación dominicana.",
    },
  },
  {
    ids: ["UY.quilombo"],
    detail: {
      origin:
        "Viene del kimbundu «kilombo», que nombraba los asentamientos de personas esclavizadas que escapaban en Brasil. En el Río de la Plata pasó a significar primero un prostíbulo y luego cualquier desorden.",
    },
  },
  {
    ids: ["UY.laburo"],
    detail: {
      origin:
        "Del italiano «lavoro». Entró al lunfardo de Buenos Aires y Montevideo con la inmigración italiana de finales del siglo XIX.",
    },
  },
  {
    ids: ["CL.palta", "PE.palta", "UY.palta", "BO.palta"],
    detail: { origin: "Del quechua «pallta».", source: "Diccionario de la lengua española (RAE)" },
  },
  {
    ids: ["CL.choclo", "PE.choclo", "BO.choclo", "EC.choclo", "UY.choclo"],
    detail: { origin: "Del quechua «choqllo».", source: "Diccionario de la lengua española (RAE)" },
  },
  {
    ids: ["CL.porotos", "UY.porotos", "PY.porotos", "BO.porotos"],
    detail: { origin: "Del quechua «purutu».", source: "Diccionario de la lengua española (RAE)" },
  },
];

const ORIGIN_BY_ID = new Map(
  ORIGINS.flatMap(({ ids, detail }) => ids.map((id) => [id, detail] as const)),
);

/** For tests: origin ids that match no entry. */
export function unknownOriginIds(): string[] {
  return [...ORIGIN_BY_ID.keys()].filter((id) => !ENTRIES.has(id));
}

/** A concept from the imported lexicon (see lexicon/README.md). */
export type ImportedConcept = {
  id: string;
  meaning: string;
  en?: string;
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
      en: item.en,
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
    if (item.en && !concept.en) concept.en = item.en;
    if (!target && Object.keys(concept.terms).length) byId.set(concept.id, concept);
  }
  return [...byId.values()];
}

const CONCEPTS = mergeConcepts(HAND_CONCEPTS, IMPORTED_CONCEPTS);

/*
 * Everyday objects whose plain Spanish word is also translated, so "gasolina"
 * written in Spain becomes "nafta" for Argentina. Only concepts listed here:
 * swapping plain words for slang ("niño" → "pibe") or ambiguous words ("papa",
 * "bebe", "Chile", "manejar un equipo") would change what people mean.
 */
const PLAIN_WORDS: Record<string, string[]> = {
  autobus: ["autobús"],
  carro: ["carro"],
  boleto: ["boleto"],
  maleta: ["maleta"],
  maletero: ["maletero"],
  acera: ["acera"],
  piscina: ["piscina"],
  apartamento: ["apartamento"],
  gasolina: ["gasolina"],
  gasolinera: ["gasolinera"],
  embotellamiento: ["embotellamiento"],
  alquilar: ["alquilar"],
  aguacate: ["aguacate"],
  banana: ["banana"],
  durazno: ["durazno"],
  fresa: ["fresa"],
  frijoles: ["frijoles"],
  "judias-verdes": ["judías verdes"],
  jugo: ["jugo"],
  mantequilla: ["mantequilla"],
  pajita: ["pajita"],
  palomitas: ["palomitas de maíz", "palomitas"],
  pastel: ["pastel"],
  pina: ["piña"],
  sandwich: ["sándwich"],
  "hot-dog": ["hot dog"],
  "cafe-negro": ["café negro"],
  aperitivos: ["aperitivos"],
  boligrafo: ["bolígrafo"],
  celular: ["teléfono celular", "celular"],
  computadora: ["computadora"],
  estampilla: ["estampilla"],
  grapadora: ["grapadora"],
  mochila: ["mochila"],
  camiseta: ["camiseta"],
  refrigerador: ["refrigerador"],
  sueter: ["suéter"],
  lentes: ["lentes"],
  "traje-de-bano": ["traje de baño"],
  "zapatillas-deportivas": ["zapatillas deportivas"],
  chaqueta: ["chaqueta"],
  pavo: ["pavo"],
  mosquito: ["mosquito"],
  basurero: ["basurero"],
  chupete: ["chupete"],
};

export type PlainWord = { conceptId: string; text: string; meaning: string; en?: string };

/** Plain words a dialect writes for things it has no word of its own for. */
export function plainWordsFor(dialect: DialectCode): PlainWord[] {
  return Object.entries(PLAIN_WORDS).flatMap(([conceptId, words]) => {
    const concept = CONCEPTS.find((c) => c.id === conceptId);
    if (!concept || concept.terms[dialect]?.length) return [];
    return words.map((text) => ({ conceptId, text, meaning: concept.meaning, en: concept.en }));
  });
}

/** For tests: concepts in PLAIN_WORDS that the dictionary does not have. */
export function unknownPlainWordConcepts(): string[] {
  return Object.keys(PLAIN_WORDS).filter((id) => !CONCEPTS.some((c) => c.id === id));
}

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
  /** What it means in English. */
  en?: string;
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
        const own =
          (index === 0 ? concept.details?.[dialect] : undefined) ??
          concept.wordDetails?.[text];
        const researched = ORIGIN_BY_ID.get(id);
        const detail = own || researched ? { ...own, ...researched } : undefined;
        entries.set(id, {
          id,
          dialect,
          text,
          meaning: concept.meaning,
          conceptId: concept.id,
          guide: concept.guide,
          register: concept.registers?.[text],
          en: concept.en,
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

/** The word a dialect uses for a concept, or the neutral meaning. */
export function equivalent(
  conceptId: string,
  dialect: DialectCode,
): { text: string; entry?: Entry } {
  const concept = CONCEPT_BY_ID.get(conceptId);
  if (!concept) return { text: "" };
  const first = concept.terms[dialect]?.[0];
  if (!first) return { text: concept.meaning };
  return { text: first, entry: ENTRIES.get(`${dialect}.${slugify(first)}`) };
}

export type GuideRow = {
  conceptId: string;
  /** In English, for learners. */
  en?: string;
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
    const toWords = c.terms[to];
    return {
      conceptId: c.id,
      en: c.en,
      from: {
        ...equivalent(c.id, from),
        display: withGender(c.terms[from] ?? [c.meaning]),
      },
      to: {
        ...equivalent(c.id, to),
        display: toWords ? withGender(toWords.slice(0, 2)).split(", ")[0] : c.meaning,
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
    const first = words?.[0];
    if (dialect === except || !first) return [];
    return [{ dialect, text: first, id: `${dialect}.${slugify(first)}` }];
  });
}

/** Days since 1970 on the reader's own calendar. */
export function dayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

/** Small seeded random generator, so every phone shuffles the same way. */
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const random = seeded(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Words with a story to tell: the pool for the word of the day. With a
 * dialect (learners), that country's words when it has a few of its own.
 */
export function wordOfTheDayPool(dialect?: DialectCode): Entry[] {
  const all = [...ENTRIES.values()]
    .filter((e) => e.origin)
    .sort((a, b) => a.id.localeCompare(b.id));
  const local = dialect ? all.filter((e) => e.dialect === dialect) : [];
  return local.length >= 3 ? local : all;
}

/**
 * A word with a story, different each day and the same for everyone. Each
 * round through the pool is shuffled, and a round never starts with the word
 * that ended the one before.
 */
export function wordOfTheDay(date: Date): Entry {
  return wordForDay(dayNumber(date));
}

export function wordForDay(day: number, dialect?: DialectCode): Entry {
  const pool = wordOfTheDayPool(dialect);
  const round = Math.floor(day / pool.length);
  const order = shuffled(pool, round);
  const previous = shuffled(pool, round - 1);
  if (order[0].id === previous[previous.length - 1].id) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order[day % pool.length];
}

