import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { BloqueCargando, EstadoError } from '@/components/Estados';
import { useResumenMes } from '@/hooks/useOrdenes';
import { mensajeDeError } from '@/lib/supabase';
import { moneda } from '@/lib/format';
import type { EstadoOrden } from '@/types/database';

/**
 * Estados que se muestran en "por estado". "en_proceso" ya no es un paso del
 * flujo (se sacó el "poner a lavar"): solo quedaría en órdenes viejas, así
 * que no ocupa un lugar acá.
 */
const ESTADOS: EstadoOrden[] = ['recibido', 'listo', 'entregado', 'anulado'];

const ETIQUETA_CORTA: Record<EstadoOrden, string> = {
  recibido: 'Sin empezar',
  en_proceso: 'En proceso',
  listo: 'Listas',
  entregado: 'Entregadas',
  anulado: 'Anuladas',
};

/** Solo estos filtros existen de verdad en Órdenes (ver `FILTROS` en Ordenes.tsx). */
const ESTADOS_CON_LINK: EstadoOrden[] = ['recibido', 'listo', 'entregado'];

function nombreMes(fecha: Date): string {
  const texto = fecha.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function Analiticas() {
  const { data, isPending, error, refetch } = useResumenMes();

  const comparacion = useMemo(() => {
    if (!data || data.cobradoMesAnterior <= 0) return null;
    const variacion =
      ((data.cobradoMes - data.cobradoMesAnterior) / data.cobradoMesAnterior) * 100;
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
          {/* ── Plata: cobrada, pendiente, mejor cliente ────────────────────── */}
          <div className="grid gap-5 sm:grid-cols-3">
            <section className="panel p-4">
              <h2 className="eyebrow">Cobrado en el mes</h2>
              <p className="tabular mt-2 font-display text-4xl font-bold leading-none text-brand-900">
                {moneda(data.cobradoMes)}
              </p>
              <p className="mt-2 text-[0.9375rem] text-slate-600">
                {comparacion === null
                  ? 'El mes anterior no tuvo cobros para comparar.'
                  : comparacion === 0
                    ? 'Igual que el mes anterior.'
                    : comparacion > 0
                      ? `${comparacion}% más que el mes anterior (${moneda(data.cobradoMesAnterior)}).`
                      : `${Math.abs(comparacion)}% menos que el mes anterior (${moneda(data.cobradoMesAnterior)}).`}
              </p>
            </section>

            <section className="panel p-4">
              <h2 className="eyebrow">A cobrar del mes</h2>
              <p className="tabular mt-2 font-display text-4xl font-bold leading-none text-brand-900">
                {moneda(data.aCobrarMes)}
              </p>
              <p className="mt-2 text-[0.9375rem] text-slate-600">
                Lo que falta cobrar de las órdenes del mes, ya tengan precio o no.
              </p>
            </section>

            <section className="panel p-4">
              <h2 className="eyebrow">Mejor cliente del mes</h2>
              {data.mejorCliente ? (
                <>
                  <p className="mt-2 truncate font-display text-2xl font-bold leading-tight text-brand-900">
                    {data.mejorCliente.nombre}
                  </p>
                  <p className="mt-2 text-[0.9375rem] text-slate-600">
                    {moneda(data.mejorCliente.total)} en{' '}
                    {data.mejorCliente.cantidadOrdenes === 1
                      ? '1 orden'
                      : `${data.mejorCliente.cantidadOrdenes} órdenes`}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[0.9375rem] text-slate-500">
                  Todavía ninguna orden del mes tiene precio cargado.
                </p>
              )}
            </section>
          </div>

          {/* ── Órdenes por estado ────────────────────────────────────────── */}
          <section className="panel">
            <div className="panel-cabezal">
              <h2 className="eyebrow">Órdenes del mes, por estado</h2>
            </div>
            {/* El gap de 1px sobre fondo azul dibuja los filetes compartidos.
                Cada celda con filtro real en Órdenes es un link (para "sin
                empezar", "listas" y "entregadas"); "anuladas" queda como dato
                suelto porque ese filtro no existe en el listado. */}
            <dl className="grid grid-cols-2 gap-px bg-brand-100 sm:grid-cols-4">
              {ESTADOS.map((e) =>
                ESTADOS_CON_LINK.includes(e) ? (
                  <Link
                    key={e}
                    to={`/ordenes?estado=${e}`}
                    className="bg-white px-4 py-3 transition-colors hover:bg-brand-50"
                  >
                    <dt className="font-display text-[11px] font-semibold uppercase tracking-technical text-slate-500">
                      {ETIQUETA_CORTA[e]}
                    </dt>
                    <dd className="mt-0.5 tabular font-display text-lg font-bold text-brand-900">
                      {data.porEstado[e]}
                    </dd>
                  </Link>
                ) : (
                  <div key={e} className="bg-white px-4 py-3">
                    <dt className="font-display text-[11px] font-semibold uppercase tracking-technical text-slate-500">
                      {ETIQUETA_CORTA[e]}
                    </dt>
                    <dd className="mt-0.5 tabular font-display text-lg font-bold text-brand-900">
                      {data.porEstado[e]}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </section>
        </div>
      )}
    </>
  );
}
