"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { guardarBache } from "@/app/acciones";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

const OPERADORES = ["José", "Alibrio", "Michael", "Estudiantes en práctica"];
const TARIFA = 3800;
const ENERGIA = 288.269444444444;
const fmt = (n: number) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);

export function FormBache({ hoy }: { hoy: string }) {
  const [estado, accion, enviando] = useActionState(guardarBache, null);
  const [tipo, setTipo] = useState<"servicio" | "propio">("servicio");
  const [perfil, setPerfil] = useState<"claro" | "medio" | "oscuro">("medio");
  const [kilos, setKilos] = useState("15");
  const [quien, setQuien] = useState<string[]>([]);
  const kg = Number(kilos.replace(",", ".")) || 0;

  return (
    <form action={accion} className="flex flex-col gap-4 px-5 md:px-8">
      <Segmented name="tipo" label="Tipo de bache" value={tipo} onChange={setTipo} options={[{ value: "servicio", label: "Servicio a caficultor" }, { value: "propio", label: "Café de la Fundación" }]} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" htmlFor="fecha">
          <Input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
        </Field>
        {tipo === "servicio" ? (
          <Field label="Caficultor" htmlFor="caficultor">
            <Input id="caficultor" name="caficultor" placeholder="Caficultor 042" required />
          </Field>
        ) : (
          <div />
        )}
        <Field label="Kilos de pergamino" htmlFor="kilosCps">
          <Input id="kilosCps" name="kilosCps" inputMode="decimal" value={kilos} onChange={(e) => setKilos(e.target.value)} required />
        </Field>
        <Field label="Minutos de tostión" htmlFor="minutos">
          <Input id="minutos" name="minutos" inputMode="numeric" defaultValue="15" required />
        </Field>
      </div>
      <Segmented name="perfil" label="Perfil de tostión" value={perfil} onChange={setPerfil} options={[{ value: "claro", label: "Claro" }, { value: "medio", label: "Medio" }, { value: "oscuro", label: "Oscuro" }]} />

      <Card className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">Quién lo hizo</p>
          <p className="text-xs text-muted-foreground">Con esto se reparte la nómina entre producción y formación.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {OPERADORES.map((o) => {
            const on = quien.includes(o);
            return (
              <label key={o} className={cn("flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", on ? "border-primary bg-accent font-semibold text-accent-foreground" : "border-border bg-card")}>
                <input type="checkbox" name="operadores" value={o} checked={on} onChange={() => setQuien(on ? quien.filter((x) => x !== o) : [...quien, o])} className="sr-only" />
                {o}
              </label>
            );
          })}
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="pedagogico" className="size-5 accent-[var(--primary)]" defaultChecked={false} />
          Fue una práctica pedagógica
        </label>
      </Card>

      {tipo === "servicio" ? (
        <Card className="flex flex-col gap-2 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Tarifa del servicio</span><span className="tabular font-semibold">${fmt(kg * TARIFA)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Energía (gas y electricidad)</span><span className="tabular font-semibold">(${fmt(kg * ENERGIA)})</span></div>
          <div className="flex justify-between border-t border-muted pt-2 text-[15px]"><span className="font-semibold">Aporte del bache</span><span className="tabular font-bold text-primary">${fmt(kg * (TARIFA - ENERGIA))}</span></div>
        </Card>
      ) : null}

      {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
      <Button type="submit" size="lg" disabled={enviando}>
        {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Guardar bache
      </Button>
    </form>
  );
}
