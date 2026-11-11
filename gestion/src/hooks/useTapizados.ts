import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EstadoTapizado, ProductoTapizado, Tapizado } from '@/types/database';

/**
 * Trabajos de tapizado. La lista entera, sin filtrar en la base: son pocos y
 * la pantalla necesita las cuentas de cada etapa igual, para los botones del
 * filtro y el "a cobrar".
 */
export function useTapizados() {
  return useQuery({
    queryKey: ['tapizados', 'lista'],
    queryFn: async (): Promise<Tapizado[]> => {
      const { data, error } = await supabase
        .from('tapizados')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Un tapizado por su referencia (TP-00001), para la pantalla de detalle. */
export function useTapizado(ref: string | undefined) {
  return useQuery({
    queryKey: ['tapizados', 'ref', ref],
    enabled: Boolean(ref),
    queryFn: async (): Promise<Tapizado | null> => {
      const { data, error } = await supabase
        .from('tapizados')
        .select('*')
        .eq('ref', (ref ?? '').toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export interface DatosTapizado {
  nombre: string;
  edificio: string | null;
  contacto: string;
  producto: ProductoTapizado;
  producto_otro: string | null;
  precio: number;
  notas: string | null;
}

function limpiar(datos: DatosTapizado) {
  const vacioANull = (v: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    nombre: datos.nombre.trim(),
    edificio: vacioANull(datos.edificio),
    contacto: datos.contacto.trim(),
    producto: datos.producto,
    producto_otro: datos.producto === 'otro' ? vacioANull(datos.producto_otro) : null,
    precio: datos.precio,
    notas: vacioANull(datos.notas),
  };
}

export function useCrearTapizado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: DatosTapizado): Promise<Tapizado> => {
      const { data, error } = await supabase
        .from('tapizados')
        .insert(limpiar(datos))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tapizados'] }),
  });
}

export function useEditarTapizado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: DatosTapizado }): Promise<Tapizado> => {
      const { data, error } = await supabase
        .from('tapizados')
        .update(limpiar(datos))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tapizados'] }),
  });
}

/**
 * Cambia de etapa. Las medidas de una alfombra viajan en el **mismo** update
 * que el paso a "terminado": `guard_tapizado` rechaza una alfombra terminada
 * sin medidas, así que separadas la primera falla.
 */
export function useCambiarEtapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      estado,
      medidas,
    }: {
      id: string;
      estado: EstadoTapizado;
      medidas?: { ancho_m: number; largo_m: number; precio_m2: number };
    }): Promise<Tapizado> => {
      const { data, error } = await supabase
        .from('tapizados')
        .update({ estado, ...(medidas ?? {}) })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tapizados'] }),
  });
}

export function useNotaTapizado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas: string }): Promise<Tapizado> => {
      const { data, error } = await supabase
        .from('tapizados')
        .update({ notas: notas.trim() || null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tapizados'] }),
  });
}

/**
 * Anula un tapizado. No se borra, igual que una orden: queda en la tabla con
 * el motivo, y es definitivo (`guard_tapizado` no deja tocarlo después).
 */
export function useAnularTapizado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      motivo,
      devuelto,
    }: {
      id: string;
      motivo: string;
      /** Solo importa si ya estaba cobrado: queda anotado en las notas. */
      devuelto: boolean;
    }): Promise<Tapizado> => {
      const { data, error } = await supabase.rpc('anular_tapizado', {
        p_id: id,
        p_motivo: motivo,
        p_devuelto: devuelto,
      });
      if (error) throw error;
      return data as Tapizado;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tapizados'] }),
  });
}
