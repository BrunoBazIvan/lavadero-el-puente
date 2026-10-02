# Plan de implementación: analítica, conversión y SEO técnico (costo $0)

Este archivo es para que Claude Code lo ejecute por fases. Contiene qué hacer, en qué orden, con qué código de referencia y cómo verificar cada paso. Todo es gratuito: Google Analytics 4, Microsoft Clarity, Google Search Console, Bing Webmaster Tools y Google Business Profile.

---

## 0. Cómo usar este plan (para Bruno)

1. Copiá este archivo a la raíz del repo del sitio.
2. Completá la sección **"Datos del negocio"** y las **"Decisiones"**. Claude Code no debe inventar nada de eso.
3. Hacé la **Fase 1** (cuentas e IDs) a mano: Claude Code no puede crear cuentas por vos.
4. Abrí Claude Code en el repo, entrá en modo plan (`/plan` o Shift+Tab) y pegá el prompt inicial de abajo.
5. Avanzá fase por fase. Cada fase termina en un checkpoint: revisás, probás, aprobás el commit y recién ahí seguís.

**Prompt inicial:**

```
Leé PLAN-ANALITICA.md completo antes de hacer nada. Respetá todas las "Reglas para Claude Code".
Ejecutá solo la Fase 0 (diagnóstico, solo lectura) y frená con el reporte que pide.
```

**Prompt para cada fase siguiente:**

```
Ejecutá la Fase N de PLAN-ANALITICA.md. Antes de editar, mostrame la lista de archivos que vas a crear o tocar.
Al terminar: corré el build, mostrame el checklist de verificación de la fase y frená.
```

El plan sirve para cualquier sitio: si lo usás en otro proyecto, copiás el archivo y completás los datos de ese negocio.

---

## 1. Reglas para Claude Code (obligatorias)

- **R1. Una fase por vez.** Al terminar una fase: resumen de archivos tocados, checklist de verificación, y frenar. No avanzar sin aprobación explícita.
- **R2. No inventar datos.** Teléfono, dirección, horarios, nombre, IDs, textos legales: si falta algo en "Datos del negocio", preguntar. Nunca usar valores de ejemplo como si fueran reales.
- **R3. Costo cero y cero dependencias nuevas** salvo que sea imprescindible y esté justificado (todo este plan se resuelve sin librerías en Next.js). Nada de servicios pagos ni planes de prueba.
- **R4. IDs por variables de entorno.** Nunca hardcodear IDs en el código ni commitear `.env.local`. Mantener `.env.example` actualizado.
- **R5. Analítica solo en el dominio de producción.** Nunca en localhost ni en deploys de preview (ver guarda por hostname en Fase 2).
- **R6. No tocar diseño, copy comercial ni rutas existentes** salvo lo que pida la fase. Si un CTA tiene un link roto o mal formado, reportarlo antes de cambiarlo.
- **R7. Build y lint limpios.** Después de cada fase correr el build (`npm run build` o el equivalente del proyecto) y el lint. Si falla, arreglar antes de reportar. Cero errores de TypeScript nuevos.
- **R8. Si el stack no es Next.js App Router**, usar el equivalente del Apéndice A y explicar la adaptación antes de implementar.
- **R9. Commits.** Proponer un commit por fase con mensaje `feat(analytics): fase N - <resumen>`. No hacer push.
- **R10. La analítica nunca rompe la UI.** Todas las llamadas a `gtag`/`clarity` con optional chaining y dentro de `try/catch`. Nada de `console.log` en producción.
- **R11. Nada de datos personales en analítica.** Nunca mandar nombre, teléfono, email ni texto libre del usuario como parámetro de evento, ni ponerlos en la URL.

---

## 2. Datos del negocio (completa Bruno antes de la Fase 0)

| Campo | Valor |
|---|---|
| Nombre comercial (exacto, igual que en Google Business Profile) | |
| Dominio de producción (con https, elegir con o sin www) | |
| Rubro / qué vende o qué servicio presta | |
| WhatsApp en formato internacional, solo dígitos (ej. celular 099 123 456 → `59899123456`) | |
| Teléfono para llamadas (formato `+598...`) | |
| Email de contacto | |
| Dirección (o "sin local a la calle") | |
| Ciudad y departamento | |
| Zona que atiende (localidades) | |
| Horarios de atención | |
| Redes sociales (URLs completas) | |
| Servicios o categorías principales (para mensajes de WhatsApp y schema) | |
| URL del logo (idealmente cuadrado, PNG o SVG) | |
| ¿Muestra precios en la web? (sí/no) | |
| ¿Tiene formulario de contacto? (sí/no, dónde) | |

---

## 3. Decisiones (completa Bruno)

