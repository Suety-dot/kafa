# Kafa · instrucciones para Claude Code

Aplicación de registro y seguimiento del café de la Fundación Formemos (Tena, Cundinamarca). Prototipo del Grupo 33 de Consultandes, Universidad de los Andes. Lee también AGENTS.md: esta versión de Next.js (16) tiene cambios; consulta `node_modules/next/dist/docs/` antes de usar una API que no conozcas.

## Reglas que no se negocian

1. **La IA nunca calcula cifras.** Todo número sale de `src/lib/modelo.ts` o `src/lib/metricas.ts`. La IA solo extrae datos de un recibo, redacta alrededor de cifras ya calculadas o responde con los datos que recibe.
2. **La aplicación funciona sin IA.** Con `IA_PROVEEDOR=ninguno` todo registro y todo cálculo sigue funcionando.
3. **Privacidad.** Caficultores y clientes se registran con identificadores ("Caficultor 017"), nunca con nombres. A la IA no se le envían nombres de personas.
4. **Las fórmulas siguen el libro `Etapa3_Escenarios_Formemos.xlsx`.** Si cambias un supuesto, cámbialo en `SUPUESTOS` y deja la fuente en un comentario.
5. **Toda acción del servidor valida su entrada con zod y exige una sesión de usuario** (`src/lib/sesion.ts`, cookie firmada). Las contraseñas solo se guardan cifradas con scrypt (`src/lib/claves.ts`).

## Estilo

- Español neutro de Colombia en toda la interfaz, con "tú". Sin guiones largos. No uses guiones en palabras que no los necesiten.
- Componentes estilo shadcn/ui escritos a mano en `src/components/ui` (el registro de shadcn puede no estar disponible); Tailwind v4 con los tokens de `globals.css`. Acento ocre `--primary: #8a5f20` (contraste AA con blanco).
- Pensada primero para celular: objetivos táctiles de 44 px, formularios cortos, navegación inferior en móvil y lateral en escritorio.
- Números con formato colombiano (`Intl.NumberFormat("es-CO")`), negativos entre paréntesis.

## Comandos

- `npm run dev`: desarrollo en http://localhost:3000
- `npm run celular`: construye y sirve en la red local para abrirla desde el celular
- `npm run build`: verificar tipos y compilación antes de subir cambios

## Pendientes conocidos

- Confirmar con la Fundación si el precio de compra directa ($23.500) es por kilo de pergamino o de verde, y de qué calidad. Hoy `factorCpsVerde = 1.2` (lectura conservadora).
- Guardar la foto del recibo en Supabase Storage (hoy solo se usa para leerla).
- Editar y borrar registros; exportar a Excel.
