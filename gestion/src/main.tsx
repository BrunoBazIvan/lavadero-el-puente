import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);

/**
 * `lib/supabase.ts` explota al importarse si faltan las variables de entorno.
 * Sin esto la app quedaría en pantalla blanca y el error solo en la consola,
 * que es justo lo que pasa la primera vez que alguien la instala.
 */
async function arrancar() {
  try {
    const { default: App } = await import('./App');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    root.render(<ErrorDeConfiguracion mensaje={(error as Error)?.message ?? String(error)} />);
  }
}

function ErrorDeConfiguracion({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="panel max-w-lg p-6">
        <p className="eyebrow text-alerta">Falta configurar la app</p>
        <h1 className="mt-2 font-display text-xl font-bold text-brand-900">
          No se pudo iniciar el sistema
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{mensaje}</p>
        <pre className="mt-4 overflow-x-auto rounded-sharp border border-brand-100 bg-brand-50 p-3 text-xs text-brand-900">
          {`cp .env.example .env.local\n# completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY\nnpm run dev`}
        </pre>
      </div>
    </div>
  );
}

void arrancar();
