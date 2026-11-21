"use client";

import { useUiLanguage } from "@/lib/i18n";
import { useDialectPair, useHydrated, useSeen } from "@/lib/storage";
import { LearnerTranslator } from "./learner-translator";
import { Translator } from "./translator";
import { Welcome } from "./welcome";

export default function Home() {
  const hydrated = useHydrated();
  const welcome = useSeen("welcome");
  const [, setPair] = useDialectPair();
  const [language] = useUiLanguage();

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
  // Learners translate English ⇄ the Spanish they are learning.
  return language === "en" ? <LearnerTranslator /> : <Translator />;
}
