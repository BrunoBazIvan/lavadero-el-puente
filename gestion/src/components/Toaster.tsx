import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { IconoAlerta, IconoCheck, IconoX } from '@/components/Iconos';
import { mensajeDeError } from '@/lib/supabase';

type TipoToast = 'ok' | 'error' | 'aviso';

interface Toast {
  id: number;
  tipo: TipoToast;
  texto: string;
}

interface ToastAPI {
  ok: (texto: string) => void;
  aviso: (texto: string) => void;
  /** Muestra el mensaje real del error, no un "algo salió mal". */
  error: (error: unknown) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

const DURACION: Record<TipoToast, number> = {
  ok: 3500,
  aviso: 6000,
  // Los errores se quedan más tiempo: suelen traer una instrucción que hay
  // que leer entera (por ejemplo la de un trigger de la base).
  error: 9000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(1);

  const quitar = useCallback((id: number) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id));
  }, []);

  const agregar = useCallback(
    (tipo: TipoToast, texto: string) => {
      const id = proximoId.current++;
      setToasts((actuales) => [...actuales.slice(-3), { id, tipo, texto }]);
      window.setTimeout(() => quitar(id), DURACION[tipo]);
    },
    [quitar],
  );

  const api = useMemo<ToastAPI>(
    () => ({
      ok: (texto) => agregar('ok', texto),
      aviso: (texto) => agregar('aviso', texto),
      error: (error) => agregar('error', mensajeDeError(error)),
    }),
    [agregar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-md flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <TarjetaToast key={t.id} toast={t} onCerrar={() => quitar(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// El tipo se distingue por el color del borde y el de la etiqueta, no por un
// filete lateral grueso.
const ESTILO: Record<TipoToast, string> = {
  ok: 'border-ok/50 bg-white text-ink',
  aviso: 'border-aviso/50 bg-white text-ink',
  error: 'border-alerta/60 bg-white text-ink',
};

const ETIQUETA: Record<TipoToast, string> = {
  ok: 'Listo',
  aviso: 'Atención',
  error: 'Error',
};

const COLOR_ETIQUETA: Record<TipoToast, string> = {
  ok: 'text-ok',
  aviso: 'text-aviso',
  error: 'text-alerta',
};

const ICONO: Record<TipoToast, ComponentType<{ size?: number; className?: string }>> = {
  ok: IconoCheck,
  aviso: IconoAlerta,
  error: IconoAlerta,
};

function TarjetaToast({ toast, onCerrar }: { toast: Toast; onCerrar: () => void }) {
  const Icono = ICONO[toast.tipo];

  return (
    <div
      className={`pointer-events-auto rounded-card border px-4 py-3.5 shadow-modal ${ESTILO[toast.tipo]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icono size={20} className={`mt-0.5 shrink-0 ${COLOR_ETIQUETA[toast.tipo]}`} />
          <div>
            <p
              className={`font-display text-xs font-semibold uppercase tracking-technical ${COLOR_ETIQUETA[toast.tipo]}`}
            >
              {ETIQUETA[toast.tipo]}
            </p>
            <p className="mt-1 text-[0.9375rem] leading-snug">{toast.texto}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sharp text-slate-400 hover:bg-slate-100 hover:text-ink"
          aria-label="Cerrar aviso"
        >
          <IconoX size={18} />
        </button>
      </div>
    </div>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() tiene que usarse dentro de <ToastProvider>.');
  return ctx;
}
