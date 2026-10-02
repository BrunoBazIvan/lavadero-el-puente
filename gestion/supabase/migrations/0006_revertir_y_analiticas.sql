-- =============================================================================
--  EL PUENTE — 0006: revertir una entrega, cobros anulables y analíticas en
--                    una sola consulta
-- =============================================================================
--  Tres problemas distintos que se resuelven juntos porque los tres tocan la
--  misma pregunta: ¿qué plata entró de verdad?
--
--  A) REVERTIR UNA ENTREGA. El mostrador marca "el cliente se la llevó" y a
--     los dos minutos aparece el cliente de verdad: la bolsa que se fue era
--     otra. Hasta ahora eso era irreversible — `guard_orden_update` cerraba la
--     orden para siempre y solo un admin podía anularla, que es una mentira
--     distinta: la orden existe y la ropa está acá.
--
--  B) LOS COBROS NO SE BORRAN, SE ANULAN. Revertir una entrega cobrada, o
--     anular una orden con plata adentro, obliga a deshacer el cobro. Borrar
--     la fila de `pagos` desaparece plata sin dejar rastro, y el arqueo de la
--     semana pasada deja de cuadrar sin que nadie pueda explicar por qué. Un
--     cobro anulado se queda en la tabla con fecha, autor y motivo; lo que
--     cambia es que deja de sumar.
--
--  C) LAS ANALÍTICAS SE CALCULAN EN LA BASE. La pantalla traía TODAS las
--     filas del mes y del anterior y sumaba en JavaScript, con el tope mudo de
--     1000 filas de PostgREST esperando al lavadero que tenga un buen mes.
--     Ahora es un jsonb ya agregado: un viaje, payload chico, los números los
--     hace Postgres.
--
--  ORDEN DE OPERACIONES — no es negociable:
--    `v_ordenes` cambia (el `pagado` tiene que dejar de contar los anulados),
--    y hay DOS funciones que devuelven `setof v_ordenes` y dependen de su
--    tipo: `buscar()` y la nueva `ordenes_tablero()`. Las dos se sueltan antes
--    de soltar la vista, y los GRANT se reponen después: no sobreviven a un
--    DROP, y sin ellos `authenticated` recibe 403 y la app se queda sin
--    órdenes.
--
--  ZONA HORARIA: la base corre en UTC, el lavadero en UTC−3. Un cobro de las
--  22:00 del 30 de setiembre es, en UTC, el 1.º de octubre. Todo lo que corta
--  por mes o por día convierte con `at time zone 'America/Montevideo'`. Sin
--  eso, el último día de cada mes se le escapa al mes que le corresponde.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Cobros anulables
--
--    Una sola columna con la verdad: `anulado_el`. Un `boolean` además del
--    timestamp serían dos fuentes que pueden contradecirse (anulado = true con
--    anulado_el = null) y que habría que mantener sincronizadas con un CHECK.
--    `anulado_el is null` se indexa y se filtra igual de bien, y de paso queda
--    registrado CUÁNDO — que es lo primero que se pregunta cuando el arqueo no
--    cierra.
--
--    El motivo es obligatorio. Un cobro que desaparece sin explicación es
--    exactamente el agujero que esta migración viene a tapar.
-- -----------------------------------------------------------------------------

alter table public.pagos add column if not exists anulado_el     timestamptz;
alter table public.pagos add column if not exists anulado_por    uuid references public.profiles(id);
alter table public.pagos add column if not exists anulado_motivo text;

do $$ begin
  alter table public.pagos
    add constraint pagos_anulado_coherente check (
      anulado_el is null
      or (anulado_motivo is not null and length(trim(anulado_motivo)) > 0)
    );
exception when duplicate_object then null; end $$;

comment on column public.pagos.anulado_el is
  'Cuándo se anuló este cobro. Null = vigente, suma. Reemplaza al DELETE: la plata no se borra, se marca.';
comment on column public.pagos.anulado_motivo is
  'Por qué se anuló. Obligatorio: un cobro que desaparece sin explicación no le sirve a nadie en seis meses.';

-- Los cobros vigentes se recorren por fecha en cada arqueo y en cada
-- analítica. El índice parcial deja afuera los anulados, que no se consultan
-- nunca por fecha.
create index if not exists pagos_vigentes_fecha_idx
  on public.pagos (fecha desc) where anulado_el is null;

-- -----------------------------------------------------------------------------
-- 2. Lo que deja de sumar un cobro anulado
--
--    Son exactamente TRES lugares donde se suma plata, y los tres tienen que
--    filtrar. Si se olvida uno, el saldo de la orden y el total del mes dejan
--    de coincidir y nadie sabe cuál de los dos miente:
--      2.1 `orden_totales()` — la usan los guards
--      2.2 `v_ordenes.pagado` — de ahí salen `saldo` y `estado_pago`
--      2.3 `guard_pago()`     — la suma de "los otros pagos"
-- -----------------------------------------------------------------------------

