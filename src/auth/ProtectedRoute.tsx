import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { PantallaCargando } from '@/components/Estados';

/**
 * Puerta de entrada de la app.
 *
 * Ojo: esto es comodidad de navegación, no seguridad. Quien de verdad decide
 * qué puede ver y hacer cada usuario son las políticas RLS de Postgres. Si
 * alguien saltea esta ruta, la base le devuelve vacío o error igual.
 */
export function ProtectedRoute({ soloAdmin = false }: { soloAdmin?: boolean }) {
  const { session, profile, cargando, recuperandoPassword, esAdmin } = useAuth();
  const location = useLocation();

  if (cargando) return <PantallaCargando />;

  // Sesión de recuperación: solo sirve para poner la contraseña nueva.
  if (recuperandoPassword) {
    return <Navigate to="/recuperar" replace />;
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (soloAdmin && !esAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
