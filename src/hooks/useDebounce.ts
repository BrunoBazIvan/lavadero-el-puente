import { useEffect, useState } from 'react';

/**
 * Devuelve el valor recién después de que dejó de cambiar por `ms`.
 * Se usa en los buscadores para no pegarle a la base en cada tecla.
 */
export function useDebounce<T>(valor: T, ms = 300): T {
  const [demorado, setDemorado] = useState(valor);

  useEffect(() => {
    const id = window.setTimeout(() => setDemorado(valor), ms);
    return () => window.clearTimeout(id);
  }, [valor, ms]);

  return demorado;
}
