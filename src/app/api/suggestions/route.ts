import { allowRequest, clientKey } from "@/lib/rate-limit";
import { Suggestion, configured, issueFor } from "@/lib/suggestions";

export async function POST(request: Request) {
  const parsed = Suggestion.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Revisa los campos e intenta otra vez." }, { status: 400 });
  }
  if (parsed.data.website) return Response.json({ ok: true }); // bot
  if (!configured()) {
    return Response.json({ error: "Las sugerencias no están activadas todavía." }, { status: 503 });
  }
  if (!allowRequest(`suggest:${clientKey(request)}`, 10)) {
    return Response.json(
      { error: "Enviaste muchas sugerencias seguidas. Intenta más tarde." },
      { status: 429 },
    );
  }

  const { title, body } = issueFor(parsed.data);
  const res = await fetch(
    `https://api.github.com/repos/${process.env.SUGGESTIONS_GITHUB_REPO}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.SUGGESTIONS_GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, labels: ["sugerencia"] }),
    },
  ).catch(() => null);

  if (!res?.ok) {
    console.error("Could not file suggestion", res?.status, await res?.text().catch(() => ""));
    return Response.json({ error: "No pudimos enviar tu sugerencia. Intenta más tarde." }, { status: 502 });
  }
  return Response.json({ ok: true });
}

/** Lets the app show the form only when suggestions can be delivered. */
export function GET() {
  return Response.json({ enabled: configured() });
}
