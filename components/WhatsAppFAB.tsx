'use client';

import { useEffect, useState } from 'react';
import { buildWhatsAppUrl, waMessages } from '@/lib/config';
import { trackWhatsAppClick } from '@/lib/analytics';
import { WhatsAppIcon } from './icons';

/**
 * Botón flotante de WhatsApp. Aparece recién tras pasar el hero para no
 * duplicar el CTA en la primera pantalla. Target táctil ≥ 56px.
 */
export default function WhatsAppFAB() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href={buildWhatsAppUrl(waMessages.hero)}
      target="_blank"
      rel="noopener"
      aria-label="Escribinos por WhatsApp"
      onClick={() => trackWhatsAppClick('fab')}
      className={`fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lift transition-all duration-300 hover:bg-whatsapp-dark hover:scale-105 sm:h-16 sm:w-16 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-16 opacity-0'
      }`}
    >
      <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8" />
    </a>
  );
}
