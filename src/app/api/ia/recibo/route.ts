import { modeloValido } from "@/lib/modelos";
import { leerRecibo, proveedor } from "@/lib/ia";

export async function POST(req: Request) {
  if (proveedor() === "ninguno") return Response.json({ error: "La lectura con IA está desactivada. Llena el formulario a mano." }, { status: 503 });
  const { base64, tipo, modelo } = (await req.json()) as { base64?: string; tipo?: string; modelo?: string };
  if (!base64 || !tipo || !/^image\/(jpeg|png|webp)$/.test(tipo) || base64.length > 6_000_000)
    return Response.json({ error: "Imagen no válida." }, { status: 400 });
  try {
    return Response.json(await leerRecibo(base64, tipo, modeloValido(modelo)));
  } catch (e) {
    return Response.json({ error: `No se pudo leer el recibo: ${(e as Error).message}` }, { status: 502 });
  }
}
