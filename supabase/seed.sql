-- =============================================================================
--  EL PUENTE — datos iniciales
--  Correr DESPUÉS de 0001_init.sql, en el SQL Editor de Supabase.
-- =============================================================================
--
--  ⚠️  LOS PRECIOS ESTÁN EN 0 A PROPÓSITO.
--
--  No inventé ninguno. Los nombres de los artículos salen de los servicios que
--  el lavadero ya publica en su landing (acolchados, cortinas, alfombras, ropa
--  general, planchado); los importes los tenés que cargar vos.
--
--  Dos formas de completarlos:
--    a) Editando este archivo antes de correrlo (columna `precio`).
--    b) Corriéndolo así y cargando los precios desde la pantalla /articulos.
--
--  Para ver qué falta, en cualquier momento:
--      select categoria, nombre from articulos where precio_unitario = 0 order by 1,2;
--
--  Revisá también qué artículos sobran o faltan: esta lista es un punto de
--  partida razonable, no la lista real del mostrador.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Configuración del negocio
--  Los datos de contacto vienen de la landing (lib/config.ts). Si cambian allá,
--  cambialos acá también — son dos sistemas separados a propósito.
-- -----------------------------------------------------------------------------

insert into public.configuracion (clave, valor) values
  ('nombre_negocio',        'Lavadero Industrial El Puente'),
  ('direccion',             'Batalla del Cerrito 1009 esq. Dr. Román Bergalli, Maldonado'),
  ('telefono_whatsapp',     '59899767134'),
  ('leyenda_ticket',        'Presentá este comprobante para retirar tus prendas.'),
  ('dias_entrega_default',  '2'),
  ('ancho_ticket_mm',       '80')
on conflict (clave) do nothing;

-- -----------------------------------------------------------------------------
-- Lista de precios
-- -----------------------------------------------------------------------------

--  `orden_visual` ordena dos cosas a la vez: los artículos dentro de su
--  categoría, y las categorías entre sí (cada una arranca en un centenar
--  distinto, y el orden del grupo lo da su artículo más bajo). Por eso las
--  prendas van primero y los servicios al final: es lo que más y lo que menos
--  se toca en el mostrador. Para reordenar, cambiá estos números desde la
--  pantalla de artículos.
insert into public.articulos (nombre, categoria, precio_unitario, orden_visual)
select nombre, categoria, precio, orden
from (values
  -- ── Prendas ────────────────────────────────────────────────── precio ── orden
  ('Camisa',                    'Prendas',        0::numeric,  10),
  ('Remera',                    'Prendas',        0::numeric,  20),
  ('Pantalón',                  'Prendas',        0::numeric,  30),
  ('Buzo',                      'Prendas',        0::numeric,  40),
  ('Campera',                   'Prendas',        0::numeric,  50),
  ('Campera de abrigo',         'Prendas',        0::numeric,  60),
  ('Vestido',                   'Prendas',        0::numeric,  70),
  ('Pollera',                   'Prendas',        0::numeric,  80),
  ('Saco',                      'Prendas',        0::numeric,  90),
  ('Traje (2 piezas)',          'Prendas',        0::numeric, 100),

  -- ── Ropa de cama ──────────────────────────────────────────────────────────
  ('Acolchado 1 plaza',         'Ropa de cama',   0::numeric, 210),
  ('Acolchado 2 plazas',        'Ropa de cama',   0::numeric, 220),
  ('Acolchado king',            'Ropa de cama',   0::numeric, 230),
  ('Frazada 1 plaza',           'Ropa de cama',   0::numeric, 240),
  ('Frazada 2 plazas',          'Ropa de cama',   0::numeric, 250),
  ('Cubrecama',                 'Ropa de cama',   0::numeric, 260),
  ('Juego de sábanas 1 plaza',  'Ropa de cama',   0::numeric, 270),
  ('Juego de sábanas 2 plazas', 'Ropa de cama',   0::numeric, 280),
  ('Almohada',                  'Ropa de cama',   0::numeric, 290),
  ('Toalla',                    'Ropa de cama',   0::numeric, 300),
  ('Toallón',                   'Ropa de cama',   0::numeric, 310),

  -- ── Hogar ─────────────────────────────────────────────────────────────────
  ('Cortina (por m²)',          'Hogar',          0::numeric, 410),
  ('Cortina blackout (por m²)', 'Hogar',          0::numeric, 420),
  ('Alfombra (por m²)',         'Hogar',          0::numeric, 430),
  ('Funda de sillón',           'Hogar',          0::numeric, 440),
  ('Tapizado de silla',         'Hogar',          0::numeric, 450),

  -- ── Servicios ─────────────────────────────────────────────────────────────
  ('Lavado general (por kg)',   'Servicios',      0::numeric, 610),
  ('Planchado (por prenda)',    'Servicios',      0::numeric, 620),
  ('Secado (por kg)',           'Servicios',      0::numeric, 630),
  ('Retiro y entrega',          'Servicios',      0::numeric, 640)
) as t(nombre, categoria, precio, orden)
where not exists (
  select 1 from public.articulos a where a.nombre = t.nombre
);

-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
--  select categoria, count(*) filter (where precio_unitario = 0) as sin_precio,
--         count(*) as total
--  from articulos group by categoria order by 1;
