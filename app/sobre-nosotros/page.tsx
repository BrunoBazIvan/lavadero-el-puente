import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFAB from '@/components/WhatsAppFAB';
import WhatsAppButton from '@/components/WhatsAppButton';
import Reveal from '@/components/Reveal';
import { business, waMessages } from '@/lib/config';
import { differentiators } from '@/lib/content';
import { ArrowRight } from '@/components/icons';

const title = 'Sobre nosotros | Lavadero Industrial El Puente — Maldonado';
const description =
  'Conocé El Puente: lavadero industrial de Maldonado con maquinaria propia, trato directo y servicio todo el año para familias y empresas de Punta del Este.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/sobre-nosotros/' },
  openGraph: {
    type: 'website',
    locale: 'es_UY',
    url: '/sobre-nosotros/',
    siteName: business.name,
    title,
    description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: business.name }],
  },
  robots: { index: true, follow: true },
};

export default function SobreNosotros() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-brand-100">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-canvas to-canvas" />
            <div className="bubbles-bg absolute inset-0" />
          </div>
          <div className="container-x py-16 sm:py-20 lg:py-24">
            <div className="max-w-3xl">
              <span className="eyebrow mb-5">Sobre nosotros</span>
              <h1 className="h1">
                Un lavadero industrial de Maldonado,{' '}
                <span className="text-brand-500">para Maldonado</span>
              </h1>
              <p className="lead mt-6">
                El Puente nace del agua: limpieza, frescura y confianza. Somos un lavadero
                industrial que trabaja para familias y empresas de Maldonado y Punta del Este,
                con maquinaria propia y trato directo, todo el año.
              </p>
            </div>
          </div>
        </section>

        {/* Historia / propósito */}
        <section className="section">
          <div className="container-x grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-start">
            <Reveal className="max-w-2xl">
              <h2 className="h2">Nuestra forma de trabajar</h2>
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-brand-600">
                <p>
                  Empezamos resolviendo lo que no entra en el lavarropas de casa —acolchados,
                  cortinas, alfombras— y crecimos hasta ser el respaldo de lavandería de hoteles,
                  apart y restaurantes de la zona en plena temporada.
                </p>
                <p>
                  Trabajamos con equipos de lavado industrial que rinden con volumen alto y, al
                  mismo tiempo, cuidan cada tipo de tela. Cada prenda vuelve limpia, seca y
                  prolija, en el plazo que acordamos.
                </p>
                <p>
                  No hay intermediarios: coordinás directo por WhatsApp con el lavadero. Eso hace
                  todo más simple, más rápido y más claro para vos.
                </p>
              </div>

              <div className="mt-8">
                <WhatsAppButton
                  source="sobre_nosotros"
                  message={waMessages.hero}
                  variant="primary"
                >
                  Pedí tu presupuesto por WhatsApp
                </WhatsAppButton>
              </div>
            </Reveal>

            {/* Tarjeta de datos del local */}
            <Reveal delay={90}>
              <div className="rounded-card border border-brand-100 bg-white p-7 shadow-card">
                <p className="font-display text-lg font-bold text-brand-800">El Puente en datos</p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="font-semibold text-brand-500">Dónde estamos</dt>
                    <dd className="mt-0.5 text-brand-600">
                      {business.address.street}, {business.address.locality}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-brand-500">Horario</dt>
                    <dd className="mt-0.5 text-brand-600">{business.openingHours.label}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-brand-500">A quién atendemos</dt>
                    <dd className="mt-0.5 text-brand-600">
                      Familias y empresas de Maldonado y Punta del Este.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-brand-500">Cómo coordinamos</dt>
                    <dd className="mt-0.5 text-brand-600">
                      Directo por WhatsApp, sin intermediarios.
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Valores (reutiliza diferenciales) */}
        <section className="bg-brand-50/70">
          <div className="container-x section">
            <Reveal className="max-w-2xl">
              <span className="eyebrow mb-4">Lo que nos define</span>
              <h2 className="h2">En qué podés confiar</h2>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {differentiators.map((d, i) => (
                <Reveal key={d.title} delay={(i % 4) * 60}>
                  <div className="flex h-full flex-col rounded-card border border-brand-100 bg-white p-6 shadow-card">
                    <span className="h-1.5 w-10 rounded-full bg-aqua-400" />
                    <h3 className="mt-4 font-display text-lg font-bold text-brand-800">{d.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{d.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="section">
          <div className="container-x">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-500 px-7 py-12 text-center text-white shadow-lift sm:px-12 sm:py-16">
              <div aria-hidden="true" className="bubbles-bg absolute inset-0 opacity-20" />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                  ¿Coordinamos tu próximo lavado?
                </h2>
                <p className="mt-4 text-lg text-brand-100">
                  Contanos qué necesitás y te pasamos el presupuesto. Es el paso más fácil y sin
                  compromiso.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <WhatsAppButton
                    source="sobre_nosotros"
                    message={waMessages.footer}
                    variant="primary"
                  >
                    Escribinos por WhatsApp
                  </WhatsAppButton>
                  <a
                    href="/#servicios"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    Ver servicios
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
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
