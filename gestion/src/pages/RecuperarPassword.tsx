import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toaster';
import { PantallaCargando, Spinner } from '@/components/Estados';

const esquema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres.'),
    repetir: z.string().min(1, 'Repetí la contraseña.'),
  })
  .refine((v) => v.password === v.repetir, {
    message: 'Las dos contraseñas tienen que ser iguales.',
    path: ['repetir'],
  });

type Form = z.infer<typeof esquema>;

/**
 * Pantalla a la que cae un link de recuperación de contraseña. Supabase abre
 * una sesión de tipo recovery que solo sirve para esto.
 *
 * La app ya no pide esos links: las cuentas del mostrador no tienen casilla
 * (`lib/usuarios.ts`), así que el mail no llegaría a ningún lado. Esto queda
 * en pie para las cuentas que sí tienen email de verdad, cuando el link se
 * manda a mano desde el dashboard de Supabase — es la única salida si un admin
 * se queda afuera de su propia cuenta.
 */
export default function RecuperarPassword() {
  const { session, cargando, recuperandoPassword, cambiarPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(esquema) });

  if (cargando) return <PantallaCargando />;

  // Sin sesión de recuperación no hay nada que hacer acá.
  if (!recuperandoPassword && !session) return <Navigate to="/login" replace />;

  const enviar = handleSubmit(async ({ password }) => {
    try {
      await cambiarPassword(password);
      toast.ok('Contraseña actualizada.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-7 text-center font-display text-2xl font-bold uppercase tracking-wide text-white">
          El Puente
        </p>

        <form onSubmit={enviar} className="panel p-6" noValidate>
          <h1 className="mb-5 font-display text-lg font-bold text-brand-900">Contraseña nueva</h1>

          <div className="mb-4">
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              className={`field ${errors.password ? 'field-error' : ''}`}
              {...register('password')}
            />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <div className="mb-6">
            <label className="label" htmlFor="repetir">
              Repetila
            </label>
            <input
              id="repetir"
              type="password"
              autoComplete="new-password"
              className={`field ${errors.repetir ? 'field-error' : ''}`}
              {...register('repetir')}
            />
            {errors.repetir && <p className="error-text">{errors.repetir.message}</p>}
          </div>

          <button type="submit" className="btn-primary btn-lg w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner size={16} />}
            {isSubmitting ? 'Guardando…' : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
