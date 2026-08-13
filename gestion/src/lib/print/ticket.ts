import type { OrdenCompleta } from '@/types/database';
import { NOMBRE_SERVICIO } from '@/types/database';
import type { Configuracion } from '@/hooks/useConfiguracion';
import { LOGO_TICKET } from '@/lib/print/logoTicket';
import { fecha, fechaHora, moneda, telefono as formatearTelefono } from '@/lib/format';

/**
 * Los dos papeles que salen al recibir una orden:
 *
 *  1. El comprobante del cliente, con todo lo que recibimos y las condiciones.
 *  2. El talón del lavadero, que va con la bolsa: referencia, nombre y
 *     teléfono, nada más. Es el papel que se mira cuando alguien llama o
 *     cuando hay que ubicar una bolsa sin cliente delante.
 *
 * Salen en un solo documento, separados por un salto de página, y no en dos
 * llamadas a `print()`: con `--kiosk-printing` la segunda llamada compite con
 * el trabajo que todavía está saliendo y a veces se pierde.
 *
 * Se arma como texto monoespaciado dentro de un HTML mínimo, no con
 * componentes: es lo más parecido a lo que escupe la térmica, se ve tal cual
 * en el editor, y no arrastra `react-dom/server` al bundle.
 *
 * Reglas de la impresora térmica:
 *  · Blanco y negro puro. Nada de grises, sombras ni degradados.
 *  · Separadores con guiones, no con `border`: el borde a veces sale corrido.
 *  · Al final de cada papel, un bloque en blanco para que avance antes del corte.
 */

/** Ancho útil en caracteres para 80 mm con fuente monoespaciada de 12 px. */
const COLUMNAS = 32;

function separador(): string {
  return '-'.repeat(COLUMNAS);
}

function centrar(texto: string): string {
  const sobra = COLUMNAS - texto.length;
  if (sobra <= 0) return texto;
  return ' '.repeat(Math.floor(sobra / 2)) + texto;
}

/** Etiqueta a la izquierda, importe pegado al margen derecho del papel. */
function renglonImporte(etiqueta: string, importe: string): string {
  const sobra = COLUMNAS - etiqueta.length - importe.length;
  return sobra > 0 ? etiqueta + ' '.repeat(sobra) + importe : `${etiqueta} ${importe}`;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Parte el texto largo en renglones que entren en el ancho del papel. */
function envolver(texto: string, ancho = COLUMNAS): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const renglones: string[] = [];
  let actual = '';

  for (const palabra of palabras) {
    if (!actual) actual = palabra;
    else if (actual.length + 1 + palabra.length <= ancho) actual += ' ' + palabra;
    else {
      renglones.push(actual);
      actual = palabra;
    }
  }
  if (actual) renglones.push(actual);
  return renglones;
}

/** Lo que se recibió, una línea por ítem. Los que no se cuentan van sin número. */
function lineasRecibido(orden: OrdenCompleta): string[] {
  return orden.items.map((item) =>
    item.cantidad > 1
      ? `  ${String(item.cantidad).padStart(2)}  ${item.descripcion}`
      : `      ${item.descripcion}`,
  );
}

/** Nombre y teléfono, el bloque que se repite en los dos papeles. */
function bloqueContacto(orden: OrdenCompleta, aviso?: string): string {
  const tel = orden.cliente.telefono
    ? formatearTelefono(orden.cliente.telefono)
    : 'Sin teléfono';

  return `<div class="contacto">
  <div class="nombre">${escapar(orden.cliente.nombre)}</div>
  <div class="tel">${escapar(tel)}</div>
  ${aviso ? `<div class="aviso">${escapar(aviso)}</div>` : ''}
</div>`;
}

/* ── Papel 1: el del cliente ─────────────────────────────────────────────── */

