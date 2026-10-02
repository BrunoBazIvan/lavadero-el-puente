import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { addMonths, parseISO, subMonths } from 'date-fns';
import { EncabezadoPagina } from '@/components/Layout';
import { LinkCliente } from '@/components/LinkCliente';
import { BloqueCargando, EstadoError } from '@/components/Estados';
import { BarrasPorDia, LineaAcumulado } from '@/components/Grafica';
import { IconoVolver } from '@/components/Iconos';
import { mesAInput, useAnaliticas } from '@/hooks/useOrdenes';
import { mensajeDeError } from '@/lib/supabase';
import { fecha, moneda } from '@/lib/format';
import { METODOS_PAGO, NOMBRE_METODO_PAGO, NOMBRE_SERVICIO } from '@/types/database';
import type { EstadoOrden, ServicioOrden } from '@/types/database';

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

/** Mismo orden que los botones al recibir: de lo más pedido a lo menos. */
const SERVICIOS = Object.keys(NOMBRE_SERVICIO) as ServicioOrden[];

function nombreMes(mesIso: string): string {
  const texto = parseISO(mesIso).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const CELDA_ETIQUETA =
  'font-display text-[11px] font-semibold uppercase tracking-technical text-slate-500';
const CELDA_VALOR = 'mt-0.5 tabular font-display text-lg font-bold text-brand-900';

export default function Analiticas() {
  const [verDesglose, setVerDesglose] = useState(false);
  const [parametros, setParametros] = useSearchParams();

  // El mes vive en la URL (`?mes=2026-10-01`), igual que el filtro de Órdenes:
  // así la pantalla se puede marcar como favorita o compartir ya en el mes que
  // importa. Sin parámetro (o uno con forma rara), la RPC calcula el mes en
  // curso sola.
  const mesParam = parametros.get('mes');
  const mesPedido = mesParam && /^\d{4}-\d{2}-\d{2}$/.test(mesParam) ? mesParam : undefined;

  const { data, isPending, error, refetch } = useAnaliticas(mesPedido);

  const mesActualInput = mesAInput(new Date());
  const esMesActual = data ? data.mes === mesActualInput : true;

  const irAMes = (mesIso: string) => {
    if (mesIso === mesActualInput) setParametros({}, { replace: true });
    else setParametros({ mes: mesIso }, { replace: true });
  };

  const comparacionCobrado = useMemo(() => {
    if (!data || data.totales.cobrado_mes_anterior <= 0) return null;
    const variacion =
      ((data.totales.cobrado - data.totales.cobrado_mes_anterior) / data.totales.cobrado_mes_anterior) * 100;
    return Math.round(variacion);
  }, [data]);

  const mejorCliente = data?.top_clientes[0] ?? null;
  const ticketPromedio =
    data && data.totales.ingresadas > 0 ? data.totales.facturado / data.totales.ingresadas : null;

  return (
    <>
      <EncabezadoPagina
        titulo="Analíticas"
        detalle={data ? nombreMes(data.mes) : 'Cómo viene el mes.'}
        acciones={
          data && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => irAMes(mesAInput(subMonths(parseISO(data.mes), 1)))}
              >
                <IconoVolver size={16} />
                Mes anterior
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={esMesActual}
                onClick={() => irAMes(mesAInput(addMonths(parseISO(data.mes), 1)))}
              >
                Mes siguiente
                <span className="inline-block rotate-180">
                  <IconoVolver size={16} />
                </span>
              </button>
            </div>
          )
        }
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
          <div className="grid items-start gap-5 sm:grid-cols-3">
            <section className="panel p-4">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left"
                aria-expanded={verDesglose}
                onClick={() => setVerDesglose((v) => !v)}
              >
                <h2 className="eyebrow">Cobrado en el mes</h2>
                <span className="font-display text-[11px] font-semibold uppercase tracking-technical text-brand-600">
                  {verDesglose ? 'Ocultar' : 'Ver detalle'}
                </span>
              </button>
              <p className="tabular mt-2 font-display text-4xl font-bold leading-none text-brand-900">
                {moneda(data.totales.cobrado)}
              </p>
              <p className="mt-2 text-[0.9375rem] text-slate-600">
                {comparacionCobrado === null
                  ? 'El mes anterior no tuvo cobros para comparar.'
                  : comparacionCobrado === 0
                    ? 'Igual que el mes anterior.'
                    : comparacionCobrado > 0
                      ? `${comparacionCobrado}% más que el mes anterior (${moneda(data.totales.cobrado_mes_anterior)}).`
                      : `${Math.abs(comparacionCobrado)}% menos que el mes anterior (${moneda(data.totales.cobrado_mes_anterior)}).`}
              </p>

              {verDesglose && (
                <div className="mt-3 max-h-64 overflow-y-auto border-t border-brand-100 pt-3">
                  {data.cobradas_detalle.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Ninguna orden se terminó de cobrar este mes.
                    </p>
                  ) : (
                    <ul className="divide-y divide-brand-100 text-sm">
                      {data.cobradas_detalle.map((o) => (
                        <li key={o.ref}>
                          <Link
                            to={`/ordenes/${o.ref}`}
                            className="flex items-center justify-between gap-2 py-1.5 transition-colors hover:text-brand-800"
                          >
                            <span className="min-w-0 truncate">
                              <span className="font-mono font-semibold text-brand-800">
                                {o.ref}
                              </span>{' '}
                              <span className="text-slate-600">{o.cliente_nombre}</span>
                              <span className="block text-xs text-slate-400">
                                {fecha(o.fecha_cobro)}
                              </span>
                            </span>
                            <span className="tabular shrink-0 font-semibold text-ink">
                              {moneda(o.total)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <section className="panel p-4">
              <h2 className="eyebrow">A cobrar del mes</h2>
              <p className="tabular mt-2 font-display text-4xl font-bold leading-none text-brand-900">
                {moneda(data.totales.a_cobrar)}
              </p>
              <p className="mt-2 text-[0.9375rem] text-slate-600">
                Saldo de las órdenes que ingresaron este mes y no están anuladas.
              </p>
            </section>

            <section className="panel p-4">
              <h2 className="eyebrow">Mejor cliente del mes</h2>
              {mejorCliente ? (
                <>
                  <p className="mt-2 truncate font-display text-2xl font-bold leading-tight text-brand-900">
                    {mejorCliente.nombre}
                  </p>
                  <p className="mt-2 text-[0.9375rem] text-slate-600">
                    {moneda(mejorCliente.facturado)} en{' '}
                    {mejorCliente.ordenes === 1 ? '1 orden' : `${mejorCliente.ordenes} órdenes`}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[0.9375rem] text-slate-500">
                  Todavía ninguna orden del mes tiene precio cargado.
                </p>
              )}
            </section>
          </div>

          {/* ── Cobrado por día ──────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">Cobrado por día</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cada barra, contra el mismo día del mes anterior. Abajo, el acumulado del mes.
            </p>
            <div className="mt-4">
              <BarrasPorDia
                dias={data.serie}
                diasMes={data.dias_mes}
                etiqueta="Cobrado"
                valor={(p) => p.cobrado}
                valorAnterior={(p) => p.cobrado_anterior}
                formatear={moneda}
              />
            </div>
            <div className="mt-5 border-t border-brand-100 pt-4">
              <LineaAcumulado
                dias={data.serie}
                diasMes={data.dias_mes}
                diaDeHoy={data.dia_de_hoy}
                etiqueta="Cobrado acumulado"
                valor={(p) => p.cobrado}
                valorAnterior={(p) => p.cobrado_anterior}
                formatear={moneda}
              />
            </div>
          </section>

          {/* ── Órdenes por día ──────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">Órdenes por día</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cuántas bolsas entraron cada día, contra el mismo día del mes anterior.
            </p>
            <div className="mt-4">
              <BarrasPorDia
                dias={data.serie}
                diasMes={data.dias_mes}
                etiqueta="Órdenes"
                valor={(p) => p.ordenes}
                valorAnterior={(p) => p.ordenes_anterior}
                formatear={(n) => `${n}`}
              />
            </div>
          </section>

          {/* ── Plata: métodos, facturado, top clientes ─────────────────────── */}
          <section className="panel">
            <div className="panel-cabezal">
              <h2 className="eyebrow">Plata</h2>
            </div>

            <dl className="grid grid-cols-2 gap-px border-b border-brand-100 bg-brand-100 sm:grid-cols-3">
              <div className="bg-white px-4 py-3">
                <dt className={CELDA_ETIQUETA}>Facturado</dt>
                <dd className={CELDA_VALOR}>{moneda(data.totales.facturado)}</dd>
              </div>
              <div className="bg-white px-4 py-3">
                <dt className={CELDA_ETIQUETA}>Ticket promedio</dt>
                <dd className={CELDA_VALOR}>{ticketPromedio !== null ? moneda(ticketPromedio) : '—'}</dd>
              </div>
              <div className="bg-white px-4 py-3">
                <dt className={CELDA_ETIQUETA}>Devuelto</dt>
                <dd className={CELDA_VALOR}>{moneda(data.totales.cobros_devueltos)}</dd>
              </div>
            </dl>

            <div className="px-4 py-4">
              <h3 className="eyebrow mb-2">Métodos de pago</h3>
              <dl className="grid grid-cols-2 gap-px bg-brand-100 sm:grid-cols-5">
                {METODOS_PAGO.map((m) => (
                  <div key={m} className="bg-white px-3 py-2.5">
                    <dt className={CELDA_ETIQUETA}>{NOMBRE_METODO_PAGO[m]}</dt>
                    <dd className={CELDA_VALOR}>{moneda(data.por_metodo[m]?.cobrado ?? 0)}</dd>
                    <dd className="tabular text-xs text-slate-500">
                      {data.por_metodo[m]?.cantidad ?? 0} cobros
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {data.top_clientes.length > 0 && (
              <div className="border-t border-brand-100 px-4 py-4">
                <h3 className="eyebrow mb-2">Top 5 clientes</h3>
                <ol className="divide-y divide-brand-100">
                  {data.top_clientes.map((c, i) => (
                    <li
                      key={c.cliente_id}
                      className="flex items-center justify-between gap-3 py-2 text-[0.9375rem]"
                    >
                      <span className="flex items-center gap-2 text-ink">
                        <span className="tabular text-slate-400">{i + 1}.</span>
                        <LinkCliente className="font-semibold" claseLink="hover:underline" id={c.cliente_id}>
                          {c.nombre}
                        </LinkCliente>
                      </span>
                      <span className="tabular font-semibold text-brand-900">{moneda(c.facturado)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          {/* ── Trabajo: servicios y artículos ───────────────────────────────── */}
          <section className="panel">
            <div className="panel-cabezal">
              <h2 className="eyebrow">Trabajo</h2>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-brand-100 sm:grid-cols-4">
              {SERVICIOS.map((s) => (
                <div key={s} className="bg-white px-4 py-3">
                  <dt className={CELDA_ETIQUETA}>{NOMBRE_SERVICIO[s]}</dt>
                  <dd className={CELDA_VALOR}>{data.por_servicio[s]?.ordenes ?? 0}</dd>
                </div>
              ))}
              <div className="bg-white px-4 py-3">
                <dt className={CELDA_ETIQUETA}>Con envío</dt>
                <dd className={CELDA_VALOR}>{data.totales.con_envio}</dd>
              </div>
            </dl>

            {data.por_articulo.length > 0 && (
              <div className="border-t border-brand-100 px-4 py-4">
                <h3 className="eyebrow mb-2">Artículos recibidos</h3>
                <ul className="divide-y divide-brand-100">
                  {data.por_articulo.map((a) => (
                    <li
                      key={a.descripcion}
                      className="flex items-center justify-between gap-3 py-2 text-[0.9375rem] text-ink"
                    >
                      <span>{a.descripcion}</span>
                      <span className="tabular font-semibold text-brand-900">{a.cantidad}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ── Operación: demora, olvidadas, por persona ────────────────────── */}
          <section className="panel">
            <div className="panel-cabezal">
              <h2 className="eyebrow">Operación</h2>
            </div>

            <dl className="grid grid-cols-1 gap-px bg-brand-100 sm:grid-cols-2">
              <div className="bg-white px-4 py-3">
                <dt className={CELDA_ETIQUETA}>Días de recibir a entregar</dt>
                <dd className={CELDA_VALOR}>
                  {data.dias_promedio_entrega !== null ? `${data.dias_promedio_entrega} días` : '—'}
                </dd>
                <p className="mt-1 text-xs text-slate-500">
                  De lo entregado en el mes, no de lo que ingresó.
                </p>
              </div>
              <Link
                to="/ordenes?ver=olvidadas"
                className="bg-white px-4 py-3 transition-colors hover:bg-brand-50"
              >
                <dt className={CELDA_ETIQUETA}>Sin retirar hace +7 días</dt>
                <dd className={CELDA_VALOR}>{data.listas_sin_retirar}</dd>
                <p className="mt-1 text-xs text-slate-500">A hoy, no del mes que estás mirando.</p>
              </Link>
            </dl>

            {data.por_operador.length > 0 && (
              <div className="border-t border-brand-100 px-4 py-4">
                <h3 className="eyebrow mb-2">Quién recibió el trabajo</h3>
                <ul className="divide-y divide-brand-100">
                  {data.por_operador.map((o) => (
                    <li
                      key={o.nombre}
                      className="flex items-center justify-between gap-3 py-2 text-[0.9375rem] text-ink"
                    >
                      <span>{o.nombre}</span>
                      <span className="tabular text-slate-600">
                        {o.ordenes} órdenes · {moneda(o.facturado)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.cobrado_por.length > 0 && (
              <div className="border-t border-brand-100 px-4 py-4">
                <h3 className="eyebrow mb-2">Quién cobró</h3>
                <ul className="divide-y divide-brand-100">
                  {data.cobrado_por.map((o) => (
                    <li
                      key={o.nombre}
                      className="flex items-center justify-between gap-3 py-2 text-[0.9375rem] text-ink"
                    >
                      <span>{o.nombre}</span>
                      <span className="tabular text-slate-600">
                        {o.cobros} cobros · {moneda(o.cobrado)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

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
                    <dt className={CELDA_ETIQUETA}>{ETIQUETA_CORTA[e]}</dt>
                    <dd className={CELDA_VALOR}>{data.por_estado[e]}</dd>
                  </Link>
                ) : (
                  <div key={e} className="bg-white px-4 py-3">
                    <dt className={CELDA_ETIQUETA}>{ETIQUETA_CORTA[e]}</dt>
                    <dd className={CELDA_VALOR}>{data.por_estado[e]}</dd>
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
