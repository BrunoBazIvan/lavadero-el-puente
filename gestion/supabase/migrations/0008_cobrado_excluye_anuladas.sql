-- =============================================================================
--  EL PUENTE — 0008: una orden anulada no cuenta en "Cobrado en el mes"
-- =============================================================================
--  La 0007 definió "cobrado" mirando solo si los pagos vigentes cubrían el
--  total, sin filtrar por `estado` de la orden — a propósito, para que anular
--  una orden ya cobrada no le bajara la plata a un mes ya cerrado si la plata
--  todavía estaba en la caja.
--
--  Decisión del negocio: no. Una orden anulada no cuenta en "Cobrado",
--  devuelta la plata o no. El razonamiento es simple — si se anuló es porque
--  la plata se va a devolver, o en el peor de los casos porque alguien del
--  mostrador se equivocó al cargarla y la corrigió anulando: ninguno de los
--  dos casos es una venta cerrada. Es la misma regla que ya regía para
--  "facturado" y "a cobrar" (ambas excluyen anuladas desde la 0004): ahora
--  las tres métricas de plata del mes comparten el mismo criterio — una orden
--  anulada no aporta a ninguna.
--
--  Esto SÍ puede mover retroactivamente el "cobrado" de un mes ya cerrado si
--  alguien anula hoy una orden que se había cobrado hace tiempo: es la
--  consecuencia aceptada de esta decisión, no un descuido.
-- =============================================================================

