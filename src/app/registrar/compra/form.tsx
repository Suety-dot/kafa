"use client";
import { useActionState, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { guardarCompra } from "@/app/acciones";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { SelectorModelo, useModelo } from "@/components/selector-modelo";

type Calidad = "consumo" | "excelso" | "premium" | "especial";
type Unidad = "cps" | "verde";
type Destino = "sustituir" | "migrar" | "nuevo";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
const aNumero = (s: string) => Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
const aKilos = (s: string) => Number(s.replace(",", ".").replace(/[^\d.]/g, ""));

/** Reduce la foto en el celular antes de enviarla: menos datos móviles y menos costo de IA. */
async function comprimir(archivo: File): Promise<{ base64: string; tipo: string; url: string }> {
  const img = await createImageBitmap(archivo);
  const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * escala);
  c.height = Math.round(img.height * escala);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/jpeg", 0.82);
  return { base64: url.split(",")[1], tipo: "image/jpeg", url };
}

export function FormCompra({ techos, factor, conIa, hoy }: { techos: Record<Destino, number>; factor: number; conIa: boolean; hoy: string }) {
  const [estado, accion, enviando] = useActionState(guardarCompra, null);
  const [foto, setFoto] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [leida, setLeida] = useState(false);
  const [f, setF] = useState({ fecha: hoy, caficultor: "", kilos: "", precio: "" });
  const [calidad, setCalidad] = useState<Calidad | "">("");
  const [unidad, setUnidad] = useState<Unidad | "">("");
  const [destino, setDestino] = useState<Destino>("sustituir");
  const entrada = useRef<HTMLInputElement>(null);
  const [modelo] = useModelo();

  async function alElegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const a = e.target.files?.[0];
    if (!a) return;
    const { base64, tipo, url } = await comprimir(a);
    setFoto(url);
    if (!conIa) {
      setAviso("La lectura con IA está desactivada. Llena los campos a mano.");
      return;
    }
    setLeyendo(true);
    setAviso(null);
    try {
      const r = await fetch("/api/ia/recibo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ base64, tipo, modelo }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setF((x) => ({
        ...x,
        fecha: j.fecha ?? x.fecha,
        kilos: j.kilos != null ? String(j.kilos) : x.kilos,
        precio: j.precioKg != null ? fmt(j.precioKg) : x.precio,
      }));
      if (j.calidad) setCalidad(j.calidad);
      if (j.unidad) setUnidad(j.unidad);
      setLeida(true);
      setAviso(
        `La IA leyó el recibo y llenó los campos. Revísalos antes de guardar.${j.unidad ? "" : " No pudo saber si el precio es por pergamino o por verde: márcalo tú."}${j.notas ? ` ${j.notas}` : ""}`,
      );
    } catch (err) {
      setAviso(`${(err as Error).message} Llena los campos a mano.`);
    } finally {
      setLeyendo(false);
    }
  }

  const calc = useMemo(() => {
    const kilos = aKilos(f.kilos);
    const precio = aNumero(f.precio);
    if (!kilos || !precio || !unidad) return null;
    const porCps = unidad === "cps" ? precio : precio / factor;
    const techo = techos[destino];
    return { total: kilos * precio, porCps, porVerde: porCps * factor, techo, holgura: techo - porCps, pct: Math.min(1, porCps / techo) };
  }, [f.kilos, f.precio, unidad, destino, techos, factor]);

  return (
    <form action={accion} className="flex flex-col gap-4 px-5 md:px-8">
      <Card className="flex items-center gap-3 p-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-400 bg-muted">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="Foto del recibo" className="size-full object-cover" />
          ) : (
            <Camera className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{foto ? "Recibo cargado" : "Foto del recibo"}</p>
          <p className="text-xs text-muted-foreground">{conIa ? "Toma la foto y la IA llena el formulario." : "Opcional: la lectura con IA está desactivada."}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => entrada.current?.click()} disabled={leyendo}>
          {leyendo ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
          {foto ? "Repetir" : "Tomar"}
        </Button>
        <input ref={entrada} type="file" accept="image/*" capture="environment" className="sr-only" onChange={alElegirFoto} aria-label="Foto del recibo" />
      </Card>

      {conIa ? <SelectorModelo disabled={leyendo} /> : null}

      {aviso ? (
        <p role="status" className="flex gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          {aviso}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" htmlFor="fecha">
          <Input id="fecha" name="fecha" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} required />
        </Field>
        <Field label="Caficultor" htmlFor="caficultor">
          <Input id="caficultor" name="caficultor" placeholder="Caficultor 017" value={f.caficultor} onChange={(e) => setF({ ...f, caficultor: e.target.value })} required />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Usa el código del caficultor, no su nombre.</p>

      <Segmented
        name="calidad"
        label="Calidad"
        value={calidad}
        onChange={setCalidad}
        options={[
          { value: "consumo", label: "Consumo" },
          { value: "excelso", label: "Excelso" },
          { value: "premium", label: "Premium" },
          { value: "especial", label: "Especial" },
        ]}
      />
      <div>
        <Segmented name="unidad" label="El precio es por kilo de" value={unidad} onChange={setUnidad} options={[{ value: "cps", label: "Pergamino seco" }, { value: "verde", label: "Café verde" }]} />
        <p className="mt-1.5 text-xs text-muted-foreground">Obligatorio: sin este dato el costo por kilo no es comparable.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kilos" htmlFor="kilos">
          <Input id="kilos" inputMode="decimal" value={f.kilos} onChange={(e) => setF({ ...f, kilos: e.target.value })} required />
        </Field>
        <Field label="Precio por kilo" htmlFor="precio">
          <Input id="precio" inputMode="numeric" placeholder="$25.900" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} required />
        </Field>
      </div>

      <Segmented name="destino" label="Este café es para" value={destino} onChange={setDestino} options={[{ value: "sustituir", label: "Sustituir" }, { value: "migrar", label: "Migrar" }, { value: "nuevo", label: "Venta nueva" }]} />

      <input type="hidden" name="kilos" value={aKilos(f.kilos) || ""} />
      <input type="hidden" name="precioKg" value={aNumero(f.precio) || ""} />
      <input type="hidden" name="leidaPorIa" value={leida ? "1" : "0"} />

      {calc ? (
        <Card className="flex flex-col gap-2.5 p-4 text-sm">
          <Fila a="Total a pagar" b={`$${fmt(calc.total)}`} />
          <Fila a="Equivale a kilo verde" b={`$${fmt(calc.porVerde)}`} />
          <Fila a="Techo de compra" b={`$${fmt(calc.techo)} por kg cps`} />
          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className={calc.holgura < 0 ? "h-2 bg-red-600" : calc.holgura < calc.techo * 0.03 ? "h-2 bg-amber-600" : "h-2 bg-ocre"} style={{ width: `${calc.pct * 100}%` }} />
          </div>
          <p className={calc.holgura < 0 ? "text-sm font-medium text-red-700" : "text-sm text-warn-fg"}>
            {calc.holgura < 0
              ? `Sobre el techo por $${fmt(-calc.holgura)}: a este precio el café de Tena no deja margen en este destino.`
              : `Dentro del techo por $${fmt(calc.holgura)}. El techo para ventas nuevas es $${fmt(techos.nuevo)}.`}
          </p>
        </Card>
      ) : null}

      {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}

      <Button type="submit" size="lg" disabled={enviando || leyendo}>
        {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Guardar compra
      </Button>
    </form>
  );
}

function Fila({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{a}</span>
      <span className="tabular font-semibold">{b}</span>
    </div>
  );
}
