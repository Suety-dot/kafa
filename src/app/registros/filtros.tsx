"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { MESES_CORTOS } from "@/lib/fechas";
import { cn } from "@/lib/utils";

/**
 * Filtros que se aplican al tocar: año, mes y cuenta por separado.
 * Los meses sin registros en el año elegido se ven apagados.
 */
export function Filtros({
  anios,
  mesesPorAnio,
  anio,
  mes,
  cuentas,
  cuenta,
}: {
  anios: string[];
  mesesPorAnio: Record<string, string[]>;
  anio: string;
  mes: string;
  cuentas: { id: string; nombre: string }[];
  cuenta: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [cargando, iniciar] = useTransition();
  const ir = (cambios: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cambios)) p.set(k, v);
    p.delete("ver");
    iniciar(() => router.push(`/registros?${p}`, { scroll: false }));
  };
  const conDatos = new Set(anio === "todos" ? [] : mesesPorAnio[anio] ?? []);

  const pastilla = (on: boolean) =>
    cn(
      "h-10 shrink-0 rounded-full border px-4 text-sm transition-colors",
      on ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted",
    );

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Año</span>
          {cargando ? <Loader2 className="size-4 animate-spin text-primary" aria-label="Actualizando" /> : null}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Año">
          {anios.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={a === anio}
              className={pastilla(a === anio)}
              onClick={() => {
                const ms = mesesPorAnio[a] ?? [];
                // Al cambiar de año se queda en el mismo mes si tiene datos; si no, en el último con datos.
                ir({ anio: a, mes: mes !== "todos" && ms.includes(mes) ? mes : ms.at(-1) ?? "todos" });
              }}
            >
              {a}
            </button>
          ))}
          <button type="button" aria-pressed={anio === "todos"} className={pastilla(anio === "todos")} onClick={() => ir({ anio: "todos", mes: "todos" })}>
            Todos
          </button>
        </div>
      </div>

      {anio !== "todos" ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Mes</span>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-[repeat(13,minmax(0,1fr))]" role="group" aria-label="Mes">
            {MESES_CORTOS.map((nombre, i) => {
              const id = String(i + 1).padStart(2, "0");
              const on = id === mes;
              const hay = conDatos.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  disabled={!hay}
                  onClick={() => ir({ mes: id })}
                  className={cn(
                    "h-10 rounded-lg text-sm transition-colors",
                    on ? "bg-primary font-semibold text-primary-foreground" : hay ? "bg-muted text-foreground hover:bg-accent" : "cursor-not-allowed text-zinc-300",
                  )}
                >
                  {nombre}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={mes === "todos"}
              onClick={() => ir({ mes: "todos" })}
              className={cn(
                "col-span-4 h-10 rounded-lg text-sm transition-colors sm:col-span-6 lg:col-span-1",
                mes === "todos" ? "bg-primary font-semibold text-primary-foreground" : "bg-muted text-foreground hover:bg-accent",
              )}
            >
              <span className="lg:hidden">Todo el año</span>
              <span className="hidden lg:inline">Año</span>
            </button>
          </div>
        </div>
      ) : null}

      <label className="flex flex-col gap-2 text-sm font-semibold sm:max-w-xs">
        Registrado por
        <span className="relative">
          <select
            value={cuenta}
            onChange={(e) => ir({ cuenta: e.target.value })}
            className="h-11 w-full appearance-none rounded-lg border border-border bg-card pr-10 pl-3 text-base font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="todas">Todas las personas</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        </span>
      </label>
    </div>
  );
}
