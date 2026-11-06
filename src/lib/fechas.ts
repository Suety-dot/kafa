/** Fechas para leer, no para la base: "Hoy", "Ayer", "4 nov", "8 dic 2025". Sirve en cliente y servidor. */

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Hoy en Bogotá, como AAAA-MM-DD. */
export function hoyBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

const partes = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { a, m, d };
};

/** Suma días a una fecha AAAA-MM-DD. */
export function sumarDias(iso: string, n: number): string {
  const { a, m, d } = partes(iso);
  const x = new Date(Date.UTC(a, m - 1, d + n));
  return x.toISOString().slice(0, 10);
}

/** "Hoy", "Ayer", "4 nov" o "8 dic 2025" si es de otro año. */
export function fechaCorta(iso: string | null | undefined, hoy = hoyBogota()): string {
  if (!iso) return "";
  if (iso === hoy) return "Hoy";
  if (iso === sumarDias(hoy, -1)) return "Ayer";
  const { a, m, d } = partes(iso);
  const base = `${d} ${MESES_CORTOS[m - 1].toLowerCase()}`;
  return a === partes(hoy).a ? base : `${base} ${a}`;
}

/** "4 nov" siempre, sin "Hoy" (para ejes de gráficos). */
export function diaMes(iso: string): string {
  const { m, d } = partes(iso);
  return `${d} ${MESES_CORTOS[m - 1].toLowerCase()}`;
}

/** "4 de noviembre de 2026". */
export function fechaTexto(iso: string | null | undefined): string {
  if (!iso) return "";
  const { a, m, d } = partes(iso);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

/** "viernes 6 de noviembre" (con el año si no es el actual). */
export function fechaLarga(iso: string, hoy = hoyBogota()): string {
  const { a, m, d } = partes(iso);
  const dia = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  return `${dia} ${d} de ${MESES[m - 1]}${a === partes(hoy).a ? "" : ` de ${a}`}`;
}

/** "Noviembre 2026" a partir de "2026-11". */
export function mesTexto(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  const t = MESES[m - 1];
  return `${t[0].toUpperCase()}${t.slice(1)} ${a}`;
}
