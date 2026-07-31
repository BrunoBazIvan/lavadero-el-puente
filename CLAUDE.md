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
  De ahí sale `import.meta.env.BASE_URL`, que usan el `basename` del
  `BrowserRouter` (`gestion/src/App.tsx`) y el `redirectTo` del mail de
  recuperar contraseña (`gestion/src/auth/AuthProvider.tsx`). Cambiar la URL es
  cambiar ese `base` + el `rewrite` de `vercel.json` + el `disallow` de
  `app/robots.ts`.
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
- **`"exclude": ["node_modules", "gestion"]` en el `tsconfig.json` de la raíz.**
  Sin eso, el `include` con `**/*.tsx` se come `gestion/src` y `next build`
  falla typechequeándolo con la config equivocada.
- **`npm install` va siempre en la raíz** (npm workspaces, lockfile único).
- Las claves de Supabase del sistema son variables `VITE_*` en `gestion/.env.local`
  en local y en el panel de Vercel en producción. Se inyectan **en build**: si
  faltan, la app despliega igual pero muestra la pantalla de "Falta configurar".

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
