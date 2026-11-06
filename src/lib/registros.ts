import { normalizarPrecio, techoCompra } from "./modelo";
import type { Datos } from "./tipos";
import { fmt, pesos } from "./metricas";

/** Tablas de transacciones: columnas, filas y totales por tipo de registro. */

export type Tipo = "compras" | "baches" | "ventas" | "gastos";
export const TIPOS: { id: Tipo; nombre: string }[] = [
  { id: "compras", nombre: "Compras" },
  { id: "baches", nombre: "Baches" },
  { id: "ventas", nombre: "Ventas" },
  { id: "gastos", nombre: "Fletes y gastos" },
];

export interface Columna {
  titulo: string;
  num?: boolean;
}
export interface Tabla {
  columnas: Columna[];
  filas: { celdas: (string | number)[]; texto: (string)[]; alerta?: boolean }[];
  total: string[];
}

const orden = <T extends { fecha: string; creado?: string }>(a: T, b: T) => b.fecha.localeCompare(a.fecha) || (b.creado ?? "").localeCompare(a.creado ?? "");

const CALIDAD: Record<string, string> = { consumo: "Consumo", excelso: "Excelso", premium: "Premium", especial: "Especial" };
const DESTINO: Record<string, string> = { sustituir: "Sustituir", migrar: "Migrar", nuevo: "Venta nueva" };
const LINEA: Record<string, string> = { institucional: "Institucional", premium: "Premium", especial: "Especial" };
const GASTO: Record<string, string> = { flete: "Flete", energia: "Energía", mantenimiento: "Mantenimiento", otro: "Otro" };

export function tabla(d: Datos, tipo: Tipo, mes: string, q: string): Tabla {
  const enMes = (f: string) => mes === "todos" || f.startsWith(mes);
  const busca = (...xs: (string | null | undefined)[]) => !q || xs.some((x) => (x ?? "").toLowerCase().includes(q.toLowerCase()));

  if (tipo === "compras") {
    const xs = d.compras.filter((c) => enMes(c.fecha) && busca(c.caficultor, c.calidad, c.registradoPor)).sort(orden);
    const kilos = xs.reduce((s, c) => s + c.kilos, 0);
    const total = xs.reduce((s, c) => s + c.kilos * c.precioKg, 0);
    return {
      columnas: [{ titulo: "Fecha" }, { titulo: "Caficultor" }, { titulo: "Calidad" }, { titulo: "Unidad" }, { titulo: "Kilos", num: true }, { titulo: "Precio por kilo", num: true }, { titulo: "Por kg pergamino", num: true }, { titulo: "Total", num: true }, { titulo: "Destino" }, { titulo: "Techo" }, { titulo: "Leída por IA" }, { titulo: "Registró" }],
      filas: xs.map((c) => {
        const { porCps } = normalizarPrecio(c.precioKg, c.unidad);
        const sobre = porCps > techoCompra(c.destino);
        return {
          alerta: sobre,
          celdas: [],
          texto: [c.fecha, c.caficultor, CALIDAD[c.calidad] ?? c.calidad, c.unidad === "cps" ? "Pergamino" : "Verde", fmt(c.kilos, 1).replace(/,0$/, ""), pesos(c.precioKg), pesos(porCps), pesos(c.kilos * c.precioKg), DESTINO[c.destino] ?? c.destino, sobre ? "Sobre el techo" : "Bajo el techo", c.leidaPorIa ? "Sí" : "No", c.registradoPor ?? ""],
        };
      }),
      total: [`${xs.length} compras`, "", "", "", fmt(kilos), "", "", pesos(total), "", "", "", ""],
    };
  }
  if (tipo === "baches") {
    const xs = d.baches.filter((b) => enMes(b.fecha) && busca(b.caficultor, b.operadores.join(" "), b.registradoPor, b.tipo)).sort(orden);
    const kg = xs.reduce((s, b) => s + b.kilosCps, 0);
    const min = xs.reduce((s, b) => s + b.minutos, 0);
    return {
      columnas: [{ titulo: "Fecha" }, { titulo: "Tipo" }, { titulo: "Caficultor" }, { titulo: "Kg pergamino", num: true }, { titulo: "Minutos", num: true }, { titulo: "Perfil" }, { titulo: "Quién lo hizo" }, { titulo: "Práctica pedagógica" }, { titulo: "Ingreso", num: true }, { titulo: "Registró" }],
      filas: xs.map((b) => ({
        celdas: [],
        texto: [b.fecha, b.tipo === "servicio" ? "Servicio" : "Café propio", b.caficultor ?? "", fmt(b.kilosCps, 1).replace(/,0$/, ""), String(b.minutos), b.perfil[0].toUpperCase() + b.perfil.slice(1), b.operadores.join(", "), b.pedagogico ? "Sí" : "No", b.tipo === "servicio" ? pesos(b.kilosCps * 3800) : "", b.registradoPor ?? ""],
      })),
      total: [`${xs.length} baches`, "", "", fmt(kg), fmt(min), "", "", `${xs.filter((b) => b.pedagogico).length} pedagógicos`, pesos(xs.filter((b) => b.tipo === "servicio").reduce((s, b) => s + b.kilosCps * 3800, 0)), ""],
    };
  }
  if (tipo === "ventas") {
    const xs = d.ventas.filter((v) => enMes(v.fecha) && busca(v.cliente, v.linea, v.registradoPor)).sort(orden);
    const lb = xs.reduce((s, v) => s + v.libras, 0);
    const total = xs.reduce((s, v) => s + v.libras * v.precioLb, 0);
    return {
      columnas: [{ titulo: "Fecha" }, { titulo: "Cliente" }, { titulo: "Línea" }, { titulo: "Tostado en" }, { titulo: "Libras", num: true }, { titulo: "Precio por libra", num: true }, { titulo: "Total", num: true }, { titulo: "Registró" }],
      filas: xs.map((v) => ({ celdas: [], texto: [v.fecha, v.cliente, LINEA[v.linea] ?? v.linea, v.origen === "tena" ? "Tena" : "Maquila", fmt(v.libras, 1).replace(/,0$/, ""), pesos(v.precioLb), pesos(v.libras * v.precioLb), v.registradoPor ?? ""] })),
      total: [`${xs.length} ventas`, "", "", "", fmt(lb), "", pesos(total), ""],
    };
  }
  const xs = d.gastos.filter((g) => enMes(g.fecha) && busca(g.descripcion, g.tipo, g.registradoPor)).sort(orden);
  return {
    columnas: [{ titulo: "Fecha" }, { titulo: "Tipo" }, { titulo: "Descripción" }, { titulo: "Valor", num: true }, { titulo: "Registró" }],
    filas: xs.map((g) => ({ celdas: [], texto: [g.fecha, GASTO[g.tipo] ?? g.tipo, g.descripcion ?? "", pesos(g.valor), g.registradoPor ?? ""] })),
    total: [`${xs.length} registros`, "", "", pesos(xs.reduce((s, g) => s + g.valor, 0)), ""],
  };
}

export function mesesDisponibles(d: Datos) {
  const s = new Set<string>();
  for (const x of [...d.compras, ...d.baches, ...d.ventas, ...d.gastos]) s.add(x.fecha.slice(0, 7));
  return [...s].sort().reverse();
}

export const nombreMes = (m: string) =>
  new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`));
