import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { ChipEstado } from '@/components/ChipsOrden';
import { BloqueCargando, EstadoError, EstadoVacio } from '@/components/Estados';
import { IconoAlerta, IconoBuscar, IconoRecibir } from '@/components/Iconos';
import { DIAS_SIN_RETIRAR, useListaOrdenes, useResumenPendientes } from '@/hooks/useOrdenes';
import { useDebounce } from '@/hooks/useDebounce';
import { diasDesde, fecha, moneda, telefono as formatearTelefono } from '@/lib/format';
import { mensajeDeError } from '@/lib/supabase';
import { NOMBRE_SERVICIO } from '@/types/database';
import type { EstadoOrden } from '@/types/database';

const FILTROS: (EstadoOrden | 'todos')[] = ['todos', 'recibido', 'listo', 'entregado'];

/** Nombres cortos para los botones de filtro: la columna ya dice el estado largo. */
const ETIQUETA_FILTRO: Record<EstadoOrden | 'todos', string> = {
  todos: 'Todas',
  recibido: 'Sin empezar',
  en_proceso: 'En proceso',
  listo: 'Listas',
  entregado: 'Entregadas',
  anulado: 'Anuladas',
};

export default function Ordenes() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');

  /**
   * El filtro vive en la URL, no en un `useState`.
   *
   * Así los contadores del encabezado son links de verdad: tocar "5 listas
   * para retirar" abre este listado ya filtrado, y la pantalla se puede
   * marcar como favorita o volver con el botón de atrás.
   */
  const [parametros, setParametros] = useSearchParams();
  const soloOlvidadas = parametros.get('ver') === 'olvidadas';
  const pedido = parametros.get('estado') as EstadoOrden | null;
  const estado: EstadoOrden | 'todos' = soloOlvidadas
    ? 'listo'
    : pedido && FILTROS.includes(pedido)
      ? pedido
      : 'todos';

  const filtrar = (f: EstadoOrden | 'todos') =>
    setParametros(f === 'todos' ? {} : { estado: f }, { replace: true });

  const busquedaDemorada = useDebounce(busqueda, 300);
  const { data: todas, isPending, error, refetch } = useListaOrdenes(busquedaDemorada, estado);
  const { data: resumen } = useResumenPendientes();

  const esOlvidada = (fechaRetiro: string) =>
    (diasDesde(fechaRetiro) ?? 0) > DIAS_SIN_RETIRAR;

  const ordenes = useMemo(
    () =>
      soloOlvidadas
        ? (todas ?? []).filter((o) => o.estado === 'listo' && esOlvidada(o.fecha_retiro_estimada))
        : todas,
    [todas, soloOlvidadas],
  );

  /** Cuántas hay en cada filtro. Solo de los estados abiertos: son los que se miran. */
  const cuenta: Partial<Record<EstadoOrden | 'todos', number>> = {
    recibido: resumen?.recibido,
    listo: resumen?.listo,
  };

  return (
    <>
      <EncabezadoPagina
        titulo={soloOlvidadas ? 'Órdenes sin retirar' : 'Órdenes'}
        detalle={
          soloOlvidadas
            ? `Están prontas hace más de ${DIAS_SIN_RETIRAR} días y nadie las vino a buscar.`
            : 'Buscá por el comprobante que trae el cliente, por su nombre o por su teléfono.'
        }
        acciones={
          <Link to="/" className="btn-primary btn-lg">
            <IconoRecibir size={19} />
            Recibir ropa
          </Link>
        }
        volver={soloOlvidadas ? { a: '/ordenes', texto: 'Ver todas las órdenes' } : undefined}
      />

      <div className="panel">
        <div className="space-y-3 border-b border-brand-100 px-4 py-4">
          <div className="relative">
            <label className="sr-only" htmlFor="buscar-orden">
              Buscar orden
            </label>
            <IconoBuscar
              size={22}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="buscar-orden"
              type="search"
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="EP-00001, nombre del cliente o teléfono…"
              className="field h-14 pl-12 text-lg"
            />
          </div>

          {!soloOlvidadas && (
            <div className="flex flex-wrap gap-2">
              {FILTROS.map((f) => {
                const activo = estado === f;
                const n = cuenta[f];

                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => filtrar(f)}
                    className={`flex items-center gap-2 rounded-sharp border px-3.5 py-2 font-display text-[0.9375rem] font-semibold transition-colors ${
                      activo
                        ? 'border-brand-800 bg-brand-800 text-white'
                        : 'border-brand-300 bg-white text-brand-800 hover:bg-brand-50'
                    }`}
                  >
                    {ETIQUETA_FILTRO[f]}
                    {n !== undefined && n > 0 && (
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
          )}
        </div>

        {isPending && <BloqueCargando texto="Buscando órdenes…" />}

        {error ? (
          <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
        ) : null}

        {ordenes && ordenes.length === 0 && (
          <EstadoVacio
            titulo={
              soloOlvidadas
                ? 'No hay ropa sin retirar'
                : busquedaDemorada
                  ? 'Ninguna orden coincide'
                  : 'Todavía no hay órdenes'
            }
            detalle={
              soloOlvidadas
                ? 'Todas las órdenes prontas se retiraron dentro del plazo.'
                : busquedaDemorada
                  ? 'Probá con la referencia del comprobante, el nombre o los últimos números del teléfono.'
                  : 'Cuando recibas la primera bolsa de ropa, la vas a ver acá.'
            }
            accion={
              !soloOlvidadas && (
                <Link to="/" className="btn-primary">
                  <IconoRecibir size={19} />
                  Recibir ropa
                </Link>
              )
            }
          />
        )}

        {ordenes && ordenes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="encabezado-tabla">
                  <th>Comprobante</th>
                  <th>Cliente</th>
                  <th>Recibido</th>
                  <th>Servicio</th>
                  <th>Retiro</th>
                  <th className="text-right">Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {ordenes.map((o) => {
                  const atrasada = o.estado === 'listo' && esOlvidada(o.fecha_retiro_estimada);

                  return (
                    <tr key={o.id} onClick={() => navigate(`/ordenes/${o.ref}`)} className="fila">
                      <td className="celda">
                        <span className="font-mono text-[1.0625rem] font-bold text-brand-800">
                          {o.ref}
                        </span>
                      </td>

                      <td className="celda">
                        <span className="block font-display text-[1.0625rem] font-semibold leading-tight text-ink">
                          {o.cliente_nombre}
                        </span>
                        <span className="tabular text-sm text-slate-500">
                          {o.cliente_telefono ? formatearTelefono(o.cliente_telefono) : 'Sin teléfono'}
                        </span>
                      </td>

                      <td className="celda tabular text-slate-700">{o.cantidad_prendas}</td>

                      <td className="celda text-slate-700">
                        {NOMBRE_SERVICIO[o.servicio]}
                        {o.envio && (
                          <span className="block text-sm text-brand-600">+ envío</span>
                        )}
                      </td>

                      <td className="celda">
                        <span className="tabular text-slate-700">
                          {fecha(o.fecha_retiro_estimada)}
                        </span>
                        {atrasada && (
                          <span className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-aviso">
                            <IconoAlerta size={14} className="shrink-0" />
                            sin retirar
                          </span>
                        )}
                      </td>

                      <td className="celda text-right">
                        {o.monto === null ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <>
                            <span className="tabular font-display text-[1.0625rem] font-semibold text-ink">
                              {moneda(o.total)}
                            </span>
                            {o.saldo > 0 && o.estado !== 'anulado' && (
                              <span className="tabular block text-sm font-semibold text-aviso">
                                debe {moneda(o.saldo)}
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      <td className="celda">
                        <ChipEstado estado={o.estado} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
