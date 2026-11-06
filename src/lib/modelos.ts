/** Modelos de IA que se pueden elegir en la aplicación. Se usa en el cliente y en el servidor. */
export const MODELOS = [
  { id: "auto", nombre: "Automático", nota: "Haiku para recibos y preguntas, Sonnet para el informe" },
  { id: "claude-haiku-4-5-20251001", nombre: "Haiku 4.5", nota: "rápido y el más barato" },
  { id: "claude-sonnet-5-5", nombre: "Sonnet 5.5", nota: "equilibrado" },
  { id: "claude-opus-5-5", nombre: "Opus 5.5", nota: "el más potente, cuesta varias veces más" },
] as const;

export type IdModelo = (typeof MODELOS)[number]["id"];

/** Devuelve el modelo pedido solo si está en la lista; si no, null (se usa el automático). */
export function modeloValido(m: unknown): string | null {
  if (typeof m !== "string" || m === "auto") return null;
  return MODELOS.some((x) => x.id === m) ? m : null;
}
