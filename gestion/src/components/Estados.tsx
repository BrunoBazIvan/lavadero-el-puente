import type { ReactNode } from 'react';
import { IconoAlerta } from '@/components/Iconos';

/** Ruedita. `size` en píxeles. */
export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pantalla completa mientras se resuelve la sesión, antes de que haya layout. */
export function PantallaCargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3 text-brand-700">
        <Spinner size={32} />
        <p className="font-display text-sm uppercase tracking-technical">{texto}</p>
      </div>
    </div>
  );
}

/** Carga dentro de un panel o de una lista. */
export function BloqueCargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-16 text-brand-600">
      <Spinner size={24} />
      <span className="text-[0.9375rem]">{texto}</span>
    </div>
  );
}

/** Lista vacía. Nunca dejar una pantalla en blanco sin explicación. */
export function EstadoVacio({
  titulo,
  detalle,
  accion,
}: {
  titulo: string;
  detalle?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-display text-xl font-bold text-brand-800">{titulo}</p>
      {detalle && (
        <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-relaxed text-slate-600">
          {detalle}
        </p>
      )}
      {accion && <div className="mt-6 flex justify-center">{accion}</div>}
    </div>
  );
}

/**
 * Error de carga, con el mensaje real y un botón para reintentar.
 *
 * El mensaje va tal cual viene de Supabase: en el mostrador, "no hay conexión
 * con el servidor" es accionable y "algo salió mal" no.
 */
export function EstadoError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar?: () => void;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <IconoAlerta size={32} className="mx-auto text-alerta" />
      <p className="mt-3 font-display text-xl font-bold text-alerta">No se pudo cargar</p>
      <p className="mx-auto mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-slate-700">
        {mensaje}
      </p>
      {onReintentar && (
        <button type="button" className="btn-secondary btn-lg mt-6" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
