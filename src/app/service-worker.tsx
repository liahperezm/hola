"use client";

import { useEffect } from "react";
import { useUiLanguage } from "@/lib/i18n";
import { listenForInstallPrompt } from "@/lib/install";

export function ServiceWorker() {
  useEffect(() => {
    listenForInstallPrompt();
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      // A new deploy registers a new worker, which clears the old offline copy.
      navigator.serviceWorker.register(`/sw.js?v=${process.env.HOLA_BUILD}`).catch(() => {});
    }
    // An installed app can stay open for days: when it comes back to the
    // screen, check whether a newer version is live and load it.
    const check = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/version", { cache: "no-store" })
        .then((r) => r.json() as Promise<{ build?: string }>)
        .then(({ build }) => {
          if (build && build !== process.env.HOLA_BUILD) window.location.reload();
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, []);
  // Screen readers pronounce the page in the app's language.
  const [language] = useUiLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return null;
}
