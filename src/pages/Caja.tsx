import { Pendiente } from '@/components/Pendiente';

export default function Caja() {
  return (
    <Pendiente
      titulo="Caja del día"
      etapa={8}
      detalle="Cobros del día agrupados por método de pago, detalle de cada uno, selector de fecha y exportación a CSV."
    />
  );
}
