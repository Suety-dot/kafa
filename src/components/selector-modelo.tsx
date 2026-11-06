"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELOS, type IdModelo } from "@/lib/modelos";

const LLAVE = "kafa_modelo";
const EVENTO = "kafa-modelo";

/** Modelo elegido por esta persona en este dispositivo. Se comparte entre las pantallas. */
export function useModelo(): [IdModelo, (m: IdModelo) => void] {
  const [m, setM] = useState<IdModelo>("auto");
  useEffect(() => {
    const leer = () => {
      try {
        const v = localStorage.getItem(LLAVE) as IdModelo | null;
        setM(v && MODELOS.some((x) => x.id === v) ? v : "auto");
      } catch {}
    };
    leer();
    window.addEventListener(EVENTO, leer);
    return () => window.removeEventListener(EVENTO, leer);
  }, []);
  const cambiar = (v: IdModelo) => {
    setM(v);
    try {
      localStorage.setItem(LLAVE, v);
    } catch {}
    window.dispatchEvent(new Event(EVENTO));
  };
  return [m, cambiar];
}

export function SelectorModelo({ disabled }: { disabled?: boolean }) {
  const [m, setM] = useModelo();
  const actual = MODELOS.find((x) => x.id === m)!;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span id="modelo-etiqueta" className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4 text-primary" aria-hidden /> Modelo de IA
        </span>
        <span className="text-xs text-muted-foreground">$ = costo relativo</span>
      </div>
      <div role="radiogroup" aria-labelledby="modelo-etiqueta" className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
        {MODELOS.map((x) => {
          const on = x.id === m;
          return (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={x.nombre}
              disabled={disabled}
              onClick={() => setM(x.id)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors disabled:opacity-50",
                on ? "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{x.corto}</span>
              <span className="text-[11px] tracking-widest" aria-hidden>
                <span className={on ? "text-primary" : ""}>{"$".repeat(x.costo)}</span>
                <span className="opacity-25">{"$".repeat(3 - x.costo)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {actual.nota}
      </p>
    </div>
  );
}
