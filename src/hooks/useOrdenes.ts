import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import type {
  Cliente,
  CrearOrdenPayload,
  EstadoOrden,
  Orden,
  OrdenCompleta,
  OrdenItem,
  OrdenVista,
  Pago,
} from '@/types/database';

export const clavesOrdenes = {
  una: (ref: string) => ['ordenes', 'una', ref] as const,
  lista: ['ordenes', 'lista'] as const,
};

/**
 * Una orden con todo lo necesario para el detalle y para los tickets.
 *
 * Van cuatro consultas en vez de un `select` anidado: `v_ordenes` es una vista
 * y las relaciones embebidas de PostgREST sobre vistas son frágiles. Cuatro
 * consultas contra índices es barato y no se rompe si mañana cambia la vista.
 */
export function useOrden(ref: string | undefined) {
  return useQuery({
    queryKey: clavesOrdenes.una(ref ?? ''),
    enabled: Boolean(ref),
    queryFn: async (): Promise<OrdenCompleta | null> => {
      const { data: orden, error } = await supabase
        .from('v_ordenes')
        .select('*')
        .eq('ref', ref!)
        .maybeSingle();
      if (error) throw error;
      if (!orden) return null;

      const [items, pagos, cliente] = await Promise.all([
        supabase.from('orden_items').select('*').eq('orden_id', orden.id).order('descripcion'),
        supabase.from('pagos').select('*').eq('orden_id', orden.id).order('fecha'),
        supabase.from('clientes').select('*').eq('id', orden.cliente_id).single(),
      ]);

      if (items.error) throw items.error;
      if (pagos.error) throw pagos.error;
      if (cliente.error) throw cliente.error;

      return {
        ...(orden as OrdenVista),
        items: (items.data ?? []) as OrdenItem[],
        pagos: (pagos.data ?? []) as Pago[],
        cliente: cliente.data as Cliente,
      };
    },
  });
}

/**
 * Alta de orden. La RPC inserta la orden y sus ítems en una sola transacción:
 * o entra todo, o no entra nada. La referencia (`EP-00001`) la genera la base.
 */
export function useCrearOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CrearOrdenPayload): Promise<Orden> => {
      const { data, error } = await supabase.rpc('crear_orden', {
        payload: payload as unknown as CrearOrdenPayload,
      });
      if (error) throw error;
      return data as Orden;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ordenes'] });
      void qc.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useCambiarEstadoOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoOrden }): Promise<Orden> => {
      const { data, error } = await supabase
        .from('ordenes')
        .update({ estado })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}

/**
 * Anulación. Solo admin (lo impone la RLS y el trigger de la base).
 * El motivo queda escrito en las notas: una orden anulada sin explicación no
 * le sirve a nadie dentro de seis meses.
 */
export function useAnularOrden() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      orden,
      motivo,
    }: {
      orden: OrdenCompleta;
      motivo: string;
    }): Promise<Orden> => {
      const sello = new Date().toLocaleString('es-UY');
      const registro = `[Anulada el ${sello} por ${profile?.nombre ?? 'desconocido'}: ${motivo.trim()}]`;
      const notas = orden.notas ? `${orden.notas}\n${registro}` : registro;

      const { data, error } = await supabase
        .from('ordenes')
        .update({ estado: 'anulado', notas })
        .eq('id', orden.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}
