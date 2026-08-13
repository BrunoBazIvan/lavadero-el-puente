import type { OrdenCompleta } from '@/types/database';
import type { Configuracion } from '@/hooks/useConfiguracion';

/**
 * Qué se imprime. Hoy hay un solo trabajo, `comprobante`, que saca los dos
 * papeles de una recepción: el del cliente y la copia que queda con la bolsa.
 * Van juntos y no como dos tipos separados porque nunca se imprime uno sin el
 * otro. Si mañana aparece el recibo de pago, se suma acá como variante de
 * `tipo` y el resto de la app no se entera.
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
