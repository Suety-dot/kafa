import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
import { almacen } from "@/lib/store";
import { RegistrarSW } from "@/components/registrar-sw";

export const metadata: Metadata = {
  title: "Kafa · Café Formemos",
  description: "El asistente que lleva las cuentas del café de la Fundación Formemos",
  appleWebApp: { capable: true, title: "Kafa", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafafa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <RegistrarSW />
        <Shell modo={almacen().modo}>{children}</Shell>
      </body>
    </html>
  );
}
