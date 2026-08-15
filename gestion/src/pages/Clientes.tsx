import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { ClienteFormulario } from '@/components/ClienteFormulario';
import { BloqueCargando, EstadoError, EstadoVacio } from '@/components/Estados';
import { IconoBuscar, IconoMas } from '@/components/Iconos';
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
        detalle="Buscá por nombre o por los últimos números del teléfono."
        acciones={
          <button
            type="button"
            className="btn-primary btn-lg"
            onClick={() => setAltaAbierta(true)}
          >
            <IconoMas size={19} />
            Cliente nuevo
          </button>
        }
      />

      <div className="panel">
        <div className="flex flex-wrap items-center gap-4 border-b border-brand-100 px-4 py-4">
          <div className="relative min-w-[18rem] flex-1">
            <label className="sr-only" htmlFor="buscar-cliente">
              Buscar cliente
            </label>
            <IconoBuscar
              size={22}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="buscar-cliente"
              type="search"
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o teléfono…"
              className="field h-14 pl-12 text-lg"
            />
          </div>

          <label className="flex select-none items-center gap-2.5 text-[0.9375rem] text-slate-700">
            <input
              type="checkbox"
              className="casilla"
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
                <IconoMas size={19} />
                Cliente nuevo
              </button>
            }
          />
        )}

        {clientes && clientes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="encabezado-tabla">
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Dirección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {clientes.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)} className="fila">
                    <td className="celda">
                      <Link
                        to={`/clientes/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-display text-[1.0625rem] font-semibold text-brand-800 hover:underline"
                      >
                        {c.nombre}
                      </Link>
                      {!c.activo && (
                        <span className="ml-2 chip border-slate-300 bg-slate-100 text-slate-600">
                          Baja
                        </span>
                      )}
                      {c.razon_social && (
                        <span className="block text-sm text-slate-500">{c.razon_social}</span>
                      )}
                    </td>
                    <td className="celda tabular text-slate-700">
                      {c.telefono ? formatearTelefono(c.telefono) : '—'}
                    </td>
                    <td className="celda text-slate-700">
                      {c.tipo === 'empresa' ? 'Empresa' : 'Particular'}
                    </td>
                    <td className="celda text-slate-600">{c.direccion ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {clientes.length === 200 && (
              <p className="border-t border-brand-100 px-4 py-2.5 text-sm text-slate-500">
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
