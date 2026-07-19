/**
 * Logo placeholder de "Lavadero El Puente" (marca denominativa + arco de puente).
 * ⚠️ REEMPLAZAR por el logo real del negocio cuando esté disponible.
 * Mantener alto máximo ~40px en el header.
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0"
        role="img"
        aria-label="Lavadero El Puente"
      >
        <circle cx="20" cy="20" r="20" className="fill-brand-500" />
        {/* Arco de puente + reflejo/ondas */}
        <path
          d="M8 25 C8 17 32 17 32 25"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M8 25v3M14 25v3M20 22.5v5.5M26 25v3M32 25v3" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M7 31 C11 33 15 29 20 31 C25 33 29 29 33 31"
          fill="none"
          stroke="#4ECEDA"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-brand-700">
          El Puente
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-aqua-600">
          Lavadero
        </span>
      </span>
    </span>
  );
}
