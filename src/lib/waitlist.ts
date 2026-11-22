import "server-only";
import { z } from "zod";

/*
 * The Hola Plus waitlist, until payments are connected. Each sign-up is a
 * private JSON file in the project's Vercel Blob store, under waitlist/.
 * The email is only used to say when Plus is ready.
 */

export const WaitlistSignup = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  plan: z.enum(["monthly", "yearly"]),
  language: z.enum(["es", "en"]).optional().default("es"),
  /** Left empty by people; bots fill it. */
  website: z.string().max(200).optional(),
});

export function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function save(s: z.infer<typeof WaitlistSignup>): Promise<boolean> {
  try {
    const { put } = await import("@vercel/blob");
    const now = new Date();
    const record = { receivedAt: now.toISOString(), email: s.email, plan: s.plan, language: s.language };
    await put(`waitlist/${now.toISOString().slice(0, 10)}/${now.getTime()}.json`, JSON.stringify(record, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: true,
    });
    return true;
  } catch (error) {
    console.error("Could not save waitlist sign-up", error);
    return false;
  }
}
