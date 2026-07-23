import Link from 'next/link';
import { business, waMessages } from '@/lib/config';
import { landingPages } from '@/lib/landingPages';
import Logo from './Logo';
import WhatsAppButton from './WhatsAppButton';
import PhoneLink from './PhoneLink';

const servicePages = landingPages.filter((p) => p.kind === 'servicio');
const zonePages = landingPages.filter((p) => p.kind === 'zona');

/** Etiqueta de columna del footer: versalitas con tracking técnico. */
function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-300">
      {children}
    </p>
  );
}

/** 5.10 — Footer. */
export default function Footer() {
  const { address, openingHours, social } = business;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="container-x py-16 lg:py-20">
        <div className="grid gap-12 border-t border-white/15 pt-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-1">
            <div className="[&_span]:text-white">
              <Logo />
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-200">
              Lavadero industrial y lavandería en {address.locality}. Hogar y empresas, todo el año.
            </p>
          </div>

          <div>
            <ColTitle>Contacto</ColTitle>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <address className="not-italic leading-relaxed text-brand-200">
                  {address.street}
                  <br />
                  {address.locality}, {address.country}
                </address>
              </li>
              <li className="text-brand-200">{openingHours.label}</li>
              <li>
                <PhoneLink className="font-semibold text-white transition-colors hover:text-aqua-200" />
              </li>
            </ul>
          </div>

          <div>
            <ColTitle>Servicios</ColTitle>
            <ul className="mt-5 space-y-2.5 text-sm">
              {servicePages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}/`} className="text-brand-200 transition-colors hover:text-white">
                    {p.breadcrumbLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColTitle>Zonas</ColTitle>
            <ul className="mt-5 space-y-2.5 text-sm">
              {zonePages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}/`} className="text-brand-200 transition-colors hover:text-white">
                    {p.breadcrumbLabel}
                  </Link>
                </li>
              ))}
              <li>
                <a href="/#ubicacion" className="text-brand-200 transition-colors hover:text-white">
                  Ubicación y horarios
                </a>
              </li>
              <li>
                <Link href="/sobre-nosotros/" className="text-brand-200 transition-colors hover:text-white">
                  Sobre nosotros
                </Link>
              </li>
            </ul>
            {(social.instagram || social.facebook) && (
              <div className="mt-6 flex gap-4 text-sm">
                {social.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener"
                    className="text-brand-200 transition-colors hover:text-white"
                  >
                    Instagram
                  </a>
                )}
                {social.facebook && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener"
                    className="text-brand-200 transition-colors hover:text-white"
                  >
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <ColTitle>Pedí tu presupuesto</ColTitle>
            <p className="mt-5 text-sm leading-relaxed text-brand-200">
              Escribinos y coordinamos lo que necesites.
            </p>
            <div className="mt-5">
              <WhatsAppButton source="footer" message={waMessages.footer} variant="solid">
                Escribinos por WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/15 pt-6 text-sm text-brand-300">
          © {year} {business.name}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
