import { addDays, format, parseISO, startOfDay } from 'date-fns';

/**
 * Fecha de retiro estimada: `dias` días de trabajo contados desde hoy,
 * **sin contar los domingos** — el lavadero abre de lunes a sábado, así que un
 * domingo no adelanta nada y prometer para un domingo es prometer de más.
 *
 * Con `dias = 2` un jueves da sábado; un viernes da lunes.
 */
export function fechaRetiroEstimada(dias: number, desde: Date = new Date()): Date {
  let fecha = startOfDay(desde);
  let restantes = Math.max(0, Math.floor(dias));

  while (restantes > 0) {
    fecha = addDays(fecha, 1);
    if (fecha.getDay() !== 0) restantes--;
  }

  // Si `dias` era 0 y hoy es domingo, corremos al lunes.
  while (fecha.getDay() === 0) fecha = addDays(fecha, 1);

  return fecha;
}

/** `aaaa-mm-dd`, que es lo que esperan el input date y las columnas `date`. */
export function aValorInput(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd');
}

export function esDomingo(valor: string | Date): boolean {
  const fecha = typeof valor === 'string' ? parseISO(valor) : valor;
  return fecha.getDay() === 0;
}

/** Hoy, en formato de input date. Para el mínimo del selector de fecha. */
export function hoyInput(): string {
  return aValorInput(new Date());
}
