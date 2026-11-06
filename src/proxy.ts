import { NextResponse, type NextRequest } from "next/server";

/** Si APP_CLAVE está definida, todo exige la cookie de sesión salvo la pantalla de entrada. */
export function proxy(req: NextRequest) {
  const clave = process.env.APP_CLAVE;
  if (!clave) return NextResponse.next();
  if (req.cookies.get("kafa_sesion")?.value === clave) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/entrar";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!entrar|_next/static|_next/image|icon|apple-icon|icon-192.png|icon-512.png|icon-maskable-512.png|manifest.webmanifest|sw.js|sin-conexion.html).*)"],
};
