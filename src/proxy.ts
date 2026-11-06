import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verificar } from "@/lib/sesion";

/** Todo exige una sesión de usuario válida, salvo la pantalla de entrada y los archivos públicos. */
export async function proxy(req: NextRequest) {
  if (await verificar(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!entrar|_next/static|_next/image|icon|apple-icon|icon-192.png|icon-512.png|icon-maskable-512.png|manifest.webmanifest|sw.js|sin-conexion.html).*)"],
};
