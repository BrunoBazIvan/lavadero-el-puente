import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BuscadorCliente } from '@/components/BuscadorCliente';
import { BloqueCargando, EstadoError, Spinner } from '@/components/Estados';
import {
  IconoAlerta,
  IconoCheck,
  IconoImprimir,
  IconoMas,
  IconoMenos,
} from '@/components/Iconos';
import { useToast } from '@/components/Toaster';
import { useArticulos } from '@/hooks/useArticulos';
import { useCliente } from '@/hooks/useClientes';
import { useCrearOrden, traerOrdenCompleta } from '@/hooks/useOrdenes';
import { useDiasEntrega } from '@/hooks/useConfiguracion';
import { useImprimir } from '@/hooks/useImprimir';
import { aValorInput, esDomingo, fechaRetiroEstimada, hoyInput } from '@/lib/fechas';
import { fechaLarga } from '@/lib/format';
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
      toast.aviso(
        `La orden ${orden.ref} se guardó, pero no salió el comprobante. Reimprimilo desde el detalle.`,
      );
    }

    navigate(`/ordenes/${orden.ref}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold leading-tight text-brand-900">
        Recibir ropa
      </h1>
      <p className="mb-6 mt-1.5 text-[0.9375rem] text-slate-600">
        Se completa de arriba hacia abajo. Al guardar salen los dos comprobantes: el del cliente y
        la copia que va con la bolsa.
      </p>

      <div className="space-y-4">
        <Paso numero={1} titulo="¿De quién es la ropa?" completo={cliente !== null}>
          <BuscadorCliente seleccionado={cliente} onSeleccionar={setCliente} />
          {intentoGuardar && !cliente && (
            <p className="error-text">
              <IconoAlerta size={16} className="mt-0.5 shrink-0" />
              Elegí un cliente de la lista, o dalo de alta.
            </p>
          )}
        </Paso>

        <Paso
          numero={2}
          titulo="¿Qué estás recibiendo?"
          detalle="La ropa suelta se marca sin contar. Los acolchados llevan cantidad."
          completo={seleccionados.length > 0}
        >
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
                    activo ? 'border-brand-800 bg-brand-50' : 'border-brand-300 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => marcar(a)}
                    aria-pressed={activo}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    {!a.lleva_cantidad && (
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sharp border ${
                          activo
                            ? 'border-ok bg-ok text-white'
                            : 'border-brand-300 bg-white text-transparent'
                        }`}
                      >
                        <IconoCheck size={16} />
                      </span>
                    )}
                    <span className="font-display text-[1.0625rem] font-semibold leading-tight text-ink">
                      {a.nombre}
                    </span>
                  </button>

                  {a.lleva_cantidad && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sumar(a, -1)}
                        disabled={cantidad === 0}
                        aria-label={`Quitar un ${a.nombre}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sharp border border-brand-300 bg-white text-brand-800 transition-colors hover:bg-brand-50 disabled:opacity-40"
                      >
                        <IconoMenos size={20} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={cantidad}
                        onChange={(e) => fijarCantidad(a, Number(e.target.value) || 0)}
                        aria-label={`Cantidad de ${a.nombre}`}
                        className="field tabular h-11 w-full px-1 text-center text-xl font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => sumar(a, 1)}
                        aria-label={`Sumar un ${a.nombre}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sharp border border-brand-300 bg-white text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        <IconoMas size={20} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {intentoGuardar && seleccionados.length === 0 && (
            <p className="error-text">
              <IconoAlerta size={16} className="mt-0.5 shrink-0" />
              Marcá al menos una cosa de las de arriba.
            </p>
          )}
        </Paso>

        <Paso numero={3} titulo="¿Qué le hacemos?" completo>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(NOMBRE_SERVICIO) as ServicioOrden[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setServicio(s)}
                aria-pressed={servicio === s}
                className={`rounded-card border px-4 py-4 text-left font-display text-[1.0625rem] font-semibold transition-colors ${
                  servicio === s
                    ? 'border-brand-800 bg-brand-800 text-white'
                    : 'border-brand-300 bg-white text-ink hover:bg-brand-50'
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
            className={`mt-2 flex w-full items-center gap-3 rounded-card border px-4 py-4 text-left font-display text-[1.0625rem] font-semibold transition-colors ${
              envio
                ? 'border-brand-800 bg-brand-50 text-brand-900'
                : 'border-dashed border-brand-300 bg-white text-brand-700 hover:bg-brand-50'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sharp border ${
                envio ? 'border-ok bg-ok text-white' : 'border-brand-300 bg-white text-transparent'
              }`}
            >
              <IconoCheck size={16} />
            </span>
            Envío: lo retiramos y lo entregamos a domicilio
          </button>
        </Paso>

        <Paso numero={4} titulo="¿Para cuándo?" completo={Boolean(fechaRetiro)}>
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
            className="field tabular h-12 text-lg sm:max-w-xs"
          />
          {fechaRetiro && (
            <p className="ayuda">
              {esDomingo(fechaRetiro) ? (
                <span className="flex items-start gap-1.5 font-semibold text-aviso">
                  <IconoAlerta size={16} className="mt-0.5 shrink-0" />
                  Ese día es domingo y el lavadero está cerrado. Te deja igual, por si es a
                  propósito.
                </span>
              ) : (
                <>Sale el {fechaLarga(fechaRetiro)}.</>
              )}
            </p>
          )}
        </Paso>

        <Paso
          numero={5}
          titulo="¿Algo para tener en cuenta?"
          detalle="Opcional. Esto no sale impreso en el comprobante del cliente."
          completo
        >
          <label className="sr-only" htmlFor="notas">
            Notas
          </label>
          <textarea
            id="notas"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Manchas, prendas delicadas, instrucciones especiales…"
            className="field resize-y"
          />
        </Paso>
      </div>

      <BarraGuardar
        cliente={cliente}
        cantidadItems={seleccionados.length}
        problemas={problemas}
        mostrarProblemas={intentoGuardar}
        guardando={crear.isPending}
        onGuardar={() => void guardar()}
      />
    </div>
  );
}

/* ── Piezas ───────────────────────────────────────────────────────────────── */

/**
 * Un paso del formulario, con su cuadradito numerado.
 *
 * El número estaba antes dentro del título ("2 · Qué recibimos"), donde se
 * leía como parte del texto. Afuera y en un bloque de color da el orden de
 * lectura de un vistazo, y al completarse se pone verde: se ve cuánto falta
 * sin tener que releer todo.
 */
function Paso({
  numero,
  titulo,
  detalle,
  completo = false,
  children,
}: {
  numero: number;
  titulo: string;
  detalle?: string;
  completo?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="flex items-center gap-3 border-b border-brand-100 px-4 py-3.5">
        <span className={`paso-numero ${completo ? 'bg-ok text-white' : 'bg-brand-800 text-white'}`}>
          {completo ? <IconoCheck size={20} /> : numero}
        </span>
        <div>
          <h2 className="font-display text-lg font-bold leading-tight text-brand-900">{titulo}</h2>
          {detalle && <p className="mt-0.5 text-sm leading-snug text-slate-500">{detalle}</p>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/**
 * La barra de guardar, pegada al pie de la ventana.
 *
 * El botón estaba al final del formulario: con cinco pasos abiertos había que
 * bajar hasta el fondo para terminar, y lo que faltaba se sabía recién después
 * de apretar. Acá el botón no se va nunca de la pantalla y lo que falta se dice
 * antes.
 *
 * Va `sticky` y no `fixed` a propósito: así ocupa su lugar en el flujo y los
 * avisos de abajo a la derecha no le caen encima.
 */
function BarraGuardar({
  cliente,
  cantidadItems,
  problemas,
  mostrarProblemas,
  guardando,
  onGuardar,
}: {
  cliente: Cliente | null;
  cantidadItems: number;
  problemas: string[];
  mostrarProblemas: boolean;
  guardando: boolean;
  onGuardar: () => void;
}) {
  const listo = problemas.length === 0;

  return (
    <div className="sticky bottom-0 z-20 mt-4 rounded-card border border-brand-200 bg-white shadow-modal">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          {listo ? (
            <p className="flex items-center gap-2 text-[0.9375rem] text-ink">
              <IconoCheck size={18} className="shrink-0 text-ok" />
              <span className="truncate">
                <span className="font-semibold">{cliente?.nombre}</span> ·{' '}
                {cantidadItems === 1 ? '1 cosa' : `${cantidadItems} cosas`}
              </span>
            </p>
          ) : (
            <p
              className={`text-[0.9375rem] leading-snug ${
                mostrarProblemas ? 'font-semibold text-alerta' : 'text-slate-500'
              }`}
            >
              Falta: {problemas.map((p) => p.replace(/\.$/, '').toLowerCase()).join(' · ')}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onGuardar}
          disabled={guardando}
          className="btn-primary btn-lg shrink-0"
        >
          {guardando ? <Spinner size={18} /> : <IconoImprimir size={18} />}
          {guardando ? 'Guardando…' : 'Guardar e imprimir'}
        </button>
      </div>
    </div>
  );
}
