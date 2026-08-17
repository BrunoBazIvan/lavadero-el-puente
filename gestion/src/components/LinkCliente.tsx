import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/auth/AuthProvider';

/**
 * El nombre de un cliente, que lleva a su ficha solo si quien mira puede
 * entrar.
 *
 * La ficha vive en `/clientes/:id`, que es de admin (`App.tsx`). Para un
 * operador el link no lo llevaría a ningún lado: `ProtectedRoute` lo rebota a
 * "Recibir ropa", que se siente como que el sistema falló y encima le hace
 * perder lo que estaba haciendo. Así el nombre queda como lo que es para él,
 * un dato de la orden que tiene enfrente.
 *
 * `claseLink` son las clases que solo tienen sentido si de verdad se puede
 * hacer clic (el subrayado, el hover): un texto que parece link y no lo es
 * confunde igual que uno roto.
 */
export function LinkCliente({
  id,
  className = '',
  claseLink = '',
  children,
}: {
  id: string;
  className?: string;
  claseLink?: string;
  children: ReactNode;
}) {
  const { esAdmin } = useAuth();

  if (!esAdmin) return <span className={className}>{children}</span>;

  return (
    <Link to={`/clientes/${id}`} className={`${className} ${claseLink}`.trim()}>
      {children}
    </Link>
  );
}
