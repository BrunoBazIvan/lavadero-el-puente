import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { LinkCliente } from '@/components/LinkCliente';
import { Modal } from '@/components/Modal';
import { ChipPago, ETIQUETA_ESTADO, LineaEstado } from '@/components/ChipsOrden';
import { BloqueCargando, EstadoError, EstadoVacio, Spinner } from '@/components/Estados';
import {
  IconoAlerta,
  IconoAnular,
  IconoCheck,
  IconoDinero,
  IconoEntregada,
  IconoImprimir,
  IconoLavando,
  IconoLista,
  IconoReloj,
  IconoTelefono,
  IconoWhatsapp,
} from '@/components/Iconos';
import { useToast } from '@/components/Toaster';
import { useAuth } from '@/auth/AuthProvider';
import {
  DIAS_SIN_RETIRAR,
  useAnularOrden,
  useCambiarEstadoOrden,
  useEntregarOrden,
  useGuardarMonto,
  useOrden,
  useRegistrarPago,
} from '@/hooks/useOrdenes';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { useImprimir } from '@/hooks/useImprimir';
import { mensajeDeError } from '@/lib/supabase';
import {
  diasDesde,
  fecha,
  fechaHora,
  linkWhatsapp,
  moneda,
  telefono as formatearTelefono,
} from '@/lib/format';
import { METODOS_PAGO, NOMBRE_METODO_PAGO, NOMBRE_SERVICIO } from '@/types/database';
import type { EstadoOrden, MetodoPago, OrdenCompleta } from '@/types/database';

/** Estados que se cambian a mano. Anular va aparte, con su confirmación. */
const ESTADOS_MANUALES: EstadoOrden[] = ['recibido', 'en_proceso', 'listo', 'entregado'];

