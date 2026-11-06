"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { almacen } from "@/lib/store";
import { claveApp } from "@/lib/clave";
import { COOKIE, firmar, opcionesCookie, verificar, type Sesion } from "@/lib/sesion";
import { cifrar, comprobar } from "@/lib/claves";
import * as usuarios from "@/lib/usuarios";
import { crearComentario, marcarComentario } from "@/lib/comentarios";

/**
 * Acciones del servidor. Cada una valida lo que llega (las acciones se pueden llamar por POST directo)
 * y exige una sesión de usuario válida.
 */

export type Resultado = { ok: boolean; error?: string; mensaje?: string };

async function exigirSesion(): Promise<Sesion> {
  const c = await cookies();
  const s = await verificar(c.get(COOKIE)?.value);
  if (!s) redirect("/entrar");
  return s;
}

async function exigirAdmin(): Promise<Sesion> {
  const s = await exigirSesion();
  if (s.rol !== "admin") throw new Error("Solo un administrador puede hacer esto.");
  return s;
}

const num = z.coerce.number().finite();
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const id = z.string().trim().min(1).max(60);

function refrescar() {
  for (const p of ["/", "/tablero", "/informe", "/registrar"]) revalidatePath(p);
}

export async function guardarCompra(_: Resultado | null, fd: FormData): Promise<Resultado> {
  const yo = await exigirSesion();
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
  await almacen().agregarCompra({ ...c, leidaPorIa: leidaPorIa === "1", nota: c.nota || null, registradoPor: yo.usuario });
  refrescar();
  redirect("/?guardado=compra");
}

export async function guardarBache(_: Resultado | null, fd: FormData): Promise<Resultado> {
  const yo = await exigirSesion();
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
    registradoPor: yo.usuario,
  });
  refrescar();
  redirect("/?guardado=bache");
}

export async function guardarVenta(_: Resultado | null, fd: FormData): Promise<Resultado> {
  const yo = await exigirSesion();
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
  await almacen().agregarVenta({ ...r.data, registradoPor: yo.usuario });
  refrescar();
  redirect("/?guardado=venta");
}

