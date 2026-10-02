import type { PuntoSerieAnalitica } from '@/types/database';

/**
 * Gráficas de Analíticas, en SVG a mano — mismo criterio que `Iconos.tsx`: la
 * PC del mostrador tiene que renderizar sin internet, así que no entra una
 * librería de gráficos.
 *
 * Reglas del sistema de diseño que aplican acá: aristas rectas (nada de `rx`
 * en las barras), bloques de color planos sin degradados ni sombras, sin
 * `hover:-translate-y`. El tooltip es el `<title>` nativo del SVG: cero
 * JavaScript, funciona offline, y no hay que mantener un componente de
 * tooltip aparte.
 *
 * Las dos gráficas cortan el eje en `diasMes`, no en el largo de `dias`: la
 * serie trae `greatest(dias_mes, dias_mes_anterior)` puntos para que el
 * acumulado del mes anterior no se corte de más cuando ese mes tenía 31 días
 * y el actual 30 — pero el dominio visible es el mes que se está mirando.
 */

const ANCHO_MINIMO = 320;
const ALTO = 140;
const PADDING_SUP = 10;

function porDia(dias: PuntoSerieAnalitica[]): Map<number, PuntoSerieAnalitica> {
  return new Map(dias.map((p) => [p.dia, p]));
}

interface BarrasPorDiaProps {
  dias: PuntoSerieAnalitica[];
  diasMes: number;
  etiqueta: string;
  valor: (p: PuntoSerieAnalitica) => number;
  valorAnterior: (p: PuntoSerieAnalitica) => number;
  formatear: (n: number) => string;
}

/**
 * Una barra por día del mes en curso (`brand-800`), con la del mes anterior
 * de fondo (`brand-200`) para el mismo día — no lado a lado, superpuestas: el
 * mes actual al frente, más angosta, sobre la del anterior, que ocupa todo el
 * ancho del día.
 */
export function BarrasPorDia({ dias, diasMes, etiqueta, valor, valorAnterior, formatear }: BarrasPorDiaProps) {
  const mapa = porDia(dias);
  const puntos = Array.from({ length: diasMes }, (_, i) => mapa.get(i + 1));

  const maximo = Math.max(
    1,
    ...puntos.map((p) => (p ? valor(p) : 0)),
    ...puntos.map((p) => (p ? valorAnterior(p) : 0)),
  );

  const anchoDia = 16;
  const ancho = Math.max(ANCHO_MINIMO, diasMes * anchoDia);
  const altoUtil = ALTO - PADDING_SUP - 20; // deja lugar al número de día abajo

  const escalaY = (v: number) => (v / maximo) * altoUtil;

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={`${etiqueta}, un día a la vez, comparado con el mismo día del mes anterior`}
        width={ancho}
        height={ALTO}
        viewBox={`0 0 ${ancho} ${ALTO}`}
        style={{ minWidth: ancho }}
      >
        {puntos.map((p, i) => {
          const dia = i + 1;
          const x = i * anchoDia;
          const vActual = p ? valor(p) : 0;
          const vAnterior = p ? valorAnterior(p) : 0;
          const hActual = escalaY(vActual);
          const hAnterior = escalaY(vAnterior);
          const base = PADDING_SUP + altoUtil;

          return (
            <g key={dia}>
              <title>
                {`Día ${dia}: ${formatear(vActual)} (mes anterior: ${formatear(vAnterior)})`}
              </title>
              {/* Mes anterior: de fondo, ocupa casi todo el ancho del día. */}
              <rect
                x={x + 1}
                y={base - hAnterior}
                width={anchoDia - 2}
                height={hAnterior}
                className="fill-brand-200"
              />
              {/* Mes en curso: al frente, más angosta y centrada. */}
              <rect
                x={x + anchoDia / 2 - 3}
                y={base - hActual}
                width={6}
                height={hActual}
                className="fill-brand-800"
              />
              {dia % 5 === 0 && (
                <text
                  x={x + anchoDia / 2}
                  y={ALTO - 4}
                  textAnchor="middle"
                  className="fill-slate-400 font-sans text-[9px]"
                >
                  {dia}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface LineaAcumuladoProps {
  dias: PuntoSerieAnalitica[];
  diasMes: number;
  /** Solo si se está mirando el mes en curso: marca hasta dónde hay datos reales. */
  diaDeHoy: number | null;
  etiqueta: string;
  valor: (p: PuntoSerieAnalitica) => number;
  valorAnterior: (p: PuntoSerieAnalitica) => number;
  formatear: (n: number) => string;
}

/**
 * Dos curvas de acumulado: mes en curso sólida, mes anterior punteada. Si se
 * está mirando el mes en curso, un punto marca "hoy": comparar el acumulado
 * completo del mes anterior contra un mes a medio terminar es engañoso sin
 * esa marca.
 */
export function LineaAcumulado({
  dias,
  diasMes,
  diaDeHoy,
  etiqueta,
  valor,
  valorAnterior,
  formatear,
}: LineaAcumuladoProps) {
  const mapa = porDia(dias);
  let acumActual = 0;
  let acumAnterior = 0;
  const puntos = Array.from({ length: diasMes }, (_, i) => {
    const p = mapa.get(i + 1);
    acumActual += p ? valor(p) : 0;
    acumAnterior += p ? valorAnterior(p) : 0;
    return { dia: i + 1, actual: acumActual, anterior: acumAnterior };
  });

  const maximo = Math.max(1, acumActual, acumAnterior);
  const anchoDia = 16;
  const ancho = Math.max(ANCHO_MINIMO, diasMes * anchoDia);
  const altoUtil = ALTO - PADDING_SUP - 20;
  const base = PADDING_SUP + altoUtil;

  const x = (dia: number) => (dia - 1) * anchoDia + anchoDia / 2;
  const y = (v: number) => base - (v / maximo) * altoUtil;

  const trazo = (clave: 'actual' | 'anterior') =>
    puntos.map((p) => `${x(p.dia)},${y(p[clave])}`).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={`${etiqueta} acumulado en el mes, comparado con el mes anterior`}
        width={ancho}
        height={ALTO}
        viewBox={`0 0 ${ancho} ${ALTO}`}
        style={{ minWidth: ancho }}
      >
        <polyline
          points={trazo('anterior')}
          fill="none"
          className="stroke-brand-300"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        <polyline points={trazo('actual')} fill="none" className="stroke-brand-800" strokeWidth={2} />

        {diaDeHoy !== null && diaDeHoy >= 1 && diaDeHoy <= diasMes && (
          <g>
            <line
              x1={x(diaDeHoy)}
              y1={PADDING_SUP}
              x2={x(diaDeHoy)}
              y2={base}
              className="stroke-slate-300"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle cx={x(diaDeHoy)} cy={y(acumActual)} r={3} className="fill-brand-800" />
            <text
              x={x(diaDeHoy)}
              y={PADDING_SUP - 2}
              textAnchor="middle"
              className="fill-slate-500 font-sans text-[9px] font-semibold"
            >
              hoy
            </text>
            <title>{`Hoy, día ${diaDeHoy}: ${formatear(acumActual)} acumulado`}</title>
          </g>
        )}
      </svg>
    </div>
  );
}
