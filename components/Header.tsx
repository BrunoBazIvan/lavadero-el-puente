import { waMessages } from '@/lib/config';
import Logo from './Logo';
import WhatsAppButton from './WhatsAppButton';

/** Header sticky minimalista: logo + anchors opcionales + CTA WhatsApp compacto. */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/60 bg-canvas/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <a href="/#top" aria-label="Lavadero Industrial El Puente — inicio" className="shrink-0">
          <Logo />
        </a>

        <nav aria-label="Secciones" className="hidden items-center gap-7 md:flex">
          <a href="/#servicios" className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-800">
            Servicios
          </a>
          <a href="/#empresas" className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-800">
            Empresas
          </a>
          <a href="/sobre-nosotros/" className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-800">
            Nosotros
          </a>
          <a href="/#ubicacion" className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-800">
            Ubicación
          </a>
        </nav>

        <WhatsAppButton source="header" message={waMessages.hero} variant="compact">
          Escribinos
        </WhatsAppButton>
      </div>
    </header>
  );
}
