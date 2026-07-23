import { waMessages } from '@/lib/config';
import Logo from './Logo';
import WhatsAppButton from './WhatsAppButton';

const nav = [
  { href: '/#servicios', label: 'Servicios' },
  { href: '/#empresas', label: 'Empresas' },
  { href: '/sobre-nosotros/', label: 'Nosotros' },
  { href: '/#ubicacion', label: 'Ubicación' },
];

/** Header sticky: logo + anchors + CTA WhatsApp compacto. */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-canvas/90 backdrop-blur-sm">
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-6">
        <a href="/#top" aria-label="Lavadero Industrial El Puente — inicio" className="shrink-0">
          <Logo />
        </a>

        <nav aria-label="Secciones" className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="relative py-1 text-[0.8125rem] font-semibold text-brand-600 transition-colors hover:text-brand-800 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-aqua-400 after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <WhatsAppButton source="header" message={waMessages.hero} variant="compact">
          Escribinos
        </WhatsAppButton>
      </div>
    </header>
  );
}
