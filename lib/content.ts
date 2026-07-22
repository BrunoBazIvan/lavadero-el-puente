import { business, waMessages } from './config';

/**
 * Contenido editorial de la página (servicios, sectores, FAQ, diferenciales).
 * Todo texto es real y verificable; no hay precios ni cifras inventadas.
 */

export type HomeService = {
  /** id corto para el tracking (source: servicio_<slug>). */
  slug: string;
  /** Slug de la página de servicio dedicada a la que enlaza la tarjeta. */
  pageSlug: string;
  title: string;
  description: string;
  /** Texto que se inserta en el mensaje de WhatsApp. */
  waSubject: string;
  /** alt sugerido para la imagen/ícono. */
  alt: string;
  icon: 'quilt' | 'curtain' | 'rug' | 'clothes' | 'iron';
};

export const homeServices: HomeService[] = [
  {
    slug: 'acolchados',
    pageSlug: 'limpieza-de-acolchados-maldonado',
    title: 'Acolchados y frazadas',
    description:
      'Lavado profundo de acolchados, frazadas y edredones que no entran en el lavarropas de casa.',
    waSubject: 'limpieza de acolchados y frazadas',
    alt: 'Acolchado limpio y esponjoso en el lavadero de Maldonado',
    icon: 'quilt',
  },
  {
    slug: 'cortinas',
    pageSlug: 'lavado-de-cortinas-maldonado',
    title: 'Cortinas y cortinados',
    description:
      'Lavado de cortinas y cortinados de todo tipo de tela, con cuidado del color y la caída.',
    waSubject: 'lavado de cortinas y cortinados',
    alt: 'Cortinas limpias y planchadas en lavadero de Maldonado',
    icon: 'curtain',
  },
  {
    slug: 'alfombras',
    pageSlug: 'limpieza-de-alfombras-maldonado',
    title: 'Alfombras y tapizados',
    description:
      'Limpieza de alfombras y tapizados: quitamos manchas, polvo y olores dejándolas como nuevas.',
    waSubject: 'limpieza de alfombras y tapizados',
    alt: 'Alfombra limpia en lavadero de Maldonado y Punta del Este',
    icon: 'rug',
  },
  {
    slug: 'ropa',
    pageSlug: 'lavado-y-planchado-de-ropa-maldonado',
    title: 'Ropa y lavado general',
    description:
      'Lavado general de ropa por prenda o por volumen, con secado y doblado prolijo.',
    waSubject: 'el lavado general de ropa',
    alt: 'Ropa limpia y doblada en lavandería de Maldonado',
    icon: 'clothes',
  },
  {
    slug: 'planchado',
    pageSlug: 'lavado-y-planchado-de-ropa-maldonado',
    title: 'Planchado y secado',
    description:
      'Servicio de planchado y secado de ropa para que la retires lista para usar o guardar.',
    waSubject: 'el servicio de planchado y secado',
    alt: 'Ropa planchada y lista en lavadero de Maldonado',
    icon: 'iron',
  },
];

/** Mensaje WhatsApp para cada tarjeta de servicio. */
export function serviceWaMessage(service: HomeService): string {
  return waMessages.service(service.waSubject);
}

/** Sectores B2B (chips). */
export const businessSectors = [
  'Hoteles',
  'Apart y Airbnb',
  'Restaurantes',
  'Edificios y cowork',
  'Clínicas y residenciales',
];

/**
 * Empresas que ya confían en El Puente (prueba social).
 *
 * ⚠️ PLACEHOLDER — CLIENTES REALES
 * Mientras esté VACÍO, la sección muestra los rubros a los que damos servicio
 * (prueba social honesta, sin inventar nombres). Cuando tengas permiso de tus
 * clientes, cargá acá sus nombres y — si tenés — el logo. El componente pasa
 * solo a mostrar los logos/nombres reales.
 *
 *   { name: 'Hotel Costa Azul', logo: '/clientes/costa-azul.png' }
 *
 * El logo es opcional: si no lo ponés, se muestra el nombre en una tarjeta.
 * Colocá las imágenes en /public/clientes/ (fondo transparente, ~200×80px).
 */
