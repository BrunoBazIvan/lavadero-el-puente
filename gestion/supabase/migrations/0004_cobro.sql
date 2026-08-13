-- =============================================================================
--  EL PUENTE — 0004: monto de la orden y cobro al entregar
-- =============================================================================
--  Al recibir la ropa no se sabe cuánto sale: eso se ve cuando está lavada y
--  pesada. Así que el precio se carga al pasar la orden a "lista para retirar"
--  y se cobra cuando el cliente viene a buscarla.
--
--  El monto va en una columna de la orden y NO en los precios de los ítems: la
--  0002 dejó `precio_unitario` en 0 a propósito porque la ropa no se cuenta
--  prenda por prenda. Un precio por bolsa es lo que se cobra de verdad.
--
--  A partir de acá, `total` sale de `ordenes.monto` y no de la suma de ítems.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. El monto
--    Nullable a propósito: una orden recién recibida todavía no tiene precio.
--    Los guards de más abajo exigen que esté cargado para pasarla a "lista".
-- -----------------------------------------------------------------------------

alter table public.ordenes
  add column if not exists monto numeric(10,2);

do $$ begin
  alter table public.ordenes
    add constraint ordenes_monto_no_negativo check (monto is null or monto >= 0);
exception when duplicate_object then null; end $$;

comment on column public.ordenes.monto is
  'Lo que se cobra por la orden entera. Se carga al pasarla a "listo". Null = todavía sin precio.';

-- -----------------------------------------------------------------------------
-- 2. Totales
--    `subtotal` pasa a ser el monto de la orden. Sigue llamándose así porque lo
--    usan el guard del descuento y la vista, y porque el descuento se sigue
--    restando igual: total = monto − descuento.
-- -----------------------------------------------------------------------------

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
    select sum(monto) as suma from public.pagos where orden_id = o.id
  ) p on true
  where o.id = p_orden_id;
$$;

-- -----------------------------------------------------------------------------
-- 3. Vista y buscador
--    Hay que recrearlos para que `o.*` levante la columna nueva. El orden
--    importa: `buscar()` devuelve `setof v_ordenes`, así que depende del tipo
--    de la vista y tiene que soltarse primero.
--
--    `estado_pago` mira primero si está saldada: una orden sin monto (total 0)
--    caía en "pendiente" y no quiere decir nada. La app muestra "sin monto"
--    cuando `monto is null`, que es la distinción que le importa al mostrador.
-- -----------------------------------------------------------------------------

drop function if exists public.buscar(text, int);
drop view if exists public.v_ordenes;

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
  select sum(monto) as total_pagado from public.pagos where orden_id = o.id
) p on true;

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
-- 4. Reglas del cobro
--    Se agregan a `guard_orden_update`, que ya traía la 0001. Las tres de antes
--    quedan igual; abajo van las dos nuevas.
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
  if old.estado in ('entregado', 'anulado') then
    if not (old.estado = 'entregado' and new.estado = 'anulado' and public.is_admin()) then
      raise exception 'La orden % está en estado "%" y no se puede modificar.', old.ref, old.estado;
    end if;
  end if;

  -- Sin monto no se marca lista ni se entrega. Es el único momento en que el
  -- precio se puede pedir sin frenar el mostrador: la ropa ya está pesada.
  if new.estado in ('listo', 'entregado') and new.monto is null then
    raise exception 'Antes de marcar la orden % como "%" hay que cargarle el monto.',
      old.ref, new.estado;
  end if;

  -- Bajar el monto por debajo de lo ya cobrado dejaría un saldo negativo.
  if new.monto is distinct from old.monto and new.monto is not null then
    select pagado into v_pagado from public.orden_totales(old.id);
    if coalesce(v_pagado, 0) > new.monto - new.descuento then
      raise exception
        'La orden % ya tiene cobrados $ %: el monto no puede quedar por debajo.',
        old.ref, coalesce(v_pagado, 0);
    end if;
  end if;

  -- El descuento nunca puede superar el monto de la orden.
  if new.descuento is distinct from old.descuento then
    select subtotal into v_sub from public.orden_totales(old.id);
    if new.descuento > coalesce(v_sub, 0) then
      raise exception 'El descuento ($ %) no puede superar el monto de la orden ($ %).',
        new.descuento, coalesce(v_sub, 0);
    end if;
  end if;

  -- Entregar con saldo pendiente: solo admin.
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
-- 5. RPC: entregar
--    Cobrar y entregar son un solo movimiento del mostrador y tienen que ser
--    una sola transacción: si falla la entrega, no puede quedar un pago suelto.
--
--    El orden de adentro no es negociable:
--      1. el monto, porque `guard_pago` rechaza un pago que supere el total;
--      2. el pago, porque `guard_orden_update` no deja entregar con saldo;
--      3. la entrega.
--
--    `security invoker`: la RLS y los guards siguen aplicando igual que si el
--    mostrador escribiera las tablas a mano.
-- -----------------------------------------------------------------------------

create or replace function public.entregar_orden(
  p_orden_id uuid,
  p_monto    numeric      default null,
  p_cobro    numeric      default null,
  p_metodo   metodo_pago  default null
)
returns public.ordenes
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_orden public.ordenes;
begin
  if p_monto is not null then
    update public.ordenes set monto = p_monto where id = p_orden_id;
  end if;

  if p_cobro is not null and p_cobro > 0 then
    if p_metodo is null then
      raise exception 'Falta decir cómo se cobró la orden.';
    end if;
    insert into public.pagos (orden_id, monto, metodo, recibido_por)
    values (p_orden_id, p_cobro, p_metodo, auth.uid());
  end if;

  update public.ordenes
     set estado = 'entregado'
   where id = p_orden_id
  returning * into v_orden;

  if not found then
    raise exception 'La orden que se quiere entregar no existe.';
  end if;

  return v_orden;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Permisos
--    Recrear la vista la deja sin los GRANT que le dio la 0002: no sobreviven
--    a un DROP. Sin esto, `authenticated` recibe 403 al leer v_ordenes y la app
--    entera se queda sin órdenes.
-- -----------------------------------------------------------------------------

grant select on public.v_ordenes to authenticated;
revoke all  on public.v_ordenes from anon;

grant execute on function public.buscar(text, int)                                to authenticated;
grant execute on function public.entregar_orden(uuid, numeric, numeric, metodo_pago) to authenticated;
