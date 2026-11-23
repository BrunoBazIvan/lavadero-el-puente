import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  DatosTapizadoRPC,
  EstadoTapizado,
  ItemTapizadoRPC,
  Tapizado,
} from '@/types/database';

/** Cabecera + artículos ordenados como se cargaron. */
const SELECT = '*, items:tapizado_items(*)';

function ordenarItems(t: Tapizado): Tapizado {
  return { ...t, items: [...(t.items ?? [])].sort((a, b) => a.posicion - b.posicion) };
}

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
        .select(SELECT)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as Tapizado[]).map(ordenarItems);
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
        .select(SELECT)
        .eq('ref', (ref ?? '').toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data ? ordenarItems(data as unknown as Tapizado) : null;
    },
  });
}

/**
 * Alta (sin `id`) o edición de un tapizado con sus artículos. Va por la RPC
 * `guardar_tapizado`: cabecera, artículos y total en una sola transacción.
 */
export function useGuardarTapizado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      datos,
      items,
    }: {
      id?: string;
      datos: DatosTapizadoRPC;
      items: ItemTapizadoRPC[];
    }) => {
      const { data, error } = await supabase.rpc('guardar_tapizado', {
        p_id: id ?? null,
        p_datos: datos,
        p_items: items,
      });
      if (error) throw error;
      return data as { id: string; ref: string };
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tapizados'] }),
  });
}

/** Cambia de etapa. Ya no pide medidas: el precio está escrito desde el alta. */
export function useCambiarEtapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoTapizado }) => {
      const { error } = await supabase.from('tapizados').update({ estado }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tapizados'] }),
  });
}

export function useNotaTapizado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas: string }) => {
      const { error } = await supabase
        .from('tapizados')
        .update({ notas: notas.trim() || null })
        .eq('id', id);
      if (error) throw error;
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
    }) => {
      const { error } = await supabase.rpc('anular_tapizado', {
        p_id: id,
        p_motivo: motivo,
        p_devuelto: devuelto,
      });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tapizados'] }),
  });
}
