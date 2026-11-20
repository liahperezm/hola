import type { Metadata, Viewport } from "next";
import "@fontsource/lato/300-italic.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/400-italic.css";
import "@fontsource/lato/700.css";
import "./globals.css";
import { ServiceWorker } from "./service-worker";

export const metadata: Metadata = {
  title: "Hola · Traductor de dialectos",
  description:
    "Traduce palabras y frases entre los dialectos del español: República Dominicana, Colombia, Argentina, México y más.",
  applicationName: "Hola",
  appleWebApp: { capable: true, title: "Hola", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#030050",
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
        <div className="mx-auto min-h-dvh max-w-md bg-white shadow-[0_0_40px_rgba(0,0,0,0.25)]">
          {children}
        </div>
        <ServiceWorker />
      </body>
    </html>
  );
}
