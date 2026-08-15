import {
  IconoAlerta,
  IconoAnular,
  IconoCheck,
  IconoDinero,
  IconoEntregada,
  IconoLavando,
  IconoLista,
  IconoRecibida,
} from '@/components/Iconos';
import type { ComponentType } from 'react';
import type { EstadoOrden, EstadoPago } from '@/types/database';

type Icono = ComponentType<{ size?: number; className?: string }>;

/**
 * El chip se lee de un vistazo desde el otro lado del mostrador: color plano,
 * versalitas, sin píldoras. El color acompaña, pero el texto siempre está —
 * nadie tiene que acordarse de qué significa el verde.
 */
const ESTADO_ORDEN: Record<EstadoOrden, { texto: string; clase: string; icono: Icono }> = {
  recibido: {
    texto: 'Recibida',
    clase: 'border-slate-300 bg-slate-100 text-slate-700',
    icono: IconoRecibida,
  },
  en_proceso: {
    texto: 'En proceso',
    clase: 'border-aqua-200 bg-aqua-50 text-aqua-600',
    icono: IconoLavando,
  },
  listo: {
    texto: 'Lista',
    clase: 'border-green-300 bg-green-50 text-ok',
    icono: IconoLista,
  },
  entregado: {
    texto: 'Entregada',
    clase: 'border-brand-200 bg-brand-50 text-brand-800',
    icono: IconoEntregada,
  },
  anulado: {
    texto: 'Anulada',
    clase: 'border-red-200 bg-red-50 text-alerta',
    icono: IconoAnular,
  },
};

export function ChipEstado({ estado, grande = false }: { estado: EstadoOrden; grande?: boolean }) {
  const { texto, clase, icono: Icono } = ESTADO_ORDEN[estado];
  return (
    <span className={`chip ${grande ? 'chip-lg' : ''} ${clase}`}>
      <Icono size={grande ? 18 : 14} />
      {texto}
    </span>
  );
}

/**
 * Cómo está la plata de la orden. "Sin monto" no es un valor de la base: es
 * `monto is null`, y se pasa aparte porque en el mostrador es lo que más
 * importa distinguir — todavía no tiene precio, no es que nadie pagó.
 */
const ESTADO_PAGO: Record<
  EstadoPago | 'sin_monto',
  { texto: string; clase: string; icono: Icono }
> = {
  sin_monto: {
    texto: 'Sin monto',
    clase: 'border-slate-300 bg-slate-100 text-slate-700',
    icono: IconoDinero,
  },
  pendiente: {
    texto: 'Sin cobrar',
    clase: 'border-aviso/50 bg-amber-50 text-aviso',
    icono: IconoAlerta,
  },
  parcial: {
    texto: 'Cobro parcial',
    clase: 'border-aviso/50 bg-amber-50 text-aviso',
    icono: IconoAlerta,
  },
  pagado: {
    texto: 'Cobrada',
    clase: 'border-green-300 bg-green-50 text-ok',
    icono: IconoCheck,
  },
};

export function ChipPago({
  estado,
  grande = false,
}: {
  estado: EstadoPago | 'sin_monto';
  grande?: boolean;
}) {
  const { texto, clase, icono: Icono } = ESTADO_PAGO[estado];
  return (
    <span className={`chip ${grande ? 'chip-lg' : ''} ${clase}`}>
      <Icono size={grande ? 18 : 14} />
      {texto}
    </span>
  );
}

export const ETIQUETA_ESTADO: Record<EstadoOrden, string> = {
  recibido: 'Recibida',
  en_proceso: 'En proceso',
  listo: 'Lista para retirar',
  entregado: 'Entregada',
  anulado: 'Anulada',
};

/* ── Línea de estado ──────────────────────────────────────────────────────── */

/** El camino que recorre toda orden. Anulada no está: es una salida, no un paso. */
type PasoOrden = Exclude<EstadoOrden, 'anulado'>;

export const PASOS_ORDEN: PasoOrden[] = ['recibido', 'en_proceso', 'listo', 'entregado'];

const TEXTO_PASO: Record<PasoOrden, { corto: string; largo: string }> = {
  recibido: { corto: 'Recibida', largo: 'La ropa está acá' },
  en_proceso: { corto: 'En proceso', largo: 'Se está lavando' },
  listo: { corto: 'Lista', largo: 'Pronta para retirar' },
  entregado: { corto: 'Entregada', largo: 'Se la llevó el cliente' },
};

/**
 * Dónde está la orden, dibujado.
 *
 * Antes esto era un `<select>` adentro del panel de fechas: para saber en qué
 * punto estaba una bolsa había que abrir un desplegable y leer cuál opción
 * venía marcada. Acá se ve sin tocar nada, que es lo que se pregunta el
 * mostrador cien veces por día.
 */
export function LineaEstado({ estado }: { estado: EstadoOrden }) {
  if (estado === 'anulado') {
    return (
      <div className="flex items-center gap-3 rounded-card border border-alerta/50 bg-red-50 px-4 py-3.5">
        <IconoAnular size={22} className="shrink-0 text-alerta" />
        <div>
          <p className="font-display text-base font-bold text-alerta">Orden anulada</p>
          <p className="text-sm text-slate-700">
            No cuenta en el historial del cliente. El motivo está en las notas.
          </p>
        </div>
      </div>
    );
  }

  const actual = PASOS_ORDEN.indexOf(estado);

  return (
    // El gap de 1px sobre fondo azul dibuja los filetes compartidos entre celdas.
    <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-brand-200 bg-brand-200 sm:grid-cols-4">
      {PASOS_ORDEN.map((paso, i) => {
        const hecho = i < actual;
        const esActual = i === actual;
        const { icono: Icono } = ESTADO_ORDEN[paso];

        return (
          <li
            key={paso}
            aria-current={esActual ? 'step' : undefined}
            className={`flex items-center gap-2.5 px-3 py-3 ${
              esActual ? 'bg-brand-800 text-white' : 'bg-white'
            }`}
          >
            {hecho ? (
              <IconoCheck size={20} className="shrink-0 text-ok" />
            ) : (
              <Icono size={20} className={`shrink-0 ${esActual ? '' : 'text-slate-300'}`} />
            )}

            <div className="min-w-0">
              <p
                className={`font-display text-sm font-bold leading-tight ${
                  esActual ? 'text-white' : hecho ? 'text-brand-800' : 'text-slate-400'
                }`}
              >
                {TEXTO_PASO[paso].corto}
              </p>
              <p
                className={`truncate text-xs leading-tight ${
                  esActual ? 'text-aqua-200' : hecho ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {esActual ? 'Está acá ahora' : TEXTO_PASO[paso].largo}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
