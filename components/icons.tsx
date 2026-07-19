import type { SVGProps } from 'react';
import type { HomeService } from '@/lib/content';

type IconProps = SVGProps<SVGSVGElement>;

/** Logo de WhatsApp (glifo oficial simplificado). */
export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.98.36 1.94.7 2.86a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.22-1.27a2 2 0 0 1 2.11-.45c.92.34 1.88.57 2.86.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Separador de sección: onda SVG (motivo gráfico de marca). */
export function WaveDivider({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path
        d="M0,32 C240,64 480,0 720,24 C960,48 1200,64 1440,28 L1440,60 L0,60 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Íconos de servicio (línea, monocromo, heredan currentColor). */
export function ServiceIcon({ name, ...props }: { name: HomeService['icon'] } & IconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
  switch (name) {
    case 'quilt':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16M15 4v16M3 9.33h18M3 14.66h18" />
        </svg>
      );
    case 'curtain':
      return (
        <svg {...common}>
          <path d="M3 3h18M5 3v14a3 3 0 0 0 6 0M13 3v14a3 3 0 0 0 6 0" />
          <path d="M5 21h6M13 21h6" />
        </svg>
      );
    case 'rug':
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="1" />
          <path d="M4 4l-1 2M20 4l1 2M4 20l-1-2M20 20l1-2M7 9h10M7 12h10M7 15h10" />
        </svg>
      );
    case 'clothes':
      return (
        <svg {...common}>
          <path d="M12 3a2 2 0 0 0-2 2c0 1 1 1.5 1 2l-8 5 3 3 4-2v6h4v-6l4 2 3-3-8-5c0-.5 1-1 1-2a2 2 0 0 0-2-2z" />
        </svg>
      );
    case 'dryclean':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12a3.5 3.5 0 0 1 7 0M8.5 12a3.5 3.5 0 0 0 7 0" />
        </svg>
      );
    case 'iron':
      return (
        <svg {...common}>
          <path d="M3 15v-2a5 5 0 0 1 5-5h9a4 4 0 0 1 4 4v3z" />
          <path d="M3 15h18M8 8V6a1 1 0 0 1 1-1h4" />
        </svg>
      );
    default:
      return null;
  }
}
