import { business, waMessages } from '@/lib/config';
import WhatsAppButton from './WhatsAppButton';
import PhoneLink from './PhoneLink';
import DirectionsLink from './DirectionsLink';
import MapFacade from './MapFacade';
import Reveal from './Reveal';

/** 5.8 — Ubicación y horarios. */
export default function LocationMap() {
  const { address, openingHours } = business;

  return (
    <section id="ubicacion" className="section scroll-mt-20">
      <div className="container-x">
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="eyebrow">Ubicación</span>
            <h2 className="h2 mt-6">Dónde estamos</h2>
          </div>
          <p className="text-base leading-relaxed text-brand-600 lg:col-span-5 lg:pb-2">
            Estamos en {address.street}, {address.locality}. Pasá por el lavadero o escribinos y
            coordinamos.
          </p>
        </Reveal>

        <div className="mt-14 grid border border-brand-100 bg-white lg:grid-cols-2">
          {/* Ficha de datos: filas con filete, etiquetas en versalitas. */}
          <Reveal className="border-b border-brand-100 lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col p-7 sm:p-9">
              <dl>
                <div className="border-b border-brand-100 pb-5">
                  <dt className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-600">
                    Dirección
                  </dt>
                  <dd className="mt-2.5 text-base leading-relaxed text-brand-700">
                    <address>
                      {address.street}
                      <br />
                      {address.locality}, {address.country}
                    </address>
                  </dd>
                </div>
                <div className="border-b border-brand-100 py-5">
                  <dt className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-600">
                    Horarios
                  </dt>
                  <dd className="mt-2.5 text-base leading-relaxed text-brand-700">
                    {openingHours.label}
                  </dd>
                </div>
              </dl>

              <p className="pt-5 text-sm text-brand-500">
                ¿Preferís llamar?{' '}
                <PhoneLink className="font-semibold text-brand-700 underline decoration-aqua-300 decoration-1 underline-offset-4 hover:decoration-aqua-500" />
              </p>

              <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row sm:flex-wrap">
                <WhatsAppButton source="location" message={waMessages.location} variant="solid">
                  Escribinos por WhatsApp
                </WhatsAppButton>
                <DirectionsLink />
                {business.reviewLink && (
                  <a
                    href={business.reviewLink}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sharp border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:text-brand-800"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-aqua-500"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="m12 17.27 5.18 3.13-1.37-5.9 4.59-3.98-6.05-.52L12 4.5 9.65 10l-6.05.52 4.59 3.98-1.37 5.9z" />
                    </svg>
                    Dejá tu reseña en Google
                  </a>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="h-[24rem] overflow-hidden lg:h-full lg:min-h-[26rem]">
              <MapFacade title={`Mapa de ${business.name} en ${address.locality}`} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
