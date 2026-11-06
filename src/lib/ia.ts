import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Capa de IA intercambiable. IA_PROVEEDOR = "anthropic" | "ollama" | "ninguno".
 * Reglas del proyecto:
 *  - La IA nunca calcula cifras: recibe las que calcula la aplicación y solo redacta o extrae.
 *  - La aplicación funciona sin IA (proveedor "ninguno").
 *  - A la IA se le envían identificadores, no nombres de caficultores ni clientes.
 */

export type Proveedor = "anthropic" | "ollama" | "ninguno";

/** Limpia espacios, comillas y mayúsculas que se cuelan al pegar valores en Vercel. */
const limpio = (v?: string) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

export function claveAnthropic(): string {
  return limpio(process.env.ANTHROPIC_API_KEY);
}

export function proveedor(): Proveedor {
  const p = limpio(process.env.IA_PROVEEDOR).toLowerCase();
  if (p === "ollama") return "ollama";
  if (p === "ninguno") return "ninguno";
  // Con la clave de Anthropic basta: si IA_PROVEEDOR falta o está mal escrito, se usa Anthropic.
  if (claveAnthropic()) return "anthropic";
  return "ninguno";
}

const MODELO_RAPIDO = limpio(process.env.IA_MODELO_RAPIDO) || "claude-haiku-4-5-20251001";
const MODELO_REDACCION = limpio(process.env.IA_MODELO_REDACCION) || "claude-sonnet-5-5";
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODELO = process.env.OLLAMA_MODELO ?? "qwen2.5vl:7b";

interface Pedido {
  sistema: string;
  texto: string;
  imagen?: { base64: string; tipo: string };
  rapido?: boolean;
  maxTokens?: number;
  /** Modelo elegido en la aplicación; si falta se usa el de la tarea. */
  modelo?: string | null;
}

async function pedir({ sistema, texto, imagen, rapido = true, maxTokens = 800, modelo }: Pedido): Promise<string> {
  const p = proveedor();
  if (p === "ninguno") throw new Error("IA desactivada");

  if (p === "anthropic") {
    const cliente = new Anthropic({ apiKey: claveAnthropic() });
    const contenido: Anthropic.ContentBlockParam[] = [];
    if (imagen)
      contenido.push({
        type: "image",
        source: { type: "base64", media_type: imagen.tipo as "image/jpeg", data: imagen.base64 },
      });
    contenido.push({ type: "text", text: texto });
    const r = await cliente.messages.create({
      model: modelo || (rapido ? MODELO_RAPIDO : MODELO_REDACCION),
      max_tokens: maxTokens,
      system: sistema,
      messages: [{ role: "user", content: contenido }],
    });
    return r.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  }

  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODELO,
      stream: false,
      messages: [
        { role: "system", content: sistema },
        { role: "user", content: texto, ...(imagen ? { images: [imagen.base64] } : {}) },
      ],
    }),
  });
  if (!r.ok) throw new Error(`Ollama respondió ${r.status}`);
  const j = (await r.json()) as { message?: { content?: string } };
  return (j.message?.content ?? "").trim();
}

function extraerJson<T>(s: string): T {
  const i = s.indexOf("{");
  const f = s.lastIndexOf("}");
  if (i < 0 || f < i) throw new Error("La IA no devolvió JSON");
  return JSON.parse(s.slice(i, f + 1)) as T;
}

export interface LecturaRecibo {
  fecha: string | null;
  kilos: number | null;
  precioKg: number | null;
  unidad: "cps" | "verde" | null;
  calidad: "consumo" | "excelso" | "premium" | "especial" | null;
  total: number | null;
  notas: string;
}

/** Lo que la IA copia del recibo, tal como está escrito. Las conversiones las hace la aplicación. */
export interface LecturaCruda {
  fecha: string | null;
  cantidad: number | null;
  medida: "kg" | "arroba" | "carga" | "libra" | null;
  precioUnitario: number | null;
  total: number | null;
  unidad: "cps" | "verde" | null;
  calidad: "consumo" | "excelso" | "premium" | "especial" | null;
  notas: string;
}

/** Kilos por cada medida usada en el campo colombiano. */
export const KILOS_POR: Record<string, number> = { kg: 1, arroba: 12.5, carga: 125, libra: 0.5 };
const NOMBRE_MEDIDA: Record<string, [string, string]> = { kg: ["kilo", "kilos"], arroba: ["arroba", "arrobas"], carga: ["carga", "cargas"], libra: ["libra", "libras"] };
const miles = (n: number) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(n);

