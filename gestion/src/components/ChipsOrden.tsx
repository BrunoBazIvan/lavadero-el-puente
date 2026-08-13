import type { EstadoOrden, EstadoPago } from '@/types/database';

/**
 * El chip se lee de un vistazo desde el otro lado del mostrador: color plano,
 * versalitas, sin píldoras. El color acompaña, pero el texto siempre está —
 * nadie tiene que acordarse de qué significa el verde.
 */
const ESTADO_ORDEN: Record<EstadoOrden, { texto: string; clase: string }> = {
  recibido: { texto: 'Recibida', clase: 'border-slate-300 bg-slate-100 text-slate-700' },
  en_proceso: { texto: 'En proceso', clase: 'border-aqua-200 bg-aqua-50 text-aqua-600' },
  listo: { texto: 'Lista', clase: 'border-green-300 bg-green-50 text-ok' },
  entregado: { texto: 'Entregada', clase: 'border-brand-200 bg-brand-50 text-brand-800' },
  anulado: { texto: 'Anulada', clase: 'border-red-200 bg-red-50 text-alerta' },
};

export function ChipEstado({ estado }: { estado: EstadoOrden }) {
  const { texto, clase } = ESTADO_ORDEN[estado];
  return <span className={`chip ${clase}`}>{texto}</span>;
}

/**
 * Cómo está la plata de la orden. "Sin monto" no es un valor de la base: es
 * `monto is null`, y se pasa aparte porque en el mostrador es lo que más
 * importa distinguir — todavía no tiene precio, no es que nadie pagó.
 */
const ESTADO_PAGO: Record<EstadoPago | 'sin_monto', { texto: string; clase: string }> = {
  sin_monto: { texto: 'Sin monto', clase: 'border-slate-300 bg-slate-100 text-slate-700' },
  pendiente: { texto: 'Sin cobrar', clase: 'border-aviso/50 bg-amber-50 text-aviso' },
  parcial: { texto: 'Cobro parcial', clase: 'border-aviso/50 bg-amber-50 text-aviso' },
  pagado: { texto: 'Cobrada', clase: 'border-green-300 bg-green-50 text-ok' },
};

export function ChipPago({ estado }: { estado: EstadoPago | 'sin_monto' }) {
  const { texto, clase } = ESTADO_PAGO[estado];
  return <span className={`chip ${clase}`}>{texto}</span>;
}

export const ETIQUETA_ESTADO: Record<EstadoOrden, string> = {
  recibido: 'Recibida',
  en_proceso: 'En proceso',
  listo: 'Lista para retirar',
  entregado: 'Entregada',
  anulado: 'Anulada',
};
