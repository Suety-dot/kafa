"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Filtros que se aplican al tocar: mes en botones y cuenta en un selector. */
export function Filtros({ meses, mes, cuentas, cuenta }: { meses: { id: string; nombre: string }[]; mes: string; cuentas: { id: string; nombre: string }[]; cuenta: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [cargando, iniciar] = useTransition();
  const ir = (cambios: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cambios)) p.set(k, v);
    p.delete("ver");
    iniciar(() => router.push(`/registros?${p}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Mes</span>
        {cargando ? <Loader2 className="size-4 animate-spin text-primary" aria-label="Actualizando" /> : null}
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Mes">
        {[...meses, { id: "todos", nombre: "Todos" }].map((m) => {
          const on = m.id === mes;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => ir({ mes: m.id })}
              className={cn(
                "h-10 shrink-0 rounded-full border px-4 text-sm transition-colors",
                on ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {m.nombre}
            </button>
          );
        })}
      </div>
      <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium">
        Cuenta
        <select
          value={cuenta}
          onChange={(e) => ir({ cuenta: e.target.value })}
          className="h-11 rounded-lg border border-border bg-card px-3 text-base font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="todas">Todas las cuentas</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
