/**
 * Analítica: GA4 + Microsoft Clarity, solo en el dominio de producción y con
 * consentimiento opt-in. La carga la hace el script inline que arma
 * `lib/analytics-init.ts`; acá están las constantes que comparten los dos y
 * los helpers que usan los componentes.
 *
 * Los IDs vienen de variables NEXT_PUBLIC_* (ver `.env.example`): se incrustan
 * en el build, así que cambiarlos pide volver a deployar.
 */
import { business } from './config';

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? '';
export const CONSENT_MODE: 'opt-in' | 'notice' =
  process.env.NEXT_PUBLIC_CONSENT_MODE === 'notice' ? 'notice' : 'opt-in';

/** Hostname de producción sin `www.`: fuera de él (localhost, previews) no se carga nada. */
export const PROD_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || business.domain).hostname.replace(
      /^www\./,
      '',
    );
  } catch {
    return '';
  }
})();

export const CONSENT_KEY = 'analytics_consent';
export const OPTOUT_KEY = 'analytics_optout';

type EventParams = Record<string, string | number | boolean>;

export function track(event: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', event, params);
    window.clarity?.('event', event);
  } catch {
    /* la analítica nunca rompe la UI */
  }
}

export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {}
  try {
    window.gtag?.('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    // Claves con S mayúscula: en minúscula Clarity las ignora.
    window.clarity?.('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: granted ? 'granted' : 'denied',
    });
  } catch {}
  // Pasar a "denied" frena las cookies nuevas pero no borra las que ya están.
  if (!granted) clearAnalyticsCookies();
}

/** ¿La persona ya eligió? (solo leer dentro de un efecto: en el render rompe la hidratación). */
export function hasConsentChoice(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== null;
  } catch {
    return false;
  }
}

/** Evento con el que el link "Preferencias de cookies" reabre el banner. */
export const OPEN_CONSENT_EVENT = 'analytics:open-consent';

export function reopenConsentBanner(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {}
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

/**
 * Borra `_ga`, `_ga_<ID>`, `_clck` y `_clsk`. Se prueba sin dominio y con
 * `.dominio` porque GA y Clarity las escriben en el dominio raíz: un borrado
 * con un `domain` distinto al de la cookie no hace nada.
 */
function clearAnalyticsCookies(): void {
  try {
    const names = document.cookie
      .split(';')
      .map((c) => c.split('=')[0].trim())
      .filter((n) => n === '_ga' || n.startsWith('_ga_') || n === '_clck' || n === '_clsk');
    const host = location.hostname;
    const domains = ['', host, `.${host}`, `.${host.replace(/^www\./, '')}`];
    for (const name of names) {
      for (const d of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ''}`;
      }
    }
  } catch {}
}

/**
 * Misma guarda que el script inline (mantener las dos sincronizadas): dominio
 * de producción, al menos un ID y sin opt-out personal. La usa el banner para
 * decidir si mostrarse sin depender de que el script ya haya corrido.
 */
export function analyticsAllowedHere(): boolean {
  if (typeof window === 'undefined') return false;
  if (!PROD_HOST || !(GA_ID || CLARITY_ID)) return false;
  if (location.hostname.replace(/^www\./, '') !== PROD_HOST) return false;
  try {
    if (new URLSearchParams(location.search).get('no_track') === '1') return false;
    if (localStorage.getItem(OPTOUT_KEY) === '1') return false;
  } catch {}
  return true;
}

// --- Eventos de conversión ---------------------------------------------------
// Los mide ConversionTracker escuchando los clics de todo el documento: cada
// link de conversión solo declara dónde está con `data-cta` (y `data-service`
// en las páginas de servicio). Estos son los valores válidos de `data-cta`;
// uno que falte llega a GA4 como "unknown".

export type CtaLocation =
  | 'header'
  | 'hero'
  | 'floating'
  | 'services_grid'
  | 'b2b'
  | 'trusted'
  | 'location'
  | 'faq'
  | 'footer'
  | 'legal'
  | 'about_intro'
  | 'about_closing'
  | 'landing_hero'
  | 'landing_closing';
