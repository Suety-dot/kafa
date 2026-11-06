"use client";
import { useActionState } from "react";
import { entrar } from "@/app/acciones";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export default function Entrar() {
  const [estado, accion, enviando] = useActionState(entrar, null);
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm p-6">
        <form action={accion} className="flex flex-col gap-4">
          <div>
            <p className="text-xl font-bold">Kafa</p>
            <p className="text-sm text-muted-foreground">Café Formemos · escribe la clave de acceso</p>
          </div>
          <Field label="Clave" htmlFor="clave">
            <Input id="clave" name="clave" type="password" autoComplete="current-password" required />
          </Field>
          {estado?.error ? <p className="text-sm font-medium text-red-700">{estado.error}</p> : null}
          <Button type="submit" disabled={enviando}>
            Entrar
          </Button>
        </form>
      </Card>
    </main>
  );
}
