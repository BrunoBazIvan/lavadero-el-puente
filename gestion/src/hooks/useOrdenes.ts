import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import type {
  AnaliticasMes,
  Cliente,
  CrearOrdenPayload,
  EstadoOrden,
  MetodoPago,
  Orden,
  OrdenCompleta,
  OrdenItem,
  OrdenVista,
  Pago,
  ResumenPendientesRPC,
} from '@/types/database';

export const clavesOrdenes = {
  una: (ref: string) => ['ordenes', 'una', ref] as const,
  lista: (busqueda: string, estado: string) => ['ordenes', 'lista', busqueda, estado] as const,
};

/**
 * Cuántos días lleva una orden lista sin que la vengan a buscar.
 *
 * Es el mismo plazo que sale impreso en el comprobante (la clave
 * `leyenda_responsabilidad` de `configuracion`). Si cambia uno, cambiá el
 * otro: el aviso del mostrador y lo que firmó el cliente tienen que decir lo
 * mismo el día que haya que discutir una bolsa vieja.
 */
export const DIAS_SIN_RETIRAR = 7;

/** Días hacia atrás que trae el tablero para lo ya cerrado. Ver `ordenes_tablero()`. */
const DIAS_TABLERO = 7;

/**
 * Listado del mostrador.
 *
 * Con término de búsqueda usa la RPC `buscar()`, que ya sabe distinguir si lo
 * que escribieron es una referencia, un teléfono o un nombre, y llega a todo
 * el historial: es el camino para reimprimir un comprobante viejo o cobrar un
 * saldo de hace meses.
 *
 * Sin término, usa `ordenes_tablero()`: lo abierto (sin tope, son las bolsas
 * que hay físicamente en el lavadero) más lo cerrado de los últimos
 * `DIAS_TABLERO` días. Con el filtro en "entregadas", eso significa
 * "entregadas de esta semana" — una entregada más vieja se busca, no se
 * scrollea (ver el aviso en `Ordenes.tsx`).
 */
export function useListaOrdenes(busqueda: string, estado: EstadoOrden | 'todos') {
  const termino = busqueda.trim();

  return useQuery({
    queryKey: clavesOrdenes.lista(termino, estado),
    queryFn: async (): Promise<OrdenVista[]> => {
      if (termino.length >= 2) {
        const { data, error } = await supabase.rpc('buscar', { termino, limite: 50 });
        if (error) throw error;
        const filas = (data ?? []) as OrdenVista[];
        return estado === 'todos' ? filas : filas.filter((o) => o.estado === estado);
      }

      const { data, error } = await supabase.rpc('ordenes_tablero', { p_dias: DIAS_TABLERO });
      if (error) throw error;
      const filas = (data ?? []) as OrdenVista[];
      return estado === 'todos' ? filas : filas.filter((o) => o.estado === estado);
    },
  });
}

/** Lo que hay para hacer ahora mismo. Alimenta la barra fija del encabezado. */
export type ResumenPendientes = ResumenPendientesRPC;

/**
 * El estado del día, siempre a la vista.
 *
 * Una sola RPC (`resumen_pendientes()`) que cuenta en la base, por el índice
 * parcial de órdenes abiertas: antes era `select` de todas las órdenes
 * abiertas —estado y fecha de retiro de cada una— para contarlas en el
 * cliente, repetido cada 120 segundos desde cada pantalla abierta.
 *
 * Se refresca al volver a la ventana: la PC del mostrador queda abierta todo
 * el día y la otra persona del turno carga órdenes desde su propia sesión.
 */
export function useResumenPendientes() {
  return useQuery({
    queryKey: ['ordenes', 'resumen'],
    refetchOnWindowFocus: true,
    refetchInterval: 120_000,
    queryFn: async (): Promise<ResumenPendientes> => {
      const { data, error } = await supabase.rpc('resumen_pendientes', {
        p_dias_sin_retirar: DIAS_SIN_RETIRAR,
      });
      if (error) throw error;
      return data as ResumenPendientesRPC;
    },
  });
}

/**
 * Una orden con todo lo necesario para el detalle y para los tickets.
 *
 * Van cuatro consultas en vez de un `select` anidado: `v_ordenes` es una vista
 * y las relaciones embebidas de PostgREST sobre vistas son frágiles. Cuatro
 * consultas contra índices es barato y no se rompe si mañana cambia la vista.
 */
export async function traerOrdenCompleta(ref: string): Promise<OrdenCompleta | null> {
  const { data: orden, error } = await supabase
    .from('v_ordenes')
    .select('*')
    .eq('ref', ref)
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
}

