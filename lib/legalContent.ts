import { business } from './config';
import type { LandingSection } from './landingPages';

/**
 * =============================================================================
 *  PÁGINAS LEGALES — Privacidad, Términos, Cookies, Reembolsos
 * =============================================================================
 *  Mismo formato que LandingSection (h2 + body + bullets opcionales) para
 *  reutilizar LegalPageTemplate sin inventar una segunda forma de sección.
 *
 *  Reglas de contenido, igual que el resto del sitio:
 *   - Nada de cifras ni plazos que no estén confirmados. El plazo de guarda de
 *     las prendas vive en `gestion` (tabla `configuracion`, editable sin
 *     deploy) y se referencia acá como "el que figura en tu comprobante", NO
 *     como un número fijo — hardcodearlo acá lo desincronizaría del real.
 *   - Esto es un borrador basado en cómo funciona el negocio hoy, no un
 *     dictamen legal. Antes de publicar, confirmar con el negocio: razón
 *     social/RUT si difieren de `business.legalName` (hoy es igual al nombre
 *     comercial), el canal para pedidos de datos personales (hoy WhatsApp/
 *     teléfono), y el texto final de Reembolsos.
 * =============================================================================
 */

export type LegalPage = {
  slug: string;
  breadcrumbLabel: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** Fecha de la última revisión del texto, en palabras (no ISO). */
  actualizada: string;
  intro: string;
  sections: LandingSection[];
};

const ACTUALIZADA = '21 de setiembre de 2026';
const zonas = business.deliveryZones.join(', ');

