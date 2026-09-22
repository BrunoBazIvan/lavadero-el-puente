import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFAB from '@/components/WhatsAppFAB';
import WhatsAppButton from '@/components/WhatsAppButton';
import Reveal from '@/components/Reveal';
import { waMessages } from '@/lib/config';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import type { LegalPage } from '@/lib/legalContent';

/**
 * Plantilla única para las 4 páginas legales (Privacidad, Términos, Cookies,
 * Reembolsos). Mismo esqueleto que LandingTemplate (breadcrumb → H1 → intro
 * → secciones → CTA) pero sin el aparato de servicio/zona: son páginas de
 * referencia, no de conversión.
 */
export default function LegalPageTemplate({ page }: { page: LegalPage }) {
  const jsonLd = breadcrumbJsonLd(page);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />
      <main>
        {/* Hero de la página */}
        <section className="border-b border-brand-100">
          <div className="container-x py-16 sm:py-20 lg:py-24">
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
              <span className="eyebrow">Legal</span>
              <h1 className="h1 mt-7">{page.h1}</h1>
              <p className="lead mt-7">{page.intro}</p>
              <p className="mt-4 text-sm text-brand-500">
                Última actualización: {page.actualizada}
              </p>
            </div>
          </div>
        </section>

        {/* Secciones de contenido. La medida de lectura va en un div interno,
            nunca max-w-* directo sobre container-x (rompería el eje izquierdo). */}
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

        {/* Cierre: no es un CTA de venta, es la salida natural si quedó una duda. */}
        <section className="border-t border-brand-100 bg-brand-50/60">
          <div className="container-x py-16 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="h2">¿Tenés dudas sobre esto?</h2>
              <p className="mt-4 text-lg leading-relaxed text-brand-600">
                Escribinos por WhatsApp y te las respondemos directamente.
              </p>
              <div className="mt-8">
                <WhatsAppButton source="legal" message={waMessages.legal} variant="solid">
                  Escribinos por WhatsApp
                </WhatsAppButton>
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