function papelCliente(orden: OrdenCompleta, config: Configuracion): string {
  const negocio = config.nombre_negocio || 'El Puente';

  const cuerpo: string[] = [];

  // ── Encabezado ────────────────────────────────────────────────────────────
  // El nombre y la dirección salen de `configuracion`: si el lavadero se muda,
  // se cambia en la base y no hay que tocar código.
  for (const linea of envolver(negocio.toUpperCase())) cuerpo.push(centrar(linea));
  for (const linea of envolver(config.direccion || '')) cuerpo.push(centrar(linea));
  if (config.telefono_whatsapp) {
    cuerpo.push(centrar(`Tel: ${formatearTelefono(config.telefono_whatsapp)}`));
  }
  cuerpo.push('');

  const secciones: string[] = [];

  // ── Qué recibimos ─────────────────────────────────────────────────────────
  const recibido = ['RECIBIMOS', ...lineasRecibido(orden)];
  recibido.push('');
  recibido.push(`Servicio: ${NOMBRE_SERVICIO[orden.servicio]}`);
  if (orden.envio) recibido.push('Envío:    Retiro y entrega');

  // ── Cobro ─────────────────────────────────────────────────────────────────
  // Al recibir la ropa todavía no hay precio, así que este bloque no sale en el
  // comprobante que se le da al cliente: aparece recién en la reimpresión, con
  // la orden ya lista y con monto cargado.
  const cobro: string[] = [];
  if (orden.monto !== null) {
    cobro.push(renglonImporte('TOTAL', moneda(orden.total)));
    if (orden.pagado > 0) cobro.push(renglonImporte('Pagado', moneda(orden.pagado)));
    if (orden.saldo > 0) cobro.push(renglonImporte('A pagar', moneda(orden.saldo)));
  }

  // ── Fechas ────────────────────────────────────────────────────────────────
  const fechas = [`Ingreso: ${fechaHora(orden.fecha_ingreso)}`];

  // ── Notas ─────────────────────────────────────────────────────────────────
  const notas = orden.notas ? ['Notas:', ...envolver(orden.notas).map((l) => ` ${l}`)] : [];

  secciones.push(recibido.join('\n'));
  if (cobro.length) secciones.push(cobro.join('\n'));
  secciones.push(fechas.join('\n'));
  if (notas.length) secciones.push(notas.join('\n'));

  // ── Condiciones de guarda ─────────────────────────────────────────────────
  // El plazo va en `configuracion` y no acá: si el lavadero decide guardar 15
  // días en vez de 7, se cambia el texto en la base y sale en el próximo papel.
  const guarda = config.leyenda_responsabilidad?.trim();
  const bloqueGuarda = guarda
    ? `<pre>${separador()}</pre>
<pre class="destacado">${escapar(envolver(guarda).join('\n'))}</pre>`
    : '';

  const leyenda = config.leyenda_ticket || 'Presentá este comprobante para retirar tus prendas.';

  return `<div class="papel">
<img class="logo" src="${LOGO_TICKET}" alt="">
<pre>${escapar(cuerpo.join('\n'))}</pre>
<pre>${separador()}</pre>
<div class="ref">${escapar(orden.ref)}</div>
<pre>${separador()}</pre>
${bloqueContacto(orden, 'Revisá que el teléfono esté bien')}
<pre>${separador()}</pre>
<pre>${escapar(secciones.join(`\n${separador()}\n`))}</pre>
<pre>${separador()}</pre>
<div class="retiro"><span>RETIRO ESTIMADO</span>${escapar(fecha(orden.fecha_retiro_estimada))}</div>
${bloqueGuarda}
<pre>${separador()}</pre>
<pre class="leyenda">${escapar(envolver(leyenda).join('\n'))}</pre>
<pre class="leyenda">¡Gracias!</pre>
<div class="corte"></div>
</div>`;
}

/* ── Papel 2: el del lavadero ────────────────────────────────────────────── */

