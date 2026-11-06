import { redirect } from "next/navigation";
import { Encabezado } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cambiarActivo } from "@/app/acciones";
import { sesionActual } from "@/lib/sesion-servidor";
import { listar } from "@/lib/usuarios";
import { NuevoUsuario, CambiarClave } from "./cliente";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const yo = await sesionActual();
  if (yo?.rol !== "admin") redirect("/");
  const lista = await listar();
  return (
    <main className="mx-auto w-full max-w-4xl pb-8">
      <Encabezado titulo="Usuarios" sub="Quién puede entrar a Kafa" volver="/" />
      <div className="grid gap-4 px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Equipo</CardTitle>
            <CardDescription>Los usuarios de registro pueden registrar y ver; los administradores además gestionan usuarios.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-muted">
            {lista.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {u.nombre} {u.id === yo.uid ? <span className="font-normal text-muted-foreground">(tú)</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">@{u.usuario}</p>
                </div>
                <Badge tone={u.rol === "admin" ? "accent" : "default"}>{u.rol === "admin" ? "Administrador" : "Registro"}</Badge>
                {!u.activo ? <Badge tone="warn">Inactivo</Badge> : null}
                <CambiarClave id={u.id} />
                {u.id !== yo.uid ? (
                  <form action={cambiarActivo}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="activo" value={u.activo ? "0" : "1"} />
                    <button type="submit" className="h-9 rounded-md border border-border px-3 text-xs hover:bg-muted">
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
        <NuevoUsuario />
      </div>
    </main>
  );
}
