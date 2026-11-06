import { almacen } from "@/lib/store";
import { tabla, TIPOS, type Tipo } from "@/lib/registros";
import { listar } from "@/lib/usuarios";

/** Exporta la tabla filtrada como CSV (separado por punto y coma, para Excel en español). */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const tipo = (TIPOS.find((t) => t.id === sp.get("tipo"))?.id ?? "compras") as Tipo;
  const mes = sp.get("mes") || "todos";
  const cuenta = sp.get("cuenta") || "todas";
  const nombres = Object.fromEntries((await listar().catch(() => [])).map((u) => [u.usuario, u.nombre]));
  const t = tabla(await almacen().leerTodo(), tipo, mes, cuenta, nombres);
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lineas = [t.columnas.map((c) => esc(c.titulo)).join(";"), ...t.filas.map((f) => f.texto.map(esc).join(";"))];
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="kafa-${tipo}-${mes}.csv"`,
    },
  });
}
