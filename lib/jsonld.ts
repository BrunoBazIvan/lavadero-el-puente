import { business } from './config';
import { faqs } from './content';
import { landingPages, type LandingPage } from './landingPages';

/** Identificador estable del negocio (permite referenciarlo desde otros nodos). */
const businessId = `${business.domain}/#business`;

/** Nodo GeoCircle/Place de las zonas de cobertura (delivery). */
function areaServedNodes() {
  return business.deliveryZones.map((z) => ({
    '@type': 'City',
    name: z,
  }));
}

/** JSON-LD LocalBusiness (subtipo DryCleaningOrLaundry) con oferta de servicios. */
export function localBusinessJsonLd() {
  const sameAs = [business.social.instagram, business.social.facebook].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'DryCleaningOrLaundry',
    '@id': businessId,
    name: business.name,
    image: `${business.domain}/og.png`,
    logo: `${business.domain}/android-chrome-512x512.png`,
    url: `${business.domain}/`,
    telephone: business.phoneTel,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.locality,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.geo.lat,
      longitude: business.geo.lng,
    },
    areaServed: areaServedNodes(),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de lavandería',
      itemListElement: landingPages
        .filter((p) => p.kind === 'servicio')
        .map((p) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: p.serviceType,
            url: `${business.domain}/${p.slug}/`,
          },
        })),
    },
    openingHoursSpecification: business.openingHours.spec.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: s.days,
      opens: s.opens,
      closes: s.closes,
    })),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** JSON-LD Service para una página de servicio/zona, referenciando al negocio. */
export function serviceJsonLd(page: LandingPage) {
  const zones = page.areaServed ?? business.deliveryZones;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.serviceType,
    serviceType: page.serviceType,
    url: `${business.domain}/${page.slug}/`,
    description: page.metaDescription,
    areaServed: zones.map((z) => ({ '@type': 'City', name: z })),
    provider: {
      '@type': 'DryCleaningOrLaundry',
      '@id': businessId,
      name: business.name,
      telephone: business.phoneTel,
      url: `${business.domain}/`,
    },
  };
}

/** JSON-LD BreadcrumbList (Inicio › Página). */
export function breadcrumbJsonLd(page: LandingPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: `${business.domain}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.breadcrumbLabel,
        item: `${business.domain}/${page.slug}/`,
      },
    ],
  };
}

/** JSON-LD FAQPage genérico a partir de una lista de preguntas. */
export function faqListJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** JSON-LD FAQPage con las preguntas de la sección FAQ. */
export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
}
