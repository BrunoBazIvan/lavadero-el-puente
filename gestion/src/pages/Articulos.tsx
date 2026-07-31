import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { BloqueCargando, EstadoError, EstadoVacio, Spinner } from '@/components/Estados';
import { useToast } from '@/components/Toaster';
import {
  useActualizarArticulo,
  useArticulos,
  useCrearArticulo,
  type DatosArticulo,
} from '@/hooks/useArticulos';
import { mensajeDeError } from '@/lib/supabase';
import type { Articulo } from '@/types/database';

export default function Articulos() {
  const [incluirInactivos, setIncluirInactivos] = useState(true);
  const [enEdicion, setEnEdicion] = useState<Articulo | null>(null);
  const [altaAbierta, setAltaAbierta] = useState(false);

  const { data: articulos, isPending, error, refetch } = useArticulos(incluirInactivos);

  return (
    <>
      <EncabezadoPagina
        titulo="Artículos"
        detalle="Lo que se puede marcar al recibir la ropa. El orden es el mismo en que aparecen los botones."
        acciones={
          <button type="button" className="btn-primary" onClick={() => setAltaAbierta(true)}>
            + Artículo nuevo
          </button>
        }
      />

      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 px-4 py-3">
          <p className="text-sm text-slate-600">{articulos?.length ?? 0} artículos</p>
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

        {isPending && <BloqueCargando texto="Cargando artículos…" />}

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
                  <th className="w-40 px-4 py-2 font-display font-semibold">Se cuenta</th>
                  <th className="w-24 px-4 py-2 text-right font-display font-semibold">Orden</th>
                  <th className="w-48 px-4 py-2 text-right font-display font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {articulos.map((a) => (
                  <FilaArticulo key={a.id} articulo={a} onEditar={() => setEnEdicion(a)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        abierto={altaAbierta}
        onCerrar={() => setAltaAbierta(false)}
        titulo="Artículo nuevo"
        detalle="Va a aparecer como botón al recibir la ropa."
      >
        <FormularioArticulo
          existentes={articulos ?? []}
          onCancelar={() => setAltaAbierta(false)}
          onGuardado={() => setAltaAbierta(false)}
        />
      </Modal>

      <Modal
        abierto={enEdicion !== null}
        onCerrar={() => setEnEdicion(null)}
        titulo="Editar artículo"
        detalle="Las órdenes ya cargadas conservan el nombre que tenían."
      >
        {enEdicion && (
          <FormularioArticulo
            articulo={enEdicion}
            existentes={articulos ?? []}
            onCancelar={() => setEnEdicion(null)}
            onGuardado={() => setEnEdicion(null)}
          />
        )}
      </Modal>
    </>
  );
}

function FilaArticulo({ articulo, onEditar }: { articulo: Articulo; onEditar: () => void }) {
  const actualizar = useActualizarArticulo();

  return (
    <tr className={articulo.activo ? '' : 'bg-slate-50 text-slate-500'}>
      <td className="px-4 py-2.5">
        <span className={articulo.activo ? 'font-medium text-ink' : ''}>{articulo.nombre}</span>
        {!articulo.activo && (
          <span className="ml-2 chip border-slate-300 bg-slate-100 text-slate-600">Desactivado</span>
        )}
      </td>

      <td className="px-4 py-2.5 text-slate-700">
        {articulo.lleva_cantidad ? 'Con cantidad' : 'Solo se marca'}
      </td>

      <td className="px-4 py-2.5 text-right tabular text-slate-500">{articulo.orden_visual}</td>

      <td className="px-4 py-2.5">
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
  orden_visual: z.coerce.number({ invalid_type_error: 'Poné un número.' }).int(),
  lleva_cantidad: z.boolean(),
  activo: z.boolean(),
});

type FormArticulo = z.input<typeof esquemaArticulo>;

function FormularioArticulo({
  articulo,
  existentes,
  onGuardado,
  onCancelar,
}: {
  articulo?: Articulo;
  /** Para calcular dónde va el artículo nuevo. */
  existentes: Articulo[];
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const toast = useToast();
  const crear = useCrearArticulo();
  const actualizar = useActualizarArticulo();

  /** El nuevo va al final: un 0 lo mandaría al principio de la lista. */
  const ordenSugerido = useMemo(
    () => Math.max(0, ...existentes.map((a) => a.orden_visual)) + 10,
    [existentes],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormArticulo>({
    resolver: zodResolver(esquemaArticulo),
    defaultValues: {
      nombre: articulo?.nombre ?? '',
      orden_visual: articulo?.orden_visual ?? ordenSugerido,
      lleva_cantidad: articulo?.lleva_cantidad ?? true,
      activo: articulo?.activo ?? true,
    },
  });

  const enviar = handleSubmit(async (valores) => {
    const datos: DatosArticulo = {
      nombre: String(valores.nombre),
      orden_visual: Number(valores.orden_visual),
      lleva_cantidad: Boolean(valores.lleva_cantidad),
      activo: Boolean(valores.activo),
    };

    try {
      if (articulo) {
        await actualizar.mutateAsync({ id: articulo.id, datos });
        toast.ok('Artículo actualizado.');
      } else {
        await crear.mutateAsync(datos);
        toast.ok(`"${datos.nombre}" agregado.`);
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
            placeholder="Frazada, cortina…"
            {...register('nombre')}
          />
          {errors.nombre && <p className="error-text">{errors.nombre.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="orden_visual">
            Orden
          </label>
          <input
            id="orden_visual"
            type="number"
            step="10"
            className={`field text-right tabular ${errors.orden_visual ? 'field-error' : ''}`}
            {...register('orden_visual')}
          />
          {errors.orden_visual && <p className="error-text">{errors.orden_visual.message}</p>}
          <p className="mt-1 text-xs text-slate-500">De menor a mayor: 10, 20, 30…</p>
        </div>

        <div className="space-y-3 pt-7">
          <label className="flex select-none items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded-sharp border-brand-300 text-brand-800 focus:ring-aqua-500"
              {...register('lleva_cantidad')}
            />
            <span>
              Se cuenta
              <span className="block text-xs text-slate-500">
                Sin marcar, se marca sin número — como la ropa suelta.
              </span>
            </span>
          </label>

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
