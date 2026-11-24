import type { NextConfig } from "next";

/** This deploy's version: the commit on Vercel, "dev" locally. */
const BUILD = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 12);

const nextConfig: NextConfig = {
  env: { HOLA_BUILD: BUILD },
  async redirects() {
    return [
      { source: "/diccionario", destination: "/explorar", permanent: true },
      {
        source: "/diccionario/favoritos",
        destination: "/favoritos",
        permanent: true,
      },
      { source: "/guardados", destination: "/favoritos", permanent: true },
      { source: "/ajustes", destination: "/preferencias", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