**D1. Consentimiento de cookies.**
- **A) Opt-in (recomendado):** banner con "Aceptar" y "Rechazar". GA4 y Clarity cargan en modo sin cookies hasta que la persona acepta. Es la lectura más segura de la Ley 18.331 de protección de datos personales. Contra: perdés detalle de quienes rechazan.
- **B) Aviso:** cookies activas por defecto, banner informativo con opción de rechazar. Más datos, más riesgo legal.
- Si queda vacío, se implementa **A**.

> Bruno: esto no es asesoramiento legal. Si el sitio junta datos de clientes (formulario), verificá también si corresponde inscribir esa base ante la URCDP (Unidad Reguladora y de Control de Datos Personales).

**D2. Google Tag Manager:** por defecto **no**. La implementación directa con gtag es más simple y Claude Code la mantiene. GTM solo tiene sentido si otra persona no técnica va a manejar las etiquetas.

**D3. Formulario:** si el sitio no tiene formulario, este plan **no** crea uno (queda fuera de alcance). Solo se mide si existe.

**Decisiones de Bruno:**
- D1: A (opt-in) — además lo promete la Política de Cookies publicada.
- D2: No (gtag directo).
- D3: No hay formulario. Tampoco hay email de contacto: no se mide `email_click`.

---

## Fase 0 — Diagnóstico (solo lectura, Claude Code)

**Objetivo:** entender el proyecto antes de tocar nada. No se edita ningún archivo.

Claude Code debe reportar:

1. **Stack:** framework y versión (`package.json`), router (`app/` vs `pages/`), TypeScript sí/no, hosting (señales: `vercel.json`, `wrangler.toml`, `netlify.toml`), gestor de paquetes (lockfile).
2. **Layout raíz:** qué archivo envuelve todas las páginas y si ya tiene `<html lang>`.
3. **Analítica existente:** buscar `gtag`, `googletagmanager`, `clarity`, `@vercel/analytics`, `fbq`, `dataLayer`. Si hay algo, listarlo y proponer si se reemplaza o se mantiene.
4. **Inventario de CTAs** (excluyendo `node_modules`, `.next`, `dist`):
   ```bash
   grep -rnE "wa\.me|api\.whatsapp\.com|whatsapp:|tel:|mailto:|<form|onSubmit" \
     --include=*.{tsx,ts,jsx,js,astro,vue,html,mdx} . \
     | grep -vE "node_modules|\.next|dist/"
   ```
   Para cada resultado: archivo:línea, tipo (WhatsApp / teléfono / email / formulario), ubicación visual (header, hero, flotante, footer, tarjeta de servicio, sección de contacto, precios, etc.) y el valor de `data-cta` propuesto.
5. **SEO actual:** existencia de `robots.txt`/`robots.ts`, `sitemap.xml`/`sitemap.ts`, metadata por ruta (title, description, canonical, Open Graph), JSON-LD, favicon, página 404.
6. **Rutas públicas:** lista completa, indicando cuáles son dinámicas (ej. productos de catálogo que vienen de una base de datos) y de dónde salen sus datos.
7. **Problemas detectados:** links de WhatsApp mal formados (con `+`, espacios o 0 inicial), CTAs duplicados, imágenes sin dimensiones, etc.
8. **Faltantes:** qué datos de las secciones 2 y 3 están vacíos y bloquean fases posteriores.

**Checkpoint:** Bruno revisa el reporte, confirma los valores de `data-cta` y completa lo que falte.

---

## Fase 1 — Cuentas e IDs (manual, Bruno)

Claude Code en esta fase **solo** crea o actualiza `.env.example`. Todo lo demás lo hacés vos.

### 1.1 Google Analytics 4
1. analytics.google.com → Administrar → Crear → Propiedad.
2. Zona horaria: Uruguay (GMT-03:00). Moneda: peso uruguayo (UYU).
3. Crear flujo de datos **Web** con el dominio de producción. Copiar el **ID de medición** (`G-XXXXXXXXXX`).
4. En el flujo → **Medición mejorada**: dejarla activada, con estos ajustes:
   - Vistas de página → configuración avanzada: confirmar que esté activo **"Cambios de página basados en eventos del historial del navegador"**. Esto mide la navegación interna de Next.js sin código extra.
   - **Desactivar "Interacciones con formularios"** (son poco confiables y duplicarían el evento `generate_lead` propio).
   - Dejar activos desplazamientos, clics salientes, búsqueda en el sitio y descargas de archivos.
5. Administrar → Recogida y modificación de datos (Data collection and modification) → Retención de datos → **14 meses** (por defecto viene en 2).
6. Administrar → Vinculaciones de productos (Product links) → **Search Console** → vincular la propiedad existente con este flujo web.

