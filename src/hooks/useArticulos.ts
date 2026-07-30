import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Articulo } from '@/types/database';

export const clavesArticulos = {
  lista: (incluirInactivos: boolean) => ['articulos', 'lista', incluirInactivos] as const,
};

/**
 * Lista de precios, ordenada como se muestra en la grilla de carga de órdenes:
 * por categoría y, dentro de cada una, por `orden_visual`.
 */
export function useArticulos(incluirInactivos = false) {
  return useQuery({
    queryKey: clavesArticulos.lista(incluirInactivos),
    queryFn: async (): Promise<Articulo[]> => {
      let q = supabase
        .from('articulos')
        .select('*')
        .order('categoria', { nullsFirst: false })
        .order('orden_visual')
        .order('nombre');

      if (!incluirInactivos) q = q.eq('activo', true);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    // La lista de precios cambia poco: no tiene sentido refrescarla seguido.
    staleTime: 5 * 60_000,
  });
}

export interface DatosArticulo {
  nombre: string;
  categoria: string | null;
  precio_unitario: number;
  orden_visual: number;
  activo: boolean;
}

export function useCrearArticulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: DatosArticulo): Promise<Articulo> => {
      const { data, error } = await supabase
        .from('articulos')
        .insert({ ...datos, nombre: datos.nombre.trim(), categoria: datos.categoria?.trim() || null })
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
        ...(datos.categoria !== undefined ? { categoria: datos.categoria?.trim() || null } : {}),
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

/**
 * Agrupa por categoría.
 *
 * Las categorías se ordenan por el `orden_visual` más bajo de sus artículos,
 * no alfabéticamente: en el mostrador las prendas van primero y los servicios
 * al final, y eso lo decide la lista de precios, no el abecedario.
 */
export function agruparPorCategoria(articulos: Articulo[]): [string, Articulo[]][] {
  const grupos = new Map<string, Articulo[]>();
  for (const a of articulos) {
    const clave = a.categoria?.trim() || 'Sin categoría';
    const actual = grupos.get(clave);
    if (actual) actual.push(a);
    else grupos.set(clave, [a]);
  }

  const peso = (items: Articulo[]) => Math.min(...items.map((a) => a.orden_visual));

  return [...grupos.entries()].sort(([nombreA, itemsA], [nombreB, itemsB]) => {
    const diferencia = peso(itemsA) - peso(itemsB);
    return diferencia !== 0 ? diferencia : nombreA.localeCompare(nombreB, 'es');
  });
}
