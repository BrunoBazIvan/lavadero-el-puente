import { waMessages } from '@/lib/config';
import { faqs } from '@/lib/content';
import WhatsAppButton from './WhatsAppButton';
import Reveal from './Reveal';

/** 5.9 — FAQ con <details> indexables (contenido en el HTML). Alimenta Schema FAQPage. */
export default function FAQ() {
  return (
    <section className="border-t border-brand-100 bg-white">
      <div className="container-x section">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Cabecera fija a la izquierda: el listado manda a la derecha. */}
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <span className="eyebrow">Preguntas frecuentes</span>
              <h2 className="h2 mt-6">Respondemos tus dudas</h2>
              <div className="mt-8">
                <WhatsAppButton source="faq" message={waMessages.faq} variant="solid">
                  Hacé tu consulta por WhatsApp
                </WhatsAppButton>
              </div>
            </div>
          </Reveal>

          {/* Listado de filete a filete: sin tarjeta, sin sombra. */}
          <Reveal delay={90} className="lg:col-span-8">
            <div className="border-t border-brand-100">
              {faqs.map((f) => (
                <details key={f.q} className="group border-b border-brand-100">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 font-display text-lg font-bold leading-snug tracking-[-0.015em] text-brand-800 transition-colors marker:hidden hover:text-brand-500">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="relative mt-1.5 h-3.5 w-3.5 shrink-0 text-aqua-500"
                    >
                      {/* Signo + que se convierte en − al abrir. */}
                      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-200 ease-out group-open:scale-y-0" />
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-7 pr-10 text-base leading-relaxed text-brand-600">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
