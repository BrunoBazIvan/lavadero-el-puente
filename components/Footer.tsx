import { business, waMessages } from '@/lib/config';
import Logo from './Logo';
import WhatsAppButton from './WhatsAppButton';
import PhoneLink from './PhoneLink';
import { PinIcon, ClockIcon } from './icons';

/** 5.10 — Footer. */
export default function Footer() {
  const { address, openingHours, social } = business;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-700 text-brand-100">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="[&_span]:text-white">
              <Logo />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-200">
              Lavadero industrial y lavandería en {address.locality}. Hogar y empresas, todo el año.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white">Contacto</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-aqua-300" />
                <span>
                  {address.street}
                  <br />
                  {address.locality}, {address.country}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 shrink-0 text-aqua-300" />
                <span>{openingHours.label}</span>
              </li>
              <li>
                <PhoneLink className="font-medium text-white hover:text-aqua-200" />
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white">Secciones</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#servicios" className="hover:text-white">Servicios para el hogar</a></li>
              <li><a href="#empresas" className="hover:text-white">Empresas</a></li>
              <li><a href="#ubicacion" className="hover:text-white">Ubicación y horarios</a></li>
            </ul>
            {(social.instagram || social.facebook) && (
              <div className="mt-5 flex gap-3">
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener" className="hover:text-white">
                    Instagram
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener" className="hover:text-white">
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white">
              Pedí tu presupuesto
            </p>
            <p className="mt-4 text-sm text-brand-200">
              Escribinos y coordinamos lo que necesites.
            </p>
            <div className="mt-4">
              <WhatsAppButton source="footer" message={waMessages.footer} variant="solid">
                Escribinos por WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-brand-300">
          © {year} {business.name}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
