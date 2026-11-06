"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { almacen } from "@/lib/store";

/**
 * Acciones del servidor. Cada una valida lo que llega (las acciones se pueden llamar por POST directo)
 * y exige la sesión cuando la aplicación tiene clave de acceso (APP_CLAVE).
 */

export type Resultado = { ok: boolean; error?: string };

async function exigirSesion() {
  const clave = process.env.APP_CLAVE;
  if (!clave) return;
  const c = await cookies();
  if (c.get("kafa_sesion")?.value !== clave) throw new Error("Sin sesión");
}

const num = z.coerce.number().finite();
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const id = z.string().trim().min(1).max(60);

function refrescar() {
  for (const p of ["/", "/tablero", "/informe", "/registrar"]) revalidatePath(p);
}

export async function guardarCompra(_: Resultado | null, fd: FormData): Promise<Resultado> {
  await exigirSesion();
  const r = z
    .object({
      fecha,
      caficultor: id,
      calidad: z.enum(["consumo", "excelso", "premium", "especial"]),
      unidad: z.enum(["cps", "verde"]),
      destino: z.enum(["sustituir", "migrar", "nuevo"]),
      kilos: num.positive().max(100000),
      precioKg: num.positive().max(1000000),
      leidaPorIa: z.string().optional(),
      nota: z.string().max(300).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: "Revisa los campos: falta la calidad, la unidad o un número no es válido." };
  const { leidaPorIa, ...c } = r.data;
  await almacen().agregarCompra({ ...c, leidaPorIa: leidaPorIa === "1", nota: c.nota || null });
  refrescar();
  redirect("/?guardado=compra");
}

export async function guardarBache(_: Resultado | null, fd: FormData): Promise<Resultado> {
  await exigirSesion();
  const r = z
    .object({
      fecha,
      tipo: z.enum(["servicio", "propio"]),
      caficultor: z.string().trim().max(60).optional(),
      kilosCps: num.positive().max(1000),
      minutos: num.int().positive().max(600),
      perfil: z.enum(["claro", "medio", "oscuro"]),
      pedagogico: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: "Revisa los kilos, los minutos y el perfil." };
  const operadores = fd.getAll("operadores").map(String).filter(Boolean).slice(0, 6);
  if (!operadores.length) return { ok: false, error: "Marca quién hizo el bache." };
  await almacen().agregarBache({
    ...r.data,
    caficultor: r.data.tipo === "servicio" ? r.data.caficultor || null : null,
    operadores,
    pedagogico: r.data.pedagogico === "on",
  });
  refrescar();
  redirect("/?guardado=bache");
}

export async function guardarVenta(_: Resultado | null, fd: FormData): Promise<Resultado> {
  await exigirSesion();
  const r = z
    .object({
      fecha,
      cliente: id,
      linea: z.enum(["institucional", "premium", "especial"]),
      origen: z.enum(["maquila", "tena"]),
      libras: num.positive().max(100000),
      precioLb: num.positive().max(1000000),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: "Revisa la línea, el origen, las libras y el precio." };
  await almacen().agregarVenta(r.data);
  refrescar();
  redirect("/?guardado=venta");
}

export async function guardarGasto(_: Resultado | null, fd: FormData): Promise<Resultado> {
  await exigirSesion();
  const r = z
    .object({
      fecha,
      tipo: z.enum(["flete", "energia", "mantenimiento", "otro"]),
      valor: num.positive().max(1000000000),
      descripcion: z.string().max(200).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: "Revisa el tipo y el valor." };
  await almacen().agregarGasto({ ...r.data, descripcion: r.data.descripcion || null });
  refrescar();
  redirect("/?guardado=gasto");
}

export async function entrar(_: Resultado | null, fd: FormData): Promise<Resultado> {
  const clave = process.env.APP_CLAVE;
  if (!clave || fd.get("clave") !== clave) return { ok: false, error: "Clave incorrecta." };
  const c = await cookies();
  c.set("kafa_sesion", clave, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  redirect("/");
}
