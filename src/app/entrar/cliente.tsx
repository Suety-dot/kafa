"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { crearMiCuenta, crearPrimerAdmin, entrar } from "@/app/acciones";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function Grano({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icon-192.png" alt="" width={96} height={96} className={cn("rounded-[22%] shadow-sm", className)} />
  );
}

export function PantallaEntrada({ primeraVez, pideInstalacion, errorInicial }: { primeraVez: boolean; pideInstalacion: boolean; errorInicial: string | null }) {
  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Grano className="size-16" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kafa</h1>
            <p className="text-sm text-muted-foreground">Café Formemos</p>
          </div>
        </div>
        {errorInicial ? (
          <Card className="p-5 text-sm text-red-700">{errorInicial}</Card>
        ) : primeraVez ? (
          <PrimerAdmin pideInstalacion={pideInstalacion} />
        ) : (
          <IngresoOCuenta />
        )}
      </div>
    </main>
  );
}

function Ingreso() {
  const [estado, accion, enviando] = useActionState(entrar, null);
  const [usuario, setUsuario] = useState("");
  return (
    <Card className="p-6">
      <form action={accion} className="flex flex-col gap-4">
        <Field label="Usuario" htmlFor="usuario" hint="Tu usuario de Kafa, no tu correo.">
          <Input id="usuario" name="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
        </Field>
        <Field label="Contraseña" htmlFor="clave">
          <Input id="clave" name="clave" type="password" autoComplete="current-password" required />
        </Field>
        {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Entrar
        </Button>
        <p className="text-center text-xs text-muted-foreground">¿Olvidaste la contraseña? Pídele a un administrador que la cambie.</p>
      </form>
    </Card>
  );
}

function PrimerAdmin({ pideInstalacion }: { pideInstalacion: boolean }) {
  const [estado, accion, enviando] = useActionState(crearPrimerAdmin, null);
  return (
    <Card className="p-6">
      <form action={accion} className="flex flex-col gap-4">
        <div>
          <p className="font-semibold">Primera vez: crea el administrador</p>
          <p className="text-sm text-muted-foreground">Esta cuenta podrá crear los usuarios del equipo.</p>
        </div>
        {pideInstalacion ? (
          <Field label="Clave de instalación" htmlFor="instalacion" hint="Es la APP_CLAVE que pusiste en Vercel.">
            <Input id="instalacion" name="instalacion" type="password" required />
          </Field>
        ) : null}
        <Field label="Tu nombre" htmlFor="nombre">
          <Input id="nombre" name="nombre" placeholder="Nombre y apellido" autoComplete="name" required />
        </Field>
        <Field label="Usuario" htmlFor="usuario" hint="No es un correo: un nombre corto, en minúsculas y sin espacios. Por ejemplo: ana.gomez">
          <Input id="usuario" name="usuario" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
        </Field>
        <Field label="Contraseña" htmlFor="clave" hint="Al menos 8 caracteres.">
          <Input id="clave" name="clave" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Crear y entrar
        </Button>
      </form>
    </Card>
  );
}

function IngresoOCuenta() {
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  return (
    <div className="flex flex-col gap-4">
      {modo === "entrar" ? <Ingreso /> : <CrearCuenta />}
      <button type="button" onClick={() => setModo(modo === "entrar" ? "crear" : "entrar")} className="min-h-11 rounded-lg text-sm font-medium text-primary hover:underline">
        {modo === "entrar" ? "¿Eres del equipo y no tienes cuenta? Créala aquí" : "Ya tengo cuenta: entrar"}
      </button>
    </div>
  );
}

function CrearCuenta() {
  const [estado, accion, enviando] = useActionState(crearMiCuenta, null);
  const [f, setF] = useState({ nombre: "", usuario: "" });
  return (
    <Card className="p-6">
      <form action={accion} className="flex flex-col gap-4">
        <div>
          <p className="font-semibold">Crea tu cuenta</p>
          <p className="text-sm text-muted-foreground">Necesitas el código del equipo que te da la Fundación.</p>
        </div>
        <Field label="Tu nombre" htmlFor="nombre" hint="Así te va a saludar Kafa.">
          <Input id="nombre" name="nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Nombre y apellido" autoComplete="name" required />
        </Field>
        <Field label="Usuario" htmlFor="usuario" hint="No es un correo: un nombre corto, en minúsculas y sin espacios. Por ejemplo: ana.gomez">
          <Input id="usuario" name="usuario" value={f.usuario} onChange={(e) => setF({ ...f, usuario: e.target.value })} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
        </Field>
        <Field label="Contraseña" htmlFor="clave" hint="Al menos 8 caracteres.">
          <Input id="clave" name="clave" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field label="Código del equipo" htmlFor="codigo">
          <Input id="codigo" name="codigo" type="password" autoCapitalize="none" autoCorrect="off" required />
        </Field>
        {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Crear cuenta y entrar
        </Button>
      </form>
    </Card>
  );
}
