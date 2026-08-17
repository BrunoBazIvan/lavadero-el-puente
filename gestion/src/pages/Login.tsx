import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toaster';
import { PantallaCargando, Spinner } from '@/components/Estados';

/**
 * No se pide email: acá se entra con un usuario a secas ("rocio"). El dominio
 * interno se lo pega `emailDeUsuario()` antes de hablar con Supabase — mirá
 * `lib/usuarios.ts`. Lo único que se valida es que no venga vacío ni con
 * espacios; el resto lo dice la base, que es la que sabe.
 */
const esquemaIngreso = z.object({
  usuario: z
    .string()
    .min(1, 'Escribí tu usuario.')
    .refine((v) => !/\s/.test(v.trim()), 'El usuario va en una sola palabra, sin espacios.'),
  password: z.string().min(1, 'Escribí tu contraseña.'),
});
type FormIngreso = z.infer<typeof esquemaIngreso>;

export default function Login() {
  const { session, profile, cargando, motivoSalida, recuperandoPassword } = useAuth();
  const location = useLocation();

  if (cargando) return <PantallaCargando />;
  if (recuperandoPassword) return <Navigate to="/recuperar" replace />;

  if (session && profile) {
    const destino = (location.state as { desde?: string } | null)?.desde ?? '/';
    return <Navigate to={destino} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-900">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="font-display text-3xl font-bold uppercase tracking-wide text-white">
              El Puente
            </p>
            <p className="mt-1.5 font-display text-xs uppercase tracking-technical text-aqua-300">
              Sistema de gestión interna
            </p>
          </div>

          {motivoSalida && (
            <div className="mb-4 rounded-card border border-aviso/50 bg-white px-4 py-3">
              <p className="font-display text-xs font-semibold uppercase tracking-technical text-aviso">
                Atención
              </p>
              <p className="mt-1 text-sm leading-snug text-ink">{motivoSalida}</p>
            </div>
          )}

          <div className="panel p-6">
            <FormularioIngreso />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-brand-200">
            Uso interno del lavadero. Las cuentas las crea el administrador:
            <br />
            no hay registro público.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormularioIngreso() {
  const { ingresar } = useAuth();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormIngreso>({ resolver: zodResolver(esquemaIngreso) });

  const enviar = handleSubmit(async ({ usuario, password }) => {
    try {
      await ingresar(usuario, password);
    } catch (error) {
      toast.error(error);
    }
  });

  return (
    <form onSubmit={enviar} noValidate>
      <h1 className="mb-5 font-display text-2xl font-bold text-brand-900">Entrar</h1>

      <div className="mb-4">
        <label className="label" htmlFor="usuario">
          Usuario
        </label>
        <input
          id="usuario"
          type="text"
          // `username` igual que antes: así el navegador sigue ofreciendo lo
          // que ya tenía guardado en esa computadora.
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          placeholder="mostrador"
          className={`field ${errors.usuario ? 'field-error' : ''}`}
          {...register('usuario')}
        />
        {errors.usuario && <p className="error-text">{errors.usuario.message}</p>}
      </div>

      <div className="mb-6">
        <label className="label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={`field ${errors.password ? 'field-error' : ''}`}
          {...register('password')}
        />
        {errors.password && <p className="error-text">{errors.password.message}</p>}
      </div>

      <button type="submit" className="btn-primary btn-lg w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner size={16} />}
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>

      {/* Antes acá había un "Olvidé mi contraseña" que mandaba un mail. Las
          cuentas del mostrador no tienen casilla, así que ese mail no llegaba
          a ningún lado: un botón que no puede funcionar es peor que ninguno.
          La contraseña la repone un admin. */}
      <p className="mt-5 border-t border-brand-100 pt-4 text-center text-sm leading-relaxed text-slate-600">
        Si te olvidaste la contraseña, pedile a un admin que te ponga una nueva.
      </p>
    </form>
  );
}
