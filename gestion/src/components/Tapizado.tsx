import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Spinner } from '@/components/Estados';
import { IconoAnular, IconoCheck, IconoDinero, IconoTapizado } from '@/components/Iconos';
import { useToast } from '@/components/Toaster';
import { usePrecioM2Alfombra } from '@/hooks/useConfiguracion';
import {
  useCambiarEtapa,
  useCrearTapizado,
  useEditarTapizado,
  type DatosTapizado,
} from '@/hooks/useTapizados';
import { moneda } from '@/lib/format';
import {
  ETAPAS,
  PRODUCTOS,
  TEXTO_ETAPA,
  decimal,
  leerDecimal,
  metrosCuadrados,
  precioAlfombra,
} from '@/lib/tapizados';
import type { EstadoTapizado, ProductoTapizado, Tapizado } from '@/types/database';
import type { ComponentType } from 'react';

type Icono = ComponentType<{ size?: number; className?: string }>;

/* ── Chip y línea de etapas ───────────────────────────────────────────────── */

const ETAPA: Record<EstadoTapizado, { clase: string; icono: Icono; largo: string }> = {
  pendiente: {
    clase: 'border-amber-300 bg-amber-50 text-aviso',
    icono: IconoTapizado,
    largo: 'Falta hacerlo',
  },
  terminado: {
    clase: 'border-aqua-300 bg-aqua-50 text-brand-800',
    icono: IconoCheck,
    largo: 'Hecho, falta cobrar',
  },
  cobrado: {
    clase: 'border-green-300 bg-green-50 text-ok',
    icono: IconoDinero,
    largo: 'Pagó, trabajo cerrado',
  },
  anulado: {
    clase: 'border-red-200 bg-red-50 text-alerta',
    icono: IconoAnular,
    largo: 'Anulado',
  },
};

export function ChipEtapa({ estado }: { estado: EstadoTapizado }) {
  const { clase, icono: I } = ETAPA[estado];
  return (
    <span className={`chip ${clase}`}>
      <I size={14} />
      {TEXTO_ETAPA[estado]}
    </span>
  );
}

/** Dónde está el trabajo, dibujado. Mismo lenguaje que `LineaEstado` de órdenes. */
export function LineaEtapa({ estado }: { estado: EstadoTapizado }) {
  if (estado === 'anulado') {
    return (
      <div className="flex items-center gap-3 rounded-card border border-alerta/50 bg-red-50 px-4 py-3.5">
        <IconoAnular size={22} className="shrink-0 text-alerta" />
        <div>
          <p className="font-display text-base font-bold text-alerta">Tapizado anulado</p>
          <p className="text-sm text-slate-700">
            No cuenta en lo que falta cobrar. El motivo está en las notas.
          </p>
        </div>
      </div>
    );
  }

  const actual = ETAPAS.indexOf(estado);

  return (
    <ol className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-brand-200 bg-brand-200">
      {ETAPAS.map((paso, i) => {
        const hecho = i < actual;
        const esActual = i === actual;
        const { icono: I, largo } = ETAPA[paso];
        return (
          <li
            key={paso}
            aria-current={esActual ? 'step' : undefined}
            className={`flex items-center gap-2.5 px-3 py-3 ${
              esActual ? 'bg-brand-800 text-white' : 'bg-white'
            }`}
          >
            {hecho ? (
              <IconoCheck size={20} className="shrink-0 text-ok" />
            ) : (
              <I size={20} className={`shrink-0 ${esActual ? '' : 'text-slate-300'}`} />
            )}
            <div className="min-w-0">
              <p
                className={`font-display text-sm font-bold leading-tight ${
                  esActual ? 'text-white' : hecho ? 'text-brand-800' : 'text-slate-400'
                }`}
              >
                {TEXTO_ETAPA[paso]}
              </p>
              <p
                className={`hidden truncate text-xs leading-tight sm:block ${
                  esActual ? 'text-aqua-200' : hecho ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {esActual ? 'Está acá ahora' : largo}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Medidas de alfombra ──────────────────────────────────────────────────── */

/** Pide ancho y largo, muestra la cuenta y marca la alfombra terminada. */
export function FormularioMedidas({
  tapizado,
  onListo,
}: {
  tapizado: Tapizado;
  onListo: () => void;
}) {
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

export function FormularioTapizado({
  tapizado,
  onGuardado,
  onCancelar,
}: {
  tapizado?: Tapizado;
  onGuardado: (t: Tapizado) => void;
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
        const t = await editar.mutateAsync({ id: tapizado.id, datos });
        toast.ok('Cambios guardados.');
        onGuardado(t);
      } else {
        const t = await crear.mutateAsync(datos);
        toast.ok(`${t.ref} cargado.`);
        onGuardado(t);
      }
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  });

  return (
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
  );
}
