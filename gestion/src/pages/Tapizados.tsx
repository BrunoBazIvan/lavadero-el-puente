import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { BloqueCargando, EstadoError, EstadoVacio, Spinner } from '@/components/Estados';
import { IconoBuscar, IconoCheck, IconoDinero, IconoEditar, IconoMas } from '@/components/Iconos';
import { useToast } from '@/components/Toaster';
import { usePrecioM2Alfombra } from '@/hooks/useConfiguracion';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useBorrarTapizado,
  useCambiarEtapa,
  useCrearTapizado,
  useEditarTapizado,
  useTapizados,
  type DatosTapizado,
} from '@/hooks/useTapizados';
import { fecha, moneda, normalizarTelefono, telefono, telefonoValido } from '@/lib/format';
import { mensajeDeError } from '@/lib/supabase';
import {
  ETAPA_ANTERIOR,
  ETAPAS,
  PRODUCTOS,
  TEXTO_ETAPA,
  decimal,
  leerDecimal,
  metrosCuadrados,
  nombreProducto,
  precioAlfombra,
} from '@/lib/tapizados';
import type { EstadoTapizado, ProductoTapizado, Tapizado } from '@/types/database';

type Filtro = EstadoTapizado | 'todos';

const COLOR_ETAPA: Record<EstadoTapizado, string> = {
  pendiente: 'border-amber-300 bg-amber-50 text-aviso',
  terminado: 'border-aqua-300 bg-aqua-50 text-brand-800',
  cobrado: 'border-green-300 bg-green-50 text-ok',
};

