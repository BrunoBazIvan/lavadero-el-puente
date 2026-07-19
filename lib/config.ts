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
  /** Nombre comercial. */
  name: 'Lavadero El Puente',

  /** Descripción corta del rubro (se usa en textos y datos estructurados). */
  legalName: 'Lavadero El Puente',

  /**
   * ⚠️ PLACEHOLDER — WHATSAPP_NUMBER
   * Número real en formato internacional, SOLO dígitos, sin +, sin espacios,
   * sin guiones. Uruguay = 598 + número sin el 0 inicial.
   * Ejemplo: si el celular es 099 123 456  →  '59899123456'
   */
  whatsappNumber: '59899000000',

  /**
   * ⚠️ PLACEHOLDER — PHONE_DISPLAY
   * Número tal cual querés que se VEA y que funcione al tocarlo para llamar.
   */
  phoneDisplay: '099 000 000',
  /** Mismo teléfono en formato para el link tel: (con código de país, sin espacios). */
  phoneTel: '+59899000000',

  /** Dirección. */
  address: {
    street: 'Batalla del Cerrito esq. Bergalli',
    locality: 'Maldonado',
    region: 'Maldonado',
    country: 'Uruguay',
    countryCode: 'UY',
  },

  /**
   * ⚠️ PLACEHOLDER — GEO_LAT / GEO_LNG
   * Coordenadas exactas del local. Obtenelas en Google Maps:
   * clic derecho sobre el local → "¿Qué hay aquí?" → copiá los números.
   * (Estos valores son aproximados al centro de Maldonado — reemplazar.)
   */
  geo: {
    lat: -34.9089,
    lng: -54.9581,
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
   * ⚠️ PLACEHOLDER — PICKUP_DELIVERY
   * ¿El lavadero hace retiro y entrega a domicilio?
   * Poné true SOLO si es verdad: afecta el hero, el proceso y las FAQ.
   */
  pickupDelivery: false,

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
   * ⚠️ PLACEHOLDER — DOMAIN
   * Dominio final del sitio (sin barra al final). Se usa en SEO/canonical/OG.
   * Sugerencia: https://lavaderoelpuente.uy  o  https://lavaderoelpuente.com.uy
   */
  domain: 'https://lavaderoelpuente.uy',

  /**
   * ⚠️ OPCIONAL — GA4
   * ID de medición de Google Analytics 4 (formato G-XXXXXXX).
   * Dejá '' para desactivar analítica. Se carga diferido para no dañar performance.
   */
  ga4Id: '',
} as const;

/** URL de Google Maps para "Cómo llegar" (usa las coordenadas o la dirección). */
export const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${business.geo.lat},${business.geo.lng}`;

/** URL de embed del mapa (facade que abre el iframe al hacer clic). */
export const mapsEmbedUrl = `https://www.google.com/maps?q=${business.geo.lat},${business.geo.lng}&hl=es&z=16&output=embed`;

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
