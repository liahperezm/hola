"use client";

import { useEffect, useState } from "react";
import { DialectSwitcher } from "@/components/dialect-switcher";
import { PageHeader, SectionTitle } from "@/components/ui";
import { useDialectPair } from "@/lib/storage";

export default function Settings() {
  const [pair, setPair] = useDialectPair();
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/translate")
      .then((r) => r.json() as Promise<{ aiAvailable?: boolean }>)
      .then((r) => setAiAvailable(Boolean(r.aiAvailable)))
      .catch(() => setAiAvailable(false));
  }, []);

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-12">
      <PageHeader />
      <h1 className="mx-1 mt-5 text-[32px] font-extrabold tracking-[-0.03em]">Ajustes</h1>

      <SectionTitle>Mis países</SectionTitle>
      <p className="mx-1 mb-3 text-[15px] text-muted">
        El traductor abre con estos países.
      </p>
      <DialectSwitcher value={pair} onChange={setPair} />

      <SectionTitle>Sobre Hola</SectionTitle>
      <div className="space-y-3 rounded-[22px] bg-white px-5 py-5 text-[15px] leading-relaxed text-muted shadow-card">
        <p>Hola traduce entre dialectos del español con un diccionario hecho a mano.</p>
        {aiAvailable !== null && (
          <p>
            {aiAvailable
              ? "Lo que no está en el diccionario, y las fotos, se traducen con IA (Claude). Esas respuestas pueden contener errores."
              : "La traducción con IA y la cámara no están activadas en este servidor."}
          </p>
        )}
        <p>
          Para instalarla, abre el menú de compartir del navegador y elige
          «Agregar a pantalla de inicio».
        </p>
      </div>
    </div>
  );
}
