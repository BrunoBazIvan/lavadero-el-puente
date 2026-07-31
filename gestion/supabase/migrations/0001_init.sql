-- =============================================================================
--  EL PUENTE · Lavadero Industrial — Sistema de gestión interna
--  Migración 0001 — esquema completo
-- =============================================================================
--  Corré este archivo entero, de una sola vez, en el SQL Editor de Supabase.
--  Es idempotente en lo que se puede serlo: si algo falla a mitad, arreglalo
--  y volvé a correrlo desde arriba.
--
--  Después de esta migración corré `seed.sql` (lista de precios + configuración).
--
--  IMPORTANTE, a mano en el dashboard de Supabase:
--    Authentication → Providers → Email → "Enable email signups" = OFF
--    Los usuarios los crea el dueño desde Authentication → Users → Add user.
-- =============================================================================

set search_path = public, extensions;

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------

do $$ begin
  create type estado_orden as enum ('recibido', 'en_proceso', 'listo', 'entregado', 'anulado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metodo_pago as enum ('efectivo', 'transferencia', 'debito', 'credito', 'mercado_pago');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rol_usuario as enum ('admin', 'operador');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_cliente as enum ('particular', 'empresa');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Tablas
-- -----------------------------------------------------------------------------

-- 2.1 profiles — extiende auth.users -------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  rol         rol_usuario not null default 'operador',
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Personal del mostrador. Se crea solo, por trigger, cuando el dueño da de alta un usuario en Supabase Auth.';

-- El perfil se crea automáticamente al crear el usuario en Auth.
-- Para que nazca como admin, al crear el usuario en el dashboard poné en
-- "User Metadata":  { "nombre": "Bruno", "rol": "admin" }
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'rol')::rol_usuario, 'operador')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2.2 clientes -----------------------------------------------------------------

create table if not exists public.clientes (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null check (length(trim(nombre)) > 0),
  telefono     text,                       -- normalizado a 09XXXXXXX desde la app
  email        text,
  tipo         tipo_cliente not null default 'particular',
  razon_social text,
  rut          text,
  direccion    text,
  notas        text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   uuid references public.profiles(id)
);

create index if not exists clientes_nombre_trgm_idx
  on public.clientes using gin (nombre gin_trgm_ops);
create index if not exists clientes_telefono_trgm_idx
  on public.clientes using gin (telefono gin_trgm_ops);
create index if not exists clientes_activo_idx
  on public.clientes (activo);

-- 2.3 articulos — lista de precios por prenda ----------------------------------

create table if not exists public.articulos (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null check (length(trim(nombre)) > 0),
  categoria        text,
  precio_unitario  numeric(10,2) not null check (precio_unitario >= 0),
  activo           boolean not null default true,
  orden_visual     int not null default 0
);

create index if not exists articulos_activo_orden_idx
  on public.articulos (activo, categoria, orden_visual);

-- 2.4 ordenes ------------------------------------------------------------------