export default function Tapizados() {
  const [altaAbierta, setAltaAbierta] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Tapizado | null>(null);
  const [aTerminar, setATerminar] = useState<Tapizado | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // El filtro vive en la URL, como en Órdenes: F5 o "atrás" no lo pierden.
  const [parametros, setParametros] = useSearchParams();
  const pedido = parametros.get('estado') as EstadoTapizado | null;
  const filtro: Filtro = pedido && ETAPAS.includes(pedido) ? pedido : 'todos';
  const filtrar = (f: Filtro) =>
    setParametros(f === 'todos' ? {} : { estado: f }, { replace: true });

  const { data: todos, isPending, error, refetch } = useTapizados();
  const busquedaDemorada = useDebounce(busqueda, 200);

  const cuenta = useMemo(() => {
    const c: Record<Filtro, number> = { todos: 0, pendiente: 0, terminado: 0, cobrado: 0 };
    for (const t of todos ?? []) {
      c.todos++;
      c[t.estado]++;
    }
    return c;
  }, [todos]);

  /** Lo que ya está hecho y todavía no se cobró. */
  const aCobrar = useMemo(
    () =>
      (todos ?? [])
        .filter((t) => t.estado === 'terminado')
        .reduce((suma, t) => suma + Number(t.precio_final), 0),
    [todos],
  );

  const visibles = useMemo(() => {
    const texto = busquedaDemorada.trim().toLowerCase();
    return (todos ?? []).filter((t) => {
      if (filtro !== 'todos' && t.estado !== filtro) return false;
      if (!texto) return true;
      return [t.ref, t.nombre, t.edificio, t.contacto, nombreProducto(t)]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(texto));
    });
  }, [todos, filtro, busquedaDemorada]);

  return (
    <>
      <EncabezadoPagina
        titulo="Tapizados"
        detalle="Sillones, sillas, colchones y alfombras: qué falta hacer y qué falta cobrar."
        acciones={
          <button type="button" className="btn-primary" onClick={() => setAltaAbierta(true)}>
            <IconoMas size={19} />
            Cargar tapizado
          </button>
        }
      />

      {/* Resumen: no se muestran ceros mientras carga. */}
      {todos && (
        <div className="mb-5 grid grid-cols-2 border border-brand-200 bg-white sm:grid-cols-3">
          <Dato etiqueta="Por hacer" valor={String(cuenta.pendiente)} />
          <Dato etiqueta="Terminados sin cobrar" valor={String(cuenta.terminado)} />
          <Dato
            etiqueta="Falta cobrar"
            valor={moneda(aCobrar)}
            className="col-span-2 border-t sm:col-span-1 sm:border-l sm:border-t-0"
          />
        </div>
      )}

      <div className="panel">
        <div className="space-y-3 border-b border-brand-100 px-4 py-4">
          <div className="relative">
            <IconoBuscar
              size={20}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400"
            />
            <label htmlFor="buscar-tapizado" className="sr-only">
              Buscar tapizado
            </label>
            <input
              id="buscar-tapizado"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, edificio, contacto o TP-00001…"
              className="field pl-11"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['todos', ...ETAPAS] as Filtro[]).map((f) => {
              const activo = filtro === f;
              const n = cuenta[f];
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => filtrar(f)}
                  className={`flex min-h-[2.75rem] items-center gap-2 rounded-sharp border px-3.5 py-2 font-display text-[0.9375rem] font-semibold transition-colors ${
                    activo
                      ? 'border-brand-800 bg-brand-800 text-white'
                      : 'border-brand-300 bg-white text-brand-800 hover:bg-brand-50'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : TEXTO_ETAPA[f]}
                  {todos && n > 0 && (
                    <span
                      className={`tabular rounded-sharp px-1.5 py-0.5 text-xs font-bold ${
                        activo ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isPending && <BloqueCargando texto="Cargando tapizados…" />}

        {error ? (
          <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
        ) : null}

        {todos && todos.length === 0 && (
          <EstadoVacio
            titulo="Todavía no hay tapizados"
            detalle="Cargá el primero y queda acá hasta que se termine y se cobre."
          />
        )}

        {todos && todos.length > 0 && visibles.length === 0 && (
          <EstadoVacio
            titulo="No hay nada con ese filtro"
            detalle={busqueda ? 'Probá con otra búsqueda.' : 'Elegí otra etapa arriba.'}
          />
        )}

        {visibles.length > 0 && (
          <ul className="divide-y divide-brand-100">
            {visibles.map((t) => (
              <FilaTapizado
                key={t.id}
                tapizado={t}
                onEditar={() => setEnEdicion(t)}
                onTerminarAlfombra={() => setATerminar(t)}
              />
            ))}
          </ul>
        )}
      </div>

      <Modal
        abierto={altaAbierta}
        onCerrar={() => setAltaAbierta(false)}
        titulo="Cargar tapizado"
        detalle="Queda como pendiente hasta que lo terminen."
      >
        <FormularioTapizado
          onCancelar={() => setAltaAbierta(false)}
          onGuardado={() => setAltaAbierta(false)}
        />
      </Modal>

      <Modal
        abierto={enEdicion !== null}
        onCerrar={() => setEnEdicion(null)}
        titulo={enEdicion ? `Editar ${enEdicion.ref}` : 'Editar'}
      >
        {enEdicion && (
          <FormularioTapizado
            tapizado={enEdicion}
            onCancelar={() => setEnEdicion(null)}
            onGuardado={() => setEnEdicion(null)}
          />
        )}
      </Modal>

      <Modal
        abierto={aTerminar !== null}
        onCerrar={() => setATerminar(null)}
        titulo="¿Cuánto mide la alfombra?"
        detalle="Con las medidas sale el precio final."
        ancho="sm"
      >
        {aTerminar && (
          <FormularioMedidas tapizado={aTerminar} onListo={() => setATerminar(null)} />
        )}
      </Modal>
    </>
  );
}

function Dato({
  etiqueta,
  valor,
  className = '',
}: {
  etiqueta: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className={`border-brand-200 px-4 py-3 [&:nth-child(2)]:border-l ${className}`}>
      <p className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-brand-600">
        {etiqueta}
      </p>
      <p className="tabular mt-1 font-display text-2xl font-bold text-brand-900">{valor}</p>
    </div>
  );
}

