import { allowRequest, clientKey } from "@/lib/rate-limit";
import { WaitlistSignup, configured, save } from "@/lib/waitlist";

export async function POST(request: Request) {
  const parsed = WaitlistSignup.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Revisa tu correo e intenta otra vez." }, { status: 400 });
  }
  if (parsed.data.website) return Response.json({ ok: true }); // bot
  if (!configured()) {
    return Response.json({ error: "La lista de espera no está activada todavía." }, { status: 503 });
  }
  if (!allowRequest(`waitlist:${clientKey(request)}`, 5)) {
    return Response.json({ error: "Demasiados intentos. Intenta más tarde." }, { status: 429 });
  }
  if (!(await save(parsed.data))) {
    return Response.json({ error: "No pudimos guardarte en la lista. Intenta más tarde." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
