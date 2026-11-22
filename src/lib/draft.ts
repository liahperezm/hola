"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * What's typed in the translator, shared by both translators so changing a
 * language or country (which can swap one translator for the other) keeps
 * the text. `shown` says whether its translation was on screen.
 */
type Draft = { text: string; shown: boolean };

let draft: Draft = { text: "", shown: false };
const listeners = new Set<() => void>();
const EMPTY: Draft = { text: "", shown: false };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDraft() {
  const value = useSyncExternalStore(subscribe, () => draft, () => EMPTY);
  const update = useCallback((next: Partial<Draft>) => {
    draft = { ...draft, ...next };
    for (const l of listeners) l();
  }, []);
  return [value, update] as const;
}
