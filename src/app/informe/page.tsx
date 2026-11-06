import { Encabezado } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { almacen } from "@/lib/store";
import { calcular, fmt, pct, pesos } from "@/lib/metricas";
import { proveedor } from "@/lib/ia";
import { Redactar, Preguntar } from "./cliente";
import { SelectorModelo } from "@/components/selector-modelo";
import { mesTexto } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function Informe() {
  const m = calcular(await almacen().leerTodo());
  const conIa = proveedor() !== "ninguno";
  const cifras = [
    ["Pergamino procesado", `${fmt(m.torrefactora.kgCpsMes)} kg`],
    ["Uso de la torrefactora", pct(m.torrefactora.usoMes)],
    ["Aporte del servicio", pesos(m.torrefactora.aporteServicioMes)],
    ["Inventario del fondo", `${fmt(m.fondo.inventarioKgVerde)} kg verde`],
    ["Precio promedio de compra", `${pesos(m.compras.precioPromedioCps)} por kg cps`],
    ["Ventas del mes", pesos(m.ventas.ventasTotalMes)],
    ["Margen de las ventas", pesos(m.ventas.margenVentasMes)],
    ["Escenario en curso", String(m.escalera.actual)],
  ];
  return (
    <main className="mx-auto w-full max-w-6xl pb-8">
      <Encabezado titulo="Informe mensual" sub={`${mesTexto(m.mesActual)} · mes en curso`} />
      <div className="grid gap-4 px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Cifras del mes</CardTitle>
              <CardDescription>Calculadas por la aplicación con los registros. Son las únicas que usa la IA.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {cifras.map(([a, b]) => (
                <div key={a}>
                  <p className="text-xs text-muted-foreground">{a}</p>
                  <p className="tabular text-base font-semibold">{b}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          {conIa ? (
            <Card className="p-4 lg:max-w-md">
              <SelectorModelo />
            </Card>
          ) : null}
          <Redactar conIa={conIa} />
        </div>
        <Preguntar conIa={conIa} />
      </div>
    </main>
  );
}
