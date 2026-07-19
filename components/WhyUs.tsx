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
    <section className="bg-brand-50/70">
      <div className="container-x section">
        <Reveal className="max-w-2xl">
          <span className="eyebrow mb-4">Por qué El Puente</span>
          <h2 className="h2">Un lavadero en el que podés confiar</h2>
          {trayectoria && <p className="lead mt-4">{trayectoria}.</p>}
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {differentiators.map((d, i) => (
            <Reveal key={d.title} delay={(i % 4) * 60}>
              <div className="flex h-full flex-col rounded-card border border-brand-100 bg-white p-6 shadow-card">
                <span className="h-1.5 w-10 rounded-full bg-aqua-400" />
                <h3 className="mt-4 font-display text-lg font-bold text-brand-800">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{d.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
