# Lavadero El Puente — Landing page

Landing page de **Lavadero El Puente** (lavadero industrial y lavandería en Maldonado, Uruguay).
Objetivo único: que el visitante inicie una conversación por **WhatsApp**.

Sitio 100% estático hecho con **Next.js 14 (App Router) + `output: 'export'`** y **Tailwind CSS**.
HTML completo pre-renderizado (SEO real), sin backend. El único "endpoint" es `wa.me`.

---

## 🚀 Puesta en marcha (desarrollo)

```bash
npm install
npm run dev      # http://localhost:3000
```

## 🏗️ Build de producción (sitio estático)

```bash
npm run build    # genera /out con el sitio estático completo
```

El resultado queda en la carpeta **`/out`**, lista para subir a cualquier hosting estático.
El `prebuild` genera automáticamente el favicon, el `apple-touch-icon` y la imagen OG.

---

## ✏️ Cómo cambiar los datos del negocio (para no-técnicos)

**Todo se edita en UN SOLO archivo:** [`lib/config.ts`](./lib/config.ts).

Abrilo y cambiá solo los valores entre comillas. Los más importantes:

| Qué cambiar | Dónde (en `lib/config.ts`) |
|---|---|
| **Número de WhatsApp** | `whatsappNumber` — formato `598` + número sin espacios ni el 0 (ej: `59899123456`) |
| **Teléfono para llamar** | `phoneDisplay` y `phoneTel` |
| **Horarios** | `openingHours` |
| **¿Hacen retiro/entrega?** | `pickupDelivery` (`true` / `false`) |
| **Coordenadas del local** | `geo.lat` / `geo.lng` (sacalas de Google Maps) |
| **Años de trayectoria** | `yearsActive` (poné `null` si no querés mostrar cifra) |
| **Redes sociales** | `social.instagram` / `social.facebook` |
| **Dominio final** | `domain` |

Los mensajes prellenados de WhatsApp también están ahí (`waMessages`).

Después de cambiar algo, volvé a correr `npm run build` y subí la carpeta `/out`.

### ⚠️ Placeholders a reemplazar antes de publicar

Están marcados en `lib/config.ts` con `⚠️ PLACEHOLDER`:
`WHATSAPP_NUMBER`, `PHONE_DISPLAY`, `OPENING_HOURS`, `PICKUP_DELIVERY`, `GEO_LAT/LNG`,
`YEARS_ACTIVE`, `SOCIAL_LINKS`, `DOMAIN`.

También reemplazar cuando estén disponibles:
- **Logo real** → `components/Logo.tsx` y `assets/favicon-source.svg`.
- **Fotos reales del lavadero** → ver sección de imágenes más abajo.

---

## 🖼️ Imágenes

- **Assets de marca** (favicon, OG, íconos): se generan solos en el build a partir de
  los SVG en `assets/`. Para regenerarlos manualmente: `npm run generate-assets`.
- **Fotos reales del lavadero**:
  1. Poné las fotos originales en `assets/photos/`.
  2. Ejecutá `npm run optimize-images` → genera versiones AVIF/WebP/JPG responsive en `public/images/`.
  3. Usalas con `<img>` (`width`/`height` explícitos, `loading="lazy"` salvo el hero).
  - El hero debe pesar ≤ 120 KB y usar `fetchpriority="high"`.

---

## ☁️ Deploy

### Opción A — Vercel (recomendado)
1. Subí el repo a GitHub (ya está).
2. En [vercel.com](https://vercel.com) → **New Project** → importá el repo.
3. Framework: **Next.js** (autodetectado). Build command `npm run build`, output `out`.
4. Deploy. Configurá el dominio en **Settings → Domains**.

### Opción B — Netlify
1. **Add new site → Import from Git**.
2. Build command: `npm run build`, Publish directory: `out`.
3. Deploy y configurá el dominio.

### Opción C — cualquier hosting estático
Subí el contenido de la carpeta `/out` por FTP o el panel del hosting.

---

## ✅ Checklist post-deploy

- [ ] Reemplazar todos los placeholders de `lib/config.ts` (WhatsApp, teléfono, horarios, geo, dominio).
- [ ] Verificar que cada botón de WhatsApp abra el chat con el mensaje correcto.
- [ ] Conectar el **dominio** final (sugerencia: `lavaderoelpuente.uy` o `.com.uy`).
- [ ] **Google Business Profile**: crear/reclamar el perfil de empresa con la URL de la landing,
      categoría "Lavandería" + "Servicio de lavandería industrial", fotos y horarios reales.
      *(Para búsquedas locales esto pesa más que la web misma.)*
- [ ] Pedir **reseñas en Google** a clientes.
- [ ] **NAP consistente** (nombre-dirección-teléfono idénticos) en landing, Google Business y guías locales (1122, etc.).
- [ ] **Google Search Console**: registrar la propiedad y enviar `sitemap.xml`.
- [ ] Validar el JSON-LD en [Rich Results Test](https://search.google.com/test/rich-results).
- [ ] Correr **Lighthouse móvil** (objetivo: Performance ≥95, SEO 100, Accessibility ≥95).

---

## 📊 Medición (opcional)

Google Analytics 4 y Microsoft Clarity. Los IDs **no** van en `lib/config.ts`: son variables
de entorno (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`, ver `.env.example`) cargadas en
Vercel → Settings → Environment Variables, entorno Production. Se incrustan en el build:
después de cambiarlas hay que volver a deployar.

Solo cargan en el dominio de producción (nunca en localhost ni en previews) y sin cookies
hasta que la persona acepta. Para no medirte a vos: entrá una vez con `?no_track=1` en cada
dispositivo (`?no_track=0` lo revierte). El plan completo está en `PLAN-ANALITICA.md`.

Eventos (`components/analytics/ConversionTracker.tsx`, un solo listener para todo el sitio):
`whatsapp_click`, `phone_click`, `directions_click` y `social_click`, con `cta_location`
(sale del `data-cta` del link o de su contenedor) y `service` (el slug, en las páginas de
servicio). Un link de conversión nuevo necesita su `data-cta`: si no, llega como `unknown`.

---

## 🗂️ Estructura

```
app/            layout (metadata + JSON-LD + fonts), page, sitemap, robots
components/     secciones + WhatsAppButton (componente único de conversión) + FAB
lib/config.ts   ÚNICO archivo con datos del negocio
lib/content.ts  textos de servicios, sectores, diferenciales y FAQ
lib/jsonld.ts   datos estructurados (LocalBusiness + FAQPage)
scripts/        generate-assets (favicon/OG) y optimize-images (fotos reales)
assets/         SVG fuente del logo/OG y (a futuro) fotos originales
```

---

## 🎨 Sistema de diseño

- **Base** off-white `#FAFAF8`, **azul de marca** `#0E3E6E`, **acento** celeste agua `#22B6C6`.
- El **verde WhatsApp** `#25D366` está reservado **exclusivamente** para los CTAs de conversión.
- Tipografía: *Space Grotesk* (títulos) + *Inter* (cuerpo), self-hosted con `next/font`.
- Mobile-first, animaciones sutiles al scroll que respetan `prefers-reduced-motion`.
