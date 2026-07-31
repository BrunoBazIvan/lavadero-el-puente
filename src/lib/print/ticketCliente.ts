import type { OrdenCompleta } from '@/types/database';
import { NOMBRE_SERVICIO } from '@/types/database';
import type { Configuracion } from '@/hooks/useConfiguracion';
import { fecha, fechaHora, telefono as formatearTelefono } from '@/lib/format';

/**
 * Comprobante de recepción — el único papel que sale hoy.
 *
 * Se arma como texto monoespaciado dentro de un HTML mínimo, no con
 * componentes: es lo más parecido a lo que escupe la térmica, se ve tal cual
 * en el editor, y no arrastra `react-dom/server` al bundle.
 *
 * Reglas de la impresora térmica:
 *  · Blanco y negro puro. Nada de grises, sombras ni degradados.
 *  · Separadores con guiones, no con `border`: el borde a veces sale corrido.
 *  · Al final, un bloque en blanco para que el papel avance antes del corte.
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

export function armarComprobante(orden: OrdenCompleta, config: Configuracion): string {
  const negocio = config.nombre_negocio || 'El Puente';
  const anchoPapel = Number(config.ancho_ticket_mm) || 80;

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

  // ── Fechas ────────────────────────────────────────────────────────────────
  const fechas = [`Ingreso: ${fechaHora(orden.fecha_ingreso)}`];

  // ── Notas ─────────────────────────────────────────────────────────────────
  const notas = orden.notas ? ['Notas:', ...envolver(orden.notas).map((l) => ` ${l}`)] : [];

  secciones.push(recibido.join('\n'));
  secciones.push(fechas.join('\n'));
  if (notas.length) secciones.push(notas.join('\n'));

  const leyenda = config.leyenda_ticket || 'Presentá este comprobante para retirar tus prendas.';

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

  pre { margin: 0; font: inherit; white-space: pre-wrap; word-break: break-word; }

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

  /* Avance de papel antes del corte. */
  .corte { height: 10mm; }

  @media screen {
    body { width: var(--util); box-shadow: 0 0 0 1px #ccc; padding: 4mm 0; }
  }
</style>
</head>
<body>
<pre>${escapar(cuerpo.join('\n'))}</pre>
<pre>${separador()}</pre>
<div class="ref">${escapar(orden.ref)}</div>
<pre>${separador()}</pre>
<div class="contacto">
  <div class="nombre">${escapar(orden.cliente.nombre)}</div>
  <div class="tel">${escapar(
    orden.cliente.telefono ? formatearTelefono(orden.cliente.telefono) : 'Sin teléfono',
  )}</div>
  <div class="aviso">Revisá que el teléfono esté bien</div>
</div>
<pre>${separador()}</pre>
<pre>${escapar(secciones.join(`\n${separador()}\n`))}</pre>
<pre>${separador()}</pre>
<div class="retiro"><span>RETIRO ESTIMADO</span>${escapar(fecha(orden.fecha_retiro_estimada))}</div>
<pre>${separador()}</pre>
<pre class="leyenda">${escapar(envolver(leyenda).join('\n'))}</pre>
<pre class="leyenda">¡Gracias!</pre>
<div class="corte"></div>
</body>
</html>`;
}
