import Link from "next/link";
import { Download } from "lucide-react";
import { Encabezado } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { almacen } from "@/lib/store";
import { mesesDisponibles, tabla, TIPOS, type Tipo } from "@/lib/registros";
import { fechaCorta, hoyBogota, mesTexto } from "@/lib/fechas";
import { listar } from "@/lib/usuarios";
import { Filtros } from "./filtros";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
const POR_PAGINA = 100;

export default async function Registros({ searchParams }: { searchParams: Promise<{ tipo?: string; anio?: string; mes?: string; cuenta?: string; ver?: string }> }) {
  const sp = await searchParams;
  const tipo: Tipo = (TIPOS.find((t) => t.id === sp.tipo)?.id ?? "compras") as Tipo;
  const d = await almacen().leerTodo();
  const meses = mesesDisponibles(d); // AAAA-MM, del más reciente al más antiguo
  const mesesPorAnio: Record<string, string[]> = {};
  for (const m of [...meses].reverse()) (mesesPorAnio[m.slice(0, 4)] ??= []).push(m.slice(5));
  const anios = Object.keys(mesesPorAnio).sort().reverse();
  // Enlaces viejos traen mes=AAAA-MM: se separan en año y mes.
  const viejo = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : null;
  const pedidoAnio = viejo ? viejo.slice(0, 4) : sp.anio;
  const anio = pedidoAnio === "todos" ? "todos" : pedidoAnio && anios.includes(pedidoAnio) ? pedidoAnio : anios[0] ?? "todos";
  const pedidoMes = viejo ? viejo.slice(5) : sp.mes;
  const mes = anio === "todos" ? "todos" : pedidoMes === "todos" || /^\d{2}$/.test(pedidoMes ?? "") ? pedidoMes! : (mesesPorAnio[anio]?.at(-1) ?? "todos");
  const periodo = anio === "todos" ? "todos" : mes === "todos" ? anio : `${anio}-${mes}`;
  const periodoTexto = anio === "todos" ? "Todos los años" : mes === "todos" ? `Todo ${anio}` : mesTexto(periodo);
  const hoy = hoyBogota();
  const usuarios = await listar().catch(() => []);
  const nombres = Object.fromEntries(usuarios.map((u) => [u.usuario, u.nombre]));
  const cuenta = sp.cuenta && sp.cuenta !== "todas" ? sp.cuenta : "todas";
  const ver = Math.min(5000, Math.max(POR_PAGINA, Number(sp.ver) || POR_PAGINA));
  const t = tabla(d, tipo, periodo, cuenta, nombres);
  const url = (cambios: Record<string, string>) => `/registros?${new URLSearchParams({ tipo, anio, mes, cuenta, ...cambios })}`;
  const csv = `/api/registros?${new URLSearchParams({ tipo, mes: periodo, cuenta })}`;

  return (
    <main className="mx-auto w-full max-w-7xl pb-8">
      <Encabezado
        titulo="Registros"
        sub="De la más reciente a la más antigua"
        accion={
          <a href={csv} className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
            <Download aria-hidden /> <span className="hidden sm:inline">Descargar</span> CSV
          </a>
        }
      />
      <div className="flex flex-col gap-4 px-5 md:px-8">
        <nav aria-label="Tipo de registro" className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1 sm:max-w-xl">
          {TIPOS.map((x) => (
            <Link
              key={x.id}
              href={url({ tipo: x.id })}
              className={cn("flex h-10 items-center justify-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground", x.id === tipo && "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border")}
              aria-current={x.id === tipo ? "page" : undefined}
            >
              {x.nombre}
            </Link>
          ))}
        </nav>

        <Filtros anios={anios} mesesPorAnio={mesesPorAnio} anio={anio} mes={mes} cuenta={cuenta} cuentas={usuarios.map((u) => ({ id: u.usuario, nombre: u.nombre }))} />

        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold">
            {periodoTexto}
            {cuenta !== "todas" ? <span className="font-normal text-muted-foreground"> · {nombres[cuenta] ?? cuenta}</span> : null}
          </p>
          <div className="grid grid-cols-4 gap-2 md:max-w-3xl">
            {t.resumen.map((r, i) => (
              <div key={r.etiqueta} className={cn("rounded-xl bg-muted px-3 py-2.5", i === t.resumen.length - 1 && "col-span-2")}>
                <p className="text-xs text-muted-foreground">{r.etiqueta}</p>
                <p className="tabular truncate text-base font-bold sm:text-lg">{r.valor}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Celular: lista */}
        <Card className="divide-y divide-muted md:hidden">
          {t.filas.slice(0, ver).map((f, i) => (
            <div key={i} className={cn("flex items-center gap-3 px-4 py-3", f.alerta && "bg-warn-bg/70")}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.movil.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{f.movil.detalle}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="tabular text-sm font-semibold">{f.movil.valor}</span>
                <span className="text-xs text-muted-foreground">{fechaCorta(f.texto[0], hoy)}</span>
              </div>
            </div>
          ))}
          {t.filas.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">No hay registros con estos filtros.</p> : null}
        </Card>

        {/* PC: tabla completa */}
        <Card className="hidden overflow-hidden md:block">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  {t.columnas.map((c) => (
                    <th key={c.titulo} scope="col" className={cn("whitespace-nowrap border-b border-border px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground", c.num && "text-right")}>
                      {c.titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.filas.slice(0, ver).map((f, i) => (
                  <tr key={i} className={cn("hover:bg-muted/50", f.alerta && "bg-warn-bg/60")}>
                    {f.texto.map((x, j) => (
                      <td key={j} className={cn("whitespace-nowrap border-b border-muted px-3 py-2.5", t.columnas[j]?.num && "tabular text-right", j === 0 && "text-muted-foreground")}>
                        {j === 0 ? fechaCorta(x, hoy) : x}
                      </td>
                    ))}
                  </tr>
                ))}
                {t.filas.length === 0 ? (
                  <tr>
                    <td colSpan={t.columnas.length} className="px-3 py-8 text-center text-muted-foreground">
                      No hay registros con estos filtros.
                    </td>
                  </tr>
                ) : null}
              </tbody>
              {t.filas.length ? (
                <tfoot className="sticky bottom-0 bg-card">
                  <tr>
                    {t.total.map((x, j) => (
                      <td key={j} className={cn("whitespace-nowrap border-t border-border px-3 py-2.5 font-semibold", t.columnas[j]?.num && "tabular text-right")}>
                        {x}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </Card>
        {t.filas.length > ver ? (
          <Link href={url({ ver: String(ver + POR_PAGINA * 5) })} className={cn(buttonVariants({ variant: "outline" }), "self-center")}>
            Ver más ({t.filas.length - ver} restantes)
          </Link>
        ) : null}
        {tipo === "compras" ? <p className="text-xs text-muted-foreground">Las compras sobre el techo aparecen resaltadas.</p> : null}
      </div>
    </main>
  );
}

