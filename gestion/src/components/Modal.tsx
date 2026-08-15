import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { IconoX } from '@/components/Iconos';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  detalle?: string;
  children: ReactNode;
  /** Ancho máximo del cuadro. `md` alcanza para un formulario de una columna. */
  ancho?: 'sm' | 'md' | 'lg';
}

// Con el cuerpo a 16px, `max-w-sm` deja los textos de ayuda en tres líneas.
const ANCHOS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function Modal({ abierto, onCerrar, titulo, detalle, children, ancho = 'md' }: Props) {
  const caja = useRef<HTMLDivElement>(null);

  // Escape cierra, y el foco entra al cuadro para poder tabular adentro.
  useEffect(() => {
    if (!abierto) return;

    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alTeclado);

    const previo = document.activeElement as HTMLElement | null;
    const primero = caja.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea, button',
    );
    primero?.focus();

    // Sin scroll de fondo mientras el modal está abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alTeclado);
      document.body.style.overflow = overflowPrevio;
      previo?.focus();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-brand-900/50 px-4 py-10"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`w-full ${ANCHOS[ancho]} rounded-card border border-brand-100 bg-white shadow-modal`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-100 px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-bold leading-tight text-brand-900">{titulo}</h2>
            {detalle && (
              <p className="mt-1 text-[0.9375rem] leading-snug text-slate-600">{detalle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sharp text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
            aria-label="Cerrar"
          >
            <IconoX size={22} />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
