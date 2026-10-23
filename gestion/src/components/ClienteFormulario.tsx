import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinkCliente } from '@/components/LinkCliente';
import { Spinner } from '@/components/Estados';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toaster';
import {
  useActualizarCliente,
  useClientePorTelefono,
  useCrearCliente,
  type DatosCliente,
} from '@/hooks/useClientes';
import { telefono as formatearTelefono, telefonoValido } from '@/lib/format';
import type { Cliente } from '@/types/database';

/**
 * Formulario de cliente. Se usa en dos lados:
 *   · la pantalla de clientes, completo, dentro de un modal;
 *   · el alta de orden (etapa 5), en modo compacto, sin cambiar de pantalla.
 */

export const esquemaCliente = z
  .object({
    nombre: z.string().trim().min(2, 'Escribí el nombre.'),
    telefono: z
      .string()
      .trim()
      .refine(
        (v) => !v || telefonoValido(v),
        'Ese teléfono no parece válido. Si es de otro país, empezalo con + y el código.',
      )
      .optional()
      .or(z.literal('')),
    email: z.string().trim().email('Ese email no parece válido.').optional().or(z.literal('')),
    tipo: z.enum(['particular', 'empresa']),
    razon_social: z.string().trim().optional().or(z.literal('')),
    rut: z
      .string()
      .trim()
      .refine((v) => !v || /^\d{12}$/.test(v.replace(/\D/g, '')), 'El RUT tiene 12 dígitos.')
      .optional()
      .or(z.literal('')),
    direccion: z.string().trim().optional().or(z.literal('')),
    notas: z.string().trim().optional().or(z.literal('')),
  })
  .refine((v) => v.tipo !== 'empresa' || Boolean(v.razon_social), {
    message: 'Poné la razón social de la empresa.',
    path: ['razon_social'],
  });

export type FormCliente = z.infer<typeof esquemaCliente>;

function aDatos(v: FormCliente): DatosCliente {
  return {
    nombre: v.nombre,
    telefono: v.telefono || null,
    email: v.email || null,
    tipo: v.tipo,
    razon_social: v.razon_social || null,
    rut: v.rut || null,
    direccion: v.direccion || null,
    notas: v.notas || null,
  };
}

interface Props {
  /** Si viene, el formulario edita ese cliente. Si no, da uno de alta. */
  cliente?: Cliente;
  /** Solo nombre y teléfono: para el alta al vuelo desde una orden. */
  compacto?: boolean;
  /** Nombre precargado, por ejemplo lo que ya venía escrito en el buscador. */
  nombreInicial?: string;
  onGuardado: (cliente: Cliente) => void;
  onCancelar?: () => void;
}

