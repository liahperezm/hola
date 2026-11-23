import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { DIALECTS, type DialectCode } from "./dialects";
import { getEntry, slugify } from "./dictionary";
import { dictionaryHints, type LearnDirection, type LearnResult, type LearnWord } from "./learn";
import type { LanguageCode } from "./languages";
import { findFalseFriends } from "./false-friends";
import type { PhraseEntry } from "./phrase";
import type { Segment, TermPair, Translation } from "./translate";

/*
 * AI_MODEL picks the model: claude-haiku-5-5 (default, cheapest),
 * claude-sonnet-5-5, or claude-opus-5-5. Sonnet and Opus fall back to another
 * model when they decline; Haiku has no fallback, so a decline shows the
 * dictionary's words instead.
 */
const MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"] as const;

export function aiModel(): (typeof MODELS)[number] {
  const chosen = process.env.AI_MODEL;
  return MODELS.find((m) => m === chosen) ?? "claude-haiku-5-5";
}

function modelSettings() {
  const model = aiModel();
  return model === "claude-haiku-5-5"
    ? { model }
    : { model, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
}

/** The key as pasted into the host's settings, without stray spaces or quotes. */
function apiKey(): string {
  return (process.env.ANTHROPIC_API_KEY ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

export function aiAvailable(): boolean {
  return apiKey() !== "";
}

let client: Anthropic | undefined;
function getClient(): Anthropic {
  client ??= new Anthropic({ apiKey: apiKey() });
  return client;
}

export class AiRefusedError extends Error {}

const AiTranslationSchema = z.object({
  translation: z.string(),
  terms: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      meaning: z.string(),
      definition: z.string(),
      pronunciation: z.string(),
      example: z.string(),
      origin: z.string(),
    }),
  ),
});

const TRANSLATE_SYSTEM = `Eres el traductor de Hola, una app que traduce entre dialectos del español.
Recibes un texto escrito como lo diría alguien de un país y lo reescribes como lo diría alguien del otro país.

Reglas:
- Cambia solo lo regional: palabras, expresiones, modismos y, si hace falta, el voseo o la conjugación propia del país de destino. No cambies el sentido, el tono ni el registro.
- Si el texto no tiene nada regional, devuélvelo igual y deja "terms" vacío.
- En "terms" pon cada palabra o expresión regional que cambiaste: "source" tal como aparece en el texto original, "target" tal como aparece en tu traducción.
- "meaning": qué significa en español neutro, en pocas palabras.
- "definition": una o dos frases que expliquen el uso en el país de origen.
- "pronunciation": guía de pronunciación en sílabas al estilo inglés, con la sílaba tónica en mayúsculas (ej. "pah-ree-GWAH-yoh").
- "example": una frase corta de ejemplo en el dialecto de origen.
- "origin": de dónde viene la palabra, solo si lo sabes con seguridad; si no, cadena vacía. Nunca inventes historias.
- Todo en español.`;

