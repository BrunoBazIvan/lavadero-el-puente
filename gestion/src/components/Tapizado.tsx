import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Spinner } from '@/components/Estados';
import {
  IconoAnular,
  IconoCheck,
  IconoDinero,
  IconoMas,
  IconoMenos,
  IconoTapizado,
  IconoX,
} from '@/components/Iconos';
import { useToast } from '@/components/Toaster';
import { usePrecioM2Alfombra } from '@/hooks/useConfiguracion';
import { useGuardarTapizado } from '@/hooks/useTapizados';
import { moneda } from '@/lib/format';
import {
  ETAPAS,
  PRODUCTOS,
  TEXTO_ETAPA,
  decimal,
  leerDecimal,
  metrosCuadrados,
  nombreProducto,
  precioAlfombra,
} from '@/lib/tapizados';
import type {
  EstadoTapizado,
  ItemTapizadoRPC,
  ProductoTapizado,
  Tapizado,
} from '@/types/database';
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

/* ── Artículos ────────────────────────────────────────────────────────────── */

/** Un renglón mientras se edita: todo texto, como lo tipean. */
interface Renglon {
  clave: number;
  producto: ProductoTapizado;
  producto_otro: string;
  cantidad: number;
  precio: string;
  /** Si se abrió la calculadora de alfombra. */
  medir: boolean;
  ancho: string;
  largo: string;
  /** El $/m² con que se midió. Uno ya guardado conserva el suyo. */
  precio_m2: number | null;
}

let proximaClave = 1;

