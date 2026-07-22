/**
 * Logo del header: isotipo real de marca (ola en círculo, extraído del logo
 * oficial) + marca denominativa. El isotipo vive en /public/isotipo.png.
 * Mantener alto ~36px en el header.
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/isotipo.png"
        alt="Lavadero Industrial El Puente"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 object-contain"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-brand-700">
          El Puente
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-aqua-600">
          Lavadero Industrial
        </span>
      </span>
    </span>
  );
}
