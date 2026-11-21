import { z } from "zod";
import { AiRefusedError, aiAvailable, translateForLearner } from "@/lib/ai";
import { DIALECT_CODES } from "@/lib/dialects";
import { learnWithDictionary } from "@/lib/learn";
import { allowRequest, clientKey } from "@/lib/rate-limit";

const Body = z.object({
  text: z.string().trim().min(1).max(500),
  dialect: z.enum(DIALECT_CODES),
  direction: z.enum(["to-spanish", "to-english"]),
});

/** English ⇄ the Spanish of one country (learner mode). */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid text or country." }, { status: 400 });
  }
  const { text, dialect, direction } = parsed.data;
  const dictionary = learnWithDictionary(text, dialect, direction);
  const exact = dictionary.target.length > 0;

  if (exact || !aiAvailable()) {
    return Response.json({ result: dictionary, aiAvailable: aiAvailable() });
  }
  if (!allowRequest(`learn:${clientKey(request)}`)) {
    return Response.json(
      { result: dictionary, aiAvailable: true, error: "You've reached the translation limit for now. Try again later." },
      { status: 429 },
    );
  }
  try {
    const result = await translateForLearner(text, dialect, direction);
    return Response.json({ result, aiAvailable: true });
  } catch (error) {
    if (!(error instanceof AiRefusedError)) console.error("Learner translation failed", error);
    return Response.json(
      { result: dictionary, aiAvailable: true, error: "Translation isn't available right now." },
      { status: 502 },
    );
  }
}
