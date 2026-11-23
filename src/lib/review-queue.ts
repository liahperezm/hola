import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { DIALECT_CODES } from "./dialects";
import { normalize } from "./dictionary";
import { LANGUAGE_CODES } from "./languages";

/*
 * Phrases Hola couldn't translate on its own (nothing in the dictionary, or
 * the AI or the translation service had to step in), kept for review so the
 * dictionary learns from real use. Saved without anything about the person:
 * no account, no IP, numbers and email addresses blanked out. One file per
 * phrase and day, in the private Blob store under revisar/<day>/.
 */

export const ReviewItem = z.object({
  text: z.string().trim().min(1).max(300),
  from: z.enum([...DIALECT_CODES, ...LANGUAGE_CODES]),
  to: z.enum([...DIALECT_CODES, ...LANGUAGE_CODES]),
  /** What happened: nothing found, or who translated it. */
  outcome: z.enum(["sin-resultado", "ia", "servicio"]),
});

export type ReviewItem = z.infer<typeof ReviewItem>;

/** Numbers and email addresses say nothing about Spanish; leave them out. */
export function anonymize(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[correo]")
    .replace(/\d[\d\s-]{3,}\d/g, "[número]");
}

export async function saveForReview(item: ReviewItem): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const text = anonymize(item.text);
  const day = new Date().toISOString().slice(0, 10);
  const key = createHash("sha256").update(`${item.from}|${item.to}|${normalize(text)}`).digest("hex").slice(0, 24);
  try {
    const { put } = await import("@vercel/blob");
    await put(
      `revisar/${day}/${key}.json`,
      JSON.stringify({ ...item, text, day }, null, 2),
      { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true },
    );
  } catch (error) {
    console.error("Could not save a phrase for review", error);
  }
}