export async function guardarGasto(_: Resultado | null, fd: FormData): Promise<Resultado> {
  const yo = await exigirSesion();
  const r = z
    .object({
      fecha,
      tipo: z.enum(["flete", "energia", "mantenimiento", "otro"]),
      valor: num.positive().max(1000000000),
      descripcion: z.string().max(200).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: "Revisa el tipo y el valor." };
  await almacen().agregarGasto({ ...r.data, descripcion: r.data.descripcion || null, registradoPor: yo.usuario });
  refrescar();
  redirect("/?guardado=gasto");
}

async function iniciarSesion(u: usuarios.Usuario) {
  const c = await cookies();
  c.set(COOKIE, await firmar({ uid: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol }), opcionesCookie);
}

const esquemaUsuario = z.object({
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .refine((u) => !u.includes("@"), "El usuario no es un correo: escribe un nombre corto, por ejemplo nombre.apellido.")
    .refine((u) => /^[a-z0-9._-]{3,30}$/.test(u), "El usuario debe tener entre 3 y 30 letras o números, sin espacios ni tildes."),
  nombre: z.string().trim().min(2, "Escribe el nombre.").max(60),
  clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(100),
});

export async function entrar(_: Resultado | null, fd: FormData): Promise<Resultado> {
  const usuario = String(fd.get("usuario") ?? "");
  const clave = String(fd.get("clave") ?? "");
  let u: usuarios.Usuario | null;
  try {
    u = await usuarios.buscar(usuario);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!u && usuario.includes("@")) return { ok: false, error: "Escribe tu usuario de Kafa, no tu correo." };
  if (!u || !u.activo || !comprobar(clave, u.claveHash)) return { ok: false, error: "Usuario o contraseña incorrectos." };
  await iniciarSesion(u);
  redirect("/");
}

/** Crea el primer administrador. Solo funciona si no hay usuarios y pide la APP_CLAVE como clave de instalación. */
export async function crearPrimerAdmin(_: Resultado | null, fd: FormData): Promise<Resultado> {
  if (await usuarios.hayUsuarios()) return { ok: false, error: "Ya hay usuarios creados. Entra con tu usuario." };
  const instalacion = claveApp();
  if (instalacion && String(fd.get("instalacion") ?? "").trim() !== instalacion)
    return { ok: false, error: "La clave de instalación no coincide con APP_CLAVE de Vercel." };
  const r = esquemaUsuario.safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  await usuarios.crear({ usuario: r.data.usuario, nombre: r.data.nombre, rol: "admin", claveHash: cifrar(r.data.clave), activo: true });
  const u = await usuarios.buscar(r.data.usuario);
  if (u) await iniciarSesion(u);
  redirect("/");
}

/** Registro automático: cualquiera con el código del equipo crea su cuenta de registro y entra de una. */
export async function crearMiCuenta(_: Resultado | null, fd: FormData): Promise<Resultado> {
  const codigo = (process.env.CODIGO_EQUIPO ?? "").trim() || claveApp();
  if (!codigo) return { ok: false, error: "El registro con código no está configurado. Pídele la cuenta a un administrador." };
  if (String(fd.get("codigo") ?? "").trim() !== codigo) return { ok: false, error: "El código del equipo no es correcto." };
  const r = esquemaUsuario.safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  try {
    await usuarios.crear({ usuario: r.data.usuario, nombre: r.data.nombre, rol: "registro", claveHash: cifrar(r.data.clave), activo: true });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const u = await usuarios.buscar(r.data.usuario);
  if (u) await iniciarSesion(u);
  redirect("/");
}

export async function crearUsuario(_: Resultado | null, fd: FormData): Promise<Resultado> {
  await exigirAdmin();
  const r = esquemaUsuario.extend({ rol: z.enum(["admin", "registro"]) }).safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  try {
    await usuarios.crear({ usuario: r.data.usuario, nombre: r.data.nombre, rol: r.data.rol, claveHash: cifrar(r.data.clave), activo: true });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/usuarios");
  return { ok: true, mensaje: `Usuario ${r.data.usuario} creado. Pásale la contraseña en persona.` };
}

export async function cambiarActivo(fd: FormData) {
  const yo = await exigirAdmin();
  const id = String(fd.get("id") ?? "");
  if (id && id !== yo.uid) await usuarios.actualizar(id, { activo: fd.get("activo") === "1" });
  revalidatePath("/usuarios");
}

export async function restablecerClave(_: Resultado | null, fd: FormData): Promise<Resultado> {
  await exigirAdmin();
  const id = String(fd.get("id") ?? "");
  const clave = String(fd.get("clave") ?? "");
  if (clave.length < 8) return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  await usuarios.actualizar(id, { claveHash: cifrar(clave) });
  return { ok: true, mensaje: "Contraseña cambiada." };
}

export async function salir() {
  const c = await cookies();
  c.delete(COOKIE);
  redirect("/entrar");
}

// ---------------------------------------------------------------- comentarios
export async function enviarComentario(_: Resultado | null, fd: FormData): Promise<Resultado> {
  const yo = await exigirSesion();
  const r = z
    .object({
      tipo: z.enum(["idea", "error", "diseno", "otro"]),
      texto: z.string().trim().min(3, "Escribe el comentario.").max(2000),
      pantalla: z.string().max(200),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  try {
    await crearComentario({ ...r.data, usuario: yo.usuario, nombre: yo.nombre });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/comentarios");
  return { ok: true, mensaje: "¡Gracias! Comentario enviado." };
}

export async function cambiarComentario(fd: FormData) {
  await exigirAdmin();
  await marcarComentario(String(fd.get("id") ?? ""), fd.get("resuelto") === "1");
  revalidatePath("/comentarios");
}
