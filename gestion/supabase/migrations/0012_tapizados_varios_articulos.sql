-- =============================================================================
--  EL PUENTE — 0012: tapizados con varios artículos, medidas opcionales
-- =============================================================================
--
--  Pedidos de la dueña (19/11/2026):
--
--  1. Un trabajo puede tener más de un artículo: un sillón de 3 cuerpos y
--     cuatro sillas del mismo cliente son UN tapizado, con un solo cobro. Los
--     artículos pasan a una tabla hija, `tapizado_items`, y `tapizados.precio`
--     queda como el total, que lo calcula la RPC `guardar_tapizado`.
--
--  2. Las medidas de la alfombra dejan de ser obligatorias. El precio de cada
--     artículo es el que se escribe; ancho × largo × $/m² queda como una
--     calculadora opcional que, si se usa, guarda las medidas en el renglón.
--     Por eso se va la columna generada `precio_final` y la regla de
--     `guard_tapizado` que no dejaba terminar una alfombra sin medir.
--
--  3. El m² de alfombra pasa a $400. Las ya medidas guardan su `precio_m2` en
--     el renglón, así que no cambian.
--
--  Los cambios de cabecera + artículos van siempre por `guardar_tapizado`: en
--  una sola transacción, nunca un insert y después otro que se puede caer.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Precio del m²
-- -----------------------------------------------------------------------------

insert into public.configuracion (clave, valor)
values ('precio_m2_alfombra', '400')
on conflict (clave) do update set valor = excluded.valor;

-- -----------------------------------------------------------------------------
-- 2. Artículos
-- -----------------------------------------------------------------------------

create table if not exists public.tapizado_items (
  id              uuid primary key default gen_random_uuid(),
  tapizado_id     uuid not null references public.tapizados(id) on delete cascade,
  posicion        int  not null default 0,
  producto        text not null check (producto in (
                    'sillon_1', 'sillon_2', 'sillon_3', 'sillon_esquinero',
                    'silla', 'colchon_1', 'colchon_2', 'alfombra', 'otro')),
  producto_otro   text,
  cantidad        int  not null default 1 check (cantidad between 1 and 999),
  precio_unitario numeric(12,2) not null default 0 check (precio_unitario >= 0),
  -- Solo si se usó la calculadora de alfombra. Van las tres o ninguna: con
  -- `precio_m2` guardado, subir el precio del m² no cambia lo ya cotizado.
  ancho_m         numeric(6,2) check (ancho_m > 0),
  largo_m         numeric(6,2) check (largo_m > 0),
  precio_m2       numeric(10,2) check (precio_m2 > 0),

  constraint tapizado_items_otro_con_texto
    check (producto <> 'otro' or length(trim(coalesce(producto_otro, ''))) > 0),
  constraint tapizado_items_medidas_completas
    check ((ancho_m is null and largo_m is null and precio_m2 is null)
        or (ancho_m is not null and largo_m is not null and precio_m2 is not null))
);

comment on table public.tapizado_items is
  'Artículos de un tapizado. Solo admin. Se reemplazan enteros por `guardar_tapizado`, que además recalcula `tapizados.precio`.';

create index if not exists tapizado_items_tapizado_idx
  on public.tapizado_items (tapizado_id, posicion);

alter table public.tapizado_items enable row level security;

drop policy if exists tapizado_items_select on public.tapizado_items;
drop policy if exists tapizado_items_insert on public.tapizado_items;
drop policy if exists tapizado_items_update on public.tapizado_items;
drop policy if exists tapizado_items_delete on public.tapizado_items;

create policy tapizado_items_select on public.tapizado_items
  for select to authenticated using (public.is_admin());
create policy tapizado_items_insert on public.tapizado_items
  for insert to authenticated with check (public.is_admin());
create policy tapizado_items_update on public.tapizado_items
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tapizado_items_delete on public.tapizado_items
  for delete to authenticated using (public.is_admin());

-- Un tapizado anulado no se toca, tampoco por sus artículos. El borrado en
-- cascada (si algún día se borra la cabecera a mano) sí pasa: ahí la
-- cabecera ya no existe.
create or replace function public.guard_tapizado_item()
returns trigger
language plpgsql
as $$
declare
  v_estado text;
begin
  select estado into v_estado
    from public.tapizados
   where id = coalesce(new.tapizado_id, old.tapizado_id);

  if v_estado = 'anulado' then
    raise exception 'El tapizado está anulado: ya no se puede modificar.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.producto <> 'otro' then
    new.producto_otro := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_tapizado_item on public.tapizado_items;
create trigger trg_guard_tapizado_item
  before insert or update or delete on public.tapizado_items
  for each row execute function public.guard_tapizado_item();

-- -----------------------------------------------------------------------------
-- 3. Pasar lo que ya hay: cada tapizado viejo es un artículo
--   El precio del renglón es el `precio_final` de antes, así que una alfombra
--   medida conserva lo que se le cobró.
--   Sin el guard de artículos: los anulados también tienen que pasar.
--
--   Va dentro de un `if`: este paso borra las columnas viejas que lee, así
--   que en una segunda corrida ya no están y el archivo entero se caía con
--   `column t.producto does not exist`. Si ya se pasó, se saltea.
-- -----------------------------------------------------------------------------

