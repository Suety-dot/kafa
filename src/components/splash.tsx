"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pantalla de carga al abrir Kafa (una vez por apertura de la app o pestaña). */
export function Splash() {
  const [visible, setVisible] = useState(true);
  const [montado, setMontado] = useState(true);
  useEffect(() => {
    let yaVisto = false;
    try {
      yaVisto = sessionStorage.getItem("kafa_splash") === "1";
      sessionStorage.setItem("kafa_splash", "1");
    } catch {}
    const t1 = setTimeout(() => setVisible(false), yaVisto ? 0 : 1200);
    const t2 = setTimeout(() => setMontado(false), yaVisto ? 0 : 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  if (!montado) return null;
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background transition-opacity duration-500",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={96} height={96} className="size-24 animate-pulse rounded-[22%] shadow-sm" />
      <div className="text-center">
        <p className="text-2xl font-bold tracking-tight">Kafa</p>
        <p className="text-sm text-muted-foreground">Las cuentas del café de Formemos</p>
      </div>
      <Loader2 className="size-5 animate-spin text-primary" aria-label="Cargando" />
    </div>
  );
}
