import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Usuarios de Kafa. En Supabase viven en la tabla "usuarios"; sin Supabase, en memoria. */

export interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  rol: "admin" | "registro";
  claveHash: string;
  activo: boolean;
}

const g = globalThis as unknown as { __kafaUsuarios?: Usuario[] };

function cliente() {
  const url = (process.env.SUPABASE_URL ?? "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const deFila = (r: Record<string, unknown>): Usuario => ({
  id: String(r.id),
  usuario: String(r.usuario),
  nombre: String(r.nombre),
  rol: r.rol === "admin" ? "admin" : "registro",
  claveHash: String(r.clave_hash),
  activo: r.activo !== false,
});

export const normalizar = (u: string) => u.trim().toLowerCase();

export async function listar(): Promise<Usuario[]> {
  const c = cliente();
  if (!c) return (g.__kafaUsuarios ??= []);
  const { data, error } = await c.from("usuarios").select("*").order("nombre");
  if (error) throw new Error(`Supabase (usuarios): ${error.message}. ¿Ejecutaste supabase/usuarios.sql?`);
  return (data ?? []).map(deFila);
}

export async function buscar(usuario: string): Promise<Usuario | null> {
  const u = normalizar(usuario);
  const c = cliente();
  if (!c) return (g.__kafaUsuarios ??= []).find((x) => x.usuario === u) ?? null;
  const { data, error } = await c.from("usuarios").select("*").eq("usuario", u).maybeSingle();
  if (error) throw new Error(`Supabase (usuarios): ${error.message}. ¿Ejecutaste supabase/usuarios.sql?`);
  return data ? deFila(data) : null;
}

export async function hayUsuarios(): Promise<boolean> {
  return (await listar()).length > 0;
}

export async function crear(u: Omit<Usuario, "id">) {
  const c = cliente();
  if (!c) {
    (g.__kafaUsuarios ??= []).push({ ...u, id: Math.random().toString(36).slice(2, 10) });
    return;
  }
  const { error } = await c.from("usuarios").insert({ usuario: u.usuario, nombre: u.nombre, rol: u.rol, clave_hash: u.claveHash, activo: u.activo });
  if (error) throw new Error(error.code === "23505" ? "Ese usuario ya existe." : `Supabase (usuarios): ${error.message}`);
}

export async function actualizar(id: string, cambios: Partial<Pick<Usuario, "activo" | "claveHash" | "nombre" | "rol">>) {
  const c = cliente();
  if (!c) {
    const x = (g.__kafaUsuarios ??= []).find((y) => y.id === id);
    if (x) Object.assign(x, cambios);
    return;
  }
  const fila: Record<string, unknown> = {};
  if (cambios.activo !== undefined) fila.activo = cambios.activo;
  if (cambios.claveHash) fila.clave_hash = cambios.claveHash;
  if (cambios.nombre) fila.nombre = cambios.nombre;
  if (cambios.rol) fila.rol = cambios.rol;
  const { error } = await c.from("usuarios").update(fila).eq("id", id);
  if (error) throw new Error(`Supabase (usuarios): ${error.message}`);
}
