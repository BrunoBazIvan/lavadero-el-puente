'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { business } from '@/lib/config';
import { trackScroll75 } from '@/lib/analytics';

/**
 * Carga de GA4 DIFERIDA: solo se inyecta el script tras la primera interacción
 * del usuario (scroll, click o tecla) para no dañar el LCP/INP.
 * Si no hay ga4Id configurado, no hace nada (pero igual mide scroll_75 localmente,
 * que quedará en cola sin gtag → simplemente no se envía).
 */
export default function Analytics() {
  const [loadGa, setLoadGa] = useState(false);
  const scrollFired = useRef(false);
  const id = business.ga4Id;

  // Diferir carga de GA hasta primera interacción.
  useEffect(() => {
    if (!id) return;
    const trigger = () => setLoadGa(true);
    const opts = { once: true, passive: true } as const;
    window.addEventListener('scroll', trigger, opts);
    window.addEventListener('pointerdown', trigger, opts);
    window.addEventListener('keydown', trigger, opts);
    const t = window.setTimeout(trigger, 6000);
    return () => {
      window.removeEventListener('scroll', trigger);
      window.removeEventListener('pointerdown', trigger);
      window.removeEventListener('keydown', trigger);
      window.clearTimeout(t);
    };
  }, [id]);

  // Evento scroll_75 (una sola vez).
  useEffect(() => {
    const onScroll = () => {
      if (scrollFired.current) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= 0.75) {
        scrollFired.current = true;
        trackScroll75();
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!id || !loadGa) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
