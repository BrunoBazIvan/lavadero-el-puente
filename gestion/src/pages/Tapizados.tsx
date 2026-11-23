import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { BloqueCargando, EstadoError, EstadoVacio } from '@/components/Estados';
import {
  IconoBuscar,
  IconoCheck,
  IconoDinero,
  IconoMas,
  IconoMenos,
  IconoX,
} from '@/components/Iconos';
import { ChipEtapa, FormularioTapizado } from '@/components/Tapizado';
import { useToast } from '@/components/Toaster';
import { useDebounce } from '@/hooks/useDebounce';
import { useCambiarEtapa, useTapizados } from '@/hooks/useTapizados';
import { aValorInput } from '@/lib/fechas';
import { fecha, moneda } from '@/lib/format';
import { mensajeDeError } from '@/lib/supabase';
import { PRODUCTOS, resumenArticulos, type PasoTapizado } from '@/lib/tapizados';
import type { EstadoTapizado, ProductoTapizado, Tapizado } from '@/types/database';

/**
 * Las etapas de todos los días van a la vista, en botones. "Todos" y
 * "Anulados" son para buscar algo puntual y viven en "Más filtros": la lista
 * arranca en lo que hay que hacer, no en el archivo entero.
 */
type Filtro = EstadoTapizado | 'todos';
const PRINCIPALES: { valor: PasoTapizado; texto: string }[] = [
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'terminado', texto: 'Por cobrar' },
  { valor: 'cobrado', texto: 'Cobrados' },
];
const EXTRAS: { valor: Filtro; texto: string; detalle: string }[] = [
  { valor: 'todos', texto: 'Todos', detalle: 'Pendientes, por cobrar y cobrados juntos' },
  { valor: 'anulado', texto: 'Anulados', detalle: 'Los que se anularon, con su motivo' },
];
const FILTROS: Filtro[] = [...PRINCIPALES.map((p) => p.valor), 'todos', 'anulado'];
const POR_DEFECTO: Filtro = 'pendiente';

type Periodo = 'este-mes' | 'mes-pasado';
type Orden = 'nuevos' | 'viejos' | 'precio';
const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: 'nuevos', texto: 'Más nuevos primero' },
  { valor: 'viejos', texto: 'Más viejos primero' },
  { valor: 'precio', texto: 'Más caros primero' },
];

/** Desde y hasta de un atajo de período, como `aaaa-mm-dd`. */
function rangoDe(periodo: Periodo): { desde: string; hasta: string } {
  const base = periodo === 'este-mes' ? new Date() : subMonths(new Date(), 1);
  return { desde: aValorInput(startOfMonth(base)), hasta: aValorInput(endOfMonth(base)) };
}

/** El día local en que se cargó, para comparar con los inputs de fecha. */
const diaDe = (iso: string) => format(new Date(iso), 'yyyy-MM-dd');