/* ── Fila ─────────────────────────────────────────────────────────────────── */

/**
 * Un trabajo. En el celular se apila en bloque; desde `md` se arma en
 * columnas. Es la misma fila en los dos: no hay dos listas que mantener.
 */
function FilaTapizado({
  tapizado: t,
  onEditar,
  onTerminarAlfombra,
}: {
  tapizado: Tapizado;
  onEditar: () => void;
  onTerminarAlfombra: () => void;
}) {
  const toast = useToast();
  const cambiar = useCambiarEtapa();

  const esAlfombra = t.producto === 'alfombra';
  const conMedidas = t.ancho_m !== null && t.largo_m !== null;
  const esTelefono = telefonoValido(t.contacto);

  const avanzar = async (estado: EstadoTapizado, aviso: string) => {
    try {
      await cambiar.mutateAsync({ id: t.id, estado });
      toast.ok(aviso);
    } catch {
      // Ya lo avisó el manejador global.
    }
  };

  return (
    <li className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] md:items-center md:gap-5">
      {/* Quién */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`chip ${COLOR_ETAPA[t.estado]}`}>{TEXTO_ETAPA[t.estado]}</span>
          <span className="tabular font-display text-sm font-semibold text-slate-500">
            {t.ref}
          </span>
        </div>
        <p className="mt-1.5 font-display text-[1.0625rem] font-bold text-ink">{t.nombre}</p>
        {t.edificio && <p className="text-[0.9375rem] text-slate-700">{t.edificio}</p>}
        <p className="text-[0.9375rem] text-slate-700">
          {esTelefono ? (
            <a
              href={`tel:${normalizarTelefono(t.contacto)}`}
              className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
            >
              {telefono(t.contacto)}
            </a>
          ) : (
            t.contacto
          )}
        </p>
      </div>

      {/* Qué */}
      <div className="min-w-0">
        <p className="font-display font-semibold text-brand-900">{nombreProducto(t)}</p>
        {esAlfombra && conMedidas && (
          <p className="tabular text-sm text-slate-600">
            {decimal(Number(t.ancho_m))} × {decimal(Number(t.largo_m))} m ={' '}
            {decimal(metrosCuadrados(Number(t.ancho_m), Number(t.largo_m)))} m² ×{' '}
            {moneda(Number(t.precio_m2))}
          </p>
        )}
        {t.notas && <p className="mt-0.5 text-sm text-slate-600">{t.notas}</p>}
        <p className="mt-0.5 text-sm text-slate-500">
          Cargado el {fecha(t.created_at)}
          {t.terminado_el && ` · terminado el ${fecha(t.terminado_el)}`}
          {t.cobrado_el && ` · cobrado el ${fecha(t.cobrado_el)}`}
        </p>
      </div>

      {/* Cuánto */}
      <div className="md:text-right">
        <p className="tabular font-display text-xl font-bold text-brand-900">
          {moneda(Number(t.precio_final))}
        </p>
        {esAlfombra && !conMedidas && (
          <p className="text-sm text-slate-500">estimado, falta medir</p>
        )}
      </div>

      {/* Qué sigue */}
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {t.estado === 'pendiente' && (
          <button
            type="button"
            className="btn-secondary flex-1 md:flex-none"
            disabled={cambiar.isPending}
            onClick={() =>
              esAlfombra ? onTerminarAlfombra() : void avanzar('terminado', `${t.ref} terminado.`)
            }
          >
            <IconoCheck size={18} />
            Lo terminamos
          </button>
        )}
        {t.estado === 'terminado' && (
          <button
            type="button"
            className="btn-secondary flex-1 md:flex-none"
            disabled={cambiar.isPending}
            onClick={() => void avanzar('cobrado', `${t.ref} cobrado.`)}
          >
            <IconoDinero size={18} />
            Ya pagó
          </button>
        )}
        <button type="button" className="btn-ghost px-3" onClick={onEditar}>
          <IconoEditar size={16} />
          Editar
        </button>
      </div>
    </li>
  );
}

