"use client";
import { useState } from "react";
import { Copy, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useModelo } from "@/components/selector-modelo";

const TITULOS = ["Resumen", "Torrefactora", "Compras y precio", "Ventas", "Escalera de inversión", "Alertas"];

export function Redactar({ conIa }: { conIa: boolean }) {
  const [modelo] = useModelo();
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function redactar() {
    setCargando(true);
    setError("");
    try {
      const r = await fetch("/api/ia/informe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ modelo }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setTexto(j.texto);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  const bloques = texto
    .split(/\n+/)
    .map((l) => l.replace(/^#+\s*|\*\*/g, "").trim())
    .filter(Boolean);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Borrador para el Comité</CardTitle>
          <CardDescription>La IA redacta alrededor de las cifras; revísalo antes de enviarlo.</CardDescription>
        </div>
        <div className="flex gap-2">
          {texto ? (
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(texto)}>
              <Copy aria-hidden /> Copiar
            </Button>
          ) : null}
          <Button onClick={redactar} disabled={!conIa || cargando}>
            {cargando ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {texto ? "Volver a redactar" : "Redactar con IA"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!conIa ? <p className="text-sm text-muted-foreground">La IA está desactivada. Configura la clave de Anthropic en Vercel para activarla.</p> : null}
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
        {cargando && !texto ? <p className="text-sm text-muted-foreground">Redactando con las cifras del mes…</p> : null}
        {bloques.map((b, i) =>
          TITULOS.some((t) => b.toLowerCase().startsWith(t.toLowerCase()) && b.length < t.length + 3) ? (
            <h3 key={i} className="pt-2 text-[15px] font-semibold">
              {b.replace(/:$/, "")}
            </h3>
          ) : (
            <p key={i} className="text-[15px] leading-relaxed text-zinc-800">
              {b}
            </p>
          ),
        )}
        {texto ? (
          <div className="pt-2">
            <Badge tone="accent">Borrador redactado con IA</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function Preguntar({ conIa }: { conIa: boolean }) {
  const [modelo] = useModelo();
  const [p, setP] = useState("");
  const [hilo, setHilo] = useState<{ q: string; a: string }[]>([]);
  const [cargando, setCargando] = useState(false);
  const sugerencias = ["¿Cuánto nos costó el kilo de pergamino este mes?", "¿Qué clientes llevan más de dos meses sin ajuste de precio?", "¿Cuántos baches fueron práctica pedagógica?"];

  async function enviar(q: string) {
    if (!q.trim()) return;
    setCargando(true);
    setP("");
    try {
      const r = await fetch("/api/ia/pregunta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pregunta: q, modelo }) });
      const j = await r.json();
      setHilo((h) => [...h, { q, a: r.ok ? j.texto : j.error }]);
    } catch (e) {
      setHilo((h) => [...h, { q, a: (e as Error).message }]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card className="flex h-fit flex-col">
      <CardHeader>
        <CardTitle>Pregúntale a tus datos</CardTitle>
        <CardDescription>A la IA se le envían identificadores, no nombres.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {hilo.length === 0 ? (
          <div className="flex flex-col gap-2">
            {sugerencias.map((s) => (
              <button key={s} type="button" disabled={!conIa || cargando} onClick={() => enviar(s)} className="rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:bg-muted disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
        ) : null}
        {hilo.map((x, i) => (
          <div key={i} className="flex flex-col gap-2">
            <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-muted px-3 py-2 text-sm">{x.q}</p>
            <p className="max-w-[92%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-border px-3 py-2 text-sm leading-relaxed">{x.a}</p>
          </div>
        ))}
        {cargando ? <p className="text-sm text-muted-foreground">Consultando los registros…</p> : null}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            enviar(p);
          }}
        >
          <label htmlFor="pregunta" className="sr-only">
            Escribe una pregunta
          </label>
          <Input id="pregunta" value={p} onChange={(e) => setP(e.target.value)} placeholder="Escribe una pregunta" disabled={!conIa} />
          <Button type="submit" size="icon" aria-label="Enviar pregunta" disabled={!conIa || cargando}>
            <Send aria-hidden />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
