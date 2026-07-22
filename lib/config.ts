/**
 * =============================================================================
 *  CONFIGURACIÓN DEL NEGOCIO — ÚNICO ARCHIVO A EDITAR
 * =============================================================================
 *
 *  Si sos NO-TÉCNICO y solo querés cambiar el número de WhatsApp, el teléfono,
 *  los horarios o la dirección: editá SOLO los valores de abajo (lo que está
 *  entre comillas). No toques nada más.
 *
 *  Los valores marcados con  ⚠️ PLACEHOLDER  son de ejemplo y DEBEN
 *  reemplazarse por los datos reales antes de publicar la página.
 * =============================================================================
 */

export const business = {
  /** Nombre comercial — IDÉNTICO al de Google Business Profile (consistencia NAP). */
  name: 'Lavadero Industrial El Puente',

  /** Razón/legal — se usa en textos y datos estructurados. */
  legalName: 'Lavadero Industrial El Puente',

  /**
   * WhatsApp en formato internacional, SOLO dígitos, sin +, sin espacios,
   * sin guiones. Uruguay = 598 + número sin el 0 inicial.
   */
  whatsappNumber: '59899767134',

  /** Número tal cual se VE y funciona al tocarlo para llamar. */
  phoneDisplay: '099 767 134',
  phoneTel: '+59899767134',

  /** Dirección. */
  address: {
    street: 'Batalla del Cerrito 1009 esq. Dr. Román Bergalli',
    locality: 'Maldonado',
    region: 'Maldonado',
    postalCode: '20000',
    country: 'Uruguay',
    countryCode: 'UY',
  },

  /**
   * Coordenadas exactas del local, tomadas de la ficha oficial de Google
   * Business ("Lavadero Industrial El Puente").
   */
  geo: {
    lat: -34.9049793,
    lng: -54.9483194,
  },

  /**
   * ⚠️ PLACEHOLDER — OPENING_HOURS
   * Horarios reales de atención. `label` es lo que ve el visitante.
   * `spec` alimenta los datos estructurados de Google (formato 24h HH:MM).
   */
  openingHours: {
    label: 'Lunes a Sábado de 8:00 a 19:00',
    shortLabel: 'Lun a Sáb · 8 a 19 h',
    spec: [
      {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '19:00',
      },
    ],
  },

  /**
   * ¿El lavadero hace retiro y entrega a domicilio?
   * Afecta el hero, el proceso y las FAQ.
   */
  pickupDelivery: true,

  /**
   * Zonas reales de retiro y entrega a domicilio (corredor costero este).
   * Alimenta el `areaServed` del schema, las páginas de zona y los textos.
   * ⚠️ No agregar zonas donde el delivery no llega de verdad.
   */
  deliveryZones: [
    'Maldonado',
    'Punta del Este',
    'La Barra',
    'Manantiales',
    'José Ignacio',
  ],

  /**
   * ⚠️ PLACEHOLDER — YEARS_ACTIVE
   * Años de trayectoria reales. Si no querés mostrar una cifra, dejá null
   * y el texto de "Por qué El Puente" se adapta solo (no inventa números).
   */
  yearsActive: null as number | null,

  /**
   * ⚠️ PLACEHOLDER — SOCIAL_LINKS
   * Redes sociales si existen. Dejá el string vacío '' para ocultar cada una.
   */
  social: {
    instagram: '', // ej: 'https://instagram.com/lavaderoelpuente'
    facebook: '', // ej: 'https://facebook.com/lavaderoelpuente'
  },

  /**
   * Link corto para PEDIR RESEÑAS en Google.
   * Se obtiene en el panel de Google Business Profile → "Pedir reseñas" /
   * "Get more reviews" → copiar el enlace (formato https://g.page/r/XXXX/review).
   * Mientras esté vacío '', el botón "Dejá tu reseña" no se muestra.
   * Este mismo link es el que va en el QR del mostrador y en el WhatsApp post-servicio.
   */
  reviewLink: '',

  /**
   * Dominio del sitio (sin barra al final). Se usa en canonical, Open Graph,
   * robots.txt y sitemap.xml.
   *
   * ⚠️ Debe ser SIEMPRE una URL que funcione de verdad: si apunta a un dominio
   * que no existe, WhatsApp y las redes no muestran la vista previa con imagen.
   *
   * Hoy apunta al dominio de Vercel. Cuando se compre el dominio propio
   * (ej: https://lavaderoelpuente.uy), cambiar esta línea y conectarlo en
   * Vercel → Project Settings → Domains.
   */
  domain: 'https://lavadero-el-puente.vercel.app',

  /**
   * ⚠️ OPCIONAL — GA4
   * ID de medición de Google Analytics 4 (formato G-XXXXXXX).
   * Dejá '' para desactivar analítica. Se carga diferido para no dañar performance.
   */
  ga4Id: '',
} as const;

/**
 * "Cómo llegar" → navegación directa a las coordenadas exactas del local.
 * Se usan coordenadas y no texto para que no dependa de que Google
 * geocodifique bien la dirección.
 */
export const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${business.geo.lat},${business.geo.lng}`;

/**
 * Embed del mapa (el facade lo inyecta al hacer clic).
 * Es la URL oficial de la ficha de Google Business del lavadero: muestra el pin
 * con el nombre del negocio, no un marcador genérico.
 * ⚠️ Si algún día cambia la ficha, regenerar desde Google Maps →
 * Compartir → Insertar un mapa → copiar el `src` del iframe.
 */
export const mapsEmbedUrl =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3272.058583967102!2d-54.948319399999995!3d-34.9049793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95751b263cb4cac9%3A0x80fce7d722082d3f!2sLavadero%20Industrial%20El%20Puente!5e0!3m2!1ses!2suy!4v1784507768030!5m2!1ses!2suy';

/**
 * =============================================================================
 *  MENSAJES DE WHATSAPP PRELLENADOS (por contexto)
 * =============================================================================
 *  Cada botón manda un mensaje distinto para que el lavadero sepa de dónde
 *  viene la consulta. Podés editar los textos libremente.
 */
export const waMessages = {
  hero: 'Hola! Vi la página del lavadero y quiero pedir un presupuesto.',
  business:
    'Hola! Escribo de parte de una empresa para consultar por el servicio de lavandería para empresas.',
  location: 'Hola! Quiero consultar por los servicios del lavadero.',
  footer: 'Hola! Quiero hacer una consulta al lavadero.',
  faq: 'Hola! Tengo una consulta sobre los servicios del lavadero.',
  /** Genera el mensaje para una tarjeta de servicio concreto. */
  service: (servicio: string) => `Hola! Quiero consultar por ${servicio}.`,
} as const;

/**
 * Construye el link wa.me con el mensaje URL-encoded.
 * Único lugar donde se arma el link → cambiar el número se hace en un solo sitio.
 */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
