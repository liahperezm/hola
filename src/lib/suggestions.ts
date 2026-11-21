import "server-only";
import { z } from "zod";
import { DIALECT_CODES, DIALECTS } from "./dialects";

/*
 * Suggestions from people in each country. Each one becomes an issue in the
 * GitHub repository named by SUGGESTIONS_GITHUB_REPO ("owner/name"), written
 * with SUGGESTIONS_GITHUB_TOKEN (a fine-grained token with Issues: write on
 * that repository only), labeled "sugerencia". Without those, each one is
 * saved as a private JSON file in the project's Vercel Blob store
 * (BLOB_READ_WRITE_TOKEN, set when the store is connected), under sugerencias/.
 */

export const Suggestion = z.object({
  kind: z.enum(["agregar", "corregir"]),
  country: z.enum(DIALECT_CODES),
  word: z.string().trim().min(1).max(120),
  meaning: z.string().trim().min(1).max(1000),
  example: z.string().trim().max(500).optional().default(""),
  fromThere: z.boolean().optional().default(false),
  /** Where it was sent from: a word page id or "traductor". */
  context: z.string().trim().max(300).optional().default(""),
  /** Left empty by people; bots fill it. */
  website: z.string().max(200).optional(),
});

function githubConfigured(): boolean {
  return Boolean(process.env.SUGGESTIONS_GITHUB_TOKEN && process.env.SUGGESTIONS_GITHUB_REPO);
}

export function configured(): boolean {
  return githubConfigured() || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Files the suggestion where someone will review it. Returns false on failure. */
export async function deliver(s: z.infer<typeof Suggestion>): Promise<boolean> {
  if (githubConfigured()) {
    const { title, body } = issueFor(s);
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
    if (!res?.ok) console.error("Could not file suggestion", res?.status);
    return Boolean(res?.ok);
  }
  try {
    const { put } = await import("@vercel/blob");
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const name = s.word.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const record = {
      receivedAt: now.toISOString(),
      kind: s.kind,
      country: DIALECTS[s.country].name,
      word: s.word,
      meaning: s.meaning,
      example: s.example,
      fromThere: s.fromThere,
      context: s.context,
    };
    await put(`sugerencias/${day}/${now.getTime()}-${name}.json`, JSON.stringify(record, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: true,
    });
    return true;
  } catch (error) {
    console.error("Could not save suggestion", error);
    return false;
  }
}

/** Keeps text from pinging GitHub users or closing issues by keyword. */
function quiet(text: string): string {
  return text.replace(/@/g, "@​").replace(/#(\d)/g, "#​$1");
}

export function issueFor(s: z.infer<typeof Suggestion>) {
  const country = DIALECTS[s.country].name;
  const title = `${s.kind === "agregar" ? "Agregar" : "Corregir"}: ${quiet(s.word)} (${country})`;
  const lines = [
    `**País:** ${country}`,
    `**Palabra o frase:** ${quiet(s.word)}`,
    `**${s.kind === "agregar" ? "Qué significa" : "Qué está mal / cómo es"}:** ${quiet(s.meaning)}`,
    s.example ? `**Ejemplo:** ${quiet(s.example)}` : "",
    `**¿Es de ese país?** ${s.fromThere ? "Sí" : "No lo dijo"}`,
    s.context ? `**Desde:** ${quiet(s.context)}` : "",
    "",
    "_Enviado desde la app Hola._",
  ];
  return { title, body: lines.filter((l) => l !== "").join("\n\n") };
}

