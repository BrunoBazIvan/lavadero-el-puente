import { business, waMessages } from '@/lib/config';
import WhatsAppButton from './WhatsAppButton';
import { ArrowRight } from './icons';

/** Hero: H1 único de la página + CTA primario a WhatsApp. */
export default function Hero() {
  const cobertura = 'Maldonado y Punta del Este';
  const valor = business.pickupDelivery
    ? 'Rápido, prolijo y con retiro y entrega a coordinar.'
    : 'Rápido, prolijo y con trato directo.';

  // Panel de especificación: los dos públicos, como entradas de ficha técnica.
  const publicos = [
    {
      k: 'Para tu hogar',
      v: 'Acolchados, cortinas, alfombras y ropa como nuevos.',
    },
    {
      k: 'Para tu empresa',
      v: 'Ropa blanca hotelera lista, incluso en plena temporada.',
    },
  ];

  return (
    <section id="top" className="border-b border-brand-100">
      <div className="container-x grid gap-14 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
        {/* Columna editorial */}
        <div className="lg:col-span-7">
          <span className="eyebrow">Lavadero industrial · Maldonado</span>

          <h1 className="h1 mt-7">
            Lavadero industrial en Maldonado —{' '}
            <span className="text-brand-500">ropa, blancos y textiles impecables</span>
          </h1>

          <p className="lead mt-7 max-w-xl">
            Damos servicio en {cobertura}, a familias y empresas. {valor}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <WhatsAppButton source="hero" message={waMessages.hero} variant="primary">
              Pedí tu presupuesto por WhatsApp
            </WhatsAppButton>
            <a
              href="#servicios"
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sharp border border-brand-200 bg-white px-6 py-3.5 text-base font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:text-brand-800"
            >
              Ver servicios
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </a>
          </div>

        </div>

        {/* Panel de especificación: bloque azul profundo, aristas rectas. */}
        <div className="lg:col-span-5">
          <div className="h-full overflow-hidden rounded-card bg-brand-800 text-white">
            <div className="flex h-full flex-col">
              <p className="border-b border-white/15 px-7 py-5 font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-200">
                A quién servimos
              </p>
              <dl className="divide-y divide-white/15">
                {publicos.map((p) => (
                  <div key={p.k} className="px-7 py-8">
                    <dt className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-300">
                      {p.k}
                    </dt>
                    <dd className="mt-3 font-display text-xl font-semibold leading-snug tracking-[-0.01em] text-white">
                      {p.v}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Pie de la ficha: disponibilidad, anclada al fondo del panel. */}
              <p className="mt-auto border-t border-white/15 px-7 py-6 font-display text-[0.625rem] font-bold uppercase leading-relaxed tracking-[0.11em] text-aqua-200">
                <span className="tnum">
                  Respondemos en el día · {business.openingHours.shortLabel}
                </span>
              </p>
            </div>
          </div>
          {/* ⚠️ Al llegar la foto real del lavadero, reemplazar este panel por
              la imagen tratada (AVIF/WebP, width/height explícitos, fetchpriority high). */}
        </div>
      </div>
    </section>
  );
}