-- 2.1 ------------------------------------------------------------------------
create or replace function public.orden_totales(p_orden_id uuid)
returns table (subtotal numeric, total numeric, pagado numeric, saldo numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(o.monto, 0)                                        as subtotal,
    coalesce(o.monto, 0) - o.descuento                          as total,
    coalesce(p.suma, 0)                                         as pagado,
    coalesce(o.monto, 0) - o.descuento - coalesce(p.suma, 0)    as saldo
  from public.ordenes o
  left join lateral (
    select sum(monto) as suma
    from public.pagos
    where orden_id = o.id
      and anulado_el is null          -- ← un cobro anulado no es plata cobrada
  ) p on true
  where o.id = p_orden_id;
$$;

-- -----------------------------------------------------------------------------
-- 3. Vista, buscador y listado del tablero
--
--    Hay que recrear la vista por el filtro de anulados del punto 2.2. Las dos
--    funciones que devuelven `setof v_ordenes` se sueltan primero.
-- -----------------------------------------------------------------------------

drop function if exists public.buscar(text, int);
drop function if exists public.ordenes_tablero(int, int);
drop view if exists public.v_ordenes;

-- 2.2 ------------------------------------------------------------------------
create view public.v_ordenes
with (security_invoker = true)
as
select
  o.*,
  c.nombre   as cliente_nombre,
  c.telefono as cliente_telefono,
  c.tipo     as cliente_tipo,
  coalesce(o.monto, 0)                                       as subtotal,
  coalesce(i.cantidad_prendas, 0)                            as cantidad_prendas,
  coalesce(o.monto, 0) - o.descuento                         as total,
  coalesce(p.total_pagado, 0)                                as pagado,
  coalesce(o.monto, 0) - o.descuento - coalesce(p.total_pagado, 0) as saldo,
  case
    when coalesce(p.total_pagado, 0) >= (coalesce(o.monto, 0) - o.descuento) then 'pagado'
    when coalesce(p.total_pagado, 0) = 0 then 'pendiente'
    else 'parcial'
  end as estado_pago
from public.ordenes o
join public.clientes c on c.id = o.cliente_id
left join lateral (
  select sum(cantidad) as cantidad_prendas
  from public.orden_items where orden_id = o.id
) i on true
left join lateral (
  select sum(monto) as total_pagado
  from public.pagos
  where orden_id = o.id
    and anulado_el is null            -- ← ídem: acá nacen `saldo` y `estado_pago`
) p on true;

-- Buscador: idéntico a la 0004, se recrea solo porque dependía del tipo de la
-- vista que acabamos de soltar.
create or replace function public.buscar(termino text, limite int default 30)
returns setof public.v_ordenes
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  v_t    text := trim(coalesce(termino, ''));
  v_dig  text := regexp_replace(coalesce(termino, ''), '\D', '', 'g');
begin
  if length(v_t) < 2 and length(v_dig) = 0 then
    return;
  end if;

  if v_t ~* '^ep-?\d+$' or v_t ~ '^\d{1,5}$' then
    return query
      select * from public.v_ordenes
      where ref = 'EP-' || lpad(v_dig, 5, '0')
         or ref ilike '%' || v_dig || '%'
      order by fecha_ingreso desc
      limit limite;
    return;
  end if;

  if length(v_dig) between 8 and 9 then
    return query
      select * from public.v_ordenes
      where regexp_replace(coalesce(cliente_telefono, ''), '\D', '', 'g') like '%' || v_dig || '%'
      order by fecha_ingreso desc
      limit limite;
    return;
  end if;

  return query
    select * from public.v_ordenes
    where cliente_nombre ilike '%' || v_t || '%'
       or similarity(cliente_nombre, v_t) > 0.25
    order by similarity(cliente_nombre, v_t) desc, fecha_ingreso desc
    limit limite;
end $$;

-- -----------------------------------------------------------------------------
-- 3.1 El listado del mostrador: "las abiertas, más lo de esta semana"
--
--    Reemplaza al `select * from v_ordenes order by fecha_ingreso desc
--    limit 100`, que tenía un problema serio: con cien órdenes nuevas arriba,
--    una orden `listo` de hace tres semanas cae por debajo del corte y
--    desaparece del listado. Justo esa es la que no se puede perder de vista.
--
--    Son dos ramas con reglas distintas, y de ahí que sea una RPC y no un
--    `.or()` de PostgREST (que comparte un solo LIMIT entre las dos):
--      · ABIERTAS: todas, sin tope. Están acotadas por el negocio — son las
--        bolsas que hay físicamente en el lavadero.
--      · CERRADAS: solo las de los últimos días, con tope.
--
--    `en_proceso` está en la lista de abiertas aunque el paso ya no exista en
--    el flujo (se sacó en la 0002/el rediseño): si queda alguna orden vieja
--    ahí, tiene que seguir apareciendo o se pierde una bolsa real.
--
--    El corte de las cerradas es por fecha de CIERRE, no de ingreso: una orden
--    que entró hace veinte días y se entregó hoy es movimiento de hoy, y el
--    mostrador la va a buscar en el listado, no en el buscador.
-- -----------------------------------------------------------------------------

create or replace function public.ordenes_tablero(
  p_dias   int default 7,
  p_limite int default 300
)
returns setof public.v_ordenes
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  -- Corte en días del calendario local: "hoy y los 6 anteriores", no 168
  -- horas para atrás. Al mostrador le importa el día, no la hora.
  v_desde timestamptz :=
    (((now() at time zone 'America/Montevideo')::date - (greatest(p_dias, 1) - 1))::timestamp
      at time zone 'America/Montevideo');
begin
  return query
    select * from public.v_ordenes
    where estado in ('recibido', 'en_proceso', 'listo')

    union all

    select * from (
      select * from public.v_ordenes
      where estado in ('entregado', 'anulado')
        and coalesce(fecha_entrega_real, fecha_ingreso) >= v_desde
      order by fecha_ingreso desc
      limit greatest(p_limite, 1)
    ) cerradas_recientes

    order by fecha_ingreso desc;
end $$;

-- El índice parcial que sostiene la rama de las abiertas (y el conteo del
-- encabezado, punto 6). El predicado tiene que decir EXACTAMENTE lo mismo que
-- el `where` de la consulta, si no el planificador no lo usa.
create index if not exists ordenes_abiertas_idx
  on public.ordenes (fecha_ingreso desc)
  where estado in ('recibido', 'en_proceso', 'listo');

-- Para el "olvidadas" del encabezado y el de las analíticas.
create index if not exists ordenes_listas_retiro_idx
  on public.ordenes (fecha_retiro_estimada)
  where estado = 'listo';

-- Para el corte por fecha de entrega (promedio de días, entregadas del mes,
-- rama de cerradas del tablero).
create index if not exists ordenes_entrega_real_idx
  on public.ordenes (fecha_entrega_real desc)
  where fecha_entrega_real is not null;

-- -----------------------------------------------------------------------------
-- 4. Reglas de los cobros
--
--    Tres reglas nuevas, y las tres existen por un caso concreto:
--
--    · Un cobro anulado no se revive. Si fue un error, se registra un cobro
--      nuevo: así queda el rastro de los dos movimientos.
--    · No se anula el cobro de una orden ENTREGADA. La dejaría con saldo
--      abierto y `guard_orden_update` ya no permite tocarla: una orden
--      imposible de cerrar. El camino correcto es revertir la entrega
--      primero, que es justo lo que hace `revertir_entrega()`.
--    · Sí se anula el cobro de una orden ANULADA. Es el caso de la plata que
--      se le devolvió al cliente cuando se dio de baja el trabajo; no hay
--      ningún saldo que proteger en una orden que ya no existe.
-- -----------------------------------------------------------------------------

-- 2.3 ------------------------------------------------------------------------
create or replace function public.guard_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado   estado_orden;
  v_ref      text;
  v_total    numeric;
  v_otros    numeric;
  v_anulando boolean := tg_op = 'UPDATE'
                        and old.anulado_el is null
                        and new.anulado_el is not null;
begin
  select estado, ref into v_estado, v_ref from public.ordenes where id = new.orden_id;
  if not found then
    raise exception 'La orden del pago no existe.';
  end if;

  if tg_op = 'UPDATE' and old.anulado_el is not null and new.anulado_el is null then
    raise exception 'Un cobro anulado no se reactiva. Si la plata volvió a entrar, registrá un cobro nuevo.';
  end if;

  if v_anulando and v_estado = 'entregado' then
    raise exception
      'La orden % ya está entregada: revertí la entrega y después anulá el cobro.', v_ref;
  end if;

  if v_estado = 'anulado' and not v_anulando then
    raise exception 'La orden % está anulada: no admite pagos.', v_ref;
  end if;

  -- Un cobro anulado no suma: no puede desbordar ningún total, y editarle el
  -- motivo no tiene que pasar por el control de saldo.
  if new.anulado_el is not null then
    return new;
  end if;

  select total into v_total from public.orden_totales(new.orden_id);

  select coalesce(sum(monto), 0) into v_otros
  from public.pagos
  where orden_id = new.orden_id
    and anulado_el is null             -- ← tercer lugar donde se suma plata
    and (tg_op = 'INSERT' or id <> new.id);

  if v_otros + new.monto > coalesce(v_total, 0) + 0.005 then
    raise exception
      'El pago de $ % excede el saldo de la orden % (total $ %, ya pagado $ %).',
      new.monto, v_ref, coalesce(v_total, 0), v_otros;
  end if;

  return new;
end $$;

drop trigger if exists trg_guard_pago on public.pagos;
create trigger trg_guard_pago
  before insert or update on public.pagos
  for each row execute function public.guard_pago();

-- Borrar un pago deja de ser un camino: la política de RLS se saca y queda la
-- anulación, que conserva el rastro. `guard_pago_delete` se deja en pie como
-- segunda barrera (y porque el DELETE en cascada de una orden sigue pasando
-- por ahí).
drop policy if exists pagos_delete on public.pagos;

comment on table public.pagos is
  'Cobros. No se borran: se anulan con `anular_pago()`. Borrar plata deja un arqueo que nadie puede explicar.';

-- Anular un cobro suelto: una seña cargada dos veces, un monto tipeado mal.
--
-- `security definer` porque la RLS de `pagos` deja el UPDATE solo para admin, y
-- esto lo tiene que poder hacer cualquiera del mostrador: el turno de la tarde
-- no puede quedarse con un cobro mal cargado hasta que aparezca el dueño. El
-- rastro no se destruye nunca —queda quién, cuándo y por qué—, que es
-- exactamente lo que no pasaba con el DELETE que esto reemplaza.
create or replace function public.anular_pago(p_pago_id uuid, p_motivo text)
returns public.pagos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.pagos;
begin
  if not public.is_staff() then
    raise exception 'No tenés permiso para anular un cobro.';
  end if;

  if nullif(trim(coalesce(p_motivo, '')), '') is null then
    raise exception 'Para anular un cobro hay que escribir por qué.';
  end if;

  update public.pagos
     set anulado_el     = now(),
         anulado_por    = auth.uid(),
         anulado_motivo = trim(p_motivo)
   where id = p_pago_id
     and anulado_el is null
  returning * into v_pago;

  if not found then
    raise exception 'El cobro no existe o ya estaba anulado.';
  end if;

  return v_pago;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Revertir una entrega
--
--    Cualquiera del mostrador, sin límite de tiempo. No es un privilegio: es
--    corregir un error de tipeo de hace treinta segundos, y el que lo cometió
--    es el que está ahí. Pedir un admin significa que el error se queda puesto
--    todo el día.
--
--    Lo que SÍ se exige es que no sea silencioso: la regla de abajo no deja
--    revertir sin dejar escrito el motivo en las notas. Y no deja aprovechar
--    el mismo UPDATE para cambiarle el monto, el cliente o el descuento a una
--    orden que estaba cerrada — eso sería una puerta de atrás a la regla 1.
-- -----------------------------------------------------------------------------

create or replace function public.guard_orden_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo  numeric;
  v_sub    numeric;
  v_pagado numeric;
begin
  -- ── Revertir una entrega (entregado → listo) ───────────────────────────
  --  Va PRIMERO y sale con `return new`: es la única excepción a la regla 1 y
  --  no le aplica ninguna de las reglas del cobro (el monto ya estaba cargado,
  --  y volver para atrás nunca puede dejar un saldo negativo).
  if old.estado = 'entregado' and new.estado = 'listo' then
    if new.notas is not distinct from old.notas then
      raise exception
        'Una entrega no se revierte en silencio: usá "Revertir la entrega", que deja escrito el motivo.';
    end if;

    if (new.cliente_id, new.servicio, new.envio, new.fecha_ingreso,
        new.fecha_retiro_estimada, new.monto, new.descuento, new.created_by)
       is distinct from
       (old.cliente_id, old.servicio, old.envio, old.fecha_ingreso,
        old.fecha_retiro_estimada, old.monto, old.descuento, old.created_by)
    then
      raise exception
        'Al revertir la entrega de la orden % no se puede cambiar nada más. Revertila primero y después corregí.',
        old.ref;
    end if;

    -- El sello de entrega se suelta: la ropa está acá y no se entregó. Si
    -- quedara puesto, el promedio de días de entrega y el conteo de entregadas
    -- del mes contarían una entrega que no pasó.
    new.fecha_entrega_real := null;
    return new;
  end if;

  -- ── Regla 1: una orden cerrada no se edita ─────────────────────────────
  if old.estado in ('entregado', 'anulado') then
    if not (old.estado = 'entregado' and new.estado = 'anulado' and public.is_admin()) then
      raise exception 'La orden % está en estado "%" y no se puede modificar.', old.ref, old.estado;
    end if;
  end if;

  -- ── Regla 2: sin monto no se marca lista ni se entrega ─────────────────
  if new.estado in ('listo', 'entregado') and new.monto is null then
    raise exception 'Antes de marcar la orden % como "%" hay que cargarle el monto.',
      old.ref, new.estado;
  end if;

  -- ── Regla 3: el monto no puede bajar de lo ya cobrado ──────────────────
  if new.monto is distinct from old.monto and new.monto is not null then
    select pagado into v_pagado from public.orden_totales(old.id);
    if coalesce(v_pagado, 0) > new.monto - new.descuento then
      raise exception
        'La orden % ya tiene cobrados $ %: el monto no puede quedar por debajo.',
        old.ref, coalesce(v_pagado, 0);
    end if;
  end if;

  -- ── Regla 4: el descuento no puede superar el monto ────────────────────
  if new.descuento is distinct from old.descuento then
    select subtotal into v_sub from public.orden_totales(old.id);
    if new.descuento > coalesce(v_sub, 0) then
      raise exception 'El descuento ($ %) no puede superar el monto de la orden ($ %).',
        new.descuento, coalesce(v_sub, 0);
    end if;
  end if;

  -- ── Regla 5: entregar debiendo, solo admin ─────────────────────────────
  if new.estado = 'entregado' and old.estado <> 'entregado' then
    select saldo into v_saldo from public.orden_totales(old.id);
    if coalesce(v_saldo, 0) > 0 and not public.is_admin() then
      raise exception
        'La orden % tiene un saldo pendiente de $ %. Cobrá antes de entregar, o pedile a un admin que la entregue igual.',
        old.ref, v_saldo;
    end if;
    if new.fecha_entrega_real is null then
      new.fecha_entrega_real := now();
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_guard_orden_update on public.ordenes;
create trigger trg_guard_orden_update
  before update on public.ordenes
  for each row execute function public.guard_orden_update();

-- -----------------------------------------------------------------------------
-- 5.1 RPC: revertir la entrega (y devolver la plata, si se devolvió)
--
--    EL ORDEN DE ADENTRO NO ES NEGOCIABLE, igual que en `entregar_orden`:
--      1. soltar la entrega  — `guard_pago` no deja anular el cobro de una
--         orden entregada, porque la dejaría con un saldo abierto que ya no se
--         puede cerrar;
--      2. anular los cobros devueltos.
--
--    Los cobros van por lista de ids y no por un boolean "devolver todo": una
--    orden con una seña de la semana pasada y el cobro final de hoy no tiene
--    que perder la seña porque alguien dijo "sí". La UI pregunta Sí/No y en el
--    Sí manda todos los vigentes, que es el caso normal.
--
--    `security definer` por el UPDATE de `pagos`, reservado a admin por RLS, y
--    con el chequeo explícito de `is_staff()` arriba. `is_admin()` dentro de
--    los guards sigue viendo al usuario de verdad: sale de `auth.uid()`, que
--    es el JWT del pedido y no cambia por ser definer.
-- -----------------------------------------------------------------------------

create or replace function public.revertir_entrega(
  p_orden_id        uuid,
  p_pagos_devueltos uuid[] default '{}',
  p_motivo          text   default null
)
returns public.ordenes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden  public.ordenes;
  v_quien  text;
  v_motivo text := nullif(trim(coalesce(p_motivo, '')), '');
  v_nota   text;
  v_n      int;
  v_pedidos int := coalesce(array_length(p_pagos_devueltos, 1), 0);
begin
  if not public.is_staff() then
    raise exception 'No tenés permiso para revertir una entrega.';
  end if;

  -- `for update` para que dos personas del turno no reviertan en paralelo.
  select * into v_orden from public.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden que se quiere revertir no existe.';
  end if;
  if v_orden.estado <> 'entregado' then
    raise exception 'La orden % está en estado "%": solo se revierte una entrega.',
      v_orden.ref, v_orden.estado;
  end if;

  select nombre into v_quien from public.profiles where id = auth.uid();

  v_nota := format(
    '[Entrega revertida el %s por %s%s]',
    to_char(now() at time zone 'America/Montevideo', 'DD/MM/YYYY HH24:MI'),
    coalesce(v_quien, 'desconocido'),
    case when v_motivo is null then '' else ': ' || v_motivo end
  );

  -- 1. Soltar la entrega.
  update public.ordenes
     set estado = 'listo',
         notas  = case when coalesce(notas, '') = '' then v_nota
                       else notas || E'\n' || v_nota end
   where id = p_orden_id
  returning * into v_orden;

  -- 2. La plata que volvió al cliente.
  if v_pedidos > 0 then
    update public.pagos
       set anulado_el     = now(),
           anulado_por    = auth.uid(),
           anulado_motivo = coalesce(v_motivo, 'Devuelto al revertir la entrega')
     where orden_id = p_orden_id
       and id = any (p_pagos_devueltos)
       and anulado_el is null;

    get diagnostics v_n = row_count;
    if v_n <> v_pedidos then
      raise exception
        'Alguno de los cobros que se quiere devolver no es de la orden % o ya estaba anulado.',
        v_orden.ref;
    end if;
  end if;

  return v_orden;
end $$;

-- -----------------------------------------------------------------------------
-- 5.2 RPC: anular una orden
--
--    Reemplaza el `update` directo que hacía `useAnularOrden` en el cliente,
--    por el mismo motivo que `revertir_entrega`: si la orden tiene plata
--    adentro, anular el cobro es parte de la misma operación, no un paso
--    aparte que alguien puede saltear y dejar la plata contada a medias.
--
--    Mantiene la regla que ya existía en la UI (`OrdenDetalle.tsx`): cualquier
--    staff mientras la orden no esté entregada; solo admin si ya se entregó.
--
--    El orden interno importa: la orden pasa a `anulado` ANTES de tocar los
--    pagos. `guard_pago` solo deja anular cobros de una orden que esté
--    `anulado` (o todavía abierta) — nunca de una `entregado`. Si se anulara
--    el pago mientras la orden figura como `entregado`, `guard_pago` lo
--    rechazaría.
-- -----------------------------------------------------------------------------

create or replace function public.anular_orden(
  p_orden_id        uuid,
  p_motivo          text,
  p_pagos_devueltos uuid[] default '{}'
)
returns public.ordenes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden   public.ordenes;
  v_quien   text;
  v_motivo  text := nullif(trim(coalesce(p_motivo, '')), '');
  v_nota    text;
  v_n       int;
  v_pedidos int := coalesce(array_length(p_pagos_devueltos, 1), 0);
begin
  if not public.is_staff() then
    raise exception 'No tenés permiso para anular una orden.';
  end if;
  if v_motivo is null then
    raise exception 'Para anular una orden hay que escribir un motivo.';
  end if;

  select * into v_orden from public.ordenes where id = p_orden_id for update;
  if not found then
    raise exception 'La orden que se quiere anular no existe.';
  end if;
  if v_orden.estado = 'anulado' then
    raise exception 'La orden % ya está anulada.', v_orden.ref;
  end if;
  if v_orden.estado = 'entregado' and not public.is_admin() then
    raise exception 'La orden % ya fue entregada: solo un admin puede anularla.', v_orden.ref;
  end if;

  select nombre into v_quien from public.profiles where id = auth.uid();
  v_nota := format(
    '[Anulada el %s por %s: %s]',
    to_char(now() at time zone 'America/Montevideo', 'DD/MM/YYYY HH24:MI'),
    coalesce(v_quien, 'desconocido'), v_motivo
  );

  update public.ordenes
     set estado = 'anulado',
         notas  = case when coalesce(notas, '') = '' then v_nota
                       else notas || E'\n' || v_nota end
   where id = p_orden_id
  returning * into v_orden;

  if v_pedidos > 0 then
    update public.pagos
       set anulado_el     = now(),
           anulado_por    = auth.uid(),
           anulado_motivo = coalesce(v_motivo, 'Devuelto al anular la orden')
     where orden_id = p_orden_id
       and id = any (p_pagos_devueltos)
       and anulado_el is null;

    get diagnostics v_n = row_count;
    if v_n <> v_pedidos then
      raise exception
        'Alguno de los cobros que se quiere devolver no es de la orden % o ya estaba anulado.',
        v_orden.ref;
    end if;
  end if;

  return v_orden;
end $$;

-- -----------------------------------------------------------------------------
-- 6. El conteo del encabezado, en tres números
--
--    Reemplaza al `select estado, fecha_retiro_estimada` de todas las órdenes
--    abiertas, que viajaba cada 120 segundos desde TODAS las pantallas para
--    que el cliente contara tres cosas. Ahora es una sola pasada por el índice
--    parcial `ordenes_abiertas_idx` y vuelve un objeto de cuatro números.
--
--    El plazo entra por parámetro para que `DIAS_SIN_RETIRAR` del cliente
--    siga siendo la única fuente del número, y no quede un 7 duplicado en SQL
--    esperando a desincronizarse del que sale impreso en el comprobante.
--
--    `security invoker`: la RLS de `ordenes` (`is_staff()`) ya es el control
--    que corresponde, y no hay nada acá que un operador no pueda leer hoy.
-- -----------------------------------------------------------------------------

create or replace function public.resumen_pendientes(p_dias_sin_retirar int default 7)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'recibido',   count(*) filter (where estado = 'recibido'),
    'en_proceso', count(*) filter (where estado = 'en_proceso'),
    'listo',      count(*) filter (where estado = 'listo'),
    'olvidadas',  count(*) filter (
                    where estado = 'listo'
                      and fecha_retiro_estimada
                          < (now() at time zone 'America/Montevideo')::date
                            - greatest(p_dias_sin_retirar, 0)
                  )
  )
  from public.ordenes
  where estado in ('recibido', 'en_proceso', 'listo');
