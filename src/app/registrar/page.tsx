import Link from "next/link";
import { Camera, ChevronRight, Flame, ShoppingBag, Truck } from "lucide-react";
import { Encabezado } from "@/components/shell";
import { Card } from "@/components/ui/card";

const OPCIONES = [
  { href: "/registrar/compra", t: "Compra de café", s: "Con foto del recibo: la IA llena los campos", icon: Camera },
  { href: "/registrar/bache", t: "Bache de tostión", s: "Servicio o café propio, y quién lo hizo", icon: Flame },
  { href: "/registrar/venta", t: "Venta", s: "Cliente, línea, origen, libras y precio", icon: ShoppingBag },
  { href: "/registrar/gasto", t: "Flete o gasto", s: "Fletes a Bogotá, gas, mantenimiento", icon: Truck },
];

export default function Registrar() {
  return (
    <main className="mx-auto w-full max-w-3xl pb-6">
      <Encabezado titulo="Registrar" sub="Dos minutos por registro, desde el celular" />
      <Card className="mx-5 divide-y divide-muted md:mx-8">
        {OPCIONES.map(({ href, t, s, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-muted/60">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{t}</span>
              <span className="block text-xs text-muted-foreground">{s}</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        ))}
      </Card>
    </main>
  );
}
