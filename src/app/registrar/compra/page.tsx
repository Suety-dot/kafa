import { Encabezado } from "@/components/shell";
import { FormCompra } from "./form";
import { almacen } from "@/lib/store";
import { calcular, hoyISO } from "@/lib/metricas";
import { proveedor } from "@/lib/ia";
import { SUPUESTOS } from "@/lib/modelo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const m = calcular(await almacen().leerTodo());
  return (
    <main className="mx-auto w-full max-w-xl pb-6">
      <Encabezado titulo="Registrar compra" volver="/registrar" />
      <FormCompra
        techos={m.techos}
        factor={SUPUESTOS.factorCpsVerde}
        conIa={proveedor() !== "ninguno"}
        hoy={hoyISO()}
      />
    </main>
  );
}