$$;

-- -----------------------------------------------------------------------------
-- 7. Analíticas del mes, en un jsonb
--
--    DOS GRANOS DISTINTOS, y confundirlos es el error que tenía la pantalla
--    anterior:
--
--      · LA CAJA se mide por `pagos.fecha`. Una seña cobrada en octubre contra
--        una orden de setiembre es plata que entró en octubre. Y un cobro
--        vigente cuenta aunque la orden después se anule: la plata entró, está
--        en el cajón, y el arqueo tiene que cerrar.
--      · EL TRABAJO se mide por `ordenes.fecha_ingreso`. Facturado y a-cobrar
--        salen de acá, y las ANULADAS no aportan a ninguno de los dos: una
--        orden dada de baja no se facturó ni se va a cobrar.
--
--    De ahí que `cobrado` pueda ser mayor que `facturado` en un mes, y no es
--    un error: son dos preguntas distintas.
--
--    Todo lo que corta por día o por mes pasa por 'America/Montevideo'. La
--    base está en UTC: sin eso, los cobros de la noche del último día del mes
--    caen en el mes siguiente.
--
--    `security invoker`: la RLS ya deja a cualquier staff leer estas tablas
--    fila por fila, así que `definer` no agregaría ninguna garantía — solo le
--    sacaría la RLS de encima. El chequeo de `is_admin()` de arriba es por
--    rol, no por seguridad: la pantalla de Analíticas cuelga de
--    `<ProtectedRoute soloAdmin>` y conviene que la base diga lo mismo.
--
--    `listas_sin_retirar` es el único número que NO es del mes: es de ahora.
--    Una bolsa olvidada no deja de estar olvidada porque cambió el mes.
-- -----------------------------------------------------------------------------

