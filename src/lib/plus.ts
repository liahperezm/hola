"use client";

import { useCallback } from "react";
import { dayNumber } from "./dictionary";
import { useStored } from "./storage";

/*
 * Hola Plus. Free: the dictionary, Explore, word translations and a few
 * sentence translations a day (those use a paid or rate-limited service).
 * Plus: unlimited sentences, offline packs, flashcards and more phrasebooks.
 * Payments aren't connected yet: usePlus() is false for everyone, and the
 * Plus page collects a waitlist.
 */

export const FREE_SENTENCES_PER_DAY = 10;

export const PLANS = [
  { id: "monthly", name: "Mensual", price: "$3.99", per: "al mes" },
  { id: "yearly", name: "Anual", price: "$29.99", per: "$2.50 al mes", save: "Ahorra 37%" },
] as const;

export function usePlus(): boolean {
  const [plus] = useStored("hola.plus", false, (v) => v === true);
  return plus;
}

const asCount = (v: unknown): { day: number; used: number } => {
  const o = v as { day?: unknown; used?: unknown } | null;
  return typeof o?.day === "number" && typeof o.used === "number"
    ? { day: o.day, used: o.used }
    : { day: 0, used: 0 };
};
const NONE = { day: 0, used: 0 };

/** Sentence translations left today, and a way to use one. */
export function useSentenceAllowance() {
  const plus = usePlus();
  const [count, setCount] = useStored("hola.sentences", NONE, asCount);
  const today = dayNumber(new Date());
  const used = count.day === today ? count.used : 0;
  const left = plus ? Infinity : Math.max(0, FREE_SENTENCES_PER_DAY - used);
  /** Returns false when none are left. */
  const spend = useCallback((): boolean => {
    if (plus) return true;
    const now = dayNumber(new Date());
    const usedNow = count.day === now ? count.used : 0;
    if (usedNow >= FREE_SENTENCES_PER_DAY) return false;
    setCount({ day: now, used: usedNow + 1 });
    return true;
  }, [plus, count, setCount]);
  return { left, plus, spend };
}

/** Phrasebooks that come with Plus, shown locked in Explore. */
export const PLUS_GUIDES = [
  { id: "jerga", emoji: "😎", title: "Jerga y dichos", subtitle: "Calle y refranes", color: "bg-lavender" },
  { id: "salir", emoji: "🎉", title: "De fiesta", subtitle: "Bares, música y planes", color: "bg-sky" },
  { id: "medico", emoji: "🩺", title: "En el médico", subtitle: "Síntomas y farmacia", color: "bg-mint" },
  { id: "familia", emoji: "💛", title: "Familia y amor", subtitle: "Cariño, apodos y la suegra", color: "bg-butter" },
] as const;

export const PLUS_FEATURES = [
  { emoji: "∞", title: "Frases sin límite", detail: "Gratis: {free} frases al día. Las palabras siempre son gratis." },
  { emoji: "📴", title: "Sin conexión", detail: "Descarga el español de un país para viajar sin datos." },
  { emoji: "🃏", title: "Tarjetas de repaso", detail: "Repasa tus favoritos hasta que te salgan solos." },
  { emoji: "📚", title: "Más mini guías", detail: "Jerga, fiesta, médico, familia y más." },
] as const;