const esFecha = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export default function Tapizados() {
  const [altaAbierta, setAltaAbierta] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  /**
   * Todos los filtros viven en la URL, como en Órdenes: F5 o "atrás" no los
   * pierden. Sin `estado`, la lista arranca en Pendientes.
   */
  const [parametros, setParametros] = useSearchParams();
  const pedido = parametros.get('estado') as Filtro | null;
  const filtro: Filtro = pedido && FILTROS.includes(pedido) ? pedido : POR_DEFECTO;
  const desde = esFecha(parametros.get('desde')) ? parametros.get('desde')! : '';
  const hasta = esFecha(parametros.get('hasta')) ? parametros.get('hasta')! : '';
  const pedidoProducto = parametros.get('producto') as ProductoTapizado | null;
  const producto = PRODUCTOS.some((p) => p.valor === pedidoProducto) ? pedidoProducto : null;
  const pedidoOrden = parametros.get('orden') as Orden | null;
  const orden: Orden = ORDENES.some((o) => o.valor === pedidoOrden) ? pedidoOrden! : 'nuevos';

  /** Cambia un parámetro y deja los demás. Vacío o el valor por defecto lo saca. */
  const fijar = (cambios: Record<string, string | null>) => {
    const nuevos = new URLSearchParams(parametros);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) nuevos.set(clave, valor);
      else nuevos.delete(clave);
    }
    if (nuevos.get('estado') === POR_DEFECTO) nuevos.delete('estado');
    if (nuevos.get('orden') === 'nuevos') nuevos.delete('orden');
    setParametros(nuevos, { replace: true });
  };
  const filtrar = (f: Filtro) => fijar({ estado: f });

  // Cuántos filtros de "Más filtros" están puestos, para el botón.
  const extrasActivos =
    (filtro === 'todos' || filtro === 'anulado' ? 1 : 0) +
    (desde || hasta ? 1 : 0) +
    (producto ? 1 : 0) +
    (orden !== 'nuevos' ? 1 : 0);
  const [masFiltros, setMasFiltros] = useState(extrasActivos > 0);

  const limpiar = () => {
    setBusqueda('');
    setParametros({}, { replace: true });
  };

  const { data: todos, isPending, error, refetch } = useTapizados();
  const busquedaDemorada = useDebounce(busqueda, 200);

  /** Búsqueda, fechas y artículo: todo menos la etapa. De acá salen las cuentas. */
  const base = useMemo(() => {
    const texto = busquedaDemorada.trim().toLowerCase();
    return (todos ?? []).filter((t) => {
      const dia = diaDe(t.created_at);
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
      if (producto && !t.items.some((i) => i.producto === producto)) return false;
      if (!texto) return true;
      return [t.ref, t.nombre, t.edificio, t.contacto, resumenArticulos(t)]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(texto));
    });
  }, [todos, busquedaDemorada, desde, hasta, producto]);

  const cuenta = useMemo(() => {
    const c: Record<Filtro, number> = { todos: 0, pendiente: 0, terminado: 0, cobrado: 0, anulado: 0 };
    for (const t of base) {
      if (t.estado !== 'anulado') c.todos++;
      c[t.estado]++;
    }
    return c;
  }, [base]);

  /** Lo que ya está hecho y todavía no se cobró. Sin filtros: es la plata de afuera. */
  const resumen = useMemo(() => {
    const lista = todos ?? [];
    return {
      pendientes: lista.filter((t) => t.estado === 'pendiente').length,
      porCobrar: lista.filter((t) => t.estado === 'terminado').length,
      aCobrar: lista
        .filter((t) => t.estado === 'terminado')
        .reduce((suma, t) => suma + Number(t.precio), 0),
    };
  }, [todos]);

  const visibles = useMemo(() => {
    const lista = base.filter((t) =>
      filtro === 'todos' ? t.estado !== 'anulado' : t.estado === filtro,
    );
    if (orden === 'viejos') return [...lista].reverse();
    if (orden === 'precio') return [...lista].sort((a, b) => Number(b.precio) - Number(a.precio));
    return lista;
  }, [base, filtro, orden]);

  const totalVisible = visibles.reduce((s, t) => s + Number(t.precio), 0);
  const hayFiltros = extrasActivos > 0 || filtro !== POR_DEFECTO || busqueda.trim() !== '';
  const periodo: Periodo | null = (['este-mes', 'mes-pasado'] as Periodo[]).find((p) => {
    const r = rangoDe(p);
    return r.desde === desde && r.hasta === hasta;
  }) ?? null;
  const textoExtra = EXTRAS.find((e) => e.valor === filtro)?.texto;

  return (
    <>
      <EncabezadoPagina
        titulo="Tapizados"
        detalle="Sillones, sillas, colchones y alfombras: qué falta hacer y qué falta cobrar."
        acciones={
          <button type="button" className="btn-primary" onClick={() => setAltaAbierta(true)}>
            <IconoMas size={19} />
            Cargar tapizado
          </button>
        }
      />

      {/* Resumen: no se muestran ceros mientras carga. */}
      {todos && (
        <div className="mb-5 grid grid-cols-2 border border-brand-200 bg-white sm:grid-cols-3">
          <Dato etiqueta="Pendientes" valor={String(resumen.pendientes)} />
          <Dato etiqueta="Por cobrar" valor={String(resumen.porCobrar)} />
          <Dato
            etiqueta="Falta cobrar"
            valor={moneda(resumen.aCobrar)}
            className="col-span-2 border-t sm:col-span-1 sm:border-l sm:border-t-0"
          />
        </div>
      )}

      <div className="panel">
        <div className="space-y-3 border-b border-brand-100 px-4 py-4">
          <div className="relative">
            <IconoBuscar
              size={20}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400"
            />
            <label htmlFor="buscar-tapizado" className="sr-only">
              Buscar tapizado
            </label>
            <input
              id="buscar-tapizado"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, edificio, contacto o TP-00001…"
              className="field pl-11"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRINCIPALES.map(({ valor, texto }) => (
              <BotonFiltro
                key={valor}
                activo={filtro === valor}
                onClick={() => filtrar(valor)}
                cantidad={todos ? cuenta[valor] : undefined}
              >
                {texto}
              </BotonFiltro>
            ))}

            <button
              type="button"
              aria-expanded={masFiltros}
              aria-controls="mas-filtros"
              onClick={() => setMasFiltros((v) => !v)}
              className="btn-ghost min-h-[2.75rem] px-3 font-display text-[0.9375rem] sm:ml-auto"
            >
              {masFiltros ? <IconoMenos size={18} /> : <IconoMas size={18} />}
              Más filtros
              {extrasActivos > 0 && (
                <span className="tabular rounded-sharp bg-brand-800 px-1.5 py-0.5 text-xs font-bold text-white">
                  {extrasActivos}
                </span>
              )}
            </button>
          </div>

          {/* Si se está viendo "Todos" o "Anulados", que se note aunque el
              panel esté cerrado: ningún botón de arriba aparece elegido. */}
          {textoExtra && (
            <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] text-slate-700">
              Viendo: <span className="font-display font-bold text-brand-900">{textoExtra}</span>
              <button
                type="button"
                className="btn-ghost px-2 text-sm"
                onClick={() => filtrar(POR_DEFECTO)}
              >
                <IconoX size={14} />
                Volver a pendientes
              </button>
            </p>
          )}

          {masFiltros && (
            <div id="mas-filtros" className="grid gap-px border border-brand-200 bg-brand-200">
              <Grupo titulo="Ver también">
                <div className="flex flex-wrap gap-2">
                  {EXTRAS.map((e) => (
                    <BotonFiltro
                      key={e.valor}
                      activo={filtro === e.valor}
                      onClick={() => filtrar(filtro === e.valor ? POR_DEFECTO : e.valor)}
                      cantidad={todos ? cuenta[e.valor] : undefined}
                      titulo={e.detalle}
                    >
                      {e.texto}
                    </BotonFiltro>
                  ))}
                </div>
              </Grupo>

              <Grupo titulo="¿Cuándo se cargó?">
                <div className="flex flex-wrap gap-2">
                  <BotonFiltro activo={!desde && !hasta} onClick={() => fijar({ desde: null, hasta: null })}>
                    Cualquier fecha
                  </BotonFiltro>
                  <BotonFiltro activo={periodo === 'este-mes'} onClick={() => fijar(rangoDe('este-mes'))}>
                    Este mes
                  </BotonFiltro>
                  <BotonFiltro activo={periodo === 'mes-pasado'} onClick={() => fijar(rangoDe('mes-pasado'))}>
                    El mes pasado
                  </BotonFiltro>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
                  <div>
                    <label className="label" htmlFor="filtro-desde">
                      Desde
                    </label>
                    <input
                      id="filtro-desde"
                      type="date"
                      className="field tabular"
                      value={desde}
                      max={hasta || undefined}
                      onChange={(e) => fijar({ desde: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="filtro-hasta">
                      Hasta
                    </label>
                    <input
                      id="filtro-hasta"
                      type="date"
                      className="field tabular"
                      value={hasta}
                      min={desde || undefined}
                      onChange={(e) => fijar({ hasta: e.target.value })}
                    />
                  </div>
                </div>
              </Grupo>

              <Grupo titulo="¿Qué tiene?">
                <div className="flex flex-wrap gap-2">
                  <BotonFiltro activo={!producto} onClick={() => fijar({ producto: null })}>
                    Cualquier cosa
                  </BotonFiltro>
                  {PRODUCTOS.map((p) => (
                    <BotonFiltro
                      key={p.valor}
                      activo={producto === p.valor}
                      onClick={() => fijar({ producto: producto === p.valor ? null : p.valor })}
                    >
                      {p.texto}
                    </BotonFiltro>
                  ))}
                </div>
              </Grupo>

              <Grupo titulo="Ordenar">
                <div className="flex flex-wrap gap-2">
                  {ORDENES.map((o) => (
                    <BotonFiltro
                      key={o.valor}
                      activo={orden === o.valor}
                      onClick={() => fijar({ orden: o.valor })}
                    >
                      {o.texto}
                    </BotonFiltro>
                  ))}
                </div>
              </Grupo>
            </div>
          )}

          {hayFiltros && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[0.9375rem] text-slate-600">
              {todos && (
                <span className="tabular">
                  {visibles.length === 1 ? '1 trabajo' : `${visibles.length} trabajos`}
                  {visibles.length > 0 && filtro !== 'anulado' && ` · ${moneda(totalVisible)}`}
                </span>
              )}
              <button type="button" className="btn-ghost px-3 text-sm" onClick={limpiar}>
                <IconoX size={16} />
                Sacar los filtros
              </button>
            </div>
          )}
        </div>

        {isPending && <BloqueCargando texto="Cargando tapizados…" />}

        {error ? (
          <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
        ) : null}

        {todos && todos.length === 0 && (
          <EstadoVacio
            titulo="Todavía no hay tapizados"
            detalle="Cargá el primero y queda acá hasta que se termine y se cobre."
          />
        )}

        {todos && todos.length > 0 && visibles.length === 0 && (
          <EstadoVacio
            titulo={
              filtro === 'pendiente' && extrasActivos === 0 && !busqueda.trim()
                ? 'No hay nada pendiente'
                : 'No hay nada con esos filtros'
            }
            detalle={
              filtro === 'pendiente' && extrasActivos === 0 && !busqueda.trim()
                ? 'Todo lo cargado ya se terminó. Lo que falta cobrar está en "Por cobrar".'
                : 'Probá con otra búsqueda o sacá algún filtro.'
            }
          />
        )}

        {visibles.length > 0 && (
          <ul className="divide-y divide-brand-100">
            {visibles.map((t) => (
              <FilaTapizado key={t.id} tapizado={t} />
            ))}
          </ul>
        )}
      </div>

      <Modal
        abierto={altaAbierta}
        onCerrar={() => setAltaAbierta(false)}
        titulo="Cargar tapizado"
        detalle="Queda como pendiente hasta que lo terminen."
      >
        <FormularioTapizado
          onCancelar={() => setAltaAbierta(false)}
          onGuardado={() => setAltaAbierta(false)}
        />
      </Modal>
    </>
  );
}