### 1.2 Microsoft Clarity
1. clarity.microsoft.com → New project → nombre y URL del sitio.
2. Elegir instalación manual y copiar el **Project ID** (el código que aparece al final de `https://www.clarity.ms/tag/XXXXXXXXXX`).
3. En la configuración del proyecto:
   - Enmascaramiento: **Balanced** (por defecto) o **Strict**. Nunca "Relaxed" si hay formularios.
   - Si D1 = A: desactivar las cookies automáticas (Settings → Setup → Advanced settings → Cookies) para que Clarity espere el consentimiento. Si la ruta cambió, buscá la opción "Cookies" en la configuración del proyecto.
   - Opcional: activar la integración con Google Analytics en la misma configuración.

### 1.3 Google Search Console (ya la tenés)
- Verificá que la propiedad sea de tipo **Dominio** (cubre www, sin www, http y https). Si es de tipo "Prefijo de URL", agregá además una propiedad de Dominio verificando con un registro TXT en el DNS.

### 1.4 Bing Webmaster Tools
- bing.com/webmasters → **Importar desde Google Search Console**. No requiere código.

### 1.5 Google Business Profile (si el negocio atiende localmente)
- business.google.com → crear o reclamar el perfil. **Empezá ya**: la verificación puede tardar días.
- Categoría principal lo más específica posible, zona de servicio, horarios **idénticos** a los de la web, fotos reales.
- El link al sitio web se completa en la Fase 5 (con UTM).

### 1.6 Variables de entorno
Claude Code crea `.env.example`:

```bash
# Analítica (públicas: se incrustan en el build)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_CLARITY_ID=
NEXT_PUBLIC_SITE_URL=https://dominio.com
# D1: "opt-in" | "notice"
NEXT_PUBLIC_CONSENT_MODE=opt-in
```

Vos cargás los valores reales en el hosting (en Vercel: Project → Settings → Environment Variables, entorno **Production**).

> **Importante:** las variables `NEXT_PUBLIC_*` se incrustan al momento del build. Después de cargarlas o cambiarlas hay que **volver a deployar**, si no el sitio sigue con los valores viejos (o vacíos).

**Checkpoint:** IDs copiados, variables cargadas en el hosting, Search Console vinculada a GA4.

---

## Fase 2 — Carga de GA4 y Clarity con consentimiento

**Objetivo:** cargar ambas herramientas una sola vez, solo en producción, respetando el consentimiento, sin afectar la performance.

### 2.1 Archivos (Next.js App Router)

| Archivo | Propósito |
|---|---|
| `lib/site.ts` | Fuente única de verdad con los datos del negocio (sección 2). Lo usan el footer, el schema, los links de WhatsApp. |
| `lib/analytics.ts` | Constantes, `track()`, `setAnalyticsConsent()`, `analyticsAllowedHere()`. |
| `lib/analytics-init.ts` | Genera el string del script de inicialización (2.3). |
| `types/analytics.d.ts` | Tipos globales de `window.gtag`, `window.clarity`, `window.dataLayer`. |
| `app/layout.tsx` | Inserta el script con `next/script`. |

### 2.2 Tipos globales

```ts
// types/analytics.d.ts
export {};
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}
```

Verificar que `tsconfig.json` incluya la carpeta `types`.

### 2.3 Script de inicialización (implementación de referencia)

Un **único script inline** hace todo en orden: guarda por hostname, opt-out personal, consentimiento por defecto, configuración de GA4, carga de gtag.js y de Clarity. Al ser un solo script, el orden "consentimiento antes que config" queda garantizado.

```js
(function () {
  var GA_ID = __GA_ID__;               // JSON.stringify(process.env.NEXT_PUBLIC_GA_ID || "")
  var CLARITY_ID = __CLARITY_ID__;     // JSON.stringify(process.env.NEXT_PUBLIC_CLARITY_ID || "")
  var PROD_HOST = __PROD_HOST__;       // JSON.stringify(hostname de NEXT_PUBLIC_SITE_URL sin "www.")
  var CONSENT_MODE = __CONSENT_MODE__; // JSON.stringify("opt-in" | "notice")

  // 1) Solo en el dominio de producción (ni localhost ni previews)
  var host = location.hostname.replace(/^www\./, "");
  if (!PROD_HOST || host !== PROD_HOST) return;

  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // 2) Opt-out personal: visitar ?no_track=1 en tus dispositivos (?no_track=0 lo revierte)
  var qs = new URLSearchParams(location.search);
  if (qs.get("no_track") === "1") ls.set("analytics_optout", "1");
  if (qs.get("no_track") === "0") ls.del("analytics_optout");
  if (ls.get("analytics_optout") === "1") return;

  // 3) Consentimiento: se aplica una sola vez con el valor guardado
  var stored = ls.get("analytics_consent");
  var granted = stored === "granted" || (stored === null && CONSENT_MODE === "notice");

  // 4) Modo debug para DebugView: ?debug_analytics=1 (dura lo que dura la pestaña)
  try { if (qs.get("debug_analytics") === "1") sessionStorage.setItem("debug_analytics", "1"); } catch (e) {}
  var debug = false;
  try { debug = sessionStorage.getItem("debug_analytics") === "1"; } catch (e) {}

  // 5) GA4
  if (GA_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: granted ? "granted" : "denied"
    });
    window.gtag("js", new Date());
    // OJO: nunca pasar debug_mode:false (cualquier valor lo activa). Se omite la clave.
    window.gtag("config", GA_ID, debug ? { debug_mode: true } : {});
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(g);
  }

  // 6) Clarity
  if (CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
    // Claves con S mayúscula: ad_Storage / analytics_Storage (en minúscula NO funcionan)
    window.clarity("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: granted ? "granted" : "denied"
    });
  }
})();
```

