/** Modelos de IA que se pueden elegir en la aplicación. Se usa en el cliente y en el servidor. */
export const MODELOS = [
  { id: "auto", nombre: "Automático", corto: "Auto", costo: 1, nota: "Kafa elige: Haiku para recibos y preguntas, Sonnet para el informe." },
  { id: "claude-haiku-4-5-20251001", nombre: "Haiku 4.5", corto: "Haiku", costo: 1, nota: "Haiku 4.5: el más rápido y el más barato. Bien para recibos claros." },
  { id: "claude-sonnet-5-5", nombre: "Sonnet 5.5", corto: "Sonnet", costo: 2, nota: "Sonnet 5.5: equilibrado. Lee mejor los recibos a mano y redacta mejor." },
  { id: "claude-opus-5-5", nombre: "Opus 5.5", corto: "Opus", costo: 3, nota: "Opus 5.5: el más potente. Cuesta varias veces más; úsalo para casos difíciles." },
] as const;

export type IdModelo = (typeof MODELOS)[number]["id"];

/** Devuelve el modelo pedido solo si está en la lista; si no, null (se usa el automático). */
export function modeloValido(m: unknown): string | null {
  if (typeof m !== "string" || m === "auto") return null;
  return MODELOS.some((x) => x.id === m) ? m : null;
}