export function ClienteFormulario({
  cliente,
  compacto = false,
  nombreInicial,
  onGuardado,
  onCancelar,
}: Props) {
  const toast = useToast();
  const crear = useCrearCliente();
  const actualizar = useActualizarCliente();

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormCliente>({
    resolver: zodResolver(esquemaCliente),
    defaultValues: {
      nombre: cliente?.nombre ?? nombreInicial ?? '',
      telefono: cliente?.telefono ?? '',
      email: cliente?.email ?? '',
      tipo: cliente?.tipo ?? 'particular',
      razon_social: cliente?.razon_social ?? '',
      rut: cliente?.rut ?? '',
      direccion: cliente?.direccion ?? '',
      notas: cliente?.notas ?? '',
    },
  });

  const tipo = watch('tipo');
  const telefonoEscrito = watch('telefono');

  // Aviso de duplicado: el mismo número ya cargado en otro cliente.
  const { data: mismoTelefono } = useClientePorTelefono(telefonoEscrito ?? null);
  const duplicados = (mismoTelefono ?? []).filter((c) => c.id !== cliente?.id);

  // "Seguir sin teléfono" guarda por fuera del submit: isSubmitting no lo ve.
  const guardando = isSubmitting || crear.isPending || actualizar.isPending;

  // Valores ya validados que esperan que confirmen guardar sin teléfono.
  const [sinTelefono, setSinTelefono] = useState<FormCliente | null>(null);

  const guardar = async (valores: FormCliente) => {
    try {
      const datos = aDatos(valores);
      const guardado = cliente
        ? await actualizar.mutateAsync({ id: cliente.id, datos })
        : await crear.mutateAsync(datos);

      toast.ok(cliente ? 'Cliente actualizado.' : `Cliente "${guardado.nombre}" dado de alta.`);
      onGuardado(guardado);
    } catch {
      // El error ya lo mostró el manejador global de React Query (App.tsx).
      // Acá solo cortamos: el formulario queda abierto con lo que escribieron.
    }
  };

  const enviar = handleSubmit(async (valores) => {
    // Sin teléfono no hay cómo avisar que la ropa está pronta: se pregunta
    // antes. Solo al darlo de alta o al borrárselo; si ya venía sin teléfono,
    // editarle otra cosa no vuelve a preguntar.
    if (!valores.telefono && (!cliente || cliente.telefono)) {
      setSinTelefono(valores);
      return;
    }
    await guardar(valores);
  });

  const cargarTelefono = () => {
    setSinTelefono(null);
    // Después de que el modal devuelva el foco a donde estaba.
    setTimeout(() => setFocus('telefono'), 0);
  };

  const seguirSinTelefono = async () => {
    const valores = sinTelefono;
    setSinTelefono(null);
    if (valores) await guardar(valores);
  };

  return (
    <>
      <form onSubmit={enviar} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={compacto ? '' : 'sm:col-span-2'}>
            <label className="label" htmlFor="nombre">
              Nombre {compacto && <span className="text-alerta">*</span>}
            </label>
            <input
              id="nombre"
              className={`field ${errors.nombre ? 'field-error' : ''}`}
              autoFocus
              autoComplete="off"
              {...register('nombre')}
            />
            {errors.nombre && <p className="error-text">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="telefono">
              Teléfono
            </label>
            <input
              id="telefono"
              inputMode="tel"
              placeholder="099 123 456"
              className={`field ${errors.telefono ? 'field-error' : ''}`}
              autoComplete="off"
              {...register('telefono')}
            />
            {errors.telefono ? (
              <p className="error-text">{errors.telefono.message}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Si es de otro país: con + y el código.</p>
            )}
            {duplicados.length > 0 && (
              <p className="mt-1 text-sm text-aviso">
                Ese teléfono ya lo tiene{' '}
                {duplicados.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && ', '}
                    <LinkCliente
                      id={c.id}
                      className="font-semibold"
                      claseLink="underline underline-offset-2"
                    >
                      {c.nombre}
                    </LinkCliente>
                  </span>
                ))}
                .
              </p>
            )}
          </div>

          {!compacto && (
            <>
              <div>
                <label className="label" htmlFor="tipo">
                  Tipo
                </label>
                <select id="tipo" className="field" {...register('tipo')}>
                  <option value="particular">Particular</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={`field ${errors.email ? 'field-error' : ''}`}
                  autoComplete="off"
                  {...register('email')}
                />
                {errors.email && <p className="error-text">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="direccion">
                  Dirección
                </label>
                <input
                  id="direccion"
                  className="field"
                  autoComplete="off"
                  {...register('direccion')}
                />
              </div>

              {tipo === 'empresa' && (
                <>
                  <div>
                    <label className="label" htmlFor="razon_social">
                      Razón social
                    </label>
                    <input
                      id="razon_social"
                      className={`field ${errors.razon_social ? 'field-error' : ''}`}
                      autoComplete="off"
                      {...register('razon_social')}
                    />
                    {errors.razon_social && (
                      <p className="error-text">{errors.razon_social.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="rut">
                      RUT
                    </label>
                    <input
                      id="rut"
                      inputMode="numeric"
                      className={`field ${errors.rut ? 'field-error' : ''}`}
                      autoComplete="off"
                      {...register('rut')}
                    />
                    {errors.rut && <p className="error-text">{errors.rut.message}</p>}
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="label" htmlFor="notas">
                  Notas
                </label>
                <textarea id="notas" rows={2} className="field resize-y" {...register('notas')} />
              </div>
            </>
          )}
        </div>

        {compacto && (
          <p className="mt-3 text-xs text-slate-500">
            Después podés completar el resto de los datos desde la ficha del cliente.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          {onCancelar && (
            <button type="button" className="btn-secondary" onClick={onCancelar}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando && <Spinner size={16} />}
            {cliente ? 'Guardar cambios' : 'Dar de alta'}
          </button>
        </div>
      </form>

      <Modal
        abierto={sinTelefono !== null}
        onCerrar={cargarTelefono}
        titulo="Este cliente se está cargando sin teléfono"
        ancho="sm"
      >
        <p className="leading-relaxed text-slate-700">
          Sin teléfono no le vas a poder avisar por WhatsApp cuando la ropa esté pronta. ¿Seguro que
          querés seguir?
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => void seguirSinTelefono()}>
            Seguir sin teléfono
          </button>
          <button type="button" className="btn-primary" onClick={cargarTelefono}>
            Cargar el teléfono
          </button>
        </div>
      </Modal>
    </>
  );
}

/** Línea de datos de contacto, reutilizada en la ficha y en el detalle de orden. */
export function ContactoCliente({ cliente }: { cliente: Cliente }) {
  return (
    <span className="text-sm text-slate-600">
      {cliente.telefono ? formatearTelefono(cliente.telefono) : 'Sin teléfono'}
      {cliente.email ? ` · ${cliente.email}` : ''}
    </span>
  );
}
