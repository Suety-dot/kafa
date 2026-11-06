import type { Bache, Compra, Datos, Gasto, Venta } from "../tipos";

/**
 * Datos de ejemplo para la demostración. No son datos reales de la Fundación:
 * siguen el patrón de estacionalidad y los precios del libro de la Etapa 3.
 */

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Uso mensual de la torrefactora (% de la capacidad) por mes del año, enero = 0. */
const USO_MES = [0.1, 0.09, 0.11, 0.15, 0.25, 0.16, 0.28, 0.31, 0.3, 0.27, 0.2, 0.14];

export function datosDeEjemplo(hoy = new Date()): Datos {
  const baches: Bache[] = [];
  const compras: Compra[] = [];
  const ventas: Venta[] = [];
  const gastos: Gasto[] = [];
  let id = 1;
  const nid = (p: string) => `${p}${id++}`;
  const operadoresTipo = [["José"], ["Alibrio"], ["José", "Estudiantes en práctica"], ["Michael"], ["Alibrio", "Estudiantes en práctica"]];

  // Once meses hacia atrás más el mes en curso hasta hoy.
  for (let m = 11; m >= 0; m--) {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1);
    const diasMes = m === 0 ? hoy.getDate() : new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate();
    const kgObjetivo = USO_MES[inicio.getMonth()] * 10560 * (diasMes / new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate());
    const nBaches = Math.max(1, Math.round(kgObjetivo / 15));
    for (let b = 0; b < nBaches; b++) {
      const dia = 1 + Math.floor((b * diasMes) / nBaches);
      const servicio = b % 5 !== 0;
      baches.push({
        id: nid("b"),
        fecha: iso(new Date(inicio.getFullYear(), inicio.getMonth(), dia)),
        tipo: servicio ? "servicio" : "propio",
        caficultor: servicio ? `Caficultor ${pad(10 + (b % 37))}` : null,
        kilosCps: 15,
        minutos: 15,
        perfil: b % 3 === 0 ? "claro" : "medio",
        operadores: operadoresTipo[b % operadoresTipo.length],
        pedagogico: b % 3 === 2,
      });
    }

    // Ventas de Café Bogotá: institucional de la maquila y premium; especial de Tena.
    const clientes = ["Cliente 01", "Cliente 03", "Cliente 05", "Cliente 07", "Cliente 11"];
    clientes.forEach((cliente, i) => {
      const dia = Math.min(diasMes, 3 + i * 5);
      const subio = m <= 2 ? 500 : 0; // un ajuste de precio hace dos meses
      ventas.push({ id: nid("v"), fecha: iso(new Date(inicio.getFullYear(), inicio.getMonth(), dia)), cliente, linea: "institucional", origen: "maquila", libras: [140, 120, 90, 80, 76][i], precioLb: 25500 + (i === 1 ? 0 : subio) });
    });
    ventas.push({ id: nid("v"), fecha: iso(new Date(inicio.getFullYear(), inicio.getMonth(), Math.min(diasMes, 6))), cliente: "Cliente 03", linea: "premium", origen: m <= 1 ? "tena" : "maquila", libras: 145, precioLb: 30800 });
    ventas.push({ id: nid("v"), fecha: iso(new Date(inicio.getFullYear(), inicio.getMonth(), Math.min(diasMes, 12))), cliente: "Cliente 09", linea: "especial", origen: "tena", libras: 72, precioLb: 45000 });

    if (m <= 1) gastos.push({ id: nid("g"), fecha: iso(new Date(inicio.getFullYear(), inicio.getMonth(), Math.min(diasMes, 7))), tipo: "flete", valor: 66000, descripcion: "Envío Tena a Bogotá" });
    gastos.push({ id: nid("g"), fecha: iso(new Date(inicio.getFullYear(), inicio.getMonth(), Math.min(diasMes, 20))), tipo: "energia", valor: 2040000, descripcion: "Gas propano, 510 kg" });
  }

  // Compras del fondo al cierre de la cosecha (últimas semanas).
  const lotes: [number, number, number][] = [
    [-9, 24800, 60],
    [-7, 25100, 50],
    [-6, 23900, 40],
    [-5, 25400, 50],
    [-3, 26600, 40],
    [-2, 25900, 48],
  ];
  lotes.forEach(([d, precio, kilos], i) => {
    const f = new Date(hoy);
    f.setDate(f.getDate() + d);
    compras.push({ id: nid("c"), fecha: iso(f), caficultor: `Caficultor ${pad(17 + i * 4)}`, calidad: "premium", unidad: "cps", kilos, precioKg: precio, destino: "sustituir", leidaPorIa: i % 2 === 0 });
  });

  const inicioPiloto = new Date(hoy);
  inicioPiloto.setDate(inicioPiloto.getDate() - 40);
  const taza = new Date(hoy);
  taza.setDate(taza.getDate() - 12);

  return {
    compras,
    baches,
    ventas,
    gastos,
    estado: { escenario: 1, tazaAprobada: iso(taza), inicioPiloto: iso(inicioPiloto), reclamosPremium: 0 },
  };
}
