import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { BloqueCargando, EstadoError, EstadoVacio } from '@/components/Estados';
import { IconoBuscar, IconoCheck, IconoDinero, IconoMas } from '@/components/Iconos';
import { ChipEtapa, FormularioMedidas, FormularioTapizado } from '@/components/Tapizado';
import { useToast } from '@/components/Toaster';
import { useDebounce } from '@/hooks/useDebounce';
import { useCambiarEtapa, useTapizados } from '@/hooks/useTapizados';
import { fecha, moneda } from '@/lib/format';
import { mensajeDeError } from '@/lib/supabase';
import { ETAPAS, TEXTO_ETAPA, nombreProducto } from '@/lib/tapizados';
import type { EstadoTapizado, Tapizado } from '@/types/database';

/** "Todos" son los vigentes: los anulados tienen su propio filtro, como un archivo. */
type Filtro = EstadoTapizado | 'todos';
const FILTROS: Filtro[] = ['todos', ...ETAPAS, 'anulado'];

export default function Tapizados() {
  const [altaAbierta, setAltaAbierta] = useState(false);
  const [aTerminar, setATerminar] = useState<Tapizado | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // El filtro vive en la URL, como en Órdenes: F5 o "atrás" no lo pierden.
  const [parametros, setParametros] = useSearchParams();
  const pedido = parametros.get('estado') as Filtro | null;
  const filtro: Filtro = pedido && FILTROS.includes(pedido) ? pedido : 'todos';
  const filtrar = (f: Filtro) =>
    setParametros(f === 'todos' ? {} : { estado: f }, { replace: true });

  const { data: todos, isPending, error, refetch } = useTapizados();
  const busquedaDemorada = useDebounce(busqueda, 200);

  const cuenta = useMemo(() => {
    const c: Record<Filtro, number> = {
      todos: 0,
      pendiente: 0,
      terminado: 0,
      cobrado: 0,
      anulado: 0,
    };
    for (const t of todos ?? []) {
      if (t.estado !== 'anulado') c.todos++;
      c[t.estado]++;
    }
    return c;
  }, [todos]);

  /** Lo que ya está hecho y todavía no se cobró. */
  const aCobrar = useMemo(
    () =>
      (todos ?? [])
        .filter((t) => t.estado === 'terminado')
        .reduce((suma, t) => suma + Number(t.precio_final), 0),
    [todos],
  );

  const visibles = useMemo(() => {
    const texto = busquedaDemorada.trim().toLowerCase();
    return (todos ?? []).filter((t) => {
      if (filtro === 'todos' ? t.estado === 'anulado' : t.estado !== filtro) return false;
      if (!texto) return true;
      return [t.ref, t.nombre, t.edificio, t.contacto, nombreProducto(t)]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(texto));
    });
  }, [todos, filtro, busquedaDemorada]);

  return (
    <>
      <EncabezadoPagina
        titulo="Tapizados"
        detalle="Sillones, sillas, colchones y alfombras: qué falta hacer y qué falta cobrar."
        acciones={
          <button type="button" className="btn-primary" onClick={() => setAltaAbierta(true)}>
            <IconoMas size={19} />
            Cargar tapizado
          </button>
        }
      />

      {/* Resumen: no se muestran ceros mientras carga. */}
      {todos && (
        <div className="mb-5 grid grid-cols-2 border border-brand-200 bg-white sm:grid-cols-3">
          <Dato etiqueta="Por hacer" valor={String(cuenta.pendiente)} />
          <Dato etiqueta="Terminados sin cobrar" valor={String(cuenta.terminado)} />
          <Dato
            etiqueta="Falta cobrar"
            valor={moneda(aCobrar)}
            className="col-span-2 border-t sm:col-span-1 sm:border-l sm:border-t-0"
          />
        </div>
      )}

      <div className="panel">
        <div className="space-y-3 border-b border-brand-100 px-4 py-4">
          <div className="relative">
            <IconoBuscar
              size={20}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400"
            />
            <label htmlFor="buscar-tapizado" className="sr-only">
              Buscar tapizado
            </label>
            <input
              id="buscar-tapizado"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, edificio, contacto o TP-00001…"
              className="field pl-11"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => {
              const activo = filtro === f;
              const n = cuenta[f];
              // Anulados aparece solo cuando hay alguno (o está elegido).
              if (f === 'anulado' && n === 0 && !activo) return null;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => filtrar(f)}
                  className={`flex min-h-[2.75rem] items-center gap-2 rounded-sharp border px-3.5 py-2 font-display text-[0.9375rem] font-semibold transition-colors ${
                    activo
                      ? 'border-brand-800 bg-brand-800 text-white'
                      : 'border-brand-300 bg-white text-brand-800 hover:bg-brand-50'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'anulado' ? 'Anulados' : TEXTO_ETAPA[f]}
                  {todos && n > 0 && (
                    <span
                      className={`tabular rounded-sharp px-1.5 py-0.5 text-xs font-bold ${
                        activo ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isPending && <BloqueCargando texto="Cargando tapizados…" />}

        {error ? (
          <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
        ) : null}

        {todos && todos.length === 0 && (
          <EstadoVacio
            titulo="Todavía no hay tapizados"
            detalle="Cargá el primero y queda acá hasta que se termine y se cobre."
          />
        )}

        {todos && todos.length > 0 && visibles.length === 0 && (
          <EstadoVacio
            titulo="No hay nada con ese filtro"
            detalle={busqueda ? 'Probá con otra búsqueda.' : 'Elegí otra etapa arriba.'}
          />
        )}

        {visibles.length > 0 && (
          <ul className="divide-y divide-brand-100">
            {visibles.map((t) => (
              <FilaTapizado key={t.id} tapizado={t} onTerminarAlfombra={() => setATerminar(t)} />
            ))}
          </ul>
        )}
      </div>

      <Modal
        abierto={altaAbierta}
        onCerrar={() => setAltaAbierta(false)}
        titulo="Cargar tapizado"
        detalle="Queda como pendiente hasta que lo terminen."
      >
        <FormularioTapizado
          onCancelar={() => setAltaAbierta(false)}
          onGuardado={() => setAltaAbierta(false)}
        />
      </Modal>

      <Modal
        abierto={aTerminar !== null}
        onCerrar={() => setATerminar(null)}
        titulo="¿Cuánto mide la alfombra?"
        detalle="Con las medidas sale el precio final."
        ancho="sm"
      >
        {aTerminar && (
          <FormularioMedidas tapizado={aTerminar} onListo={() => setATerminar(null)} />
        )}
      </Modal>
    </>
  );
}

