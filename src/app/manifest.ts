import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hola · Traductor de dialectos",
    short_name: "Hola",
    description: "Traduce palabras y frases entre los dialectos del español.",
    lang: "es",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5fa",
    theme_color: "#f6f5fa",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
