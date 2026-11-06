import { Encabezado } from "@/components/shell";
import { FormVenta } from "./form";
import { hoyISO } from "@/lib/metricas";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-xl pb-6">
      <Encabezado titulo="Registrar venta" volver="/registrar" />
      <FormVenta hoy={hoyISO()} />
    </main>
  );
}