function Dato({
  etiqueta,
  valor,
  className = '',
}: {
  etiqueta: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className={`border-brand-200 px-4 py-3 [&:nth-child(2)]:border-l ${className}`}>
      <p className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-brand-600">
        {etiqueta}
      </p>
      <p className="tabular mt-1 font-display text-2xl font-bold text-brand-900">{valor}</p>
    </div>
  );
}

/* ── Fila ─────────────────────────────────────────────────────────────────── */

/**
 * Un trabajo. Todo el bloque de datos abre el detalle; el botón de la derecha
 * es el atajo al paso que sigue, para no tener que entrar a cada uno. En el
 * celular se apila; desde `md` se arma en columnas.
 */
function FilaTapizado({
  tapizado: t,
  onTerminarAlfombra,
}: {
  tapizado: Tapizado;
  onTerminarAlfombra: () => void;
}) {
  const toast = useToast();
  const cambiar = useCambiarEtapa();
  const esAlfombra = t.producto === 'alfombra';
  const conMedidas = t.ancho_m !== null && t.largo_m !== null;
  const anulado = t.estado === 'anulado';

  const avanzar = async (estado: EstadoTapizado, aviso: string) => {
    try {
      await cambiar.mutateAsync({ id: t.id, estado });
      toast.ok(aviso);
    } catch {
      // Ya lo avisó el manejador global.
    }
  };

  return (
    <li className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <Link
        to={`/tapizados/${t.ref}`}
        className={`grid gap-2 px-4 pt-4 transition-colors hover:bg-aqua-50 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,0.7fr)] md:items-center md:gap-5 md:py-4 ${
          anulado ? 'text-slate-500' : ''
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ChipEtapa estado={t.estado} />
            <span className="tabular font-display text-sm font-semibold text-slate-500">
              {t.ref}
            </span>
          </div>
          <p className="mt-1.5 font-display text-[1.0625rem] font-bold text-ink">{t.nombre}</p>
          {t.edificio && <p className="text-[0.9375rem] text-slate-700">{t.edificio}</p>}
        </div>

        <div className="min-w-0">
          <p className="font-display font-semibold text-brand-900">{nombreProducto(t)}</p>
          <p className="text-sm text-slate-500">Cargado el {fecha(t.created_at)}</p>
        </div>

        <div className="md:text-right">
          <p
            className={`tabular font-display text-xl font-bold ${
              anulado ? 'text-slate-400 line-through' : 'text-brand-900'
            }`}
          >
            {moneda(Number(t.precio_final))}
          </p>
          {esAlfombra && !conMedidas && !anulado && (
            <p className="text-sm text-slate-500">estimado, falta medir</p>
          )}
        </div>
      </Link>

      <div className="flex px-4 pb-4 md:justify-end md:py-4 md:pl-0">
        {t.estado === 'pendiente' && (
          <button
            type="button"
            className="btn-secondary flex-1 md:flex-none"
            disabled={cambiar.isPending}
            onClick={() =>
              esAlfombra ? onTerminarAlfombra() : void avanzar('terminado', `${t.ref} terminado.`)
            }
          >
            <IconoCheck size={18} />
            Lo terminamos
          </button>
        )}
        {t.estado === 'terminado' && (
          <button
            type="button"
            className="btn-secondary flex-1 md:flex-none"
            disabled={cambiar.isPending}
            onClick={() => void avanzar('cobrado', `${t.ref} cobrado.`)}
          >
            <IconoDinero size={18} />
            Ya pagó
          </button>
        )}
      </div>
    </li>
  );
}
