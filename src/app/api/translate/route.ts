import { z } from "zod";
import { AiRefusedError, aiAvailable, translateWithAi } from "@/lib/ai";
import { DIALECT_CODES } from "@/lib/dialects";
import { recall, remember, rememberNewWords } from "@/lib/memory";
import type { PhraseEntry } from "@/lib/phrase";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { translateWithDictionary, type Translation } from "@/lib/translate";

const Body = z.object({
  text: z.string().trim().min(1).max(2000),
  from: z.enum(DIALECT_CODES),
  to: z.enum(DIALECT_CODES),
  /** Ask the AI even when the dictionary found something. */
  useAi: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Texto o dialectos no válidos." }, { status: 400 });
  }
  const { text, from, to, useAi } = parsed.data;

  const dictionary = translateWithDictionary(text, from, to);
  const wantsAi = useAi || dictionary.via === "none";
  if (!wantsAi || !aiAvailable() || from === to) {
    return Response.json({
      translation: dictionary,
      entries: [],
      aiAvailable: aiAvailable(),
    });
  }

  // Asked before: the saved answer costs nothing.
  type Answer = { translation: Translation; entries: PhraseEntry[] };
  const question = ["translate", text, from, to];
  const saved = await recall<Answer>("traducir", question);
  if (saved) return Response.json({ ...saved, aiAvailable: true, saved: true });

  if (!allowRequest(clientKey(request))) {
    return Response.json(
      {
        translation: dictionary,
        entries: [],
        aiAvailable: true,
        error: "Llegaste al límite de traducciones con IA por ahora. Intenta más tarde.",
      },
      { status: 429 },
    );
  }

  try {
    const { translation, entries } = await translateWithAi(
      text,
      from,
      to,
      dictionary.pairs,
    );
    await Promise.all([
      remember("traducir", question, { translation, entries }),
      rememberNewWords(
        entries.map((e) => ({ dialect: e.dialect, text: e.text, meaning: e.meaning, en: e.en, sentence: text })),
      ),
    ]);
    return Response.json({ translation, entries, aiAvailable: true });
  } catch (error) {
    if (!(error instanceof AiRefusedError)) console.error("AI translation failed", error);
    return Response.json(
      {
        translation: dictionary,
        entries: [],
        aiAvailable: true,
        error: "La traducción con IA no está disponible ahora. Mostramos el diccionario.",
      },
      { status: 502 },
    );
  }
}

/** Lets the app hide the camera and AI options when no key is set. */
export function GET() {
  return Response.json({ aiAvailable: aiAvailable() });
}
