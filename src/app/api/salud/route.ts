import { createClient } from "@supabase/supabase-js";
import { proveedor } from "@/lib/ia";

export const dynamic = "force-dynamic";

/** Diagnóstico sin secretos: dice qué está configurado y si Supabase responde. */
export async function GET() {
  const url = (process.env.SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const r: Record<string, unknown> = {
    supabaseUrl: url ? url.replace(/^(https:\/\/)(.{4}).*(\.supabase\.co.*)$/, "$1$2…$3") : "falta",
    supabaseUrlTerminaBien: url ? /\.supabase\.co\/?$/.test(url) : false,
    claveSecreta: key ? `${key.slice(0, 10)}… (${key.length} caracteres)` : "falta",
    claveDeAcceso: process.env.APP_CLAVE ? "configurada" : "falta",
    ia: proveedor(),
  };
  if (url && key) {
    try {
      const cli = createClient(url.replace(/\/rest\/v1\/?$/, ""), key, { auth: { persistSession: false } });
      for (const t of ["compras", "baches", "ventas", "gastos", "estado"]) {
        const { count, error } = await cli.from(t).select("*", { count: "exact", head: true });
        r[t] = error ? `error: ${error.message}` : `${count} filas`;
      }
    } catch (e) {
      r.supabase = `error: ${(e as Error).message}`;
    }
  }
  return Response.json(r);
}
