-- =============================================================================
--  EL PUENTE — 0011: anular tapizados
-- =============================================================================
--
--  Igual que una orden: un tapizado se anula, no se borra. Queda en la tabla
--  con el motivo, quién y cuándo, y las notas lo cuentan. Anulado es
--  definitivo: no se vuelve atrás ni se edita, como `anular_orden` (0006).
--
--  El único camino es la RPC `anular_tapizado`: `guard_tapizado` rechaza un
--  `update` a 'anulado' sin motivo.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Columnas y estado nuevo
-- -----------------------------------------------------------------------------

alter table public.tapizados
  add column if not exists anulado_el     timestamptz,
  add column if not exists anulado_por    uuid references public.profiles(id),
  add column if not exists anulado_motivo text;

alter table public.tapizados drop constraint if exists tapizados_estado_check;
alter table public.tapizados
  add constraint tapizados_estado_check
  check (estado in ('pendiente', 'terminado', 'cobrado', 'anulado'));

-- -----------------------------------------------------------------------------
-- 2. Guarda: anulado es definitivo y lleva motivo
-- -----------------------------------------------------------------------------

create or replace function public.guard_tapizado()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.estado = 'anulado' then
    raise exception 'El tapizado % está anulado: ya no se puede modificar.', old.ref;
  end if;

  if new.estado = 'anulado' then
    if tg_op = 'INSERT' then
      raise exception 'Un tapizado no se puede cargar ya anulado.';
    end if;
    if nullif(trim(coalesce(new.anulado_motivo, '')), '') is null then
      raise exception 'Para anular un tapizado hay que escribir un motivo.';
    end if;
    -- Las fechas de terminado y cobrado quedan como estaban: cuentan qué
    -- había pasado antes de anularlo.
    return new;
  end if;

  if new.estado in ('terminado', 'cobrado') and new.producto = 'alfombra'
     and (new.ancho_m is null or new.largo_m is null or new.precio_m2 is null) then
    raise exception 'Para terminar una alfombra hay que cargar el ancho y el largo.';
  end if;

  if new.producto <> 'otro' then
    new.producto_otro := null;
  end if;

  if new.estado = 'pendiente' then
    new.terminado_el := null;
    new.cobrado_el := null;
  elsif new.estado = 'terminado' then
    new.terminado_el := coalesce(new.terminado_el, now());
    new.cobrado_el := null;
  elsif new.estado = 'cobrado' then
    new.terminado_el := coalesce(new.terminado_el, now());
    new.cobrado_el := coalesce(new.cobrado_el, now());
  end if;

  return new;
end $$;

-- -----------------------------------------------------------------------------
-- 3. RPC
--   `p_devuelto` solo importa si ya estaba cobrado: queda escrito en la nota
--   si la plata se devolvió o no, para que el arqueo se pueda explicar.
-- -----------------------------------------------------------------------------

create or replace function public.anular_tapizado(
  p_id       uuid,
  p_motivo   text,
  p_devuelto boolean default false
)
returns public.tapizados
language plpgsql
security definer
set search_path = public
as $$
declare
  v_t      public.tapizados;
  v_quien  text;
  v_motivo text := nullif(trim(coalesce(p_motivo, '')), '');
  v_plata  text := '';
  v_nota   text;
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede anular un tapizado.';
  end if;
  if v_motivo is null then
    raise exception 'Para anular un tapizado hay que escribir un motivo.';
  end if;

  select * into v_t from public.tapizados where id = p_id for update;
  if not found then
    raise exception 'El tapizado que se quiere anular no existe.';
  end if;
  if v_t.estado = 'anulado' then
    raise exception 'El tapizado % ya está anulado.', v_t.ref;
  end if;

  if v_t.estado = 'cobrado' then
    v_plata := case when p_devuelto then ' · se devolvió la plata'
                    else ' · la plata NO se devolvió' end;
  end if;

  select nombre into v_quien from public.profiles where id = auth.uid();
  v_nota := format(
    '[Anulado el %s por %s: %s%s]',
    to_char(now() at time zone 'America/Montevideo', 'DD/MM/YYYY HH24:MI'),
    coalesce(v_quien, 'desconocido'), v_motivo, v_plata
  );

  update public.tapizados
     set estado         = 'anulado',
         anulado_el     = now(),
         anulado_por    = auth.uid(),
         anulado_motivo = v_motivo,
         notas          = case when coalesce(notas, '') = '' then v_nota
                               else notas || E'\n' || v_nota end
   where id = p_id
  returning * into v_t;

  return v_t;
end $$;

revoke all on function public.anular_tapizado(uuid, text, boolean) from public, anon;
grant execute on function public.anular_tapizado(uuid, text, boolean) to authenticated;
