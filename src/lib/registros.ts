import { normalizarPrecio, techoCompra } from "./modelo";
import type { Datos } from "./tipos";
import { fmt, pesos } from "./metricas";

/** Tablas de transacciones: columnas, filas y totales por tipo de registro. */

export type Tipo = "compras" | "baches" | "ventas" | "gastos";
export const TIPOS: { id: Tipo; nombre: string }[] = [
  { id: "compras", nombre: "Compras" },
  { id: "baches", nombre: "Baches" },
  { id: "ventas", nombre: "Ventas" },
  { id: "gastos", nombre: "Gastos" },
];

export interface Columna {
  titulo: string;
  num?: boolean;
}
export interface Fila {
  celdas: (string | number)[];
  /** Texto de cada columna; la primera es la fecha AAAA-MM-DD (así sale en el CSV). */
  texto: string[];
  alerta?: boolean;
  /** Vista compacta para el celular. */
  movil: { titulo: string; detalle: string; valor: string };
}
export interface Tabla {
  columnas: Columna[];
  filas: Fila[];
  total: string[];
  /** Cifras del periodo filtrado para la franja de resumen. */
  resumen: { etiqueta: string; valor: string }[];
}

const pl = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

const orden = <T extends { fecha: string; creado?: string }>(a: T, b: T) => b.fecha.localeCompare(a.fecha) || (b.creado ?? "").localeCompare(a.creado ?? "");

const CALIDAD: Record<string, string> = { consumo: "Consumo", excelso: "Excelso", premium: "Premium", especial: "Especial" };
const DESTINO: Record<string, string> = { sustituir: "Sustituir", migrar: "Migrar", nuevo: "Venta nueva" };
const LINEA: Record<string, string> = { institucional: "Institucional", premium: "Premium", especial: "Especial" };
const GASTO: Record<string, string> = { flete: "Flete", energia: "Energía", mantenimiento: "Mantenimiento", otro: "Otro" };

