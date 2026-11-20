import type { Metadata, Viewport } from "next";
import "@fontsource/lato/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/400-italic.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./globals.css";
import { ServiceWorker } from "./service-worker";

export const metadata: Metadata = {
  title: "Hola · Traductor de dialectos",
  description:
    "Traduce palabras y frases entre los dialectos del español: República Dominicana, Colombia, Argentina, México y más.",
  applicationName: "Hola",
  appleWebApp: { capable: true, title: "Hola", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f5fa",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <div className="mx-auto min-h-dvh max-w-md bg-bg">{children}</div>
        <ServiceWorker />
      </body>
    </html>
  );
}
