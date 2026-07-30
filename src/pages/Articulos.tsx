import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { BloqueCargando, EstadoError, EstadoVacio, Spinner } from '@/components/Estados';
import { useToast } from '@/components/Toaster';
import {
  agruparPorCategoria,
  useActualizarArticulo,
  useArticulos,
  useCrearArticulo,
  type DatosArticulo,
} from '@/hooks/useArticulos';
import { mensajeDeError } from '@/lib/supabase';
import { moneda } from '@/lib/format';
import type { Articulo } from '@/types/database';

export default function Articulos() {
  const [incluirInactivos, setIncluirInactivos] = useState(true);
  const [enEdicion, setEnEdicion] = useState<Articulo | null>(null);
  const [altaAbierta, setAltaAbierta] = useState(false);

  const { data: articulos, isPending, error, refetch } = useArticulos(incluirInactivos);

  const grupos = useMemo(() => agruparPorCategoria(articulos ?? []), [articulos]);
  const categorias = useMemo(
    () => [...new Set((articulos ?? []).map((a) => a.categoria).filter(Boolean))] as string[],
    [articulos],
  );
  const sinPrecio = (articulos ?? []).filter((a) => a.activo && Number(a.precio_unitario) === 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Artículos"
        detalle="La lista de precios que se usa al cargar una orden. El precio queda congelado en cada orden, así que cambiarlo acá no toca las órdenes viejas."
        acciones={
          <button type="button" className="btn-primary" onClick={() => setAltaAbierta(true)}>
            + Artículo nuevo
          </button>
        }
      />

      {sinPrecio.length > 0 && (
        <div className="mb-5 rounded-card border border-aviso/50 bg-white px-4 py-3">
          <p className="font-display text-xs font-semibold uppercase tracking-technical text-aviso">
            Faltan precios
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Hay <span className="font-semibold">{sinPrecio.length}</span> artículos activos en $ 0.
            Escribí el precio en la columna y salí del campo: se guarda solo. Con Enter saltás al
            siguiente.
          </p>
        </div>
      )}

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 px-4 py-3">
          <p className="text-sm text-slate-600">
            {articulos?.length ?? 0} artículos · {grupos.length} categorías
          </p>
          <label className="flex select-none items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-sharp border-brand-300 text-brand-800 focus:ring-aqua-500"
              checked={incluirInactivos}
              onChange={(e) => setIncluirInactivos(e.target.checked)}
            />
            Mostrar desactivados
          </label>
        </div>

        {isPending && <BloqueCargando texto="Cargando lista de precios…" />}

        {error ? (
          <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
        ) : null}

        {articulos && articulos.length === 0 && (
          <EstadoVacio
            titulo="No hay artículos"
            detalle="Corré el seed.sql o cargá el primero a mano."
            accion={
              <button type="button" className="btn-primary" onClick={() => setAltaAbierta(true)}>
                + Artículo nuevo
              </button>
            }
          />
        )}

        {articulos && articulos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-display font-semibold">Artículo</th>
                  <th className="w-40 px-4 py-2 text-right font-display font-semibold">Precio</th>
                  <th className="w-24 px-4 py-2 text-right font-display font-semibold">Orden</th>
                  <th className="w-48 px-4 py-2 text-right font-display font-semibold">Acciones</th>
                </tr>
              </thead>

              {grupos.map(([categoria, items]) => (
                <tbody key={categoria} className="divide-y divide-brand-100">
                  <tr className="bg-brand-50">
                    <td colSpan={4} className="px-4 py-1.5">
                      <span className="eyebrow">{categoria}</span>
                    </td>
                  </tr>
                  {items.map((a) => (
                    <FilaArticulo key={a.id} articulo={a} onEditar={() => setEnEdicion(a)} />
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </div>

      <Modal
        abierto={altaAbierta}
        onCerrar={() => setAltaAbierta(false)}
        titulo="Artículo nuevo"
        detalle="Va a aparecer como botón en la carga de órdenes."
      >
        <FormularioArticulo
          categorias={categorias}
          existentes={articulos ?? []}
          onCancelar={() => setAltaAbierta(false)}
          onGuardado={() => setAltaAbierta(false)}
        />
      </Modal>

      <Modal
        abierto={enEdicion !== null}
        onCerrar={() => setEnEdicion(null)}
        titulo="Editar artículo"
        detalle="Las órdenes ya cargadas conservan el nombre y el precio que tenían."
      >
        {enEdicion && (
          <FormularioArticulo
            articulo={enEdicion}
            categorias={categorias}
            existentes={articulos ?? []}
            onCancelar={() => setEnEdicion(null)}
            onGuardado={() => setEnEdicion(null)}
          />
        )}
      </Modal>
    </>
  );
}

/* ── Fila con precio editable en el lugar ─────────────────────────────────────
 *  La tarea real de esta pantalla es cargar treinta precios de una sentada, así
 *  que el precio se edita en la propia tabla: se guarda al salir del campo y
 *  con Enter se salta al siguiente.
 * ────────────────────────────────────────────────────────────────────────── */

function FilaArticulo({ articulo, onEditar }: { articulo: Articulo; onEditar: () => void }) {
  const actualizar = useActualizarArticulo();
  const [valor, setValor] = useState(String(Number(articulo.precio_unitario)));
  const [recienGuardado, setRecienGuardado] = useState(false);
  const temporizador = useRef<number>();
  /**
   * Escape descarta. Va en un ref y no en el estado porque `blur()` dispara el
   * guardado en el acto: un `setValor` todavía no se aplicó cuando corre
   * `guardarPrecio`, y terminaría guardando justo lo que se quiso descartar.
   */
  const descartar = useRef(false);

  const original = String(Number(articulo.precio_unitario));
  const sinPrecio = Number(articulo.precio_unitario) === 0;

  const guardarPrecio = async () => {
    if (descartar.current) {
      descartar.current = false;
      setValor(original);
      return;
    }

    const limpio = valor.trim().replace(',', '.');
    const numero = Number(limpio);

    if (limpio === '' || Number.isNaN(numero) || numero < 0) {
      setValor(original); // Entrada inválida: volvemos a lo que había.
      return;
    }
    if (numero === Number(articulo.precio_unitario)) return;

    try {
      await actualizar.mutateAsync({ id: articulo.id, datos: { precio_unitario: numero } });
      setRecienGuardado(true);
      window.clearTimeout(temporizador.current);
      temporizador.current = window.setTimeout(() => setRecienGuardado(false), 1800);
    } catch {
      // El toast lo muestra el manejador global de React Query.
      setValor(original);
    }
  };

  /** Enter guarda y baja al precio siguiente, para cargar la lista de corrido. */
  const alTeclado = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      descartar.current = true;
      setValor(original);
      e.currentTarget.blur();
      return;
    }
    if (e.key !== 'Enter') return;

    e.preventDefault();
    const campos = [...document.querySelectorAll<HTMLInputElement>('input[data-precio]')];
    const siguiente = campos[campos.indexOf(e.currentTarget) + 1];
    e.currentTarget.blur(); // dispara el guardado
    siguiente?.focus();
    siguiente?.select();
  };

  return (
    <tr className={articulo.activo ? '' : 'bg-slate-50 text-slate-500'}>
      <td className="px-4 py-2">
        <span className={articulo.activo ? 'font-medium text-ink' : ''}>{articulo.nombre}</span>
        {!articulo.activo && (
          <span className="ml-2 chip border-slate-300 bg-slate-100 text-slate-600">Desactivado</span>
        )}
      </td>

      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-2">
          {actualizar.isPending && <Spinner size={14} className="text-brand-500" />}
          {recienGuardado && !actualizar.isPending && (
            <span className="font-display text-[11px] font-semibold uppercase tracking-wide text-ok">
              Guardado
            </span>
          )}
          <span className="text-slate-400">$</span>
          <input
            data-precio
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => void guardarPrecio()}
            onKeyDown={alTeclado}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={`Precio de ${articulo.nombre}`}
            className={`w-24 rounded-sharp border border-brand-200 px-2 py-1 text-right tabular text-sm text-ink
              focus:border-aqua-500 focus:outline-none focus:ring-1 focus:ring-aqua-500
              ${sinPrecio ? 'bg-amber-50' : 'bg-white'}`}
          />
        </div>
      </td>

      <td className="px-4 py-2 text-right tabular text-slate-500">{articulo.orden_visual}</td>

      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-1">
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onEditar}>
            Editar
          </button>
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-xs"
            disabled={actualizar.isPending}
            onClick={() =>
              void actualizar
                .mutateAsync({ id: articulo.id, datos: { activo: !articulo.activo } })
                .catch(() => {
                  // Ya lo avisó el manejador global.
                })
            }
          >
            {articulo.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Alta y edición ───────────────────────────────────────────────────────── */

const esquemaArticulo = z.object({
  nombre: z.string().trim().min(2, 'Escribí el nombre del artículo.'),
  categoria: z.string().trim().optional().or(z.literal('')),
  precio_unitario: z.coerce
    .number({ invalid_type_error: 'Poné un número.' })
    .min(0, 'El precio no puede ser negativo.'),
  orden_visual: z.coerce.number({ invalid_type_error: 'Poné un número.' }).int(),
  activo: z.boolean(),
});

type FormArticulo = z.input<typeof esquemaArticulo>;

function FormularioArticulo({
  articulo,
  categorias,
  existentes,
  onGuardado,
  onCancelar,
}: {
  articulo?: Articulo;
  categorias: string[];
  /** Para calcular dónde va el artículo nuevo dentro de su categoría. */
  existentes: Articulo[];
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const toast = useToast();
  const crear = useCrearArticulo();
  const actualizar = useActualizarArticulo();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormArticulo>({
    resolver: zodResolver(esquemaArticulo),
    defaultValues: {
      nombre: articulo?.nombre ?? '',
      categoria: articulo?.categoria ?? '',
      precio_unitario: articulo ? Number(articulo.precio_unitario) : 0,
      orden_visual: articulo?.orden_visual ?? 0,
      activo: articulo?.activo ?? true,
    },
  });

  const enviar = handleSubmit(async (valores) => {
    const categoria = (valores.categoria as string)?.trim() || null;

    /**
     * Un artículo nuevo va al final de su categoría.
     *
     * Dejarlo en 0 no es neutro: como el orden de la categoría lo marca su
     * artículo más bajo, un 0 le pasa la categoría entera al principio de la
     * lista y del alta de órdenes.
     */
    let orden = Number(valores.orden_visual);
    if (!articulo && orden === 0) {
      const enCategoria = existentes.filter(
        (a) => (a.categoria?.trim() || null) === categoria,
      );
      orden = enCategoria.length
        ? Math.max(...enCategoria.map((a) => a.orden_visual)) + 10
        : Math.max(0, ...existentes.map((a) => a.orden_visual)) + 10;
    }

    const datos: DatosArticulo = {
      nombre: String(valores.nombre),
      categoria,
      precio_unitario: Number(valores.precio_unitario),
      orden_visual: orden,
      activo: Boolean(valores.activo),
    };

    try {
      if (articulo) {
        await actualizar.mutateAsync({ id: articulo.id, datos });
        toast.ok('Artículo actualizado.');
      } else {
        await crear.mutateAsync(datos);
        toast.ok(`"${datos.nombre}" agregado a la lista.`);
      }
      onGuardado();
    } catch {
      // El toast lo muestra el manejador global de React Query.
    }
  });

  return (
    <form onSubmit={enviar} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            className={`field ${errors.nombre ? 'field-error' : ''}`}
            autoComplete="off"
            {...register('nombre')}
          />
          {errors.nombre && <p className="error-text">{errors.nombre.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="categoria">
            Categoría
          </label>
          <input
            id="categoria"
            list="categorias-existentes"
            className="field"
            autoComplete="off"
            placeholder="Prendas, Ropa de cama…"
            {...register('categoria')}
          />
          <datalist id="categorias-existentes">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="label" htmlFor="precio_unitario">
            Precio ($)
          </label>
          <input
            id="precio_unitario"
            type="number"
            min="0"
            step="1"
            className={`field text-right tabular ${errors.precio_unitario ? 'field-error' : ''}`}
            {...register('precio_unitario')}
          />
          {errors.precio_unitario && (
            <p className="error-text">{errors.precio_unitario.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="orden_visual">
            Orden dentro de la categoría
          </label>
          <input
            id="orden_visual"
            type="number"
            step="10"
            className={`field text-right tabular ${errors.orden_visual ? 'field-error' : ''}`}
            {...register('orden_visual')}
          />
          {errors.orden_visual && <p className="error-text">{errors.orden_visual.message}</p>}
          <p className="mt-1 text-xs text-slate-500">
            De menor a mayor, dejando huecos: 10, 20, 30… También decide en qué lugar va la
            categoría, según su número más bajo.
            {!articulo && ' En 0, el artículo se agrega al final de su categoría.'}
          </p>
        </div>

        <div className="flex items-end pb-2">
          <label className="flex select-none items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-sharp border-brand-300 text-brand-800 focus:ring-aqua-500"
              {...register('activo')}
            />
            Activo
          </label>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner size={16} />}
          {articulo ? 'Guardar cambios' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

/** Precio formateado, por si hace falta fuera de la tabla. */
export function PrecioArticulo({ articulo }: { articulo: Articulo }) {
  return <span className="tabular">{moneda(articulo.precio_unitario)}</span>;
}