export function tabla(d: Datos, tipo: Tipo, mes: string, cuenta: string, nombres: Record<string, string> = {}): Tabla {
  const enMes = (f: string) => mes === "todos" || f.startsWith(mes);
  const deCuenta = (r?: string | null) => cuenta === "todas" || (r ?? "") === cuenta;
  const quien = (r?: string | null) => (r ? nombres[r] ?? r : "");

  if (tipo === "compras") {
    const xs = d.compras.filter((c) => enMes(c.fecha) && deCuenta(c.registradoPor)).sort(orden);
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
          texto: [c.fecha, c.caficultor, CALIDAD[c.calidad] ?? c.calidad, c.unidad === "cps" ? "Pergamino" : "Verde", fmt(c.kilos, 1).replace(/,0$/, ""), pesos(c.precioKg), pesos(porCps), pesos(c.kilos * c.precioKg), DESTINO[c.destino] ?? c.destino, sobre ? "Sobre el techo" : "Bajo el techo", c.leidaPorIa ? "Sí" : "No", quien(c.registradoPor)],
          movil: {
            titulo: c.caficultor,
            detalle: `${CALIDAD[c.calidad] ?? c.calidad} · ${fmt(c.kilos, 1).replace(/,0$/, "")} kg ${c.unidad === "cps" ? "pergamino" : "verde"} a ${pesos(c.precioKg)}${sobre ? " · sobre el techo" : ""}`,
            valor: pesos(c.kilos * c.precioKg),
          },
        };
      }),
      total: [pl(xs.length, "compra", "compras"), "", "", "", fmt(kilos), "", "", pesos(total), "", "", "", ""],
      resumen: [
        { etiqueta: "Compras", valor: String(xs.length) },
        { etiqueta: "Kilos", valor: fmt(kilos) },
        { etiqueta: "Total pagado", valor: pesos(total) },
      ],
    };
  }
  if (tipo === "baches") {
    const xs = d.baches.filter((b) => enMes(b.fecha) && deCuenta(b.registradoPor)).sort(orden);
    const kg = xs.reduce((s, b) => s + b.kilosCps, 0);
    const min = xs.reduce((s, b) => s + b.minutos, 0);
    return {
      columnas: [{ titulo: "Fecha" }, { titulo: "Tipo" }, { titulo: "Caficultor" }, { titulo: "Kg pergamino", num: true }, { titulo: "Minutos", num: true }, { titulo: "Perfil" }, { titulo: "Quién lo hizo" }, { titulo: "Práctica pedagógica" }, { titulo: "Ingreso", num: true }, { titulo: "Registró" }],
      filas: xs.map((b) => ({
        celdas: [],
        texto: [b.fecha, b.tipo === "servicio" ? "Servicio" : "Café propio", b.caficultor ?? "", fmt(b.kilosCps, 1).replace(/,0$/, ""), String(b.minutos), b.perfil[0].toUpperCase() + b.perfil.slice(1), b.operadores.join(", "), b.pedagogico ? "Sí" : "No", b.tipo === "servicio" ? pesos(b.kilosCps * 3800) : "", quien(b.registradoPor)],
        movil: {
          titulo: b.tipo === "servicio" ? b.caficultor || "Servicio" : "Café de la Fundación",
          detalle: `${fmt(b.kilosCps, 1).replace(/,0$/, "")} kg · ${b.minutos} min · ${b.perfil}${b.pedagogico ? " · práctica" : ""}`,
          valor: b.tipo === "servicio" ? pesos(b.kilosCps * 3800) : "",
        },
      })),
      total: [pl(xs.length, "bache", "baches"), "", "", fmt(kg), fmt(min), "", "", pl(xs.filter((b) => b.pedagogico).length, "pedagógico", "pedagógicos"), pesos(xs.filter((b) => b.tipo === "servicio").reduce((s, b) => s + b.kilosCps * 3800, 0)), ""],
      resumen: [
        { etiqueta: "Baches", valor: fmt(xs.length) },
        { etiqueta: "Kg pergamino", valor: fmt(kg) },
        { etiqueta: "Ingreso por servicio", valor: pesos(xs.filter((b) => b.tipo === "servicio").reduce((s, b) => s + b.kilosCps * 3800, 0)) },
      ],
    };
  }
  if (tipo === "ventas") {
    const xs = d.ventas.filter((v) => enMes(v.fecha) && deCuenta(v.registradoPor)).sort(orden);
    const lb = xs.reduce((s, v) => s + v.libras, 0);
    const total = xs.reduce((s, v) => s + v.libras * v.precioLb, 0);
    return {
      columnas: [{ titulo: "Fecha" }, { titulo: "Cliente" }, { titulo: "Línea" }, { titulo: "Tostado en" }, { titulo: "Libras", num: true }, { titulo: "Precio por libra", num: true }, { titulo: "Total", num: true }, { titulo: "Registró" }],
      filas: xs.map((v) => ({
        celdas: [],
        texto: [v.fecha, v.cliente, LINEA[v.linea] ?? v.linea, v.origen === "tena" ? "Tena" : "Maquila", fmt(v.libras, 1).replace(/,0$/, ""), pesos(v.precioLb), pesos(v.libras * v.precioLb), quien(v.registradoPor)],
        movil: { titulo: v.cliente, detalle: `${LINEA[v.linea] ?? v.linea} · ${fmt(v.libras, 1).replace(/,0$/, "")} lb a ${pesos(v.precioLb)} · ${v.origen === "tena" ? "Tena" : "maquila"}`, valor: pesos(v.libras * v.precioLb) },
      })),
      total: [pl(xs.length, "venta", "ventas"), "", "", "", fmt(lb), "", pesos(total), ""],
      resumen: [
        { etiqueta: "Ventas", valor: String(xs.length) },
        { etiqueta: "Libras", valor: fmt(lb) },
        { etiqueta: "Total vendido", valor: pesos(total) },
      ],
    };
  }
  const xs = d.gastos.filter((g) => enMes(g.fecha) && deCuenta(g.registradoPor)).sort(orden);
  return {
    columnas: [{ titulo: "Fecha" }, { titulo: "Tipo" }, { titulo: "Descripción" }, { titulo: "Valor", num: true }, { titulo: "Registró" }],
    filas: xs.map((g) => ({
      celdas: [],
      texto: [g.fecha, GASTO[g.tipo] ?? g.tipo, g.descripcion ?? "", pesos(g.valor), quien(g.registradoPor)],
      movil: { titulo: g.descripcion || (GASTO[g.tipo] ?? g.tipo), detalle: GASTO[g.tipo] ?? g.tipo, valor: pesos(g.valor) },
    })),
    total: [pl(xs.length, "registro", "registros"), "", "", pesos(xs.reduce((s, g) => s + g.valor, 0)), ""],
    resumen: [
      { etiqueta: "Gastos", valor: String(xs.length) },
      { etiqueta: "Fletes", valor: String(xs.filter((g) => g.tipo === "flete").length) },
      { etiqueta: "Total", valor: pesos(xs.reduce((s, g) => s + g.valor, 0)) },
    ],
  };
}

export function mesesDisponibles(d: Datos) {
  const s = new Set<string>();
  for (const x of [...d.compras, ...d.baches, ...d.ventas, ...d.gastos]) s.add(x.fecha.slice(0, 7));
  return [...s].sort().reverse();
}

export const mesCorto = (m: string) => {
  const t = new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`)).replace(".", "");
  return `${t[0].toUpperCase()}${t.slice(1)} ${m.slice(2, 4)}`;
};

export const nombreMes = (m: string) =>
  new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-15T12:00:00Z`));
