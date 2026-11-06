/**
 * Supuestos y fórmulas del caso de inversión (Etapa 3, Grupo 33 Consultandes).
 * Son las mismas celdas de entrada y fórmulas del libro Etapa3_Escenarios_Formemos.xlsx.
 * Regla del proyecto: las cifras las calcula este módulo, nunca la IA.
 */

export const SUPUESTOS = {
  /** Kg de pergamino seco (cps) por kg de café verde; 1,0 si el precio de compra viene por kilo verde. */
  factorCpsVerde: 1.2,
  /** Precio del kg verde premium a través del tercero (costeo de la coordinación). */
  precioVerdeTercero: 30000,
  /** Merma de tostión. */
  merma: 0.18,
  /** Maquila del tercero, $ por libra tostada. */
  maquilaTerceroLb: 1470,
  /** Energía en Tena, $ por kg cps (trilla, tostión, molienda y empaque). */
  energiaKgCps: 288.269444444444,
  /** Flete Tena a Bogotá, $ por kg tostado (supuesto; hoy lo asume Uniminuto). */
  fleteKgTostado: 1000,
  /** Costeo por libra de la coordinación general. */
  costoLbPremiumMaquila: 21465.12,
  costoLbInstitucionalMaquila: 17799.62,
  precioLbPremium: 30800,
  precioLbInstitucional: 25500,
  /** Margen de contribución de Café Bogotá en el libro contable (enero a julio de 2026). */
  margenLibro: 0.20065401593874,
  /** Tarifa del servicio de transformación, $ por kg cps. */
  tarifaServicioKgCps: 3800,
  /** Capacidad de la torrefactora en kg cps por mes (un turno). */
  capacidadKgCpsMes: 10560,
  /** Uso que lleva la torrefactora a equilibrio a costo completo. */
  usoEquilibrio: 0.262628652345143,
  /** Meses de inventario objetivo del fondo. */
  mesesInventario: 3,
  /** Precio de compra de referencia (pergamino) usado en el modelo. */
  precioCpsReferencia: 23500,
} as const;

const LB_POR_KG = 2.20462;

/** Libras tostadas por kg verde. */
export const lbPorKgVerde = (1 - SUPUESTOS.merma) * LB_POR_KG;

/** Otros costos variables y descuentos como % de ventas (diferencia entre costeo y libro). */
export const otrosVariables = 1 - SUPUESTOS.costoLbPremiumMaquila / SUPUESTOS.precioLbPremium - SUPUESTOS.margenLibro;

/** Empaque, etiquetas y otros por libra (costeo premium menos grano y maquila del tercero). */
export const empaqueLb =
  SUPUESTOS.costoLbPremiumMaquila - SUPUESTOS.precioVerdeTercero / lbPorKgVerde - SUPUESTOS.maquilaTerceroLb;

/** Costo por libra del premium tostado en Tena, dado un precio por kg cps. */
export function costoLbTena(precioKgCps: number = SUPUESTOS.precioCpsReferencia, precioLb: number = SUPUESTOS.precioLbPremium) {
  const grano = (precioKgCps * SUPUESTOS.factorCpsVerde) / lbPorKgVerde;
  const energia = (SUPUESTOS.energiaKgCps * SUPUESTOS.factorCpsVerde) / lbPorKgVerde;
  const flete = SUPUESTOS.fleteKgTostado / LB_POR_KG;
  const otros = otrosVariables * precioLb;
  return grano + energia + empaqueLb + flete + otros;
}

/** Margen por libra del premium de Tena. */
export function margenLbTena(precioKgCps: number = SUPUESTOS.precioCpsReferencia, precioLb: number = SUPUESTOS.precioLbPremium) {
  return precioLb - costoLbTena(precioKgCps, precioLb);
}

/** Margen por libra hoy con la maquila. */
export function margenLbMaquila(linea: "premium" | "institucional", precioLb?: number) {
  if (linea === "premium") {
    const p = precioLb ?? SUPUESTOS.precioLbPremium;
    return p - SUPUESTOS.costoLbPremiumMaquila - otrosVariables * p;
  }
  const p = precioLb ?? SUPUESTOS.precioLbInstitucional;
  return p - SUPUESTOS.costoLbInstitucionalMaquila - otrosVariables * p;
}

export type Destino = "sustituir" | "migrar" | "nuevo";

/** Margen adicional por kg verde según el destino del café de Tena. */
export function margenKgVerde(destino: Destino, precioKgCps: number = SUPUESTOS.precioCpsReferencia) {
  const tena = margenLbTena(precioKgCps);
  const base = destino === "sustituir" ? margenLbMaquila("premium") : destino === "migrar" ? margenLbMaquila("institucional") : 0;
  return (tena - base) * lbPorKgVerde;
}

/** Techo de compra: precio del kg cps al que el margen adicional del destino llega a cero. */
export function techoCompra(destino: Destino) {
  return SUPUESTOS.precioCpsReferencia + margenKgVerde(destino) / SUPUESTOS.factorCpsVerde;
}

/** Convierte un precio registrado a $ por kg cps y a $ por kg verde. */
export function normalizarPrecio(precioKg: number, unidad: "cps" | "verde") {
  const porCps = unidad === "cps" ? precioKg : precioKg / SUPUESTOS.factorCpsVerde;
  return { porCps, porVerde: porCps * SUPUESTOS.factorCpsVerde };
}

/** Kg verde equivalentes a unos kg comprados en la unidad dada. */
export function kgVerde(kilos: number, unidad: "cps" | "verde") {
  return unidad === "verde" ? kilos : kilos / SUPUESTOS.factorCpsVerde;
}

/** Escalera de inversión: cifras a régimen del libro de la Etapa 3 (lectura conservadora del precio). */
export const ESCALERA = [
  {
    n: 1,
    nombre: "Sustituir",
    kgVerdeMes: 80,
    financiacion: 6768000,
    aporteAnual: 3159864.59,
    condiciones: ["Prueba de taza aprobada", "Costo por kilo bajo el techo", "Tres meses sin reclamos de clientes premium"],
  },
  { n: 2, nombre: "Migrar", kgVerdeMes: 220, financiacion: 18612000, aporteAnual: 12005029.14, condiciones: ["La mitad del institucional acepta y se mantiene tres meses", "Empaque diferenciado listo", "Financiación comprometida para el escenario 3"] },
  { n: 3, nombre: "Crecer", kgVerdeMes: 820, financiacion: 104865301.28, aporteAnual: 52272222.1, condiciones: ["Gestor sobre 368 kg nuevos al mes antes del mes 7", "600 kg nuevos en el mes 12", "Acuerdos de compra para el escenario 4"] },
  { n: 4, nombre: "Escalar", kgVerdeMes: 1720, financiacion: 243206917.04, aporteAnual: 112673011.55, condiciones: ["Oferta de pergamino asegurada", "Política de precio funcionando con los clientes"] },
] as const;
