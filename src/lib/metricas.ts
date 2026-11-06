import { ESCALERA, SUPUESTOS, kgVerde, margenKgVerde, margenLbMaquila, margenLbTena, normalizarPrecio, techoCompra } from "./modelo";
import type { Datos } from "./tipos";

/** Todas las cifras que muestran el tablero y el informe. Se calculan aquí; la IA solo las lee. */

const mesDe = (f: string) => f.slice(0, 7);
const NOMBRE_MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function calcular(d: Datos, hoy = new Date()) {
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  // Torrefactora
  const bachesMes = d.baches.filter((b) => mesDe(b.fecha) === mesActual);
  const kgCpsMes = bachesMes.reduce((s, b) => s + b.kilosCps, 0);
  const usoMes = kgCpsMes / SUPUESTOS.capacidadKgCpsMes;
  const aporteServicioMes = bachesMes
    .filter((b) => b.tipo === "servicio")
    .reduce((s, b) => s + b.kilosCps * (SUPUESTOS.tarifaServicioKgCps - SUPUESTOS.energiaKgCps), 0);
  const minutosPedagogicos = bachesMes.filter((b) => b.pedagogico).reduce((s, b) => s + b.minutos, 0);
  const minutosMes = bachesMes.reduce((s, b) => s + b.minutos, 0);

  const serie = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const f = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    serie.set(`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const b of d.baches) if (serie.has(mesDe(b.fecha))) serie.set(mesDe(b.fecha), serie.get(mesDe(b.fecha))! + b.kilosCps);
  const usoMensual = [...serie.entries()].map(([m, kg]) => ({
    mes: NOMBRE_MES[Number(m.slice(5, 7)) - 1],
    clave: m,
    kgCps: kg,
    uso: kg / SUPUESTOS.capacidadKgCpsMes,
  }));

  // Fondo de grano
  const kgVerdeComprado = d.compras.reduce((s, c) => s + kgVerde(c.kilos, c.unidad), 0);
  const kgVerdeTostado = d.baches.filter((b) => b.tipo === "propio" && d.compras.length && b.fecha >= d.compras[0].fecha)
    .reduce((s, b) => s + b.kilosCps / SUPUESTOS.factorCpsVerde, 0);
  const inventarioKgVerde = Math.max(0, kgVerdeComprado - kgVerdeTostado);
  const escenario = ESCALERA.find((e) => e.n === d.estado.escenario) ?? ESCALERA[0];
  const mesesInventario = inventarioKgVerde / escenario.kgVerdeMes;
  const capitalEnGrano = d.compras.reduce((s, c) => s + c.kilos * c.precioKg, 0) * (kgVerdeComprado ? inventarioKgVerde / kgVerdeComprado : 0);

  // Compras frente al techo
  const compras = [...d.compras]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((c) => {
      const { porCps, porVerde } = normalizarPrecio(c.precioKg, c.unidad);
      const techo = techoCompra(c.destino);
      return { ...c, porCps, porVerde, techo, sobreTecho: porCps > techo, total: c.kilos * c.precioKg };
    });
  const recientes = compras.slice(-8);
  const precioPromedioCps = compras.length
    ? compras.reduce((s, c) => s + c.porCps * kgVerde(c.kilos, c.unidad), 0) / compras.reduce((s, c) => s + kgVerde(c.kilos, c.unidad), 0)
    : 0;
  const sustitucion = compras.filter((c) => c.destino === "sustituir");
  const bajoTecho = sustitucion.filter((c) => !c.sobreTecho).length;

  // Ventas del mes por línea
  const ventasMes = d.ventas.filter((v) => mesDe(v.fecha) === mesActual);
  const grupos = new Map<string, { nombre: string; libras: number; ventas: number; margen: number }>();
  for (const v of ventasMes) {
    const clave = `${v.linea}-${v.origen}`;
    const nombre = `${v.linea === "institucional" ? "Institucional" : v.linea === "premium" ? "Premium" : "Especial"} · ${v.origen === "tena" ? "Tena" : "maquila"}`;
    const margenLb =
      v.origen === "tena" ? margenLbTena(precioPromedioCps || SUPUESTOS.precioCpsReferencia, v.precioLb) : margenLbMaquila(v.linea === "premium" ? "premium" : "institucional", v.precioLb);
    const gr = grupos.get(clave) ?? { nombre, libras: 0, ventas: 0, margen: 0 };
    gr.libras += v.libras;
    gr.ventas += v.libras * v.precioLb;
    gr.margen += v.libras * margenLb;
    grupos.set(clave, gr);
  }
  const lineas = [...grupos.values()].map((g) => ({ ...g, margenLb: g.libras ? g.margen / g.libras : 0 }));
  const ventasTotalMes = lineas.reduce((s, l) => s + l.ventas, 0);
  const margenVentasMes = lineas.reduce((s, l) => s + l.margen, 0);

  // Alertas
  const alertas: { nivel: "alto" | "info"; titulo: string; texto: string }[] = [];
  for (const c of compras.slice(-5)) {
    if (c.sobreTecho)
      alertas.push({
        nivel: "alto",
        titulo: `Compra del ${c.fecha} sobre el techo`,
        texto: `Quedó a $${fmt(c.porCps)} por kg cps; el techo para ${c.destino === "sustituir" ? "sustituir" : c.destino === "migrar" ? "migrar" : "ventas nuevas"} es $${fmt(c.techo)}.${c.destino === "sustituir" ? " Sirve para ventas nuevas." : ""}`,
      });
  }
  // Revisión bimestral de precio: clientes cuyo precio no cambia hace más de 60 días.
  const porCliente = new Map<string, { ultimoCambio: string; precio: number }>();
  for (const v of [...d.ventas].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    const k = `${v.cliente}|${v.linea}`;
    const prev = porCliente.get(k);
    if (!prev || prev.precio !== v.precioLb) porCliente.set(k, { ultimoCambio: v.fecha, precio: v.precioLb });
  }
  for (const [k, x] of porCliente) {
    const dias = (hoy.getTime() - new Date(x.ultimoCambio).getTime()) / 86400000;
    if (dias > 60 && k.endsWith("institucional"))
      alertas.push({ nivel: "info", titulo: `Revisar precio con ${k.split("|")[0]}`, texto: `Su precio no cambia desde el ${x.ultimoCambio}; la política pide revisarlo cada dos meses.` });
  }
  const ventasTenaMes = ventasMes.filter((v) => v.origen === "tena").length;
  const fletesMes = d.gastos.filter((x) => x.tipo === "flete" && mesDe(x.fecha) === mesActual).length;
  if (ventasTenaMes > fletesMes)
    alertas.push({ nivel: "info", titulo: "Fletes sin registrar", texto: `Hay ${ventasTenaMes} ventas de café de Tena este mes y ${fletesMes} fletes registrados.` });

  // Escalera
  const mesesPiloto = d.estado.inicioPiloto ? (hoy.getTime() - new Date(d.estado.inicioPiloto).getTime()) / (30.44 * 86400000) : 0;
  const condiciones =
    escenario.n === 1
      ? [
          { texto: "Prueba de taza aprobada", ok: !!d.estado.tazaAprobada, dato: d.estado.tazaAprobada ?? "Pendiente" },
          { texto: "Costo por kilo bajo el techo", ok: sustitucion.length > 0 && bajoTecho / sustitucion.length >= 0.8, dato: `${bajoTecho} de ${sustitucion.length} lotes` },
          { texto: "Tres meses sin reclamos de clientes premium", ok: mesesPiloto >= 3 && d.estado.reclamosPremium === 0, dato: `Mes ${Math.min(3, Math.floor(mesesPiloto) + 1)} de 3` },
        ]
      : escenario.condiciones.map((t) => ({ texto: t, ok: false, dato: "Por medir" }));

  return {
    mesActual,
    torrefactora: { kgCpsMes, usoMes, aporteServicioMes, bachesMes: bachesMes.length, minutosMes, minutosPedagogicos, usoMensual },
    fondo: { inventarioKgVerde, mesesInventario, capitalEnGrano, objetivoKgVerdeMes: escenario.kgVerdeMes },
    compras: { recientes, precioPromedioCps, total: compras.length },
    techos: { sustituir: techoCompra("sustituir"), migrar: techoCompra("migrar"), nuevo: techoCompra("nuevo") },
    margenes: { sustituir: margenKgVerde("sustituir"), migrar: margenKgVerde("migrar"), nuevo: margenKgVerde("nuevo") },
    ventas: { lineas, ventasTotalMes, margenVentasMes },
    alertas,
    escalera: { actual: escenario.n, escenarios: ESCALERA, condiciones },
  };
}

export type Metricas = ReturnType<typeof calcular>;

export function fmt(n: number, dec = 0) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
}
export const pesos = (n: number) => (n < 0 ? `($${fmt(-n)})` : `$${fmt(n)}`);
export const millones = (n: number, dec = 1) => (n < 0 ? `($${fmt(-n / 1e6, dec)}M)` : `$${fmt(n / 1e6, dec)}M`);
export const pct = (x: number, dec = 0) => `${fmt(x * 100, dec)}%`;

/** Fecha de hoy en Colombia, AAAA-MM-DD. */
export const hoyISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
