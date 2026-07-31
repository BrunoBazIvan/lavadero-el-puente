import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { ClienteFormulario } from '@/components/ClienteFormulario';
import { ChipEstado } from '@/components/ChipsOrden';
import { BloqueCargando, EstadoError, EstadoVacio, PantallaCargando, Spinner } from '@/components/Estados';
import { useToast } from '@/components/Toaster';
import {
  TOPE_ORDENES,
  useCambiarActivoCliente,
  useCliente,
  useOrdenesDeCliente,
} from '@/hooks/useClientes';
import { mensajeDeError } from '@/lib/supabase';
import { fecha, linkWhatsapp, telefono as formatearTelefono } from '@/lib/format';
import { NOMBRE_SERVICIO } from '@/types/database';
import type { OrdenVista } from '@/types/database';

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [edicionAbierta, setEdicionAbierta] = useState(false);
  const [bajaAbierta, setBajaAbierta] = useState(false);

  const { data: cliente, isPending, error, refetch } = useCliente(id);
  const ordenes = useOrdenesDeCliente(id);
  const cambiarActivo = useCambiarActivoCliente();

  if (isPending) return <PantallaCargando texto="Cargando ficha…" />;

  if (error) {
    return <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />;
  }

  if (!cliente) {
    return (
      <EstadoVacio
        titulo="Este cliente no existe"
        detalle="Puede que lo hayan borrado o que el link esté mal."
        accion={
          <Link to="/clientes" className="btn-primary">
            Ver todos los clientes
          </Link>
        }
      />
    );
  }

  const whatsapp = linkWhatsapp(cliente.telefono);

  const alternarActivo = async () => {
    try {
      await cambiarActivo.mutateAsync({ id: cliente.id, activo: !cliente.activo });
      toast.ok(cliente.activo ? 'Cliente dado de baja.' : 'Cliente reactivado.');
      setBajaAbierta(false);
    } catch {
      // El error ya lo mostró el manejador global de React Query (App.tsx).
    }
  };

  return (
    <>
      <EncabezadoPagina
        titulo={cliente.nombre}
        detalle={
          cliente.tipo === 'empresa'
            ? `Empresa${cliente.razon_social ? ` · ${cliente.razon_social}` : ''}`
            : 'Particular'
        }
        acciones={
          <>
            <Link to={`/?cliente=${cliente.id}`} className="btn-primary">
              + Recibir ropa
            </Link>
            <button type="button" className="btn-secondary" onClick={() => setEdicionAbierta(true)}>
              Editar
            </button>
          </>
        }
      />

      {!cliente.activo && (
        <div className="mb-5 rounded-card border border-slate-300 bg-slate-50 px-4 py-3">
          <p className="font-display text-xs font-semibold uppercase tracking-technical text-slate-600">
            Dado de baja
          </p>
          <p className="mt-1 text-sm text-slate-700">
            No aparece en los listados ni en el buscador de órdenes nuevas. Su historial queda
            intacto.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-5">
          <section className="panel p-4">
            <h2 className="eyebrow">Contacto</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Dato etiqueta="Teléfono">
                {cliente.telefono ? (
                  <span className="tabular">{formatearTelefono(cliente.telefono)}</span>
                ) : (
                  <span className="text-slate-400">Sin teléfono</span>
                )}
              </Dato>
              <Dato etiqueta="Email">{cliente.email ?? <Vacio />}</Dato>
              <Dato etiqueta="Dirección">{cliente.direccion ?? <Vacio />}</Dato>
              {cliente.tipo === 'empresa' && <Dato etiqueta="RUT">{cliente.rut ?? <Vacio />}</Dato>}
              <Dato etiqueta="Cliente desde">{fecha(cliente.created_at)}</Dato>
            </dl>

            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-4 w-full"
              >
                Escribirle por WhatsApp
              </a>
            )}
          </section>

          {cliente.notas && (
            <section className="panel p-4">
              <h2 className="eyebrow">Notas</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{cliente.notas}</p>
            </section>
          )}

          <button
            type="button"
            className={cliente.activo ? 'btn-danger w-full' : 'btn-secondary w-full'}
            onClick={() => (cliente.activo ? setBajaAbierta(true) : void alternarActivo())}
            disabled={cambiarActivo.isPending}
          >
            {cambiarActivo.isPending && <Spinner size={16} />}
            {cliente.activo ? 'Dar de baja' : 'Reactivar cliente'}
          </button>
        </div>

        <HistorialOrdenes
          ordenes={ordenes.data}
          cargando={ordenes.isPending}
          error={ordenes.error}
          onReintentar={() => void ordenes.refetch()}
          clienteId={cliente.id}
        />
      </div>

      <Modal
        abierto={edicionAbierta}
        onCerrar={() => setEdicionAbierta(false)}
        titulo="Editar cliente"
      >
        <ClienteFormulario
          cliente={cliente}
          onCancelar={() => setEdicionAbierta(false)}
          onGuardado={() => setEdicionAbierta(false)}
        />
      </Modal>

      <Modal
        abierto={bajaAbierta}
        onCerrar={() => setBajaAbierta(false)}
        titulo="Dar de baja al cliente"
        ancho="sm"
      >
        <p className="text-sm leading-relaxed text-slate-700">
          <span className="font-semibold">{cliente.nombre}</span> deja de aparecer en los listados,
          pero no se borra: sus órdenes y su historial quedan como están. Lo podés reactivar cuando
          quieras.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setBajaAbierta(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => void alternarActivo()}
            disabled={cambiarActivo.isPending}
          >
            {cambiarActivo.isPending && <Spinner size={16} />}
            Dar de baja
          </button>
        </div>
      </Modal>

      <div className="mt-6">
        <Link to="/clientes" className="text-sm text-brand-600 underline underline-offset-2">
          ← Volver a clientes
        </Link>
      </div>
    </>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{etiqueta}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

function Vacio() {
  return <span className="text-slate-400">—</span>;
}

function HistorialOrdenes({
  ordenes,
  cargando,
  error,
  onReintentar,
  clienteId,
}: {
  ordenes: OrdenVista[] | undefined;
  cargando: boolean;
  error: unknown;
  onReintentar: () => void;
  clienteId: string;
}) {
  /** Las anuladas no cuentan: no llegaron a ser trabajo. */
  const resumen = useMemo(() => {
    const vivas = (ordenes ?? []).filter((o) => o.estado !== 'anulado');
    return {
      cantidad: vivas.length,
      // Vienen ordenadas de la más nueva a la más vieja.
      ultima: vivas[0]?.fecha_ingreso ?? null,
      sinRetirar: vivas.filter((o) => o.estado === 'listo').length,
    };
  }, [ordenes]);

  return (
    <section className="panel">
      <div className="border-b border-brand-100 px-4 py-3">
        <h2 className="eyebrow">Historial</h2>
      </div>

      {!cargando && !error && (
        // El gap de 1px sobre fondo azul dibuja los filetes: en una grilla,
        // `divide-y` le pone borde de más a la segunda celda de la fila.
        <dl className="grid grid-cols-3 gap-px border-b border-brand-100 bg-brand-100">
          <Metrica etiqueta="Órdenes" valor={String(resumen.cantidad)} />
          <Metrica etiqueta="Última vez" valor={resumen.ultima ? fecha(resumen.ultima) : '—'} />
          <Metrica
            etiqueta="Sin retirar"
            valor={String(resumen.sinRetirar)}
            alerta={resumen.sinRetirar > 0}
          />
        </dl>
      )}

      {cargando && <BloqueCargando texto="Cargando órdenes…" />}

      {error ? <EstadoError mensaje={mensajeDeError(error)} onReintentar={onReintentar} /> : null}

      {ordenes && ordenes.length === 0 && (
        <EstadoVacio
          titulo="Todavía no trajo ropa"
          detalle="Cuando cargues su primera orden, la vas a ver acá."
          accion={
            <Link to={`/?cliente=${clienteId}`} className="btn-primary">
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
                <th className="px-4 py-2 font-display font-semibold">Ingreso</th>
                <th className="px-4 py-2 font-display font-semibold">Servicio</th>
                <th className="px-4 py-2 font-display font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {ordenes.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-brand-50">
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/ordenes/${o.ref}`}
                      className="font-mono font-semibold text-brand-800 hover:underline"
                    >
                      {o.ref}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular text-slate-700">{fecha(o.fecha_ingreso)}</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {NOMBRE_SERVICIO[o.servicio]}
                    {o.envio && <span className="ml-1 text-xs text-brand-600">+ envío</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <ChipEstado estado={o.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {ordenes.length === TOPE_ORDENES && (
            <p className="border-t border-brand-100 px-4 py-2 text-xs text-slate-500">
              Se muestran las últimas {TOPE_ORDENES} órdenes. Los totales de arriba solo cuentan
              esas.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Metrica({
  etiqueta,
  valor,
  alerta = false,
}: {
  etiqueta: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="font-display text-[11px] font-semibold uppercase tracking-technical text-slate-500">
        {etiqueta}
      </dt>
      <dd
        className={`mt-0.5 tabular font-display text-lg font-bold ${alerta ? 'text-alerta' : 'text-brand-900'}`}
      >
        {valor}
      </dd>
    </div>
  );
}
