import { AiRefusedError, aiAvailable, describeWord, type WordDetails } from "@/lib/ai";
import { conceptMeaning, getEntry } from "@/lib/dictionary";
import { recall, remember } from "@/lib/memory";
import { allowRequest, clientKey } from "@/lib/rate-limit";

/**
 * GET ?id=DO.guagua: an example, opposites and a pronunciation for a word
 * whose entry lacks them. Each word is asked of the AI once, then saved.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const entry = getEntry(id);
  if (!entry) return Response.json({ error: "No encontramos esta palabra." }, { status: 404 });
  if (entry.example && entry.antonyms && entry.pronunciation) return Response.json({ details: null });

  const saved = await recall<WordDetails>("detalles", [id]);
  if (saved) return Response.json({ details: saved });
  if (!aiAvailable()) return Response.json({ details: null });
  if (!allowRequest(`details:${clientKey(request)}`, 60)) {
    return Response.json({ details: null }, { status: 429 });
  }
  try {
    const details = await describeWord(entry.text, entry.dialect, conceptMeaning(entry.conceptId) ?? entry.meaning);
    await remember("detalles", [id], details);
    return Response.json({ details });
  } catch (error) {
    if (!(error instanceof AiRefusedError)) console.error("Word details failed", error);
    return Response.json({ details: null }, { status: 502 });
  }
}
