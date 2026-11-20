import type { Metadata } from "next";
import { capitalize } from "@/lib/text";
import { getEntry } from "@/lib/dictionary";
import { Phrase } from "./phrase";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entry = getEntry(decodeURIComponent(id));
  return { title: entry ? capitalize(entry.text) : "Palabra" };
}

export default async function PhrasePage({ params }: Props) {
  const { id } = await params;
  return <Phrase id={decodeURIComponent(id)} />;
}