create or replace function public.analiticas_mes(
  p_mes              date default null,
  p_dias_sin_retirar int  default 7
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_tz       constant text := 'America/Montevideo';
  v_hoy      date;
  v_mes      date;
  v_ini      timestamptz;
  v_fin      timestamptz;
  v_ini_ant  timestamptz;
  v_dias     int;
  v_dias_ant int;
  v_json     jsonb;
begin
  if not public.is_admin() then
    raise exception 'Las analíticas las ve el administrador.';
  end if;

  v_hoy      := (now() at time zone v_tz)::date;
  v_mes      := date_trunc('month', coalesce(p_mes, v_hoy)::timestamp)::date;
  v_ini      := v_mes::timestamp at time zone v_tz;
  v_fin      := (v_mes + interval '1 month')::timestamp at time zone v_tz;
  v_ini_ant  := (v_mes - interval '1 month')::timestamp at time zone v_tz;
  v_dias     := extract(day from (v_mes + interval '1 month' - interval '1 day'))::int;
  v_dias_ant := extract(day from (v_mes - interval '1 day'))::int;

  with
  -- ── Grano "trabajo": órdenes ingresadas en el mes ──────────────────────
  ord as (
    select
      o.id, o.cliente_id, o.estado, o.servicio, o.envio, o.created_by,
      coalesce(o.monto, 0) - o.descuento                         as total,
      extract(day from (o.fecha_ingreso at time zone v_tz))::int as dia
    from public.ordenes o
    where o.fecha_ingreso >= v_ini
      and o.fecha_ingreso <  v_fin
  ),
  cobrado_de_ord as (
    select p.orden_id, sum(p.monto) as pagado
    from public.pagos p
    where p.anulado_el is null
      and exists (select 1 from ord where ord.id = p.orden_id)
    group by p.orden_id
  ),
  ord_tot as (
    select o.*,
           coalesce(c.pagado, 0)           as pagado,
           o.total - coalesce(c.pagado, 0) as saldo
    from ord o
    left join cobrado_de_ord c on c.orden_id = o.id
  ),
  ord_ant as (
    select extract(day from (o.fecha_ingreso at time zone v_tz))::int as dia
    from public.ordenes o
    where o.fecha_ingreso >= v_ini_ant
      and o.fecha_ingreso <  v_ini
  ),

  -- ── Grano "cobrado": órdenes NO ANULADAS y completamente pagadas, por
  --    fecha de cierre ──────────────────────────────────────────────────
  --
  -- Un pago por orden: cuánto suma lo vigente, cuándo fue el último (la
  -- fecha que "cierra" la orden), y con qué método/quién lo recibió ese
  -- último pago — el que la dejó en $0, así que es el que mejor representa
  -- "cómo se cobró". `array_agg(... order by fecha desc)[1]` es el truco para
  -- "el más reciente de cada grupo" sin una subconsulta aparte.
  --
  -- Recorre TODA la tabla `pagos`, no solo el rango del mes: una orden puede
  -- tener una seña de hace tres meses y cerrarse recién ahora, y para saber si
  -- ya está saldada hace falta sumar todos sus pagos, no solo los de este mes.
  -- Al volumen de este lavadero (cientos de pagos, no millones) es una pasada
  -- barata; si algún día pesa, se acota a `orden_id in (select orden_id from
  -- pagos where fecha >= v_ini_ant)`, que no cambia el resultado porque el
  -- pago que cierra una orden dentro de la ventana siempre tiene su propia
  -- fecha dentro de la ventana.
  pagos_por_orden as (
    select
      p.orden_id,
      sum(p.monto)                                                  as pagado,
      max(p.fecha)                                                  as ultimo_pago,
      (array_agg(p.metodo       order by p.fecha desc))[1]          as metodo_cierre,
      (array_agg(p.recibido_por order by p.fecha desc))[1]          as recibido_por_cierre
    from public.pagos p
    where p.anulado_el is null
    group by p.orden_id
  ),
  -- `estado <> 'anulado'`: una orden anulada no es una venta cerrada, haya o
  -- no plata vigente adentro. Si esa plata no se devolvió, sigue en la caja,
  -- pero "cobrado" mide ventas, no el arqueo — para el arqueo real está la
  -- tabla `pagos` directamente, con su propia fecha y sin este filtro.
  cobradas as (
    select
      o.id, o.ref, c.id as cliente_id, c.nombre as cliente_nombre,
      coalesce(o.monto, 0) - o.descuento                            as total,
      pp.ultimo_pago                                                as fecha_cobro,
      pp.metodo_cierre,
      pp.recibido_por_cierre,
      extract(day from (pp.ultimo_pago at time zone v_tz))::int     as dia
    from public.ordenes o
    join public.clientes c on c.id = o.cliente_id
    join pagos_por_orden pp on pp.orden_id = o.id
    where o.estado <> 'anulado'
      and coalesce(o.monto, 0) - o.descuento > 0
      and pp.pagado >= (coalesce(o.monto, 0) - o.descuento) - 0.005 -- misma tolerancia que guard_pago
  ),
  cobradas_mes as (
    select * from cobradas where fecha_cobro >= v_ini and fecha_cobro < v_fin
  ),
  cobradas_mes_ant as (
    select * from cobradas where fecha_cobro >= v_ini_ant and fecha_cobro < v_ini
  ),

  -- Lo devuelto en el mes. Concepto aparte de "cobrado": es la plata que
  -- salió de la caja, cuente o no la orden como cobrada hoy.
  pag_anulado as (
    select p.monto
    from public.pagos p
    where p.anulado_el >= v_ini and p.anulado_el < v_fin
  )

  select jsonb_build_object(
    'mes',               to_char(v_mes, 'YYYY-MM-DD'),
    'mes_anterior',      to_char((v_mes - interval '1 month')::date, 'YYYY-MM-DD'),
    'dias_mes',          v_dias,
    'dias_mes_anterior', v_dias_ant,
    'dia_de_hoy',        case when v_mes = date_trunc('month', v_hoy::timestamp)::date
                              then extract(day from v_hoy)::int end,

    'totales', jsonb_build_object(
      'cobrado',                (select coalesce(sum(total), 0) from cobradas_mes),
      'cobrado_mes_anterior',   (select coalesce(sum(total), 0) from cobradas_mes_ant),
      'cobros_devueltos',       (select coalesce(sum(monto), 0) from pag_anulado),
      'facturado',              (select coalesce(sum(total), 0) from ord_tot where estado <> 'anulado'),
      'a_cobrar',               (select coalesce(sum(saldo), 0) from ord_tot where estado <> 'anulado'),
      'ingresadas',             (select count(*) from ord),
      'anuladas',               (select count(*) from ord where estado = 'anulado'),
      'con_envio',              (select count(*) from ord where envio and estado <> 'anulado'),
      'entregadas',             (select count(*) from public.ordenes o
                                  where o.estado = 'entregado'
                                    and o.fecha_entrega_real >= v_ini
                                    and o.fecha_entrega_real <  v_fin)
    ),

    'por_estado', (
      select coalesce(jsonb_object_agg(e.estado::text, coalesce(n.c, 0)), '{}'::jsonb)
      from unnest(enum_range(null::estado_orden)) as e(estado)
      left join (select estado, count(*) as c from ord group by estado) n
             on n.estado = e.estado
    ),

    -- Serie por día: "cobrado"/"cobrado_anterior" salen de `cobradas` (día en
    -- que cada orden quedó saldada), no de pagos sueltos.
    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'dia',              d.dia,
               'cobrado',          coalesce(cm.cobrado, 0),
               'ordenes',          coalesce(oc.n, 0),
               'cobrado_anterior', coalesce(ca.cobrado, 0),
               'ordenes_anterior', coalesce(oa.n, 0)
             ) order by d.dia), '[]'::jsonb)
      from generate_series(1, greatest(v_dias, v_dias_ant)) as d(dia)
      left join (select dia, sum(total) as cobrado from cobradas_mes     group by dia) cm on cm.dia = d.dia
      left join (select dia, count(*)   as n       from ord              group by dia) oc on oc.dia = d.dia
      left join (select dia, sum(total) as cobrado from cobradas_mes_ant group by dia) ca on ca.dia = d.dia
      left join (select dia, count(*)   as n       from ord_ant          group by dia) oa on oa.dia = d.dia
    ),

    -- Método del pago que cerró cada orden cobrada este mes. Si una orden se
    -- pagó con seña por un método y saldo por otro, cuenta por el del saldo
    -- (el que la terminó de cerrar) — es una simplificación a propósito: el
    -- objetivo acá es "cómo se cerraron las ventas", no un arqueo de caja por
    -- movimiento, que es lo que mide `pagos` directamente si hiciera falta.
    'por_metodo', (
      select coalesce(jsonb_object_agg(m.metodo::text, jsonb_build_object(
               'cobrado',  coalesce(x.cobrado, 0),
               'cantidad', coalesce(x.n, 0))), '{}'::jsonb)
      from unnest(enum_range(null::metodo_pago)) as m(metodo)
      left join (select metodo_cierre as metodo, sum(total) as cobrado, count(*) as n
                 from cobradas_mes group by metodo_cierre) x on x.metodo = m.metodo
    ),

    'por_servicio', (
      select coalesce(jsonb_object_agg(s.servicio::text, jsonb_build_object(
               'ordenes',   coalesce(x.n, 0),
               'facturado', coalesce(x.facturado, 0))), '{}'::jsonb)
      from unnest(enum_range(null::servicio_orden)) as s(servicio)
      left join (select servicio, count(*) as n, sum(total) as facturado
                 from ord_tot where estado <> 'anulado' group by servicio) x
             on x.servicio = s.servicio
    ),

    'por_articulo', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'descripcion', t.descripcion,
               'cantidad',    t.cantidad,
               'ordenes',     t.ordenes
             ) order by t.cantidad desc, t.descripcion), '[]'::jsonb)
      from (
        select i.descripcion,
               sum(i.cantidad)::int            as cantidad,
               count(distinct i.orden_id)::int as ordenes
        from public.orden_items i
        join ord_tot o on o.id = i.orden_id and o.estado <> 'anulado'
        group by i.descripcion
      ) t
    ),

    'por_operador', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'nombre',    t.nombre,
               'ordenes',   t.ordenes,
               'facturado', t.facturado
             ) order by t.ordenes desc, t.nombre), '[]'::jsonb)
      from (
        select coalesce(pr.nombre, 'Sin usuario') as nombre,
               count(*)::int                      as ordenes,
               coalesce(sum(o.total), 0)          as facturado
        from ord_tot o
        left join public.profiles pr on pr.id = o.created_by
        where o.estado <> 'anulado'
        group by o.created_by, pr.nombre
      ) t
    ),

    -- Quién recibió el pago que cerró cada orden cobrada este mes.
    'cobrado_por', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'nombre',  t.nombre,
               'cobrado', t.cobrado,
               'cobros',  t.cobros
             ) order by t.cobrado desc, t.nombre), '[]'::jsonb)
      from (
        select coalesce(pr.nombre, 'Sin usuario') as nombre,
               sum(cm.total)                      as cobrado,
               count(*)::int                      as cobros
        from cobradas_mes cm
        left join public.profiles pr on pr.id = cm.recibido_por_cierre
        group by cm.recibido_por_cierre, pr.nombre
      ) t
    ),

    -- El desglose que arma el clic en "Cobrado en el mes": una fila por
    -- orden, no por pago. Más recientes primero.
    'cobradas_detalle', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'ref',          cm.ref,
               'cliente_id',   cm.cliente_id,
               'cliente_nombre', cm.cliente_nombre,
               'total',        cm.total,
               'fecha_cobro',  cm.fecha_cobro
             ) order by cm.fecha_cobro desc), '[]'::jsonb)
      from cobradas_mes cm
    ),

    'top_clientes', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'cliente_id', t.id,
               'nombre',     t.nombre,
               'facturado',  t.facturado,
               'ordenes',    t.ordenes
             ) order by t.facturado desc, t.nombre), '[]'::jsonb)
      from (
        select c.id, c.nombre,
               sum(o.total)  as facturado,
               count(*)::int as ordenes
        from ord_tot o
        join public.clientes c on c.id = o.cliente_id
        where o.estado <> 'anulado' and o.total > 0
        group by c.id, c.nombre
        order by sum(o.total) desc, c.nombre
        limit 5
      ) t
    ),

    'dias_promedio_entrega', (
      select round(avg(
               extract(epoch from (o.fecha_entrega_real - o.fecha_ingreso)) / 86400.0
             )::numeric, 2)
      from public.ordenes o
      where o.estado = 'entregado'
        and o.fecha_entrega_real >= v_ini
        and o.fecha_entrega_real <  v_fin
    ),

    'listas_sin_retirar', (
      select count(*)
      from public.ordenes o
      where o.estado = 'listo'
        and o.fecha_retiro_estimada < v_hoy - greatest(p_dias_sin_retirar, 0)
    )
  ) into v_json;

  return v_json;
end $$;
