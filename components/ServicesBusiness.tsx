import Link from 'next/link';
import { waMessages } from '@/lib/config';
import { businessSectors, businessValue } from '@/lib/content';
import WhatsAppButton from './WhatsAppButton';
import Reveal from './Reveal';
import { ArrowRight } from './icons';

/** 5.5 — Lavandería industrial para empresas (B2B). */
export default function ServicesBusiness() {
  return (
    <section id="empresas" className="scroll-mt-20 bg-brand-500 text-white">
      <div className="container-x section">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="mb-4 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-aqua-200">
              Para tu empresa
            </span>
            <h2 className="h2 text-white">
              Lavandería industrial para empresas de Maldonado y Punta del Este
            </h2>
            <p className="lead mt-4 text-brand-100">
              Somos el respaldo de lavandería para hoteles y empresas de Punta del Este: volumen,
              cumplimiento en temporada y ropa blanca impecable todo el año.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {businessSectors.map((sector) => (
                <span
                  key={sector}
                  className="rounded-pill border border-white/20 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white"
                >
                  {sector}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <WhatsAppButton source="b2b" message={waMessages.business} variant="primary">
                Coordiná una cotización para tu empresa
              </WhatsAppButton>
              <Link
                href="/lavanderia-industrial-maldonado/"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-aqua-200 hover:text-white"
              >
                Ver lavandería industrial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <ul className="space-y-4">
              {businessValue.map((v) => (
                <li
                  key={v}
                  className="flex items-start gap-3 rounded-card bg-white/5 p-4 ring-1 ring-white/10"
                >
                  <svg
                    className="mt-0.5 h-6 w-6 shrink-0 text-aqua-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="text-base leading-relaxed text-brand-50">{v}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
