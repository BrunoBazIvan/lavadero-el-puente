# Notas para Claude Code

Contexto que no se deduce leyendo el código. Para poner en marcha el proyecto y
cambiar los datos del negocio, mirá el [README](./README.md): todo lo editable
vive en [`lib/config.ts`](./lib/config.ts) y [`lib/content.ts`](./lib/content.ts).

---

## El repo tiene dos apps, no una

| Ruta | Qué es | Stack |
|---|---|---|
| `/` | La landing pública | Next.js 14, `output: 'export'` |
| `/gestion/` | El sistema interno de mostrador (`gestion/`) | Vite + React Router + Supabase |

Viven juntas para tener **un solo deploy y un solo dominio**. El truco: `next
build` en modo export copia `public/` dentro de `out/`, así que el `prebuild`
compila la app de Vite hacia `public/gestion/` y Next la publica sin enterarse.
Son builds independientes — el sistema **no** es Next.js y no hay que
convertirlo.

Lo que se rompe si lo tocás sin mirar:

- **`base: '/gestion/'` en `gestion/vite.config.ts`** manda sobre todo lo demás.
  De ahí sale `import.meta.env.BASE_URL`, que usa el `basename` del
  `BrowserRouter` (`gestion/src/App.tsx`). Cambiar la URL es cambiar ese `base`
  + el `rewrite` de `vercel.json` + el `disallow` de `app/robots.ts`. Y, fuera
  del repo, la **Site URL / Redirect URLs** del panel de Auth de Supabase: de
  ahí sale adónde cae un link de recuperar contraseña mandado a mano desde el
  dashboard, que es lo único que puede llegar a `/gestion/recuperar`.
- **El rewrite de `vercel.json`** es lo único que hace que un F5 en
  `/gestion/ordenes` no caiga en el 404 de la landing. No se puede poner en
  `next.config.mjs`: `rewrites` no existe con `output: 'export'`. Y no se ve
  sirviendo `/out` a mano — eso se prueba recién deployado.

  **El `destination` va a `/gestion/`, NO a `/gestion/index.html`.** Con
  `trailingSlash: true` Vercel mapea cada archivo por su ruta limpia y no
  expone el `index.html`: pedir `/gestion/index.html` devuelve 404, igual que
  `/sobre-nosotros/index.html`. Apuntado al `index.html` el rewrite matchea
  igual, pero el destino no existe y el 404 sale lo mismo — se ve idéntico a
  que el rewrite no estuviera funcionando. El `source` es `/gestion/(.*)` y no
  `/gestion/:path*` por lo mismo: `trailingSlash` redirige a `/gestion/ruta/`
  con barra final, y `:path*` no matchea eso.

  Lo mismo vale para **cualquier `.html` suelto en `public/`**: se sirve por su
  ruta limpia, no por la que tiene extensión. Por eso el archivo de
  verificación de Google Search Console (`public/google*.html`) necesita su
  propio rewrite: Google pide la URL con `.html` exacta y esa devuelve 404.
- **`"exclude": ["node_modules", "gestion"]` en el `tsconfig.json` de la raíz.**
  Sin eso, el `include` con `**/*.tsx` se come `gestion/src` y `next build`
  falla typechequeándolo con la config equivocada.
- **`npm install` va siempre en la raíz** (npm workspaces, lockfile único).
- Las claves de Supabase del sistema son variables `VITE_*` en `gestion/.env.local`
  en local y en el panel de Vercel en producción. Se inyectan **en build**: si
  faltan, la app despliega igual pero muestra la pantalla de "Falta configurar".

---

## La plata, en el sistema de gestión

El total de una orden sale de **`ordenes.monto`** (migración `0004_cobro.sql`),
no de los precios de los ítems: la 0002 dejó `precio_unitario` en 0 a propósito
porque la ropa no se cuenta prenda por prenda, y lo que se cobra es una bolsa.
Si algún día vuelven los precios por artículo, los dos únicos lugares donde se
decide el total son `orden_totales()` y `v_ordenes`.

