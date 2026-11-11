import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import type { ComponentType, ReactNode } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import {
  IconoAlerta,
  IconoAnalitica,
  IconoArticulos,
  IconoClientes,
  IconoLista,
  IconoMenu,
  IconoOrdenes,
  IconoRecibida,
  IconoRecibir,
  IconoSalir,
  IconoTapizado,
  IconoVolver,
  IconoX,
} from '@/components/Iconos';
import { DIAS_SIN_RETIRAR, useResumenPendientes } from '@/hooks/useOrdenes';

interface ItemNav {
  to: string;
  texto: string;
  icono: ComponentType<{ size?: number; className?: string }>;
  soloAdmin?: boolean;
  /** `end` para que "/" no quede activo en todas las rutas. */
  end?: boolean;
}

const NAV: ItemNav[] = [
  { to: '/', texto: 'Recibir ropa', icono: IconoRecibir, end: true },
  { to: '/ordenes', texto: 'Órdenes', icono: IconoOrdenes },
  { to: '/clientes', texto: 'Clientes', icono: IconoClientes, soloAdmin: true },
  { to: '/articulos', texto: 'Artículos', icono: IconoArticulos, soloAdmin: true },
  { to: '/analiticas', texto: 'Analíticas', icono: IconoAnalitica, soloAdmin: true },
  { to: '/tapizados', texto: 'Tapizados', icono: IconoTapizado, soloAdmin: true },
];

