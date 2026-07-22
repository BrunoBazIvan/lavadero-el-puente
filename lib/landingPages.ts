import { business, waMessages } from './config';

/**
 * =============================================================================
 *  PÁGINAS DE SERVICIO Y ZONA (SEO local) — ÚNICA FUENTE DE VERDAD
 * =============================================================================
 *  Cada entrada genera una URL estática propia vía app/[slug]/page.tsx.
 *  Reglas:
 *   - Contenido ÚNICO por página (Google penaliza el duplicado entre zonas/servicios).
 *   - Términos uruguayos reales: lavadero/lavandería, frazadas, acolchados,
 *     ropa blanca, cortinados. Sin precios ni cifras inventadas.
 *   - metaTitle < 60 caracteres · metaDescription < 155 caracteres.
 * =============================================================================
 */

export type LandingSection = {
  h2: string;
  body: string[];
  bullets?: string[];
};

export type LandingPage = {
  slug: string;
  kind: 'servicio' | 'zona';
  /** Etiqueta corta para el breadcrumb. */
  breadcrumbLabel: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  h1: string;
  intro: string;
  sections: LandingSection[];
  faq: { q: string; a: string }[];
  /** Slugs de páginas relacionadas (enlazado interno). */
  relatedSlugs: string[];
  /** Mensaje de WhatsApp prellenado para el CTA de la página. */
  waMessage: string;
  /** serviceType para el schema Service. */
  serviceType: string;
  /** Zonas que cubre (default: todas las de delivery). */
  areaServed?: string[];
};

const zonas = business.deliveryZones.join(', ');

