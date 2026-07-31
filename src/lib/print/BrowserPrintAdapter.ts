import type { PrintAdapter, TicketPayload } from '@/lib/print/PrintAdapter';
import { armarComprobante } from '@/lib/print/ticketCliente';

/**
 * Imprime desde el navegador, con un iframe oculto y CSS de 80 mm.
 *
 * En la PC del mostrador Chrome se abre con `--kiosk-printing`, que manda el
 * papel directo a la impresora por defecto sin abrir el diálogo. En cualquier
 * otra máquina se abre el diálogo normal, que para probar viene bien.
 */
export class BrowserPrintAdapter implements PrintAdapter {
  print(payload: TicketPayload): Promise<void> {
    const html = armarComprobante(payload.orden, payload.config);

    return new Promise((resolve) => {
      const marco = document.createElement('iframe');
      // Fuera de la vista, pero con tamaño real: un iframe de 0x0 hace que
      // algunos navegadores no paginen bien lo que hay adentro.
      marco.setAttribute('aria-hidden', 'true');
      marco.style.position = 'fixed';
      marco.style.right = '0';
      marco.style.bottom = '0';
      marco.style.width = '80mm';
      marco.style.height = '200mm';
      marco.style.border = '0';
      marco.style.opacity = '0';
      marco.style.pointerEvents = 'none';

      const limpiar = () => {
        // Sacar el iframe en el acto corta la impresión en algunos equipos.
        window.setTimeout(() => marco.remove(), 1000);
        resolve();
      };

      marco.onload = () => {
        const ventana = marco.contentWindow;
        if (!ventana) {
          limpiar();
          return;
        }

        // `afterprint` no dispara en todos lados (ni con --kiosk-printing),
        // así que la limpieza también va por temporizador.
        ventana.onafterprint = limpiar;
        window.setTimeout(limpiar, 4000);

        // El print va en el tick siguiente a propósito: es una llamada
        // bloqueante, y así lo que la disparó (guardar, navegar) alcanza a
        // terminar antes de que se abra el diálogo.
        window.setTimeout(() => {
          ventana.focus();
          ventana.print();
        }, 0);
      };

      marco.srcdoc = html;
      document.body.appendChild(marco);
    });
  }
}

export const impresora = new BrowserPrintAdapter();
