import { almacen } from "@/lib/store";
import { tabla, TIPOS, type Tipo } from "@/lib/registros";

/** Exporta la tabla filtrada como CSV (separado por punto y coma, para Excel en español). */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const tipo = (TIPOS.find((t) => t.id === sp.get("tipo"))?.id ?? "compras") as Tipo;
  const mes = sp.get("mes") || "todos";
  const q = (sp.get("q") ?? "").slice(0, 60);
  const t = tabla(await almacen().leerTodo(), tipo, mes, q);
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lineas = [t.columnas.map((c) => esc(c.titulo)).join(";"), ...t.filas.map((f) => f.texto.map(esc).join(";"))];
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="kafa-${tipo}-${mes}.csv"`,
    },
  });
}