export default function OrdenDetalle() {
  const { ref } = useParams<{ ref: string }>();
  const { esAdmin } = useAuth();
  const toast = useToast();

  const { data: orden, isPending, error, refetch } = useOrden(ref);
  const { data: config } = useConfiguracion();
  const cambiarEstado = useCambiarEstadoOrden();
  const { imprimir } = useImprimir();
  const [anularAbierto, setAnularAbierto] = useState(false);
  /** null = cerrado. Si no, dice para qué se abrió el cuadro del monto. */
  const [montoAbierto, setMontoAbierto] = useState<'listo' | 'corregir' | null>(null);
  const [entregaAbierta, setEntregaAbierta] = useState(false);
  const [pagoAbierto, setPagoAbierto] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);

  if (isPending) {
    return (
      <div className="panel">
        <BloqueCargando texto="Cargando orden…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="panel">
        <EstadoVacio
          titulo={`No existe la orden ${ref}`}
          detalle="Revisá la referencia del comprobante. Se escribe como EP-00001."
          accion={
            <Link to="/ordenes" className="btn-primary">
              Ver todas las órdenes
            </Link>
          }
        />
      </div>
    );
  }

  const cerrada = orden.estado === 'entregado' || orden.estado === 'anulado';

  /**
   * Quién puede anular, calcado de lo que impone `guard_orden_update` en la
   * base: cualquiera del mostrador mientras la ropa siga acá, y solo un admin
   * una vez que la orden se entregó. Si acá fuéramos más permisivos que la
   * base, el botón existiría para terminar en un error de Postgres.
   */
  const puedeAnular = orden.estado !== 'anulado' && (esAdmin || orden.estado !== 'entregado');
  const whatsapp = linkWhatsapp(orden.cliente.telefono, armarMensaje(orden, config?.nombre_negocio));

  const cambiar = async (estado: EstadoOrden) => {
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado });
      toast.ok(`Orden ${orden.ref}: ${ETIQUETA_ESTADO[estado].toLowerCase()}.`);
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  };

  /**
   * Los dos estados que mueven plata no se cambian de una: la base exige monto
   * para marcar lista, y no deja entregar con saldo abierto. Cada uno abre su
   * cuadro y desde ahí sale el cambio, ya con los datos que hacen falta.
   */
  const elegirEstado = (estado: EstadoOrden) => {
    if (estado === orden.estado) return;
    if (estado === 'listo') return setMontoAbierto('listo');
    if (estado === 'entregado') return setEntregaAbierta(true);
    void cambiar(estado);
  };

  const reimprimir = async () => {
    setImprimiendo(true);
    try {
      await imprimir(orden);
    } finally {
      setImprimiendo(false);
    }
  };

  return (
    <>
      <EncabezadoPagina
        volver={{ a: '/ordenes', texto: 'Volver a las órdenes' }}
        titulo={`Orden ${orden.ref}`}
        detalle={
          <>
            {orden.cliente.nombre} · ingresó el {fechaHora(orden.fecha_ingreso)}
          </>
        }
        acciones={
          <>
            <Link to={`/print/${orden.ref}`} className="btn-ghost">
              Ver comprobante
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void reimprimir()}
              disabled={imprimiendo}
            >
              {imprimiendo ? <Spinner size={18} /> : <IconoImprimir size={18} />}
              Reimprimir
            </button>
          </>
        }
      />

      <div className="mb-5">
        <LineaEstado estado={orden.estado} />
      </div>

      <ProximoPaso
        orden={orden}
        whatsapp={whatsapp}
        ocupado={cambiarEstado.isPending}
        onEstado={elegirEstado}
      />

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr] lg:items-start">
        <div className="space-y-5">
          {/* ── Cliente ────────────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">Cliente</h2>
            <LinkCliente
              id={orden.cliente.id}
              className="mt-2 block font-display text-xl font-bold text-brand-800"
              claseLink="hover:underline"
            >
              {orden.cliente.nombre}
            </LinkCliente>
            <p className="mt-1 flex items-center gap-2 text-[0.9375rem] text-slate-600">
              <IconoTelefono size={16} className="shrink-0 text-slate-400" />
              <span className="tabular">
                {orden.cliente.telefono ? formatearTelefono(orden.cliente.telefono) : 'Sin teléfono'}
              </span>
            </p>

            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-3 w-full"
              >
                <IconoWhatsapp size={18} />
                Escribirle por WhatsApp
              </a>
            ) : (
              <p className="ayuda">Sin celular cargado: no se le puede escribir por WhatsApp.</p>
            )}
          </section>

          {/* ── Cobro ──────────────────────────────────────────────────── */}
          <section className="panel p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="eyebrow">
                <IconoDinero size={14} />
                Cobro
              </h2>
              {orden.estado !== 'anulado' && (
                <ChipPago estado={orden.monto === null ? 'sin_monto' : orden.estado_pago} />
              )}
            </div>

            {orden.monto === null ? (
              <>
                <p className="mt-3 text-[0.9375rem] leading-snug text-slate-600">
                  Todavía no tiene monto. Se carga al marcarla lista para retirar, cuando ya sabés
                  cuánto pesó.
                </p>
                {!cerrada && (
                  <button
                    type="button"
                    className="btn-secondary mt-3 w-full"
                    onClick={() => setMontoAbierto('corregir')}
                  >
                    Poner el monto
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="tabular mt-2 font-display text-4xl font-bold leading-none text-brand-900">
                  {moneda(orden.total)}
                </p>

                <dl className="mt-4 space-y-2 text-[0.9375rem]">
                  {orden.pagado > 0 && <Dato etiqueta="Cobrado">{moneda(orden.pagado)}</Dato>}
                  {orden.saldo > 0 && (
                    <Dato etiqueta="Debe">
                      <span className="font-display font-bold text-aviso">
                        {moneda(orden.saldo)}
                      </span>
                    </Dato>
                  )}
                </dl>

                {orden.pagos.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-brand-100 pt-3 text-sm text-slate-600">
                    {orden.pagos.map((p) => (
                      <li key={p.id} className="flex justify-between gap-2">
                        <span>
                          {NOMBRE_METODO_PAGO[p.metodo]} · {fecha(p.fecha)}
                        </span>
                        <span className="tabular">{moneda(p.monto)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {!cerrada && (
                  <div className="mt-4 flex flex-col gap-2">
                    {orden.saldo > 0 && (
                      <button
                        type="button"
                        className="btn-secondary w-full"
                        onClick={() => setPagoAbierto(true)}
                      >
                        Registrar un cobro
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-ghost w-full"
                      onClick={() => setMontoAbierto('corregir')}
                    >
                      Corregir el monto
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Fechas ─────────────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">
              <IconoReloj size={14} />
              Fechas
            </h2>
            <dl className="mt-3 space-y-2 text-[0.9375rem]">
              <Dato etiqueta="Ingreso">{fechaHora(orden.fecha_ingreso)}</Dato>
              <Dato etiqueta="Retiro estimado">{fecha(orden.fecha_retiro_estimada)}</Dato>
              {orden.fecha_entrega_real && (
                <Dato etiqueta="Entregada">{fechaHora(orden.fecha_entrega_real)}</Dato>
              )}
            </dl>
          </section>

          {puedeAnular && (
            <button
              type="button"
              className="btn-danger w-full"
              onClick={() => setAnularAbierto(true)}
            >
              <IconoAnular size={18} />
              Anular orden
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* ── Qué recibimos ──────────────────────────────────────────── */}
          <section className="panel">
            <div className="panel-cabezal">
              <h2 className="eyebrow">Recibimos</h2>
            </div>

            <ul className="divide-y divide-brand-100">
              {orden.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-sharp bg-brand-50 font-display text-base font-bold text-brand-800">
                    {i.cantidad}
                  </span>
                  <span className="text-[1.0625rem] text-ink">{i.descripcion}</span>
                </li>
              ))}
            </ul>

            <dl className="border-t border-brand-100 px-4 py-3 text-[0.9375rem]">
              <div className="flex justify-between py-1">
                <dt className="text-slate-600">Servicio</dt>
                <dd className="font-semibold text-ink">{NOMBRE_SERVICIO[orden.servicio]}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-600">Envío</dt>
                <dd className="font-semibold text-ink">
                  {orden.envio ? 'Retiro y entrega' : 'Trae y retira el cliente'}
                </dd>
              </div>
            </dl>
          </section>

          {/* ── Notas ──────────────────────────────────────────────────── */}
          {orden.notas && (
            <section className="panel p-4">
              <h2 className="eyebrow">Notas</h2>
              <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-slate-700">
                {orden.notas}
              </p>
            </section>
          )}

          {/* ── Corregir el estado ─────────────────────────────────────────
              Va plegado y al final: mover una orden para atrás es la
              excepción, y arriba compite con el paso que sí toca hacer. */}
          {!cerrada && (
            <details className="panel group">
              <summary className="cursor-pointer list-none px-4 py-3 font-display text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50">
                ¿Quedó en el estado equivocado?
              </summary>
              <div className="border-t border-brand-100 px-4 py-4">
                <p className="mb-3 text-sm text-slate-600">
                  Movela al estado que corresponde. Marcarla lista o entregada te va a pedir los
                  datos de siempre.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS_MANUALES.filter((e) => e !== orden.estado).map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="btn-secondary"
                      disabled={cambiarEstado.isPending}
                      onClick={() => elegirEstado(e)}
                    >
                      {ETIQUETA_ESTADO[e]}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Los cuadros de plata se montan recién al abrirse: así arrancan con el
          monto y el saldo de ahora, y no con los que había al cargar la página. */}
      {montoAbierto && (
        <ModalMonto orden={orden} modo={montoAbierto} onCerrar={() => setMontoAbierto(null)} />
      )}
      {entregaAbierta && <ModalEntrega orden={orden} onCerrar={() => setEntregaAbierta(false)} />}
      {pagoAbierto && <ModalPago orden={orden} onCerrar={() => setPagoAbierto(false)} />}
      <ModalAnular orden={orden} abierto={anularAbierto} onCerrar={() => setAnularAbierto(false)} />
    </>
  );
}

/* ── El paso que toca ─────────────────────────────────────────────────────── */

/**
 * El bloque azul con la acción que corresponde ahora.
 *
 * Es el cambio más grande de la pantalla: antes, avanzar una orden era abrir
 * un `<select>` metido en el panel de fechas y elegir la opción correcta de
 * una lista de cuatro. Ahora hay **un** botón grande, dice lo que va a pasar
 * en las palabras del mostrador ("El cliente se la llevó", no "Entregada"), y
 * el resto de la pantalla es información.
 */
function ProximoPaso({
  orden,
  whatsapp,
  ocupado,
  onEstado,
}: {
  orden: OrdenCompleta;
  whatsapp: string | null;
  ocupado: boolean;
  onEstado: (estado: EstadoOrden) => void;
}) {
  if (orden.estado === 'anulado') return null;

  if (orden.estado === 'entregado') {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-brand-200 bg-white px-4 py-4">
        <IconoCheck size={22} className="shrink-0 text-ok" />
        <p className="text-[1.0625rem] text-ink">
          <span className="font-display font-bold">Orden terminada.</span> Se entregó el{' '}
          {fechaHora(orden.fecha_entrega_real)}
          {orden.saldo > 0 && (
            <span className="font-semibold text-aviso"> y quedó debiendo {moneda(orden.saldo)}</span>
          )}
          .
        </p>
      </div>
    );
  }

  const diasEsperando = diasDesde(orden.fecha_retiro_estimada) ?? 0;
  const olvidada = orden.estado === 'listo' && diasEsperando > DIAS_SIN_RETIRAR;

  const contenido = {
    recibido: {
      pregunta: '¿Ya la pusiste a lavar?',
      detalle: 'La ropa está acá y todavía no se tocó.',
      accion: 'Empezar a lavar',
      Icono: IconoLavando,
      destino: 'en_proceso' as EstadoOrden,
    },
    en_proceso: {
      pregunta: '¿Ya está pronta la ropa?',
      detalle: 'Al marcarla lista te va a pedir el monto: es el momento de ponerle precio.',
      accion: 'Marcar lista para retirar',
      Icono: IconoLista,
      destino: 'listo' as EstadoOrden,
    },
    listo: {
      pregunta: '¿Vino el cliente a buscarla?',
      detalle:
        orden.monto === null
          ? 'Está pronta, pero todavía no tiene monto. Se lo vas a poder poner al entregarla.'
          : orden.saldo > 0
            ? `Está pronta. Cuando la retire hay que cobrar ${moneda(orden.saldo)}.`
            : 'Está pronta y ya está paga.',
      accion: 'El cliente se la llevó',
      Icono: IconoEntregada,
      destino: 'entregado' as EstadoOrden,
    },
  }[orden.estado];

  const { pregunta, detalle, accion, Icono, destino } = contenido;

  return (
    <div className="mb-5 rounded-card border border-brand-800 bg-brand-800 px-5 py-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-[16rem] flex-1">
          <p className="font-display text-xl font-bold leading-tight">{pregunta}</p>
          <p className="mt-1.5 text-[0.9375rem] leading-snug text-aqua-100">{detalle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {orden.estado === 'listo' && whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10"
            >
              <IconoWhatsapp size={18} />
              Avisarle que está pronta
            </a>
          )}

          <button
            type="button"
            className="btn-ok btn-xl"
            disabled={ocupado}
            onClick={() => onEstado(destino)}
          >
            {ocupado ? <Spinner size={20} /> : <Icono size={22} />}
            {accion}
          </button>
        </div>
      </div>

      {olvidada && (
        <p className="mt-4 flex items-start gap-2 border-t border-white/20 pt-3.5 text-[0.9375rem] text-amber-200">
          <IconoAlerta size={18} className="mt-0.5 shrink-0" />
          Está pronta hace {diasEsperando} días y nadie la vino a buscar. Llamalo o mandale un
          WhatsApp.
        </p>
      )}
    </div>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{etiqueta}</dt>
      <dd className="tabular text-right text-ink">{children}</dd>
    </div>
  );
}

/** Mensaje pre-armado de WhatsApp, distinto según el estado de la orden. */
function armarMensaje(orden: OrdenCompleta, negocio: string | undefined): string {
  const nombre = orden.cliente.nombre.split(' ')[0];
  const casa = negocio ?? 'El Puente';

  if (orden.estado === 'listo') {
    const cuanto = orden.saldo > 0 ? ` Son ${moneda(orden.saldo)}.` : '';
    return `Hola ${nombre}, te escribimos de ${casa}. Tu pedido ${orden.ref} ya está pronto para retirar.${cuanto} Te esperamos.`;
  }

  return `Hola ${nombre}, te escribimos de ${casa} por tu pedido ${orden.ref}.`;
}

/* ── Plata ────────────────────────────────────────────────────────────────── */

/**
 * Campo de importe. `type="number"` para que el celular abra el teclado
 * numérico; el valor se maneja como texto porque un campo vacío tiene que
 * poder quedar vacío, y `Number('')` es 0.
 */
function CampoMonto({
  id,
  etiqueta,
  valor,
  onCambiar,
  ayuda,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onCambiar: (v: string) => void;
  ayuda?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="flex items-center gap-2">
        <span className="font-display text-2xl font-bold text-brand-700">$</span>
        <input
          id={id}
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          placeholder="0"
          className="field tabular h-14 text-2xl font-bold"
        />
      </div>
      {ayuda && <p className="ayuda">{ayuda}</p>}
    </div>
  );
}

/** Devuelve el importe escrito, o null si lo que hay no sirve como precio. */
function leerMonto(texto: string): number | null {
  if (texto.trim() === '') return null;
  const n = Number(texto);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Cómo pagó. Botones y no un `<select>`: son cinco opciones fijas, se elige
 * una por cobro y de un desplegable cerrado no se ve cuál quedó puesta.
 */
function SelectorMetodo({
  valor,
  onCambiar,
}: {
  valor: MetodoPago;
  onCambiar: (m: MetodoPago) => void;
}) {
  return (
    <fieldset>
      <legend className="label">¿Cómo pagó?</legend>
      <div className="flex flex-wrap gap-2">
        {METODOS_PAGO.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={valor === m}
            onClick={() => onCambiar(m)}
            className={`rounded-sharp border px-3.5 py-2.5 font-display text-[0.9375rem] font-semibold transition-colors ${
              valor === m
                ? 'border-brand-800 bg-brand-800 text-white'
                : 'border-brand-300 bg-white text-brand-800 hover:bg-brand-50'
            }`}
          >
            {NOMBRE_METODO_PAGO[m]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/* ── Monto ────────────────────────────────────────────────────────────────── */

/**
 * Pone el precio de la orden. Se abre de dos lados: al marcarla lista —donde
 * además cambia el estado— y desde el panel de cobro, para corregirlo.
 */
function ModalMonto({
  orden,
  modo,
  onCerrar,
}: {
  orden: OrdenCompleta;
  modo: 'listo' | 'corregir';
  onCerrar: () => void;
}) {
  const toast = useToast();
  const cambiarEstado = useCambiarEstadoOrden();
  const guardarMonto = useGuardarMonto();
  const [texto, setTexto] = useState(orden.monto === null ? '' : String(orden.monto));

  const monto = leerMonto(texto);
  const guardando = cambiarEstado.isPending || guardarMonto.isPending;
  // La base rechaza un monto por debajo de lo ya cobrado: mejor decirlo acá.
  const menorQueCobrado = monto !== null && orden.pagado > monto - orden.descuento;

  const confirmar = async () => {
    if (monto === null) return;
    try {
      if (modo === 'listo') {
        await cambiarEstado.mutateAsync({ id: orden.id, estado: 'listo', monto });
        toast.ok(`Orden ${orden.ref} lista para retirar: ${moneda(monto - orden.descuento)}.`);
      } else {
        await guardarMonto.mutateAsync({ id: orden.id, monto });
        toast.ok(`Orden ${orden.ref}: ${moneda(monto - orden.descuento)}.`);
      }
      onCerrar();
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={modo === 'listo' ? 'Marcar lista para retirar' : `Monto de la orden ${orden.ref}`}
      detalle={
        modo === 'listo'
          ? 'La ropa ya está pronta. Poné cuánto sale antes de avisarle al cliente.'
          : undefined
      }
      ancho="sm"
    >
      <CampoMonto
        id="monto"
        etiqueta="Monto a cobrar"
        valor={texto}
        onCambiar={setTexto}
        ayuda={
          orden.pagado > 0
            ? `Ya tiene cobrados ${moneda(orden.pagado)}: el monto no puede quedar por debajo.`
            : 'Es lo que va a pagar el cliente cuando retire.'
        }
      />

      {menorQueCobrado && (
        <p className="error-text">
          <IconoAlerta size={16} className="mt-0.5 shrink-0" />
          El monto no puede ser menor a lo que ya se cobró.
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-ok btn-lg"
          disabled={monto === null || menorQueCobrado || guardando}
          onClick={() => void confirmar()}
        >
          {guardando ? <Spinner size={18} /> : <IconoCheck size={18} />}
          {modo === 'listo' ? 'Marcar lista' : 'Guardar monto'}
        </button>
      </div>
    </Modal>
  );
}

/* ── Entrega ──────────────────────────────────────────────────────────────── */

/**
 * El momento en que el cliente se lleva la ropa: se pregunta si quedó pagada y,
 * si sí, cómo. Si la orden llegó hasta acá sin precio (se entregó directo, sin
 * pasar por "lista"), el monto se pide en el mismo cuadro.
 *
 * Entregar debiendo lo permite solo un admin, igual que en la base: acá el
 * botón se apaga en vez de dejar que el mostrador choque con un error de
 * Postgres que no puede resolver.
 */
function ModalEntrega({ orden, onCerrar }: { orden: OrdenCompleta; onCerrar: () => void }) {
  const toast = useToast();
  const { esAdmin } = useAuth();
  const entregar = useEntregarOrden();
  const [texto, setTexto] = useState(orden.monto === null ? '' : String(orden.monto));
  const [cobrada, setCobrada] = useState(true);
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');

  const faltaMonto = orden.monto === null;
  const monto = faltaMonto ? leerMonto(texto) : orden.monto;
  const saldo = monto === null ? null : monto - orden.descuento - orden.pagado;
  const hayQueCobrar = saldo !== null && saldo > 0;
  const quedaDebiendo = hayQueCobrar && !cobrada;

  const confirmar = async () => {
    if (monto === null) return;
    try {
      await entregar.mutateAsync({
        id: orden.id,
        monto: faltaMonto ? monto : undefined,
        cobro: hayQueCobrar && cobrada ? saldo! : undefined,
        metodo: hayQueCobrar && cobrada ? metodo : undefined,
      });
      toast.ok(`Orden ${orden.ref} entregada.`);
      onCerrar();
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={`Entregar la orden ${orden.ref}`}
      detalle={`${orden.cliente.nombre} se lleva la ropa.`}
      ancho="md"
    >
      {faltaMonto && (
        <div className="mb-5">
          <CampoMonto
            id="monto-entrega"
            etiqueta="Monto a cobrar"
            valor={texto}
            onCambiar={setTexto}
            ayuda="Esta orden nunca pasó por “lista para retirar”, así que todavía no tiene precio."
          />
        </div>
      )}

      {saldo !== null && saldo <= 0 ? (
        <div className="flex items-center gap-3 rounded-card border border-green-300 bg-green-50 px-4 py-3.5">
          <IconoCheck size={22} className="shrink-0 text-ok" />
          <p className="text-[0.9375rem] leading-snug text-ink">
            Ya está paga: se cobraron {moneda(orden.pagado)}. No hay nada más que cobrar.
          </p>
        </div>
      ) : (
        <fieldset>
          <legend className="label">
            ¿Quedó pagada?{saldo !== null && ` Son ${moneda(saldo)}`}
          </legend>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-sharp border border-brand-300 px-4 py-3.5 transition-colors hover:bg-brand-50 has-[:checked]:border-brand-800 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                name="cobrada"
                checked={cobrada}
                onChange={() => setCobrada(true)}
                className="casilla mt-0.5"
              />
              <span className="text-[1.0625rem] font-semibold text-ink">
                Sí, la cobré ahora
                {saldo !== null && saldo > 0 && (
                  <span className="tabular block text-sm font-normal text-slate-500">
                    {moneda(saldo)}
                  </span>
                )}
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-sharp border border-brand-300 px-4 py-3.5 transition-colors hover:bg-brand-50 has-[:checked]:border-brand-800 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                name="cobrada"
                checked={!cobrada}
                onChange={() => setCobrada(false)}
                className="casilla mt-0.5"
              />
              <span className="text-[1.0625rem] font-semibold text-ink">
                No, queda debiendo
                <span className="block text-sm font-normal text-slate-500">
                  La orden se entrega con saldo abierto.
                </span>
              </span>
            </label>
          </div>

          {cobrada && hayQueCobrar && (
            <div className="mt-5">
              <SelectorMetodo valor={metodo} onCambiar={setMetodo} />
            </div>
          )}

          {quedaDebiendo && !esAdmin && (
            <p className="error-text">
              <IconoAlerta size={16} className="mt-0.5 shrink-0" />
              <span>
                Entregar sin cobrar lo hace solo un admin. Cobrá antes de entregar, o pedile a un
                admin que la entregue igual.
              </span>
            </p>
          )}
        </fieldset>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-ok btn-lg"
          disabled={monto === null || (quedaDebiendo && !esAdmin) || entregar.isPending}
          onClick={() => void confirmar()}
        >
          {entregar.isPending ? <Spinner size={18} /> : <IconoEntregada size={18} />}
          Entregar
        </button>
      </div>
    </Modal>
  );
}

/* ── Cobro suelto ─────────────────────────────────────────────────────────── */

/** Una seña, o el resto de una orden que se entregó debiendo. */
function ModalPago({ orden, onCerrar }: { orden: OrdenCompleta; onCerrar: () => void }) {
  const toast = useToast();
  const registrar = useRegistrarPago();
  const [texto, setTexto] = useState(String(orden.saldo));
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');

  const monto = leerMonto(texto);
  const excede = monto !== null && monto > orden.saldo;
  const valido = monto !== null && monto > 0 && !excede;

  const confirmar = async () => {
    if (!valido) return;
    try {
      await registrar.mutateAsync({ ordenId: orden.id, monto, metodo });
      toast.ok(`Cobrados ${moneda(monto)} de la orden ${orden.ref}.`);
      onCerrar();
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={`Cobrar la orden ${orden.ref}`}
      detalle={`Debe ${moneda(orden.saldo)}.`}
      ancho="md"
    >
      <CampoMonto
        id="cobro"
        etiqueta="Cuánto se cobra ahora"
        valor={texto}
        onCambiar={setTexto}
        ayuda="Podés cobrar una parte: el resto queda como saldo."
      />
      {excede && (
        <p className="error-text">
          <IconoAlerta size={16} className="mt-0.5 shrink-0" />
          No se puede cobrar más de {moneda(orden.saldo)}.
        </p>
      )}

      <div className="mt-5">
        <SelectorMetodo valor={metodo} onCambiar={setMetodo} />
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-ok btn-lg"
          disabled={!valido || registrar.isPending}
          onClick={() => void confirmar()}
        >
          {registrar.isPending ? <Spinner size={18} /> : <IconoDinero size={18} />}
          Registrar cobro
        </button>
      </div>
    </Modal>
  );
}

/* ── Anulación ────────────────────────────────────────────────────────────── */

function ModalAnular({
  orden,
  abierto,
  onCerrar,
}: {
  orden: OrdenCompleta;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const toast = useToast();
  const anular = useAnularOrden();
  const [motivo, setMotivo] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const refCoincide = confirmacion.trim().toUpperCase() === orden.ref.toUpperCase();
  const puedeAnular = refCoincide && motivo.trim().length >= 3;

  const confirmar = async () => {
    try {
      await anular.mutateAsync({ orden, motivo });
      toast.ok(`Orden ${orden.ref} anulada.`);
      setMotivo('');
      setConfirmacion('');
      onCerrar();
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={`Anular la orden ${orden.ref}`} ancho="md">
      <div className="flex items-start gap-3 rounded-card border border-alerta/50 bg-red-50 px-4 py-3.5">
        <IconoAlerta size={20} className="mt-0.5 shrink-0 text-alerta" />
        <p className="text-[0.9375rem] leading-relaxed text-ink">
          La orden queda anulada y <span className="font-semibold">no se puede volver atrás</span>.
          Deja de contar en el historial del cliente.
        </p>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="motivo">
          Motivo
        </label>
        <textarea
          id="motivo"
          rows={2}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Se cargó por error, el cliente se arrepintió…"
          className="field resize-y"
        />
        <p className="ayuda">Queda escrito en las notas de la orden, con tu nombre y la fecha.</p>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="confirmacion">
          Escribí {orden.ref} para confirmar
        </label>
        <input
          id="confirmacion"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          autoComplete="off"
          placeholder={orden.ref}
          className="field tabular"
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={!puedeAnular || anular.isPending}
          onClick={() => void confirmar()}
        >
          {anular.isPending ? <Spinner size={18} /> : <IconoAnular size={18} />}
          Anular orden
        </button>
      </div>
    </Modal>
  );
}