export type TrustedCompany = { name: string; logo?: string };

export const trustedCompanies: TrustedCompany[] = [];

/**
 * Rubros que confían en El Puente. Se muestran como "muro" de prueba social
 * cuando aún no hay logos de clientes cargados. Es contenido honesto: son los
 * sectores a los que realmente damos servicio.
 */
export const trustedSectors: { label: string; icon: 'hotel' | 'apart' | 'resto' | 'building' | 'clinic' }[] = [
  { label: 'Hoteles', icon: 'hotel' },
  { label: 'Apart y Airbnb', icon: 'apart' },
  { label: 'Restaurantes', icon: 'resto' },
  { label: 'Edificios y cowork', icon: 'building' },
  { label: 'Clínicas y residenciales', icon: 'clinic' },
];

/** Bullets de valor B2B. */
export const businessValue = [
  'Capacidad para manejar volumen alto de ropa blanca sin demoras.',
  'Cumplimiento en plena temporada alta, cuando más lo necesitás.',
  'Ropa blanca hotelera: sábanas, toallas y mantelería impecables.',
  'Continuidad de servicio durante todo el año, no solo en verano.',
  'Facturación a empresa y trato directo con un referente.',
];

/** Diferenciales (sección "Por qué El Puente"). Sin cifras inventadas. */
export const differentiators = [
  {
    title: 'Maquinaria industrial',
    body: 'Equipos de lavado industrial que rinden con volumen y cuidan cada tipo de tela.',
  },
  {
    title: 'Trato directo',
    body: 'Coordinás por WhatsApp con el lavadero, sin intermediarios ni vueltas.',
  },
  {
    title: 'Prendas delicadas',
    body: 'Cuidado especial de acolchados, cortinas y telas finas, respetando color y textura.',
  },
  {
    title: 'De Maldonado, para Maldonado',
    body: 'Atendemos a familias y empresas de Maldonado y Punta del Este todo el año.',
  },
];

/**
 * FAQ — el contenido vive en el HTML (indexable) y alimenta el Schema FAQPage.
 * Las respuestas se adaptan a si hay o no retiro/entrega, sin inventar.
 */
export const faqs: { q: string; a: string }[] = [
  {
    q: '¿Hacen retiro y entrega a domicilio?',
    a: business.pickupDelivery
      ? 'Sí. Coordinamos el retiro y la entrega de tus prendas por WhatsApp. Escribinos y te contamos las zonas y horarios disponibles.'
      : 'Escribinos por WhatsApp y coordinamos la mejor forma de recibir y entregarte tus prendas según tu caso.',
  },
  {
    q: '¿Cuánto demora la limpieza de un acolchado?',
    a: 'Los acolchados tienen un tiempo mínimo de 48 horas. Según el tipo de acolchado y la temporada puede variar, así que escribinos por WhatsApp y te confirmamos la fecha de entrega.',
  },
  {
    q: '¿Trabajan con hoteles y restaurantes?',
    a: 'Sí. Damos servicio de lavandería industrial a hoteles, apart-hoteles, Airbnb, restaurantes, edificios y clínicas de Maldonado y Punta del Este, con capacidad para temporada alta.',
  },
  {
    q: '¿Qué zonas cubren?',
    a: 'Atendemos principalmente Maldonado y Punta del Este. Si estás en la zona, escribinos y coordinamos.',
  },
  {
    q: '¿Qué servicios ofrecen?',
    a: 'Lavado industrial y lavandería general, acolchados y frazadas, cortinas y cortinados, alfombras y tapizados, y planchado y secado de ropa.',
  },
  {
    q: '¿Cómo pido un presupuesto?',
    a: 'Es muy simple: tocá cualquier botón de WhatsApp de la página, contanos qué necesitás y te pasamos el presupuesto. También podés llamarnos por teléfono.',
  },
];
