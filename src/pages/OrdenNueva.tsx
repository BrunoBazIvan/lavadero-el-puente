import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { BuscadorCliente } from '@/components/BuscadorCliente';
import { BloqueCargando, EstadoError, Spinner } from '@/components/Estados';
import { useToast } from '@/components/Toaster';
import { agruparPorCategoria, useArticulos } from '@/hooks/useArticulos';
import { useCliente } from '@/hooks/useClientes';
import { useCrearOrden } from '@/hooks/useOrdenes';
import { useDiasEntrega } from '@/hooks/useConfiguracion';
import { aValorInput, esDomingo, fechaRetiroEstimada, hoyInput } from '@/lib/fechas';
import { moneda, prendas as textoPrendas } from '@/lib/format';
import { mensajeDeError } from '@/lib/supabase';
import type { Articulo, Cliente } from '@/types/database';

interface Linea {
  clave: number;
  articulo_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export default function OrdenNueva() {
  const navigate = useNavigate();
  const toast = useToast();
  const [parametros] = useSearchParams();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const proximaClave = useRef(1);
  const diasEntrega = useDiasEntrega();
  const [fechaRetiro, setFechaRetiro] = useState('');
  const [fechaTocada, setFechaTocada] = useState(false);

  const articulos = useArticulos(false);
  const crear = useCrearOrden();

  // Cliente precargado al venir desde su ficha (/ordenes/nueva?cliente=…).
  const clientePrevio = useCliente(parametros.get('cliente') ?? undefined);
  useEffect(() => {
    if (clientePrevio.data && !cliente) setCliente(clientePrevio.data);
  }, [clientePrevio.data, cliente]);

  // La fecha por defecto depende de la configuración, que llega asincrónica.
  // Si la persona ya la tocó, no se la pisamos.
  useEffect(() => {
    if (!fechaTocada) setFechaRetiro(aValorInput(fechaRetiroEstimada(diasEntrega)));
  }, [diasEntrega, fechaTocada]);

  const grupos = useMemo(() => agruparPorCategoria(articulos.data ?? []), [articulos.data]);

  const subtotal = lineas.reduce((suma, l) => suma + l.cantidad * l.precio_unitario, 0);
  const total = Math.max(0, subtotal - descuento);
  const cantidadPrendas = lineas.reduce((suma, l) => suma + l.cantidad, 0);

  /** Tocar un artículo suma una unidad; tocarlo de nuevo suma otra. */
  const agregarArticulo = (articulo: Articulo) => {
    setLineas((actuales) => {
      const existente = actuales.find((l) => l.articulo_id === articulo.id);
      if (existente) {
        return actuales.map((l) =>
          l === existente ? { ...l, cantidad: l.cantidad + 1 } : l,
        );
      }
      return [
        ...actuales,
        {
          clave: proximaClave.current++,
          articulo_id: articulo.id,
          descripcion: articulo.nombre,
          cantidad: 1,
          precio_unitario: Number(articulo.precio_unitario),
        },
      ];
    });
  };

  const agregarLibre = () => {
    const clave = proximaClave.current++;
    setLineas((actuales) => [
      ...actuales,
      { clave, articulo_id: null, descripcion: '', cantidad: 1, precio_unitario: 0 },
    ]);
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>(`#descripcion-${clave}`)?.focus();
    }, 0);
  };

  const cambiar = (clave: number, cambios: Partial<Linea>) =>
    setLineas((actuales) => actuales.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)));

  const quitar = (clave: number) =>
    setLineas((actuales) => actuales.filter((l) => l.clave !== clave));

  /* ── Validación ─────────────────────────────────────────────────────────── */

  const faltaDescripcion = lineas.some((l) => !l.descripcion.trim());
  const problemas: string[] = [];
  if (!cliente) problemas.push('Elegí un cliente.');
  if (lineas.length === 0) problemas.push('Agregá al menos una prenda.');
  if (faltaDescripcion) problemas.push('Hay un ítem libre sin descripción.');
  if (!fechaRetiro) problemas.push('Poné la fecha de retiro estimada.');
  if (descuento > subtotal) problemas.push('El descuento no puede superar el subtotal.');

  const guardar = async () => {
    setIntentoGuardar(true);
    if (problemas.length > 0 || !cliente) return;

    try {
      const orden = await crear.mutateAsync({
        cliente_id: cliente.id,
        fecha_retiro_estimada: fechaRetiro,
        descuento,
        notas: notas.trim() || null,
        items: lineas.map((l) => ({
          articulo_id: l.articulo_id,
          descripcion: l.descripcion.trim(),
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
        })),
      });

      toast.ok(`Orden ${orden.ref} guardada.`);
      // TODO (etapa 6): acá se disparan las dos impresiones antes de navegar.
      navigate(`/ordenes/${orden.ref}`);
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  };

  return (
    <>
      <EncabezadoPagina titulo="Orden nueva" />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-5">
          {/* ── 1. Cliente ─────────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow mb-3">1 · Cliente</h2>
            <BuscadorCliente seleccionado={cliente} onSeleccionar={setCliente} />
            {intentoGuardar && !cliente && (
              <p className="error-text">Elegí un cliente o dalo de alta.</p>
            )}
          </section>

          {/* ── 2. Prendas ─────────────────────────────────────────────── */}
          <section className="panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="eyebrow">2 · Prendas</h2>
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={agregarLibre}>
                + Ítem libre
              </button>
            </div>

            {articulos.isPending && <BloqueCargando texto="Cargando lista de precios…" />}

            {articulos.error ? (
              <EstadoError
                mensaje={mensajeDeError(articulos.error)}
                onReintentar={() => void articulos.refetch()}
              />
            ) : null}

            {/* La grilla scrollea sola para que el detalle de lo cargado no se
                vaya abajo de la pantalla: hay que ver lo que se está sumando. */}
            <div className="max-h-[46vh] overflow-y-auto pr-1">
              {grupos.map(([categoria, items]) => (
              <div key={categoria} className="mb-4 last:mb-0">
                <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-technical text-slate-500">
                  {categoria}
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
                  {items.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => agregarArticulo(a)}
                      className="flex flex-col items-start rounded-sharp border border-brand-200 bg-white px-3 py-2 text-left transition-colors hover:border-brand-500 hover:bg-brand-50"
                    >
                      <span className="font-display text-sm font-semibold leading-tight text-ink">
                        {a.nombre}
                      </span>
                      <span
                        className={`mt-0.5 tabular text-xs ${
                          Number(a.precio_unitario) === 0 ? 'text-aviso' : 'text-slate-500'
                        }`}
                      >
                        {Number(a.precio_unitario) === 0 ? 'sin precio' : moneda(a.precio_unitario)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              ))}
            </div>
          </section>

          {/* ── Detalle cargado ────────────────────────────────────────── */}
          <section className="panel">
            <div className="border-b border-brand-100 px-4 py-3">
              <h2 className="eyebrow">Detalle</h2>
            </div>

            {lineas.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                Tocá una prenda de arriba para empezar a cargar.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2 font-display font-semibold">Prenda</th>
                    <th className="w-28 px-2 py-2 text-center font-display font-semibold">Cant.</th>
                    <th className="w-28 px-2 py-2 text-right font-display font-semibold">Precio</th>
                    <th className="w-28 px-4 py-2 text-right font-display font-semibold">Subtotal</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {lineas.map((l) => (
                    <tr key={l.clave}>
                      <td className="px-4 py-2">
                        {l.articulo_id ? (
                          <span className="font-medium text-ink">{l.descripcion}</span>
                        ) : (
                          <input
                            id={`descripcion-${l.clave}`}
                            value={l.descripcion}
                            onChange={(e) => cambiar(l.clave, { descripcion: e.target.value })}
                            placeholder="Descripción del ítem"
                            aria-label="Descripción del ítem libre"
                            className={`w-full rounded-sharp border bg-white px-2 py-1 text-sm ${
                              intentoGuardar && !l.descripcion.trim()
                                ? 'border-alerta'
                                : 'border-brand-200'
                            }`}
                          />
                        )}
                      </td>

                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            aria-label={`Quitar una unidad de ${l.descripcion || 'el ítem'}`}
                            className="h-7 w-7 rounded-sharp border border-brand-200 font-bold text-brand-700 hover:bg-brand-50"
                            onClick={() =>
                              l.cantidad > 1
                                ? cambiar(l.clave, { cantidad: l.cantidad - 1 })
                                : quitar(l.clave)
                            }
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={l.cantidad}
                            onChange={(e) =>
                              cambiar(l.clave, { cantidad: Math.max(1, Number(e.target.value) || 1) })
                            }
                            aria-label={`Cantidad de ${l.descripcion || 'el ítem'}`}
                            className="w-12 rounded-sharp border border-brand-200 px-1 py-1 text-center tabular text-sm"
                          />
                          <button
                            type="button"
                            aria-label={`Sumar una unidad de ${l.descripcion || 'el ítem'}`}
                            className="h-7 w-7 rounded-sharp border border-brand-200 font-bold text-brand-700 hover:bg-brand-50"
                            onClick={() => cambiar(l.clave, { cantidad: l.cantidad + 1 })}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={l.precio_unitario}
                          onChange={(e) =>
                            cambiar(l.clave, {
                              precio_unitario: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          aria-label={`Precio de ${l.descripcion || 'el ítem'}`}
                          className="w-24 rounded-sharp border border-brand-200 px-2 py-1 text-right tabular text-sm"
                        />
                      </td>

                      <td className="px-4 py-2 text-right tabular font-semibold text-ink">
                        {moneda(l.cantidad * l.precio_unitario)}
                      </td>

                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => quitar(l.clave)}
                          aria-label={`Sacar ${l.descripcion || 'el ítem'} de la orden`}
                          className="rounded-sharp px-2 py-1 text-lg leading-none text-slate-500 hover:bg-red-50 hover:text-alerta"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* ── 4. Notas ───────────────────────────────────────────────── */}
          <section className="panel p-4">
            <label className="label" htmlFor="notas">
              4 · Notas
            </label>
            <textarea
              id="notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Manchas, prendas delicadas, instrucciones especiales…"
              className="field resize-y"
            />
          </section>
        </div>

        {/* ── Panel de totales ─────────────────────────────────────────── */}
        <aside className="panel sticky top-20 p-4">
          <h2 className="eyebrow">3 · Retiro y total</h2>

          <div className="mt-3">
            <label className="label" htmlFor="fecha-retiro">
              Retiro estimado
            </label>
            <input
              id="fecha-retiro"
              type="date"
              min={hoyInput()}
              value={fechaRetiro}
              onChange={(e) => {
                setFechaTocada(true);
                setFechaRetiro(e.target.value);
              }}
              className="field tabular"
            />
            {fechaRetiro && esDomingo(fechaRetiro) && (
              <p className="mt-1 text-sm text-aviso">Ese día es domingo y el lavadero está cerrado.</p>
            )}
          </div>

          <dl className="mt-5 space-y-2 border-t border-brand-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Prendas</dt>
              <dd className="tabular text-ink">{cantidadPrendas}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Subtotal</dt>
              <dd className="tabular text-ink">{moneda(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-600">
                <label htmlFor="descuento">Descuento</label>
              </dt>
              <dd>
                <input
                  id="descuento"
                  type="number"
                  min="0"
                  step="1"
                  value={descuento}
                  onChange={(e) => setDescuento(Math.max(0, Number(e.target.value) || 0))}
                  className={`w-24 rounded-sharp border px-2 py-1 text-right tabular text-sm ${
                    descuento > subtotal ? 'border-alerta' : 'border-brand-200'
                  }`}
                />
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t-2 border-brand-800 pt-3">
            <span className="font-display text-sm font-semibold uppercase tracking-technical text-brand-800">
              Total
            </span>
            <span className="tabular font-display text-2xl font-bold text-brand-900">
              {moneda(total)}
            </span>
          </div>
          <p className="mt-1 text-right text-xs text-slate-500">Se cobra al retirar.</p>

          {intentoGuardar && problemas.length > 0 && (
            <ul className="mt-4 space-y-1 rounded-card border border-alerta/50 bg-white px-3 py-2">
              {problemas.map((p) => (
                <li key={p} className="text-sm text-alerta">
                  {p}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => void guardar()}
            disabled={crear.isPending}
            className="btn-primary btn-lg mt-4 w-full"
          >
            {crear.isPending && <Spinner size={16} />}
            {crear.isPending ? 'Guardando…' : 'Guardar orden'}
          </button>

          <p className="mt-2 text-center text-xs text-slate-500">
            {textoPrendas(cantidadPrendas)} · la referencia la genera el sistema
          </p>
        </aside>
      </div>
    </>
  );
}