/** Un botón de filtro: azul lleno si está elegido, con la cantidad al lado. */
function BotonFiltro({
  activo,
  onClick,
  cantidad,
  titulo,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  cantidad?: number;
  titulo?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      title={titulo}
      className={`flex min-h-[2.75rem] items-center gap-2 rounded-sharp border px-3.5 py-2 font-display text-[0.9375rem] font-semibold transition-colors ${
        activo
          ? 'border-brand-800 bg-brand-800 text-white'
          : 'border-brand-300 bg-white text-brand-800 hover:bg-brand-50'
      }`}
    >
      {children}
      {cantidad !== undefined && cantidad > 0 && (
        <span
          className={`tabular rounded-sharp px-1.5 py-0.5 text-xs font-bold ${
            activo ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
          }`}
        >
          {cantidad}
        </span>
      )}
    </button>
  );
}

/** Una celda del panel de filtros: matriz de filetes, como el resto del sistema. */
function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="bg-white px-4 py-3">
      <legend className="float-left mb-2 w-full font-display text-[0.6875rem] font-bold uppercase tracking-technical text-brand-600">
        {titulo}
      </legend>
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}


function Dato({
  etiqueta,
  valor,
  className = '',
}: {
  etiqueta: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className={`border-brand-200 px-4 py-3 [&:nth-child(2)]:border-l ${className}`}>
      <p className="font-display text-[0.6875rem] font-bold uppercase tracking-technical text-brand-600">
        {etiqueta}
      </p>
      <p className="tabular mt-1 font-display text-2xl font-bold text-brand-900">{valor}</p>
    </div>
  );
}

