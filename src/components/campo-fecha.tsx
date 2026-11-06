"use client";
import { useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { fechaLarga, sumarDias } from "@/lib/fechas";
import { cn } from "@/lib/utils";

/**
 * Fecha en lenguaje natural: "Hoy", "Ayer" u "Otro día" con el calendario del teléfono.
 * Envía la fecha como AAAA-MM-DD en un campo oculto con el nombre dado.
 */
export function CampoFecha({ name = "fecha", hoy, value, onChange }: { name?: string; hoy: string; value?: string; onChange?: (v: string) => void }) {
  const [interno, setInterno] = useState(hoy);
  const v = value ?? interno;
  const poner = (x: string) => {
    if (!x) return;
    if (onChange) onChange(x);
    else setInterno(x);
  };
  const ayer = sumarDias(hoy, -1);
  const otro = v !== hoy && v !== ayer;
  const cal = useRef<HTMLInputElement>(null);
  const abrir = () => {
    try {
      cal.current?.showPicker();
    } catch {
      cal.current?.focus();
    }
  };

  const chip = (on: boolean) =>
    cn(
      "flex h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm transition-colors",
      on ? "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium" id={`${name}-etiqueta`}>
        Fecha
      </span>
      <input type="hidden" name={name} value={v} />
      <div role="group" aria-labelledby={`${name}-etiqueta`} className="grid grid-cols-[1fr_1fr_1.4fr] gap-1 rounded-xl bg-muted p-1">
        <button type="button" aria-pressed={v === hoy} className={chip(v === hoy)} onClick={() => poner(hoy)}>
          Hoy
        </button>
        <button type="button" aria-pressed={v === ayer} className={chip(v === ayer)} onClick={() => poner(ayer)}>
          Ayer
        </button>
        <div className="relative">
          <button type="button" aria-pressed={otro} className={cn(chip(otro), "w-full")} onClick={abrir}>
            <CalendarDays className="size-4" aria-hidden /> Otro día
          </button>
          {/* El calendario nativo queda encima, invisible, para que en el iPhone se abra con el toque. */}
          <input
            ref={cal}
            type="date"
            aria-label="Elegir otra fecha"
            max={hoy}
            value={v}
            onChange={(e) => poner(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground first-letter:uppercase">{fechaLarga(v, hoy)}</p>
    </div>
  );
}
