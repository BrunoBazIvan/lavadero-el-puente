import Reveal from './Reveal';
import { ArrowRight } from './icons';

/** Bifurcación temprana de públicos: dos tarjetas grandes que anclan a su sección. */
export default function AudienceSplit() {
  const cards = [
    {
      href: '#servicios',
      eyebrow: 'Para tu hogar',
      title: 'Traé tu acolchado hoy, llevátelo impecable',
      body: 'Acolchados, cortinas, alfombras, frazadas, ropa y limpieza en seco.',
      className: 'bg-white border-brand-100 hover:border-aqua-300',
    },
    {
      href: '#empresas',
      eyebrow: 'Para tu empresa',
      title: 'Tu ropa blanca siempre lista, incluso en plena temporada',
      body: 'Hoteles, apart, Airbnb, restaurantes, edificios y clínicas.',
      className: 'bg-brand-500 border-brand-500 text-white hover:bg-brand-600',
    },
  ];

  return (
    <section className="container-x -mt-6 pb-4 sm:-mt-10">
      <div className="grid gap-5 md:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.href} delay={i * 80}>
            <a
              href={c.href}
              className={`group flex h-full flex-col justify-between gap-6 rounded-card border p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift sm:p-8 ${c.className}`}
            >
              <div>
                <p
                  className={`text-sm font-semibold uppercase tracking-wide ${
                    c.eyebrow === 'Para tu empresa' ? 'text-aqua-200' : 'text-aqua-600'
                  }`}
                >
                  {c.eyebrow}
                </p>
                <p className="mt-2 font-display text-2xl font-bold leading-snug">{c.title}</p>
                <p
                  className={`mt-3 text-base ${
                    c.eyebrow === 'Para tu empresa' ? 'text-brand-100' : 'text-brand-600'
                  }`}
                >
                  {c.body}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                Ver más
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
