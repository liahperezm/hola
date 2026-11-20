import { z } from "zod";
import { AiRefusedError, aiAvailable, readPhoto } from "@/lib/ai";
import { allowRequest, clientKey } from "@/lib/rate-limit";

// About 3 MB of base64; the browser shrinks photos well below this.
const MAX_BASE64 = 4_000_000;

const Body = z.object({
  image: z.string().min(1).max(MAX_BASE64),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export async function POST(request: Request) {
  if (!aiAvailable()) {
    return Response.json(
      { error: "Leer fotos necesita la IA, que no está configurada." },
      { status: 503 },
    );
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "La foto no es válida." }, { status: 400 });
  }
  if (!allowRequest(clientKey(request))) {
    return Response.json(
      { error: "Llegaste al límite de fotos por ahora. Intenta más tarde." },
      { status: 429 },
    );
  }
  try {
    const text = await readPhoto(parsed.data.image, parsed.data.mediaType);
    if (!text) {
      return Response.json({ error: "No encontramos texto en la foto." }, { status: 422 });
    }
    return Response.json({ text });
  } catch (error) {
    if (!(error instanceof AiRefusedError)) console.error("Reading photo failed", error);
    return Response.json({ error: "No pudimos leer la foto." }, { status: 502 });
  }
}
