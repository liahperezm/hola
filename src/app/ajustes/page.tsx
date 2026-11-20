"use client";

import { useEffect, useState } from "react";
import { DialectSwitcher } from "@/components/dialect-switcher";
import { SectionLabel, TitleBar } from "@/components/ui";
import { useDialectPair, useFavorites } from "@/lib/storage";

export default function Settings() {
  const [pair, setPair] = useDialectPair();
  const { favorites, clear } = useFavorites();
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetch("/api/translate")
      .then((r) => r.json() as Promise<{ aiAvailable?: boolean }>)
      .then((r) => setAiAvailable(Boolean(r.aiAvailable)))
      .catch(() => setAiAvailable(false));
  }, []);

  return (
    <div className="min-h-dvh bg-gray">
      <TitleBar title="Ajustes" />
      <main className="space-y-10 px-6 pt-10 pb-12">
        <section className="space-y-4">
          <SectionLabel>Mis dialectos</SectionLabel>
          <p className="px-4 text-muted">
            El traductor abre con estos países. Toca uno para cambiarlo.
          </p>
          <div className="rounded-full ring-1 ring-black/10">
            <DialectSwitcher value={pair} onChange={setPair} />
          </div>
        </section>

        <section className="space-y-4">
          <SectionLabel>Favoritos</SectionLabel>
          <div className="flex items-center justify-between rounded-[22px] bg-white px-7 py-5">
            <p className="text-lg text-muted">
              {favorites.length === 1
                ? "1 palabra guardada"
                : `${favorites.length} palabras guardadas`}
            </p>
            {favorites.length > 0 &&
              (confirming ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-full px-4 py-2 text-sm font-bold uppercase hover:bg-field"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clear();
                      setConfirming(false);
                    }}
                    className="rounded-full bg-[#a1262b] px-4 py-2 text-sm font-bold text-white uppercase"
                  >
                    Borrar todo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-full px-4 py-2 text-sm font-bold tracking-wide text-[#a1262b] uppercase hover:bg-field"
                >
                  Borrar
                </button>
              ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionLabel>Sobre Hola</SectionLabel>
          <div className="space-y-3 rounded-[22px] bg-white px-7 py-6 text-muted">
            <p>
              Hola traduce entre dialectos del español con un diccionario hecho a
              mano.
            </p>
            <p>
              {aiAvailable === null
                ? " "
                : aiAvailable
                  ? "Lo que no está en el diccionario, y las fotos, se traducen con IA (Claude). Esas respuestas pueden contener errores."
                  : "La traducción con IA y la cámara no están activadas en este servidor."}
            </p>
            <p>
              Para instalarla, abre el menú de compartir del navegador y elige
              «Agregar a pantalla de inicio».
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
