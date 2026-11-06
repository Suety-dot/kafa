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

export function proveedor(): Proveedor {
  const p = (process.env.IA_PROVEEDOR ?? "").toLowerCase();
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (p === "ollama") return "ollama";
  return "ninguno";
}

const MODELO_RAPIDO = process.env.IA_MODELO_RAPIDO ?? "claude-haiku-4-5-20251001";
const MODELO_REDACCION = process.env.IA_MODELO_REDACCION ?? "claude-sonnet-5-5";
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODELO = process.env.OLLAMA_MODELO ?? "qwen2.5vl:7b";

interface Pedido {
  sistema: string;
  texto: string;
  imagen?: { base64: string; tipo: string };
  rapido?: boolean;
  maxTokens?: number;
}

async function pedir({ sistema, texto, imagen, rapido = true, maxTokens = 800 }: Pedido): Promise<string> {
  const p = proveedor();
  if (p === "ninguno") throw new Error("IA desactivada");

  if (p === "anthropic") {
    const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const contenido: Anthropic.ContentBlockParam[] = [];
    if (imagen)
      contenido.push({
        type: "image",
        source: { type: "base64", media_type: imagen.tipo as "image/jpeg", data: imagen.base64 },
      });
    contenido.push({ type: "text", text: texto });
    const r = await cliente.messages.create({
      model: rapido ? MODELO_RAPIDO : MODELO_REDACCION,
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

export async function leerRecibo(base64: string, tipo: string): Promise<LecturaRecibo> {
  const sistema =
    "Lees recibos de compra de café en Colombia. Devuelves solo JSON. No inventes: si un dato no aparece o no es legible, pon null. " +
    "No copies nombres de personas: el caficultor se registra aparte con un identificador.";
  const texto =
    "Extrae de este recibo un JSON con estas claves exactas: " +
    '{"fecha":"AAAA-MM-DD o null","kilos":número o null,"precioKg":número en pesos por kilo o null,' +
    '"unidad":"cps" si dice pergamino o pergamino seco, "verde" si dice verde o excelso, null si no se sabe,' +
    '"calidad":"consumo"|"excelso"|"premium"|"especial"|null,"total":número o null,' +
    '"notas":"una frase corta sobre lo que no se pudo leer o lo que conviene revisar"}. ' +
    "Los precios en Colombia usan punto como separador de miles: 25.900 es veinticinco mil novecientos.";
  return extraerJson<LecturaRecibo>(await pedir({ sistema, texto, imagen: { base64, tipo }, rapido: true, maxTokens: 400 }));
}

export async function redactarInforme(cifras: unknown, mes: string): Promise<string> {
  const sistema =
    "Redactas el informe mensual del café de la Fundación Formemos para su Comité Directivo, en español neutro de Colombia, en tercera persona y con tono sobrio. " +
    "Usa SOLO las cifras del JSON que recibes, copiadas tal cual; no calcules cifras nuevas ni redondees distinto. Si falta un dato, dilo. " +
    "Sin guiones largos. Estructura con estos títulos en líneas propias: Resumen, Torrefactora, Compras y precio, Ventas, Escalera de inversión, Alertas. " +
    "Cada sección en uno o dos párrafos cortos.";
  return pedir({ sistema, texto: `Mes: ${mes}\nCifras calculadas por la aplicación:\n${JSON.stringify(cifras)}`, rapido: false, maxTokens: 1500 });
}

export async function responderPregunta(pregunta: string, contexto: unknown): Promise<string> {
  const sistema =
    "Respondes preguntas sobre los registros del café de la Fundación Formemos. Usa SOLO los datos del JSON. " +
    "Si la respuesta no está en los datos, dilo y sugiere qué registro haría falta. Respuesta corta, en español neutro, cifras con punto de miles.";
  return pedir({ sistema, texto: `Datos:\n${JSON.stringify(contexto)}\n\nPregunta: ${pregunta}`, rapido: true, maxTokens: 500 });
}
