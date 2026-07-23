import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFAB from '@/components/WhatsAppFAB';
import WhatsAppButton from '@/components/WhatsAppButton';
import PhoneLink from '@/components/PhoneLink';
import Reveal from '@/components/Reveal';
import { ArrowRight } from '@/components/icons';
import { business } from '@/lib/config';
import { getRelated, type LandingPage } from '@/lib/landingPages';
import { serviceJsonLd, breadcrumbJsonLd, faqListJsonLd } from '@/lib/jsonld';
import type { WhatsAppSource } from '@/lib/analytics';

/**
 * Plantilla única para todas las páginas de servicio y zona (SEO local).
 * Server component: inyecta el JSON-LD (Service + Breadcrumb + FAQPage) y
 * arma breadcrumb → H1 → intro → secciones → FAQ → CTA → relacionados.
 */
export default function LandingTemplate({ page }: { page: LandingPage }) {
  const related = getRelated(page);
  const waSource = `servicio_${page.slug}` as WhatsAppSource;
  const jsonLd = [
    serviceJsonLd(page),
    breadcrumbJsonLd(page),
    ...(page.faq.length ? [faqListJsonLd(page.faq)] : []),
  ];

  return (
    <>
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      <Header />
      <main>
        {/* Hero de la página */}
        <section className="border-b border-brand-100">
          <div className="container-x py-16 sm:py-20 lg:py-24">
            {/* Breadcrumb */}
            <nav aria-label="Migas de pan" className="mb-6 text-sm">
              <ol className="flex flex-wrap items-center gap-1.5 text-brand-500">
                <li>
                  <Link href="/" className="hover:text-brand-700">
                    Inicio
                  </Link>
                </li>
                <li aria-hidden="true" className="text-brand-300">
                  /
                </li>
                <li className="font-semibold text-brand-700">{page.breadcrumbLabel}</li>
              </ol>
            </nav>

            <div className="max-w-3xl">
              <span className="eyebrow">
                {page.kind === 'zona' ? 'Zona de cobertura' : 'Servicio'}
              </span>
              <h1 className="h1 mt-7">{page.h1}</h1>
              <p className="lead mt-7">{page.intro}</p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <WhatsAppButton source={waSource} message={page.waMessage} variant="primary">
                  Pedí tu presupuesto por WhatsApp
                </WhatsAppButton>
                <PhoneLink className="min-h-[44px] justify-center rounded-sharp border border-brand-200 bg-white px-6 py-3.5 font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:text-brand-800">
                  Llamar {business.phoneDisplay}
                </PhoneLink>
              </div>
            </div>
          </div>
        </section>

        {/* Secciones de contenido. La medida de lectura va dentro del
            container, no sobre él: así comparte el eje izquierdo con el hero
            en vez de centrarse por su cuenta. */}
        <section className="section">
          <div className="container-x">
            <div className="max-w-3xl space-y-14">
              {page.sections.map((s) => (
                <Reveal key={s.h2}>
                  <h2 className="h2">{s.h2}</h2>
                  {s.body.map((p, i) => (
                    <p key={i} className="mt-4 text-lg leading-relaxed text-brand-600">
                      {p}
                    </p>
                  ))}
                  {s.bullets && (
                    <ul className="mt-5 space-y-2.5">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-brand-700">
                          <svg
                            className="mt-1 h-5 w-5 shrink-0 text-aqua-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          <span className="text-base leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        {page.faq.length > 0 && (
          <section className="border-y border-brand-100 bg-brand-50/60">
            <div className="container-x section">
              <Reveal className="max-w-3xl">
                <h2 className="h2">Preguntas frecuentes</h2>
                <div className="mt-10 border-t border-brand-200">
                  {page.faq.map((f) => (
                    <details key={f.q} className="group border-b border-brand-200">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 font-display text-lg font-bold leading-snug tracking-[-0.015em] text-brand-800 transition-colors marker:hidden hover:text-brand-500">
                        {f.q}
                        <span
                          aria-hidden="true"
                          className="relative mt-1.5 h-3.5 w-3.5 shrink-0 text-aqua-500"
                        >
                          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-200 ease-out group-open:scale-y-0" />
                        </span>
                      </summary>
                      <p className="pb-7 pr-10 text-base leading-relaxed text-brand-600">{f.a}</p>
                    </details>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* Servicios relacionados (enlazado interno) */}
        {related.length > 0 && (
          <section className="section">
            <div className="container-x">
              <Reveal className="max-w-2xl">
                <h2 className="h2">Otros servicios que te pueden servir</h2>
              </Reveal>
              <div className="matrix mt-12 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r, i) => (
                  <Reveal key={r.slug} delay={(i % 3) * 70} className="matrix-cell">
                    <Link href={`/${r.slug}/`} className="group cell-link justify-between gap-10">
                      <h3 className="font-display text-lg font-bold leading-snug tracking-[-0.015em] text-brand-800">
                        {r.h1}
                      </h3>
                      <span className="inline-flex items-center gap-2 font-display text-[0.6875rem] font-bold uppercase tracking-technical text-brand-500">
                        Ver servicio
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA final */}
        <section className="bg-brand-800 text-white">
          <div className="container-x py-20 sm:py-24">
            <div className="max-w-2xl">
              <h2 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
                Coordiná tu {page.breadcrumbLabel.toLowerCase()} hoy
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-brand-100">
                Contanos qué necesitás y te pasamos el presupuesto. Sin compromiso.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <WhatsAppButton source={waSource} message={page.waMessage} variant="primary">
                  Escribinos por WhatsApp
                </WhatsAppButton>
                <PhoneLink className="min-h-[44px] justify-center rounded-sharp border border-white/25 px-6 py-3.5 font-semibold text-white transition-colors hover:border-white/60">
                  Llamar {business.phoneDisplay}
                </PhoneLink>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
