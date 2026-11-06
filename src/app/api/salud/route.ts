import { createClient } from "@supabase/supabase-js";
import { claveAnthropic, proveedor } from "@/lib/ia";

export const dynamic = "force-dynamic";

/** Diagnóstico sin secretos: dice qué está configurado y si Supabase responde. */
export async function GET() {
  const url = (process.env.SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const r: Record<string, unknown> = {
    supabaseUrl: url ? url.replace(/^(https:\/\/)(.{4}).*(\.supabase\.co.*)$/, "$1$2…$3") : "falta",
    supabaseUrlTerminaBien: url ? /\.supabase\.co\/?$/.test(url) : false,
    claveSecreta: !key ? "falta" : key.startsWith("sb_secret_") ? "parece correcta (sb_secret_)" : key.startsWith("eyJ") ? "parece correcta (service_role)" : key.startsWith("sb_publishable_") ? "es la clave pública: usa la secreta" : "no es una clave de Supabase",
    claveDeAcceso: process.env.APP_CLAVE ? "configurada" : "falta",
    ia: proveedor(),
    iaProveedorEscrito: process.env.IA_PROVEEDOR === undefined ? "falta" : `"${process.env.IA_PROVEEDOR}"`,
    claveAnthropic: (() => {
      const k = claveAnthropic();
      if (!k) return "falta";
      if (k.startsWith("sk-ant-")) return "parece correcta (sk-ant-)";
      return "no parece una clave de Anthropic (debe empezar por sk-ant-)";
    })(),
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
