import type { OrdenCompleta } from '@/types/database';
import type { Configuracion } from '@/hooks/useConfiguracion';

/**
 * Qué se imprime. Hoy hay un solo papel: el comprobante que se lleva el
 * cliente. Si mañana aparece la etiqueta para la bolsa o el recibo de pago,
 * se suman acá como variantes de `tipo` y el resto de la app no se entera.
 */
export type TicketPayload = {
  tipo: 'comprobante';
  orden: OrdenCompleta;
  config: Configuracion;
};

export interface PrintAdapter {
  print(payload: TicketPayload): Promise<void>;
}

/**
 * Motor futuro, cuando el navegador no alcance.
 *
 * La idea es un agente chico corriendo en la PC del mostrador que reciba el
 * ticket y le hable a la impresora en ESC/POS crudo:
 *
 *     class EscPosAgentAdapter implements PrintAdapter {
 *       print(payload: TicketPayload): Promise<void>;  // POST a http://127.0.0.1:9100/print
 *     }
 *
 * Ojo con una trampa: Chrome trata a 127.0.0.1 como red privada, así que le
 * manda un preflight y el agente TIENE que responder
 * `Access-Control-Allow-Private-Network: true` o el pedido nunca llega.
 */
