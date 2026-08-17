import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { emailDeUsuario } from '@/lib/usuarios';
import type { Profile } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  cargando: boolean;
  /** Motivo por el que se cerró la sesión sola (perfil dado de baja, por ejemplo). */
  motivoSalida: string | null;
  /** true mientras Supabase tiene una sesión de recuperación de contraseña. */
  recuperandoPassword: boolean;
  esAdmin: boolean;
  /** El usuario tal cual se escribe en la pantalla de entrada: "rocio", sin arroba. */
  ingresar: (usuario: string, password: string) => Promise<void>;
  salir: () => Promise<void>;
  cambiarPassword: (password: string) => Promise<void>;
  limpiarMotivoSalida: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cargando, setCargando] = useState(true);
  const [motivoSalida, setMotivoSalida] = useState<string | null>(null);
  const [recuperandoPassword, setRecuperandoPassword] = useState(false);

  // Evita pisar estado si el componente se desmonta a mitad de un fetch.
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  /**
   * Trae el perfil del usuario logueado.
   *
   * Un usuario de Auth sin perfil activo no puede operar: la RLS le va a
   * negar todo (`is_staff()` da false). En vez de dejarlo entrar a una app
   * que le devuelve errores en cada pantalla, lo sacamos acá con un motivo.
   */
  const cargarProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('No se pudo leer el perfil:', error);
      return null;
    }
    return data;
  }, []);

  const aplicarSesion = useCallback(
    async (nueva: Session | null) => {
      if (!nueva) {
        if (!vivo.current) return;
        setSession(null);
        setProfile(null);
        return;
      }

      const perfil = await cargarProfile(nueva.user.id);
      if (!vivo.current) return;

      if (!perfil) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setMotivoSalida(
          'Tu usuario existe pero no tiene perfil en el sistema. Pedile a un admin que lo cree.',
        );
        return;
      }

      if (!perfil.activo) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setMotivoSalida('Tu usuario está dado de baja. Hablá con un admin.');
        return;
      }

      setSession(nueva);
      setProfile(perfil);
    },
    [cargarProfile],
  );

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => aplicarSesion(data.session))
      .finally(() => {
        if (vivo.current) setCargando(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((evento, nueva) => {
      if (evento === 'PASSWORD_RECOVERY') {
        setRecuperandoPassword(true);
        setSession(nueva);
        setCargando(false);
        return;
      }
      if (evento === 'TOKEN_REFRESHED') {
        setSession(nueva);
        return;
      }
      void aplicarSesion(nueva).finally(() => {
        if (vivo.current) setCargando(false);
      });
    });

    return () => sub.subscription.unsubscribe();
  }, [aplicarSesion]);

  const ingresar = useCallback(async (usuario: string, password: string) => {
    setMotivoSalida(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailDeUsuario(usuario),
      password,
    });
    if (error) throw error;
  }, []);

  const salir = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRecuperandoPassword(false);
  }, []);

  const cambiarPassword = useCallback(
    async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setRecuperandoPassword(false);
      const { data } = await supabase.auth.getSession();
      await aplicarSesion(data.session);
    },
    [aplicarSesion],
  );

  const valor = useMemo<AuthState>(
    () => ({
      session,
      profile,
      cargando,
      motivoSalida,
      recuperandoPassword,
      esAdmin: profile?.rol === 'admin',
      ingresar,
      salir,
      cambiarPassword,
      limpiarMotivoSalida: () => setMotivoSalida(null),
    }),
    [session, profile, cargando, motivoSalida, recuperandoPassword, ingresar, salir, cambiarPassword],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() tiene que usarse dentro de <AuthProvider>.');
  return ctx;
}
