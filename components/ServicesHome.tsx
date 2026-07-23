import { waMessages } from '@/lib/config';
import { homeServices } from '@/lib/content';
import WhatsAppButton from './WhatsAppButton';
import Reveal from './Reveal';
import { ServiceIcon, ArrowRight } from './icons';
import ServiceCardLink from './ServiceCardLink';

/** 5.4 — Servicios para el hogar (B2C). Matriz de servicios enlazados. */
export default function ServicesHome() {
  return (
    <section id="servicios" className="section scroll-mt-20">
      <div className="container-x">
        {/* Cabecera asimétrica: título a la izquierda, bajada a la derecha. */}
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="eyebrow">Para tu hogar</span>
            <h2 className="h2 mt-6">Servicios para tu hogar</h2>
          </div>
          <p className="text-base leading-relaxed text-brand-600 lg:col-span-5 lg:pb-2">
            Limpieza de acolchados, cortinas y alfombras en Maldonado, más lavado de ropa,
            planchado y secado. Tocá el servicio que necesitás y coordinamos por WhatsApp.
          </p>
        </Reveal>

        <div className="matrix mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {homeServices.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 70} className="matrix-cell">
              <ServiceCardLink pageSlug={s.pageSlug} title={s.title}>
                <div className="flex items-start justify-between gap-4">
                  <span className="tnum font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <ServiceIcon
                    name={s.icon}
                    className="h-8 w-8 shrink-0 text-brand-300 transition-colors duration-150 group-hover:text-aqua-500"
                  />
                </div>

                <h3 className="h3 mt-10">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-600">{s.description}</p>

                <span className="mt-8 inline-flex items-center gap-2 font-display text-[0.6875rem] font-bold uppercase tracking-technical text-brand-500">
                  Ver servicio
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </span>
              </ServiceCardLink>
            </Reveal>
          ))}

          {/* La celda libre de la matriz es el CTA: cierra la retícula en vez
              de dejar un hueco, y evita el botón centrado suelto. */}
          <Reveal delay={210} className="matrix-cell">
            <div className="flex h-full items-center justify-center bg-brand-50/70 p-7 sm:p-8">
              <WhatsAppButton
                source="servicio_general"
                message={waMessages.hero}
                variant="solid"
                className="text-center"
              >
                Consultá precio por WhatsApp
              </WhatsAppButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
