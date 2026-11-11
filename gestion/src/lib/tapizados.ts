import type { EstadoTapizado, ProductoTapizado, Tapizado } from '@/types/database';

/** Lo que se limpia, en el orden en que aparecen los botones. */
export const PRODUCTOS: { valor: ProductoTapizado; texto: string }[] = [
  { valor: 'sillon_1', texto: 'Sillón 1 cuerpo' },
  { valor: 'sillon_2', texto: 'Sillón 2 cuerpos' },
  { valor: 'sillon_3', texto: 'Sillón 3 cuerpos' },
  { valor: 'sillon_esquinero', texto: 'Sillón esquinero' },
  { valor: 'silla', texto: 'Silla' },
  { valor: 'colchon_1', texto: 'Colchón 1 plaza' },
  { valor: 'colchon_2', texto: 'Colchón 2 plazas' },
  { valor: 'alfombra', texto: 'Alfombra' },
  { valor: 'otro', texto: 'Otro' },
];

const TEXTO_PRODUCTO = Object.fromEntries(PRODUCTOS.map((p) => [p.valor, p.texto])) as Record<
  ProductoTapizado,
  string
>;

/** "Sillón 2 cuerpos", o lo que se escribió si es "Otro". */
export function nombreProducto(t: Pick<Tapizado, 'producto' | 'producto_otro'>): string {
  if (t.producto === 'otro') return t.producto_otro?.trim() || 'Otro';
  return TEXTO_PRODUCTO[t.producto];
}

export const ETAPAS: EstadoTapizado[] = ['pendiente', 'terminado', 'cobrado'];

export const TEXTO_ETAPA: Record<EstadoTapizado, string> = {
  pendiente: 'Pendiente',
  terminado: 'Terminado',
  cobrado: 'Cobrado',
};

/** La etapa a la que se vuelve con "volver atrás". */
export const ETAPA_ANTERIOR: Record<EstadoTapizado, EstadoTapizado | null> = {
  pendiente: null,
  terminado: 'pendiente',
  cobrado: 'terminado',
};

/**
 * "3,2" o "3.2" → 3.2. En el celular el teclado numérico trae coma o punto
 * según el idioma, y los dos tienen que andar. Vacío o inválido → null.
 */
export function leerDecimal(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/** Metros cuadrados, redondeados a 2 decimales como en la base. */
export function metrosCuadrados(ancho: number, largo: number): number {
  return Math.round(ancho * largo * 100) / 100;
}

/**
 * Precio de una alfombra. Mismo cálculo que la columna `precio_final`
 * (migración 0010): ancho × largo × $/m², redondeado al peso.
 */
export function precioAlfombra(ancho: number, largo: number, precioM2: number): number {
  const a = Math.round(ancho * 100) / 100;
  const l = Math.round(largo * 100) / 100;
  return Math.round(a * l * precioM2);
}

/** 6.4 → "6,40" */
export function decimal(n: number): string {
  return n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
