import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Comentarios de quienes prueban Kafa. En Supabase viven en la tabla "comentarios"; sin Supabase, en memoria. */

export type TipoComentario = "idea" | "error" | "diseno" | "otro";
export interface Comentario {
  id: string;
  creado: string;
  usuario: string;
  nombre: string;
  pantalla: string;
  tipo: TipoComentario;
  texto: string;
  resuelto: boolean;
}

const g = globalThis as unknown as { __kafaComentarios?: Comentario[] };

function cliente() {
  const url = (process.env.SUPABASE_URL ?? "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const AYUDA = "¿Ejecutaste supabase/comentarios.sql en Supabase?";

export async function listarComentarios(): Promise<Comentario[]> {
  const c = cliente();
  if (!c) return [...(g.__kafaComentarios ??= [])].reverse();
  const { data, error } = await c.from("comentarios").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) throw new Error(`Supabase (comentarios): ${error.message}. ${AYUDA}`);
  return (data ?? []).map((r) => ({
    id: String(r.id),
    creado: String(r.created_at),
    usuario: String(r.usuario),
    nombre: String(r.nombre),
    pantalla: String(r.pantalla),
    tipo: r.tipo as TipoComentario,
    texto: String(r.texto),
    resuelto: r.resuelto === true,
  }));
}

export async function crearComentario(x: Omit<Comentario, "id" | "creado" | "resuelto">) {
  const c = cliente();
  if (!c) {
    (g.__kafaComentarios ??= []).push({ ...x, id: Math.random().toString(36).slice(2, 10), creado: new Date().toISOString(), resuelto: false });
    return;
  }
  const { error } = await c.from("comentarios").insert(x);
  if (error) throw new Error(`No se pudo guardar el comentario. ${AYUDA}`);
}

export async function marcarComentario(id: string, resuelto: boolean) {
  const c = cliente();
  if (!c) {
    const y = (g.__kafaComentarios ??= []).find((z) => z.id === id);
    if (y) y.resuelto = resuelto;
    return;
  }
  const { error } = await c.from("comentarios").update({ resuelto }).eq("id", id);
  if (error) throw new Error(`Supabase (comentarios): ${error.message}`);
}
