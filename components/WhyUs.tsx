import { business } from '@/lib/config';
import { differentiators } from '@/lib/content';
import Reveal from './Reveal';

/** 5.7 — Por qué El Puente. Diferenciales honestos, sin cifras inventadas. */
export default function WhyUs() {
  // Solo mostramos años de trayectoria si el dato real está cargado.
  const trayectoria =
    business.yearsActive && business.yearsActive > 0
      ? `${business.yearsActive} años trabajando en Maldonado`
      : null;

  return (
    <section className="border-y border-brand-100 bg-brand-50/60">
      <div className="container-x section">
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="eyebrow">Por qué El Puente</span>
            <h2 className="h2 mt-6">Un lavadero en el que podés confiar</h2>
          </div>
          {trayectoria && (
            <p className="text-base leading-relaxed text-brand-600 lg:col-span-5 lg:pb-2">
              {trayectoria}.
            </p>
          )}
        </Reveal>

        <div className="matrix mt-14 sm:grid-cols-2 lg:grid-cols-4">
          {differentiators.map((d, i) => (
            <Reveal key={d.title} delay={(i % 4) * 60} className="matrix-cell">
              <div className="flex h-full flex-col p-7 sm:p-8">
                <span className="tnum font-display text-[0.6875rem] font-bold uppercase tracking-technical text-aqua-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-10 font-display text-lg font-bold leading-snug tracking-[-0.015em] text-brand-800">
                  {d.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-600">{d.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
