"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isDialectCode, type DialectCode } from "./dialects";
import type { PhraseEntry } from "./phrase";

/*
 * Everything a person saves lives in localStorage: favorites, their default
 * dialects, and the details of words the AI explained (so they can be opened
 * and saved later).
 */

const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function subscribe(key: string, listener: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read<T>(key: string, fallback: T, validate: (v: unknown) => T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value = fallback;
  if (raw) {
    try {
      value = validate(JSON.parse(raw));
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  listeners.get(key)?.forEach((l) => l());
}

function useStored<T>(key: string, fallback: T, validate: (v: unknown) => T) {
  const value = useSyncExternalStore(
    (l) => subscribe(key, l),
    () => read(key, fallback, validate),
    () => fallback,
  );
  const set = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = read(key, fallback, validate);
      write(
        key,
        typeof next === "function" ? (next as (c: T) => T)(current) : next,
      );
    },
    [key, fallback, validate],
  );
  return [value, set] as const;
}

function isEntry(value: unknown): value is PhraseEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    typeof v.meaning === "string" &&
    isDialectCode(v.dialect)
  );
}

const asEntries = (v: unknown): PhraseEntry[] =>
  Array.isArray(v) ? v.filter(isEntry) : [];

const NO_ENTRIES: PhraseEntry[] = [];

export function useFavorites() {
  const [favorites, setFavorites] = useStored(
    "hola.favorites",
    NO_ENTRIES,
    asEntries,
  );
  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );
  const toggle = useCallback(
    (entry: PhraseEntry) =>
      setFavorites((current) =>
        current.some((f) => f.id === entry.id)
          ? current.filter((f) => f.id !== entry.id)
          : [entry, ...current],
      ),
    [setFavorites],
  );
  const clear = useCallback(() => setFavorites([]), [setFavorites]);
  return { favorites, isFavorite, toggle, clear };
}

export type DialectPair = { from: DialectCode; to: DialectCode };

const DEFAULT_PAIR: DialectPair = { from: "DO", to: "CO" };

const asPair = (v: unknown): DialectPair => {
  const p = v as Partial<DialectPair> | null;
  return p && isDialectCode(p.from) && isDialectCode(p.to)
    ? { from: p.from, to: p.to }
    : DEFAULT_PAIR;
};

/** The two countries used everywhere: translator, guides and settings. */
export function useDialectPair() {
  return useStored("hola.dialects", DEFAULT_PAIR, asPair);
}

/** Words the AI explained, kept so their detail page still opens later. */
export function rememberAiEntries(entries: PhraseEntry[]) {
  if (entries.length === 0) return;
  const current = read("hola.ai-entries", NO_ENTRIES, asEntries);
  const ids = new Set(entries.map((e) => e.id));
  write(
    "hola.ai-entries",
    [...entries, ...current.filter((e) => !ids.has(e.id))].slice(0, 200),
  );
}

export function useAiEntry(id: string): PhraseEntry | undefined {
  const [entries] = useStored("hola.ai-entries", NO_ENTRIES, asEntries);
  return entries.find((e) => e.id === id);
}

const noop = () => () => {};

/** False during server rendering and hydration, true after. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
