import { business } from './config';
import { faqs } from './content';

/** JSON-LD LocalBusiness (subtipo DryCleaningOrLaundry). */
export function localBusinessJsonLd() {
  const sameAs = [business.social.instagram, business.social.facebook].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'DryCleaningOrLaundry',
    name: business.name,
    image: `${business.domain}/og.png`,
    url: `${business.domain}/`,
    telephone: business.phoneTel,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.locality,
      addressRegion: business.address.region,
      addressCountry: business.address.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.geo.lat,
      longitude: business.geo.lng,
    },
    areaServed: ['Maldonado', 'Punta del Este'],
    openingHoursSpecification: business.openingHours.spec.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: s.days,
      opens: s.opens,
      closes: s.closes,
    })),
    ...(sameAs.length ? { sameAs } : {}),
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
