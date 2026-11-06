/** Clave de acceso de APP_CLAVE, sin espacios ni comillas que se cuelen al pegarla en Vercel. */
export function claveApp(): string | null {
  const v = (process.env.APP_CLAVE ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return v || null;
}
