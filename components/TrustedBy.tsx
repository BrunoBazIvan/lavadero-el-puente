import { waMessages } from '@/lib/config';
import { trustedCompanies, trustedSectors } from '@/lib/content';
import WhatsAppButton from './WhatsAppButton';
import Reveal from './Reveal';

/**
 * Prueba social B2B: "Empresas que ya confían en nosotros".
 * - Si hay clientes reales cargados (lib/content → trustedCompanies), muestra
 *   sus logos/nombres.
 * - Si no, muestra el muro de rubros que atendemos (honesto, sin inventar).
 */

type SectorIcon = (typeof trustedSectors)[number]['icon'];

function SectorGlyph({ name, className = '' }: { name: SectorIcon; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'hotel':
      return (
        <svg {...common}>
          <path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11" />
          <path d="M8 7h1M11 7h1M8 11h1M11 11h1M8 15h1M11 15h1" />
        </svg>
      );
    case 'apart':
      return (
        <svg {...common}>
          <path d="M3 21h18M4 21V9l8-5 8 5v12" />
          <path d="M9 21v-5h6v5M9 12h.01M15 12h.01" />
        </svg>
      );
    case 'resto':
      return (
        <svg {...common}>
          <path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M18 3c-1.5 0-2.5 1.6-2.5 4.5S16.5 12 18 12v9" />
        </svg>
      );
    case 'building':
      return (
        <svg {...common}>
          <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 21V9h4a1 1 0 0 1 1 1v11M3 21h18" />
          <path d="M7 7h1M11 7h1M7 11h1M11 11h1M7 15h1M11 15h1" />
        </svg>
      );
    case 'clinic':
      return (
        <svg {...common}>
          <path d="M3 21h18M5 21V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v15" />
          <path d="M12 8v6M9 11h6" />
        </svg>
      );
  }
}

export default function TrustedBy() {
  const hasClients = trustedCompanies.length > 0;

  return (
    <section id="confian" className="scroll-mt-20 border-y border-brand-100 bg-white">
      <div className="container-x section">
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="eyebrow">Empresas que confían en nosotros</span>
            <h2 className="h2 mt-6">El respaldo de quienes no pueden fallar en temporada</h2>
          </div>
          <p className="text-base leading-relaxed text-brand-600 lg:col-span-5 lg:pb-2">
            Hoteles, apart, restaurantes y edificios de Maldonado y Punta del Este eligen El
            Puente para su ropa blanca y su lavandería del día a día.
          </p>
        </Reveal>

        {hasClients ? (
          <ul className="matrix mt-14 sm:grid-cols-2 lg:grid-cols-3">
            {trustedCompanies.map((c, i) => (
              <Reveal key={c.name} as="li" delay={(i % 3) * 70} className="matrix-cell">
                <div className="flex h-full flex-col justify-between gap-8 p-7 sm:p-8">
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.logo}
                      alt={c.name}
                      className="max-h-12 w-auto max-w-full self-start object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <p className="font-display text-xl font-bold leading-snug tracking-[-0.02em] text-brand-800">
                      {c.name}
                    </p>
                  )}
                  {c.detail && (
                    <p className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-600">
                      {c.detail}
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </ul>
        ) : (
          /* Franja de capacidades: una celda por rubro, íconos monocromos
             sin azulejo de color. */
          <ul className="matrix mt-14 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {trustedSectors.map((s, i) => (
              <Reveal key={s.label} as="li" delay={(i % 5) * 60} className="matrix-cell">
                <div className="group flex h-full flex-col justify-between gap-8 p-6 transition-colors duration-150 hover:bg-brand-50/60 sm:p-7">
                  <SectorGlyph
                    name={s.icon}
                    className="h-8 w-8 text-brand-300 transition-colors duration-150 group-hover:text-aqua-500"
                  />
                  <span className="font-display text-sm font-bold leading-snug tracking-[-0.01em] text-brand-800">
                    {s.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        )}

        <div className="mt-12">
          <WhatsAppButton source="trusted" message={waMessages.business} variant="primary">
            Sumá tu empresa a El Puente
          </WhatsAppButton>
        </div>
      </div>
    </section>
  );
}
