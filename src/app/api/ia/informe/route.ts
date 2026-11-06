import { proveedor, redactarInforme } from "@/lib/ia";
import { almacen } from "@/lib/store";
import { calcular } from "@/lib/metricas";
import { cifrasParaIa } from "@/lib/contexto";

export async function POST() {
  if (proveedor() === "ninguno") return Response.json({ error: "La redacción con IA está desactivada." }, { status: 503 });
  const m = calcular(await almacen().leerTodo());
  try {
    const texto = await redactarInforme(cifrasParaIa(m), m.mesActual);
    return Response.json({ texto });
  } catch (e) {
    return Response.json({ error: `No se pudo redactar: ${(e as Error).message}` }, { status: 502 });
  }
}
