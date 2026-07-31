-- =============================================================================
--  EL PUENTE — datos iniciales
--  Correr DESPUÉS de las migraciones, en el SQL Editor de Supabase.
-- =============================================================================
--
--  Al recibir la ropa no se cuenta prenda por prenda: se anota si es ropa o
--  acolchados, y de cuántas plazas. Por eso son tres opciones y no treinta.
--
--  Para agregar otra (una frazada, una cortina) no hace falta tocar este
--  archivo: se hace desde la pantalla de Artículos.
--
--  Los precios quedan en 0 a propósito. El cobro no se maneja desde el sistema
--  todavía; la columna existe para cuando se decida hacerlo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Configuración del negocio
--  Sale impresa en el comprobante. No hay pantalla para editarla: se cambia
--  desde el SQL Editor o desde Supabase Studio (tabla `configuracion`).
--  Los datos de contacto vienen de la landing (lib/config.ts); si cambian allá,
--  cambialos acá también — son dos sistemas separados a propósito.
-- -----------------------------------------------------------------------------

insert into public.configuracion (clave, valor) values
  ('nombre_negocio',        'Lavadero Industrial El Puente'),
  ('direccion',             'Batalla del Cerrito 1009 esq. Dr. Román Bergalli, Maldonado'),
  ('telefono_whatsapp',     '59899767134'),
  ('leyenda_ticket',        'Presentá este comprobante para retirar tus prendas.'),
  ('dias_entrega_default',  '1'),
  ('ancho_ticket_mm',       '80')
on conflict (clave) do nothing;

-- -----------------------------------------------------------------------------
-- Qué se puede recibir
--  `lleva_cantidad = false` es lo que hace que la ropa se marque sin número.
--  `orden_visual` define en qué orden aparecen los botones en el alta.
-- -----------------------------------------------------------------------------

insert into public.articulos (nombre, categoria, precio_unitario, orden_visual, lleva_cantidad)
select nombre, null, 0, orden, cuenta
from (values
  ('Ropa',               10, false),
  ('Acolchado 1 plaza',  20, true),
  ('Acolchado 2 plazas', 30, true)
) as t(nombre, orden, cuenta)
where not exists (
  select 1 from public.articulos a where a.nombre = t.nombre
);
