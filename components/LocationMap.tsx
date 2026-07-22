import { business, waMessages } from '@/lib/config';
import WhatsAppButton from './WhatsAppButton';
import PhoneLink from './PhoneLink';
import DirectionsLink from './DirectionsLink';
import MapFacade from './MapFacade';
import Reveal from './Reveal';
import { PinIcon, ClockIcon } from './icons';

/** 5.8 — Ubicación y horarios. */
export default function LocationMap() {
  const { address, openingHours } = business;

  return (
    <section id="ubicacion" className="section scroll-mt-20">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <span className="eyebrow mb-4">Ubicación</span>
          <h2 className="h2">Dónde estamos</h2>
          <p className="lead mt-4">
            Estamos en {address.street}, {address.locality}. Pasá por el lavadero o escribinos y
            coordinamos.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col gap-6 rounded-card border border-brand-100 bg-white p-7 shadow-card">
              <div className="flex items-start gap-3">
                <PinIcon className="mt-0.5 h-6 w-6 shrink-0 text-aqua-500" />
                <div>
                  <p className="font-semibold text-brand-800">Dirección</p>
                  <p className="text-brand-600">
                    {address.street}
                    <br />
                    {address.locality}, {address.country}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 h-6 w-6 shrink-0 text-aqua-500" />
                <div>
                  <p className="font-semibold text-brand-800">Horarios</p>
                  <p className="text-brand-600">{openingHours.label}</p>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <WhatsAppButton source="location" message={waMessages.location} variant="solid">
                  Escribinos por WhatsApp
                </WhatsAppButton>
                <DirectionsLink />
                {business.reviewLink && (
                  <a
                    href={business.reviewLink}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:border-aqua-300 hover:text-brand-800"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-aqua-500" fill="currentColor" aria-hidden="true">
                      <path d="m12 17.27 5.18 3.13-1.37-5.9 4.59-3.98-6.05-.52L12 4.5 9.65 10l-6.05.52 4.59 3.98-1.37 5.9z" />
                    </svg>
                    Dejá tu reseña en Google
                  </a>
                )}
              </div>

              <p className="text-sm text-brand-500">
                ¿Preferís llamar?{' '}
                <PhoneLink className="font-semibold text-brand-700 underline decoration-aqua-300 underline-offset-2" />
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="h-[22rem] overflow-hidden rounded-card border border-brand-100 shadow-card lg:h-full">
              <MapFacade title={`Mapa de ${business.name} en ${address.locality}`} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
