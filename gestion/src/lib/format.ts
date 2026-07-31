import { format, formatDistanceToNowStrict, differenceInCalendarDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/* ───────────────────────────────────────────────────────────────────────────
 *  Zona horaria
 *
 *  Todo se guarda en UTC (`timestamptz`) y se formatea en la hora local de la
 *  máquina. La PC del mostrador está en America/Montevideo, así que "hoy" y
 *  "las 14:35" son los del lavadero.
 *
 *  Uruguay no usa horario de verano desde 2015: es UTC-3 fijo. Aun así no
 *  hardcodeamos el offset — si algún día alguien abre la app desde un celular
 *  en otro huso, ve su hora local, que es lo esperable.
 * ─────────────────────────────────────────────────────────────────────────── */

type FechaEntrada = string | Date | null | undefined;

function aDate(valor: FechaEntrada): Date | null {
  if (!valor) return null;
  const d = typeof valor === 'string' ? parseISO(valor) : valor;
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ── Moneda ──────────────────────────────────────────────────────────────── */

const formateadorMoneda = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 1500 → "$ 1.500" */
export function moneda(monto: number | null | undefined): string {
  return formateadorMoneda.format(monto ?? 0);
}

/** Igual que `moneda` pero con centésimos. Para pagos con vuelto exacto. */
export function monedaExacta(monto: number | null | undefined): string {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 2,
  }).format(monto ?? 0);
}

/* ── Fechas ──────────────────────────────────────────────────────────────── */

/** 30/07/2026 */
export function fecha(valor: FechaEntrada): string {
  const d = aDate(valor);
  return d ? format(d, 'dd/MM/yyyy') : '—';
}

/** 30/07/2026 14:35 */
export function fechaHora(valor: FechaEntrada): string {
  const d = aDate(valor);
  return d ? format(d, 'dd/MM/yyyy HH:mm') : '—';
}

/** 30/07 14:35 — para los tickets, donde el ancho es oro. */
export function fechaHoraCorta(valor: FechaEntrada): string {
  const d = aDate(valor);
  return d ? format(d, 'dd/MM HH:mm') : '—';
}

/** 14:35 */
export function hora(valor: FechaEntrada): string {
  const d = aDate(valor);
  return d ? format(d, 'HH:mm') : '—';
}

/** jueves 30 de julio */
export function fechaLarga(valor: FechaEntrada): string {
  const d = aDate(valor);
  return d ? format(d, "EEEE d 'de' MMMM", { locale: es }) : '—';
}

/** "hace 3 días" */
export function hace(valor: FechaEntrada): string {
  const d = aDate(valor);
  return d ? formatDistanceToNowStrict(d, { locale: es, addSuffix: true }) : '—';
}

/** Días enteros transcurridos desde una fecha. Negativo si es futura. */
export function diasDesde(valor: FechaEntrada): number | null {
  const d = aDate(valor);
  return d ? differenceInCalendarDays(new Date(), d) : null;
}

/** `aaaa-mm-dd` para inputs `type="date"` y para columnas `date` de Postgres. */
export function aISODate(valor: Date): string {
  return format(valor, 'yyyy-MM-dd');
}

/** Arranque del día local, en ISO — para filtrar por "hoy" contra `timestamptz`. */
export function inicioDelDia(valor: Date | string): string {
  const d = typeof valor === 'string' ? parseISO(valor) : valor;
  const inicio = new Date(d);
  inicio.setHours(0, 0, 0, 0);
  return inicio.toISOString();
}

/** Fin del día local, en ISO. */
export function finDelDia(valor: Date | string): string {
  const d = typeof valor === 'string' ? parseISO(valor) : valor;
  const fin = new Date(d);
  fin.setHours(23, 59, 59, 999);
  return fin.toISOString();
}

/* ── Teléfonos uruguayos ─────────────────────────────────────────────────────
 *  Celular:  09X XXX XXX   (9 dígitos, arranca en 09)
 *  Fijo:     42XX XXXX     (8 dígitos; 42 es Maldonado)
 *
 *  Se guarda siempre normalizado y sin espacios. Para WhatsApp se antepone el
 *  598 y se saca el 0 inicial.
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Deja el teléfono como se guarda: solo dígitos, formato 09XXXXXXX.
 * Acepta "+598 99 767 134", "099-767-134", "99767134"…
 * Devuelve null si no queda nada.
 */
export function normalizarTelefono(entrada: string | null | undefined): string | null {
  if (!entrada) return null;

  let d = entrada.replace(/\D/g, '');
  if (!d) return null;

  // Prefijo internacional, con o sin ceros de salida.
  d = d.replace(/^(00)?598/, '');

  // Celular sin el 0: 99767134 → 099767134
  if (d.length === 8 && d.startsWith('9')) d = '0' + d;

  return d;
}

/** true si parece un teléfono uruguayo usable. */
export function telefonoValido(entrada: string | null | undefined): boolean {
  const d = normalizarTelefono(entrada);
  if (!d) return false;
  if (d.length === 9 && d.startsWith('09')) return true; // celular
  if (d.length === 8) return true; // fijo
  return false;
}

/** 099767134 → "099 767 134" · 42223344 → "4222 3344" */
export function telefono(valor: string | null | undefined): string {
  const d = normalizarTelefono(valor);
  if (!d) return '—';
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 8) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return d;
}

/** 099767134 → "59899767134", listo para wa.me. Null si no es celular. */
export function telefonoWhatsapp(valor: string | null | undefined): string | null {
  const d = normalizarTelefono(valor);
  if (!d) return null;
  const sinCero = d.replace(/^0/, '');
  // WhatsApp solo tiene sentido en celulares.
  if (sinCero.length !== 8 || !sinCero.startsWith('9')) return null;
  return '598' + sinCero;
}

/** Link de WhatsApp con mensaje pre-armado. Null si el teléfono no sirve. */
export function linkWhatsapp(valor: string | null | undefined, mensaje?: string): string | null {
  const numero = telefonoWhatsapp(valor);
  if (!numero) return null;
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${numero}${texto}`;
}

/* ── Textos ──────────────────────────────────────────────────────────────── */

export function pluralizar(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** "6 prendas" · "1 prenda" */
export function prendas(cantidad: number): string {
  return pluralizar(cantidad, 'prenda', 'prendas');
}
