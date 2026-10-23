import { addDays, format, startOfDay } from 'date-fns';

/**
 * Fecha de retiro estimada: `dias` días contados desde hoy. El lavadero abre
 * todos los días, así que no se saltea ninguno.
 */
export function fechaRetiroEstimada(dias: number, desde: Date = new Date()): Date {
  return addDays(startOfDay(desde), Math.max(0, Math.floor(dias)));
}

/** `aaaa-mm-dd`, que es lo que esperan el input date y las columnas `date`. */
export function aValorInput(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd');
}

/** Hoy, en formato de input date. Para el mínimo del selector de fecha. */
export function hoyInput(): string {
  return aValorInput(new Date());
}
