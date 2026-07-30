import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/auth/AuthProvider';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { ToastProvider, useToast } from '@/components/Toaster';

import Login from '@/pages/Login';
import RecuperarPassword from '@/pages/RecuperarPassword';
import Tablero from '@/pages/Tablero';
import OrdenNueva from '@/pages/OrdenNueva';
import OrdenDetalle from '@/pages/OrdenDetalle';
import Clientes from '@/pages/Clientes';
import ClienteDetalle from '@/pages/ClienteDetalle';
import Articulos from '@/pages/Articulos';
import Caja from '@/pages/Caja';
import Config from '@/pages/Config';

/**
 * React Query con un manejo de errores global: cualquier consulta o mutación
 * que falle muestra el mensaje real de Supabase en un toast. Las pantallas
 * pueden igual manejar su propio error si quieren algo más específico.
 */
function QueryProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => toast.error(error),
        }),
        mutationCache: new MutationCache({
          // Las mutaciones con onError propio ya avisaron: no dupliques.
          onError: (error, _vars, _ctx, mutation) => {
            if (!mutation.options.onError) toast.error(error);
          },
        }),
        defaultOptions: {
          queries: {
            // En el mostrador los datos cambian entre dos personas: poco
            // tiempo de frescura, pero sin refetch en cada foco de ventana.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export default function App() {
  return (
    <ToastProvider>
      <QueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar" element={<RecuperarPassword />} />

              {/* Todo lo de adentro exige sesión con perfil activo. */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<Tablero />} />
                  <Route path="ordenes/nueva" element={<OrdenNueva />} />
                  <Route path="ordenes/:ref" element={<OrdenDetalle />} />
                  <Route path="clientes" element={<Clientes />} />
                  <Route path="clientes/:id" element={<ClienteDetalle />} />
                  <Route path="caja" element={<Caja />} />
                </Route>
              </Route>

              {/* Solo admin. La RLS lo bloquea igual del lado de la base. */}
              <Route element={<ProtectedRoute soloAdmin />}>
                <Route element={<Layout />}>
                  <Route path="articulos" element={<Articulos />} />
                  <Route path="config" element={<Config />} />
                </Route>
              </Route>

              <Route path="*" element={<NoEncontrado />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryProvider>
    </ToastProvider>
  );
}

function NoEncontrado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="text-center">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-900">
          Esta pantalla no existe
        </h1>
        <Link to="/" className="btn-primary mt-6">
          Ir al tablero
        </Link>
      </div>
    </div>
  );
}
