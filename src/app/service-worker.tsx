"use client";

import { useEffect } from "react";
import { listenForInstallPrompt } from "@/lib/install";

export function ServiceWorker() {
  useEffect(() => {
    listenForInstallPrompt();
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
