"use client";
import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
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
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm">
        <Cpu className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-muted-foreground">Modelo de IA</span>
        <select
          value={m}
          disabled={disabled}
          onChange={(e) => setM(e.target.value as IdModelo)}
          className="h-9 rounded-lg border border-border bg-card px-2 text-sm font-medium disabled:opacity-50"
        >
          {MODELOS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nombre}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-muted-foreground">{actual.nota}</p>
    </div>
  );
}
