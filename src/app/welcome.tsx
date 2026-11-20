"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CountryList } from "@/components/dialect-switcher";
import { Logo } from "@/components/logo";
import type { DialectCode } from "@/lib/dialects";
import type { DialectPair } from "@/lib/storage";

type Step = "hola" | "from" | "to";

/** First run: a welcome, then the two countries the translator opens with. */
export function Welcome({ onDone }: { onDone: (pair: DialectPair) => void }) {
  const [step, setStep] = useState<Step>("hola");
  const [from, setFrom] = useState<DialectCode | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Each step replaces the screen, so move focus to its heading.
  useEffect(() => {
    if (step !== "hola") heading.current?.focus();
  }, [step]);

  if (step === "hola") {
    return (
      <main className="flex min-h-dvh flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),2rem)]">
        <div className="flex flex-1 flex-col justify-center">
          <Logo className="h-16 self-start" />
          <h1 className="mt-8 text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em]">
            Traduce entre los dialectos del español
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-body">
            Del <b>carajito</b> dominicano al <b>pibe</b> argentino: entiende y hazte
            entender en cualquier país.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStep("from")}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-navy text-[16px] font-bold text-white"
        >
          Empezar
          <ArrowRight className="size-5" />
        </button>
      </main>
    );
  }

  const isFrom = step === "from";
  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-10">
      <div className="flex h-12 items-center justify-between">
        <button
          type="button"
          aria-label="Atrás"
          onClick={() => setStep(isFrom ? "hola" : "from")}
          className="grid size-10 place-items-center rounded-full bg-white shadow-card"
        >
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-[13.5px] font-semibold text-muted">
          Paso {isFrom ? 1 : 2} de 2
        </p>
      </div>
      <h1
        ref={heading}
        tabIndex={-1}
        className="mx-1 mt-6 text-[30px] leading-tight font-extrabold tracking-[-0.03em] focus:outline-none"
      >
        {isFrom ? "¿De dónde es tu español?" : "¿Con quién quieres hablar?"}
      </h1>
      <p className="mx-1 mt-2 mb-5 text-[15.5px] text-muted">
        {isFrom
          ? "Traduciremos desde tu forma de hablar."
          : "Elige el país de la persona o del lugar. Puedes cambiarlo cuando quieras."}
      </p>
      <div className="rounded-[22px] bg-white px-2 py-1 shadow-card">
        <CountryList
          key={step}
          selected={isFrom ? (from ?? undefined) : undefined}
          exclude={isFrom ? undefined : (from ?? undefined)}
          onChoose={(code) => {
            if (isFrom) {
              setFrom(code);
              setStep("to");
            } else if (from) {
              onDone({ from, to: code });
            }
          }}
        />
      </div>
    </main>
  );
}
