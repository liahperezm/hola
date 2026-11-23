import "server-only";
import { createHash } from "node:crypto";
import type { DialectCode } from "./dialects";
import { normalize } from "./dictionary";

/*
 * What Hola has already paid the AI for, kept in the project's private Vercel
 * Blob store (BLOB_READ_WRITE_TOKEN), so each answer is paid for once:
 *
 *   memoria/<kind>/<hash>.json   an answer, found again by the same question
 *   aprendido/<country>/<word>.json   a regional word the AI found that the
 *                                     dictionary doesn't have yet, to review
 *                                     and add to the lexicon
 *
 * Without a store, nothing is kept and everything still works.
 */

function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** The same question however it is typed: case, spacing and accents aside. */
function pathFor(kind: string, question: (string | undefined)[]): string {
  const key = question.map((part) => normalize(part ?? "")).join("|");
  return `memoria/${kind}/${createHash("sha256").update(key).digest("hex").slice(0, 40)}.json`;
}

export async function recall<T>(kind: string, question: (string | undefined)[]): Promise<T | null> {
  if (!configured()) return null;
  try {
    const { get } = await import("@vercel/blob");
    const found = await get(pathFor(kind, question), { access: "private" });
    if (!found?.stream) return null;
    return (await new Response(found.stream).json()) as T;
  } catch {
    return null;
  }
}

export async function remember(kind: string, question: (string | undefined)[], answer: unknown) {
  if (!configured()) return;
  try {
    const { put } = await import("@vercel/blob");
    await put(pathFor(kind, question), JSON.stringify(answer), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (error) {
    console.error("Could not remember an answer", error);
  }
}

export type LearnedWord = {
  dialect: DialectCode;
  text: string;
  meaning?: string;
  en?: string;
  /** The sentence it was found in. */
  sentence: string;
};

/** Regional words the AI found, kept for review before joining the dictionary. */
export async function rememberNewWords(words: LearnedWord[]) {
  if (!configured() || words.length === 0) return;
  const { put } = await import("@vercel/blob");
  await Promise.all(
    words.map((word) =>
      put(
        `aprendido/${word.dialect}/${normalize(word.text).replace(/\s+/g, "-").slice(0, 60)}.json`,
        JSON.stringify({ ...word, foundAt: new Date().toISOString() }, null, 2),
        { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true },
      ).catch(() => null),
    ),
  );
}
