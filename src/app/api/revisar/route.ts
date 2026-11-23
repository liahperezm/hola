import { allowRequest, clientKey } from "@/lib/rate-limit";
import { ReviewItem, saveForReview } from "@/lib/review-queue";

/** The app reports a phrase the dictionary couldn't translate (no AI asked). */
export async function POST(request: Request) {
  const parsed = ReviewItem.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Frase no válida." }, { status: 400 });
  if (!allowRequest(`revisar:${clientKey(request)}`, 60)) return Response.json({ ok: true });
  await saveForReview(parsed.data);
  return Response.json({ ok: true });
}
