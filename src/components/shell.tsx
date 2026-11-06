"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Home, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/registrar", label: "Registrar", icon: PlusCircle },
  { href: "/tablero", label: "Tablero", icon: BarChart3 },
  { href: "/informe", label: "Informe", icon: FileText },
];

export function Shell({ children, modo }: { children: React.ReactNode; modo: string }) {
  const path = usePathname();
  const activo = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-border bg-card px-4 py-6 md:flex">
        <Link href="/" className="mb-6 px-2">
          <span className="block text-lg font-bold tracking-tight">Arriero</span>
          <span className="block text-xs font-semibold tracking-wider text-accent-foreground">CAFÉ FORMEMOS</span>
        </Link>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-zinc-700 hover:bg-muted",
              activo(href) && "bg-muted font-semibold text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
        <p className="mt-auto px-2 text-xs text-muted-foreground">
          {modo === "memoria" ? "Datos de ejemplo en memoria" : "Datos guardados en Supabase"}
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">{children}</div>

      <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground", activo(href) && "font-semibold text-primary")}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Encabezado({ titulo, sub, volver, accion }: { titulo: string; sub?: string; volver?: string; accion?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 px-5 pt-6 pb-4 md:px-8 md:pt-8">
      <div className="flex flex-col gap-1">
        {volver ? (
          <Link href={volver} className="text-sm text-primary hover:underline">
            Volver
          </Link>
        ) : (
          <span className="text-xs font-semibold tracking-wider text-accent-foreground md:hidden">ARRIERO · CAFÉ FORMEMOS</span>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {sub ? <p className="text-sm text-muted-foreground">{sub}</p> : null}
      </div>
      {accion}
    </header>
  );
}
