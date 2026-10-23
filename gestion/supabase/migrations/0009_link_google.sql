-- =============================================================================
--  EL PUENTE — 0009: link a la ficha de Google en el WhatsApp de "listo"
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Link a la ficha del lavadero en Google Maps
--   Va en el WhatsApp que avisa que la ropa está pronta, para que el cliente
--   vea los horarios antes de venir a retirar. Se saca en Google Maps → ficha
--   del lavadero → Compartir (un maps.app.goo.gl/…).
--
--   Vive en la base y no en el código: si cambia la ficha, se cambia esta fila
--   y listo, sin deploy. Vacío, el mensaje sale sin link.
-- -----------------------------------------------------------------------------

insert into public.configuracion (clave, valor)
values ('link_google', '')
on conflict (clave) do nothing;
