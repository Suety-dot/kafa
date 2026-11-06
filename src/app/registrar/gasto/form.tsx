"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { guardarGasto } from "@/app/acciones";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { CampoFecha } from "@/components/campo-fecha";

export function FormGasto({ hoy }: { hoy: string }) {
  const [estado, accion, enviando] = useActionState(guardarGasto, null);
  const [tipo, setTipo] = useState<"flete" | "energia" | "mantenimiento" | "otro">("flete");
  const [valor, setValor] = useState("");
  const v = Number(valor.replace(/\./g, "")) || 0;
  return (
    <form action={accion} className="flex flex-col gap-4 px-5 md:px-8">
      <Segmented name="tipo" label="Tipo" value={tipo} onChange={setTipo} options={[{ value: "flete", label: "Flete" }, { value: "energia", label: "Energía" }, { value: "mantenimiento", label: "Manten." }, { value: "otro", label: "Otro" }]} />
      <CampoFecha hoy={hoy} />
      <Field label="Valor" htmlFor="valor">
        <Input id="valor" inputMode="numeric" placeholder="$66.000" value={valor} onChange={(e) => setValor(e.target.value)} required />
      </Field>
      <Field label="Descripción" htmlFor="descripcion" hint={tipo === "flete" ? "Por ejemplo: envío Tena a Bogotá, 60 kg tostados." : undefined}>
        <Input id="descripcion" name="descripcion" maxLength={200} />
      </Field>
      <input type="hidden" name="valor" value={v || ""} />
      {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
      <Button type="submit" size="lg" disabled={enviando}>
        {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Guardar
      </Button>
    </form>
  );
}