export function Layout() {
  const { profile, esAdmin, salir } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const { pathname, search } = useLocation();

  const items = NAV.filter((i) => !i.soloAdmin || esAdmin);

  // El menú del celular se cierra al llegar a otra pantalla…
  useEffect(() => setMenuAbierto(false), [pathname, search]);

  // …y con Escape o tocando fuera de él.
  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    const alTocar = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setMenuAbierto(false);
    };
    document.addEventListener('keydown', alTeclado);
    document.addEventListener('pointerdown', alTocar);
    return () => {
      document.removeEventListener('keydown', alTeclado);
      document.removeEventListener('pointerdown', alTocar);
    };
  }, [menuAbierto]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* El encabezado y la barra de pendientes viajan juntos y quedan fijos:
          "qué hay para hacer" no se pierde al bajar en una lista larga. */}
      <div ref={contenedor} className="sticky top-0 z-30">
        <header className="border-b border-brand-900 bg-brand-900 text-white">
          <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-6 px-4">
            <Link to="/" className="flex shrink-0 items-baseline gap-2">
              <span className="font-display text-lg font-bold uppercase tracking-wide">
                El Puente
              </span>
              <span className="hidden font-display text-[11px] uppercase tracking-technical text-aqua-300 sm:inline">
                Gestión
              </span>
            </Link>

            {/* Celular y tablet: en vez de una tira que se desliza de costado
                —donde las secciones de la derecha no se ven—, un botón que
                abre la lista entera. */}
            <button
              type="button"
              aria-expanded={menuAbierto}
              aria-controls="menu-movil"
              onClick={() => setMenuAbierto((v) => !v)}
              className="ml-auto flex min-h-[2.75rem] items-center gap-2 rounded-sharp border border-white/25 px-3.5 font-display text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:border-white/60 lg:hidden"
            >
              {menuAbierto ? <IconoX size={20} /> : <IconoMenu size={20} />}
              {menuAbierto ? 'Cerrar' : 'Menú'}
            </button>

            <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
              {items.map(({ to, texto, icono: Icono, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      'flex shrink-0 items-center gap-2 rounded-sharp px-3.5 py-2.5 font-display',
                      'text-[0.9375rem] font-semibold whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-white/10 text-white shadow-[inset_0_-2px_0_0_theme(colors.aqua.300)]'
                        : 'text-brand-100 hover:bg-white/5 hover:text-white',
                    ].join(' ')
                  }
                >
                  <Icono size={19} />
                  {texto}
                </NavLink>
              ))}
            </nav>

            <div className="hidden shrink-0 items-center gap-3 border-l border-white/15 pl-4 lg:flex">
              <div className="text-right leading-tight">
                <p className="font-display text-sm font-semibold">{profile?.nombre}</p>
                <p className="text-[11px] uppercase tracking-technical text-aqua-300">
                  {esAdmin ? 'Admin' : 'Operador'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void salir()}
                className="flex items-center gap-2 rounded-sharp border border-white/25 px-3 py-2 font-display text-xs font-semibold uppercase tracking-wide text-brand-100 transition-colors hover:border-white/60 hover:text-white"
              >
                <IconoSalir size={16} />
                Salir
              </button>
            </div>
          </div>
        </header>

        {menuAbierto && (
          <nav
            id="menu-movil"
            aria-label="Secciones"
            className="max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-brand-900 bg-brand-900 text-white lg:hidden"
          >
            <ul className="divide-y divide-white/10 border-t border-white/10">
              {items.map(({ to, texto, icono: Icono, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      [
                        'flex min-h-[3.25rem] items-center gap-3 px-4 font-display text-base font-semibold transition-colors',
                        isActive
                          ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_theme(colors.aqua.300)]'
                          : 'text-brand-100 hover:bg-white/5 hover:text-white',
                      ].join(' ')
                    }
                  >
                    <Icono size={20} />
                    {texto}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-white/15 px-4 py-3">
              <div className="leading-tight">
                <p className="font-display text-sm font-semibold">{profile?.nombre}</p>
                <p className="text-[11px] uppercase tracking-technical text-aqua-300">
                  {esAdmin ? 'Admin' : 'Operador'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void salir()}
                className="flex min-h-[2.75rem] items-center gap-2 rounded-sharp border border-white/25 px-3.5 font-display text-xs font-semibold uppercase tracking-wide text-brand-100 transition-colors hover:border-white/60 hover:text-white"
              >
                <IconoSalir size={16} />
                Salir
              </button>
            </div>
          </nav>
        )}

        <BarraPendientes />
      </div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

/* ── Barra de pendientes ──────────────────────────────────────────────────── */

/**
 * Lo que hay para hacer, siempre arriba y en todas las pantallas.
 *
 * Es la respuesta a la pregunta con la que se arranca el turno —"¿qué quedó
 * pendiente?"— sin tener que ir a Órdenes y probar filtros. Cada celda es un
 * link al listado ya filtrado, así que también sirve de atajo.
 *
 * Mientras carga no muestra ceros: un cero falso hace que alguien dé por
 * cerrado el día cuando en realidad todavía no llegó el dato.
 */
function BarraPendientes() {
  const { data } = useResumenPendientes();

  // Reserva la altura desde el vamos: si apareciera recién con el dato, todo
  // lo de abajo daría un salto justo cuando alguien va a hacer clic.
  if (!data) return <div className="h-11 border-b border-brand-200 bg-white" />;

  const nada = data.recibido + data.en_proceso + data.listo === 0;

  return (
    <div className="border-b border-brand-200 bg-white">
      <div className="mx-auto w-full max-w-[1600px] px-4">
        {nada ? (
          <p className="py-2.5 text-sm text-slate-500">
            No hay ropa pendiente en el lavadero. Todo entregado.
          </p>
        ) : (
          <div className="flex flex-wrap items-stretch gap-x-1 gap-y-0">
            <CeldaPendiente
              a="/ordenes?estado=recibido"
              icono={IconoRecibida}
              etiqueta="Sin empezar"
              cantidad={data.recibido}
            />
            <CeldaPendiente
              a="/ordenes?estado=listo"
              icono={IconoLista}
              etiqueta="Listas para retirar"
              cantidad={data.listo}
              destacada
            />
            {data.olvidadas > 0 && (
              <CeldaPendiente
                a="/ordenes?ver=olvidadas"
                icono={IconoAlerta}
                etiqueta={`Sin retirar hace +${DIAS_SIN_RETIRAR} días`}
                cantidad={data.olvidadas}
                alerta
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CeldaPendiente({
  a,
  icono: Icono,
  etiqueta,
  cantidad,
  destacada = false,
  alerta = false,
}: {
  a: string;
  icono: ComponentType<{ size?: number; className?: string }>;
  etiqueta: string;
  cantidad: number;
  destacada?: boolean;
  alerta?: boolean;
}) {
  const apagada = cantidad === 0;

  return (
    <Link
      to={a}
      className={[
        'flex items-center gap-2.5 rounded-sharp px-3 py-2.5 transition-colors',
        alerta ? 'text-aviso hover:bg-amber-50' : 'text-brand-800 hover:bg-brand-50',
        apagada ? 'text-slate-400 hover:bg-slate-50' : '',
      ].join(' ')}
    >
      <Icono size={18} className="shrink-0" />
      <span
        className={`tabular font-display font-bold leading-none ${
          destacada && !apagada ? 'text-2xl' : 'text-xl'
        }`}
      >
        {cantidad}
      </span>
      <span className="font-display text-[0.8125rem] font-semibold uppercase tracking-wide leading-tight">
        {etiqueta}
      </span>
    </Link>
  );
}

/* ── Encabezado de pantalla ───────────────────────────────────────────────── */

/** Encabezado estándar de pantalla. */
export function EncabezadoPagina({
  titulo,
  detalle,
  acciones,
  volver,
}: {
  titulo: string;
  detalle?: ReactNode;
  acciones?: ReactNode;
  /** Adónde se vuelve. Arriba, que es donde se lo busca — no al pie. */
  volver?: { a: string; texto: string };
}) {
  return (
    <div className="mb-6">
      {volver && (
        <Link
          to={volver.a}
          className="mb-3 inline-flex items-center gap-2 font-display text-sm font-semibold text-brand-600 transition-colors hover:text-brand-900"
        >
          <IconoVolver size={16} />
          {volver.texto}
        </Link>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight text-brand-900">{titulo}</h1>
          {detalle && <div className="mt-1.5 text-[0.9375rem] text-slate-600">{detalle}</div>}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
    </div>
  );
}