Reglas de implementación:
- Los valores se inyectan con `JSON.stringify(...)`, nunca concatenando strings crudos.
- `ad_storage`, `ad_user_data` y `ad_personalization` quedan siempre en `denied`: el sitio no hace publicidad.
- **No** enviar `page_view` manual en cambios de ruta. La medición mejorada ya lo hace por historial; mandarlo a mano duplica las vistas.

### 2.4 Inserción en el layout

```tsx
// app/layout.tsx (fragmento)
import Script from "next/script";
import { buildAnalyticsInitScript } from "@/lib/analytics-init";

const initScript = buildAnalyticsInitScript(); // devuelve "" si faltan SITE_URL o ambos IDs

// dentro de <body>, al final:
{initScript && (
  <Script id="analytics-init" strategy="afterInteractive"
    dangerouslySetInnerHTML={{ __html: initScript }} />
)}
```

### 2.5 Helpers en `lib/analytics.ts`

```ts
export const CONSENT_KEY = "analytics_consent";
export const OPTOUT_KEY = "analytics_optout";

type EventParams = Record<string, string | number | boolean>;

export function track(event: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
    window.clarity?.("event", event);
  } catch { /* la analítica nunca rompe la UI */ }
}

export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch {}
  try {
    window.gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
    window.clarity?.("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: granted ? "granted" : "denied",
    });
  } catch {}
}

// Misma lógica que la guarda del script inline (mantener ambas sincronizadas).
// La usa el banner para decidir si mostrarse, sin depender de que el script ya haya corrido.
export function analyticsAllowedHere(): boolean { /* hostname + IDs + opt-out (también ?no_track=1 en la URL actual) */ }
```

**Checkpoint (verificar en producción después del deploy):**
- [ ] En `localhost` no aparece ninguna request a `googletagmanager.com` ni `clarity.ms` (DevTools → Network).
- [ ] En un deploy de preview tampoco.
- [ ] En producción sí cargan ambos scripts, una sola vez.
- [ ] Navegar entre 3 páginas genera exactamente 3 `page_view` (filtrar Network por `collect` y mirar `en=page_view`).
- [ ] Con `?no_track=1` no carga nada, y sigue sin cargar al recargar sin el parámetro.
- [ ] Build y lint limpios.

---

## Fase 3 — Banner de consentimiento y política de privacidad

### 3.1 Banner (`components/analytics/ConsentBanner.tsx`, componente cliente)

Requisitos:
- Se muestra solo si `analyticsAllowedHere()` es verdadero **y** no hay elección guardada en `localStorage`.
- Leer `localStorage` **solo dentro de `useEffect`**, nunca durante el render (si no, error de hidratación).
- Modo `opt-in`: texto breve + botones **"Aceptar"** y **"Rechazar"** con el mismo peso visual. Modo `notice`: texto informativo + "Entendido" (acepta) y "Rechazar".
- Link a `/privacidad`.
- Al elegir: `setAnalyticsConsent(true | false)` y ocultar.
- Posición fija abajo, sin empujar el contenido (cero layout shift).
- **No tapar el botón flotante de WhatsApp** ni ningún CTA en móvil (probar a 360 px de ancho). Si hay conflicto, subir el botón flotante mientras el banner está visible o ubicar el banner por encima.
- Accesible: `role="dialog"`, `aria-label`, botones navegables con teclado, contraste suficiente.
- Usar los estilos y componentes existentes del sitio. No agregar librerías de cookies.

### 3.2 Reabrir preferencias
- Link "Preferencias de cookies" en el footer que borra la elección guardada y vuelve a mostrar el banner.
- Opcional recomendado: al pasar de aceptado a rechazado, borrar las cookies `_ga`, `_ga_*`, `_clck`, `_clsk` (probar borrado con y sin `domain=.<dominio>`).