export function locate(text: string, phrases: string[]): Segment[] {
  const lower = text.toLowerCase();
  const spans: { start: number; end: number }[] = [];
  for (const phrase of phrases) {
    const needle = phrase.toLowerCase().trim();
    if (!needle) continue;
    let from = 0;
    while (true) {
      const start = lower.indexOf(needle, from);
      if (start === -1) break;
      const end = start + needle.length;
      if (!spans.some((s) => start < s.end && end > s.start)) {
        spans.push({ start, end });
      }
      from = end;
    }
  }
  spans.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) segments.push({ text: text.slice(cursor, span.start) });
    segments.push({ text: text.slice(span.start, span.end), highlight: true });
    cursor = span.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export async function translateWithAi(
  text: string,
  from: DialectCode,
  to: DialectCode,
  hints: TermPair[],
): Promise<{ translation: Translation; entries: PhraseEntry[] }> {
  const hintLines = hints.map(
    (h) => `- «${h.from.text}» → «${h.to.text}» (${h.meaning})`,
  );
  const prompt = [
    `De: ${DIALECTS[from].name}`,
    `A: ${DIALECTS[to].name}`,
    hintLines.length
      ? `Equivalencias del diccionario de Hola que debes respetar:\n${hintLines.join("\n")}`
      : "",
    `Texto:\n${text}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await getClient().beta.messages.parse({
    ...modelSettings(),
    max_tokens: 8000,
    output_config: {
      effort: "low",
      format: betaZodOutputFormat(AiTranslationSchema),
    },
    system: TRANSLATE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") throw new AiRefusedError();
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("The model returned no translation");

  const entries: PhraseEntry[] = parsed.terms.map((term) => ({
    id: `ai.${from}.${slugify(term.source)}`,
    dialect: from,
    text: term.source,
    meaning: term.meaning,
    definition: term.definition,
    pronunciation: term.pronunciation || undefined,
    example: term.example || undefined,
    origin: term.origin || undefined,
  }));

  return {
    translation: {
      from,
      to,
      source: locate(text, parsed.terms.map((t) => t.source)),
      target: locate(parsed.translation, parsed.terms.map((t) => t.target)),
      pairs: parsed.terms.map((term, i) => ({
        from: { text: term.source, id: entries[i].id },
        to: { text: term.target },
        meaning: term.meaning,
      })),
      warnings: findFalseFriends(text, from, to),
      via: "ai",
    },
    entries,
  };
}

const PhotoTextSchema = z.object({ text: z.string() });

export type PhotoMediaType = "image/jpeg" | "image/png" | "image/webp";

export async function readPhoto(
  base64: string,
  mediaType: PhotoMediaType,
): Promise<string> {
  const response = await getClient().beta.messages.parse({
    ...modelSettings(),
    max_tokens: 8000,
    output_config: {
      effort: "low",
      format: betaZodOutputFormat(PhotoTextSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: "Transcribe el texto en español que aparece en esta foto (un menú, un letrero, un mensaje…), tal como está escrito, respetando los saltos de línea. Si no hay texto, devuelve una cadena vacía.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new AiRefusedError();
  return response.parsed_output?.text.trim() ?? "";
}

const LANGUAGE_NAMES_ES: Record<LanguageCode, string> = {
  en: "inglés", pt: "portugués", fr: "francés", de: "alemán", it: "italiano",
  ht: "criollo haitiano", zh: "chino", ja: "japonés", ko: "coreano", ar: "árabe",
};

const LearnerSchema = z.object({
  translation: z.string(),
  words: z.array(
    z.object({
      spanish: z.string(),
      english: z.string(),
      pronunciation: z.string(),
    }),
  ),
});

function learnerSystem(
  country: string,
  direction: LearnDirection,
  hints: string[],
  language: string,
): string {
  const task =
    direction === "to-spanish"
      ? `Traduces del ${language} al español tal como se habla en ${country}: natural, cotidiano, como lo diría una persona de allí. Usa el vocabulario regional de ${country} cuando sea lo natural (por ejemplo, la palabra local para «bus» o «popcorn»), y su forma de tratar a la gente (tú, vos o usted) según lo que se usa allí.`
      : `Traduces al ${language} un texto en español escrito como se habla en ${country}. Entiende el vocabulario regional de ${country} y tradúcelo por su significado, de forma natural.`;
  return `${task}

Reglas:
- "translation": solo la traducción, sin comillas ni notas.
- "words": las palabras o expresiones regionales o propias de ${country} que aparecen en el texto en español (la traducción o el original), las que un estudiante de inglés querría aprender. "spanish" tal como aparece, "english" su significado en ${language}, "pronunciation" una guía en sílabas al estilo inglés con la sílaba tónica en mayúsculas (ej. "GWAH-gwah"). Si no hay nada regional, deja la lista vacía.
- No agregues groserías que no estén en el original.

Palabras de ${country} del diccionario de Hola (inglés → ${country}); úsalas cuando correspondan:
${hints.join("\n")}`;
}

/** English ⇄ the Spanish of one country, for learners. */
export async function translateForLearner(
  text: string,
  dialect: DialectCode,
  direction: LearnDirection,
  language: LanguageCode = "en",
): Promise<LearnResult> {
  const country = DIALECTS[dialect].name;
  const response = await getClient().beta.messages.parse({
    ...modelSettings(),
    max_tokens: 8000,
    output_config: { effort: "low", format: betaZodOutputFormat(LearnerSchema) },
    system: learnerSystem(country, direction, dictionaryHints(dialect), LANGUAGE_NAMES_ES[language]),
    messages: [{ role: "user", content: text }],
  });
  if (response.stop_reason === "refusal") throw new AiRefusedError();
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("The model returned no translation");

  // Link words Hola has a page for.
  const words: LearnWord[] = parsed.words.map((w) => {
    const entry = getEntry(`${dialect}.${slugify(w.spanish)}`);
    return {
      spanish: w.spanish,
      english: w.english,
      pronunciation: entry?.pronunciation ?? (w.pronunciation || undefined),
      id: entry?.id,
    };
  });
  const target =
    direction === "to-spanish"
      ? locate(parsed.translation, words.map((w) => w.spanish))
      : [{ text: parsed.translation }];
  return { direction, dialect, language, source: text, target, words, via: "ai" };
}

const DetailsSchema = z.object({
  pronunciation: z.string(),
  example: z.string(),
  antonyms: z.array(z.string()),
});

export type WordDetails = z.infer<typeof DetailsSchema>;

/**
 * An example sentence, opposites and a pronunciation guide for a dictionary
 * word that has none yet. Asked once per word; the answer is saved.
 */
export async function describeWord(
  text: string,
  dialect: DialectCode,
  meaning: string,
): Promise<WordDetails> {
  const country = DIALECTS[dialect].name;
  const response = await getClient().beta.messages.parse({
    ...modelSettings(),
    max_tokens: 2000,
    output_config: { effort: "low", format: betaZodOutputFormat(DetailsSchema) },
    system: [
      "Eres lexicógrafo del español de cada país. Para una palabra o expresión regional das:",
      "- example: una frase corta y natural, como la diría alguien de ese país en la vida diaria, que use la palabra tal cual.",
      "- antonyms: hasta tres palabras o expresiones de sentido contrario que se usen en ese país; ninguna si no tiene sentido hablar de contrario.",
      "- pronunciation: cómo se pronuncia, en sílabas al estilo inglés separadas por guiones, con la sílaba tónica en mayúsculas (ej.: GWAH-gwah, ah lah bree-gahn-DEE-nah).",
      "Si la palabra es vulgar u ofensiva, el ejemplo la usa igual: es un diccionario.",
    ].join("\n"),
    messages: [{ role: "user", content: `País: ${country}\nPalabra: ${text}\nSignifica: ${meaning}` }],
  });
  if (response.stop_reason === "refusal") throw new AiRefusedError();
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("The model returned no details");
  return { ...parsed, antonyms: parsed.antonyms.slice(0, 3) };
}
