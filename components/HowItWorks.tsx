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
      body: 'Contanos qué necesitás lavar. Es el paso más fácil y sin compromiso.',
    },
    {
      n: '2',
      title: step2,
      body: business.pickupDelivery
        ? 'Nos organizamos según lo que te quede mejor y arrancamos con el trabajo.'
        : 'Coordinamos día y horario para recibir tus prendas y arrancar.',
    },
    {
      n: '3',
      title: 'Te avisamos cuando está listo',
      body: 'Retirás todo limpio, seco y prolijo, listo para usar o guardar.',
    },
  ];

  return (
    <section className="section">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <span className="eyebrow mb-4">Simple y sin vueltas</span>
          <h2 className="h2">Cómo funciona</h2>
          <p className="lead mt-4">En tres pasos y sin salir de WhatsApp.</p>
        </Reveal>

        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} as="li" delay={i * 80}>
              <div className="flex h-full flex-col rounded-card border border-brand-100 bg-white p-7 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-brand-800">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