### 3.3 Página `/privacidad`
Claude Code redacta un **borrador** (marcado como tal al principio del archivo, para que Bruno lo revise) con:
- Responsable: nombre comercial, email y zona (de `lib/site.ts`).
- Qué herramientas se usan (Google Analytics 4, Microsoft Clarity), qué datos recogen (navegación, dispositivo, interacciones; Clarity con enmascarado de campos) y para qué (mejorar el sitio y la atención).
- Qué cookies se usan y cómo aceptarlas, rechazarlas o cambiarlas (link al banner).
- Si hay formulario: qué datos se piden, para qué y cuánto tiempo se guardan.
- Derechos de acceso, rectificación, actualización, inclusión y supresión según la Ley 18.331, y cómo ejercerlos (email).
- Fecha de última actualización.
- Link a la página en el footer.

**Checkpoint:**
- [ ] Incógnito → rechazar → DevTools → Application → Cookies: **no** aparecen `_ga` ni `_clck`.
- [ ] Incógnito → aceptar → aparecen `_ga`, `_ga_<ID>`, `_clck`, `_clsk`.
- [ ] Recargar después de elegir: el banner no vuelve a aparecer.
- [ ] "Preferencias de cookies" lo vuelve a mostrar.
- [ ] Sin errores de hidratación en la consola.
- [ ] En móvil el banner no tapa ningún CTA.

---

## Fase 4 — Eventos de conversión

### 4.1 Taxonomía de eventos

| Evento | Cuándo se dispara | Parámetros | ¿Evento clave? |
|---|---|---|---|
| `whatsapp_click` | Clic en link a `wa.me`, `api.whatsapp.com` o `whatsapp:` | `cta_location`, `service` (si aplica) | Sí |
| `phone_click` | Clic en link `tel:` | `cta_location` | Sí |
| `email_click` | Clic en link `mailto:` | `cta_location` | Sí |
| `generate_lead` | Formulario enviado **con respuesta exitosa** del servidor | `cta_location: "form"`, `form_id`, `service` (si aplica) | Sí |
| `social_click` | Clic a Instagram, Facebook, TikTok, etc. | `network`, `cta_location` | No |

Reglas de nombres: `snake_case`, máximo 40 caracteres, valores de parámetros de hasta 100 caracteres, sin datos personales (R11).

Valores de `cta_location`: los confirmados en la Fase 0 (ejemplos: `header`, `hero`, `floating`, `service_card`, `pricing`, `contact_section`, `footer`). Si un link no tiene `data-cta`, se manda `unknown` para detectarlo y corregirlo.

### 4.2 Rastreador por delegación (`components/analytics/ConversionTracker.tsx`)

Un solo listener a nivel documento cubre todos los links, presentes y futuros, sin tocar cada componente.

```tsx
"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

type Match = { event: string; extra?: Record<string, string> };

function classify(href: string): Match | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith("https://wa.me/") || h.includes("api.whatsapp.com/") || h.startsWith("whatsapp:")) {
    return { event: "whatsapp_click" };
  }
  if (h.startsWith("tel:")) return { event: "phone_click" };
  if (h.startsWith("mailto:")) return { event: "email_click" };
  const social = h.match(/^https?:\/\/(?:www\.|m\.)?(instagram|facebook|tiktok|linkedin|youtube)\.com/);
  if (social) return { event: "social_click", extra: { network: social[1] } };
  return null;
}

export default function ConversionTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const a = el?.closest("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const match = classify(a.getAttribute("href") ?? "");
      if (!match) return;
      const cta = a.closest<HTMLElement>("[data-cta]")?.dataset.cta ?? "unknown";
      const service = a.closest<HTMLElement>("[data-service]")?.dataset.service;
      track(match.event, { cta_location: cta, ...(service ? { service } : {}), ...match.extra });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
```

- Se monta **una vez** en el layout raíz.
- Fase de captura: funciona aunque algún componente frene la propagación.
- No usa `preventDefault` ni retrasa la navegación: gtag envía con `sendBeacon`, el evento llega aunque se abra WhatsApp.
- El cleanup del `useEffect` evita listeners duplicados en modo desarrollo (React Strict Mode).

### 4.3 Marcar los CTAs
- Agregar `data-cta="<ubicación>"` al link o a su contenedor, según la tabla de la Fase 0.
- En tarjetas de servicio o producto, agregar `data-service="<slug>"` al contenedor.
- Links de WhatsApp: `target="_blank" rel="noopener noreferrer"` (en escritorio abren WhatsApp Web en otra pestaña).
- Links de teléfono en formato `tel:+598...` (sin espacios).

### 4.4 Mensajes de WhatsApp prellenados por ubicación

Objetivo: cuando alguien escribe, saber desde qué parte de la web vino (GA4 no ve lo que pasa dentro de WhatsApp).

```ts
// lib/whatsapp.ts
import { site } from "@/lib/site";

export function waLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
```

