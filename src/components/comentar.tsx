"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquarePlus, X } from "lucide-react";
import { enviarComentario } from "@/app/acciones";
import { nombrePantalla } from "@/lib/pantallas";
import { cn } from "@/lib/utils";

const TIPOS = [
  { id: "idea", nombre: "Idea" },
  { id: "error", nombre: "Algo falla" },
  { id: "diseno", nombre: "Diseño" },
  { id: "otro", nombre: "Otro" },
] as const;

/** Botón flotante para dejar un comentario desde cualquier pantalla. Guarda la pantalla y quién lo escribió. */
export function Comentar() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["id"]>("idea");
  const [estado, accion, enviando] = useActionState(enviarComentario, null);
  const texto = useRef<HTMLTextAreaElement>(null);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (abierto) setTimeout(() => texto.current?.focus(), 50);
  }, [abierto]);

  useEffect(() => {
    if (!estado?.ok) return;
    formulario.current?.reset();
    const t = setTimeout(() => setAbierto(false), 1600);
    return () => clearTimeout(t);
  }, [estado]);

  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto]);

  if (ruta === "/entrar" || ruta === "/comentarios") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 flex h-11 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-lg shadow-black/15 md:right-6 md:bottom-6"
      >
        <MessageSquarePlus className="size-4" aria-hidden /> Comentar
      </button>

      {abierto ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center" onClick={() => setAbierto(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="comentar-titulo"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl bg-card p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-xl md:rounded-3xl md:pb-5"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="comentar-titulo" className="text-lg font-bold">
                  Tu comentario
                </h2>
                <p className="text-sm text-muted-foreground">Sobre la pantalla {nombrePantalla(ruta)}. Se guarda con tu nombre.</p>
              </div>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-muted">
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {estado?.ok ? (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-ok-bg px-4 py-6 text-base font-semibold text-ok-fg">
                <CheckCircle2 className="size-5" aria-hidden /> {estado.mensaje}
              </p>
            ) : (
              <form ref={formulario} action={accion} className="flex flex-col gap-3">
                <input type="hidden" name="pantalla" value={ruta} />
                <input type="hidden" name="tipo" value={tipo} />
                <div role="radiogroup" aria-label="Tipo de comentario" className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
                  {TIPOS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={t.id === tipo}
                      onClick={() => setTipo(t.id)}
                      className={cn(
                        "h-10 rounded-lg text-sm transition-colors",
                        t.id === tipo ? "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.nombre}
                    </button>
                  ))}
                </div>
                <label htmlFor="comentario" className="sr-only">
                  Comentario
                </label>
                <textarea
                  ref={texto}
                  id="comentario"
                  name="texto"
                  rows={4}
                  maxLength={2000}
                  required
                  placeholder={tipo === "error" ? "¿Qué estabas haciendo y qué pasó?" : tipo === "diseno" ? "¿Qué se ve raro o qué cambiarías?" : "Escribe lo que piensas"}
                  className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
                <button type="submit" disabled={enviando} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-60">
                  {enviando ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null} Enviar comentario
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
