"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { guardarVenta } from "@/app/acciones";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
const PRECIO: Record<string, string> = { institucional: "25.500", premium: "30.800", especial: "" };

export function FormVenta({ hoy }: { hoy: string }) {
  const [estado, accion, enviando] = useActionState(guardarVenta, null);
  const [linea, setLinea] = useState<"institucional" | "premium" | "especial">("premium");
  const [origen, setOrigen] = useState<"maquila" | "tena">("tena");
  const [libras, setLibras] = useState("");
  const [precio, setPrecio] = useState(PRECIO.premium);
  const lb = Number(libras.replace(",", ".")) || 0;
  const p = Number(precio.replace(/\./g, "")) || 0;

  return (
    <form action={accion} className="flex flex-col gap-4 px-5 md:px-8">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" htmlFor="fecha">
          <Input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
        </Field>
        <Field label="Cliente" htmlFor="cliente">
          <Input id="cliente" name="cliente" placeholder="Cliente 03" required />
        </Field>
      </div>
      <Segmented
        name="linea"
        label="Línea"
        value={linea}
        onChange={(v) => {
          setLinea(v);
          setPrecio(PRECIO[v]);
        }}
        options={[{ value: "institucional", label: "Institucional" }, { value: "premium", label: "Premium" }, { value: "especial", label: "Especial" }]}
      />
      <Segmented name="origen" label="Tostado en" value={origen} onChange={setOrigen} options={[{ value: "tena", label: "Tena" }, { value: "maquila", label: "Maquila en Bogotá" }]} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Libras" htmlFor="libras">
          <Input id="libras" inputMode="decimal" value={libras} onChange={(e) => setLibras(e.target.value)} required />
        </Field>
        <Field label="Precio por libra" htmlFor="precio">
          <Input id="precio" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
        </Field>
      </div>
      <input type="hidden" name="libras" value={lb || ""} />
      <input type="hidden" name="precioLb" value={p || ""} />
      {lb && p ? (
        <Card className="flex justify-between p-4 text-sm">
          <span className="text-muted-foreground">Total de la venta</span>
          <span className="tabular font-semibold">${fmt(lb * p)}</span>
        </Card>
      ) : null}
      {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
      <Button type="submit" size="lg" disabled={enviando}>
        {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Guardar venta
      </Button>
    </form>
  );
}
