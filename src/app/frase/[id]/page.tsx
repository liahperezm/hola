import { Phrase } from "./phrase";

export default async function PhrasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Phrase id={decodeURIComponent(id)} />;
}
