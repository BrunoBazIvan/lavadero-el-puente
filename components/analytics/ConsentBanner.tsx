'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  CONSENT_MODE,
  OPEN_CONSENT_EVENT,
  analyticsAllowedHere,
  hasConsentChoice,
  setAnalyticsConsent,
} from '@/lib/analytics';

/**
 * Aviso de cookies (opt-in). Solo aparece donde la analítica puede cargar —el
 * dominio de producción— y mientras la persona no haya elegido.
 *
 * Va fijo abajo, encima del contenido, para no correr la página (cero CLS).
 * Publica su alto en `--consent-banner-h` para que el botón flotante de
 * WhatsApp se suba y no quede tapado.
 *
 * "Aceptar" y "Rechazar" tienen el mismo peso visual a propósito: un rechazo
 * escondido no es consentimiento.
 */
export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // localStorage solo dentro del efecto: leerlo en el render rompe la hidratación.
  useEffect(() => {
    if (analyticsAllowedHere() && !hasConsentChoice()) setOpen(true);
    const reopen = () => {
      if (analyticsAllowedHere()) setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!open || !el) {
      root.style.removeProperty('--consent-banner-h');
      return;
    }
    const ro = new ResizeObserver(() => {
      root.style.setProperty('--consent-banner-h', `${el.offsetHeight}px`);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--consent-banner-h');
    };
  }, [open]);

  if (!open) return null;

  const choose = (granted: boolean) => {
    setAnalyticsConsent(granted);
    setOpen(false);
  };

  const button =
    'inline-flex min-h-[44px] flex-1 items-center justify-center rounded-sharp border border-white/40 px-6 text-sm font-semibold text-white transition-colors duration-150 hover:border-white hover:bg-white hover:text-brand-900 focus-visible:outline-offset-4 sm:flex-none';

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/15 bg-brand-900 text-brand-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="container-x flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <p className="text-sm leading-relaxed">
          {CONSENT_MODE === 'opt-in'
            ? 'Usamos Google Analytics y Microsoft Clarity para ver cómo se usa la web y mejorarla. No guardamos ninguna cookie de medición hasta que aceptes.'
            : 'Usamos Google Analytics y Microsoft Clarity, con cookies, para ver cómo se usa la web y mejorarla. Si no querés, podés rechazarlas.'}{' '}
          <Link
            href="/politica-de-cookies/"
            className="font-semibold text-white underline decoration-aqua-300 decoration-1 underline-offset-4 hover:decoration-white"
          >
            Política de cookies
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button type="button" onClick={() => choose(false)} className={button}>
            Rechazar
          </button>
          <button type="button" onClick={() => choose(true)} className={button}>
            {CONSENT_MODE === 'opt-in' ? 'Aceptar' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}