- `site.whatsapp`: solo dígitos, con código de país y **sin** el 0 inicial del celular (`59899123456`). Sin `+`, espacios ni guiones.
- Los textos van en un solo objeto de configuración (ej. `lib/whatsapp-messages.ts`) para que Bruno los edite sin tocar componentes.
- Cada ubicación con una frase distinta y natural. Claude Code propone los textos y **Bruno los aprueba** antes de implementarlos (R6).
- En tarjetas de servicio, incluir el nombre del servicio en el mensaje.

### 4.5 Formularios (solo si D3 = sí)
- Disparar `track("generate_lead", { cta_location: "form", form_id: "<id>", ... })` **solo** cuando el servidor responde OK, nunca al hacer clic en "Enviar".
- No mandar ningún valor que haya escrito la persona.
- Si el formulario redirige a una página de gracias, esa URL no debe llevar datos personales en la query string.

### 4.6 Configuración en GA4 (manual, Bruno, justo después del deploy)
1. **Dimensiones personalizadas** (hacerlo el mismo día del deploy: **no son retroactivas**). Administrar → Definiciones personalizadas (Custom definitions) → Crear dimensión, alcance **Evento**: `cta_location`, `service`, `form_id`, `network`. El nombre del parámetro tiene que coincidir exacto.
2. **Eventos clave.** Administrar → Eventos clave (Key events) → Nuevo evento clave → escribir el nombre exacto: `whatsapp_click`, `phone_click`, `email_click` y `generate_lead` si hay formulario. Se pueden crear antes de que el evento aparezca.

### 4.7 Verificación
- Abrir producción en incógnito con `?debug_analytics=1&no_track=0`, aceptar cookies.
- GA4 → Administrar → DebugView: hacer clic en **cada** CTA del inventario y confirmar que llega el evento con el `cta_location` correcto.
- Confirmar que el mensaje de WhatsApp que se abre corresponde a la ubicación.
- Clarity → Dashboard: los eventos personalizados y las grabaciones pueden tardar un par de horas en aparecer.

**Checkpoint:**
- [ ] Todos los CTAs del inventario disparan su evento con `cta_location` correcto (ninguno en `unknown`).
- [ ] Un clic = un evento (sin duplicados).
- [ ] Dimensiones personalizadas creadas.
- [ ] Eventos clave marcados.

---

## Fase 5 — UTMs y links trackeables

### 5.1 Convención (todo en minúscula, sin espacios, con guiones)

| Canal | `utm_source` | `utm_medium` | `utm_campaign` |
|---|---|---|---|
| Google Business Profile (botón "Sitio web") | `google` | `organic` | `gbp` |
| Instagram (link de la bio) | `instagram` | `social` | `bio` |
| Instagram (historia o post puntual) | `instagram` | `social` | `<nombre-de-la-campaña>` |
| Facebook | `facebook` | `social` | `<nombre>` |
| Estados o difusión de WhatsApp | `whatsapp` | `social` | `<nombre>` |
| QR impresos (volantes, tarjetas, vehículos, tótems) | `qr` | `offline` | `<pieza>` |
| Firma de email | `email` | `email` | `firma` |

- **Nunca** poner UTMs en links internos del sitio: reinician la sesión y arruinan la atribución.
- `utm_medium=offline` cae en "Unassigned" en los canales por defecto de GA4. Se analiza filtrando por fuente/medio, o creando un grupo de canales personalizado (gratis).
- Los botones propios del perfil de Google (llamar, WhatsApp, cómo llegar) se miden en las estadísticas de Google Business Profile, no en GA4.

### 5.2 Redirecciones cortas para QR
Para que los QR sean simples y se puedan cambiar sin reimprimir, crear rutas cortas en el propio dominio con redirección **temporal** (`permanent: false`). Una entrada explícita por pieza, sin comodines:

```js
// next.config.(js|mjs|ts) → dentro de la config
async redirects() {
  return [
    { source: "/qr/volante", destination: "/?utm_source=qr&utm_medium=offline&utm_campaign=volante", permanent: false },
    // una línea por pieza impresa
  ];
}
```

### 5.3 Entregable
Claude Code genera `docs/links-utm.md` con la URL final de cada canal (armada con `NEXT_PUBLIC_SITE_URL`) para copiar y pegar en Google Business Profile, bios, firmas y generadores de QR.

**Checkpoint:**
- [ ] Cada link de `docs/links-utm.md` abre el sitio y aparece en GA4 → Tiempo real con la fuente/medio correctos.
- [ ] Las rutas `/qr/*` redirigen bien.
- [ ] Link con UTM cargado en Google Business Profile y en las bios.

---

## Fase 6 — SEO técnico

### 6.1 `robots.txt` (`app/robots.ts`)
- Permitir todo, excepto rutas privadas o técnicas (`/api/`, paneles de administración si existen).
- Declarar `Sitemap: <SITE_URL>/sitemap.xml`.

