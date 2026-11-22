import "server-only";

/*
 * Machine translation between another language and standard Spanish, for the learner
 * mode. Hola's dictionary then makes the Spanish local (see learn-service.ts).
 *
 * The service is picked by which key is set:
 *   DEEPL_API_KEY                                  DeepL (free plan: 500,000 characters a month)
 *   AZURE_TRANSLATOR_KEY + AZURE_TRANSLATOR_REGION Microsoft Translator (free: 2 million a month)
 *   neither                                        MyMemory, no key needed (about 5,000 a day;
 *                                                  50,000 with MYMEMORY_EMAIL set)
 * Set MACHINE_TRANSLATION=off to turn it off.
 */

/** "es" or one of the languages in languages.ts. */
export type Lang = string;
export type MtProvider = "deepl" | "azure" | "mymemory";

export const PROVIDER_NAMES: Record<MtProvider, string> = {
  deepl: "DeepL",
  azure: "Microsoft Translator",
  mymemory: "MyMemory",
};

export function mtProvider(): MtProvider | null {
  if (process.env.MACHINE_TRANSLATION === "off") return null;
  if (process.env.DEEPL_API_KEY) return "deepl";
  if (process.env.AZURE_TRANSLATOR_KEY && process.env.AZURE_TRANSLATOR_REGION) return "azure";
  return "mymemory";
}

export class MachineTranslationError extends Error {}

// Recent results, so the same phrase doesn't use the free allowance twice.
const cache = new Map<string, string>();
const CACHE_SIZE = 500;

export async function machineTranslate(text: string, from: Lang, to: Lang): Promise<string> {
  const provider = mtProvider();
  if (!provider) throw new MachineTranslationError("Machine translation is off");
  const key = `${provider}:${from}:${to}:${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  // The free service takes about 500 characters at a time: longer text goes
  // in pieces, split between sentences.
  const pieces = splitForService(text);
  const parts: string[] = [];
  for (const piece of pieces) {
    parts.push(piece.text.trim() ? await TRANSLATORS[provider](piece.text, from, to) : piece.text);
    parts.push(piece.after);
  }
  const result = parts.join("");
  if (!result.trim()) throw new MachineTranslationError("Empty translation");
  cache.set(key, result);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  return result;
}

async function call(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!res?.ok) throw new MachineTranslationError(`Translation service answered ${res?.status ?? "nothing"}`);
  return res.json();
}

// DeepL wants a regional variant for some target languages.
const DEEPL_TARGET: Record<string, string> = { en: "EN-US", pt: "PT-BR", zh: "ZH-HANS" };
// Microsoft and MyMemory codes that differ from ours.
const AZURE_CODE: Record<string, string> = { zh: "zh-Hans" };
const MYMEMORY_CODE: Record<string, string> = { zh: "zh-CN" };

const TRANSLATORS: Record<MtProvider, (text: string, from: Lang, to: Lang) => Promise<string>> = {
  async deepl(text, from, to) {
    const apiKey = process.env.DEEPL_API_KEY ?? "";
    const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
    const body = (await call(`https://${host}/v2/translate`, {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: [text],
        source_lang: from.toUpperCase(),
        target_lang: DEEPL_TARGET[to] ?? to.toUpperCase(),
      }),
    })) as { translations?: { text?: string }[] };
    return body.translations?.[0]?.text ?? "";
  },

  async azure(text, from, to) {
    const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${AZURE_CODE[from] ?? from}&to=${AZURE_CODE[to] ?? to}`;
    const body = (await call(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY ?? "",
        "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ Text: text }]),
    })) as { translations?: { text?: string }[] }[];
    return body[0]?.translations?.[0]?.text ?? "";
  },

  async mymemory(text, from, to) {
    const params = new URLSearchParams({
      q: text,
      langpair: `${MYMEMORY_CODE[from] ?? from}|${MYMEMORY_CODE[to] ?? to}`,
    });
    if (process.env.MYMEMORY_EMAIL) params.set("de", process.env.MYMEMORY_EMAIL);
    const body = (await call(`https://api.mymemory.translated.net/get?${params}`)) as {
      responseStatus?: number | string;
      responseData?: { translatedText?: string };
    };
    if (Number(body.responseStatus) !== 200) {
      throw new MachineTranslationError(`MyMemory answered ${body.responseStatus}`);
    }
    return body.responseData?.translatedText ?? "";
  },
};

/** MyMemory takes 500 bytes at a time (accents and other alphabets take more than one). */
const PIECE = 480;
const encoder = new TextEncoder();
const size = (text: string) => encoder.encode(text).length;

/** Longest start of `text` that fits in `limit` bytes, ending between words when it can. */
function fit(text: string, limit: number): number {
  let end = text.length;
  while (end > 1 && size(text.slice(0, end)) > limit) end = Math.floor(end * 0.9);
  const space = text.lastIndexOf(" ", end);
  return space > end / 2 ? space + 1 : end;
}

/** Text in pieces of at most PIECE bytes, each with the spacing after it. */
export function splitForService(text: string): { text: string; after: string }[] {
  const sentences = text.match(/[^.!?。！？\n]+(?:[.!?。！？]+|$)|\n+/gu) ?? [text];
  const pieces: { text: string; after: string }[] = [];
  let current = "";
  const flush = () => {
    if (!current) return;
    const trimmed = current.trimEnd();
    pieces.push({ text: trimmed, after: current.slice(trimmed.length) });
    current = "";
  };
  for (const sentence of sentences) {
    if (size(current + sentence) > PIECE) flush();
    // A single sentence longer than a piece is cut between words.
    let rest = sentence;
    while (size(rest) > PIECE) {
      const cut = fit(rest, PIECE);
      current = rest.slice(0, cut);
      flush();
      rest = rest.slice(cut);
    }
    current += rest;
  }
  flush();
  return pieces;
}
