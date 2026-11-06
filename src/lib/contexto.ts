import type { Metricas } from "./metricas";
import type { Datos } from "./tipos";

const r0 = (n: number) => Math.round(n);
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Cifras ya calculadas que recibe la IA para redactar. Solo identificadores, nunca nombres. */
export function cifrasParaIa(m: Metricas) {
  return {
    torrefactora: {
      kgPergaminoProcesadosMes: r0(m.torrefactora.kgCpsMes),
      usoCapacidadMes: r3(m.torrefactora.usoMes),
      usoEquilibrio: 0.263,
      baches: m.torrefactora.bachesMes,
      aporteServicioMes: r0(m.torrefactora.aporteServicioMes),
      partePedagogicaDelTiempo: m.torrefactora.minutosMes ? r3(m.torrefactora.minutosPedagogicos / m.torrefactora.minutosMes) : 0,
      usoMensualUltimos12: m.torrefactora.usoMensual.map((u) => ({ mes: u.clave, uso: r3(u.uso) })),
    },
    fondo: { inventarioKgVerde: r0(m.fondo.inventarioKgVerde), mesesDeInventario: Math.round(m.fondo.mesesInventario * 10) / 10, capitalEnGrano: r0(m.fondo.capitalEnGrano) },
    compras: {
      precioPromedioKgPergamino: r0(m.compras.precioPromedioCps),
      techos: { sustituir: r0(m.techos.sustituir), migrar: r0(m.techos.migrar), ventaNueva: r0(m.techos.nuevo) },
      lotes: m.compras.recientes.map((c) => ({ fecha: c.fecha, caficultor: c.caficultor, calidad: c.calidad, kilos: c.kilos, unidad: c.unidad, precioKgPergamino: r0(c.porCps), destino: c.destino, sobreTecho: c.sobreTecho })),
    },
    ventas: { totalMes: r0(m.ventas.ventasTotalMes), margenMes: r0(m.ventas.margenVentasMes), lineas: m.ventas.lineas.map((l) => ({ linea: l.nombre, libras: r0(l.libras), margenPorLibra: r0(l.margenLb) })) },
    escalera: { escenarioActual: m.escalera.actual, condiciones: m.escalera.condiciones },
    alertas: m.alertas.map((a) => a.titulo + ": " + a.texto),
  };
}

/** Datos para responder preguntas: cifras calculadas y registros recientes con identificadores. */
export function contextoPreguntas(d: Datos, m: Metricas) {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - 3);
  const corte = desde.toISOString().slice(0, 10);
  const porMes = new Map<string, { baches: number; kgPergamino: number }>();
  for (const b of d.baches) {
    const k = b.fecha.slice(0, 7);
    const x = porMes.get(k) ?? { baches: 0, kgPergamino: 0 };
    x.baches += 1;
    x.kgPergamino += b.kilosCps;
    porMes.set(k, x);
  }
  return {
    cifras: cifrasParaIa(m),
    compras: d.compras,
    ventasUltimosTresMeses: d.ventas.filter((v) => v.fecha >= corte),
    gastosUltimosTresMeses: d.gastos.filter((g) => g.fecha >= corte),
    bachesPorMes: Object.fromEntries(porMes),
  };
}
