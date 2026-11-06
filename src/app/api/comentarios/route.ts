import { listarComentarios } from "@/lib/comentarios";
import { nombrePantalla } from "@/lib/pantallas";
import { sesionActual } from "@/lib/sesion-servidor";

/** Exporta los comentarios como CSV (punto y coma, para Excel en español). Solo administradores. */
export async function GET() {
  const yo = await sesionActual();
  if (yo?.rol !== "admin") return Response.json({ error: "Solo administradores." }, { status: 403 });
  const xs = await listarComentarios();
  const esc = (s: string) => (/[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const TIPO: Record<string, string> = { idea: "Idea", error: "Algo falla", diseno: "Diseño", otro: "Otro" };
  const lineas = [
    "Fecha;Persona;Pantalla;Tipo;Comentario;Estado",
    ...xs.map((c) =>
      [new Date(c.creado).toLocaleString("es-CO", { timeZone: "America/Bogota" }), c.nombre, nombrePantalla(c.pantalla), TIPO[c.tipo] ?? c.tipo, c.texto, c.resuelto ? "Resuelto" : "Pendiente"].map(esc).join(";"),
    ),
  ];
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="kafa-comentarios.csv"' },
  });
}
