import { useRef, useState } from 'react';
import { Modal } from '@/components/Modal';
import { ClienteFormulario } from '@/components/ClienteFormulario';
import { Spinner } from '@/components/Estados';
import { useClientes } from '@/hooks/useClientes';
import { useDebounce } from '@/hooks/useDebounce';
import { telefono as formatearTelefono } from '@/lib/format';
import type { Cliente } from '@/types/database';

/**
 * Buscador de cliente con alta al vuelo.
 *
 * Es lo primero que se toca con alguien esperando del otro lado del mostrador,
 * así que: foco automático, flechas y Enter para elegir, y si el cliente no
 * existe se crea sin salir de la pantalla (solo nombre y teléfono).
 */
export function BuscadorCliente({
  seleccionado,
  onSeleccionar,
}: {
  seleccionado: Cliente | null;
  onSeleccionar: (cliente: Cliente | null) => void;
}) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const [altaAbierta, setAltaAbierta] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  const busqueda = useDebounce(texto, 250);
  const { data: clientes, isFetching } = useClientes(busqueda);
  const resultados = busqueda.trim().length >= 2 ? (clientes ?? []) : [];

  const elegir = (cliente: Cliente) => {
    onSeleccionar(cliente);
    setTexto('');
    setAbierto(false);
  };

  const alTeclado = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setResaltado((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setResaltado((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const elegido = resultados[resaltado];
      if (elegido) elegir(elegido);
      else if (texto.trim().length >= 2) setAltaAbierta(true);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  if (seleccionado) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-card border border-brand-200 bg-brand-50 px-4 py-3">
        <div>
          <p className="font-display text-base font-bold text-brand-900">{seleccionado.nombre}</p>
          <p className="text-sm text-slate-600">
            {seleccionado.telefono ? formatearTelefono(seleccionado.telefono) : 'Sin teléfono'}
            {seleccionado.tipo === 'empresa' ? ' · Empresa' : ''}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            onSeleccionar(null);
            setTexto('');
            window.setTimeout(() => campo.current?.focus(), 0);
          }}
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={campo}
        type="search"
        autoFocus
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
          setResaltado(0);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alTeclado}
        placeholder="Buscar por nombre o teléfono…"
        aria-label="Buscar cliente"
        id="buscador-cliente"
        className="field text-lg"
      />

      {abierto && busqueda.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-card border border-brand-200 bg-white shadow-modal">
          {isFetching && resultados.length === 0 && (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Spinner size={14} /> Buscando…
            </p>
          )}

          {resultados.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onMouseEnter={() => setResaltado(i)}
              onClick={() => elegir(c)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                i === resaltado ? 'bg-brand-50' : 'bg-white'
              }`}
            >
              <span className="font-medium text-ink">{c.nombre}</span>
              <span className="tabular text-sm text-slate-500">
                {c.telefono ? formatearTelefono(c.telefono) : '—'}
              </span>
            </button>
          ))}

          {!isFetching && resultados.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-600">Ningún cliente con ese dato.</p>
          )}

          <button
            type="button"
            onClick={() => setAltaAbierta(true)}
            className="w-full border-t border-brand-100 bg-white px-4 py-2.5 text-left font-display text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            + Dar de alta a “{texto.trim()}”
          </button>
        </div>
      )}

      <Modal
        abierto={altaAbierta}
        onCerrar={() => setAltaAbierta(false)}
        titulo="Cliente nuevo"
        detalle="Con el nombre alcanza. El resto se completa después."
        ancho="sm"
      >
        <ClienteFormulario
          compacto
          nombreInicial={texto.trim()}
          onCancelar={() => setAltaAbierta(false)}
          onGuardado={(cliente) => {
            setAltaAbierta(false);
            elegir(cliente);
          }}
        />
      </Modal>
    </div>
  );
}
