-- =============================================================================
--  EL PUENTE — 0005: condiciones de guarda en el comprobante
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Plazo de guarda de las prendas
--   Sale impreso al pie del comprobante del cliente. El texto vive en la base y
--   no en el código del ticket: el plazo lo decide el lavadero, y cambiarlo de
--   7 a 15 días no debería necesitar un deploy.
--
--   Vaciar el valor (no borrar la fila) saca el bloque del papel.
-- -----------------------------------------------------------------------------

insert into public.configuracion (clave, valor)
values (
  'leyenda_responsabilidad',
  'Guardamos las prendas 7 días desde que te avisamos que están listas. Pasado ese plazo el lavadero no se hace responsable.'
)
on conflict (clave) do nothing;