- **El monto se carga al pasar la orden a `listo`**, y la base lo exige
  (`guard_orden_update`). Por eso la UI manda estado y monto en el **mismo**
  `update`: separados, el primero se rechaza.
- **Entregar va por la RPC `entregar_orden`**, que cobra y entrega en una sola
  transacción. El orden de adentro —monto, después pago, después estado— está
  atado a los guards: `guard_pago` rechaza un pago mayor al total, y
  `guard_orden_update` no deja entregar con saldo abierto. No es reordenable.
- **Entregar debiendo es solo de admin**, como ya era. La UI apaga el botón y
  lo explica, en vez de dejar que el mostrador choque contra un error de
  Postgres que no puede resolver.

---

## Idioma: español rioplatense (es-UY), con voseo

El sitio le habla a familias y empresas de Maldonado y Punta del Este. El
`<html lang="es-UY">` y **todo el copy usa voseo**. Así está escrito hoy:

| Así va | Así **no** va |
|---|---|
| Pedí tu presupuesto | Pide tu presupuesto |
| Escribinos por WhatsApp | Escríbenos por WhatsApp |
| Contanos qué necesitás | Cuéntanos qué necesitas |
| Tocá el servicio que necesitás | Toca el servicio que necesitas |
| Traé tu acolchado | Trae tu acolchado |

Vocabulario local: *acolchado* (no edredón), *ropa blanca*, *prendas*, *lavadero*.

### Al usar la skill `humanizar-texto-es`

