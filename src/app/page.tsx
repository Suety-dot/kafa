import Link from "next/link";
import { AlertTriangle, Camera, CheckCircle2, Flame, ShoppingBag, Truck } from "lucide-react";
import { Encabezado } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { almacen } from "@/lib/store";
import { calcular, fmt, pct, pesos } from "@/lib/metricas";
import { margenLbTena } from "@/lib/modelo";
import { sesionActual } from "@/lib/sesion-servidor";
import { primerNombre } from "@/lib/sesion";
import { salir } from "@/app/acciones";
import { LogOut, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const MENSAJE: Record<string, string> = {
  compra: "Compra guardada",
  bache: "Bache guardado",
  venta: "Venta guardada",
  gasto: "Gasto guardado",
};

export default async function Inicio({ searchParams }: { searchParams: Promise<{ guardado?: string }> }) {
  const { guardado } = await searchParams;
  const yo = await sesionActual();
  const d = await almacen().leerTodo();
  const m = calcular(d);
  const ultimo = m.compras.recientes.at(-1);

  const registros = [
    ...d.compras.map((c) => ({ f: c.fecha, h: c.creado ?? "", t: `Compra · ${c.caficultor}`, s: `${c.calidad} · ${fmt(c.kilos)} kg ${c.unidad === "cps" ? "pergamino" : "verde"}`, v: pesos(c.kilos * c.precioKg) })),
    ...d.baches.map((b) => ({ f: b.fecha, h: b.creado ?? "", t: `Bache · ${b.tipo === "servicio" ? "servicio" : "café propio"}`, s: `${fmt(b.kilosCps)} kg cps · ${b.minutos} min`, v: b.tipo === "servicio" ? pesos(b.kilosCps * 3800) : "" })),
    ...d.ventas.map((v) => ({ f: v.fecha, h: v.creado ?? "", t: `Venta · ${v.cliente}`, s: `${v.linea} · ${fmt(v.libras)} lb`, v: pesos(v.libras * v.precioLb) })),
  ]
    .sort((a, b) => b.f.localeCompare(a.f) || b.h.localeCompare(a.h))
    .slice(0, 5);

  const acciones = [
    { href: "/registrar/compra", label: "Compra", icon: Camera, primaria: true },
    { href: "/registrar/bache", label: "Bache", icon: Flame },
    { href: "/registrar/venta", label: "Venta", icon: ShoppingBag },
    { href: "/registrar/gasto", label: "Flete o gasto", icon: Truck },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-6">
      <Encabezado
        titulo={yo ? `Hola, ${primerNombre(yo.nombre)}` : "Hola"}
        sub={new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" }).format(new Date())}
        accion={
          <div className="flex gap-2 md:hidden">
            {yo?.rol === "admin" ? (
              <Link href="/usuarios" className="flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground">
                <Users className="size-4" aria-hidden /> Usuarios
              </Link>
            ) : null}
            <form action={salir}>
              <button type="submit" className="flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground">
                <LogOut className="size-4" aria-hidden /> Salir
              </button>
            </form>
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-5 md:px-8">
        {guardado && MENSAJE[guardado] ? (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-ok-bg px-4 py-3 text-sm font-medium text-ok-fg">
            <CheckCircle2 className="size-4" aria-hidden /> {MENSAJE[guardado]}
          </div>
        ) : null}

        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Este mes</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Dato valor={`${fmt(m.torrefactora.kgCpsMes)} kg`} etiqueta="pergamino procesado" />
            <Dato valor={pct(m.torrefactora.usoMes)} etiqueta="uso de la torrefactora" />
            <Dato valor={`${fmt(m.fondo.inventarioKgVerde)} kg`} etiqueta="verde en el fondo" />
            <Dato valor={pesos(margenLbTena(m.compras.precioPromedioCps || undefined))} etiqueta="margen por libra en Tena" acento />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-2 bg-ocre" style={{ width: `${Math.min(100, m.torrefactora.usoMes * 100)}%` }} />
          </div>
        </Card>

        {ultimo && ultimo.porCps > ultimo.techo * 0.97 ? (
          <div className="flex gap-3 rounded-xl border border-orange-200 bg-warn-bg p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-700" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-warn-fg">{ultimo.sobreTecho ? "Última compra sobre el techo" : "Última compra cerca del techo"}</p>
              <p className="text-sm text-orange-900">
                El lote del {ultimo.fecha} quedó a {pesos(ultimo.porCps)} por kg cps. El techo para {ultimo.destino === "sustituir" ? "sustituir" : "este destino"} es {pesos(ultimo.techo)}.
              </p>
            </div>
          </div>
        ) : null}

        <p className="text-sm font-semibold text-muted-foreground">Registrar</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {acciones.map(({ href, label, icon: Icon, primaria }) => (
            <Link
              key={href}
              href={href}
              className={
                primaria
                  ? "flex min-h-20 flex-col justify-between rounded-xl bg-primary p-4 text-primary-foreground"
                  : "flex min-h-20 flex-col justify-between rounded-xl border border-border bg-card p-4"
              }
            >
              <Icon className={primaria ? "size-6" : "size-6 text-primary"} aria-hidden />
              <span className="text-[15px] font-semibold">{label}</span>
            </Link>
          ))}
        </div>

        <p className="text-sm font-semibold text-muted-foreground">Últimos registros</p>
        <Card className="divide-y divide-muted">
          {registros.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.t}</p>
                <p className="text-xs text-muted-foreground">
                  {r.f} · {r.s}
                </p>
              </div>
              <span className="tabular shrink-0 text-sm font-semibold">{r.v}</span>
            </div>
          ))}
        </Card>
      </div>
    </main>
  );
}

function Dato({ valor, etiqueta, acento }: { valor: string; etiqueta: string; acento?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`tabular text-2xl font-bold ${acento ? "text-primary" : ""}`}>{valor}</span>
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
    </div>
  );
}
