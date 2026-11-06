import Link from "next/link";
import { Download } from "lucide-react";
import { Encabezado } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { almacen } from "@/lib/store";
import { mesCorto, mesesDisponibles, nombreMes, tabla, TIPOS, type Tipo } from "@/lib/registros";
import { listar } from "@/lib/usuarios";
import { Filtros } from "./filtros";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
const POR_PAGINA = 100;

export default async function Registros({ searchParams }: { searchParams: Promise<{ tipo?: string; mes?: string; cuenta?: string; ver?: string }> }) {
  const sp = await searchParams;
  const tipo: Tipo = (TIPOS.find((t) => t.id === sp.tipo)?.id ?? "compras") as Tipo;
  const d = await almacen().leerTodo();
  const meses = mesesDisponibles(d);
  const mes = sp.mes === "todos" ? "todos" : meses.includes(sp.mes ?? "") ? sp.mes! : meses[0] ?? "todos";
  const usuarios = await listar().catch(() => []);
  const nombres = Object.fromEntries(usuarios.map((u) => [u.usuario, u.nombre]));
  const cuenta = sp.cuenta && sp.cuenta !== "todas" ? sp.cuenta : "todas";
  const ver = Math.min(5000, Math.max(POR_PAGINA, Number(sp.ver) || POR_PAGINA));
  const t = tabla(d, tipo, mes, cuenta, nombres);
  const url = (cambios: Record<string, string>) => `/registros?${new URLSearchParams({ tipo, mes, cuenta, ...cambios })}`;
  const csv = `/api/registros?${new URLSearchParams({ tipo, mes, cuenta })}`;

  return (
    <main className="mx-auto w-full max-w-7xl pb-8">
      <Encabezado
        titulo="Registros"
        sub="Todas las transacciones, de la más reciente a la más antigua"
        accion={
          <a href={csv} className={buttonVariants({ variant: "outline" })}>
            <Download aria-hidden /> Descargar CSV
          </a>
        }
      />
      <div className="flex flex-col gap-4 px-5 md:px-8">
        <nav aria-label="Tipo de registro" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
          {TIPOS.map((x) => (
            <Link
              key={x.id}
              href={url({ tipo: x.id })}
              className={cn("flex h-10 shrink-0 items-center rounded-lg px-4 text-sm text-muted-foreground transition-colors hover:text-foreground", x.id === tipo && "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border")}
              aria-current={x.id === tipo ? "page" : undefined}
            >
              {x.nombre}
            </Link>
          ))}
        </nav>

        <Filtros
          meses={meses.slice(0, 12).map((m) => ({ id: m, nombre: mesCorto(m) }))}
          mes={mes}
          cuenta={cuenta}
          cuentas={usuarios.map((u) => ({ id: u.usuario, nombre: u.nombre }))}
        />

        <Card className="overflow-hidden">
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
                        {x}
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
        <p className="text-xs text-muted-foreground">
          {nombreMesTexto(mes)}
          {cuenta !== "todas" ? ` · ${nombres[cuenta] ?? cuenta}` : ""} · {t.filas.length} {t.filas.length === 1 ? "registro" : "registros"}. Las compras sobre el techo aparecen resaltadas.
        </p>
      </div>
    </main>
  );
}

const nombreMesTexto = (m: string) => (m === "todos" ? "Todos los meses" : nombreMes(m));
