import { Encabezado } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { almacen } from "@/lib/store";
import { calcular, fmt, millones, pct, pesos } from "@/lib/metricas";
import { SUPUESTOS } from "@/lib/modelo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Tablero() {
  const m = calcular(await almacen().leerTodo());
  const escalaCompra = Math.max(m.techos.sustituir * 1.15, ...m.compras.recientes.map((c) => c.porCps * 1.05));
  const maxUso = Math.max(0.35, ...m.torrefactora.usoMensual.map((u) => u.uso)) * 1.1;

  return (
    <main className="mx-auto w-full max-w-6xl pb-8">
      <Encabezado titulo="Tablero del café" sub={`Mes en curso · ${m.mesActual}`} />
      <div className="flex flex-col gap-4 px-5 md:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi etiqueta="Margen por kilo verde · venta nueva" valor={pesos(m.margenes.nuevo)} nota={`Sustituir deja ${pesos(m.margenes.sustituir)}`} />
          <Kpi etiqueta="Uso de la torrefactora" valor={pct(m.torrefactora.usoMes)} nota={`Equilibrio a costo completo: ${pct(SUPUESTOS.usoEquilibrio)}`} />
          <Kpi etiqueta="Inventario del fondo" valor={`${fmt(m.fondo.mesesInventario, 1)} meses`} nota={`${fmt(m.fondo.inventarioKgVerde)} kg verde · objetivo ${SUPUESTOS.mesesInventario} meses`} />
          <Kpi etiqueta="Aporte del servicio este mes" valor={pesos(m.torrefactora.aporteServicioMes)} nota={`${m.torrefactora.bachesMes} baches`} />
        </div>

        <Card>
          <CardHeader className="flex-row flex-wrap items-baseline justify-between">
            <CardTitle>Escalera de inversión</CardTitle>
            <CardDescription>En curso: escenario {m.escalera.actual}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {m.escalera.escenarios.map((e) => (
                <div key={e.n} className="flex flex-col gap-1.5">
                  <div className={cn("h-2 rounded-full", e.n === m.escalera.actual ? "bg-ocre" : e.n < m.escalera.actual ? "bg-[#d9c7a6]" : "bg-border")} />
                  <span className="text-sm font-semibold">
                    {e.n} · {e.nombre}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {fmt(e.kgVerdeMes)} kg al mes · {millones(e.financiacion)} · {millones(e.aporteAnual)} al año
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-muted pt-4">
              <p className="text-sm font-semibold">Condición para pasar al escenario {m.escalera.actual + 1}</p>
              {m.escalera.condiciones.map((c) => (
                <div key={c.texto} className="flex items-center gap-3 text-sm">
                  <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white", c.ok ? "bg-green-700" : "bg-zinc-500")} aria-hidden>
                    {c.ok ? "✓" : "·"}
                  </span>
                  <span className="flex-1">{c.texto}</span>
                  <span className="text-muted-foreground">{c.dato}</span>
                  <span className="sr-only">{c.ok ? "cumplida" : "pendiente"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Compras frente al techo</CardTitle>
              <CardDescription>$ por kg de pergamino · la línea es el techo para sustituir ({pesos(m.techos.sustituir)})</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {m.compras.recientes.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay compras.</p> : null}
              {m.compras.recientes.map((c) => (
                <div key={c.id} className="grid grid-cols-[88px_minmax(0,1fr)_76px] items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{c.fecha.slice(5)}</span>
                  <div className="relative h-3.5 rounded bg-muted">
                    <div className={cn("h-3.5 rounded", c.sobreTecho ? "bg-amber-700" : "bg-ocre")} style={{ width: `${(c.porCps / escalaCompra) * 100}%` }} />
                    <div className="absolute -top-1 h-5.5 w-0.5 bg-foreground" style={{ left: `${(m.techos.sustituir / escalaCompra) * 100}%` }} aria-hidden />
                  </div>
                  <span className="tabular text-right font-semibold">{pesos(c.porCps)}</span>
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">
                Techo para migrar: {pesos(m.techos.migrar)} · para ventas nuevas: {pesos(m.techos.nuevo)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uso de la torrefactora</CardTitle>
              <CardDescription>% de la capacidad por mes, últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative flex h-44 items-end gap-1.5 border-b border-border">
                <div className="absolute inset-x-0 border-t border-dashed border-primary" style={{ bottom: `${(SUPUESTOS.usoEquilibrio / maxUso) * 100}%` }} aria-hidden />
                <span className="absolute right-0 bg-card px-1 text-[11px] text-accent-foreground" style={{ bottom: `calc(${(SUPUESTOS.usoEquilibrio / maxUso) * 100}% + 2px)` }}>
                  Equilibrio {pct(SUPUESTOS.usoEquilibrio)}
                </span>
                {m.torrefactora.usoMensual.map((u) => (
                  <div key={u.clave} className="flex flex-1 flex-col items-center justify-end" title={`${u.mes}: ${pct(u.uso)}`}>
                    <div className={cn("w-full rounded-t", u.uso >= SUPUESTOS.usoEquilibrio ? "bg-ocre" : "bg-zinc-300")} style={{ height: `${(u.uso / maxUso) * 176}px` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5 text-[11px] text-muted-foreground">
                {m.torrefactora.usoMensual.map((u) => (
                  <span key={u.clave} className="flex-1 text-center">
                    {u.mes}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Este mes, {pct(m.torrefactora.minutosMes ? m.torrefactora.minutosPedagogicos / m.torrefactora.minutosMes : 0)} del tiempo de tostión fue práctica pedagógica.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ventas del mes por línea</CardTitle>
              <CardDescription>Margen calculado con el costeo y el modelo de la Etapa 3</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[380px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="border-b border-border py-2 font-medium">Línea</th>
                    <th className="border-b border-border py-2 text-right font-medium">Libras</th>
                    <th className="border-b border-border py-2 text-right font-medium">Ventas</th>
                    <th className="border-b border-border py-2 text-right font-medium">Margen por libra</th>
                  </tr>
                </thead>
                <tbody>
                  {m.ventas.lineas.map((l) => (
                    <tr key={l.nombre}>
                      <td className="border-b border-muted py-2.5">{l.nombre}</td>
                      <td className="tabular border-b border-muted py-2.5 text-right">{fmt(l.libras)}</td>
                      <td className="tabular border-b border-muted py-2.5 text-right">{pesos(l.ventas)}</td>
                      <td className="tabular border-b border-muted py-2.5 text-right font-semibold">{pesos(l.margenLb)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {m.ventas.lineas.length === 0 ? <p className="pt-3 text-sm text-muted-foreground">Aún no hay ventas este mes.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {m.alertas.length === 0 ? <p className="text-sm text-muted-foreground">Sin alertas.</p> : null}
              {m.alertas.slice(0, 6).map((a, i) => (
                <div key={i} className={cn("flex gap-3 rounded-lg p-3", a.nivel === "alto" ? "bg-warn-bg" : "bg-muted")}>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", a.nivel === "alto" ? "bg-amber-700" : "bg-zinc-500")} aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">{a.titulo}</p>
                    <p className="text-sm text-zinc-700">{a.texto}</p>
                  </div>
                </div>
              ))}
              <div className="pt-1">
                <Badge tone="accent">Las cifras las calcula la aplicación</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Kpi({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
      <span className="tabular text-2xl font-bold">{valor}</span>
      <span className="text-xs text-zinc-700">{nota}</span>
    </Card>
  );
}