Esa skill sirve y conviene aplicarla, **pero está escrita para español de
España** y lo dice en su propio texto (`SKILL.md:5`, `:24`, `:48`: *"Nada de
español neutro ni latinoamericanismos"*, *"tutea"*).

**El voseo y el léxico rioplatense no se tocan.** Es una excepción fija a esa
skill, no algo negociable texto por texto: si el copy pasa a tuteo peninsular,
el lavadero suena a empresa de afuera y se pierde justo la cercanía local que
es su mayor argumento de venta.

Del resto de la skill, aprovechá todo — son patrones de IA que no dependen del
país: muletillas de apertura ("En el mundo actual…"), palabras infladas
(paradigma, ecosistema, potenciar, brindar), calcos del inglés ("cuando se
trata de", "asegúrate de"), cierres tipo "En definitiva", ganchos de intriga y
gerundios vacíos al final de frase.

---

## Honestidad del contenido

No inventar datos. En particular:

- **Nada de cifras, plazos ni precios** que no estén confirmados. Si un dato no
  existe, el componente se adapta solo (`yearsActive: null` oculta la
  trayectoria; `trustedCompanies: []` hace que la sección muestre rubros en vez
  de nombres).
- **`trustedCompanies` son negocios reales** que aparecen como referencia del
  lavadero. Antes de sumar uno, tiene que haber permiso del cliente.
- Las FAQ y los textos de servicio describen lo que el lavadero hace de verdad.

---

## Sistema de diseño

Lenguaje **editorial suizo-industrial**: precisión y estructura por encima de
suavidad. Se rediseñó a propósito para no parecer plantilla generada. No
volver atrás sin querer.

**Lo que define el sistema:**

- **Aristas rectas.** Solo hay dos radios: `rounded-sharp` (2px) y
  `rounded-card` (3px). No agregar un token tipo `pill: 999px` — la píldora es
  el anti-patrón que se sacó. Lo único redondo es el FAB de WhatsApp, con
  `rounded-full`.
- **Matriz de filetes en vez de tarjetas.** Las grillas usan `.matrix` +
  `.matrix-cell` (celdas que comparten borde, tipo ficha técnica). Nada de
  tarjetas blancas flotando con sombra difusa.
- **Marcador de sección.** La clase `.eyebrow` es un filete + versalitas con
  tracking ancho. No es un badge-píldora.
- **Bloques de color planos.** Azul profundo (`brand-800`/`brand-900`) sin
  texturas ni degradados de adorno.
- **Movimiento contenido.** El hover cambia color y filete; nada de
  `hover:-translate-y` ni escalados. Entradas con `ease-out`.

**Anti-patrones a no reintroducir** (el detector de Impeccable los marca, y
`npx impeccable detect components app` corre limpio hoy):

- Píldoras de 999px en botones y badges
- Azulejo pastel redondeado con ícono encima de los títulos
- Sombras grandes y difusas para dar jerarquía
- Retícula decorativa de dos ejes como fondo de sección — es firma de UI
  generada. `.map-grid` existe solo para el placeholder del mapa, donde
  representa una superficie cartográfica real.

**Color:** las escalas `brand`/`aqua` salen del manual de marca. El verde
`whatsapp` es **exclusivo de los CTA de conversión**; no usarlo para nada más.

### En el sistema de gestión, además

Mismos tokens que la landing, pero el usuario no es un visitante: es alguien
del mostrador, **no técnico**, con un cliente esperando enfrente. Lo que se
rediseñó a propósito y no hay que deshacer:

- **Cuerpo a 16px, botones y campos de 44px de alto mínimo.** Todo el sistema
  estaba en `text-sm`. Se lee de pie y con apuro: la densidad se gana con el
  espaciado, no achicando la letra.
- **Una sola acción primaria por pantalla.** En el detalle de orden es el
  bloque azul `ProximoPaso`, con el botón verde grande. El resto es
  información. Si aparecen dos primarias, no hay ninguna.
- **Nada de `<select>` para acciones.** Avanzar una orden era elegir una opción
  de un desplegable metido en el panel de fechas — invisible hasta abrirlo.
  Ahora el estado se *ve* (`LineaEstado`) y se *avanza* con un botón que dice
  lo que va a pasar en palabras del mostrador: "El cliente se la llevó", no
  "Entregada". Mover una orden hacia atrás existe, pero va plegado al final.
- **El copy pregunta, no etiqueta.** "¿De quién es la ropa?" en vez de
  "Cliente"; "¿Qué le hacemos?" en vez de "Servicio".
- **Los íconos son propios** (`components/Iconos.tsx`, trazo 1.75 con uniones
  en punta) y **nunca van solos**: siempre acompañan a un texto. No agregar una
  librería de íconos — la PC del mostrador tiene que renderizar sin internet,
  igual que con las tipografías auto-hospedadas.
- **La barra de pendientes del encabezado es fija y está en todas las
  pantallas.** Responde "¿qué quedó pendiente?" sin navegar. Sus celdas son
  links a `/ordenes?estado=…`, por eso **el filtro de Órdenes vive en la URL** y
  no en un `useState`.
- **Al cargar no se muestran ceros.** Un cero falso hace que alguien dé por
  cerrado el día. Mientras no hay dato, la barra reserva su altura y no dice
  nada.

### Qué ve cada rol

Las cuentas se dan de alta a mano en el dashboard de Supabase: el
procedimiento, el cambio de rol y la baja están en
[`gestion/supabase/USUARIOS.md`](./gestion/supabase/USUARIOS.md).

**El mostrador entra con un usuario, no con un email.** Nadie ahí tiene
casilla, y escribir una dirección entera con un cliente esperando es tiempo
perdido. Pero Supabase Auth exige formato de email para el login con
contraseña, así que la cuenta se llama `mostrador` y por debajo viaja como
`mostrador@interno.lavaderoelpuente.com`: subdominio propio y sin MX, elegido
por encima de un `.local` inventado, que es un TLD reservado por RFC 6762 para
otra cosa. La conversión vive en un solo lugar,
[`gestion/src/lib/usuarios.ts`](./gestion/src/lib/usuarios.ts).

**Los admins, en cambio, entran con su email de verdad**, y eso es a propósito:
una cuenta interna no puede recuperar su contraseña sola, así que si todas
fueran internas quien administra queda como único punto de falla del sistema.
Los dos formatos conviven en el mismo campo porque `emailDeUsuario()` deja
pasar tal cual lo que ya trae arroba — eso también es lo que mantiene vivas las
cuentas viejas, creadas cuando el identificador era el email.

De ahí se desprende lo que **no** hay que reponer: el botón de "Olvidé mi
contraseña" en `Login.tsx`. Para una cuenta interna ese mail se manda a la
nada, y un botón que no puede funcionar es peor que ninguno. La contraseña la
repone un admin (está en `USUARIOS.md`). `/recuperar` sigue en pie, pero solo
lo alcanza un link mandado a mano desde el dashboard — para las cuentas que sí
tienen email.

El operador trabaja **sobre la orden que tiene enfrente**; el archivo es de
admin. Las secciones **Clientes** y **Artículos** —y sus rutas
`/clientes`, `/clientes/:id`, `/articulos`— cuelgan de `<ProtectedRoute
soloAdmin>` en `App.tsx`, y sus ítems del menú llevan `soloAdmin: true` en
`Layout.tsx`.

Eso **no le saca al operador nada de lo que necesita para recibir ropa**:
elegir un cliente (`BuscadorCliente`, con alta al vuelo) y marcar artículos
siguen viviendo dentro de "Recibir ropa", y el nombre y el teléfono del cliente
se siguen viendo en Órdenes y en el detalle. Lo que se corta es navegar el
padrón entero.

Dos cosas que se rompen fácil sin querer:

- **Es partición de navegación, no de datos.** La RLS le sigue dejando a un
  operador leer `clientes` y `articulos` porque los necesita para recibir ropa
  (`0001_init.sql`: `is_staff()`). Si algún día hace falta un bloqueo de
  verdad, hay que rehacer "Recibir ropa" contra RPCs acotadas y revisar
  `v_ordenes`, que expone nombre y teléfono.
- **Ningún link puede llevar a un operador a una ruta de admin.** Rebotaría
  contra el `<Navigate to="/">` de `ProtectedRoute` y se lee como que el
  sistema falló, encima perdiendo lo que estaba cargando. Por eso el nombre del
  cliente va por `LinkCliente`, que para un operador lo dibuja como texto —sin
  subrayado ni hover, que un texto que parece link confunde igual que uno roto.
  Si aparece otro link a `/clientes/:id`, va por ahí.

Si tocás el flujo de una orden, actualizá también
[`gestion/GUIA-MOSTRADOR.md`](./gestion/GUIA-MOSTRADOR.md): esa guía se imprime
y queda al lado de la computadora, y describiendo botones que ya no existen
hace más daño que no estar.

**Tipografía:** Montserrat (títulos) + Lato (cuerpo), del manual. Cargadas con
`next/font`, nunca por `<link>`.

---

## Dos trampas ya pisadas

**1. No reponer `export const dynamicParams = false` en `app/[slug]/page.tsx`.**

Con `output: 'export'` hace que Next calcule `fallback: false`
(`build/utils.js`), el dev server lo mapee a `fallbackMode: false` y
`base-server.js` lance en **toda** ruta dinámica:

```
Page "/[slug]/page" is missing exported function "generateStaticParams()"
```

El mensaje miente — la función está y el build funciona; lo que rompe es `next
dev`. Sin esa línea, Next igual aplica la lista blanca de slugs.

**2. `container-x` ya trae `mx-auto`.**

Ponerle `max-w-*` en el mismo elemento **centra** la caja angosta y le rompe el
eje izquierdo al resto de la página. La medida de lectura va en un div interno:

```jsx
<div className="container-x">
  <div className="max-w-3xl">…</div>
</div>
```

---

## Antes de dar algo por terminado

```bash
npx tsc --noEmit                       # solo la landing: gestion está excluido
npm run build                          # gestion + /out (16 páginas)
npx impeccable detect components app   # anti-patrones de diseño
```

Si tocaste el sistema de gestión, además: `npm run dev:gestion`
(→ http://localhost:5173/gestion/). Su typecheck lo corre su propio build.

Para previsualizar de verdad conviene servir `/out` (`python3 -m http.server`)
y no fiarse solo del dev server. Ojo: correr `npm run build` con `next dev`
levantado borra `.next` y deja al dev sirviendo 404.
