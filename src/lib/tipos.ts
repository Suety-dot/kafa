export type Calidad = "consumo" | "excelso" | "premium" | "especial";
export type Unidad = "cps" | "verde";
export type Destino = "sustituir" | "migrar" | "nuevo";
export type Linea = "institucional" | "premium" | "especial";
export type Origen = "maquila" | "tena";
export type TipoGasto = "flete" | "energia" | "mantenimiento" | "otro";

/** Caficultores y clientes se guardan con un identificador, nunca con su nombre (regla de privacidad del proyecto). */
export interface Compra {
  id: string;
  fecha: string; // AAAA-MM-DD
  /** Momento en que se guardó el registro (ISO); ordena los del mismo día. */
  creado?: string;
  caficultor: string;
  calidad: Calidad;
  unidad: Unidad;
  kilos: number;
  precioKg: number;
  destino: Destino;
  nota?: string | null;
  leidaPorIa?: boolean;
}

export interface Bache {
  id: string;
  fecha: string; // AAAA-MM-DD
  /** Momento en que se guardó el registro (ISO); ordena los del mismo día. */
  creado?: string;
  tipo: "servicio" | "propio";
  caficultor?: string | null;
  kilosCps: number;
  minutos: number;
  perfil: "claro" | "medio" | "oscuro";
  operadores: string[];
  pedagogico: boolean;
}

export interface Venta {
  id: string;
  fecha: string; // AAAA-MM-DD
  /** Momento en que se guardó el registro (ISO); ordena los del mismo día. */
  creado?: string;
  cliente: string;
  linea: Linea;
  origen: Origen;
  libras: number;
  precioLb: number;
}

export interface Gasto {
  id: string;
  fecha: string; // AAAA-MM-DD
  /** Momento en que se guardó el registro (ISO); ordena los del mismo día. */
  creado?: string;
  tipo: TipoGasto;
  valor: number;
  descripcion?: string | null;
}

export interface Estado {
  escenario: number;
  tazaAprobada: string | null;
  inicioPiloto: string | null;
  reclamosPremium: number;
}

export interface Datos {
  compras: Compra[];
  baches: Bache[];
  ventas: Venta[];
  gastos: Gasto[];
  estado: Estado;
}
