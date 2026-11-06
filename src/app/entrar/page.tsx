import { hayUsuarios } from "@/lib/usuarios";
import { claveApp } from "@/lib/clave";
import { PantallaEntrada } from "./cliente";

export const dynamic = "force-dynamic";

export default async function Entrar() {
  let primeraVez = false;
  let error: string | null = null;
  try {
    primeraVez = !(await hayUsuarios());
  } catch (e) {
    error = (e as Error).message;
  }
  return <PantallaEntrada primeraVez={primeraVez} pideInstalacion={!!claveApp()} errorInicial={error} />;
}
