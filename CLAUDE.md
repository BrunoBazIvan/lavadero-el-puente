# Notas para Claude Code

Contexto que no se deduce leyendo el código. Para poner en marcha el proyecto y
cambiar los datos del negocio, mirá el [README](./README.md): todo lo editable
vive en [`lib/config.ts`](./lib/config.ts) y [`lib/content.ts`](./lib/content.ts).

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
npx tsc --noEmit
npm run build                          # genera /out (16 páginas)
npx impeccable detect components app   # anti-patrones de diseño
```

Para previsualizar de verdad conviene servir `/out` (`python3 -m http.server`)
y no fiarse solo del dev server. Ojo: correr `npm run build` con `next dev`
levantado borra `.next` y deja al dev sirviendo 404.