create table if not exists public.ordenes (
  id                     uuid primary key default gen_random_uuid(),
  ref                    text unique not null,      -- lo pone el trigger, formato EP-00001
  cliente_id             uuid not null references public.clientes(id),
  estado                 estado_orden not null default 'recibido',
  fecha_ingreso          timestamptz not null default now(),
  fecha_retiro_estimada  date not null,
  fecha_entrega_real     timestamptz,
  descuento              numeric(10,2) not null default 0 check (descuento >= 0),
  notas                  text,
  created_by             uuid references public.profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists ordenes_estado_idx        on public.ordenes (estado);
create index if not exists ordenes_fecha_ingreso_idx on public.ordenes (fecha_ingreso desc);
create index if not exists ordenes_cliente_idx       on public.ordenes (cliente_id);
create index if not exists ordenes_ref_idx           on public.ordenes (ref text_pattern_ops);

-- 2.5 orden_items --------------------------------------------------------------
--  descripcion y precio_unitario son SNAPSHOT: si mañana sube el precio de la
--  camisa, las órdenes viejas no pueden cambiar de monto.

create table if not exists public.orden_items (
  id               uuid primary key default gen_random_uuid(),
  orden_id         uuid not null references public.ordenes(id) on delete cascade,
  articulo_id      uuid references public.articulos(id),
  descripcion      text not null check (length(trim(descripcion)) > 0),
  cantidad         int not null check (cantidad > 0),
  precio_unitario  numeric(10,2) not null check (precio_unitario >= 0),
  subtotal         numeric(10,2) generated always as (cantidad * precio_unitario) stored
);

create index if not exists orden_items_orden_idx on public.orden_items (orden_id);

-- 2.6 pagos --------------------------------------------------------------------

create table if not exists public.pagos (
  id            uuid primary key default gen_random_uuid(),
  orden_id      uuid not null references public.ordenes(id) on delete cascade,
  monto         numeric(10,2) not null check (monto > 0),
  metodo        metodo_pago not null,
  fecha         timestamptz not null default now(),
  recibido_por  uuid references public.profiles(id),
  notas         text
);

create index if not exists pagos_orden_idx on public.pagos (orden_id);
create index if not exists pagos_fecha_idx on public.pagos (fecha desc);

-- 2.7 configuracion — clave/valor ----------------------------------------------

create table if not exists public.configuracion (
  clave text primary key,
  valor text not null
);

-- -----------------------------------------------------------------------------
-- 3. Correlativo de referencia — se genera en la base, nunca en el cliente
-- -----------------------------------------------------------------------------

create sequence if not exists ordenes_ref_seq start 1;

create or replace function public.set_orden_ref()
returns trigger
language plpgsql
as $$
begin
  if new.ref is null or new.ref = '' then
    new.ref := 'EP-' || lpad(nextval('ordenes_ref_seq')::text, 5, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_orden_ref on public.ordenes;
create trigger trg_orden_ref
  before insert on public.ordenes
  for each row execute function public.set_orden_ref();

-- updated_at --------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_ordenes_updated_at on public.ordenes;
create trigger trg_ordenes_updated_at
  before update on public.ordenes
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Helpers de seguridad
-- -----------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and activo);
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and activo and rol = 'admin');
$$;

-- -----------------------------------------------------------------------------
-- 5. Totales de una orden (usado por triggers y por la vista)
-- -----------------------------------------------------------------------------

