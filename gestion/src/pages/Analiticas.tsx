import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { ChipEstado } from '@/components/ChipsOrden';
import { BloqueCargando, EstadoError, EstadoVacio } from '@/components/Estados';
import { useResumenMes } from '@/hooks/useOrdenes';
import { mensajeDeError } from '@/lib/supabase';
import { fecha, moneda } from '@/lib/format';
import type { EstadoOrden } from '@/types/database';

/** Mismo orden en que se recorre una orden, más la anulada al final. */
const ESTADOS: EstadoOrden[] = ['recibido', 'en_proceso', 'listo', 'entregado', 'anulado'];

const ETIQUETA_CORTA: Record<EstadoOrden, string> = {
  recibido: 'Sin empezar',
  en_proceso: 'En proceso',
  listo: 'Listas',
  entregado: 'Entregadas',
  anulado: 'Anuladas',
};

function nombreMes(fecha: Date): string {
  const texto = fecha.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function Analiticas() {
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useResumenMes();

  const comparacion = useMemo(() => {
    if (!data || data.montoMesAnterior <= 0) return null;
    const variacion = ((data.montoMes - data.montoMesAnterior) / data.montoMesAnterior) * 100;
    return Math.round(variacion);
  }, [data]);

  return (
    <>
      <EncabezadoPagina
        titulo="Analíticas"
        detalle={data ? nombreMes(data.inicioMes) : 'Cómo viene el mes.'}
      />

      {isPending && (
        <div className="panel">
          <BloqueCargando texto="Calculando el mes…" />
        </div>
      )}

      {error ? (
        <div className="panel">
          <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
        </div>
      ) : null}

      {data && (
        <div className="space-y-5">
          {/* ── Monto generado ────────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">Generado en el mes</h2>
            <p className="tabular mt-2 font-display text-4xl font-bold leading-none text-brand-900">
              {moneda(data.montoMes)}
            </p>
            <p className="mt-2 text-[0.9375rem] text-slate-600">
              {comparacion === null
                ? 'El mes anterior no tuvo órdenes para comparar.'
                : comparacion === 0
                  ? 'Igual que el mes anterior.'
                  : comparacion > 0
                    ? `${comparacion}% más que el mes anterior (${moneda(data.montoMesAnterior)}).`
                    : `${Math.abs(comparacion)}% menos que el mes anterior (${moneda(data.montoMesAnterior)}).`}
            </p>
          </section>

          {/* ── Órdenes por estado ────────────────────────────────────────── */}
          <section className="panel">
            <div className="panel-cabezal">
              <h2 className="eyebrow">Órdenes del mes, por estado</h2>
            </div>
            {/* El gap de 1px sobre fondo azul dibuja los filetes compartidos. */}
            <dl className="grid grid-cols-2 gap-px bg-brand-100 sm:grid-cols-5">
              {ESTADOS.map((e) => (
                <div key={e} className="bg-white px-4 py-3">
                  <dt className="font-display text-[11px] font-semibold uppercase tracking-technical text-slate-500">
                    {ETIQUETA_CORTA[e]}
                  </dt>
                  <dd className="mt-0.5 tabular font-display text-lg font-bold text-brand-900">
                    {data.porEstado[e]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── Listado completo del mes ──────────────────────────────────── */}
          <section className="panel">
            <div className="panel-cabezal">
              <h2 className="eyebrow">Todas las órdenes del mes</h2>
            </div>

            {data.ordenes.length === 0 ? (
              <EstadoVacio
                titulo="Todavía no hay órdenes este mes"
                detalle="Cuando se reciba la primera bolsa del mes, la vas a ver acá."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="encabezado-tabla">
                      <th>Comprobante</th>
                      <th>Cliente</th>
                      <th>Ingreso</th>
                      <th className="text-right">Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {data.ordenes.map((o) => (
                      <tr key={o.id} onClick={() => navigate(`/ordenes/${o.ref}`)} className="fila">
                        <td className="celda">
                          <span className="font-mono text-[1.0625rem] font-bold text-brand-800">
                            {o.ref}
                          </span>
                        </td>
                        <td className="celda text-[1.0625rem] text-ink">{o.cliente_nombre}</td>
                        <td className="celda tabular text-slate-700">{fecha(o.fecha_ingreso)}</td>
                        <td className="celda text-right">
                          {o.monto === null ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="tabular font-display text-[1.0625rem] font-semibold text-ink">
                              {moneda(o.total)}
                            </span>
                          )}
                        </td>
                        <td className="celda">
                          <ChipEstado estado={o.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
