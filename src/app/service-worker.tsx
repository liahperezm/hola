"use client";

import { useEffect } from "react";
import { useUiLanguage } from "@/lib/i18n";
import { listenForInstallPrompt } from "@/lib/install";

export function ServiceWorker() {
  useEffect(() => {
    listenForInstallPrompt();
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  // Screen readers pronounce the page in the app's language.
  const [language] = useUiLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return null;
}
