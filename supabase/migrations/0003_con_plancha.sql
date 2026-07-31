-- =============================================================================
--  EL PUENTE — 0003: servicio "Con plancha" y entrega al día siguiente
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Tercer servicio
--    Va como valor del enum y no como interruptor aparte: es una forma de
--    trabajar la ropa, excluyente con las otras dos. El envío sí es un
--    agregado, y por eso sigue siendo su propia columna.
--
--    `add value` es seguro dentro de la transacción de la migración mientras
--    no se use el valor nuevo en el mismo archivo (Postgres 12+).
-- -----------------------------------------------------------------------------

alter type servicio_orden add value if not exists 'con_plancha';

-- -----------------------------------------------------------------------------
-- 2. Entrega estimada: 24 horas
--    Antes eran dos días. Solo se pisa si todavía está en el valor viejo, para
--    no deshacer un cambio hecho a propósito desde la base.
-- -----------------------------------------------------------------------------

update public.configuracion
set valor = '1'
where clave = 'dias_entrega_default' and valor = '2';

insert into public.configuracion (clave, valor)
values ('dias_entrega_default', '1')
on conflict (clave) do nothing;