/**
 * El talón que se queda acá, enganchado a la bolsa.
 *
 * Va sin logo, sin ítems y sin precios a propósito: no lo lee un cliente, lo
 * lee alguien del mostrador buscando una bolsa entre veinte. Cuanto menos
 * texto tenga, más rápido se encuentra lo que importa.
 */
function papelLavadero(orden: OrdenCompleta): string {
  // El `respiro` de arriba no es adorno: el padding del body solo vale para la
  // primera página, así que sin él este talón arranca pegado al corte.
  return `<div class="papel">
<div class="respiro"></div>
<pre class="destacado">${centrar('COPIA LAVADERO')}</pre>
<pre>${separador()}</pre>
<div class="ref">${escapar(orden.ref)}</div>
<pre>${separador()}</pre>
${bloqueContacto(orden)}
<pre>${separador()}</pre>
<div class="corte"></div>
</div>`;
}

export function armarComprobante(orden: OrdenCompleta, config: Configuracion): string {
  const anchoPapel = Number(config.ancho_ticket_mm) || 80;

  return `<!doctype html>
<html lang="es-UY">
<head>
<meta charset="utf-8">
<title>Comprobante ${escapar(orden.ref)}</title>
<style>
  /* El ancho sale de la configuración: pasar a 58 mm no requiere tocar nada. */
  :root { --papel: ${anchoPapel}mm; --util: ${anchoPapel - 8}mm; }

  @page { size: var(--papel) auto; margin: 0; }

  html, body { margin: 0; padding: 0; background: #fff; }

  body {
    width: var(--util);
    margin: 0 auto;
    padding: 2mm 0 0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.35;
    color: #000;
    -webkit-font-smoothing: none;
  }

  /* El salto va antes del segundo papel y no después del primero: puesto como
     page-break-after en el último, Chrome agrega una página vacía al final y
     la térmica escupe un pedazo de rollo en blanco cada vez. */
  .papel + .papel { page-break-before: always; break-before: page; }

  pre { margin: 0; font: inherit; white-space: pre-wrap; word-break: break-word; }

  /* 176 px pintados en 22 mm son 1:1 en un cabezal de 203 dpi. El pixelated
     evita que el navegador interpole y devuelva los grises que la térmica no
     sabe imprimir. */
  .logo {
    display: block;
    width: 22mm;
    height: auto;
    margin: 0 auto 1mm;
    image-rendering: pixelated;
  }

  .ref {
    margin: 1mm 0;
    text-align: center;
    font-size: 26px;
    font-weight: bold;
    letter-spacing: 2px;
  }

  .retiro {
    margin: 1mm 0;
    text-align: center;
    font-size: 15px;
    font-weight: bold;
  }
  .retiro span { display: block; font-size: 11px; font-weight: normal; letter-spacing: 1px; }

  /* Nombre y teléfono con cuerpo grande: el cliente los tiene que poder leer
     de un vistazo en el mostrador y avisar ahí mismo si están mal. */
  .contacto { margin: 1mm 0; text-align: center; }
  .contacto .nombre { font-size: 15px; font-weight: bold; }
  .contacto .tel { font-size: 17px; font-weight: bold; letter-spacing: 1px; }
  .contacto .aviso { font-size: 10px; }

  .leyenda { text-align: center; }

  /* Las condiciones de guarda. En negrita porque es lo que se señala cuando
     alguien viene a buscar la ropa un mes después. */
  .destacado { font-weight: bold; }

  /* Avance de papel antes del corte, y aire después del corte anterior. */
  .corte { height: 10mm; }
  .respiro { height: 4mm; }

  @media screen {
    body { width: var(--util); box-shadow: 0 0 0 1px #ccc; padding: 4mm 0; }
    .papel + .papel { margin-top: 6mm; border-top: 1px dashed #999; padding-top: 4mm; }
  }
</style>
</head>
<body>
${papelCliente(orden, config)}
${papelLavadero(orden)}
</body>
</html>`;
}
