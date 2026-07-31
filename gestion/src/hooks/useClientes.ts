import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { normalizarTelefono } from '@/lib/format';
import type { Cliente, OrdenVista } from '@/types/database';

/**
 * PostgREST arma los filtros `or()` separando por comas y paréntesis, así que
 * un término con esos caracteres rompe la consulta. Los sacamos junto con los
 * comodines de LIKE, que si no dejarían buscar "%" y traer todo.
 */
function limpiarTermino(termino: string): string {
  return termino.replace(/[,()%*\\]/g, '').trim();
}

export const clavesClientes = {
  lista: (busqueda: string, incluirInactivos: boolean) =>
    ['clientes', 'lista', busqueda, incluirInactivos] as const,
  uno: (id: string) => ['clientes', 'uno', id] as const,
  porTelefono: (telefono: string) => ['clientes', 'telefono', telefono] as const,
  ordenes: (id: string) => ['clientes', 'ordenes', id] as const,
};

/** Listado con búsqueda por nombre o teléfono. */
export function useClientes(busqueda: string, incluirInactivos = false) {
  return useQuery({
    queryKey: clavesClientes.lista(busqueda, incluirInactivos),
    queryFn: async (): Promise<Cliente[]> => {
      let q = supabase.from('clientes').select('*').order('nombre').limit(200);

      if (!incluirInactivos) q = q.eq('activo', true);

      const termino = limpiarTermino(busqueda);
      if (termino) {
        const digitos = termino.replace(/\D/g, '');
        const filtros = [`nombre.ilike.%${termino}%`];
        // Buscar por teléfono solo si escribió números; si no, el filtro
        // vacío traería cualquier cliente con teléfono cargado.
        if (digitos.length >= 3) filtros.push(`telefono.ilike.%${digitos}%`);
        q = q.or(filtros.join(','));
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: clavesClientes.uno(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<Cliente | null> => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Busca un cliente por teléfono exacto. Sirve para avisar, antes de guardar,
 * que ese número ya está cargado — así no se duplica el mismo cliente cada
 * vez que viene.
 */
export function useClientePorTelefono(telefono: string | null) {
  const normalizado = normalizarTelefono(telefono);
  return useQuery({
    queryKey: clavesClientes.porTelefono(normalizado ?? ''),
    enabled: Boolean(normalizado && normalizado.length >= 8),
    queryFn: async (): Promise<Cliente[]> => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefono', normalizado!)
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Órdenes de un cliente, de la más nueva a la más vieja. */
export function useOrdenesDeCliente(id: string | undefined) {
  return useQuery({
    queryKey: clavesClientes.ordenes(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<OrdenVista[]> => {
      const { data, error } = await supabase
        .from('v_ordenes')
        .select('*')
        .eq('cliente_id', id!)
        .order('fecha_ingreso', { ascending: false })
        .limit(TOPE_ORDENES);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Tope de órdenes que trae la ficha de cliente. Si se llega, se avisa en pantalla. */
export const TOPE_ORDENES = 300;

export interface DatosCliente {
  nombre: string;
  telefono: string | null;
  email: string | null;
  tipo: 'particular' | 'empresa';
  razon_social: string | null;
  rut: string | null;
  direccion: string | null;
  notas: string | null;
}

/** Deja los datos como se guardan: teléfono normalizado y vacíos en null. */
function aFila(datos: DatosCliente) {
  const vacioANull = (v: string | null) => {
    const t = v?.trim();
    return t ? t : null;
  };

  return {
    nombre: datos.nombre.trim(),
    telefono: normalizarTelefono(datos.telefono),
    email: vacioANull(datos.email),
    tipo: datos.tipo,
    // Los datos de empresa no se guardan si el cliente es particular: quedarían
    // colgados y reaparecerían al cambiarle el tipo.
    razon_social: datos.tipo === 'empresa' ? vacioANull(datos.razon_social) : null,
    rut: datos.tipo === 'empresa' ? vacioANull(datos.rut) : null,
    direccion: vacioANull(datos.direccion),
    notas: vacioANull(datos.notas),
  };
}

export function useCrearCliente() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (datos: DatosCliente): Promise<Cliente> => {
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...aFila(datos), created_by: profile?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useActualizarCliente() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: DatosCliente }): Promise<Cliente> => {
      const { data, error } = await supabase
        .from('clientes')
        .update(aFila(datos))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

/**
 * Baja lógica. No se borra nunca un cliente: sus órdenes viejas lo referencian
 * y el historial tiene que seguir en pie.
 */
export function useCambiarActivoCliente() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }): Promise<Cliente> => {
      const { data, error } = await supabase
        .from('clientes')
        .update({ activo })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}
