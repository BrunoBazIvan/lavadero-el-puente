-- =============================================================================
--  EL PUENTE — 0010: control de limpieza de tapizados
-- =============================================================================
--
--  Trabajos de tapizado (sillones, sillas, colchones, alfombras): no pasan por
--  el mostrador ni por `ordenes`, así que van en una tabla propia con sus tres
--  etapas: pendiente → terminado → cobrado.
--
--  Es solo de admin, y acá sí es un bloqueo de datos: a diferencia de
--  `clientes`, el operador no necesita esta tabla para nada, así que la RLS
--  usa `is_admin()` en las cuatro políticas.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Tabla
-- -----------------------------------------------------------------------------

create sequence if not exists tapizados_ref_seq start 1;

create table if not exists public.tapizados (
  id             uuid primary key default gen_random_uuid(),
  ref            text unique not null,               -- lo pone el trigger, TP-00001
  nombre         text not null check (length(trim(nombre)) > 0),
  edificio       text,
  contacto       text not null check (length(trim(contacto)) > 0),
  producto       text not null check (producto in (
                   'sillon_1', 'sillon_2', 'sillon_3', 'sillon_esquinero',
                   'silla', 'colchon_1', 'colchon_2', 'alfombra', 'otro')),
  producto_otro  text,
  -- Presupuesto estimado al cargarlo. En alfombras lo reemplaza el precio por
  -- medidas apenas se cargan ancho y largo (ver `precio_final`).
  precio         numeric(12,2) not null default 0 check (precio >= 0),
  ancho_m        numeric(6,2) check (ancho_m > 0),
  largo_m        numeric(6,2) check (largo_m > 0),
  -- El $/m² vigente al terminarla queda guardado en la fila: si mañana sube,
  -- las alfombras ya cobradas no cambian de precio.
  precio_m2      numeric(10,2) check (precio_m2 > 0),
  precio_final   numeric(12,2) generated always as (
                   case
                     when producto = 'alfombra'
                      and ancho_m is not null and largo_m is not null and precio_m2 is not null
                     then round(ancho_m * largo_m * precio_m2)
                     else precio
                   end
                 ) stored,
  estado         text not null default 'pendiente'
                   check (estado in ('pendiente', 'terminado', 'cobrado')),
  notas          text,
  terminado_el   timestamptz,
  cobrado_el     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references public.profiles(id) default auth.uid(),

  constraint tapizados_otro_con_texto
    check (producto <> 'otro' or length(trim(coalesce(producto_otro, ''))) > 0)
);

comment on table public.tapizados is
  'Trabajos de limpieza de tapizados. Solo admin. El total es `precio_final`: en alfombras sale de ancho × largo × precio_m2.';

create index if not exists tapizados_estado_idx on public.tapizados (estado, created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Triggers: referencia, updated_at y guarda de etapas
-- -----------------------------------------------------------------------------

create or replace function public.set_tapizado_ref()
returns trigger
language plpgsql
as $$
begin
  if new.ref is null or new.ref = '' then
    new.ref := 'TP-' || lpad(nextval('tapizados_ref_seq')::text, 5, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_tapizado_ref on public.tapizados;
create trigger trg_tapizado_ref
  before insert on public.tapizados
  for each row execute function public.set_tapizado_ref();

drop trigger if exists trg_tapizados_updated_at on public.tapizados;
create trigger trg_tapizados_updated_at
  before update on public.tapizados
  for each row execute function public.touch_updated_at();

-- Una alfombra no se da por terminada sin medidas: sin ellas no hay precio.
-- Además sella cuándo entró a cada etapa, y lo limpia si se vuelve atrás.
create or replace function public.guard_tapizado()
returns trigger
language plpgsql
as $$
begin
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

drop trigger if exists trg_guard_tapizado on public.tapizados;
create trigger trg_guard_tapizado
  before insert or update on public.tapizados
  for each row execute function public.guard_tapizado();

-- -----------------------------------------------------------------------------
-- 3. RLS: solo admin
-- -----------------------------------------------------------------------------

alter table public.tapizados enable row level security;

drop policy if exists tapizados_select on public.tapizados;
drop policy if exists tapizados_insert on public.tapizados;
drop policy if exists tapizados_update on public.tapizados;
drop policy if exists tapizados_delete on public.tapizados;

create policy tapizados_select on public.tapizados
  for select to authenticated using (public.is_admin());
create policy tapizados_insert on public.tapizados
  for insert to authenticated with check (public.is_admin());
create policy tapizados_update on public.tapizados
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tapizados_delete on public.tapizados
  for delete to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Precio por m² de alfombra
--   Vive en la base y no en el código, como `link_google` (0009): si cambia,
--   se edita esta fila y listo, sin deploy.
-- -----------------------------------------------------------------------------

insert into public.configuracion (clave, valor)
values ('precio_m2_alfombra', '300')
on conflict (clave) do nothing;
