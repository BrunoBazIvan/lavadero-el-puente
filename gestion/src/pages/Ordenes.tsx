import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChipEstado, ETIQUETA_ESTADO } from '@/components/ChipsOrden';
import { BloqueCargando, EstadoError, EstadoVacio } from '@/components/Estados';
import { DIAS_SIN_RETIRAR, useListaOrdenes } from '@/hooks/useOrdenes';
import { useDebounce } from '@/hooks/useDebounce';
import { diasDesde, fecha, moneda, telefono as formatearTelefono } from '@/lib/format';
import { mensajeDeError } from '@/lib/supabase';
import { NOMBRE_SERVICIO } from '@/types/database';
import type { EstadoOrden } from '@/types/database';

const FILTROS: (EstadoOrden | 'todos')[] = [
  'todos',
  'recibido',
  'en_proceso',
  'listo',
  'entregado',
];

export default function Ordenes() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoOrden | 'todos'>('todos');

  const busquedaDemorada = useDebounce(busqueda, 300);
  const { data: ordenes, isPending, error, refetch } = useListaOrdenes(busquedaDemorada, estado);

  const listas = useMemo(
    () => (ordenes ?? []).filter((o) => o.estado === 'listo'),
    [ordenes],
  );
  const olvidadas = useMemo(
    () => listas.filter((o) => (diasDesde(o.fecha_retiro_estimada) ?? 0) > DIAS_SIN_RETIRAR),
    [listas],
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-900">Órdenes</h1>
          {!isPending && !error && (
            <p className="mt-1 text-sm text-slate-600">
              {listas.length > 0
                ? `${listas.length} ${listas.length === 1 ? 'lista' : 'listas'} para retirar`
                : 'Nada pronto para retirar por ahora'}
            </p>
          )}
        </div>
        <Link to="/" className="btn-primary">
          + Recibir ropa
        </Link>
      </div>

      {olvidadas.length > 0 && (
        <div className="mb-5 rounded-card border border-aviso/50 bg-white px-4 py-3">
          <p className="font-display text-xs font-semibold uppercase tracking-technical text-aviso">
            Sin retirar
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {olvidadas.length === 1 ? 'Hay una orden lista' : `Hay ${olvidadas.length} órdenes listas`}{' '}
            hace más de {DIAS_SIN_RETIRAR} días:{' '}
            {olvidadas.slice(0, 5).map((o, i) => (
              <span key={o.id}>
                {i > 0 && ', '}
                <Link to={`/ordenes/${o.ref}`} className="font-mono font-semibold underline">
                  {o.ref}
                </Link>
              </span>
            ))}
            {olvidadas.length > 5 && '…'}
          </p>
        </div>
      )}

      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 px-4 py-3">
          <div className="min-w-[18rem] flex-1">
            <label className="sr-only" htmlFor="buscar-orden">
              Buscar orden
            </label>
            <input
              id="buscar-orden"
              type="search"
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Referencia, nombre o teléfono…"
              className="field"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {FILTROS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setEstado(f)}
                className={`rounded-sharp border px-3 py-1.5 font-display text-xs font-semibold transition-colors ${
                  estado === f
                    ? 'border-brand-800 bg-brand-800 text-white'
                    : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'
                }`}
              >
                {f === 'todos' ? 'Todas' : ETIQUETA_ESTADO[f]}
              </button>
            ))}
          </div>
        </div>

        {isPending && <BloqueCargando texto="Buscando órdenes…" />}

        {error ? (
          <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
        ) : null}

        {ordenes && ordenes.length === 0 && (
          <EstadoVacio
            titulo={busquedaDemorada ? 'Ninguna orden coincide' : 'Todavía no hay órdenes'}
            detalle={
              busquedaDemorada
                ? 'Probá con la referencia del comprobante, el nombre o los últimos números del teléfono.'
                : 'Cuando recibas la primera bolsa de ropa, la vas a ver acá.'
            }
            accion={
              <Link to="/" className="btn-primary">
                + Recibir ropa
              </Link>
            }
          />
        )}

        {ordenes && ordenes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-display font-semibold">Ref</th>
                  <th className="px-4 py-2 font-display font-semibold">Cliente</th>
                  <th className="px-4 py-2 font-display font-semibold">Recibido</th>
                  <th className="px-4 py-2 font-display font-semibold">Servicio</th>
                  <th className="px-4 py-2 font-display font-semibold">Retiro</th>
                  <th className="px-4 py-2 text-right font-display font-semibold">Monto</th>
                  <th className="px-4 py-2 font-display font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {ordenes.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/ordenes/${o.ref}`)}
                    className="cursor-pointer transition-colors hover:bg-brand-50"
                  >
                    <td className="px-4 py-2.5 font-mono font-semibold text-brand-800">{o.ref}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-ink">{o.cliente_nombre}</span>
                      <span className="ml-2 tabular text-xs text-slate-500">
                        {o.cliente_telefono ? formatearTelefono(o.cliente_telefono) : ''}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular text-slate-700">{o.cantidad_prendas}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {NOMBRE_SERVICIO[o.servicio]}
                      {o.envio && <span className="ml-1 text-xs text-brand-600">+ envío</span>}
                    </td>
                    <td className="px-4 py-2.5 tabular text-slate-700">
                      {fecha(o.fecha_retiro_estimada)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {o.monto === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <>
                          <span className="tabular font-medium text-ink">{moneda(o.total)}</span>
                          {o.saldo > 0 && o.estado !== 'anulado' && (
                            <span className="tabular block text-xs text-aviso">
                              debe {moneda(o.saldo)}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <ChipEstado estado={o.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
