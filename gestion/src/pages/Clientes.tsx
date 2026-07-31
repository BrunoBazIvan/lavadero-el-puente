import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { ClienteFormulario } from '@/components/ClienteFormulario';
import { BloqueCargando, EstadoError, EstadoVacio } from '@/components/Estados';
import { useClientes } from '@/hooks/useClientes';
import { useDebounce } from '@/hooks/useDebounce';
import { mensajeDeError } from '@/lib/supabase';
import { telefono as formatearTelefono } from '@/lib/format';

export default function Clientes() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [altaAbierta, setAltaAbierta] = useState(false);

  const busquedaDemorada = useDebounce(busqueda, 300);
  const { data: clientes, isPending, error, refetch } = useClientes(busquedaDemorada, incluirInactivos);

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        acciones={
          <button type="button" className="btn-primary" onClick={() => setAltaAbierta(true)}>
            + Cliente nuevo
          </button>
        }
      />

      <div className="panel">
        <div className="flex flex-wrap items-center gap-4 border-b border-brand-100 px-4 py-3">
          <div className="min-w-[16rem] flex-1">
            <label className="sr-only" htmlFor="buscar-cliente">
              Buscar cliente
            </label>
            <input
              id="buscar-cliente"
              type="search"
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              className="field"
            />
          </div>

          <label className="flex select-none items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-sharp border-brand-300 text-brand-800 focus:ring-aqua-500"
              checked={incluirInactivos}
              onChange={(e) => setIncluirInactivos(e.target.checked)}
            />
            Mostrar dados de baja
          </label>
        </div>

        {isPending && <BloqueCargando texto="Buscando clientes…" />}

        {error && <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />}

        {clientes && clientes.length === 0 && (
          <EstadoVacio
            titulo={busquedaDemorada ? 'Ningún cliente coincide' : 'Todavía no hay clientes'}
            detalle={
              busquedaDemorada
                ? 'Probá con parte del nombre o con los últimos números del teléfono.'
                : 'Los clientes se van cargando solos a medida que entran órdenes, o los podés dar de alta acá.'
            }
            accion={
              <button type="button" className="btn-primary" onClick={() => setAltaAbierta(true)}>
                + Cliente nuevo
              </button>
            }
          />
        )}

        {clientes && clientes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-display font-semibold">Nombre</th>
                  <th className="px-4 py-2 font-display font-semibold">Teléfono</th>
                  <th className="px-4 py-2 font-display font-semibold">Tipo</th>
                  <th className="px-4 py-2 font-display font-semibold">Dirección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {clientes.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clientes/${c.id}`)}
                    className="cursor-pointer transition-colors hover:bg-brand-50"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/clientes/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-brand-800 hover:underline"
                      >
                        {c.nombre}
                      </Link>
                      {!c.activo && (
                        <span className="ml-2 chip border-slate-300 bg-slate-100 text-slate-600">
                          Baja
                        </span>
                      )}
                      {c.razon_social && (
                        <span className="ml-2 text-xs text-slate-500">{c.razon_social}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 tabular text-slate-700">
                      {c.telefono ? formatearTelefono(c.telefono) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {c.tipo === 'empresa' ? 'Empresa' : 'Particular'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{c.direccion ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {clientes.length === 200 && (
              <p className="border-t border-brand-100 px-4 py-2 text-xs text-slate-500">
                Se muestran los primeros 200. Afiná la búsqueda para ver el resto.
              </p>
            )}
          </div>
        )}
      </div>

      <Modal
        abierto={altaAbierta}
        onCerrar={() => setAltaAbierta(false)}
        titulo="Cliente nuevo"
        detalle="Con el nombre alcanza para empezar."
      >
        <ClienteFormulario
          nombreInicial={busqueda}
          onCancelar={() => setAltaAbierta(false)}
          onGuardado={(cliente) => {
            setAltaAbierta(false);
            navigate(`/clientes/${cliente.id}`);
          }}
        />
      </Modal>
    </>
  );
}
