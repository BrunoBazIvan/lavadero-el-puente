import Link from 'next/link';
import { waMessages } from '@/lib/config';
import { businessSectors, businessValue } from '@/lib/content';
import WhatsAppButton from './WhatsAppButton';
import Reveal from './Reveal';
import { ArrowRight } from './icons';

/** 5.5 — Lavandería industrial para empresas (B2B). */
export default function ServicesBusiness() {
  return (
    <section id="empresas" className="scroll-mt-20 bg-brand-800 text-white">
      <div className="container-x section">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <span className="eyebrow eyebrow-invert">Para tu empresa</span>

            <h2 className="h2 mt-6 text-white">
              Lavandería industrial para empresas de Maldonado y Punta del Este
            </h2>

            <p className="lead mt-6 text-brand-100">
              Hoteles y empresas de Punta del Este nos dejan su ropa blanca durante todo el año.
              Manejamos el volumen de la temporada sin mover las fechas de entrega.
            </p>

            {/* Sectores: etiquetas rectas con filete, no píldoras. */}
            <ul className="mt-9 flex flex-wrap gap-2">
              {businessSectors.map((sector) => (
                <li
                  key={sector}
                  className="rounded-sharp border border-white/20 px-3 py-1.5 text-[0.8125rem] font-medium text-brand-100"
                >
                  {sector}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col flex-wrap items-start gap-x-8 gap-y-6 sm:flex-row sm:items-center">
              <WhatsAppButton source="b2b" message={waMessages.business} variant="primary">
                Coordiná una cotización para tu empresa
              </WhatsAppButton>
              <Link
                href="/lavanderia-industrial-maldonado/"
                className="group inline-flex items-center gap-2 whitespace-nowrap font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-200 transition-colors hover:text-white"
              >
                Ver lavandería industrial
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          {/* Compromisos como filas de ficha técnica, numeradas y con filete. */}
          <Reveal delay={90} className="lg:col-span-6">
            <ol className="border-t border-white/15">
              {businessValue.map((v, i) => (
                <li
                  key={v}
                  className="flex items-start gap-6 border-b border-white/15 py-6 lg:py-7"
                >
                  <span className="tnum mt-1 shrink-0 font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-300">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base leading-relaxed text-brand-50">{v}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
