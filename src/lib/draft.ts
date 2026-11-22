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

let checkedUrl = false;

/** Text the user shared into Hola from another app (?text=…), cleaned up. */
export function sharedText(params: URLSearchParams): string {
  // The title is often just the other app's name; use it only without text.
  const text = params.get("text")?.trim();
  const parts = [text ? "" : params.get("title"), text, params.get("url")]
    .map((p) => p?.trim() ?? "")
    .filter(Boolean);
  // Apps often add a link to the text; only translate the words.
  const words = parts.map((p) => p.replace(/https?:\/\/\S+/g, "").trim()).filter(Boolean);
  return words.join("\n").slice(0, 2000);
}

const SHARED = "hola.shared";

function storedShare(): string | null {
  try {
    return sessionStorage.getItem(SHARED);
  } catch {
    return null;
  }
}

/**
 * Text to translate as soon as the translator opens: something shared into
 * Hola, or the text whose translation was on screen in the other translator.
 * Shared text is kept (for this tab) until a translator has translated it,
 * so it survives the welcome screens of a first visit.
 */
export function takePendingText(): string | null {
  if (typeof window === "undefined") return null;
  if (!checkedUrl) {
    checkedUrl = true;
    const params = new URLSearchParams(window.location.search);
    const shared = sharedText(params);
    if (params.has("text") || params.has("title") || params.has("url")) {
      // Leave a clean address so a reload doesn't translate it again.
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (shared) {
      try {
        sessionStorage.setItem(SHARED, shared);
      } catch {
        // Private mode: it still works for this page.
      }
      draft = { text: shared, shown: true };
      for (const l of listeners) l();
    }
  }
  const shared = storedShare();
  if (shared) {
    if (draft.text !== shared) {
      draft = { text: shared, shown: true };
      for (const l of listeners) l();
    }
    return shared;
  }
  return draft.shown && draft.text.trim() ? draft.text : null;
}

/** The shared text has been translated. */
export function sharedTextDone() {
  try {
    sessionStorage.removeItem(SHARED);
  } catch {
    // Nothing stored.
  }
}