/** "1.500" o "$ 1500" → 1500. En pesos el punto es de miles, no decimal. */
function leerPesos(texto: string): number | null {
  const limpio = texto.replace(/[$\s.]/g, '').replace(',', '.');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Tope de 9.999 m: es lo que entra en `numeric(6,2)`. */
function medidaValida(n: number | null): n is number {
  return n !== null && n > 0 && n < 10_000;
}

/** Ancho y largo leídos, o null si falta alguno. */
function medidasDe(r: Renglon): { a: number; l: number } | null {
  const a = leerDecimal(r.ancho);
  const l = leerDecimal(r.largo);
  return medidaValida(a) && medidaValida(l) ? { a, l } : null;
}

/** Lo que está mal en un renglón, o null si está bien. */
function problemaDe(r: Renglon): string | null {
  if (r.producto === 'otro' && !r.producto_otro.trim()) return 'Escribí qué es.';
  if (r.medir && !medidasDe(r)) return 'Poné el ancho y el largo en metros, por ejemplo 2,5.';
  if (leerPesos(r.precio) === null) return 'Poné el precio, sin $ ni puntos.';
  return null;
}

function renglonDesdeItem(i: Tapizado['items'][number]): Renglon {
  const medida = i.ancho_m !== null && i.largo_m !== null && i.precio_m2 !== null;
  return {
    clave: proximaClave++,
    producto: i.producto,
    producto_otro: i.producto_otro ?? '',
    cantidad: i.cantidad,
    precio: String(Number(i.precio_unitario)),
    medir: medida,
    ancho: medida ? decimal(Number(i.ancho_m)) : '',
    largo: medida ? decimal(Number(i.largo_m)) : '',
    precio_m2: medida ? Number(i.precio_m2) : null,
  };
}

function aItem(r: Renglon): ItemTapizadoRPC {
  const m = r.medir ? medidasDe(r) : null;
  return {
    producto: r.producto,
    producto_otro: r.producto === 'otro' ? r.producto_otro.trim() : null,
    cantidad: r.cantidad,
    precio_unitario: leerPesos(r.precio) ?? 0,
    ancho_m: m ? Math.round(m.a * 100) / 100 : null,
    largo_m: m ? Math.round(m.l * 100) / 100 : null,
    precio_m2: m ? r.precio_m2 : null,
  };
}

/* ── Alta y edición ───────────────────────────────────────────────────────── */

const esquema = z.object({
  nombre: z.string().trim().min(2, 'Escribí el nombre del cliente.'),
  edificio: z.string(),
  contacto: z.string().trim().min(3, 'Poné un teléfono o cómo ubicarlo.'),
  notas: z.string(),
});

type FormTapizado = z.infer<typeof esquema>;

export function FormularioTapizado({
  tapizado,
  onGuardado,
  onCancelar,
}: {
  tapizado?: Tapizado;
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const toast = useToast();
  const guardar = useGuardarTapizado();
  const precioM2 = usePrecioM2Alfombra();

  const [renglones, setRenglones] = useState<Renglon[]>(
    () => tapizado?.items.map(renglonDesdeItem) ?? [],
  );
  const [intentado, setIntentado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormTapizado>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: tapizado?.nombre ?? '',
      edificio: tapizado?.edificio ?? '',
      contacto: tapizado?.contacto ?? '',
      notas: tapizado?.notas ?? '',
    },
  });

  const cambiar = (clave: number, cambios: Partial<Renglon>) =>
    setRenglones((rs) =>
      rs.map((r) => {
        if (r.clave !== clave) return r;
        const nuevo = { ...r, ...cambios };
        // Con la calculadora abierta, el precio sale de las medidas.
        if (nuevo.medir) {
          const m = medidasDe(nuevo);
          if (m) nuevo.precio = String(precioAlfombra(m.a, m.l, nuevo.precio_m2 ?? precioM2));
        }
        return nuevo;
      }),
    );

  const quitar = (clave: number) => setRenglones((rs) => rs.filter((r) => r.clave !== clave));

  /**
   * Tocar un producto lo suma. Si ya está en la lista, le sube la cantidad:
   * cuatro sillas son "Silla × 4", no cuatro renglones. Alfombras y "Otro"
   * van siempre aparte, porque cada una tiene su medida o su nombre.
   */
  const agregar = (producto: ProductoTapizado) =>
    setRenglones((rs) => {
      const repetible = producto !== 'alfombra' && producto !== 'otro';
      const existente = repetible ? rs.find((r) => r.producto === producto) : undefined;
      if (existente) {
        return rs.map((r) =>
          r.clave === existente.clave ? { ...r, cantidad: Math.min(r.cantidad + 1, 999) } : r,
        );
      }
      return [
        ...rs,
        {
          clave: proximaClave++,
          producto,
          producto_otro: '',
          cantidad: 1,
          precio: '',
          medir: false,
          ancho: '',
          largo: '',
          precio_m2: null,
        },
      ];
    });

  const total = renglones.reduce(
    (suma, r) => suma + r.cantidad * (leerPesos(r.precio) ?? 0),
    0,
  );
  const hayProblemas = renglones.length === 0 || renglones.some((r) => problemaDe(r) !== null);

  const enviar = handleSubmit(async (v) => {
    setIntentado(true);
    if (hayProblemas) return;
    try {
      const t = await guardar.mutateAsync({
        id: tapizado?.id,
        datos: {
          nombre: v.nombre.trim(),
          edificio: v.edificio.trim() || null,
          contacto: v.contacto.trim(),
          notas: v.notas.trim() || null,
        },
        items: renglones.map(aItem),
      });
      toast.ok(tapizado ? 'Cambios guardados.' : `${t.ref} cargado.`);
      onGuardado();
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  });

  return (
    <form
      onSubmit={(e) => {
        setIntentado(true);
        void enviar(e);
      }}
      noValidate
    >
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
          <legend className="label">¿Qué hay que limpiar?</legend>
          <p className="ayuda mb-2 mt-0">
            Tocá cada cosa. Si son varias iguales, tocala otra vez o cambiá la cantidad.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRODUCTOS.map((p) => {
              const cuantos = renglones
                .filter((r) => r.producto === p.valor)
                .reduce((s, r) => s + r.cantidad, 0);
              return (
                <button
                  key={p.valor}
                  type="button"
                  onClick={() => agregar(p.valor)}
                  className={`flex min-h-[2.75rem] items-center justify-between gap-2 rounded-sharp border px-3 py-2 text-left font-display text-[0.9375rem] font-semibold transition-colors ${
                    cuantos > 0
                      ? 'border-brand-800 bg-brand-800 text-white hover:bg-brand-900'
                      : 'border-brand-300 bg-white text-brand-800 hover:bg-brand-50'
                  }`}
                >
                  <span>{p.texto}</span>
                  {cuantos > 0 && <span className="tabular text-sm">× {cuantos}</span>}
                </button>
              );
            })}
          </div>

          {renglones.length === 0 ? (
            intentado && <p className="error-text">Tocá al menos una cosa para limpiar.</p>
          ) : (
            <ul className="mt-4 divide-y divide-brand-200 border border-brand-200">
              {renglones.map((r) => (
                <FilaArticulo
                  key={r.clave}
                  renglon={r}
                  precioM2={r.precio_m2 ?? precioM2}
                  intentado={intentado}
                  onCambiar={(c) => cambiar(r.clave, c)}
                  onQuitar={() => quitar(r.clave)}
                  onMedir={() => cambiar(r.clave, { medir: true, precio_m2: precioM2 })}
                />
              ))}
              <li className="flex items-baseline justify-between gap-3 bg-brand-50 px-4 py-3">
                <span className="font-display text-sm font-bold uppercase tracking-technical text-brand-700">
                  Total
                </span>
                <span className="tabular font-display text-2xl font-bold text-brand-900">
                  {moneda(total)}
                </span>
              </li>
            </ul>
          )}
        </fieldset>

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
        <button type="submit" className="btn-primary" disabled={guardar.isPending}>
          {guardar.isPending && <Spinner size={16} />}
          {tapizado ? 'Guardar cambios' : 'Cargar'}
        </button>
      </div>
    </form>
  );
}

/**
 * Un artículo del trabajo: cantidad, precio y, si es alfombra, la
 * calculadora por medidas — opcional, solo si querés que la cuenta la haga
 * el sistema.
 */
