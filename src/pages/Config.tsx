import { Pendiente } from '@/components/Pendiente';

export default function Config() {
  return (
    <Pendiente
      titulo="Configuración"
      etapa={9}
      detalle="Nombre del negocio, dirección, WhatsApp, leyenda del ticket, días de entrega por defecto y ancho del ticket."
    />
  );
}
