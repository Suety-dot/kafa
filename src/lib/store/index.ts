import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Bache, Compra, Datos, Estado, Gasto, Venta } from "../tipos";
import { datosDeEjemplo } from "./ejemplo";

/**
 * Almacén de datos. Con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY usa Supabase;
 * sin ellas usa memoria con datos de ejemplo (sirve para probar en el PC, se borra al reiniciar).
 */

type Nuevo<T> = Omit<T, "id">;

export interface Almacen {
  modo: "supabase" | "memoria";
  leerTodo(): Promise<Datos>;
  agregarCompra(c: Nuevo<Compra>): Promise<void>;
  agregarBache(b: Nuevo<Bache>): Promise<void>;
  agregarVenta(v: Nuevo<Venta>): Promise<void>;
  agregarGasto(g: Nuevo<Gasto>): Promise<void>;
  actualizarEstado(e: Partial<Estado>): Promise<void>;
}

// ---------------------------------------------------------------- memoria
const g = globalThis as unknown as { __kafaDatos?: Datos };
function memoria(): Almacen {
  if (!g.__kafaDatos) g.__kafaDatos = datosDeEjemplo();
  const d = g.__kafaDatos;
  const nid = () => Math.random().toString(36).slice(2, 10);
  return {
    modo: "memoria",
    async leerTodo() {
      return structuredClone(d);
    },
    async agregarCompra(c) {
      d.compras.push({ ...c, id: nid(), creado: new Date().toISOString() });
    },
    async agregarBache(b) {
      d.baches.push({ ...b, id: nid(), creado: new Date().toISOString() });
    },
    async agregarVenta(v) {
      d.ventas.push({ ...v, id: nid(), creado: new Date().toISOString() });
    },
    async agregarGasto(x) {
      d.gastos.push({ ...x, id: nid(), creado: new Date().toISOString() });
    },
    async actualizarEstado(e) {
      Object.assign(d.estado, e);
    },
  };
}

// ---------------------------------------------------------------- supabase
// Las columnas usan snake_case en la base y camelCase en la aplicación.
const snake = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase()), v]));
const camel = <T,>(o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])) as T;

function supabase(cli: SupabaseClient): Almacen {
  // Supabase entrega como máximo 1.000 filas por consulta: se lee en páginas.
  const leer = async <T,>(tabla: string) => {
    const PAGINA = 1000;
    const filas: Record<string, unknown>[] = [];
    for (let desde = 0; ; desde += PAGINA) {
      const { data, error } = await cli
        .from(tabla)
        .select("*")
        .order("fecha", { ascending: true })
        .order("id", { ascending: true })
        .range(desde, desde + PAGINA - 1);
      if (error) throw new Error(`Supabase (${tabla}): ${error.message}`);
      filas.push(...(data ?? []));
      if (!data || data.length < PAGINA) break;
    }
    return filas.map((r) => {
      const x = camel<T & { createdAt?: string; creado?: string }>(r);
      x.creado = x.createdAt;
      delete x.createdAt;
      return x as T;
    });
  };
  const insertar = async (tabla: string, fila: object) => {
    const { creado: _c, ...resto } = fila as Record<string, unknown>;
    void _c;
    const { error } = await cli.from(tabla).insert(snake(resto));
    if (error) throw new Error(`Supabase (${tabla}): ${error.message}`);
  };
  return {
    modo: "supabase",
    async leerTodo() {
      const [compras, baches, ventas, gastos] = await Promise.all([
        leer<Compra>("compras"),
        leer<Bache>("baches"),
        leer<Venta>("ventas"),
        leer<Gasto>("gastos"),
      ]);
      const { data } = await cli.from("estado").select("*").eq("id", 1).maybeSingle();
      const estado: Estado = data
        ? camel<Estado>(data)
        : { escenario: 1, tazaAprobada: null, inicioPiloto: null, reclamosPremium: 0 };
      return { compras, baches, ventas, gastos, estado };
    },
    agregarCompra: (c) => insertar("compras", c),
    agregarBache: (b) => insertar("baches", b),
    agregarVenta: (v) => insertar("ventas", v),
    agregarGasto: (x) => insertar("gastos", x),
    async actualizarEstado(e) {
      const { error } = await cli.from("estado").upsert({ id: 1, ...snake(e) });
      if (error) throw new Error(`Supabase (estado): ${error.message}`);
    },
  };
}

let cache: Almacen | null = null;
export function almacen(): Almacen {
  if (cache) return cache;
  const url = (process.env.SUPABASE_URL ?? "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  cache = url && key ? supabase(createClient(url, key, { auth: { persistSession: false } })) : memoria();
  return cache;
}
