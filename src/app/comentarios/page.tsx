import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Download, RotateCcw } from "lucide-react";
import { Encabezado } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cambiarComentario } from "@/app/acciones";
import { listarComentarios, type Comentario } from "@/lib/comentarios";
import { sesionActual } from "@/lib/sesion-servidor";
import { nombrePantalla } from "@/lib/pantallas";
import { fechaCorta, hoyBogota } from "@/lib/fechas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIPO: Record<string, { nombre: string; clase: string }> = {
  idea: { nombre: "Idea", clase: "bg-accent text-accent-foreground" },
  error: { nombre: "Algo falla", clase: "bg-red-50 text-red-800" },
  diseno: { nombre: "Diseño", clase: "bg-sky-50 text-sky-800" },
  otro: { nombre: "Otro", clase: "bg-muted text-zinc-700" },
};

/** Fecha y hora de Bogotá: "Hoy 11:53", "4 nov 09:10". */
function cuando(iso: string, hoy: string) {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
  const hora = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${fechaCorta(dia, hoy)} ${hora}`;
}

export default async function Comentarios({ searchParams }: { searchParams: Promise<{ estado?: string; tipo?: string }> }) {
  const yo = await sesionActual();
  if (yo?.rol !== "admin") redirect("/");
  const sp = await searchParams;
  const estado = sp.estado === "resueltos" || sp.estado === "todos" ? sp.estado : "pendientes";
  const tipo = sp.tipo && TIPO[sp.tipo] ? sp.tipo : "todos";
  let todos: Comentario[] = [];
  let error = "";
  try {
    todos = await listarComentarios();
  } catch (e) {
    error = (e as Error).message;
  }
  const hoy = hoyBogota();
  const lista = todos.filter((c) => (estado === "todos" || (estado === "resueltos") === c.resuelto) && (tipo === "todos" || c.tipo === tipo));
  const pendientes = todos.filter((c) => !c.resuelto).length;
  const personas = new Set(todos.map((c) => c.usuario)).size;
  const url = (x: Record<string, string>) => `/comentarios?${new URLSearchParams({ estado, tipo, ...x })}`;
  const pastilla = (on: boolean) =>
    cn("flex h-10 shrink-0 items-center rounded-full border px-4 text-sm transition-colors", on ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border bg-card hover:bg-muted");

  return (
    <main className="mx-auto w-full max-w-4xl pb-8">
      <Encabezado
        titulo="Comentarios"
        sub="Lo que dicen quienes prueban Kafa"
        volver="/"
        accion={
          <a href="/api/comentarios" className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
            <Download aria-hidden /> CSV
          </a>
        }
      />
      <div className="flex flex-col gap-4 px-5 md:px-8">
        {error ? <p className="rounded-xl bg-warn-bg px-4 py-3 text-sm text-warn-fg">{error}</p> : null}

        <div className="grid grid-cols-3 gap-2">
          {[
            ["Comentarios", todos.length],
            ["Pendientes", pendientes],
            ["Personas", personas],
          ].map(([a, b]) => (
            <div key={a} className="rounded-xl bg-muted px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{a}</p>
              <p className="tabular text-lg font-bold">{b}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
            {[
              ["pendientes", "Pendientes"],
              ["resueltos", "Resueltos"],
              ["todos", "Todos"],
            ].map(([id, n]) => (
              <Link key={id} href={url({ estado: id })} className={pastilla(estado === id)} aria-current={estado === id ? "page" : undefined}>
                {n}
              </Link>
            ))}
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
            <Link href={url({ tipo: "todos" })} className={pastilla(tipo === "todos")}>
              Todos los tipos
            </Link>
            {Object.entries(TIPO).map(([id, t]) => (
              <Link key={id} href={url({ tipo: id })} className={pastilla(tipo === id)}>
                {t.nombre}
              </Link>
            ))}
          </div>
        </div>

        {lista.length === 0 && !error ? (
          <Card className="px-4 py-10 text-center text-sm text-muted-foreground">
            {todos.length === 0 ? "Aún no hay comentarios. El botón Comentar está en todas las pantallas." : "No hay comentarios con estos filtros."}
          </Card>
        ) : null}

        <div className="flex flex-col gap-3">
          {lista.map((c) => (
            <Card key={c.id} className={cn("flex flex-col gap-2 p-4", c.resuelto && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cn("rounded-full px-2.5 py-1 font-semibold", TIPO[c.tipo]?.clase)}>{TIPO[c.tipo]?.nombre ?? c.tipo}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-zinc-700">{nombrePantalla(c.pantalla)}</span>
                <span className="ml-auto text-muted-foreground">{cuando(c.creado, hoy)}</span>
              </div>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{c.texto}</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-sm text-muted-foreground">{c.nombre}</span>
                <form action={cambiarComentario}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="resuelto" value={c.resuelto ? "0" : "1"} />
                  <button type="submit" className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-muted">
                    {c.resuelto ? <RotateCcw className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
                    {c.resuelto ? "Reabrir" : "Resuelto"}
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
