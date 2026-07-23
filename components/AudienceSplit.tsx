import Reveal from './Reveal';
import { ArrowRight } from './icons';

/** Bifurcación temprana de públicos: dos bloques que anclan a su sección. */
export default function AudienceSplit() {
  const cards = [
    {
      href: '#servicios',
      eyebrow: 'Para tu hogar',
      title: 'Traé tu acolchado hoy, llevátelo impecable',
      body: 'Acolchados, cortinas, alfombras, frazadas, ropa, planchado y secado.',
      invert: false,
    },
    {
      href: '#empresas',
      eyebrow: 'Para tu empresa',
      title: 'Tu ropa blanca siempre lista, incluso en plena temporada',
      body: 'Hoteles, apart, Airbnb, restaurantes, edificios y clínicas.',
      invert: true,
    },
  ];

  return (
    <section className="border-b border-brand-100">
      <div className="container-x">
        <div className="grid md:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal
              key={c.href}
              delay={i * 80}
              className={
                c.invert
                  ? 'bg-brand-500'
                  : 'border-b border-brand-100 md:border-b-0 md:border-r'
              }
            >
              <a
                href={c.href}
                className={`group flex h-full flex-col justify-between gap-10 py-12 transition-colors duration-150 sm:py-14 ${
                  c.invert
                    ? 'bg-brand-500 px-6 text-white hover:bg-brand-600 sm:px-10 lg:px-12'
                    : 'pr-6 hover:bg-brand-50/60 md:pr-12'
                }`}
              >
                <div>
                  <p
                    className={`font-display text-[0.6875rem] font-bold uppercase leading-none tracking-technical ${
                      c.invert ? 'text-aqua-200' : 'text-aqua-600'
                    }`}
                  >
                    {c.eyebrow}
                  </p>
                  <p className="mt-5 max-w-md font-display text-[1.75rem] font-bold leading-[1.1] tracking-[-0.025em] sm:text-[2rem]">
                    {c.title}
                  </p>
                  <p
                    className={`mt-4 max-w-md text-base leading-relaxed ${
                      c.invert ? 'text-brand-100' : 'text-brand-600'
                    }`}
                  >
                    {c.body}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 font-display text-[0.6875rem] font-bold uppercase tracking-technical ${
                    c.invert ? 'text-aqua-200' : 'text-brand-500'
                  }`}
                >
                  Ver más
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