function FilaArticulo({
  renglon: r,
  precioM2,
  intentado,
  onCambiar,
  onQuitar,
  onMedir,
}: {
  renglon: Renglon;
  precioM2: number;
  intentado: boolean;
  onCambiar: (cambios: Partial<Renglon>) => void;
  onQuitar: () => void;
  onMedir: () => void;
}) {
  const id = `art-${r.clave}`;
  const problema = intentado ? problemaDe(r) : null;
  const medidas = medidasDe(r);
  const precio = leerPesos(r.precio);
  const nombre = r.producto === 'otro' ? r.producto_otro.trim() || 'Otro' : nombreProducto(r);

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        {r.producto === 'otro' ? (
          <div className="flex-1">
            <label className="label" htmlFor={`${id}-otro`}>
              ¿Qué es?
            </label>
            <input
              id={`${id}-otro`}
              autoComplete="off"
              className={`field ${intentado && !r.producto_otro.trim() ? 'field-error' : ''}`}
              placeholder="Puff, cabecera, almohadones…"
              value={r.producto_otro}
              onChange={(e) => onCambiar({ producto_otro: e.target.value })}
            />
          </div>
        ) : (
          <p className="pt-2 font-display text-[1.0625rem] font-bold text-ink">{nombre}</p>
        )}
        <button type="button" className="btn-ghost shrink-0 px-3 text-sm" onClick={onQuitar}>
          <IconoX size={16} />
          Quitar
        </button>
      </div>

      <div className="mt-2 grid grid-cols-[auto_1fr] items-end gap-3">
        <div>
          <span className="label">Cantidad</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onCambiar({ cantidad: Math.max(1, r.cantidad - 1) })}
              disabled={r.cantidad <= 1}
              aria-label={`Uno menos de ${nombre}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sharp border border-brand-300 bg-white text-brand-800 transition-colors hover:bg-brand-50 disabled:opacity-40"
            >
              <IconoMenos size={20} />
            </button>
            <input
              type="number"
              min="1"
              max="999"
              value={r.cantidad}
              onChange={(e) =>
                onCambiar({ cantidad: Math.min(999, Math.max(1, Number(e.target.value) || 1)) })
              }
              aria-label={`Cantidad de ${nombre}`}
              className="field tabular h-11 w-16 px-1 text-center text-lg font-bold"
            />
            <button
              type="button"
              onClick={() => onCambiar({ cantidad: Math.min(999, r.cantidad + 1) })}
              aria-label={`Uno más de ${nombre}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sharp border border-brand-300 bg-white text-brand-800 transition-colors hover:bg-brand-50"
            >
              <IconoMas size={20} />
            </button>
          </div>
        </div>

        <div>
          <label className="label" htmlFor={`${id}-precio`}>
            {r.cantidad > 1 ? 'Precio de cada uno' : 'Precio'}
          </label>
          <input
            id={`${id}-precio`}
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            readOnly={r.medir}
            className={`field tabular text-right ${r.medir ? 'bg-brand-50' : ''} ${
              intentado && precio === null && !r.medir ? 'field-error' : ''
            }`}
            value={r.precio}
            onChange={(e) => onCambiar({ precio: e.target.value })}
          />
        </div>
      </div>

      {r.cantidad > 1 && precio !== null && (
        <p className="tabular mt-1 text-right text-sm text-slate-600">
          {r.cantidad} × {moneda(precio)} = {moneda(r.cantidad * precio)}
        </p>
      )}

      {r.producto === 'alfombra' &&
        (r.medir ? (
          <div className="mt-3 border border-brand-200 bg-brand-50 px-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor={`${id}-ancho`}>
                  Ancho (metros)
                </label>
                <input
                  id={`${id}-ancho`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="2,00"
                  className={`field tabular text-right ${
                    intentado && !medidaValida(leerDecimal(r.ancho)) ? 'field-error' : ''
                  }`}
                  value={r.ancho}
                  onChange={(e) => onCambiar({ ancho: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor={`${id}-largo`}>
                  Largo (metros)
                </label>
                <input
                  id={`${id}-largo`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="3,20"
                  className={`field tabular text-right ${
                    intentado && !medidaValida(leerDecimal(r.largo)) ? 'field-error' : ''
                  }`}
                  value={r.largo}
                  onChange={(e) => onCambiar({ largo: e.target.value })}
                />
              </div>
            </div>
            <p className="tabular mt-2 text-[0.9375rem] text-slate-700">
              {medidas
                ? `${decimal(medidas.a)} × ${decimal(medidas.l)} = ${decimal(
                    metrosCuadrados(medidas.a, medidas.l),
                  )} m² × ${moneda(precioM2)} = ${moneda(
                    precioAlfombra(medidas.a, medidas.l, precioM2),
                  )}`
                : `Se cobra a ${moneda(precioM2)} el metro cuadrado.`}
            </p>
            <button
              type="button"
              className="btn-ghost mt-2 px-3 text-sm"
              onClick={() => onCambiar({ medir: false, ancho: '', largo: '', precio_m2: null })}
            >
              <IconoX size={16} />
              Sacar las medidas y escribir el precio a mano
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost mt-2 px-3 text-sm" onClick={onMedir}>
            <IconoMas size={16} />
            Calcular el precio por medidas ({moneda(precioM2)} el m²)
          </button>
        ))}

      {problema && <p className="error-text">{problema}</p>}
    </li>
  );
}
