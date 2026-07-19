import { waMessages } from '@/lib/config';
import { faqs } from '@/lib/content';
import WhatsAppButton from './WhatsAppButton';
import Reveal from './Reveal';

/** 5.9 — FAQ con <details> indexables (contenido en el HTML). Alimenta Schema FAQPage. */
export default function FAQ() {
  return (
    <section className="bg-brand-50/70">
      <div className="container-x section">
        <Reveal className="max-w-2xl">
          <span className="eyebrow mb-4">Preguntas frecuentes</span>
          <h2 className="h2">Respondemos tus dudas</h2>
        </Reveal>

        <div className="mx-auto mt-8 max-w-3xl divide-y divide-brand-100 overflow-hidden rounded-card border border-brand-100 bg-white shadow-card">
          {faqs.map((f) => (
            <details key={f.q} className="group px-6 py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold text-brand-800 marker:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-transform duration-200 group-open:rotate-45"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="pb-5 pr-10 text-base leading-relaxed text-brand-600">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <WhatsAppButton source="faq" message={waMessages.faq} variant="primary">
            Hacé tu consulta por WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </section>
  );
}