export const legalPages: LegalPage[] = [
  {
    slug: 'politica-de-privacidad',
    breadcrumbLabel: 'Política de Privacidad',
    metaTitle: 'Política de Privacidad | Lavadero El Puente',
    metaDescription:
      'Qué datos recibe el lavadero cuando coordinás por WhatsApp o teléfono, para qué los usa y cómo ejercer tus derechos sobre ellos.',
    h1: 'Política de Privacidad',
    actualizada: ACTUALIZADA,
    intro:
      'Esta página explica qué datos recibe el lavadero cuando coordinás un servicio, para qué los usamos y qué derechos tenés sobre ellos, según la Ley 18.331 de Protección de Datos Personales de Uruguay.',
    sections: [
      {
        h2: 'No usamos formularios en la web',
        body: [
          'El sitio no tiene ningún formulario de contacto ni de presupuesto: no hay ningún cuadro donde escribas tu nombre, teléfono o email antes de hablar con nosotros. Todo el contacto es directo, por el botón de WhatsApp o por teléfono.',
        ],
      },
      {
        h2: 'Qué datos recibimos y para qué',
        body: [
          'Cuando nos escribís o llamás para coordinar un servicio, recibimos lo que vos nos contás: tu nombre, tu teléfono, y —si hay retiro o entrega a domicilio— tu dirección. Guardamos esos datos junto con el detalle de tu orden (qué trajiste, cuándo, el monto) en un sistema interno, para poder identificarte la próxima vez que escribas y llevar un registro de tus órdenes.',
          'No usamos tus datos para nada más que coordinar y llevar el registro del servicio: no los vendemos, no los compartimos con terceros para publicidad, y no armamos perfiles de comportamiento.',
        ],
      },
      {
        h2: 'WhatsApp es un servicio de Meta',
        body: [
          'Cuando nos escribís por WhatsApp, el mensaje viaja por la infraestructura de WhatsApp/Meta antes de llegarnos, y esa parte del camino se rige por la política de privacidad de Meta, no por esta. Lo que nosotros hacemos con lo que nos contás en ese mensaje sí lo cubre esta política.',
        ],
      },
      {
        h2: 'Tus derechos sobre tus datos',
        body: [
          `La Ley 18.331 te da derecho a acceder a tus datos, pedir que se corrijan si están mal, pedir que se eliminen, u oponerte a un uso puntual (derechos ARCO). Para ejercer cualquiera de estos derechos, escribinos por WhatsApp o llamanos al ${business.phoneDisplay} y lo resolvemos directamente.`,
        ],
      },
      {
        h2: 'Autoridad de control',
        body: [
          'La Unidad Reguladora y de Control de Datos Personales (URCDP) es el organismo uruguayo que controla el cumplimiento de la Ley 18.331. Podés consultarla si considerás que no respondimos correctamente a un pedido sobre tus datos.',
        ],
      },
    ],
  },
  {
    slug: 'terminos-y-condiciones',
    breadcrumbLabel: 'Términos y Condiciones',
    metaTitle: 'Términos y Condiciones | Lavadero El Puente',
    metaDescription:
      'Cómo se coordina el servicio, cómo se define el precio, medios de pago, zonas de entrega y tus derechos como consumidor, según la Ley 17.250.',
    h1: 'Términos y Condiciones',
    actualizada: ACTUALIZADA,
    intro:
      'Estas condiciones aplican a los servicios de lavado, planchado y limpieza que presta Lavadero Industrial El Puente en Maldonado y Punta del Este, coordinados por WhatsApp o teléfono.',
    sections: [
      {
        h2: 'Cómo se coordina el servicio',
        body: [
          'El servicio se coordina por WhatsApp o por teléfono: nos contás qué necesitás, y arreglamos cómo y cuándo recibimos tus prendas, ya sea que las traigas al local o que coordinemos retiro a domicilio.',
        ],
      },
      {
        h2: 'Cómo se define el precio',
        body: [
          'En la mayoría de nuestros servicios el precio se define recién cuando pesamos o evaluamos lo que trajiste, porque no se cobra prenda por prenda sino por el volumen o el trabajo real. Te confirmamos el monto antes de que la orden quede lista para retirar, y lo coordinamos con vos por WhatsApp si hay alguna duda.',
        ],
        bullets: [
          'Medios de pago: efectivo, transferencia, débito, crédito o Mercado Pago',
          `Zonas de retiro y entrega a domicilio: ${zonas}`,
        ],
      },
      {
        h2: 'Derecho de retracto (Ley 17.250)',
        body: [
          'Si coordinaste el servicio a distancia (por WhatsApp o teléfono), tenés derecho a rescindir el contrato dentro de los 5 días hábiles de haberlo aceptado, sin responsabilidad de tu parte, según la Ley 17.250 de Relaciones de Consumo.',
          'Si ejercés este derecho antes de que empecemos a trabajar tus prendas, te devolvemos lo que hayas pagado por adelantado. Si el servicio ya se prestó total o parcialmente, solo corresponde el pago de la parte ya realizada, tal como establece la ley.',
        ],
      },
      {
        h2: 'Prendas dañadas, perdidas o guarda de lo retirado',
        body: [
          'Esto está detallado en nuestra Política de Reembolsos, que forma parte de estos Términos.',
        ],
      },
      {
        h2: 'Ley aplicable',
        body: [
          'Estos términos se rigen por las leyes de la República Oriental del Uruguay, en particular la Ley 17.250 de Relaciones de Consumo y su Decreto reglamentario 244/000.',
        ],
      },
    ],
  },
  {
    slug: 'politica-de-cookies',
    breadcrumbLabel: 'Política de Cookies',
    metaTitle: 'Política de Cookies | Lavadero El Puente',
    metaDescription:
      'Hoy este sitio no usa cookies de seguimiento. Te contamos qué cargamos, cuándo, y qué pasaría si en el futuro sumamos analítica.',
    h1: 'Política de Cookies',
    actualizada: ACTUALIZADA,
    intro:
      'Esta página describe con exactitud lo que este sitio carga en tu navegador hoy, no una lista genérica de cookies posibles.',
    sections: [
      {
        h2: 'Hoy no usamos cookies de seguimiento',
        body: [
          'Este sitio no tiene Google Analytics activo ni ningún otro rastreador cargando por defecto: no se guarda ninguna cookie de medición en tu navegador al visitarlo. Tampoco usamos cookies propias para recordar tu sesión ni tus preferencias.',
        ],
      },
      {
        h2: 'El mapa de Google, solo si lo pedís',
        body: [
          'La sección de ubicación no carga el mapa de Google automáticamente: ves un botón "Ver mapa", y el iframe de Google Maps —con las cookies que trae— recién se carga si hacés clic ahí. Si nunca tocás ese botón, ninguna cookie de Google se instala por el mapa.',
        ],
      },
      {
        h2: 'Las tipografías son propias',
        body: [
          'El sitio incluye sus propias tipografías (Montserrat y Lato) en vez de pedirlas a Google Fonts en cada visita, así que tampoco hay cookies ni conexiones externas por ese lado.',
        ],
      },
      {
        h2: 'Si en el futuro activamos analítica',
        body: [
          'Si más adelante sumamos Google Analytics para entender cómo se usa el sitio, vamos a actualizar esta página antes de activarlo y vas a ver un aviso pidiendo tu consentimiento antes de que se instale cualquier cookie de medición. Hasta que eso pase, esta página describe la situación real: no hay nada que consentir porque no se usa nada.',
        ],
      },
    ],
  },
  {
    slug: 'politica-de-reembolsos',
    breadcrumbLabel: 'Política de Reembolsos',
    metaTitle: 'Política de Reembolsos | Lavadero El Puente',
    metaDescription:
      'Qué hacemos si una prenda se daña o se pierde, cuánto tiempo guardamos lo ya listo, y cómo hacer un reclamo.',
    h1: 'Política de Reembolsos',
    actualizada: ACTUALIZADA,
    intro:
      'Esta política explica qué pasa ante un problema con tu ropa: daño, pérdida, o una demora nuestra en la entrega. Es parte de nuestros Términos y Condiciones.',
    sections: [
      {
        h2: 'Si una prenda se daña o se pierde por nuestra responsabilidad',
        body: [
          'Si una prenda se daña o se pierde por un error nuestro durante el lavado, la reponemos según su valor razonable, evaluado caso a caso según su estado y antigüedad. Contactanos apenas lo notes, por WhatsApp o teléfono, para revisarlo juntos.',
        ],
      },
      {
        h2: 'Plazo de guarda de las prendas ya listas',
        body: [
          'Guardamos las prendas ya listas por el plazo que figura impreso en tu comprobante de recibo. Pasado ese plazo sin que las retires, dejamos de responsabilizarnos por ellas. Si tenés dudas sobre el plazo de tu orden puntual, escribinos con el número de tu comprobante.',
        ],
      },
      {
        h2: 'Cancelar antes de que empecemos a trabajar',
        body: [
          'Si coordinaste el servicio a distancia y todavía no empezamos a lavar tus prendas, podés ejercer tu derecho de retracto dentro de los 5 días hábiles de haber coordinado, según la Ley 17.250 — te devolvemos lo pagado por adelantado. El detalle completo está en nuestros Términos y Condiciones.',
        ],
      },
      {
        h2: 'Cómo hacer un reclamo',
        body: [
          'Escribinos por WhatsApp o llamanos contándonos qué pasó y el número de tu comprobante. Lo resolvemos directamente con vos, sin intermediarios.',
        ],
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalPages.find((p) => p.slug === slug);
}
