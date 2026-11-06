# Kafa

Registro y seguimiento del café de la Fundación Formemos. Kafa es la región de Etiopía de donde viene la palabra café. Es el asistente que lleva las cuentas del café de Tena, del recibo de compra a las decisiones del Comité.

Prototipo del Grupo 33 de Consultandes (Universidad de los Andes), construido como extra de la Etapa 3.

## Qué hace

- **Registrar en el celular**: compras de café (con foto del recibo que la IA lee), baches de tostión (con quién lo hizo y si fue práctica pedagógica), ventas por línea y fletes o gastos.
- **Tablero**: margen por kilo, uso de la torrefactora con su punto de equilibrio, inventario del fondo, compras frente al techo, ventas por línea, alertas y la escalera de inversión con sus condiciones.
- **Informe mensual**: borrador redactado por IA a partir de las cifras del mes, y un panel para hacerle preguntas a los datos.

Reglas de diseño: la IA nunca calcula cifras (las calcula `src/lib/modelo.ts` y `src/lib/metricas.ts`); la aplicación funciona sin IA; caficultores y clientes se registran con identificadores, no con nombres.

## Correrla en tu PC (Windows)

Necesitas [Node.js 22 o posterior](https://nodejs.org) y [Git](https://git-scm.com/downloads/win).

```powershell
git clone https://github.com/Suety-dot/kafa.git
cd kafa
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, corre con datos de ejemplo en memoria (se borran al reiniciar) y sin IA.

### Abrirla en tu celular (misma red Wi-Fi)

```powershell
npm run celular
```

Busca la IP de tu PC con `ipconfig` (línea "Dirección IPv4", por ejemplo 192.168.1.20) y abre `http://192.168.1.20:3000` en el celular. Si Windows pregunta por el firewall, permite el acceso en redes privadas. En el celular, "Agregar a pantalla de inicio" la deja como una app.

## Usuarios

Cada persona entra con su usuario y contraseña. La primera vez que se abre Kafa no hay usuarios: la pantalla pide crear el administrador con la clave de instalación (`APP_CLAVE`). Desde **Usuarios** el administrador crea las cuentas del equipo, cambia contraseñas y desactiva cuentas. Las contraseñas se guardan cifradas (scrypt) y la sesión dura 30 días. Opcional: define `SESION_SECRETO` para firmar las sesiones con un secreto propio.

## Activar la IA

Copia `.env.example` como `.env.local` y elige un proveedor:

- **Anthropic** (recomendado para la demostración): crea una clave en la consola de Anthropic, carga crédito y pon `IA_PROVEEDOR=anthropic` y `ANTHROPIC_API_KEY=...`.
- **Ollama** (gratis, en tu PC): instala [Ollama](https://ollama.com), descarga un modelo que lea imágenes (por ejemplo `ollama pull qwen2.5vl:7b`) y pon `IA_PROVEEDOR=ollama`. La calidad de lectura es menor que con Anthropic.

## Guardar los datos de verdad (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el SQL Editor, ejecuta `supabase/esquema.sql` (si ya lo habías ejecutado antes de que existieran los usuarios, ejecuta también `supabase/usuarios.sql`). Para la demostración, ejecuta después `supabase/datos-ejemplo.sql`.
3. En Project Settings > API copia la URL y la clave secreta (`service_role` o `sb_secret_...`, según la versión de Supabase) a `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`.

La clave `service_role` solo se usa en el servidor. No la subas a GitHub (`.env.local` está en `.gitignore`).

## Publicarla (Vercel)

1. Entra a [Vercel](https://vercel.com) con tu GitHub e importa el repositorio.
2. En Environment Variables agrega las mismas variables de `.env.local`, incluida `APP_CLAVE` para que pida una clave de acceso.
3. Publica. En Vercel la memoria no persiste entre solicitudes: para la demostración publicada, configura Supabase.

## Instalarla como aplicación

Kafa es una aplicación web instalable: una vez publicada en Vercel (con su dirección https), se instala desde el navegador y queda con su ícono, en pantalla completa y sin barra del navegador.

- **Android (Chrome):** abre la dirección y toca "Instalar aplicación" o menú > "Agregar a la pantalla principal".
- **iPhone (Safari):** botón Compartir > "Agregar a inicio".
- **PC (Chrome o Edge):** ícono de instalar en la barra de direcciones, o menú > "Instalar Kafa". Queda en el menú Inicio como cualquier programa.

Si más adelante se necesita un archivo descargable (APK para Android, instalador para Windows o publicación en tiendas), [PWABuilder](https://www.pwabuilder.com) los genera a partir de la dirección publicada, sin cambiar el código.

## Estructura

```
src/lib/modelo.ts      supuestos y fórmulas del libro de la Etapa 3
src/lib/metricas.ts    cifras del tablero y del informe
src/lib/ia.ts          capa de IA intercambiable (anthropic, ollama, ninguno)
src/lib/store/         almacén: Supabase o memoria con datos de ejemplo
src/app/               pantallas y acciones del servidor
supabase/esquema.sql   tablas
```