/** Convierte la lectura cruda a kilos y pesos por kilo, y revisa que el total cuadre. Sin IA: solo aritmética. */
export function normalizarLectura(c: LecturaCruda, hoy: string): LecturaRecibo {
  const notas: string[] = [];
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x > 0 ? x : null);
  const cantidad = num(c.cantidad);
  const unitario = num(c.precioUnitario);
  const total = num(c.total);
  const medida = c.medida && KILOS_POR[c.medida] ? c.medida : cantidad ? "kg" : null;
  const factor = medida ? KILOS_POR[medida] : 1;
  const kilos = cantidad ? Math.round(cantidad * factor * 10) / 10 : null;

  let precioKg: number | null = null;
  if (unitario) precioKg = Math.round(unitario / factor);
  else if (total && kilos) {
    precioKg = Math.round(total / kilos);
    notas.push("El precio por kilo no estaba escrito: Kafa lo calculó con el total y los kilos.");
  }
  if (medida && medida !== "kg" && cantidad)
    notas.push(`Decía ${miles(cantidad)} ${NOMBRE_MEDIDA[medida][cantidad === 1 ? 0 : 1]}${unitario ? ` a $${miles(unitario)} por ${NOMBRE_MEDIDA[medida][0]}` : ""}: Kafa lo pasó a ${miles(kilos!)} kg${precioKg ? ` a $${miles(precioKg)} por kilo` : ""}.`);
  if (total && kilos && precioKg && unitario) {
    const esperado = kilos * precioKg;
    if (Math.abs(esperado - total) / total > 0.02) notas.push(`El total escrito ($${miles(total)}) no cuadra con kilos por precio ($${miles(esperado)}). Revísalo.`);
  }

  let fecha = c.fecha && /^\d{4}-\d{2}-\d{2}$/.test(c.fecha) ? c.fecha : null;
  if (fecha && fecha > hoy) {
    notas.push("La fecha leída quedó en el futuro; se dejó la de hoy.");
    fecha = null;
  }
  if (c.notas) notas.push(c.notas);
  return { fecha, kilos, precioKg, unidad: c.unidad ?? null, calidad: c.calidad ?? null, total, notas: notas.join(" ") };
}

export async function leerRecibo(base64: string, tipo: string, modelo?: string | null, hoy = new Date().toISOString().slice(0, 10)): Promise<LecturaRecibo> {
  const sistema =
    "Lees recibos y notas de compra de café en Colombia, impresos o escritos a mano por personas distintas, sin un formato fijo. " +
    "Copias los datos tal como están escritos; no conviertes unidades ni haces cuentas. Devuelves solo JSON. " +
    "No inventes: si un dato no aparece o no es legible, pon null. No copies nombres de personas.";
  const texto =
    `Hoy es ${hoy}. Extrae un JSON con estas claves exactas: ` +
    '{"fecha":"AAAA-MM-DD o null (si no tiene año, usa el año de hoy; en Colombia la fecha va día/mes/año)",' +
    '"cantidad":número tal como está escrito o null,' +
    '"medida":"kg" (kilos, kg, k), "arroba" (arroba, @, @s), "carga" (carga, cargas), "libra" (libra, lb) o null,' +
    '"precioUnitario":precio por cada medida tal como está escrito, en pesos, o null,' +
    '"total":valor total escrito en pesos o null,' +
    '"unidad":"cps" si dice pergamino, pergamino seco, cps o seco; "verde" si dice verde, excelso o almendra; null si no se sabe,' +
    '"calidad":"consumo"|"excelso"|"premium"|"especial"|null (pasilla o corriente cuentan como consumo; especial, de especialidad o microlote como especial),' +
    '"notas":"una frase corta sobre lo que no se pudo leer o conviene revisar, o vacío"}. ' +
    "Los precios usan punto de miles: 25.900 es veinticinco mil novecientos; 1.2M o 1,2 millones es 1200000; \"25 mil\" es 25000.";
  const cruda = extraerJson<LecturaCruda>(await pedir({ sistema, texto, imagen: { base64, tipo }, rapido: true, maxTokens: 400, modelo }));
  return normalizarLectura(cruda, hoy);
}

export async function redactarInforme(cifras: unknown, mes: string, modelo?: string | null): Promise<string> {
  const sistema =
    "Redactas el informe mensual del café de la Fundación Formemos para su Comité Directivo, en español neutro de Colombia, en tercera persona y con tono sobrio. " +
    "Usa SOLO las cifras del JSON que recibes, copiadas tal cual; no calcules cifras nuevas ni redondees distinto. Si falta un dato, dilo. " +
    "Sin guiones largos. Estructura con estos títulos en líneas propias: Resumen, Torrefactora, Compras y precio, Ventas, Escalera de inversión, Alertas. " +
    "Cada sección en uno o dos párrafos cortos.";
  return pedir({ sistema, texto: `Mes: ${mes}\nCifras calculadas por la aplicación:\n${JSON.stringify(cifras)}`, rapido: false, maxTokens: 1500, modelo });
}

export async function responderPregunta(pregunta: string, contexto: unknown, modelo?: string | null): Promise<string> {
  const sistema =
    "Respondes preguntas sobre los registros del café de la Fundación Formemos. Usa SOLO los datos del JSON. " +
    "Si la respuesta no está en los datos, dilo y sugiere qué registro haría falta. Respuesta corta, en español neutro, cifras con punto de miles.";
  return pedir({ sistema, texto: `Datos:\n${JSON.stringify(contexto)}\n\nPregunta: ${pregunta}`, rapido: true, maxTokens: 500, modelo });
}
