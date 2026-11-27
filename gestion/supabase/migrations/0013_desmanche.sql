-- =============================================================================
--  EL PUENTE — 0013: servicio "Desmanche"
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Cuarto servicio. Mismo criterio que "Con plancha" en la 0003: es una forma
-- de trabajar la ropa, excluyente con las otras, así que va como valor del
-- enum y no como interruptor aparte.
--
-- Las analíticas (`por_servicio`) recorren `enum_range(null::servicio_orden)`,
-- así que lo cuentan solas sin tocar `analiticas_mes`.
-- -----------------------------------------------------------------------------

alter type servicio_orden add value if not exists 'desmanche';

-- PostgREST guarda el esquema en caché: sin esto, la API puede seguir
-- rechazando el valor nuevo hasta que se recargue sola.
notify pgrst, 'reload schema';
