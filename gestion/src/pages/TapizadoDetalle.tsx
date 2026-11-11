import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EncabezadoPagina } from '@/components/Layout';
import { Modal } from '@/components/Modal';
import { BloqueCargando, EstadoError, EstadoVacio, Spinner } from '@/components/Estados';
import {
  IconoAlerta,
  IconoAnular,
  IconoCheck,
  IconoDinero,
  IconoEditar,
  IconoReloj,
  IconoTelefono,
  IconoVolver,
  IconoWhatsapp,
  IconoX,
} from '@/components/Iconos';
import { FormularioMedidas, FormularioTapizado, LineaEtapa } from '@/components/Tapizado';
import { useToast } from '@/components/Toaster';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import {
  useAnularTapizado,
  useCambiarEtapa,
  useNotaTapizado,
  useTapizado,
} from '@/hooks/useTapizados';
import {
  fecha,
  fechaHora,
  linkWhatsapp,
  moneda,
  normalizarTelefono,
  telefono,
  telefonoValido,
} from '@/lib/format';
import { mensajeDeError } from '@/lib/supabase';
import {
  ETAPA_ANTERIOR,
  TEXTO_ETAPA,
  decimal,
  mensajeTerminado,
  metrosCuadrados,
  nombreProducto,
} from '@/lib/tapizados';
import type { EstadoTapizado, Tapizado } from '@/types/database';

