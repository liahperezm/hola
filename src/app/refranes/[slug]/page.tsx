import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { capitalize } from "@/lib/text";
import { allSayings, getSaying, sayingSlug } from "@/lib/sayings";
import { SayingView } from "./saying";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allSayings().map((s) => ({ slug: sayingSlug(s) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const saying = getSaying((await params).slug);
  return { title: saying ? capitalize(saying.text) : "Refrán" };
}

export default async function SayingPage({ params }: Props) {
  const slug = (await params).slug;
  if (!getSaying(slug)) notFound();
  return <SayingView slug={slug} />;
}
