import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Contraseñas con scrypt y sal aleatoria. Formato guardado: scrypt$<sal>$<hash>. */
export function cifrar(clave: string) {
  const sal = randomBytes(16).toString("base64url");
  const hash = scryptSync(clave, sal, 32).toString("base64url");
  return `scrypt$${sal}$${hash}`;
}

export function comprobar(clave: string, guardada: string) {
  const [alg, sal, hash] = guardada.split("$");
  if (alg !== "scrypt" || !sal || !hash) return false;
  const a = Buffer.from(hash, "base64url");
  const b = scryptSync(clave, sal, a.length);
  return a.length === b.length && timingSafeEqual(a, b);
}
