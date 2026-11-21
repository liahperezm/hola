"use client";

import { useDialectPair, useHydrated, useOtherLanguage, useSeen } from "@/lib/storage";
import { LearnerTranslator } from "./learner-translator";
import { Translator } from "./translator";
import { Welcome } from "./welcome";

export default function Home() {
  const hydrated = useHydrated();
  const welcome = useSeen("welcome");
  const [, setPair] = useDialectPair();
  const [other] = useOtherLanguage();

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
  // Another language on one side goes through a translation service; Spanish
  // dialect to Spanish dialect through the dictionary.
  return other ? <LearnerTranslator /> : <Translator />;
}
