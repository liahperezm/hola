"use client";

import { useDialectPair, useHydrated, useSeen } from "@/lib/storage";
import { Translator } from "./translator";
import { Welcome } from "./welcome";

export default function Home() {
  const hydrated = useHydrated();
  const welcome = useSeen("welcome");
  const [, setPair] = useDialectPair();

  // Returning visitors get the translator straight away; only someone who has
  // never finished the welcome sees it.
  if (hydrated && !welcome.seen) {
    return (
      <Welcome
        onDone={(pair) => {
          setPair(pair);
          welcome.markSeen();
        }}
      />
    );
  }
  return <Translator />;
}
