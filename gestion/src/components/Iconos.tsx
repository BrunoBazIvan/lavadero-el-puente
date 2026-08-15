import type { SVGProps } from 'react';

/**
 * Íconos dibujados a mano, no una librería.
 *
 * Dos motivos. La PC del mostrador tiene que renderizar bien sin internet —por
 * eso las tipografías también van auto-hospedadas—, y el trazo recto con
 * uniones en punta es parte del lenguaje de ficha técnica: los sets genéricos
 * vienen con puntas redondeadas que ablandan todo el sistema.
 *
 * Regla de uso: **el ícono nunca va solo**. Siempre acompaña a un texto. Nadie
 * del mostrador tiene que adivinar qué significa un dibujo.
 */

type Props = { size?: number } & Omit<SVGProps<SVGSVGElement>, 'children'>;

function Trazo({ size = 20, children, ...resto }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  );
}

/* ── Navegación ───────────────────────────────────────────────────────────── */

export function IconoRecibir(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M4 8h16v12H4z" />
      <path d="M8.5 8V4.5h7V8" />
      <path d="M12 11.5v5M9.5 14h5" />
    </Trazo>
  );
}

export function IconoOrdenes(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M4 6.5h16M4 12h16M4 17.5h10" />
    </Trazo>
  );
}

export function IconoClientes(p: Props) {
  return (
    <Trazo {...p}>
      <circle cx="9" cy="8" r="3.3" />
      <path d="M3 20c0-3.4 2.7-5.2 6-5.2s6 1.8 6 5.2" />
      <path d="M16 5.4a3.3 3.3 0 0 1 0 6.1" />
      <path d="M18.2 15.2c1.9.8 2.8 2.4 2.8 4.8" />
    </Trazo>
  );
}

export function IconoArticulos(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M3.5 3.5h8L21 13l-8 8-9.5-9.5z" />
      <path d="M7.8 7.8v.1" />
    </Trazo>
  );
}

/* ── Acciones ─────────────────────────────────────────────────────────────── */

export function IconoBuscar(p: Props) {
  return (
    <Trazo {...p}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4L20.5 20.5" />
    </Trazo>
  );
}

export function IconoImprimir(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M7 9V3.5h10V9" />
      <path d="M17 13h4V9H3v4h4" />
      <path d="M7 13h10v7.5H7z" />
    </Trazo>
  );
}

export function IconoCheck(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M4 12.5l5.5 5.5L20 6.5" />
    </Trazo>
  );
}

export function IconoMas(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M12 4.5v15M4.5 12h15" />
    </Trazo>
  );
}

export function IconoMenos(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M4.5 12h15" />
    </Trazo>
  );
}

export function IconoX(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
    </Trazo>
  );
}

export function IconoEditar(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M4 20h4.5L20 8.5 15.5 4 4 15.5z" />
      <path d="M13.5 6L18 10.5" />
    </Trazo>
  );
}

export function IconoVolver(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M10.5 5.5L4 12l6.5 6.5" />
      <path d="M4 12h16" />
    </Trazo>
  );
}

export function IconoSalir(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M9.5 4H4v16h5.5" />
      <path d="M14.5 7.5L19 12l-4.5 4.5" />
      <path d="M8 12h11" />
    </Trazo>
  );
}

/* ── Estados de la orden ──────────────────────────────────────────────────── */

export function IconoRecibida(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z" />
      <path d="M3.5 7.5L12 11.5l8.5-4" />
      <path d="M12 11.5v9" />
    </Trazo>
  );
}

export function IconoLavando(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M4.5 3.5h15v17h-15z" />
      <circle cx="12" cy="14" r="4.3" />
      <path d="M7.5 7v.1M10.5 7v.1" />
    </Trazo>
  );
}

export function IconoLista(p: Props) {
  return (
    <Trazo {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12.3l2.8 2.7L16 9.5" />
    </Trazo>
  );
}

export function IconoEntregada(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M12.5 20H4V8.5h8.5" />
      <path d="M11 14.2h9.5" />
      <path d="M17 10.5l3.8 3.7-3.8 3.8" />
    </Trazo>
  );
}

export function IconoAnular(p: Props) {
  return (
    <Trazo {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6l12 12" />
    </Trazo>
  );
}

/* ── Avisos y datos ───────────────────────────────────────────────────────── */

export function IconoAlerta(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M12 3.5L22 20H2z" />
      <path d="M12 10v4.3" />
      <path d="M12 17.2v.1" />
    </Trazo>
  );
}

export function IconoReloj(p: Props) {
  return (
    <Trazo {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6.8V12.4l3.6 2.1" />
    </Trazo>
  );
}

export function IconoDinero(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M2.5 6h19v12h-19z" />
      <circle cx="12" cy="12" r="2.9" />
      <path d="M6 9.4v5.2M18 9.4v5.2" />
    </Trazo>
  );
}

export function IconoTelefono(p: Props) {
  return (
    <Trazo {...p}>
      <path d="M5.5 3.5h4l1.8 4.6-2.4 1.6a11.5 11.5 0 0 0 5.4 5.4l1.6-2.4 4.6 1.8v4a1.6 1.6 0 0 1-1.7 1.6A16.6 16.6 0 0 1 3.9 5.2a1.6 1.6 0 0 1 1.6-1.7z" />
    </Trazo>
  );
}

/** Glifo oficial de WhatsApp: es una marca, va relleno y no en trazo. */
export function IconoWhatsapp({ size = 20, ...resto }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.892 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.358.101 11.942c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.582 0 11.941-5.359 11.944-11.943 0-3.191-1.24-6.19-3.495-8.445" />
    </svg>
  );
}