export function useOrden(ref: string | undefined) {
  return useQuery({
    queryKey: clavesOrdenes.una(ref ?? ''),
    enabled: Boolean(ref),
    queryFn: () => traerOrdenCompleta(ref!),
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

/**
 * Cambio de estado. El monto viaja en el mismo `update` que el estado —y no en
 * dos consultas— porque la base exige que una orden marcada "lista" ya tenga
 * precio: separados, el primer paso quedaría rechazado.
 */
export function useCambiarEstadoOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      estado,
      monto,
    }: {
      id: string;
      estado: EstadoOrden;
      monto?: number;
    }): Promise<Orden> => {
      const { data, error } = await supabase
        .from('ordenes')
        .update(monto === undefined ? { estado } : { estado, monto })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}

/** Corregir el precio de una orden que ya lo tenía. */
export function useGuardarMonto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, monto }: { id: string; monto: number }): Promise<Orden> => {
      const { data, error } = await supabase
        .from('ordenes')
        .update({ monto })
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
 * Corregir la nota de la orden. Sin chequeo de rol: cualquiera del mostrador
 * la puede editar, igual que la puede cargar al recibir la ropa. Como
 * cualquier otro update de `ordenes`, la base lo rechaza solo si la orden ya
 * está `entregado` o `anulado` (`guard_orden_update`).
 */
export function useActualizarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas: string }): Promise<Orden> => {
      const { data, error } = await supabase
        .from('ordenes')
        .update({ notas: notas.trim() || null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}

/** Un cobro suelto: una seña, o el resto de una orden que quedó a medias. */
export function useRegistrarPago() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      ordenId,
      monto,
      metodo,
    }: {
      ordenId: string;
      monto: number;
      metodo: MetodoPago;
    }): Promise<Pago> => {
      const { data, error } = await supabase
        .from('pagos')
        .insert({ orden_id: ordenId, monto, metodo, recibido_por: profile?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}

/**
 * Entrega. Va por RPC porque cobrar y entregar tienen que entrar juntos: si la
 * entrega fallara después de insertar el pago, la orden quedaría cobrada y sin
 * entregar, que es justo el descuadre que nadie quiere encontrar al cerrar.
 */
export function useEntregarOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      monto,
      cobro,
      metodo,
    }: {
      id: string;
      /** Solo si la orden llegó a la entrega sin precio cargado. */
      monto?: number;
      /** Cuánto se cobra ahora. Sin esto, la orden se entrega debiendo. */
      cobro?: number;
      metodo?: MetodoPago;
    }): Promise<Orden> => {
      const { data, error } = await supabase.rpc('entregar_orden', {
        p_orden_id: id,
        p_monto: monto ?? null,
        p_cobro: cobro ?? null,
        p_metodo: metodo ?? null,
      });
      if (error) throw error;
      return data as Orden;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}

/**
 * Anulación. Cualquier staff mientras la orden no esté entregada; solo admin
 * si ya se entregó (lo impone la base en `anular_orden`, no el cliente).
 *
 * Va por RPC y no por un `update` directo: si la orden tiene plata adentro,
 * anular el cobro es parte de la misma operación — hacerlo en dos pasos
 * separados deja una ventana donde alguien puede saltear el segundo y
 * olvidarse de devolver el pago. El motivo y el sello se arman en la base,
 * igual que en `revertir_entrega`.
 */
export function useAnularOrden() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ordenId,
      motivo,
      pagosDevueltos = [],
    }: {
      ordenId: string;
      motivo: string;
      /** Ids de los pagos vigentes que se le devolvieron al cliente. */
      pagosDevueltos?: string[];
    }): Promise<Orden> => {
      const { data, error } = await supabase.rpc('anular_orden', {
        p_orden_id: ordenId,
        p_motivo: motivo,
        p_pagos_devueltos: pagosDevueltos,
      });
      if (error) throw error;
      return data as Orden;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}

/**
 * Revertir una entrega: "el cliente NO se la llevó", un toque de más que se
 * corrige donde se cometió. Cualquier staff, sin límite de tiempo — pedir un
 * admin dejaría el error puesto todo el día.
 *
 * La base exige que quede un motivo escrito (`guard_orden_update` rechaza un
 * `update` que no toque `notas`), así que el único camino es esta RPC. Los
 * cobros a devolver van por lista de ids, no por un sí/no genérico: una orden
 * puede tener una seña vieja y el cobro de hoy, y devolver "todo" borraría la
 * seña sin que nadie lo pidiera.
 */
export function useRevertirEntrega() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ordenId,
      pagosDevueltos = [],
      motivo,
    }: {
      ordenId: string;
      pagosDevueltos?: string[];
      motivo?: string | null;
    }): Promise<Orden> => {
      const { data, error } = await supabase.rpc('revertir_entrega', {
        p_orden_id: ordenId,
        p_pagos_devueltos: pagosDevueltos,
        p_motivo: motivo ?? null,
      });
      if (error) throw error;
      return data as Orden;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}

/**
 * Anular un cobro suelto (seña cargada dos veces, monto tipeado mal) sin
 * tocar el estado de la orden. No se borra nunca: queda tachado en la lista
 * de pagos del detalle, con motivo y quién lo anuló.
 */
export function useAnularPago() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ pagoId, motivo }: { pagoId: string; motivo: string }): Promise<Pago> => {
      const { data, error } = await supabase.rpc('anular_pago', {
        p_pago_id: pagoId,
        p_motivo: motivo,
      });
      if (error) throw error;
      return data as Pago;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ordenes'] }),
  });
}

/* ── Analíticas del mes (solo admin) ──────────────────────────────────────── */

/**
 * `aaaa-mm-dd` del primer día del mes que contiene `fecha` — lo que espera
 * `analiticas_mes(p_mes)`. El mes vive en la URL (`?mes=…`), así que esto es
 * la única conversión entre la URL y la RPC.
 */
export function mesAInput(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * El mes completo para la pestaña de Analíticas, en un solo viaje.
 *
 * Antes traía TODAS las filas del mes y del anterior por separado y sumaba en
 * el cliente, con el tope mudo de 1000 filas de PostgREST esperando al mes
 * bueno. Ahora es un `jsonb` ya agregado por `analiticas_mes()`: un POST,
 * payload de unos pocos KB. `staleTime` largo porque es una pantalla de
 * repaso, no de mostrador — no hace falta refrescarla sola.
 */
export function useAnaliticas(mes?: string) {
  return useQuery({
    queryKey: ['ordenes', 'analiticas', mes ?? 'actual'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AnaliticasMes> => {
      const { data, error } = await supabase.rpc('analiticas_mes', {
        p_mes: mes ?? null,
        p_dias_sin_retirar: DIAS_SIN_RETIRAR,
      });
      if (error) throw error;
      return data as AnaliticasMes;
    },
  });
}
