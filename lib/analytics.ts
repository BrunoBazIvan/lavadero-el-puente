/**
 * Analítica ligera. Envía eventos a GA4 si está configurado (business.ga4Id),
 * y nunca rompe si no lo está. Un solo lugar para toda la medición.
 */

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

export type WhatsAppSource =
  | 'hero'
  | 'header'
  | 'audience_home'
  | 'audience_business'
  | 'b2b'
  | 'fab'
  | 'footer'
  | 'location'
  | 'faq'
  | `servicio_${string}`;

function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as GtagWindow;
  if (typeof w.gtag === 'function') {
    w.gtag('event', event, params);
  }
}

export function trackWhatsAppClick(source: WhatsAppSource): void {
  track('whatsapp_click', { source });
}

export function trackPhoneClick(): void {
  track('phone_click');
}

export function trackDirectionsClick(): void {
  track('directions_click');
}

export function trackScroll75(): void {
  track('scroll_75');
}
