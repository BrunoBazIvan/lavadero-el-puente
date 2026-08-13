import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Configuracion = Record<string, string>;

/** Valores por defecto si la tabla todavía no tiene la clave. */
const POR_DEFECTO: Configuracion = {
  nombre_negocio: 'Lavadero Industrial El Puente',
  direccion: '',
  telefono_whatsapp: '',
  leyenda_ticket: '',
  // Condiciones de guarda, al pie del comprobante del cliente. El plazo vive
  // acá y no en el código del ticket: si mañana se guardan 15 días, se cambia
  // esta fila en la base y sale en el próximo papel.
  leyenda_responsabilidad:
    'Guardamos las prendas 7 días desde que te avisamos que están listas. Pasado ese plazo el lavadero no se hace responsable.',
  dias_entrega_default: '1',
  ancho_ticket_mm: '80',
};

/** La tabla clave/valor, ya convertida a objeto. */
export function useConfiguracion() {
  return useQuery({
    queryKey: ['configuracion'],
    queryFn: async (): Promise<Configuracion> => {
      const { data, error } = await supabase.from('configuracion').select('*');
      if (error) throw error;

      const valores = { ...POR_DEFECTO };
      for (const fila of data ?? []) valores[fila.clave] = fila.valor;
      return valores;
    },
    staleTime: 10 * 60_000,
  });
}

/**
 * Días de entrega por defecto, ya como número usable.
 * Hoy es 1: la ropa se promete para el día siguiente.
 */
export function useDiasEntrega(): number {
  const { data } = useConfiguracion();
  const dias = Number(data?.dias_entrega_default);
  return Number.isFinite(dias) && dias >= 0 ? dias : 1;
}

export function useGuardarConfiguracion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cambios: Configuracion) => {
      const filas = Object.entries(cambios).map(([clave, valor]) => ({ clave, valor }));
      const { error } = await supabase.from('configuracion').upsert(filas, { onConflict: 'clave' });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['configuracion'] }),
  });
}
