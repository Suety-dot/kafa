import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kafa · Café Formemos",
    short_name: "Kafa",
    description: "El asistente que lleva las cuentas del café de la Fundación Formemos",
    lang: "es-CO",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#fafafa",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Registrar compra", url: "/registrar/compra" },
      { name: "Registrar bache", url: "/registrar/bache" },
      { name: "Tablero", url: "/tablero" },
    ],
  };
}
