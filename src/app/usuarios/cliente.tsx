"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { crearUsuario, restablecerClave } from "@/app/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";

export function NuevoUsuario() {
  const [estado, accion, enviando] = useActionState(crearUsuario, null);
  const [rol, setRol] = useState<"registro" | "admin">("registro");
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Nuevo usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={accion} className="flex flex-col gap-4" key={estado?.ok ? estado.mensaje : "form"}>
          <Field label="Nombre" htmlFor="nombre" hint="Es el que aparece en el saludo.">
            <Input id="nombre" name="nombre" placeholder="María Fernanda Ruiz" required />
          </Field>
          <Field label="Usuario" htmlFor="usuario" hint="Minúsculas, sin espacios.">
            <Input id="usuario" name="usuario" placeholder="mariafernanda" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
          </Field>
          <Field label="Contraseña inicial" htmlFor="clave" hint="Al menos 8 caracteres. Entrégala en persona.">
            <Input id="clave" name="clave" type="text" minLength={8} autoComplete="off" required />
          </Field>
          <Segmented name="rol" label="Rol" value={rol} onChange={setRol} options={[{ value: "registro", label: "Registro" }, { value: "admin", label: "Administrador" }]} />
          {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
          {estado?.ok ? <p className="text-sm font-medium text-ok-fg">{estado.mensaje}</p> : null}
          <Button type="submit" disabled={enviando}>
            {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Crear usuario
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CambiarClave({ id }: { id: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState(restablecerClave, null);
  if (!abierto)
    return (
      <button type="button" onClick={() => setAbierto(true)} className="h-9 rounded-md border border-border px-3 text-xs hover:bg-muted">
        Cambiar contraseña
      </button>
    );
  return (
    <form action={accion} className="flex w-full items-center gap-2 sm:w-auto">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`clave-${id}`} className="sr-only">
        Nueva contraseña
      </label>
      <Input id={`clave-${id}`} name="clave" type="text" minLength={8} placeholder="Nueva contraseña" className="h-9 text-sm" required />
      <Button type="submit" size="sm" disabled={enviando}>
        Guardar
      </Button>
      {estado?.error ? <span className="text-xs text-red-700">{estado.error}</span> : null}
      {estado?.ok ? <span className="text-xs text-ok-fg">{estado.mensaje}</span> : null}
    </form>
  );
}