/* ── Medidas de alfombra ──────────────────────────────────────────────────── */

function FormularioMedidas({ tapizado, onListo }: { tapizado: Tapizado; onListo: () => void }) {
  const toast = useToast();
  const cambiar = useCambiarEtapa();
  const precioM2 = usePrecioM2Alfombra();

  const [ancho, setAncho] = useState(tapizado.ancho_m ? decimal(Number(tapizado.ancho_m)) : '');
  const [largo, setLargo] = useState(tapizado.largo_m ? decimal(Number(tapizado.largo_m)) : '');
  const [intentado, setIntentado] = useState(false);

  const a = leerDecimal(ancho);
  const l = leerDecimal(largo);
  // Tope de 9.999 m: es lo que entra en `numeric(6,2)`.
  const anchoOk = a !== null && a > 0 && a < 10_000;
  const largoOk = l !== null && l > 0 && l < 10_000;
  const medidas = anchoOk && largoOk ? { a: a as number, l: l as number } : null;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    if (!medidas) return;
    try {
      await cambiar.mutateAsync({
        id: tapizado.id,
        estado: 'terminado',
        medidas: { ancho_m: medidas.a, largo_m: medidas.l, precio_m2: precioM2 },
      });
      toast.ok(
        `${tapizado.ref} terminado: ${moneda(precioAlfombra(medidas.a, medidas.l, precioM2))}.`,
      );
      onListo();
    } catch {
      // Ya lo avisó el manejador global.
    }
  };

  return (
    <form onSubmit={(e) => void enviar(e)} noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="ancho">
            Ancho (metros)
          </label>
          <input
            id="ancho"
            inputMode="decimal"
            autoComplete="off"
            placeholder="2,00"
            className={`field tabular text-right ${intentado && !anchoOk ? 'field-error' : ''}`}
            value={ancho}
            onChange={(e) => setAncho(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="largo">
            Largo (metros)
          </label>
          <input
            id="largo"
            inputMode="decimal"
            autoComplete="off"
            placeholder="3,20"
            className={`field tabular text-right ${intentado && !largoOk ? 'field-error' : ''}`}
            value={largo}
            onChange={(e) => setLargo(e.target.value)}
          />
        </div>
      </div>
      {intentado && !medidas && (
        <p className="error-text">Poné el ancho y el largo en metros, por ejemplo 2,5.</p>
      )}

      <div className="mt-5 border border-brand-200 bg-brand-50 px-4 py-3">
        {medidas ? (
          <>
            <p className="tabular text-[0.9375rem] text-slate-700">
              {decimal(medidas.a)} × {decimal(medidas.l)} ={' '}
              {decimal(metrosCuadrados(medidas.a, medidas.l))} m² × {moneda(precioM2)}
            </p>
            <p className="tabular mt-1 font-display text-3xl font-bold text-brand-900">
              {moneda(precioAlfombra(medidas.a, medidas.l, precioM2))}
            </p>
          </>
        ) : (
          <p className="text-[0.9375rem] text-slate-600">
            Se cobra a {moneda(precioM2)} el metro cuadrado.
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onListo}>
          Cancelar
        </button>
        <button type="submit" className="btn-ok" disabled={cambiar.isPending}>
          {cambiar.isPending ? <Spinner size={16} /> : <IconoCheck size={18} />}
          Terminada
        </button>
      </div>
    </form>
  );
}

/* ── Alta y edición ───────────────────────────────────────────────────────── */

const esquema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribí el nombre del cliente.'),
    edificio: z.string(),
    contacto: z.string().trim().min(3, 'Poné un teléfono o cómo ubicarlo.'),
    producto: z.string().min(1, 'Elegí qué es.'),
    producto_otro: z.string(),
    precio: z.coerce
      .number({ invalid_type_error: 'Poné un número, sin $ ni puntos.' })
      .min(0, 'No puede ser negativo.'),
    notas: z.string(),
  })
  .refine((v) => v.producto !== 'otro' || v.producto_otro.trim().length > 0, {
    path: ['producto_otro'],
    message: 'Escribí qué es.',
  });

