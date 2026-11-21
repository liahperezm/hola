import { z } from "zod";
import { AiRefusedError, aiAvailable, translateForLearner } from "@/lib/ai";
import { DIALECT_CODES } from "@/lib/dialects";
import { learnWithDictionary } from "@/lib/learn";
import { learnWithService, serviceAvailable } from "@/lib/learn-service";
import { allowRequest, clientKey } from "@/lib/rate-limit";

const Body = z.object({
  text: z.string().trim().min(1).max(500),
  dialect: z.enum(DIALECT_CODES),
  direction: z.enum(["to-spanish", "to-english"]),
});

/*
 * English ⇄ the Spanish of one country (learner mode). By default a free
 * translation service plus Hola's dictionary; LEARNER_ENGINE=ai uses Claude
 * instead when ANTHROPIC_API_KEY is set.
 */
function engine(): "ai" | "service" | null {
  if (process.env.LEARNER_ENGINE === "ai" && aiAvailable()) return "ai";
  if (serviceAvailable()) return "service";
  return aiAvailable() ? "ai" : null;
}

/**
 * Without a query: whether full sentences can be translated, so the app can
 * say so. With ?text=&dialect=&direction=: the same as POST, for sharing a
 * translation as a link.
 */
export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  if (!query.text) return Response.json({ sentences: engine() !== null });
  return translate(request, query);
}

export async function POST(request: Request) {
  return translate(request, await request.json().catch(() => null));
}

async function translate(request: Request, input: unknown) {
  const parsed = Body.safeParse(input);
  if (!parsed.success) {
    return Response.json({ error: "Invalid text or country." }, { status: 400 });
  }
  const { text, dialect, direction } = parsed.data;
  const dictionary = learnWithDictionary(text, dialect, direction);
  const which = engine();

  // A single word the dictionary knows needs no service at all.
  if (dictionary.target.length > 0 || !which) {
    return Response.json({ result: dictionary });
  }
  // Keeps one person from using up the free allowance (or the AI budget).
  if (!allowRequest(`learn:${clientKey(request)}`, which === "ai" ? 20 : 60)) {
    return Response.json(
      { result: dictionary, error: "You've reached the translation limit for now. Try again later." },
      { status: 429 },
    );
  }
  try {
    const result =
      which === "ai"
        ? await translateForLearner(text, dialect, direction)
        : await learnWithService(text, dialect, direction);
    return Response.json({ result });
  } catch (error) {
    if (!(error instanceof AiRefusedError)) console.error("Learner translation failed", error);
    return Response.json(
      { result: dictionary, error: "Translation isn't available right now. Here are the words we know." },
      { status: 502 },
    );
  }
}
