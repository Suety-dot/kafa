/** Nombre legible de cada pantalla, para los comentarios. */
const NOMBRES: [string, string][] = [
  ["/registrar/compra", "Registrar compra"],
  ["/registrar/bache", "Registrar bache"],
  ["/registrar/venta", "Registrar venta"],
  ["/registrar/gasto", "Registrar gasto"],
  ["/registrar", "Registrar"],
  ["/registros", "Registros"],
  ["/tablero", "Tablero"],
  ["/informe", "Informe"],
  ["/usuarios", "Usuarios"],
  ["/comentarios", "Comentarios"],
];
export function nombrePantalla(ruta: string): string {
  if (ruta === "/" || ruta === "") return "Inicio";
  return NOMBRES.find(([r]) => ruta.startsWith(r))?.[1] ?? ruta;
}