create or replace function public.analiticas_mes(
  p_mes              date default null,
  p_dias_sin_retirar int  default 7
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_tz       constant text := 'America/Montevideo';
  v_hoy      date;
  v_mes      date;
  v_ini      timestamptz;
  v_fin      timestamptz;
  v_ini_ant  timestamptz;
  v_dias     int;
  v_dias_ant int;
  v_json     jsonb;
begin
  if not public.is_admin() then
    raise exception 'Las analíticas las ve el administrador.';
  end if;

  v_hoy      := (now() at time zone v_tz)::date;
  v_mes      := date_trunc('month', coalesce(p_mes, v_hoy)::timestamp)::date;
  v_ini      := v_mes::timestamp at time zone v_tz;
  v_fin      := (v_mes + interval '1 month')::timestamp at time zone v_tz;
  v_ini_ant  := (v_mes - interval '1 month')::timestamp at time zone v_tz;
  v_dias     := extract(day from (v_mes + interval '1 month' - interval '1 day'))::int;
  v_dias_ant := extract(day from (v_mes - interval '1 day'))::int;

  with
  -- ── Grano "trabajo": órdenes ingresadas en el mes ──────────────────────
  ord as (
    select
      o.id, o.cliente_id, o.estado, o.servicio, o.envio, o.created_by,
      coalesce(o.monto, 0) - o.descuento                         as total,
      extract(day from (o.fecha_ingreso at time zone v_tz))::int as dia
    from public.ordenes o
    where o.fecha_ingreso >= v_ini
      and o.fecha_ingreso <  v_fin
  ),
  -- Lo cobrado de esas órdenes, SIN filtrar por fecha de cobro: el saldo de
  -- una orden no sabe de meses. Solo cobros vigentes.
  cobrado_de_ord as (
    select p.orden_id, sum(p.monto) as pagado
    from public.pagos p
    where p.anulado_el is null
      and exists (select 1 from ord where ord.id = p.orden_id)
    group by p.orden_id
  ),
  ord_tot as (
    select o.*,
           coalesce(c.pagado, 0)           as pagado,
           o.total - coalesce(c.pagado, 0) as saldo
    from ord o
    left join cobrado_de_ord c on c.orden_id = o.id
  ),
  ord_ant as (
    select extract(day from (o.fecha_ingreso at time zone v_tz))::int as dia
    from public.ordenes o
    where o.fecha_ingreso >= v_ini_ant
      and o.fecha_ingreso <  v_ini
  ),

  -- ── Grano "caja": cobros del mes, por `pagos.fecha` ───────────────────
  pag as (
    select p.monto, p.metodo, p.recibido_por,
           extract(day from (p.fecha at time zone v_tz))::int as dia
    from public.pagos p
    where p.anulado_el is null
      and p.fecha >= v_ini and p.fecha < v_fin
  ),
  pag_ant as (
    select p.monto,
           extract(day from (p.fecha at time zone v_tz))::int as dia
    from public.pagos p
    where p.anulado_el is null
      and p.fecha >= v_ini_ant and p.fecha < v_ini
  ),
  -- Lo devuelto en el mes. Va aparte para que el arqueo se pueda explicar sin
  -- abrir la base.
  pag_anulado as (
    select p.monto
    from public.pagos p
    where p.anulado_el >= v_ini and p.anulado_el < v_fin
  )

  select jsonb_build_object(
    'mes',               to_char(v_mes, 'YYYY-MM-DD'),
    'mes_anterior',      to_char((v_mes - interval '1 month')::date, 'YYYY-MM-DD'),
    'dias_mes',          v_dias,
    'dias_mes_anterior', v_dias_ant,
    -- Hasta qué día tiene sentido dibujar la curva del mes en curso.
    'dia_de_hoy',        case when v_mes = date_trunc('month', v_hoy::timestamp)::date
                              then extract(day from v_hoy)::int end,

    'totales', jsonb_build_object(
      'cobrado',                (select coalesce(sum(monto), 0) from pag),
      'cobrado_mes_anterior',   (select coalesce(sum(monto), 0) from pag_ant),
      'cobros_devueltos',       (select coalesce(sum(monto), 0) from pag_anulado),
      'facturado',              (select coalesce(sum(total), 0) from ord_tot where estado <> 'anulado'),
      'a_cobrar',               (select coalesce(sum(saldo), 0) from ord_tot where estado <> 'anulado'),
      'ingresadas',             (select count(*) from ord),
      'anuladas',               (select count(*) from ord where estado = 'anulado'),
      'con_envio',              (select count(*) from ord where envio and estado <> 'anulado'),
      -- Entregadas EN el mes (por `fecha_entrega_real`), que es lo que
      -- significa "entregamos tantas en setiembre". No confundir con
      -- `por_estado.entregado`, que son las que INGRESARON este mes y hoy
      -- están entregadas.
      'entregadas',             (select count(*) from public.ordenes o
                                  where o.estado = 'entregado'
                                    and o.fecha_entrega_real >= v_ini
                                    and o.fecha_entrega_real <  v_fin)
    ),

    -- Estado actual de las órdenes que ingresaron en el mes. Es el cuadro que
    -- ya mostraba la pantalla.
    'por_estado', (
      select coalesce(jsonb_object_agg(e.estado::text, coalesce(n.c, 0)), '{}'::jsonb)
      from unnest(enum_range(null::estado_orden)) as e(estado)
      left join (select estado, count(*) as c from ord group by estado) n
             on n.estado = e.estado
    ),

    -- Serie por día del mes. Se emiten tantos días como el más largo de los
    -- dos meses, para que el acumulado del mes anterior quede completo cuando
    -- el anterior tiene 31 y el actual 30. Los días que no existen vienen en 0.
    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'dia',              d.dia,
               'cobrado',          coalesce(pc.cobrado, 0),
               'ordenes',          coalesce(oc.n, 0),
               'cobrado_anterior', coalesce(pa.cobrado, 0),
               'ordenes_anterior', coalesce(oa.n, 0)
             ) order by d.dia), '[]'::jsonb)
      from generate_series(1, greatest(v_dias, v_dias_ant)) as d(dia)
      left join (select dia, sum(monto) as cobrado from pag     group by dia) pc on pc.dia = d.dia
      left join (select dia, count(*)   as n       from ord     group by dia) oc on oc.dia = d.dia
      left join (select dia, sum(monto) as cobrado from pag_ant group by dia) pa on pa.dia = d.dia
      left join (select dia, count(*)   as n       from ord_ant group by dia) oa on oa.dia = d.dia
    ),

    -- Dominios chicos y fijos: van como objeto con TODAS las claves, también
    -- las que están en cero. Así el cliente dibuja siempre las mismas barras y
    -- no depende del orden del enum (ojo: `con_plancha` se agregó con `add
    -- value` en la 0003, así que en orden de enum va último, no segundo).
    'por_metodo', (
      select coalesce(jsonb_object_agg(m.metodo::text, jsonb_build_object(
               'cobrado',  coalesce(x.cobrado, 0),
               'cantidad', coalesce(x.n, 0))), '{}'::jsonb)
      from unnest(enum_range(null::metodo_pago)) as m(metodo)
      left join (select metodo, sum(monto) as cobrado, count(*) as n
                 from pag group by metodo) x on x.metodo = m.metodo
    ),

    'por_servicio', (
      select coalesce(jsonb_object_agg(s.servicio::text, jsonb_build_object(
               'ordenes',   coalesce(x.n, 0),
               'facturado', coalesce(x.facturado, 0))), '{}'::jsonb)
      from unnest(enum_range(null::servicio_orden)) as s(servicio)
      left join (select servicio, count(*) as n, sum(total) as facturado
                 from ord_tot where estado <> 'anulado' group by servicio) x
             on x.servicio = s.servicio
    ),

    -- Por artículo se agrupa por `descripcion`, que es el snapshot guardado en
    -- el ítem, y no por `articulo_id`: el id puede venir en null y renombrar
    -- un artículo no tiene que reescribir la historia. Para "Ropa"
    -- (`lleva_cantidad = false`) la cantidad es 1 por orden, así que el número
    -- es "en cuántas órdenes vino ropa", que es lo que se quiere saber.
    'por_articulo', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'descripcion', t.descripcion,
               'cantidad',    t.cantidad,
               'ordenes',     t.ordenes
             ) order by t.cantidad desc, t.descripcion), '[]'::jsonb)
      from (
        select i.descripcion,
               sum(i.cantidad)::int            as cantidad,
               count(distinct i.orden_id)::int as ordenes
        from public.orden_items i
        join ord_tot o on o.id = i.orden_id and o.estado <> 'anulado'
        group by i.descripcion
      ) t
    ),

    -- Quién recibió el trabajo (`ordenes.created_by`).
    'por_operador', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'nombre',    t.nombre,
               'ordenes',   t.ordenes,
               'facturado', t.facturado
             ) order by t.ordenes desc, t.nombre), '[]'::jsonb)
      from (
        select coalesce(pr.nombre, 'Sin usuario') as nombre,
               count(*)::int                      as ordenes,
               coalesce(sum(o.total), 0)          as facturado
        from ord_tot o
        left join public.profiles pr on pr.id = o.created_by
        where o.estado <> 'anulado'
        group by o.created_by, pr.nombre
      ) t
    ),

    -- Quién cobró (`pagos.recibido_por`). No es lo mismo que el de arriba: una
    -- la recibe el turno de la mañana y la cobra el de la tarde.
    'cobrado_por', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'nombre',  t.nombre,
               'cobrado', t.cobrado,
               'cobros',  t.cobros
             ) order by t.cobrado desc, t.nombre), '[]'::jsonb)
      from (
        select coalesce(pr.nombre, 'Sin usuario') as nombre,
               sum(p.monto)                       as cobrado,
               count(*)::int                      as cobros
        from pag p
        left join public.profiles pr on pr.id = p.recibido_por
        group by p.recibido_por, pr.nombre
      ) t
    ),

    -- Top 5 por facturado. Las que todavía no tienen monto no entran: el
    -- ranking sería del azar de quién trajo primero.
    'top_clientes', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'cliente_id', t.id,
               'nombre',     t.nombre,
               'facturado',  t.facturado,
               'ordenes',    t.ordenes
             ) order by t.facturado desc, t.nombre), '[]'::jsonb)
      from (
        select c.id, c.nombre,
               sum(o.total)  as facturado,
               count(*)::int as ordenes
        from ord_tot o
        join public.clientes c on c.id = o.cliente_id
        where o.estado <> 'anulado' and o.total > 0
        group by c.id, c.nombre
        order by sum(o.total) desc, c.nombre
        limit 5
      ) t
    ),

    -- Cuánto tardamos, medido sobre lo que SE ENTREGÓ en el mes. Si se midiera
    -- sobre lo que ingresó, las órdenes de fin de mes todavía sin entregar
    -- quedarían afuera y el promedio saldría siempre optimista.
    -- Una entrega revertida no cuenta: `revertir_entrega` suelta el sello.
    'dias_promedio_entrega', (
      select round(avg(
               extract(epoch from (o.fecha_entrega_real - o.fecha_ingreso)) / 86400.0
             )::numeric, 2)
      from public.ordenes o
      where o.estado = 'entregado'
        and o.fecha_entrega_real >= v_ini
        and o.fecha_entrega_real <  v_fin
    ),

    -- Esto NO es del mes: es de ahora. Mismo criterio que la barra del
    -- encabezado, y el plazo entra por parámetro para que no haya dos 7
    -- distintos (el del sistema y el que sale impreso en el comprobante).
    'listas_sin_retirar', (
      select count(*)
      from public.ordenes o
      where o.estado = 'listo'
        and o.fecha_retiro_estimada < v_hoy - greatest(p_dias_sin_retirar, 0)
    )
  ) into v_json;

  return v_json;
