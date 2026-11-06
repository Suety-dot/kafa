import { Encabezado } from "@/components/shell";
import { FormBache } from "./form";
import { hoyISO } from "@/lib/metricas";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-xl pb-6">
      <Encabezado titulo="Registrar bache" volver="/registrar" />
      <FormBache hoy={hoyISO()} />
    </main>
  );
}