### 6.2 `sitemap.xml` (`app/sitemap.ts`)
- Todas las rutas públicas indexables, incluidas las dinámicas (ej. productos del catálogo leídos de la base de datos).
- Excluir redirecciones (`/qr/*`), páginas de gracias y rutas privadas.
- `lastModified` solo si hay una fecha real de modificación. **No** poner `new Date()` en todas: le dice a Google que todo cambió siempre.
- URLs absolutas con el dominio canónico.

### 6.3 Metadata por página
- `metadataBase: new URL(SITE_URL)` en el layout raíz.
- `title` único por página (alrededor de 60 caracteres), patrón: **"Servicio o producto + ciudad | Marca"**. Usar `title.template` en el layout.
- `description` única (alrededor de 150–160 caracteres), que invite al clic y mencione el diferencial.
- `alternates.canonical` en cada página.
- Open Graph: título, descripción, imagen 1200×630, `locale: "es_UY"`, `type: "website"`. Twitter card `summary_large_image`.
- `<html lang="es">`.
- Claude Code **propone** títulos y descripciones en una tabla y Bruno los aprueba antes de aplicarlos (R6).

### 6.4 Dominio canónico (manual, Bruno)
- Elegir una sola versión (con o sin www) y redirigir la otra con 301 desde el hosting (en Vercel: Settings → Domains). Tiene que coincidir con `NEXT_PUBLIC_SITE_URL`.

### 6.5 Datos estructurados (JSON-LD)
- `LocalBusiness` (o el subtipo de schema.org más específico para el rubro: Claude Code propone y Bruno confirma) en el layout raíz o en la home, con: `name`, `url`, `logo`, `image`, `telephone` (`+598...`), `email`, `address` (`PostalAddress`; sin local a la calle, al menos `addressLocality`, `addressRegion`, `addressCountry: "UY"`), `areaServed`, `openingHoursSpecification`, `sameAs` (redes), `priceRange` opcional.
- Todos los datos salen de `lib/site.ts` y tienen que ser **idénticos** a los de Google Business Profile (nombre, teléfono, dirección).
- No agregar reseñas ni puntuaciones propias (`Review`, `AggregateRating`): Google las ignora en negocios locales.
- Si el sitio es un catálogo **con precios visibles**: `Product` con `Offer` en cada página de producto. Sin precio visible, no agregar `Product`.
- Inserción segura en Next.js:
  ```tsx
  <script type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
  ```

### 6.6 Contenido y estructura (Claude Code audita y reporta, no reescribe copy sin aprobación)
- Un solo `<h1>` por página, con el servicio principal.
- Jerarquía de encabezados correcta (sin saltar de h1 a h4).
- `alt` descriptivo en imágenes de contenido; `alt=""` en decorativas.
- Links internos entre servicios o categorías relacionadas.
- Página 404 propia que devuelva estado 404.

### 6.7 Envío (manual, Bruno)
- Search Console → Sitemaps → enviar `sitemap.xml`. Inspección de URL → solicitar indexación de la home y de las páginas principales.
- Bing Webmaster Tools → enviar el mismo sitemap.

**Checkpoint:**
- [ ] `/robots.txt` y `/sitemap.xml` responden 200 con contenido correcto.
- [ ] Prueba de resultados enriquecidos de Google (search.google.com/test/rich-results) sin errores.
- [ ] Validador de schema.org (validator.schema.org) sin errores.
- [ ] Cada página tiene title, description y canonical únicos (ver código fuente).
- [ ] La versión no canónica del dominio redirige con 301.

---

## Fase 7 — Performance (Core Web Vitals)

1. **Antes de la Fase 2**, Bruno corre PageSpeed Insights (pagespeed.web.dev) en móvil sobre la home y anota los valores como línea base.
2. Claude Code revisa:
   - Imagen principal (LCP): `next/image` con `priority`, tamaño correcto, formato moderno.
   - Resto de imágenes: dimensiones explícitas (evita saltos de diseño) y carga diferida.
   - Fuentes con `next/font` (o `font-display: swap`).
   - Scripts de terceros solo con `afterInteractive` o posteriores.
   - JavaScript sin uso en el bundle de la home.
3. Después de las Fases 2 a 4, volver a correr PageSpeed Insights y comparar. La analítica no debería empeorar el resultado de forma notable; si lo hace, investigar antes de seguir.
4. Los datos reales de usuarios se ven en Search Console → Métricas web principales (tardan semanas en acumularse en sitios con poco tráfico).

---

