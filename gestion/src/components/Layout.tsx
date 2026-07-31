import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

interface ItemNav {
  to: string;
  texto: string;
  soloAdmin?: boolean;
  /** `end` para que "/" no quede activo en todas las rutas. */
  end?: boolean;
}

const NAV: ItemNav[] = [
  { to: '/', texto: 'Recibir ropa', end: true },
  { to: '/ordenes', texto: 'Órdenes' },
  { to: '/clientes', texto: 'Clientes' },
  { to: '/articulos', texto: 'Artículos', soloAdmin: true },
];

export function Layout() {
  const { profile, esAdmin, salir } = useAuth();

  const items = NAV.filter((i) => !i.soloAdmin || esAdmin);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 border-b border-brand-900 bg-brand-900 text-white">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-6 px-4">
          <Link to="/" className="flex shrink-0 items-baseline gap-2">
            <span className="font-display text-base font-bold uppercase tracking-wide">
              El Puente
            </span>
            <span className="font-display text-[11px] uppercase tracking-technical text-aqua-300">
              Gestión
            </span>
          </Link>

          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-sharp px-3 py-2 font-display text-sm font-semibold whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-white/10 text-white shadow-[inset_0_-2px_0_0_theme(colors.aqua.300)]'
                      : 'text-brand-100 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                {item.texto}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 border-l border-white/15 pl-4">
            <div className="hidden text-right leading-tight sm:block">
              <p className="font-display text-sm font-semibold">{profile?.nombre}</p>
              <p className="text-[11px] uppercase tracking-technical text-aqua-300">
                {esAdmin ? 'Admin' : 'Operador'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void salir()}
              className="rounded-sharp border border-white/25 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-brand-100 transition-colors hover:border-white/60 hover:text-white"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

/** Encabezado estándar de pantalla. */
export function EncabezadoPagina({
  titulo,
  detalle,
  acciones,
}: {
  titulo: string;
  detalle?: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">{titulo}</h1>
        {detalle && <p className="mt-1 text-sm text-slate-600">{detalle}</p>}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </div>
  );
}
