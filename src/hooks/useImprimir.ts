import { useCallback } from 'react';
import { impresora } from '@/lib/print/BrowserPrintAdapter';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import type { OrdenCompleta } from '@/types/database';

/**
 * Imprime el comprobante de una orden.
 *
 * La configuración (nombre, dirección, ancho del papel) se cachea con el resto
 * de las consultas, así que al momento de imprimir ya está en memoria y no hay
 * espera entre guardar y que salga el papel.
 */
export function useImprimir() {
  const { data: config } = useConfiguracion();

  const imprimir = useCallback(
    async (orden: OrdenCompleta) => {
      if (!config) return;
      await impresora.print({ tipo: 'comprobante', orden, config });
    },
    [config],
  );

  return { imprimir, listo: Boolean(config) };
}
