import { business } from '@/lib/config';
import Reveal from './Reveal';

/** 5.6 — Cómo funciona: proceso en 3 pasos. Reduce fricción. */
export default function HowItWorks() {
  const step2 = business.pickupDelivery
    ? 'Traés tus prendas o coordinamos el retiro'
    : 'Traés tus prendas al lavadero';

  const steps = [
    {
      n: '1',
      title: 'Escribinos por WhatsApp',
      body: 'Contanos qué necesitás lavar. No hace falta que sepas cantidades exactas.',
    },
    {
      n: '2',
      title: step2,
      body: business.pickupDelivery
        ? 'Vemos qué te queda más cómodo, arreglamos día y horario, y arrancamos.'
        : 'Arreglamos día y horario para recibir tus prendas, y arrancamos.',
    },
    {
      n: '3',
      title: 'Te avisamos cuando está listo',
      body: business.pickupDelivery
        ? 'Pasás por el lavadero o te lo llevamos a domicilio, limpio y doblado.'
        : 'Pasás por el lavadero y retirás todo limpio, seco y listo para guardar.',
    },
  ];

  return (
    <section className="section">
      <div className="container-x">
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="eyebrow">Simple y sin vueltas</span>
            <h2 className="h2 mt-6">Cómo funciona</h2>
          </div>
          <p className="text-base leading-relaxed text-brand-600 lg:col-span-5 lg:pb-2">
            En tres pasos y sin salir de WhatsApp.
          </p>
        </Reveal>

        {/* Pasos: la cifra grande es el ancla visual, el filete superior marca
            el inicio de cada columna. Sin tarjetas ni sombras. */}
        <ol className="mt-16 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} as="li" delay={i * 80}>
              <div className="flex h-full flex-col border-t-2 border-brand-800 pt-6">
                <span className="tnum font-display text-5xl font-bold leading-none tracking-[-0.04em] text-brand-200">
                  {String(s.n).padStart(2, '0')}
                </span>
                <h3 className="mt-7 font-display text-xl font-bold leading-snug tracking-[-0.02em] text-brand-800">
                  {s.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-brand-600">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
