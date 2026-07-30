import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { ChipEstado, ChipPago, ETIQUETA_ESTADO } from '@/components/ChipsOrden';
import { EstadoError, EstadoVacio, PantallaCargando, Spinner } from '@/components/Estados';
import { useToast } from '@/components/Toaster';
import { useAuth } from '@/auth/AuthProvider';
import { useAnularOrden, useCambiarEstadoOrden, useOrden } from '@/hooks/useOrdenes';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { mensajeDeError } from '@/lib/supabase';
import {
  fecha,
  fechaHora,
  hora,
  linkWhatsapp,
  moneda,
  telefono as formatearTelefono,
} from '@/lib/format';
import type { EstadoOrden, MetodoPago, OrdenCompleta } from '@/types/database';

/** Estados que se cambian con el selector. Entregar va por el cobro (etapa 7). */
const ESTADOS_MANUALES: EstadoOrden[] = ['recibido', 'en_proceso', 'listo'];

const NOMBRE_METODO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
  mercado_pago: 'Mercado Pago',
};

export default function OrdenDetalle() {
  const { ref } = useParams<{ ref: string }>();
  const { esAdmin } = useAuth();
  const toast = useToast();

  const { data: orden, isPending, error, refetch } = useOrden(ref);
  const { data: config } = useConfiguracion();
  const cambiarEstado = useCambiarEstadoOrden();
  const [anularAbierto, setAnularAbierto] = useState(false);

  if (isPending) return <PantallaCargando texto="Cargando orden…" />;

  if (error) {
    return <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />;
  }

  if (!orden) {
    return (
      <EstadoVacio
        titulo={`No existe la orden ${ref}`}
        detalle="Revisá la referencia del ticket. Se escribe como EP-00001."
        accion={
          <Link to="/" className="btn-primary">
            Ir al tablero
          </Link>
        }
      />
    );
  }

  const cerrada = orden.estado === 'entregado' || orden.estado === 'anulado';
  const saldo = Number(orden.saldo);

  const mensajeWhatsapp = armarMensaje(orden, config?.nombre_negocio);
  const whatsapp = linkWhatsapp(orden.cliente.telefono, mensajeWhatsapp);

  const cambiar = async (estado: EstadoOrden) => {
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado });
      toast.ok(`Orden ${orden.ref}: ${ETIQUETA_ESTADO[estado].toLowerCase()}.`);
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  };

  return (
    <>
      <EncabezadoPagina
        titulo={`Orden ${orden.ref}`}
        detalle={`Ingresó el ${fechaHora(orden.fecha_ingreso)}`}
        acciones={
          <>
            <button type="button" className="btn-secondary" disabled title="Se agrega en la etapa 6">
              Reimprimir
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled
              title="Se agrega en la etapa 7"
            >
              Cobrar y entregar
            </button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <ChipEstado estado={orden.estado} />
        {orden.estado !== 'anulado' && <ChipPago estado={orden.estado_pago} />}
        {saldo > 0 && orden.estado !== 'anulado' && (
          <span className="text-sm text-slate-600">
            Saldo pendiente <span className="tabular font-semibold text-alerta">{moneda(saldo)}</span>
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr] lg:items-start">
        <div className="space-y-5">
          {/* ── Cliente ────────────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">Cliente</h2>
            <Link
              to={`/clientes/${orden.cliente.id}`}
              className="mt-2 block font-display text-lg font-bold text-brand-800 hover:underline"
            >
              {orden.cliente.nombre}
            </Link>
            <p className="tabular text-sm text-slate-600">
              {orden.cliente.telefono ? formatearTelefono(orden.cliente.telefono) : 'Sin teléfono'}
            </p>

            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-3 w-full"
              >
                Avisarle por WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Sin celular cargado: no se le puede escribir por WhatsApp.
              </p>
            )}
          </section>

          {/* ── Fechas y estado ────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">Fechas</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Dato etiqueta="Ingreso">{fechaHora(orden.fecha_ingreso)}</Dato>
              <Dato etiqueta="Retiro estimado">{fecha(orden.fecha_retiro_estimada)}</Dato>
              {orden.fecha_entrega_real && (
                <Dato etiqueta="Entregada">{fechaHora(orden.fecha_entrega_real)}</Dato>
              )}
            </dl>

            <div className="mt-4 border-t border-brand-100 pt-4">
              <label className="label" htmlFor="estado">
                Estado
              </label>
              {cerrada ? (
                <p className="text-sm text-slate-600">
                  La orden está {ETIQUETA_ESTADO[orden.estado].toLowerCase()} y ya no se modifica.
                </p>
              ) : (
                <>
                  <select
                    id="estado"
                    className="field"
                    value={orden.estado}
                    disabled={cambiarEstado.isPending}
                    onChange={(e) => void cambiar(e.target.value as EstadoOrden)}
                  >
                    {ESTADOS_MANUALES.map((e) => (
                      <option key={e} value={e}>
                        {ETIQUETA_ESTADO[e]}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Para entregarla, usá “Cobrar y entregar”: así queda registrado el pago.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* ── Notas ──────────────────────────────────────────────────── */}
          {orden.notas && (
            <section className="panel p-4">
              <h2 className="eyebrow">Notas</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{orden.notas}</p>
            </section>
          )}

          {esAdmin && orden.estado !== 'anulado' && (
            <button type="button" className="btn-danger w-full" onClick={() => setAnularAbierto(true)}>
              Anular orden
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* ── Prendas ────────────────────────────────────────────────── */}
          <section className="panel">
            <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
              <h2 className="eyebrow">Prendas</h2>
              <span className="text-sm text-slate-600">{orden.cantidad_prendas} en total</span>
            </div>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-display font-semibold">Prenda</th>
                  <th className="w-20 px-2 py-2 text-center font-display font-semibold">Cant.</th>
                  <th className="w-28 px-2 py-2 text-right font-display font-semibold">Precio</th>
                  <th className="w-28 px-4 py-2 text-right font-display font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {orden.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2 text-ink">{i.descripcion}</td>
                    <td className="px-2 py-2 text-center tabular">{i.cantidad}</td>
                    <td className="px-2 py-2 text-right tabular text-slate-600">
                      {moneda(i.precio_unitario)}
                    </td>
                    <td className="px-4 py-2 text-right tabular font-semibold">
                      {moneda(i.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="border-t border-brand-100 px-4 py-3 text-sm">
              <div className="flex justify-between py-0.5">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="tabular">{moneda(orden.subtotal)}</dd>
              </div>
              {Number(orden.descuento) > 0 && (
                <div className="flex justify-between py-0.5">
                  <dt className="text-slate-600">Descuento</dt>
                  <dd className="tabular text-alerta">− {moneda(orden.descuento)}</dd>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between border-t-2 border-brand-800 pt-2">
                <dt className="font-display text-sm font-semibold uppercase tracking-technical text-brand-800">
                  Total
                </dt>
                <dd className="tabular font-display text-xl font-bold text-brand-900">
                  {moneda(orden.total)}
                </dd>
              </div>
            </dl>
          </section>

          {/* ── Pagos ──────────────────────────────────────────────────── */}
          <section className="panel">
            <div className="border-b border-brand-100 px-4 py-3">
              <h2 className="eyebrow">Pagos</h2>
            </div>

            {orden.pagos.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-600">
                Todavía no se cobró nada. Se abona al retirar.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-brand-100">
                  {orden.pagos.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 tabular text-slate-600">
                        {fecha(p.fecha)} {hora(p.fecha)}
                      </td>
                      <td className="px-2 py-2 text-slate-700">{NOMBRE_METODO[p.metodo]}</td>
                      <td className="px-4 py-2 text-right tabular font-semibold">
                        {moneda(p.monto)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-brand-50">
                    <td className="px-4 py-2 font-display font-semibold" colSpan={2}>
                      Pagado
                    </td>
                    <td className="px-4 py-2 text-right tabular font-semibold">
                      {moneda(orden.pagado)}
                    </td>
                  </tr>
                  {saldo > 0 && (
                    <tr>
                      <td className="px-4 py-2 font-display font-semibold text-alerta" colSpan={2}>
                        Saldo
                      </td>
                      <td className="px-4 py-2 text-right tabular font-semibold text-alerta">
                        {moneda(saldo)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>

      <ModalAnular orden={orden} abierto={anularAbierto} onCerrar={() => setAnularAbierto(false)} />

      <div className="mt-6">
        <Link to="/" className="text-sm text-brand-600 underline underline-offset-2">
          ← Volver al tablero
        </Link>
      </div>
    </>
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
  const saldo = Number(orden.saldo);

  if (orden.estado === 'listo') {
    const cobro = saldo > 0 ? ` Son ${moneda(saldo)}, se abonan al retirar.` : '';
    return `Hola ${nombre}, te escribimos de ${casa}. Tu pedido ${orden.ref} ya está pronto para retirar.${cobro} Te esperamos.`;
  }

  return `Hola ${nombre}, te escribimos de ${casa} por tu pedido ${orden.ref}.`;
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
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={`Anular la orden ${orden.ref}`} ancho="sm">
      <p className="text-sm leading-relaxed text-slate-700">
        La orden queda anulada y no se puede volver atrás. Sus prendas y totales dejan de contar en
        el historial del cliente.
        {Number(orden.pagado) > 0 && (
          <span className="mt-2 block text-aviso">
            Ojo: esta orden ya tiene {moneda(orden.pagado)} cobrados. El pago queda registrado en la
            caja del día en que se hizo.
          </span>
        )}
      </p>

      <div className="mt-4">
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
        <p className="mt-1 text-xs text-slate-500">Queda escrito en las notas de la orden.</p>
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
          className="field tabular"
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={!puedeAnular || anular.isPending}
          onClick={() => void confirmar()}
        >
          {anular.isPending && <Spinner size={16} />}
          Anular orden
        </button>
      </div>
    </Modal>
  );
}
