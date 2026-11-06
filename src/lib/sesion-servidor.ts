import "server-only";
import { cookies } from "next/headers";
import { COOKIE, verificar } from "./sesion";

export async function sesionActual() {
  return verificar((await cookies()).get(COOKIE)?.value);
}
