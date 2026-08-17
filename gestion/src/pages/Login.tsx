import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toaster';
import { PantallaCargando, Spinner } from '@/components/Estados';

const esquemaIngreso = z.object({
  email: z.string().min(1, 'Escribí tu email.').email('Ese email no parece válido.'),
  password: z.string().min(1, 'Escribí tu contraseña.'),
});
type FormIngreso = z.infer<typeof esquemaIngreso>;

const esquemaRecordar = z.object({
  email: z.string().min(1, 'Escribí tu email.').email('Ese email no parece válido.'),
});
type FormRecordar = z.infer<typeof esquemaRecordar>;

export default function Login() {
  const { session, profile, cargando, motivoSalida, recuperandoPassword } = useAuth();
  const location = useLocation();
  const [modo, setModo] = useState<'ingreso' | 'recordar'>('ingreso');

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
            {modo === 'ingreso' ? (
              <FormularioIngreso onOlvide={() => setModo('recordar')} />
            ) : (
              <FormularioRecordar onVolver={() => setModo('ingreso')} />
            )}
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

function FormularioIngreso({ onOlvide }: { onOlvide: () => void }) {
  const { ingresar } = useAuth();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormIngreso>({ resolver: zodResolver(esquemaIngreso) });

  const enviar = handleSubmit(async ({ email, password }) => {
    try {
      await ingresar(email, password);
    } catch (error) {
      toast.error(error);
    }
  });

  return (
    <form onSubmit={enviar} noValidate>
      <h1 className="mb-5 font-display text-2xl font-bold text-brand-900">Entrar</h1>

      <div className="mb-4">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          className={`field ${errors.email ? 'field-error' : ''}`}
          {...register('email')}
        />
        {errors.email && <p className="error-text">{errors.email.message}</p>}
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

      <button
        type="button"
        onClick={onOlvide}
        className="mt-4 w-full text-center text-sm text-brand-600 underline underline-offset-2 hover:text-brand-800"
      >
        Olvidé mi contraseña
      </button>
    </form>
  );
}

function FormularioRecordar({ onVolver }: { onVolver: () => void }) {
  const { recordarPassword } = useAuth();
  const toast = useToast();
  const [enviado, setEnviado] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormRecordar>({ resolver: zodResolver(esquemaRecordar) });

  const enviar = handleSubmit(async ({ email }) => {
    try {
      await recordarPassword(email);
      setEnviado(true);
    } catch (error) {
      toast.error(error);
    }
  });

  if (enviado) {
    return (
      <div>
        <h1 className="mb-3 font-display text-2xl font-bold text-brand-900">Revisá tu correo</h1>
        <p className="text-sm leading-relaxed text-slate-700">
          Si ese email tiene una cuenta, te llega un link para poner una contraseña nueva. Puede
          tardar unos minutos y a veces cae en correo no deseado.
        </p>
        <button type="button" onClick={onVolver} className="btn-secondary mt-5 w-full">
          Volver
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <h1 className="mb-2 font-display text-2xl font-bold text-brand-900">Recuperar contraseña</h1>
      <p className="mb-5 text-sm text-slate-600">Te mandamos un link para cambiarla.</p>

      <div className="mb-6">
        <label className="label" htmlFor="email-recordar">
          Email
        </label>
        <input
          id="email-recordar"
          type="email"
          autoComplete="username"
          autoFocus
          className={`field ${errors.email ? 'field-error' : ''}`}
          {...register('email')}
        />
        {errors.email && <p className="error-text">{errors.email.message}</p>}
      </div>

      <button type="submit" className="btn-primary btn-lg w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner size={16} />}
        {isSubmitting ? 'Enviando…' : 'Enviar link'}
      </button>

      <button
        type="button"
        onClick={onVolver}
        className="mt-4 w-full text-center text-sm text-brand-600 underline underline-offset-2 hover:text-brand-800"
      >
        Volver
      </button>
    </form>
  );
}