type FormTapizado = z.input<typeof esquema>;

function FormularioTapizado({
  tapizado,
  onGuardado,
  onCancelar,
}: {
  tapizado?: Tapizado;
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const toast = useToast();
  const crear = useCrearTapizado();
  const editar = useEditarTapizado();
  const precioM2 = usePrecioM2Alfombra();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormTapizado>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: tapizado?.nombre ?? '',
      edificio: tapizado?.edificio ?? '',
      contacto: tapizado?.contacto ?? '',
      producto: tapizado?.producto ?? '',
      producto_otro: tapizado?.producto_otro ?? '',
      precio: tapizado ? Number(tapizado.precio) : ('' as unknown as number),
      notas: tapizado?.notas ?? '',
    },
  });

  const producto = watch('producto');
  const alfombraMedida =
    tapizado?.producto === 'alfombra' && tapizado.ancho_m !== null && producto === 'alfombra';

  const enviar = handleSubmit(async (v) => {
    const datos: DatosTapizado = {
      nombre: String(v.nombre),
      edificio: String(v.edificio),
      contacto: String(v.contacto),
      producto: v.producto as ProductoTapizado,
      producto_otro: String(v.producto_otro),
      precio: Number(v.precio),
      notas: String(v.notas),
    };
    try {
      if (tapizado) {
        await editar.mutateAsync({ id: tapizado.id, datos });
        toast.ok('Cambios guardados.');
      } else {
        const nuevo = await crear.mutateAsync(datos);
        toast.ok(`${nuevo.ref} cargado.`);
      }
      onGuardado();
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  });

  return (
    <>
      <form onSubmit={enviar} noValidate>
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="nombre">
              ¿Cómo se llama el cliente?
            </label>
            <input
              id="nombre"
              autoComplete="off"
              className={`field ${errors.nombre ? 'field-error' : ''}`}
              {...register('nombre')}
            />
            {errors.nombre && <p className="error-text">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="edificio">
              ¿En qué edificio?
            </label>
            <input
              id="edificio"
              autoComplete="off"
              className="field"
              placeholder="Si es una casa, dejalo vacío"
              {...register('edificio')}
            />
          </div>

          <div>
            <label className="label" htmlFor="contacto">
              ¿Cómo lo contactamos?
            </label>
            <input
              id="contacto"
              autoComplete="off"
              className={`field ${errors.contacto ? 'field-error' : ''}`}
              placeholder="099 123 456, o el portero, o el encargado"
              {...register('contacto')}
            />
            {errors.contacto && <p className="error-text">{errors.contacto.message}</p>}
          </div>

          <fieldset>
            <legend className="label">¿Qué es?</legend>
            <input type="hidden" {...register('producto')} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRODUCTOS.map((p) => {
                const activo = producto === p.valor;
                return (
                  <button
                    key={p.valor}
                    type="button"
                    aria-pressed={activo}
                    onClick={() =>
                      setValue('producto', p.valor, { shouldValidate: Boolean(errors.producto) })
                    }
                    className={`min-h-[2.75rem] rounded-sharp border px-3 py-2 text-left font-display text-[0.9375rem] font-semibold transition-colors ${
                      activo
                        ? 'border-brand-800 bg-brand-800 text-white'
                        : 'border-brand-300 bg-white text-brand-800 hover:bg-brand-50'
                    }`}
                  >
                    {p.texto}
                  </button>
                );
              })}
            </div>
            {errors.producto && <p className="error-text">{errors.producto.message}</p>}

            {producto === 'otro' && (
              <div className="mt-3">
                <label className="label" htmlFor="producto_otro">
                  ¿Qué es exactamente?
                </label>
                <input
                  id="producto_otro"
                  autoComplete="off"
                  className={`field ${errors.producto_otro ? 'field-error' : ''}`}
                  placeholder="Puff, cabecera, almohadones…"
                  {...register('producto_otro')}
                />
                {errors.producto_otro && (
                  <p className="error-text">{errors.producto_otro.message}</p>
                )}
              </div>
            )}
          </fieldset>

          <div>
            <label className="label" htmlFor="precio">
              {producto === 'alfombra' ? 'Precio estimado' : 'Precio'}
            </label>
            <input
              id="precio"
              inputMode="numeric"
              autoComplete="off"
              className={`field tabular ${errors.precio ? 'field-error' : ''}`}
              placeholder="0"
              {...register('precio')}
            />
            {errors.precio && <p className="error-text">{errors.precio.message}</p>}
            {producto === 'alfombra' && (
              <p className="ayuda">
                {alfombraMedida
                  ? 'Ya tiene medidas: el precio final sale de ellas, no de este número.'
                  : `Al terminarla se cargan las medidas y el precio pasa a ser ancho × largo × ${moneda(precioM2)}.`}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="notas">
              Notas
            </label>
            <textarea
              id="notas"
              rows={2}
              className="field"
              placeholder="Manchas, material, horario para ir…"
              {...register('notas')}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting && <Spinner size={16} />}
            {tapizado ? 'Guardar cambios' : 'Cargar'}
          </button>
        </div>
      </form>

      {tapizado && <OpcionesAvanzadas tapizado={tapizado} onHecho={onGuardado} />}
    </>
  );
}

/**
 * Volver de etapa y borrar: existen, pero van plegados al final. No son lo
 * que se hace todos los días.
 */
function OpcionesAvanzadas({ tapizado, onHecho }: { tapizado: Tapizado; onHecho: () => void }) {
  const toast = useToast();
  const cambiar = useCambiarEtapa();
  const borrar = useBorrarTapizado();
  const anterior = ETAPA_ANTERIOR[tapizado.estado];

  return (
    <details className="mt-6 border-t border-brand-100 pt-4">
      <summary className="cursor-pointer font-display text-sm font-semibold text-brand-700">
        Más opciones
      </summary>
      <div className="mt-3 space-y-3">
        {anterior && (
          <div>
            <button
              type="button"
              className="btn-secondary"
              disabled={cambiar.isPending}
              onClick={() =>
                void cambiar
                  .mutateAsync({ id: tapizado.id, estado: anterior })
                  .then(() => {
                    toast.ok(`${tapizado.ref} volvió a ${TEXTO_ETAPA[anterior].toLowerCase()}.`);
                    onHecho();
                  })
                  .catch(() => {
                    // Ya lo avisó el manejador global.
                  })
              }
            >
              Volver a {TEXTO_ETAPA[anterior].toLowerCase()}
            </button>
            <p className="ayuda">
              {tapizado.estado === 'cobrado'
                ? 'Por si se marcó cobrado y todavía no pagó.'
                : 'Por si se marcó terminado sin estarlo. Las medidas quedan guardadas.'}
            </p>
          </div>
        )}

        {tapizado.estado === 'pendiente' && (
          <div>
            <button
              type="button"
              className="btn-danger"
              disabled={borrar.isPending}
              onClick={() => {
                if (!window.confirm(`¿Borrar ${tapizado.ref} de ${tapizado.nombre}? No se puede deshacer.`))
                  return;
                void borrar
                  .mutateAsync(tapizado.id)
                  .then(() => {
                    toast.ok(`${tapizado.ref} borrado.`);
                    onHecho();
                  })
                  .catch(() => {
                    // Ya lo avisó el manejador global.
                  });
              }}
            >
              Borrar este tapizado
            </button>
            <p className="ayuda">Solo mientras está pendiente: si se cargó por error.</p>
          </div>
        )}
      </div>
    </details>
  );
}
