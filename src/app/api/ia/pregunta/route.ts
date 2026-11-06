import { proveedor, responderPregunta } from "@/lib/ia";
import { almacen } from "@/lib/store";
import { calcular } from "@/lib/metricas";
import { contextoPreguntas } from "@/lib/contexto";

export async function POST(req: Request) {
  if (proveedor() === "ninguno") return Response.json({ error: "Las preguntas con IA están desactivadas." }, { status: 503 });
  const { pregunta } = (await req.json()) as { pregunta?: string };
  if (!pregunta || pregunta.length > 500) return Response.json({ error: "Pregunta no válida." }, { status: 400 });
  const d = await almacen().leerTodo();
  try {
    const texto = await responderPregunta(pregunta, contextoPreguntas(d, calcular(d)));
    return Response.json({ texto });
  } catch (e) {
    return Response.json({ error: `No se pudo responder: ${(e as Error).message}` }, { status: 502 });
  }
}