## Fase 8 — Verificación final de punta a punta

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | `localhost` y deploy de preview | Ninguna request a GA4 ni Clarity |
| 2 | Producción en incógnito, rechazar | Sin cookies `_ga` / `_clck` |
| 3 | Producción en incógnito, aceptar | Cookies presentes, GA4 Tiempo real muestra la visita |
| 4 | Navegar 3 páginas | 3 `page_view`, ni más ni menos |
| 5 | Clic en cada CTA | Evento correcto en DebugView, `cta_location` correcto |
| 6 | WhatsApp desde cada ubicación | Abre con el mensaje correspondiente |
| 7 | `?no_track=1` en tus dispositivos (celular y PC) | No carga analítica, aunque recargues |
| 8 | Links de `docs/links-utm.md` | Fuente/medio correctos en Tiempo real |
| 9 | `/robots.txt`, `/sitemap.xml` | 200 y contenido correcto |
| 10 | Prueba de resultados enriquecidos | Sin errores |
| 11 | Banner en móvil (360 px) | No tapa ningún CTA |
| 12 | Consola del navegador | Sin errores (hidratación ni scripts) |
| 13 | Clarity, a las pocas horas | Grabaciones y eventos visibles |
| 14 | Build de producción | Sin errores ni warnings nuevos |

---

## Fase 9 — Rutina de uso (Bruno)

**Semanal (15 minutos):**
- Clarity: ver 5 a 10 grabaciones de sesiones **sin** evento de conversión. Anotar dónde se traban o qué ignoran.
- Clarity: revisar clics de frustración (rage clicks) y clics muertos (dead clicks) sobre botones y precios.

**Mensual:**
- Search Console → Rendimiento: consultas con muchas impresiones y CTR bajo, sobre todo en posiciones 5 a 15. Reescribir el title y la description de esas páginas.
- GA4 → eventos clave por **fuente/medio de sesión** y por **página de destino**: qué canal y qué página traen prospectos.
- GA4 → `whatsapp_click` desglosado por `cta_location`: qué botón funciona y cuál sobra.
- Clarity → mapa de calor de la home: hasta dónde llega el scroll y si llega a ver el CTA principal.
- Google Business Profile → estadísticas: búsquedas, llamadas, clics al sitio.

**Trimestral:**
- PageSpeed Insights de nuevo.
- Revisar que horarios, teléfono y dirección sigan idénticos en la web, el schema y el perfil de Google.

**Registro de cambios** (mantenerlo en `docs/registro-cambios.md`): fecha, qué cambiaste, qué esperabas que pasara, qué pasó un mes después. Sin esto no sabés qué mejora funcionó.

---

## Apéndice A — Adaptación a otros stacks

- **Next.js Pages Router:** script de inicialización y `ConversionTracker` en `pages/_app.tsx` (con `next/script`); banner también ahí; `robots.txt` estático en `public/`; sitemap generado en `pages/sitemap.xml.ts` con `getServerSideProps` (sin dependencias); metadata con `next/head` por página.
- **Astro:** script de inicialización con `<script is:inline>` en el layout base; tracker como `<script>` normal en el mismo layout; sitemap con la integración oficial `@astrojs/sitemap` (gratuita, dependencia justificada); variables con prefijo `PUBLIC_`.
- **Vite / React SPA:** script de inicialización en `index.html` dentro de `<head>`; tracker montado en el componente raíz; variables con prefijo `VITE_`; `robots.txt` y `sitemap.xml` en `public/`; título y description por ruta actualizando `document.title` y las meta (el SEO de una SPA pura es limitado: reportarlo a Bruno).
- **HTML estático:** script de inicialización en el `<head>` de cada página (o en un include compartido) con los IDs directamente en el archivo de configuración JS; tracker como archivo JS propio cargado con `defer`; `robots.txt` y `sitemap.xml` a mano en la raíz.
- **WordPress:** no aplica este plan con código. Usar plugins gratuitos: Site Kit de Google (GA4 + Search Console), el plugin oficial de Microsoft Clarity y un plugin de consentimiento con plan gratuito compatible con Consent Mode.

---

## Apéndice B — Errores comunes que este plan evita

1. **Vistas de página duplicadas** por mandar `page_view` manual además del que hace la medición mejorada.
2. **Variables `NEXT_PUBLIC_*` sin redeploy:** el sitio sigue sin IDs.
3. **Datos sucios** por analítica activa en localhost, previews o tus propios dispositivos.
4. **Contar como conversión el clic en "Enviar"** en vez de la respuesta exitosa del servidor.
5. **Datos personales** en parámetros de eventos o en URLs (viola las condiciones de GA4).
6. **UTMs en links internos.**
7. **Claves de Clarity mal escritas:** son `ad_Storage` y `analytics_Storage`, con S mayúscula.
8. **`debug_mode: false`** en la config de GA4 (activa el debug igual).
9. **Dimensiones personalizadas creadas tarde:** no son retroactivas.
10. **Leer `localStorage` durante el render:** error de hidratación.
11. **Schema con datos distintos** a los del perfil de Google.
12. **`lastModified: new Date()`** en todo el sitemap.
13. **Banner que tapa el botón de WhatsApp** en móvil.
14. **Consentimiento aplicado dos veces** (primero el default y después el guardado): este plan lo aplica una sola vez con el valor guardado.
