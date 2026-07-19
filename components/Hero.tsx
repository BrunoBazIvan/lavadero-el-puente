import { business, waMessages } from '@/lib/config';
import WhatsAppButton from './WhatsAppButton';
import { ArrowRight } from './icons';

/** Hero: H1 único de la página + CTA primario a WhatsApp. */
export default function Hero() {
  const cobertura = 'Maldonado y Punta del Este';
  const valor = business.pickupDelivery
    ? 'Rápido, prolijo y con retiro y entrega a coordinar.'
    : 'Rápido, prolijo y con trato directo.';

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Fondo: composición gráfica de marca (ondas + burbujas), nunca stock. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-canvas to-canvas" />
        <div className="bubbles-bg absolute inset-0" />
        <svg
          className="absolute -right-24 -top-24 h-[32rem] w-[32rem] text-aqua-100 opacity-60"
          viewBox="0 0 200 200"
          fill="currentColor"
        >
          <path d="M45,-58C58,-48,68,-33,71,-17C74,-1,70,17,61,32C52,47,38,58,21,64C4,70,-16,71,-33,63C-50,55,-64,39,-70,20C-76,1,-73,-20,-63,-36C-53,-52,-35,-62,-17,-67C1,-72,20,-71,45,-58Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="container-x grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div className="max-w-2xl">
          <span className="eyebrow mb-5">Lavadero industrial · Maldonado</span>

          <h1 className="h1">
            Lavadero industrial en Maldonado —{' '}
            <span className="text-brand-500">ropa, blancos y textiles impecables</span>
          </h1>

          <p className="lead mt-6">
            Damos servicio en {cobertura}, a familias y empresas. {valor}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <WhatsAppButton source="hero" message={waMessages.hero} variant="primary">
              Pedí tu presupuesto por WhatsApp
            </WhatsAppButton>
            <a
              href="#servicios"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-brand-200 bg-white/70 px-6 py-3.5 text-base font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-white"
            >
              Ver servicios
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-5 text-sm font-medium text-brand-500">
            Respondemos en el día · {business.openingHours.shortLabel}
          </p>
        </div>

        {/* Tarjeta visual de apoyo (composición gráfica, sin foto stock). */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[1.75rem] bg-brand-500 shadow-lift">
            <div className="bubbles-bg absolute inset-0 opacity-30" />
            <div className="absolute inset-0 flex flex-col justify-end gap-4 p-8 text-white">
              <div className="rounded-card bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-aqua-200">
                  Para tu hogar
                </p>
                <p className="mt-1 text-lg font-medium">
                  Acolchados, cortinas, alfombras y ropa como nuevos.
                </p>
              </div>
              <div className="rounded-card bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-aqua-200">
                  Para tu empresa
                </p>
                <p className="mt-1 text-lg font-medium">
                  Ropa blanca hotelera lista, incluso en plena temporada.
                </p>
              </div>
            </div>
          </div>
          {/* ⚠️ Al llegar la foto real del lavadero, reemplazar esta tarjeta por
              la imagen tratada (AVIF/WebP, width/height explícitos, fetchpriority high). */}
        </div>
      </div>
    </section>
  );
}