end $$;

-- -----------------------------------------------------------------------------
-- 8. Permisos
--    Recrear la vista la deja sin los GRANT de la 0004: no sobreviven a un
--    DROP. Sin esto, `authenticated` recibe 403 al leer v_ordenes y la app
--    entera se queda sin órdenes.
-- -----------------------------------------------------------------------------

grant select on public.v_ordenes to authenticated;
revoke all  on public.v_ordenes from anon;

grant execute on function public.buscar(text, int)                       to authenticated;
grant execute on function public.orden_totales(uuid)                     to authenticated;
grant execute on function public.ordenes_tablero(int, int)               to authenticated;
grant execute on function public.resumen_pendientes(int)                 to authenticated;
grant execute on function public.analiticas_mes(date, int)               to authenticated;
grant execute on function public.anular_pago(uuid, text)                 to authenticated;
grant execute on function public.revertir_entrega(uuid, uuid[], text)    to authenticated;
grant execute on function public.anular_orden(uuid, text, uuid[])        to authenticated;

revoke all on function public.ordenes_tablero(int, int)            from anon;
revoke all on function public.resumen_pendientes(int)              from anon;
revoke all on function public.analiticas_mes(date, int)            from anon;
revoke all on function public.anular_pago(uuid, text)              from anon;
revoke all on function public.revertir_entrega(uuid, uuid[], text) from anon;
revoke all on function public.anular_orden(uuid, text, uuid[])     from anon;