create or replace function public.orden_totales(p_orden_id uuid)
returns table (subtotal numeric, total numeric, pagado numeric, saldo numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(i.suma, 0)                                        as subtotal,
    coalesce(i.suma, 0) - o.descuento                          as total,
    coalesce(p.suma, 0)                                        as pagado,
    coalesce(i.suma, 0) - o.descuento - coalesce(p.suma, 0)    as saldo
  from public.ordenes o
  left join lateral (
    select sum(subtotal) as suma from public.orden_items where orden_id = o.id
  ) i on true
  left join lateral (
    select sum(monto) as suma from public.pagos where orden_id = o.id
  ) p on true
  where o.id = p_orden_id;
$$;

-- -----------------------------------------------------------------------------
-- 6. Reglas de negocio a nivel base
--    (la UI no es la seguridad: si algo no debe pasar, se bloquea acá)
-- -----------------------------------------------------------------------------

-- 6.1 Una orden entregada o anulada no se edita.
--     Única excepción: un admin puede anular una orden ya entregada.
create or replace function public.guard_orden_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo numeric;
  v_sub   numeric;
begin
  if old.estado in ('entregado', 'anulado') then
    if not (old.estado = 'entregado' and new.estado = 'anulado' and public.is_admin()) then
      raise exception 'La orden % está en estado "%" y no se puede modificar.', old.ref, old.estado;
    end if;
  end if;

  -- El descuento nunca puede superar el subtotal de los ítems.
  if new.descuento is distinct from old.descuento then
    select subtotal into v_sub from public.orden_totales(old.id);
    if new.descuento > coalesce(v_sub, 0) then
      raise exception 'El descuento ($ %) no puede superar el subtotal de la orden ($ %).',
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

-- 6.2 No se tocan los ítems de una orden cerrada.
create or replace function public.guard_orden_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado estado_orden;
  v_ref    text;
  v_orden  uuid := coalesce(new.orden_id, old.orden_id);
begin
  select estado, ref into v_estado, v_ref from public.ordenes where id = v_orden;

  -- Si la orden ya no existe estamos dentro de un DELETE en cascada: dejalo pasar.
  if not found then
    return coalesce(new, old);
  end if;

  if v_estado in ('entregado', 'anulado') then
    raise exception 'La orden % está en estado "%": no se pueden agregar, editar ni borrar ítems.', v_ref, v_estado;
  end if;

  return coalesce(new, old);
end $$;

drop trigger if exists trg_guard_orden_items on public.orden_items;
create trigger trg_guard_orden_items
  before insert or update or delete on public.orden_items
  for each row execute function public.guard_orden_items();

-- 6.3 Un pago no puede dejar el saldo en negativo, ni entrar en una orden anulada.
create or replace function public.guard_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado estado_orden;
  v_ref    text;
  v_total  numeric;
  v_otros  numeric;
begin
  select estado, ref into v_estado, v_ref from public.ordenes where id = new.orden_id;
  if not found then
    raise exception 'La orden del pago no existe.';
  end if;

  if v_estado = 'anulado' then
    raise exception 'La orden % está anulada: no admite pagos.', v_ref;
  end if;

  select total into v_total from public.orden_totales(new.orden_id);

  select coalesce(sum(monto), 0) into v_otros
  from public.pagos
  where orden_id = new.orden_id
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

-- 6.4 Borrar un pago de una orden ya entregada la dejaría con saldo abierto y
--     sin forma de reabrirla: solo admin (lo refuerza la RLS) y solo si la
--     orden no está cerrada.
create or replace function public.guard_pago_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado estado_orden;
  v_ref    text;
begin
  select estado, ref into v_estado, v_ref from public.ordenes where id = old.orden_id;
  if not found then
    return old;  -- delete en cascada
  end if;
  if v_estado in ('entregado', 'anulado') then
    raise exception 'La orden % está en estado "%": no se pueden borrar sus pagos.', v_ref, v_estado;
  end if;
  return old;
end $$;

drop trigger if exists trg_guard_pago_delete on public.pagos;
create trigger trg_guard_pago_delete
  before delete on public.pagos
  for each row execute function public.guard_pago_delete();

-- -----------------------------------------------------------------------------
-- 7. Vista de órdenes con totales
--    Los totales NO se guardan denormalizados: se calculan acá. Cero riesgo de
--    que el total quede desincronizado de los ítems.
-- -----------------------------------------------------------------------------

-- `buscar()` devuelve `setof v_ordenes`, así que depende del tipo de la vista:
-- hay que soltarla antes para que la migración se pueda volver a correr entera.
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

-- -----------------------------------------------------------------------------
-- 8. RPC: alta de orden atómica
--    La orden y sus ítems entran juntos o no entra nada.
-- -----------------------------------------------------------------------------

create or replace function public.crear_orden(payload jsonb)
returns public.ordenes
language plpgsql
security invoker          -- corre con los permisos del usuario: la RLS sigue aplicando
set search_path = public
as $$
declare
  v_orden public.ordenes;
  v_items int;
  v_sub   numeric;
  v_desc  numeric := coalesce((payload ->> 'descuento')::numeric, 0);
begin
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'La orden tiene que llevar al menos una prenda.';
  end if;

  insert into public.ordenes (cliente_id, fecha_retiro_estimada, descuento, notas, created_by)
  values (
    (payload ->> 'cliente_id')::uuid,
    (payload ->> 'fecha_retiro_estimada')::date,
    v_desc,
    nullif(trim(coalesce(payload ->> 'notas', '')), ''),
    auth.uid()
  )
  returning * into v_orden;

  insert into public.orden_items (orden_id, articulo_id, descripcion, cantidad, precio_unitario)
  select
    v_orden.id,
    nullif(it ->> 'articulo_id', '')::uuid,
    trim(it ->> 'descripcion'),
    (it ->> 'cantidad')::int,
    (it ->> 'precio_unitario')::numeric
  from jsonb_array_elements(payload -> 'items') as it;

  get diagnostics v_items = row_count;
  if v_items = 0 then
    raise exception 'La orden tiene que llevar al menos una prenda.';
  end if;

  select subtotal into v_sub from public.orden_totales(v_orden.id);
  if v_desc > coalesce(v_sub, 0) then
    raise exception 'El descuento ($ %) no puede superar el subtotal de la orden ($ %).', v_desc, coalesce(v_sub, 0);
  end if;

  return v_orden;
end $$;

-- -----------------------------------------------------------------------------
-- 9. RPC: buscador unificado (ref / teléfono / nombre)
-- -----------------------------------------------------------------------------

create or replace function public.buscar(termino text, limite int default 30)
returns setof public.v_ordenes
language plpgsql
stable
security invoker
-- `extensions` va en el search_path porque similarity() la trae pg_trgm.
set search_path = public, extensions
as $$
declare
  v_t    text := trim(coalesce(termino, ''));
  v_dig  text := regexp_replace(coalesce(termino, ''), '\D', '', 'g');
begin
  if length(v_t) < 2 and length(v_dig) = 0 then
    return;
  end if;

  -- ¿Parece una referencia?  "EP-123", "ep123", "123"
  if v_t ~* '^ep-?\d+$' or v_t ~ '^\d{1,5}$' then
    return query
      select * from public.v_ordenes
      where ref = 'EP-' || lpad(v_dig, 5, '0')
         or ref ilike '%' || v_dig || '%'
      order by fecha_ingreso desc
      limit limite;
    return;
  end if;

  -- ¿Parece un teléfono?  8 o 9 dígitos
  if length(v_dig) between 8 and 9 then
    return query
      select * from public.v_ordenes
      where regexp_replace(coalesce(cliente_telefono, ''), '\D', '', 'g') like '%' || v_dig || '%'
      order by fecha_ingreso desc
      limit limite;
    return;
  end if;

  -- Si no, es un nombre.
  return query
    select * from public.v_ordenes
    where cliente_nombre ilike '%' || v_t || '%'
       or similarity(cliente_nombre, v_t) > 0.25
    order by similarity(cliente_nombre, v_t) desc, fecha_ingreso desc
    limit limite;
end $$;

-- -----------------------------------------------------------------------------
-- 10. Row Level Security
--     RLS en TODAS las tablas. Nada queda accesible al rol anon.
-- -----------------------------------------------------------------------------

alter table public.profiles      enable row level security;
alter table public.clientes      enable row level security;
alter table public.articulos     enable row level security;
alter table public.ordenes       enable row level security;
alter table public.orden_items   enable row level security;
alter table public.pagos         enable row level security;
alter table public.configuracion enable row level security;

-- profiles ---------------------------------------------------------------------
drop policy if exists profiles_select   on public.profiles;
drop policy if exists profiles_insert   on public.profiles;
drop policy if exists profiles_update   on public.profiles;
drop policy if exists profiles_delete   on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated using (public.is_staff() or id = auth.uid());
create policy profiles_insert on public.profiles
  for insert to authenticated with check (public.is_admin());
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy profiles_delete on public.profiles
  for delete to authenticated using (public.is_admin());

-- clientes / ordenes -----------------------------------------------------------
drop policy if exists clientes_select on public.clientes;
drop policy if exists clientes_insert on public.clientes;
drop policy if exists clientes_update on public.clientes;
drop policy if exists clientes_delete on public.clientes;

create policy clientes_select on public.clientes
  for select to authenticated using (public.is_staff());
create policy clientes_insert on public.clientes
  for insert to authenticated with check (public.is_staff());
create policy clientes_update on public.clientes
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy clientes_delete on public.clientes
  for delete to authenticated using (public.is_admin());

drop policy if exists ordenes_select on public.ordenes;
drop policy if exists ordenes_insert on public.ordenes;
drop policy if exists ordenes_update on public.ordenes;
drop policy if exists ordenes_delete on public.ordenes;

create policy ordenes_select on public.ordenes
  for select to authenticated using (public.is_staff());
create policy ordenes_insert on public.ordenes
  for insert to authenticated with check (public.is_staff());
create policy ordenes_update on public.ordenes
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy ordenes_delete on public.ordenes
  for delete to authenticated using (public.is_admin());

-- orden_items ------------------------------------------------------------------
--  Excepción deliberada al "delete = solo admin": el operador tiene que poder
--  sacar una prenda que cargó mal en el mostrador. El trigger 6.2 ya impide
--  tocar los ítems de una orden entregada o anulada, que es lo que importa.
drop policy if exists orden_items_select on public.orden_items;
drop policy if exists orden_items_insert on public.orden_items;
drop policy if exists orden_items_update on public.orden_items;
drop policy if exists orden_items_delete on public.orden_items;

create policy orden_items_select on public.orden_items
  for select to authenticated using (public.is_staff());
create policy orden_items_insert on public.orden_items
  for insert to authenticated with check (public.is_staff());
create policy orden_items_update on public.orden_items
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy orden_items_delete on public.orden_items
  for delete to authenticated using (public.is_staff());

-- pagos ------------------------------------------------------------------------
drop policy if exists pagos_select on public.pagos;
drop policy if exists pagos_insert on public.pagos;
drop policy if exists pagos_update on public.pagos;
drop policy if exists pagos_delete on public.pagos;

create policy pagos_select on public.pagos
  for select to authenticated using (public.is_staff());
create policy pagos_insert on public.pagos
  for insert to authenticated with check (public.is_staff());
create policy pagos_update on public.pagos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy pagos_delete on public.pagos
  for delete to authenticated using (public.is_admin());

-- articulos / configuracion — lee todo el staff, edita solo admin --------------
drop policy if exists articulos_select on public.articulos;
drop policy if exists articulos_insert on public.articulos;
drop policy if exists articulos_update on public.articulos;
drop policy if exists articulos_delete on public.articulos;

create policy articulos_select on public.articulos
  for select to authenticated using (public.is_staff());
create policy articulos_insert on public.articulos
  for insert to authenticated with check (public.is_admin());
create policy articulos_update on public.articulos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy articulos_delete on public.articulos
  for delete to authenticated using (public.is_admin());

drop policy if exists configuracion_select on public.configuracion;
drop policy if exists configuracion_insert on public.configuracion;
drop policy if exists configuracion_update on public.configuracion;
drop policy if exists configuracion_delete on public.configuracion;

create policy configuracion_select on public.configuracion
  for select to authenticated using (public.is_staff());
create policy configuracion_insert on public.configuracion
  for insert to authenticated with check (public.is_admin());
create policy configuracion_update on public.configuracion
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy configuracion_delete on public.configuracion
  for delete to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 11. Permisos de esquema — el rol anónimo no ve nada
-- -----------------------------------------------------------------------------

revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.crear_orden(jsonb)      to authenticated;
grant execute on function public.buscar(text, int)       to authenticated;
grant execute on function public.orden_totales(uuid)     to authenticated;
grant execute on function public.is_staff()              to authenticated;
grant execute on function public.is_admin()              to authenticated;

alter default privileges in schema public revoke all on tables from anon;