export const landingPages: LandingPage[] = [
  // ─── SERVICIOS ────────────────────────────────────────────────────────────
  {
    slug: 'lavanderia-industrial-maldonado',
    kind: 'servicio',
    breadcrumbLabel: 'Lavandería industrial',
    metaTitle: 'Lavandería Industrial en Maldonado | El Puente',
    metaDescription:
      'Lavandería industrial para hoteles, apart y restaurantes de Maldonado y Punta del Este. Ropa blanca impecable y cumplimiento en temporada alta.',
    primaryKeyword: 'lavandería industrial Maldonado',
    h1: 'Lavandería industrial en Maldonado y Punta del Este',
    intro:
      'Somos el respaldo de lavandería de hoteles, apart-hoteles, Airbnb, restaurantes, edificios y clínicas de Maldonado y Punta del Este. Maquinaria industrial propia, capacidad para volumen alto y cumplimiento cuando más lo necesitás: en plena temporada.',
    sections: [
      {
        h2: 'Ropa blanca hotelera lista todo el año',
        body: [
          'Lavamos sábanas, toallas, mantelería y ropa blanca hotelera dejándolas impecables, con el nivel de higiene y prolijidad que tu huésped espera.',
          'Trabajamos todo el año, no solo en verano, para que tu operación no dependa de la temporada.',
        ],
      },
      {
        h2: 'Capacidad real para temporada alta',
        body: [
          'Nuestros equipos de lavado industrial rinden con volumen alto sin demoras. En enero y febrero, cuando el resto colapsa, seguimos cumpliendo los plazos acordados.',
        ],
        bullets: [
          'Volumen alto de ropa blanca sin demoras',
          'Continuidad de servicio los 12 meses',
          'Facturación a empresa y trato directo con un referente',
        ],
      },
      {
        h2: 'Cómo trabajamos con tu empresa',
        body: [
          'Coordinás directo por WhatsApp con el lavadero, sin intermediarios. Acordamos volumen, frecuencia y logística de retiro y entrega, y nos hacemos cargo del resto.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Trabajan con hoteles, apart y restaurantes?',
        a: 'Sí. Damos servicio de lavandería industrial a hoteles, apart-hoteles, Airbnb, restaurantes, edificios y clínicas de Maldonado y Punta del Este, con capacidad para temporada alta.',
      },
      {
        q: '¿Tienen capacidad para el volumen de la temporada?',
        a: 'Sí. Contamos con maquinaria industrial pensada para volumen alto de ropa blanca, y cumplimos los plazos incluso en plena temporada de verano.',
      },
      {
        q: '¿Facturan a empresa?',
        a: 'Sí, facturamos a empresa. Escribinos por WhatsApp y coordinamos una cotización según tu volumen y frecuencia.',
      },
    ],
    relatedSlugs: [
      'lavado-de-sabanas-y-juegos-de-cama',
      'retiro-y-entrega-a-domicilio-maldonado',
      'lavanderia-punta-del-este',
    ],
    waMessage: waMessages.business,
    serviceType: 'Lavandería industrial',
  },
  {
    slug: 'limpieza-de-acolchados-maldonado',
    kind: 'servicio',
    breadcrumbLabel: 'Limpieza de acolchados',
    metaTitle: 'Limpieza de Acolchados en Maldonado | El Puente',
    metaDescription:
      'Lavado profesional de acolchados, frazadas y edredones en Maldonado. Cuidamos cada tipo de tela. Con retiro y entrega a domicilio. Escribinos por WhatsApp.',
    primaryKeyword: 'limpieza de acolchados Maldonado',
    h1: 'Limpieza de acolchados y frazadas en Maldonado',
    intro:
      'Lavado profundo de acolchados, frazadas y edredones que no entran en el lavarropas de casa. Los dejamos limpios, esponjosos y sin olores, cuidando el color y la textura de cada tela.',
    sections: [
      {
        h2: 'Acolchados, frazadas y edredones como nuevos',
        body: [
          'Con maquinaria industrial lavamos piezas grandes y voluminosas que en casa quedan a medias. Quitamos polvo, ácaros y olores guardados, sobre todo al salir del invierno.',
        ],
      },
      {
        h2: 'Cuidado según el tipo de tela',
        body: [
          'Adaptamos el proceso a cada prenda: plumón, poliéster, lana o telas delicadas. Respetamos el color y la caída para que tu acolchado te dure muchas temporadas más.',
        ],
      },
      {
        h2: 'Plazos y retiro',
        body: [
          `Los acolchados tienen un tiempo mínimo de 48 horas; según el tipo y la temporada puede variar y te confirmamos la fecha de entrega. Si estás en ${zonas}, coordinamos el retiro y la entrega a domicilio.`,
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuánto demora la limpieza de un acolchado?',
        a: 'Los acolchados tienen un tiempo mínimo de 48 horas. Según el tipo de acolchado y la temporada puede variar, así que escribinos por WhatsApp y te confirmamos la fecha de entrega.',
      },
      {
        q: '¿Lavan acolchados de plumón?',
        a: 'Sí. Adaptamos el lavado y el secado al tipo de relleno y de tela, incluido el plumón, cuidando que quede esponjoso y sin humedad.',
      },
      {
        q: '¿Retiran el acolchado a domicilio?',
        a: `Sí, coordinamos retiro y entrega a domicilio en ${zonas}. Escribinos por WhatsApp y arreglamos día y horario.`,
      },
    ],
    relatedSlugs: [
      'lavado-de-sabanas-y-juegos-de-cama',
      'lavado-de-cortinas-maldonado',
      'retiro-y-entrega-a-domicilio-maldonado',
    ],
    waMessage: waMessages.service('la limpieza de acolchados y frazadas'),
    serviceType: 'Limpieza de acolchados',
  },
  {
    slug: 'lavado-de-sabanas-y-juegos-de-cama',
    kind: 'servicio',
    breadcrumbLabel: 'Sábanas y juegos de cama',
    metaTitle: 'Lavado de Sábanas y Juegos de Cama | Maldonado',
    metaDescription:
      'Lavado de sábanas, juegos de cama y ropa blanca en Maldonado. Blancos impecables para tu casa, apart o alojamiento. Con retiro y entrega a domicilio.',
    primaryKeyword: 'lavado de sábanas Maldonado',
    h1: 'Lavado de sábanas y juegos de cama en Maldonado',
    intro:
      'Lavado de sábanas, fundas, colchas y juegos de cama que quedan impecables, suaves y bien planchados. Ideal para tu hogar y para quienes manejan apart, Airbnb o casas de temporada.',
    sections: [
      {
        h2: 'Ropa blanca impecable para tu hogar',
        body: [
          'Dejamos tus sábanas y juegos de cama limpios, frescos y prolijos, listos para usar o guardar. Un lavado profesional cuida mejor las telas y les alarga la vida.',
        ],
      },
      {
        h2: 'Para apart, Airbnb y alojamientos',
        body: [
          'Si alquilás tu propiedad, la ropa blanca hace la diferencia en la reseña del huésped. Te ayudamos a tener juegos de cama impecables entre estadía y estadía, incluso en temporada.',
        ],
      },
      {
        h2: 'Retiro y entrega en la zona',
        body: [
          `Coordinamos el retiro y la entrega a domicilio en ${zonas}, así no perdés tiempo trasladando la ropa.`,
        ],
      },
    ],
    faq: [
      {
        q: '¿Lavan colchas y fundas además de las sábanas?',
        a: 'Sí. Lavamos juegos de cama completos: sábanas, fundas, colchas y cubrecamas, cuidando el color y la textura de cada pieza.',
      },
      {
        q: '¿Sirve para Airbnb o apart?',
        a: 'Sí. Muchos anfitriones nos usan para mantener su ropa blanca impecable entre estadías. Escribinos y coordinamos frecuencia y logística.',
      },
      {
        q: '¿Hacen retiro y entrega?',
        a: `Sí, coordinamos retiro y entrega a domicilio en ${zonas} por WhatsApp.`,
      },
    ],
    relatedSlugs: [
      'limpieza-de-acolchados-maldonado',
      'lavanderia-industrial-maldonado',
      'retiro-y-entrega-a-domicilio-maldonado',
    ],
    waMessage: waMessages.service('el lavado de sábanas y juegos de cama'),
    serviceType: 'Lavado de ropa blanca',
  },
  {
    slug: 'lavado-de-cortinas-maldonado',
    kind: 'servicio',
    breadcrumbLabel: 'Lavado de cortinas',
    metaTitle: 'Lavado de Cortinas y Cortinados | Maldonado',
    metaDescription:
      'Lavado de cortinas y cortinados de todo tipo de tela en Maldonado, cuidando el color y la caída. Retiro y entrega a coordinar por WhatsApp.',
    primaryKeyword: 'lavado de cortinas Maldonado',
    h1: 'Lavado de cortinas y cortinados en Maldonado',
    intro:
      'Lavado de cortinas y cortinados de todo tipo de tela, con el cuidado que necesitan para no perder el color ni la caída. Les devolvemos la frescura sin el riesgo de lavarlas en casa.',
    sections: [
      {
        h2: 'Cortinas de todo tipo de tela',
        body: [
          'Trabajamos cortinas livianas, blackout, voile y cortinados pesados. Cada tela lleva un proceso distinto y lo ajustamos para que el resultado sea parejo y prolijo.',
        ],
      },
      {
        h2: 'Cuidamos el color y la caída',
        body: [
          'Las cortinas juntan polvo y olor con el tiempo. Las dejamos limpias y con la caída original, sin encogimientos ni destiños, listas para volver a colgar.',
        ],
      },
      {
        h2: 'Cómo coordinamos',
        body: [
          `Escribinos por WhatsApp, contanos qué cortinas tenés y coordinamos el retiro y la entrega en ${zonas}.`,
        ],
      },
    ],
    faq: [
      {
        q: '¿Lavan todo tipo de cortinas?',
        a: 'Sí, desde cortinas livianas y voile hasta blackout y cortinados pesados. Adaptamos el proceso a cada tela.',
      },
      {
        q: '¿Cuánto demora el lavado de cortinas?',
        a: 'Depende del tipo y la cantidad de tela. Escribinos por WhatsApp con el detalle y te confirmamos el plazo de entrega.',
      },
    ],
    relatedSlugs: [
      'limpieza-de-alfombras-maldonado',
      'limpieza-de-acolchados-maldonado',
      'retiro-y-entrega-a-domicilio-maldonado',
    ],
    waMessage: waMessages.service('el lavado de cortinas y cortinados'),
    serviceType: 'Lavado de cortinas',
  },
  {
    slug: 'limpieza-de-alfombras-maldonado',
    kind: 'servicio',
    breadcrumbLabel: 'Limpieza de alfombras',
    metaTitle: 'Limpieza de Alfombras y Tapizados | Maldonado',
    metaDescription:
      'Limpieza de alfombras y tapizados en Maldonado: quitamos manchas, polvo y olores y las dejamos como nuevas. Con retiro y entrega. Escribinos por WhatsApp.',
    primaryKeyword: 'limpieza de alfombras Maldonado',
    h1: 'Limpieza de alfombras y tapizados en Maldonado',
    intro:
      'Limpieza de alfombras y tapizados que quita manchas, polvo y olores en profundidad. Recuperamos el color y la textura para que vuelvan a verse como nuevas.',
    sections: [
      {
        h2: 'Alfombras y tapizados como nuevos',
        body: [
          'Las alfombras acumulan polvo, ácaros y manchas que la aspiradora no saca. Con lavado profesional llegamos al fondo de la fibra y devolvemos la frescura a la pieza.',
        ],
      },
      {
        h2: 'Manchas, polvo y olores',
        body: [
          'Tratamos manchas puntuales y olores guardados, cuidando la fibra y el color. El resultado es una alfombra limpia, seca y prolija, lista para volver a su lugar.',
        ],
      },
      {
        h2: 'Coordiná el retiro',
        body: [
          `Escribinos por WhatsApp y coordinamos el retiro y la entrega a domicilio en ${zonas}.`,
        ],
      },
    ],
    faq: [
      {
        q: '¿Quitan manchas y olores de la alfombra?',
        a: 'Sí. Tratamos manchas y olores en profundidad cuidando la fibra y el color de la pieza.',
      },
      {
        q: '¿Limpian también tapizados?',
        a: 'Sí, además de alfombras trabajamos tapizados. Escribinos por WhatsApp y te asesoramos según el material.',
      },
    ],
    relatedSlugs: [
      'lavado-de-cortinas-maldonado',
      'limpieza-de-acolchados-maldonado',
      'retiro-y-entrega-a-domicilio-maldonado',
    ],
    waMessage: waMessages.service('la limpieza de alfombras y tapizados'),
    serviceType: 'Limpieza de alfombras',
  },
  {
    slug: 'lavado-y-planchado-de-ropa-maldonado',
    kind: 'servicio',
    breadcrumbLabel: 'Lavado y planchado',
    metaTitle: 'Lavado, Secado y Planchado de Ropa | Maldonado',
    metaDescription:
      'Lavado, secado y planchado de ropa en Maldonado, por prenda o por volumen, con doblado prolijo. Retirala lista para usar. Coordiná por WhatsApp.',
    primaryKeyword: 'lavado y secado Maldonado',
    h1: 'Lavado, secado y planchado de ropa en Maldonado',
    intro:
      'Lavado general de ropa por prenda o por volumen, con secado, planchado y doblado prolijo. La retirás lista para usar o guardar, sin ocupar tu día en el lavarropas.',
    sections: [
      {
        h2: 'Lavado general por prenda o por volumen',
        body: [
          'Nos adaptamos a lo que necesites: unas prendas puntuales o el lavado de la semana. Separamos por color y tipo de tela para cuidar cada prenda.',
        ],
      },
      {
        h2: 'Secado y planchado listos para usar',
        body: [
          'Sumamos secado y planchado para que la ropa vuelva impecable y doblada. Ideal si querés ahorrar tiempo o no tenés dónde secar en casa.',
        ],
      },
      {
        h2: 'Retiro y entrega',
        body: [
          `Coordinamos el retiro y la entrega a domicilio en ${zonas} para que no tengas que trasladar nada.`,
        ],
      },
    ],
    faq: [
      {
        q: '¿Cobran por prenda o por volumen?',
        a: 'Trabajamos de las dos formas, según lo que necesites. Escribinos por WhatsApp con el detalle y te pasamos el presupuesto.',
      },
      {
        q: '¿Incluye planchado?',
        a: 'Sí, ofrecemos secado y planchado además del lavado. Nos decís qué necesitás y lo dejamos listo para usar o guardar.',
      },
    ],
    relatedSlugs: [
      'lavado-de-sabanas-y-juegos-de-cama',
      'limpieza-de-acolchados-maldonado',
      'retiro-y-entrega-a-domicilio-maldonado',
    ],
    waMessage: waMessages.service('el lavado, secado y planchado de ropa'),
    serviceType: 'Lavado y planchado de ropa',
  },
  {
    slug: 'retiro-y-entrega-a-domicilio-maldonado',
    kind: 'servicio',
    breadcrumbLabel: 'Retiro y entrega',
    metaTitle: 'Retiro y Entrega a Domicilio | Lavadero Maldonado',
    metaDescription:
      'Lavadero con retiro y entrega a domicilio en Maldonado, Punta del Este, La Barra, Manantiales y José Ignacio. Coordiná todo por WhatsApp.',
    primaryKeyword: 'retiro y entrega a domicilio Maldonado',
    h1: 'Retiro y entrega a domicilio en Maldonado y la costa',
    intro:
      'No hace falta que traslades tu ropa: pasamos a buscarla y te la devolvemos limpia y prolija. Coordinás todo por WhatsApp, sin salir de casa.',
    sections: [
      {
        h2: 'Zonas que cubrimos',
        body: ['Damos retiro y entrega a domicilio en todo el corredor costero:'],
        bullets: [...business.deliveryZones],
      },
      {
        h2: 'Cómo funciona el delivery',
        body: [
          'Escribinos por WhatsApp, nos decís qué necesitás lavar y dónde estás, y coordinamos día y horario de retiro. Cuando está listo, te lo llevamos de vuelta.',
        ],
      },
      {
        h2: 'Todo por WhatsApp, sin vueltas',
        body: [
          'El retiro y la entrega aplican a todos nuestros servicios: ropa, acolchados, cortinas, alfombras y ropa blanca para empresas.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Qué zonas cubre el retiro y entrega?',
        a: `Cubrimos ${zonas}. Si estás en la zona, escribinos por WhatsApp y coordinamos.`,
      },
      {
        q: '¿Cómo coordino el retiro?',
        a: 'Escribinos por WhatsApp, contanos qué necesitás y dónde estás, y arreglamos día y horario de retiro y entrega.',
      },
    ],
    relatedSlugs: [
      'lavado-y-planchado-de-ropa-maldonado',
      'limpieza-de-acolchados-maldonado',
      'lavanderia-industrial-maldonado',
    ],
    waMessage: waMessages.service('el retiro y entrega a domicilio'),
    serviceType: 'Retiro y entrega a domicilio',
  },
  // ─── ZONAS ──────────────────────────────────────────────────────────────
  {
    slug: 'lavanderia-punta-del-este',
    kind: 'zona',
    breadcrumbLabel: 'Punta del Este',
    metaTitle: 'Lavandería en Punta del Este | El Puente',
    metaDescription:
      'Lavandería y lavadero en Punta del Este: ropa, acolchados, cortinas y ropa blanca, con retiro y entrega. Servicio todo el año. Escribinos por WhatsApp.',
    primaryKeyword: 'lavandería Punta del Este',
    h1: 'Lavandería en Punta del Este',
    intro:
      'Somos tu lavadero de confianza en Punta del Este, todo el año. Ropa, acolchados, cortinas, alfombras y ropa blanca, con retiro y entrega a domicilio para que no pierdas tiempo.',
    sections: [
      {
        h2: 'Tu lavadero en Punta del Este todo el año',
        body: [
          'Atendemos a familias y empresas de Punta del Este los 12 meses, no solo en temporada. Maquinaria industrial y trato directo por WhatsApp, sin intermediarios.',
        ],
      },
      {
        h2: 'Para tu casa, tu apart o tu alojamiento',
        body: [
          'Resolvemos desde el lavado de la semana hasta la ropa blanca de tu apart o Airbnb. Si tenés un hotel o restaurante, sumamos capacidad para volumen alto en temporada.',
        ],
      },
      {
        h2: 'Retiro y entrega en Punta del Este',
        body: [
          'Coordinamos el retiro y la entrega a domicilio en Punta del Este y alrededores, así te evitás el traslado.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Dan servicio en Punta del Este todo el año?',
        a: 'Sí, trabajamos los 12 meses, no solo en verano. Escribinos por WhatsApp y coordinamos.',
      },
      {
        q: '¿Hacen retiro y entrega en Punta del Este?',
        a: 'Sí, coordinamos retiro y entrega a domicilio en Punta del Este y la zona por WhatsApp.',
      },
    ],
    relatedSlugs: [
      'lavanderia-industrial-maldonado',
      'lavado-de-sabanas-y-juegos-de-cama',
      'retiro-y-entrega-a-domicilio-maldonado',
    ],
    waMessage: waMessages.service('los servicios del lavadero en Punta del Este'),
    serviceType: 'Lavandería',
    areaServed: ['Punta del Este'],
  },
  {
    slug: 'lavanderia-la-barra-manantiales-jose-ignacio',
    kind: 'zona',
    breadcrumbLabel: 'La Barra · José Ignacio',
    metaTitle: 'Lavandería en La Barra, Manantiales y J. Ignacio',
    metaDescription:
      'Lavadero con retiro y entrega en La Barra, Manantiales y José Ignacio. Ropa blanca para apart y alojamientos, más textiles del hogar. Coordiná por WhatsApp.',
    primaryKeyword: 'lavandería La Barra',
    h1: 'Lavandería en La Barra, Manantiales y José Ignacio',
    intro:
      'Damos servicio en todo el corredor de la costa —La Barra, Manantiales y José Ignacio— con retiro y entrega a domicilio. Ideal para casas de temporada, apart y alojamientos.',
    sections: [
      {
        h2: 'Servicio en el corredor de la costa',
        body: [
          'Llegamos con el retiro y la entrega hasta José Ignacio, pasando por La Barra y Manantiales. Ropa, acolchados, cortinas, alfombras y ropa blanca, todo coordinado por WhatsApp.',
        ],
      },
      {
        h2: 'Ideal para apart, Airbnb y casas de temporada',
        body: [
          'En la zona hay mucho alquiler temporal, y la ropa blanca impecable es clave para la reseña del huésped. Te ayudamos a tener juegos de cama y toallas listos entre estadías.',
        ],
      },
      {
        h2: 'Retiro y entrega a coordinar',
        body: [
          'Escribinos por WhatsApp, contanos dónde estás dentro del corredor y arreglamos día y horario de retiro y entrega.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Llegan hasta José Ignacio?',
        a: 'Sí. Cubrimos el corredor La Barra, Manantiales y José Ignacio con retiro y entrega a domicilio.',
      },
      {
        q: '¿Sirve para casas de alquiler temporal?',
        a: 'Sí, trabajamos con muchas casas y apart de la zona para mantener la ropa blanca impecable entre estadías. Escribinos y coordinamos frecuencia.',
      },
    ],
    relatedSlugs: [
      'lavado-de-sabanas-y-juegos-de-cama',
      'lavanderia-industrial-maldonado',
      'retiro-y-entrega-a-domicilio-maldonado',
    ],
    waMessage: waMessages.service('los servicios del lavadero en La Barra y José Ignacio'),
    serviceType: 'Lavandería',
    areaServed: ['La Barra', 'Manantiales', 'José Ignacio'],
  },
];

/** Slugs para generateStaticParams(). */
export const landingSlugs = landingPages.map((p) => p.slug);

/** Busca una página por slug. */
export function getLandingPage(slug: string): LandingPage | undefined {
  return landingPages.find((p) => p.slug === slug);
}

/** Devuelve las páginas relacionadas resueltas (para el enlazado interno). */
export function getRelated(page: LandingPage): LandingPage[] {
  return page.relatedSlugs
    .map((s) => getLandingPage(s))
    .filter((p): p is LandingPage => Boolean(p));
}
