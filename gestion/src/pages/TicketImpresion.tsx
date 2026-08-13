import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EstadoError, EstadoVacio, PantallaCargando } from '@/components/Estados';
import { useOrden } from '@/hooks/useOrdenes';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { armarComprobante } from '@/lib/print/ticket';
import { mensajeDeError } from '@/lib/supabase';

/**
 * Vista de los comprobantes solos, sin la interfaz de la app.
 *
 * Sirve para dos cosas: probar cómo cortan los renglones sin gastar rollo, y
 * reimprimir desde otra máquina entrando directo a /print/EP-00123.
 */
export default function TicketImpresion() {
  const { ref } = useParams<{ ref: string }>();
  const marco = useRef<HTMLIFrameElement>(null);
  // El alto lo dicta el contenido: entre los ítems de la orden y el talón del
  // lavadero, un alto fijo o recorta el papel o deja medio metro en blanco.
  const [alto, setAlto] = useState(200);

  const { data: orden, isPending, error, refetch } = useOrden(ref);
  const { data: config } = useConfiguracion();

  if (isPending || !config) return <PantallaCargando texto="Cargando comprobante…" />;

  if (error) {
    return <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />;
  }

  if (!orden) {
    return (
      <EstadoVacio
        titulo={`No existe la orden ${ref}`}
        detalle="Revisá la referencia del comprobante."
        accion={
          <Link to="/" className="btn-primary">
            Ir al inicio
          </Link>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between gap-3 print:hidden">
          <Link to={`/ordenes/${orden.ref}`} className="text-sm text-brand-600 underline">
            ← Volver a la orden
          </Link>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              marco.current?.contentWindow?.focus();
              marco.current?.contentWindow?.print();
            }}
          >
            Imprimir
          </button>
        </div>

        <iframe
          ref={marco}
          title={`Comprobante ${orden.ref}`}
          srcDoc={armarComprobante(orden, config)}
          onLoad={() => {
            const doc = marco.current?.contentDocument;
            if (doc) setAlto(doc.documentElement.scrollHeight + 8);
          }}
          style={{ height: `${alto}px` }}
          className="w-[80mm] border-0 bg-white"
        />
      </div>
    </div>
  );
}
