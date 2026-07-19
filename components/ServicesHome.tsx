import { waMessages } from '@/lib/config';
import { homeServices, serviceWaMessage } from '@/lib/content';
import WhatsAppButton from './WhatsAppButton';
import Reveal from './Reveal';
import { ServiceIcon, ArrowRight, WhatsAppIcon } from './icons';
import ServiceCardLink from './ServiceCardLink';

/** 5.4 — Servicios para el hogar (B2C). Grid de 6 tarjetas clickeables a WhatsApp. */
export default function ServicesHome() {
  return (
    <section id="servicios" className="section scroll-mt-20">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <span className="eyebrow mb-4">Para tu hogar</span>
          <h2 className="h2">Servicios para tu hogar</h2>
          <p className="lead mt-4">
            Limpieza de acolchados, cortinas y alfombras en Maldonado, más ropa, planchado y
            limpieza en seco. Tocá el servicio que necesitás y coordinamos por WhatsApp.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeServices.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 70}>
              <ServiceCardLink
                slug={s.slug}
                message={serviceWaMessage(s)}
                title={s.title}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aqua-50 text-aqua-600 transition-colors group-hover:bg-aqua-100">
                  <ServiceIcon name={s.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-brand-800">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{s.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-whatsapp-dark">
                  <WhatsAppIcon className="h-4 w-4" />
                  Consultar
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </ServiceCardLink>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <WhatsAppButton source="servicio_general" message={waMessages.hero} variant="primary">
            Consultá precio por WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </section>
  );
}
