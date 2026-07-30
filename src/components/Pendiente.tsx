import { EncabezadoPagina } from '@/components/Layout';

/**
 * Marcador de pantalla todavía no construida.
 *
 * Existe para que el ruteo, los permisos y el layout se puedan probar enteros
 * desde la etapa 2. Cada etapa siguiente reemplaza uno de estos archivos.
 */
export function Pendiente({ titulo, etapa, detalle }: { titulo: string; etapa: number; detalle: string }) {
  return (
    <>
      <EncabezadoPagina titulo={titulo} />
      <div className="panel px-6 py-14 text-center">
        <p className="eyebrow">Etapa {etapa}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">{detalle}</p>
      </div>
    </>
  );
}
