/**
 * Sesión firmada en una cookie (HMAC SHA-256 con Web Crypto: sirve en el proxy y en el servidor).
 * El secreto es SESION_SECRETO; si no existe, se deriva de la clave secreta de Supabase o de APP_CLAVE.
 */

export const COOKIE = "kafa_sesion";
const DURACION_S = 60 * 60 * 24 * 30; // 30 días

export interface Sesion {
  uid: string;
  usuario: string;
  nombre: string;
  rol: "admin" | "registro";
  exp: number;
}

const enc = new TextEncoder();
const b64url = (b: ArrayBuffer | Uint8Array) =>
  Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b)).toString("base64url");

function secreto() {
  return process.env.SESION_SECRETO || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.APP_CLAVE || "kafa-desarrollo-local";
}

async function llave() {
  return crypto.subtle.importKey("raw", enc.encode("kafa:" + secreto()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function firmar(s: Omit<Sesion, "exp">): Promise<string> {
  const cuerpo = b64url(enc.encode(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + DURACION_S })));
  const firma = await crypto.subtle.sign("HMAC", await llave(), enc.encode(cuerpo));
  return `${cuerpo}.${b64url(firma)}`;
}

export async function verificar(token: string | undefined | null): Promise<Sesion | null> {
  if (!token || !token.includes(".")) return null;
  const [cuerpo, firma] = token.split(".");
  try {
    const ok = await crypto.subtle.verify("HMAC", await llave(), Buffer.from(firma, "base64url"), enc.encode(cuerpo));
    if (!ok) return null;
    const s = JSON.parse(Buffer.from(cuerpo, "base64url").toString()) as Sesion;
    if (!s.exp || s.exp < Date.now() / 1000) return null;
    return s;
  } catch {
    return null;
  }
}

export const opcionesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: DURACION_S,
  path: "/",
};

export const primerNombre = (n: string) => n.trim().split(/\s+/)[0] || n;
