import "server-only";
import { z } from "zod";
import { DIALECT_CODES, DIALECTS } from "./dialects";

/*
 * Suggestions from people in each country. Each one becomes an issue in the
 * GitHub repository named by SUGGESTIONS_GITHUB_REPO ("owner/name"), written
 * with SUGGESTIONS_GITHUB_TOKEN (a fine-grained token with Issues: write on
 * that repository only), labeled "sugerencia".
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

export function configured(): boolean {
  return Boolean(process.env.SUGGESTIONS_GITHUB_TOKEN && process.env.SUGGESTIONS_GITHUB_REPO);
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

