# Arriero

Registro y seguimiento del café de la Fundación Formemos. Los arrieros bajaban el café en mula desde las fincas hasta los pueblos; esta aplicación lleva los datos del café desde Tena hasta las decisiones del Comité.

Prototipo del Grupo 33 de Consultandes (Universidad de los Andes), construido como extra de la Etapa 3.

## Qué hace

- **Registrar en el celular**: compras de café (con foto del recibo que la IA lee), baches de tostión (con quién lo hizo y si fue práctica pedagógica), ventas por línea y fletes o gastos.
- **Tablero**: margen por kilo, uso de la torrefactora con su punto de equilibrio, inventario del fondo, compras frente al techo, ventas por línea, alertas y la escalera de inversión con sus condiciones.
- **Informe mensual**: borrador redactado por IA a partir de las cifras del mes, y un panel para hacerle preguntas a los datos.

Reglas de diseño: la IA nunca calcula cifras (las calcula `src/lib/modelo.ts` y `src/lib/metricas.ts`); la aplicación funciona sin IA; caficultores y clientes se registran con identificadores, no con nombres.

## Correrla en tu PC (Windows)

Necesitas [Node.js 22 o posterior](https://nodejs.org) y [Git](https://git-scm.com/downloads/win).

```powershell
git clone https://github.com/Suety-dot/arriero.git
cd arriero
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, corre con datos de ejemplo en memoria (se borran al reiniciar) y sin IA.

### Abrirla en tu celular (misma red Wi-Fi)

```powershell
npm run celular
```

Busca la IP de tu PC con `ipconfig` (línea "Dirección IPv4", por ejemplo 192.168.1.20) y abre `http://192.168.1.20:3000` en el celular. Si Windows pregunta por el firewall, permite el acceso en redes privadas. En el celular, "Agregar a pantalla de inicio" la deja como una app.

## Activar la IA

Copia `.env.example` como `.env.local` y elige un proveedor:

- **Anthropic** (recomendado para la demostración): crea una clave en la consola de Anthropic, carga crédito y pon `IA_PROVEEDOR=anthropic` y `ANTHROPIC_API_KEY=...`.
- **Ollama** (gratis, en tu PC): instala [Ollama](https://ollama.com), descarga un modelo que lea imágenes (por ejemplo `ollama pull qwen2.5vl:7b`) y pon `IA_PROVEEDOR=ollama`. La calidad de lectura es menor que con Anthropic.

## Guardar los datos de verdad (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el SQL Editor, ejecuta `supabase/esquema.sql`.
3. En Project Settings > API copia la URL y la clave `service_role` a `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`.

La clave `service_role` solo se usa en el servidor. No la subas a GitHub (`.env.local` está en `.gitignore`).

## Publicarla (Vercel)

1. Entra a [Vercel](https://vercel.com) con tu GitHub e importa el repositorio.
2. En Environment Variables agrega las mismas variables de `.env.local`, incluida `APP_CLAVE` para que pida una clave de acceso.
3. Publica. En Vercel la memoria no persiste entre solicitudes: para la demostración publicada, configura Supabase.

## Estructura

```
src/lib/modelo.ts      supuestos y fórmulas del libro de la Etapa 3
src/lib/metricas.ts    cifras del tablero y del informe
src/lib/ia.ts          capa de IA intercambiable (anthropic, ollama, ninguno)
src/lib/store/         almacén: Supabase o memoria con datos de ejemplo
src/app/               pantallas y acciones del servidor
supabase/esquema.sql   tablas
```