export default function TapizadoDetalle() {
  const { ref } = useParams<{ ref: string }>();
  const toast = useToast();
  const { data: t, isPending, error, refetch } = useTapizado(ref);
  const { data: config } = useConfiguracion();
  const cambiar = useCambiarEtapa();
  const guardarNota = useNotaTapizado();

  const [editando, setEditando] = useState(false);
  const [midiendo, setMidiendo] = useState(false);
  const [anularAbierto, setAnularAbierto] = useState(false);
  const [notaEditando, setNotaEditando] = useState(false);
  const [notaTexto, setNotaTexto] = useState('');

  if (isPending) {
    return (
      <div className="panel">
        <BloqueCargando texto="Cargando tapizado…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />
      </div>
    );
  }

  if (!t) {
    return (
      <div className="panel">
        <EstadoVacio
          titulo={`No existe el tapizado ${ref}`}
          detalle="Revisá la referencia. Se escribe como TP-00001."
          accion={
            <Link to="/tapizados" className="btn-primary">
              Ver todos los tapizados
            </Link>
          }
        />
      </div>
    );
  }

  const anulado = t.estado === 'anulado';
  const esAlfombra = t.producto === 'alfombra';
  const conMedidas = t.ancho_m !== null && t.largo_m !== null;
  const esTelefono = telefonoValido(t.contacto);
  const whatsapp = esTelefono
    ? linkWhatsapp(t.contacto, t.estado === 'terminado' ? mensajeTerminado(t, config?.nombre_negocio) : undefined)
    : null;
  const anterior = ETAPA_ANTERIOR[t.estado];

  const pasarA = async (estado: EstadoTapizado) => {
    try {
      await cambiar.mutateAsync({ id: t.id, estado });
      toast.ok(`${t.ref}: ${TEXTO_ETAPA[estado].toLowerCase()}.`);
    } catch {
      // Ya lo avisó el manejador global.
    }
  };

  /** Una alfombra no se termina sin medidas: pasa por su cuadro. */
  const avanzar = (estado: EstadoTapizado) => {
    if (estado === 'terminado' && esAlfombra) return setMidiendo(true);
    void pasarA(estado);
  };

  const editarNota = () => {
    setNotaTexto(t.notas ?? '');
    setNotaEditando(true);
  };

  const confirmarNota = async () => {
    try {
      await guardarNota.mutateAsync({ id: t.id, notas: notaTexto });
      setNotaEditando(false);
      toast.ok('Nota guardada.');
    } catch {
      // Ya lo avisó el manejador global.
    }
  };

  return (
    <>
      <EncabezadoPagina
        volver={{ a: '/tapizados', texto: 'Volver a los tapizados' }}
        titulo={`Tapizado ${t.ref}`}
        detalle={
          <>
            {t.nombre} · cargado el {fechaHora(t.created_at)}
          </>
        }
        acciones={
          !anulado && (
            <button type="button" className="btn-secondary" onClick={() => setEditando(true)}>
              <IconoEditar size={18} />
              Editar datos
            </button>
          )
        }
      />

      <div className="mb-5">
        <LineaEtapa estado={t.estado} />
      </div>

      <ProximoPaso tapizado={t} whatsapp={whatsapp} ocupado={cambiar.isPending} onAvanzar={avanzar} />

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr] lg:items-start">
        <div className="space-y-5">
          {/* ── Cliente ────────────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">Cliente</h2>
            <p className="mt-2 font-display text-xl font-bold text-brand-800">{t.nombre}</p>
            {t.edificio && <p className="text-[0.9375rem] text-slate-700">{t.edificio}</p>}
            <p className="mt-1 flex items-center gap-2 text-[0.9375rem] text-slate-600">
              <IconoTelefono size={16} className="shrink-0 text-slate-400" />
              {esTelefono ? (
                <a
                  href={`tel:${normalizarTelefono(t.contacto)}`}
                  className="tabular font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                >
                  {telefono(t.contacto)}
                </a>
              ) : (
                <span>{t.contacto}</span>
              )}
            </p>

            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-3 w-full"
              >
                <IconoWhatsapp size={18} />
                Escribirle por WhatsApp
              </a>
            )}
          </section>

          {/* ── Precio ─────────────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">
              <IconoDinero size={14} />
              Precio
            </h2>
            <p
              className={`tabular mt-2 font-display text-4xl font-bold leading-none ${
                anulado ? 'text-slate-400 line-through' : 'text-brand-900'
              }`}
            >
              {moneda(Number(t.precio_final))}
            </p>

            {esAlfombra && conMedidas ? (
              <dl className="mt-4 space-y-2 text-[0.9375rem]">
                <Dato etiqueta="Medidas">
                  {decimal(Number(t.ancho_m))} × {decimal(Number(t.largo_m))} m
                </Dato>
                <Dato etiqueta="Superficie">
                  {decimal(metrosCuadrados(Number(t.ancho_m), Number(t.largo_m)))} m²
                </Dato>
                <Dato etiqueta="Precio por m²">{moneda(Number(t.precio_m2))}</Dato>
                <Dato etiqueta="Estimado al cargarla">{moneda(Number(t.precio))}</Dato>
              </dl>
            ) : esAlfombra ? (
              <p className="ayuda">
                Es el estimado. Al terminarla se cargan las medidas y sale el precio final.
              </p>
            ) : null}

            {esAlfombra && conMedidas && t.estado === 'terminado' && (
              <button
                type="button"
                className="btn-ghost mt-3 w-full"
                onClick={() => setMidiendo(true)}
              >
                Corregir las medidas
              </button>
            )}
          </section>

          {/* ── Fechas ─────────────────────────────────────────────────── */}
          <section className="panel p-4">
            <h2 className="eyebrow">
              <IconoReloj size={14} />
              Fechas
            </h2>
            <dl className="mt-3 space-y-2 text-[0.9375rem]">
              <Dato etiqueta="Cargado">{fechaHora(t.created_at)}</Dato>
              {t.terminado_el && <Dato etiqueta="Terminado">{fechaHora(t.terminado_el)}</Dato>}
              {t.cobrado_el && <Dato etiqueta="Cobrado">{fechaHora(t.cobrado_el)}</Dato>}
              {t.anulado_el && <Dato etiqueta="Anulado">{fechaHora(t.anulado_el)}</Dato>}
            </dl>
          </section>

          {!anulado && (
            <button
              type="button"
              className="btn-danger w-full"
              onClick={() => setAnularAbierto(true)}
            >
              <IconoAnular size={18} />
              Anular tapizado
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* ── El trabajo ─────────────────────────────────────────────── */}
          <section className="panel">
            <div className="panel-cabezal">
              <h2 className="eyebrow">El trabajo</h2>
            </div>
            <dl className="px-4 py-3 text-[0.9375rem]">
              <div className="flex justify-between gap-3 py-1">
                <dt className="text-slate-600">Qué es</dt>
                <dd className="text-right font-semibold text-ink">{nombreProducto(t)}</dd>
              </div>
              {t.edificio && (
                <div className="flex justify-between gap-3 py-1">
                  <dt className="text-slate-600">Dónde</dt>
                  <dd className="text-right font-semibold text-ink">{t.edificio}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 py-1">
                <dt className="text-slate-600">Etapa</dt>
                <dd className="text-right font-semibold text-ink">{TEXTO_ETAPA[t.estado]}</dd>
              </div>
            </dl>
          </section>

          {/* ── Notas ──────────────────────────────────────────────────── */}
          <section className="panel p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="eyebrow">Notas</h2>
              {!anulado && !notaEditando && (
                <button type="button" className="btn-ghost px-3 text-sm" onClick={editarNota}>
                  <IconoEditar size={16} />
                  Editar
                </button>
              )}
            </div>

            {notaEditando ? (
              <div className="mt-2 space-y-2">
                <textarea
                  className="field min-h-[6rem]"
                  value={notaTexto}
                  onChange={(e) => setNotaTexto(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setNotaEditando(false)}
                    disabled={guardarNota.isPending}
                  >
                    <IconoX size={16} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => void confirmarNota()}
                    disabled={guardarNota.isPending}
                  >
                    {guardarNota.isPending ? <Spinner size={16} /> : <IconoCheck size={16} />}
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-slate-700">
                {t.notas || <span className="text-slate-400">Sin notas.</span>}
              </p>
            )}
          </section>

          {/* ── Corregir la etapa ──────────────────────────────────────────
              Plegado y al final, como en las órdenes: volver atrás es la
              excepción. Desde anulado no hay nada que corregir. */}
          {anterior && (
            <details className="panel group">
              <summary className="cursor-pointer list-none px-4 py-3 font-display text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50">
                ¿Quedó en la etapa equivocada?
              </summary>
              <div className="border-t border-brand-100 px-4 py-4">
                <p className="mb-3 text-sm text-slate-600">
                  {t.estado === 'cobrado'
                    ? 'Si se marcó cobrado y todavía no pagó, volvelo a terminado.'
                    : 'Si se marcó terminado sin estarlo, volvelo a pendiente. Las medidas quedan guardadas.'}
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={cambiar.isPending}
                  onClick={() => void pasarA(anterior)}
                >
                  <IconoVolver size={18} />
                  Volver a {TEXTO_ETAPA[anterior].toLowerCase()}
                </button>
              </div>
            </details>
          )}
        </div>
      </div>

      <Modal abierto={editando} onCerrar={() => setEditando(false)} titulo={`Editar ${t.ref}`}>
        {editando && (
          <FormularioTapizado
            tapizado={t}
            onCancelar={() => setEditando(false)}
            onGuardado={() => setEditando(false)}
          />
        )}
      </Modal>

      <Modal
        abierto={midiendo}
        onCerrar={() => setMidiendo(false)}
        titulo="¿Cuánto mide la alfombra?"
        detalle="Con las medidas sale el precio final."
        ancho="sm"
      >
        {midiendo && <FormularioMedidas tapizado={t} onListo={() => setMidiendo(false)} />}
      </Modal>

      {anularAbierto && <ModalAnular tapizado={t} onCerrar={() => setAnularAbierto(false)} />}
    </>
  );
}

/* ── El paso que toca ─────────────────────────────────────────────────────── */

/** El bloque azul con la única acción principal de la pantalla. */
function ProximoPaso({
  tapizado: t,
  whatsapp,
  ocupado,
  onAvanzar,
}: {
  tapizado: Tapizado;
  whatsapp: string | null;
  ocupado: boolean;
  onAvanzar: (estado: EstadoTapizado) => void;
}) {
  if (t.estado === 'anulado') return null;

  if (t.estado === 'cobrado') {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-card border border-brand-200 bg-white px-4 py-4">
        <IconoCheck size={22} className="shrink-0 text-ok" />
        <p className="text-[1.0625rem] text-ink">
          <span className="font-display font-bold">Trabajo cerrado.</span> Se cobró el{' '}
          {fecha(t.cobrado_el)}: {moneda(Number(t.precio_final))}.
        </p>
      </div>
    );
  }

  const esAlfombra = t.producto === 'alfombra';
  const contenido =
    t.estado === 'pendiente'
      ? {
          pregunta: '¿Ya lo terminaron?',
          detalle: esAlfombra
            ? 'Al marcarla terminada te va a pedir el ancho y el largo: con eso sale el precio.'
            : `Al terminarlo queda para cobrar: ${moneda(Number(t.precio_final))}.`,
          accion: 'Lo terminamos',
          Icono: IconoCheck,
          destino: 'terminado' as EstadoTapizado,
        }
      : {
          pregunta: '¿Ya pagó?',
          detalle: `Está terminado. Hay que cobrar ${moneda(Number(t.precio_final))}.`,
          accion: 'Ya pagó',
          Icono: IconoDinero,
          destino: 'cobrado' as EstadoTapizado,
        };

  const { pregunta, detalle, accion, Icono, destino } = contenido;

  return (
    <div className="mb-5 rounded-card border border-brand-800 bg-brand-800 px-5 py-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-[16rem] flex-1">
          <p className="font-display text-xl font-bold leading-tight">{pregunta}</p>
          <p className="mt-1.5 text-[0.9375rem] leading-snug text-aqua-100">{detalle}</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          {t.estado === 'terminado' && whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg flex-1 border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 sm:flex-none"
            >
              <IconoWhatsapp size={18} />
              Avisarle que está pronto
            </a>
          )}
          <button
            type="button"
            className="btn-ok btn-xl flex-1 sm:flex-none"
            disabled={ocupado}
            onClick={() => onAvanzar(destino)}
          >
            {ocupado ? <Spinner size={20} /> : <Icono size={22} />}
            {accion}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{etiqueta}</dt>
      <dd className="tabular text-right text-ink">{children}</dd>
    </div>
  );
}

