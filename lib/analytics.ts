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
// Se reemplazan en la Fase 4 del plan por el rastreador por delegación.

export type WhatsAppSource =
  | 'hero'
  | 'header'
  | 'b2b'
  | 'trusted'
  | 'fab'
  | 'footer'
  | 'location'
  | 'faq'
  | 'sobre_nosotros'
  | 'legal'
  | `servicio_${string}`;

export function trackWhatsAppClick(source: WhatsAppSource): void {
  track('whatsapp_click', { source });
}

export function trackPhoneClick(): void {
  track('phone_click');
}

export function trackDirectionsClick(): void {
  track('directions_click');
}
