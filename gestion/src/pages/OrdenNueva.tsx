import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BuscadorCliente } from '@/components/BuscadorCliente';
import { BloqueCargando, EstadoError, Spinner } from '@/components/Estados';
import { useToast } from '@/components/Toaster';
import { useArticulos } from '@/hooks/useArticulos';
import { useCliente } from '@/hooks/useClientes';
import { useCrearOrden, traerOrdenCompleta } from '@/hooks/useOrdenes';
import { useDiasEntrega } from '@/hooks/useConfiguracion';
import { useImprimir } from '@/hooks/useImprimir';
import { aValorInput, esDomingo, fechaRetiroEstimada, hoyInput } from '@/lib/fechas';
import { mensajeDeError } from '@/lib/supabase';
import { NOMBRE_SERVICIO } from '@/types/database';
import type { Articulo, Cliente, ServicioOrden } from '@/types/database';

/** Cuánto hay de cada cosa. Los que no se cuentan valen 1 o no están. */
type Recibido = Record<string, number>;

export default function OrdenNueva() {
  const navigate = useNavigate();
  const toast = useToast();
  const [parametros] = useSearchParams();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [recibido, setRecibido] = useState<Recibido>({});
  const [servicio, setServicio] = useState<ServicioOrden>('lavado_secado');
  const [envio, setEnvio] = useState(false);
  const [notas, setNotas] = useState('');
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const diasEntrega = useDiasEntrega();
  const [fechaRetiro, setFechaRetiro] = useState('');
  const [fechaTocada, setFechaTocada] = useState(false);

  const articulos = useArticulos(false);
  const crear = useCrearOrden();
  const { imprimir } = useImprimir();

  // Cliente precargado al venir desde su ficha (/?cliente=…).
  const clientePrevio = useCliente(parametros.get('cliente') ?? undefined);
  useEffect(() => {
    if (clientePrevio.data && !cliente) setCliente(clientePrevio.data);
  }, [clientePrevio.data, cliente]);

  // La fecha por defecto depende de la configuración, que llega asincrónica.
  // Si ya la tocaron, no se la pisamos.
  useEffect(() => {
    if (!fechaTocada) setFechaRetiro(aValorInput(fechaRetiroEstimada(diasEntrega)));
  }, [diasEntrega, fechaTocada]);

  const lista = articulos.data ?? [];
  const seleccionados = lista.filter((a) => (recibido[a.id] ?? 0) > 0);

  const marcar = (a: Articulo) =>
    setRecibido((actual) => {
      const cantidad = actual[a.id] ?? 0;
      if (!a.lleva_cantidad) {
        // Se marca y se desmarca: la ropa suelta no se cuenta.
        const { [a.id]: _quitado, ...resto } = actual;
        return cantidad > 0 ? resto : { ...actual, [a.id]: 1 };
      }
      return { ...actual, [a.id]: cantidad + 1 };
    });

  /** Fija la cantidad exacta (lo que se escribe a mano en el campo). */
  const fijarCantidad = (a: Articulo, cantidad: number) =>
    setRecibido((actual) => {
      if (cantidad <= 0) {
        const { [a.id]: _quitado, ...resto } = actual;
        return resto;
      }
      return { ...actual, [a.id]: cantidad };
    });

  /**
   * Suma o resta sobre lo que haya en ese momento.
   *
   * Va con función y no con `cantidad + 1` del render: dos toques rápidos al
   * `+` leerían el mismo valor viejo y sumarían uno solo.
   */
  const sumar = (a: Articulo, delta: number) =>
    setRecibido((actual) => {
      const nueva = (actual[a.id] ?? 0) + delta;
      if (nueva <= 0) {
        const { [a.id]: _quitado, ...resto } = actual;
        return resto;
      }
      return { ...actual, [a.id]: nueva };
    });

  const problemas: string[] = [];
  if (!cliente) problemas.push('Elegí un cliente.');
  if (seleccionados.length === 0) problemas.push('Marcá qué estás recibiendo.');
  if (!fechaRetiro) problemas.push('Poné la fecha de retiro estimada.');

  const guardar = async () => {
    setIntentoGuardar(true);
    if (problemas.length > 0 || !cliente) return;

    let orden;
    try {
      orden = await crear.mutateAsync({
        cliente_id: cliente.id,
        fecha_retiro_estimada: fechaRetiro,
        servicio,
        envio,
        notas: notas.trim() || null,
        items: seleccionados.map((a) => ({
          articulo_id: a.id,
          descripcion: a.nombre,
          cantidad: recibido[a.id],
        })),
      });

    } catch {
      // El toast lo muestra el manejador global de React Query.
      return;
    }

    toast.ok(`Orden ${orden.ref} guardada.`);

    // El comprobante sale solo: es el papel que se lleva el cliente.
    //
    // Va en su propio try: si algo falla ACÁ, la orden ya existe, y dejar a la
    // persona en el formulario sin explicación es peor que no imprimir. Pase lo
    // que pase, se abre el detalle, desde donde se puede reimprimir.
    try {
      // No se espera a que la impresión termine: `window.print()` bloquea hasta
      // que se cierra el diálogo. Navegar no la corta, porque el iframe cuelga
      // del body, fuera del árbol de React.
      const completa = await traerOrdenCompleta(orden.ref);
      if (completa) void imprimir(completa);
    } catch {
      toast.aviso(`La orden ${orden.ref} se guardó, pero no salió el comprobante. Reimprimilo desde el detalle.`);
    }

    navigate(`/ordenes/${orden.ref}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 font-display text-2xl font-bold text-brand-900">Recibir ropa</h1>

      <div className="space-y-4">
        {/* ── 1. Cliente ─────────────────────────────────────────────────── */}
        <section className="panel p-4">
          <h2 className="eyebrow mb-3">1 · Cliente</h2>
          <BuscadorCliente seleccionado={cliente} onSeleccionar={setCliente} />
          {intentoGuardar && !cliente && (
            <p className="error-text">Elegí un cliente o dalo de alta.</p>
          )}
        </section>

        {/* ── 2. Qué recibimos ───────────────────────────────────────────── */}
        <section className="panel p-4">
          <h2 className="eyebrow mb-3">2 · Qué recibimos</h2>

          {articulos.isPending && <BloqueCargando texto="Cargando opciones…" />}

          {articulos.error ? (
            <EstadoError
              mensaje={mensajeDeError(articulos.error)}
              onReintentar={() => void articulos.refetch()}
            />
          ) : null}

          <div className="grid gap-2 sm:grid-cols-3">
            {lista.map((a) => {
              const cantidad = recibido[a.id] ?? 0;
              const activo = cantidad > 0;

              return (
                <div
                  key={a.id}
                  className={`rounded-card border p-3 transition-colors ${
                    activo ? 'border-brand-800 bg-brand-50' : 'border-brand-200 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => marcar(a)}
                    aria-pressed={activo}
                    className="w-full text-left"
                  >
                    <span className="font-display text-base font-semibold leading-tight text-ink">
                      {a.nombre}
                    </span>
                    {!a.lleva_cantidad && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {activo ? 'Marcada' : 'Tocá para marcar'}
                      </span>
                    )}
                  </button>

                  {a.lleva_cantidad && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sumar(a, -1)}
                        disabled={cantidad === 0}
                        aria-label={`Quitar un ${a.nombre}`}
                        className="h-9 w-9 rounded-sharp border border-brand-200 bg-white font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={cantidad}
                        onChange={(e) => fijarCantidad(a, Number(e.target.value) || 0)}
                        aria-label={`Cantidad de ${a.nombre}`}
                        className="w-14 rounded-sharp border border-brand-200 px-2 py-1.5 text-center tabular"
                      />
                      <button
                        type="button"
                        onClick={() => sumar(a, 1)}
                        aria-label={`Sumar un ${a.nombre}`}
                        className="h-9 w-9 rounded-sharp border border-brand-200 bg-white font-bold text-brand-700 hover:bg-brand-50"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {intentoGuardar && seleccionados.length === 0 && (
            <p className="error-text">Marcá al menos una cosa.</p>
          )}
        </section>

        {/* ── 3. Servicio ────────────────────────────────────────────────── */}
        <section className="panel p-4">
          <h2 className="eyebrow mb-3">3 · Servicio</h2>

          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(NOMBRE_SERVICIO) as ServicioOrden[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setServicio(s)}
                aria-pressed={servicio === s}
                className={`rounded-card border px-4 py-3 text-left font-display text-base font-semibold transition-colors ${
                  servicio === s
                    ? 'border-brand-800 bg-brand-800 text-white'
                    : 'border-brand-200 bg-white text-ink hover:bg-brand-50'
                }`}
              >
                {NOMBRE_SERVICIO[s]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setEnvio((v) => !v)}
            aria-pressed={envio}
            className={`mt-2 w-full rounded-card border px-4 py-3 text-left font-display text-base font-semibold transition-colors ${
              envio
                ? 'border-brand-800 bg-brand-50 text-brand-900'
                : 'border-dashed border-brand-300 bg-white text-brand-700 hover:bg-brand-50'
            }`}
          >
            {envio ? '✓ Con envío · retiro y entrega' : '+ Envío (retiro y entrega)'}
          </button>
        </section>

        {/* ── 4. Retiro ──────────────────────────────────────────────────── */}
        <section className="panel p-4">
          <label className="label" htmlFor="fecha-retiro">
            4 · Retiro estimado
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
            className="field tabular sm:max-w-xs"
          />
          {fechaRetiro && esDomingo(fechaRetiro) && (
            <p className="mt-1 text-sm text-aviso">Ese día es domingo y el lavadero está cerrado.</p>
          )}
        </section>

        {/* ── 5. Notas ───────────────────────────────────────────────────── */}
        <section className="panel p-4">
          <label className="label" htmlFor="notas">
            5 · Notas
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

        {intentoGuardar && problemas.length > 0 && (
          <ul className="rounded-card border border-alerta/50 bg-white px-4 py-3">
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
          className="btn-primary btn-lg w-full"
        >
          {crear.isPending && <Spinner size={16} />}
          {crear.isPending ? 'Guardando…' : 'Guardar e imprimir comprobante'}
        </button>
      </div>
    </div>
  );
}
