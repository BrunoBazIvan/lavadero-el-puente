import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { ChipEstado, ETIQUETA_ESTADO } from '@/components/ChipsOrden';
import { EstadoError, EstadoVacio, PantallaCargando, Spinner } from '@/components/Estados';
import { useToast } from '@/components/Toaster';
import { useAuth } from '@/auth/AuthProvider';
import { useAnularOrden, useCambiarEstadoOrden, useOrden } from '@/hooks/useOrdenes';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { useImprimir } from '@/hooks/useImprimir';
import { mensajeDeError } from '@/lib/supabase';
import { fecha, fechaHora, linkWhatsapp, telefono as formatearTelefono } from '@/lib/format';
import { NOMBRE_SERVICIO } from '@/types/database';
import type { EstadoOrden, OrdenCompleta } from '@/types/database';

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
  const [imprimiendo, setImprimiendo] = useState(false);

  if (isPending) return <PantallaCargando texto="Cargando orden…" />;

  if (error) {
    return <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />;
  }

  if (!orden) {
    return (
      <EstadoVacio
        titulo={`No existe la orden ${ref}`}
        detalle="Revisá la referencia del comprobante. Se escribe como EP-00001."
        accion={
          <Link to="/ordenes" className="btn-primary">
            Ver todas las órdenes
          </Link>
        }
      />
    );
  }

  const cerrada = orden.estado === 'entregado' || orden.estado === 'anulado';
  const whatsapp = linkWhatsapp(orden.cliente.telefono, armarMensaje(orden, config?.nombre_negocio));

  const cambiar = async (estado: EstadoOrden) => {
    try {
      await cambiarEstado.mutateAsync({ id: orden.id, estado });
      toast.ok(`Orden ${orden.ref}: ${ETIQUETA_ESTADO[estado].toLowerCase()}.`);
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
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
        titulo={`Orden ${orden.ref}`}
        detalle={`Ingresó el ${fechaHora(orden.fecha_ingreso)}`}
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
              {imprimiendo && <Spinner size={16} />}
              Reimprimir
            </button>
          </>
        }
      />

      <div className="mb-5">
        <ChipEstado estado={orden.estado} />
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
              )}
            </div>
          </section>

          {esAdmin && orden.estado !== 'anulado' && (
            <button
              type="button"
              className="btn-danger w-full"
              onClick={() => setAnularAbierto(true)}
            >
              Anular orden
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* ── Qué recibimos ──────────────────────────────────────────── */}
          <section className="panel">
            <div className="border-b border-brand-100 px-4 py-3">
              <h2 className="eyebrow">Recibimos</h2>
            </div>

            <ul className="divide-y divide-brand-100">
              {orden.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                  {i.cantidad > 1 && (
                    <span className="tabular font-display text-base font-bold text-brand-800">
                      {i.cantidad}
                    </span>
                  )}
                  <span className="text-ink">{i.descripcion}</span>
                </li>
              ))}
            </ul>

            <dl className="border-t border-brand-100 px-4 py-3 text-sm">
              <div className="flex justify-between py-0.5">
                <dt className="text-slate-600">Servicio</dt>
                <dd className="font-medium text-ink">{NOMBRE_SERVICIO[orden.servicio]}</dd>
              </div>
              <div className="flex justify-between py-0.5">
                <dt className="text-slate-600">Envío</dt>
                <dd className="font-medium text-ink">
                  {orden.envio ? 'Retiro y entrega' : 'Trae y retira el cliente'}
                </dd>
              </div>
            </dl>
          </section>

          {/* ── Notas ──────────────────────────────────────────────────── */}
          {orden.notas && (
            <section className="panel p-4">
              <h2 className="eyebrow">Notas</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{orden.notas}</p>
            </section>
          )}
        </div>
      </div>

      <ModalAnular orden={orden} abierto={anularAbierto} onCerrar={() => setAnularAbierto(false)} />

      <div className="mt-6">
        <Link to="/ordenes" className="text-sm text-brand-600 underline underline-offset-2">
          ← Volver a las órdenes
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

  if (orden.estado === 'listo') {
    return `Hola ${nombre}, te escribimos de ${casa}. Tu pedido ${orden.ref} ya está pronto para retirar. Te esperamos.`;
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
        La orden queda anulada y no se puede volver atrás. Deja de contar en el historial del
        cliente.
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
