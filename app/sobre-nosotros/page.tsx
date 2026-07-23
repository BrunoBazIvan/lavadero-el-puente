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
        <section className="border-b border-brand-100">
          <div className="container-x py-20 sm:py-24 lg:py-28">
            <div className="max-w-3xl">
              <span className="eyebrow">Sobre nosotros</span>
              <h1 className="h1 mt-7">
                Un lavadero industrial de Maldonado,{' '}
                <span className="text-brand-500">para Maldonado</span>
              </h1>
              <p className="lead mt-7">
                El Puente nace para resolver una necesidad concreta: mantener la ropa y la ropa
                de cama impecables cuando Punta del Este entra en temporada y la demanda se
                multiplica. Más de {business.yearsActive} años después, hoteles, posadas y
                edificios de la zona —entre ellos Torres Imperiale, Edificio YOO y Posada del
                Faro— confían en nosotros para sostener ese ritmo todo el año.
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
                  Empezamos con lo que no entra en el lavarropas de casa: acolchados, cortinas,
                  alfombras. Con los años sumamos la ropa blanca de hoteles, apart y restaurantes
                  de la zona, que es la que no puede fallar en enero.
                </p>
                <p>
                  Los equipos de lavado industrial nos permiten mover volumen alto sin maltratar
                  la tela. Cada prenda vuelve limpia y seca, en el plazo que acordamos.
                </p>
                <p>
                  No hay intermediarios. Coordinás por WhatsApp con el lavadero, y quien te
                  responde es quien va a lavar tus cosas.
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

            {/* Ficha de datos del local */}
            <Reveal delay={90}>
              <div className="border border-brand-100 bg-white">
                <p className="border-b border-brand-100 px-7 py-5 font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-600">
                  El Puente en datos
                </p>
                <dl className="divide-y divide-brand-100">
                  {[
                    {
                      k: 'Dónde estamos',
                      v: `${business.address.street}, ${business.address.locality}`,
                    },
                    { k: 'Horario', v: business.openingHours.label },
                    {
                      k: 'A quién atendemos',
                      v: 'Familias y empresas de Maldonado y Punta del Este.',
                    },
                    { k: 'Cómo coordinamos', v: 'Por WhatsApp, o por teléfono si preferís.' },
                  ].map((row) => (
                    <div key={row.k} className="px-7 py-5">
                      <dt className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-brand-400">
                        {row.k}
                      </dt>
                      <dd className="mt-2 text-base leading-relaxed text-brand-700">{row.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Valores (reutiliza diferenciales) */}
        <section className="border-y border-brand-100 bg-brand-50/60">
          <div className="container-x section">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">Lo que nos define</span>
              <h2 className="h2 mt-6">En qué podés confiar</h2>
            </Reveal>
            <div className="matrix mt-14 sm:grid-cols-2 lg:grid-cols-4">
              {differentiators.map((d, i) => (
                <Reveal key={d.title} delay={(i % 4) * 60} className="matrix-cell">
                  <div className="flex h-full flex-col p-7 sm:p-8">
                    <span className="tnum font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-500">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-10 font-display text-lg font-bold leading-snug tracking-[-0.015em] text-brand-800">
                      {d.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-brand-600">{d.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-brand-800 text-white">
          <div className="container-x py-20 sm:py-24">
            <div className="max-w-2xl">
              <h2 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
                ¿Coordinamos tu próximo lavado?
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-brand-100">
                Escribinos con lo que tengas para lavar y te pasamos el precio. No te
                comprometés a nada.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <WhatsAppButton
                  source="sobre_nosotros"
                  message={waMessages.footer}
                  variant="primary"
                >
                  Escribinos por WhatsApp
                </WhatsAppButton>
                <a
                  href="/#servicios"
                  className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sharp border border-white/25 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/60"
                >
                  Ver servicios
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </a>
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