/* ── Anulación ────────────────────────────────────────────────────────────── */

/**
 * Mismo cuadro que anular una orden: aviso de que es definitivo, motivo
 * escrito y la referencia tipeada para confirmar. Si ya estaba cobrado,
 * pregunta si se devolvió la plata — queda en las notas.
 */
function ModalAnular({ tapizado: t, onCerrar }: { tapizado: Tapizado; onCerrar: () => void }) {
  const toast = useToast();
  const anular = useAnularTapizado();
  const [motivo, setMotivo] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [devuelto, setDevuelto] = useState(false);

  const refCoincide = confirmacion.trim().toUpperCase() === t.ref.toUpperCase();
  const puedeAnular = refCoincide && motivo.trim().length >= 3;

  const confirmar = async () => {
    try {
      await anular.mutateAsync({ id: t.id, motivo, devuelto });
      toast.ok(`${t.ref} anulado.`);
      onCerrar();
    } catch {
      // Ya lo avisó el manejador global.
    }
  };

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Anular el tapizado ${t.ref}`}>
      <div className="flex items-start gap-3 rounded-card border border-alerta/50 bg-red-50 px-4 py-3.5">
        <IconoAlerta size={20} className="mt-0.5 shrink-0 text-alerta" />
        <p className="text-[0.9375rem] leading-relaxed text-ink">
          Queda anulado y <span className="font-semibold">no se puede volver atrás</span>. Deja de
          contar en lo que falta cobrar.
        </p>
      </div>

      {t.estado === 'cobrado' && (
        <fieldset className="mt-5">
          <legend className="label">Ya estaba cobrado: ¿le devolviste la plata?</legend>
          <label className="flex cursor-pointer items-center gap-3 rounded-sharp border border-brand-300 px-4 py-3 transition-colors hover:bg-brand-50 has-[:checked]:border-brand-800 has-[:checked]:bg-brand-50">
            <input
              type="checkbox"
              checked={devuelto}
              onChange={(e) => setDevuelto(e.target.checked)}
              className="casilla"
            />
            <span className="flex-1 text-[0.9375rem] text-ink">Sí, se la devolví</span>
            <span className="tabular font-semibold text-ink">
              {moneda(Number(t.precio_final))}
            </span>
          </label>
          <p className="ayuda">Queda anotado en las notas, para que el arqueo cierre.</p>
        </fieldset>
      )}

      <div className="mt-5">
        <label className="label" htmlFor="motivo">
          Motivo
        </label>
        <textarea
          id="motivo"
          rows={2}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Se cargó por error, el cliente canceló…"
          className="field resize-y"
        />
        <p className="ayuda">Queda escrito en las notas, con tu nombre y la fecha.</p>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="confirmacion">
          Escribí {t.ref} para confirmar
        </label>
        <input
          id="confirmacion"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          autoComplete="off"
          placeholder={t.ref}
          className="field tabular"
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={!puedeAnular || anular.isPending}
          onClick={() => void confirmar()}
        >
          {anular.isPending ? <Spinner size={18} /> : <IconoAnular size={18} />}
          Anular tapizado
        </button>
      </div>
    </Modal>
  );
}
