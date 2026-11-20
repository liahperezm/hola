import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES } from "@/lib/dictionary";
import { Guide } from "./guide";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const guide = GUIDES.find((g) => g.id === id);
  return { title: guide ? `Guía: ${guide.title}` : "Guía" };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const guide = GUIDES.find((g) => g.id === id);
  if (!guide) notFound();
  return (
    <Guide
      id={guide.id}
      title={guide.title}
      emoji={guide.emoji}
      subtitle={guide.subtitle}
    />
  );
}