/* ── Fila ─────────────────────────────────────────────────────────────────── */

/**
 * Un trabajo. Todo el bloque de datos abre el detalle; el botón de la derecha
 * es el atajo al paso que sigue, para no tener que entrar a cada uno. En el
 * celular se apila; desde `md` se arma en columnas.
 */
function FilaTapizado({ tapizado: t }: { tapizado: Tapizado }) {
  const toast = useToast();
  const cambiar = useCambiarEtapa();
  const anulado = t.estado === 'anulado';

  const avanzar = async (estado: EstadoTapizado, aviso: string) => {
    try {
      await cambiar.mutateAsync({ id: t.id, estado });
      toast.ok(aviso);
    } catch {
      // Ya lo avisó el manejador global.
    }
  };

  return (
    <li className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <Link
        to={`/tapizados/${t.ref}`}
        className={`grid gap-2 px-4 pt-4 transition-colors hover:bg-aqua-50 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,0.7fr)] md:items-center md:gap-5 md:py-4 ${
          anulado ? 'text-slate-500' : ''
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ChipEtapa estado={t.estado} />
            <span className="tabular font-display text-sm font-semibold text-slate-500">
              {t.ref}
            </span>
          </div>
          <p className="mt-1.5 font-display text-[1.0625rem] font-bold text-ink">{t.nombre}</p>
          {t.edificio && <p className="text-[0.9375rem] text-slate-700">{t.edificio}</p>}
        </div>

        <div className="min-w-0">
          <p className="font-display font-semibold text-brand-900">{resumenArticulos(t)}</p>
          <p className="text-sm text-slate-500">Cargado el {fecha(t.created_at)}</p>
        </div>

        <div className="md:text-right">
          <p
            className={`tabular font-display text-xl font-bold ${
              anulado ? 'text-slate-400 line-through' : 'text-brand-900'
            }`}
          >
            {moneda(Number(t.precio))}
          </p>
        </div>
      </Link>

      <div className="flex px-4 pb-4 md:justify-end md:py-4 md:pl-0">
        {t.estado === 'pendiente' && (
          <button
            type="button"
            className="btn-secondary flex-1 md:flex-none"
            disabled={cambiar.isPending}
            onClick={() => void avanzar('terminado', `${t.ref} pasó a por cobrar.`)}
          >
            <IconoCheck size={18} />
            Lo terminamos
          </button>
        )}
        {t.estado === 'terminado' && (
          <button
            type="button"
            className="btn-secondary flex-1 md:flex-none"
            disabled={cambiar.isPending}
            onClick={() => void avanzar('cobrado', `${t.ref} cobrado.`)}
          >
            <IconoDinero size={18} />
            Ya pagó
          </button>
        )}
      </div>
    </li>
  );
}
