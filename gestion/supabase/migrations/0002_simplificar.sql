-- =============================================================================
--  EL PUENTE — 0002: simplificación al flujo real del mostrador
-- =============================================================================
--  Al recibir la ropa no se cuenta prenda por prenda. Se anota qué llegó (ropa
--  o acolchados, y de cuántas plazas), qué servicio lleva y cuándo se retira.
--  La plata todavía no se maneja desde acá.
--
--  Esta migración NO borra nada: las columnas de precio, el descuento y la
--  tabla `pagos` quedan intactas y sin uso, para cuando quieran cobrar desde
--  el sistema. Solo agrega lo que faltaba.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Servicio y envío
--    Van como columnas de la orden y no como ítems: un servicio no es una
--    prenda, y así no ensucia el conteo ni el comprobante.
-- -----------------------------------------------------------------------------

do $$ begin
  create type servicio_orden as enum ('lavado_secado', 'solo_secado');
exception when duplicate_object then null; end $$;

alter table public.ordenes
  add column if not exists servicio servicio_orden not null default 'lavado_secado';

comment on column public.ordenes.servicio is
  'Lavado y secado, o solo secado. El retiro y entrega va aparte, en `envio`.';

alter table public.ordenes
  add column if not exists envio boolean not null default false;

comment on column public.ordenes.envio is
  'Retiro y entrega a domicilio. Se suma a cualquiera de los dos servicios.';

-- -----------------------------------------------------------------------------
-- 2. Artículos que se cargan sin cantidad
--    "Ropa" se marca y listo; los acolchados sí se cuentan. Va en la tabla y no
--    cableado en el código, para poder agregar otro artículo sin tocar nada.
-- -----------------------------------------------------------------------------

alter table public.articulos
  add column if not exists lleva_cantidad boolean not null default true;

comment on column public.articulos.lleva_cantidad is
  'false = se marca sin número (la ropa suelta no se cuenta al recibirla).';

-- -----------------------------------------------------------------------------
-- 3. Ya no se cargan precios
--    Las columnas siguen ahí para cuando se quiera cobrar desde el sistema,
--    pero con default 0: si no, un alta de artículo sin precio revienta contra
--    el `not null`.
-- -----------------------------------------------------------------------------

alter table public.orden_items alter column precio_unitario set default 0;
alter table public.articulos   alter column precio_unitario set default 0;

-- -----------------------------------------------------------------------------
-- 4. Vista y buscador
--    Hay que recrearlos para que `o.*` levante las columnas nuevas. El orden
--    importa: `buscar()` devuelve `setof v_ordenes`, así que depende del tipo
--    de la vista y tiene que soltarse primero.
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
  coalesce(i.total_items, 0)                                        as subtotal,
  coalesce(i.cantidad_prendas, 0)                                   as cantidad_prendas,
  coalesce(i.total_items, 0) - o.descuento                          as total,
  coalesce(p.total_pagado, 0)                                       as pagado,
  coalesce(i.total_items, 0) - o.descuento - coalesce(p.total_pagado, 0) as saldo,
  case
    when coalesce(p.total_pagado, 0) = 0 then 'pendiente'
    when coalesce(p.total_pagado, 0) >= (coalesce(i.total_items, 0) - o.descuento) then 'pagado'
    else 'parcial'
  end as estado_pago
from public.ordenes o
join public.clientes c on c.id = o.cliente_id
left join lateral (
  select sum(subtotal) as total_items, sum(cantidad) as cantidad_prendas
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
-- 5. Alta de orden — ahora con servicio y envío, y sin precios obligatorios
-- -----------------------------------------------------------------------------

create or replace function public.crear_orden(payload jsonb)
returns public.ordenes
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_orden public.ordenes;
  v_items int;
begin
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'La orden tiene que decir al menos qué se recibió.';
  end if;

  insert into public.ordenes (
    cliente_id, fecha_retiro_estimada, servicio, envio, notas, created_by
  )
  values (
    (payload ->> 'cliente_id')::uuid,
    (payload ->> 'fecha_retiro_estimada')::date,
    coalesce((payload ->> 'servicio')::servicio_orden, 'lavado_secado'),
    coalesce((payload ->> 'envio')::boolean, false),
    nullif(trim(coalesce(payload ->> 'notas', '')), ''),
    auth.uid()
  )
  returning * into v_orden;

  insert into public.orden_items (orden_id, articulo_id, descripcion, cantidad, precio_unitario)
  select
    v_orden.id,
    nullif(it ->> 'articulo_id', '')::uuid,
    trim(it ->> 'descripcion'),
    coalesce((it ->> 'cantidad')::int, 1),
    coalesce((it ->> 'precio_unitario')::numeric, 0)
  from jsonb_array_elements(payload -> 'items') as it;

  get diagnostics v_items = row_count;
  if v_items = 0 then
    raise exception 'La orden tiene que decir al menos qué se recibió.';
  end if;

  return v_orden;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Permisos
--    Recrear la vista la deja sin los permisos que le dio 0001: los GRANT no
--    sobreviven a un DROP. Sin esto, `authenticated` recibe 403 al leer
--    v_ordenes y la app entera se queda sin órdenes.
-- -----------------------------------------------------------------------------

grant select on public.v_ordenes to authenticated;
revoke all  on public.v_ordenes from anon;

grant execute on function public.crear_orden(jsonb) to authenticated;
grant execute on function public.buscar(text, int)  to authenticated;
