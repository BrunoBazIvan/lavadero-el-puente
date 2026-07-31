import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copiá .env.example a .env.local y completá los dos valores.',
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // La app no usa links con token en la URL salvo el de recuperar
    // contraseña, que sí se detecta.
    detectSessionInUrl: true,
  },
});

/**
 * Mensaje legible de un error de Supabase.
 *
 * Devuelve el texto real que manda Postgres —incluidos los `raise exception`
 * de nuestros triggers, que están escritos para que los lea la persona del
 * mostrador— en vez de un "algo salió mal".
 */
export function mensajeDeError(error: unknown): string {
  if (!error) return 'Error desconocido.';

  if (typeof error === 'object') {
    const e = error as { message?: string; details?: string; hint?: string; code?: string };

    // Violación de RLS: el mensaje crudo de Postgres no le dice nada a nadie.
    if (e.code === '42501' || e.message?.includes('row-level security')) {
      return 'No tenés permiso para hacer esto. Si creés que sí deberías, pedile a un admin que lo revise.';
    }
    if (e.code === '23505') {
      return 'Ese registro ya existe.';
    }
    if (e.message === 'Invalid login credentials') {
      return 'Email o contraseña incorrectos.';
    }
    if (e.message === 'Failed to fetch') {
      return 'No hay conexión con el servidor. Revisá internet y volvé a intentar.';
    }
    if (e.message) {
      return [e.message, e.details].filter(Boolean).join(' — ');
    }
  }

  return String(error);
}