do $$
begin
if exists (
  select 1 from information_schema.columns
   where table_schema = 'public' and table_name = 'tapizados' and column_name = 'producto'
) then

alter table public.tapizado_items disable trigger trg_guard_tapizado_item;

insert into public.tapizado_items
  (tapizado_id, posicion, producto, producto_otro, cantidad, precio_unitario,
   ancho_m, largo_m, precio_m2)
select t.id, 0, t.producto, t.producto_otro, 1, t.precio_final,
       case when t.ancho_m is not null and t.largo_m is not null and t.precio_m2 is not null then t.ancho_m end,
       case when t.ancho_m is not null and t.largo_m is not null and t.precio_m2 is not null then t.largo_m end,
       case when t.ancho_m is not null and t.largo_m is not null and t.precio_m2 is not null then t.precio_m2 end
  from public.tapizados t
 where not exists (select 1 from public.tapizado_items i where i.tapizado_id = t.id);

alter table public.tapizado_items enable trigger trg_guard_tapizado_item;

-- `precio` pasa a ser el total. Sin los triggers: `guard_tapizado` rechaza
-- cualquier update sobre un anulado, y `updated_at` no tiene por qué moverse.
alter table public.tapizados disable trigger trg_guard_tapizado;
alter table public.tapizados disable trigger trg_tapizados_updated_at;

update public.tapizados set precio = precio_final where precio <> precio_final;

alter table public.tapizados enable trigger trg_guard_tapizado;
alter table public.tapizados enable trigger trg_tapizados_updated_at;

alter table public.tapizados
  drop constraint if exists tapizados_otro_con_texto,
  drop column if exists precio_final,
  drop column if exists producto,
  drop column if exists producto_otro,
  drop column if exists ancho_m,
  drop column if exists largo_m,
  drop column if exists precio_m2;

end if;
end $$;

comment on table public.tapizados is
  'Trabajos de limpieza de tapizados. Solo admin. `precio` es el total de sus `tapizado_items`; lo mantiene `guardar_tapizado`.';

-- -----------------------------------------------------------------------------
-- 4. Guarda: sin la regla de medidas
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
    return new;
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
-- 5. RPC: alta y edición en una sola transacción
--
--   p_id null → alta; si no, edita ese tapizado. Los artículos se reemplazan
--   enteros: es lo que muestra el formulario, y así no hay que conciliar
--   altas, bajas y cambios renglón por renglón.
--
--   p_datos: { nombre, edificio, contacto, notas }
--   p_items: [{ producto, producto_otro, cantidad, precio_unitario,
--               ancho_m, largo_m, precio_m2 }, …]
-- -----------------------------------------------------------------------------

create or replace function public.guardar_tapizado(
  p_id    uuid,
  p_datos jsonb,
  p_items jsonb
)
returns public.tapizados
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_t     public.tapizados;
  v_total numeric(12,2);
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede cargar o editar tapizados.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Un tapizado tiene que tener al menos un artículo.';
  end if;

  if p_id is null then
    insert into public.tapizados (nombre, edificio, contacto, notas)
    values (
      trim(p_datos->>'nombre'),
      nullif(trim(coalesce(p_datos->>'edificio', '')), ''),
      trim(p_datos->>'contacto'),
      nullif(trim(coalesce(p_datos->>'notas', '')), '')
    )
    returning * into v_t;
  else
    update public.tapizados
       set nombre   = trim(p_datos->>'nombre'),
           edificio = nullif(trim(coalesce(p_datos->>'edificio', '')), ''),
           contacto = trim(p_datos->>'contacto'),
           notas    = nullif(trim(coalesce(p_datos->>'notas', '')), '')
     where id = p_id
    returning * into v_t;
    if not found then
      raise exception 'El tapizado que se quiere editar no existe.';
    end if;
    delete from public.tapizado_items where tapizado_id = v_t.id;
  end if;

  insert into public.tapizado_items
    (tapizado_id, posicion, producto, producto_otro, cantidad, precio_unitario,
     ancho_m, largo_m, precio_m2)
  select v_t.id,
         (e.ord - 1)::int,
         e.item->>'producto',
         nullif(trim(coalesce(e.item->>'producto_otro', '')), ''),
         coalesce((e.item->>'cantidad')::int, 1),
         coalesce((e.item->>'precio_unitario')::numeric, 0),
         (e.item->>'ancho_m')::numeric,
         (e.item->>'largo_m')::numeric,
         (e.item->>'precio_m2')::numeric
    from jsonb_array_elements(p_items) with ordinality as e(item, ord);

  select coalesce(sum(cantidad * precio_unitario), 0) into v_total
    from public.tapizado_items where tapizado_id = v_t.id;

  update public.tapizados set precio = v_total where id = v_t.id
  returning * into v_t;

  return v_t;
end $$;

revoke all on function public.guardar_tapizado(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_tapizado(uuid, jsonb, jsonb) to authenticated;

-- PostgREST guarda el esquema en caché: sin esto, la app puede seguir
-- pidiendo `tapizado_items` y `guardar_tapizado` y recibir "Could not find
-- … in the schema cache" hasta que se recargue sola.
notify pgrst, 'reload schema';
