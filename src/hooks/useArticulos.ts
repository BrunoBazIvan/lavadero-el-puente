import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Articulo } from '@/types/database';

export const clavesArticulos = {
  lista: (incluirInactivos: boolean) => ['articulos', 'lista', incluirInactivos] as const,
};

/**
 * Qué se puede recibir: ropa, acolchados de 1 o 2 plazas, y lo que agreguen.
 * Ordenado por `orden_visual`, que es el orden de los botones en el alta.
 */
export function useArticulos(incluirInactivos = false) {
  return useQuery({
    queryKey: clavesArticulos.lista(incluirInactivos),
    queryFn: async (): Promise<Articulo[]> => {
      let q = supabase.from('articulos').select('*').order('orden_visual').order('nombre');

      if (!incluirInactivos) q = q.eq('activo', true);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    // La lista cambia muy de vez en cuando: no tiene sentido refrescarla seguido.
    staleTime: 5 * 60_000,
  });
}

export interface DatosArticulo {
  nombre: string;
  orden_visual: number;
  lleva_cantidad: boolean;
  activo: boolean;
}

export function useCrearArticulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: DatosArticulo): Promise<Articulo> => {
      const { data, error } = await supabase
        .from('articulos')
        .insert({ ...datos, nombre: datos.nombre.trim() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['articulos'] }),
  });
}

export function useActualizarArticulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: string;
      datos: Partial<DatosArticulo>;
    }): Promise<Articulo> => {
      const limpio = {
        ...datos,
        ...(datos.nombre !== undefined ? { nombre: datos.nombre.trim() } : {}),
      };
      const { data, error } = await supabase
        .from('articulos')
        .update(limpio)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['articulos'] }),
  });
}
