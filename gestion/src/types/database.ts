/**
 * Tipos del esquema de Supabase.
 *
 * Escritos a mano para que coincidan exactamente con
 * `supabase/migrations/0001_init.sql`. Cuando el proyecto de Supabase esté
 * creado, se pueden regenerar y reemplazar este archivo entero:
 *
 *     npx supabase gen types typescript --project-id <ID> > src/types/database.ts
 *
 * Si tocás la migración, tocá también este archivo (o regeneralo).
 */

export type EstadoOrden = 'recibido' | 'en_proceso' | 'listo' | 'entregado' | 'anulado';
export type MetodoPago = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'mercado_pago';
export type RolUsuario = 'admin' | 'operador';
export type TipoCliente = 'particular' | 'empresa';
export type EstadoPago = 'pendiente' | 'parcial' | 'pagado';
/** El retiro y entrega no es un servicio aparte: va en `ordenes.envio`. */
export type ServicioOrden = 'lavado_secado' | 'con_plancha' | 'solo_secado';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nombre: string;
          rol: RolUsuario;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          rol?: RolUsuario;
          activo?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      clientes: {
        Row: {
          id: string;
          nombre: string;
          telefono: string | null;
          email: string | null;
          tipo: TipoCliente;
          razon_social: string | null;
          rut: string | null;
          direccion: string | null;
          notas: string | null;
          activo: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          telefono?: string | null;
          email?: string | null;
          tipo?: TipoCliente;
          razon_social?: string | null;
          rut?: string | null;
          direccion?: string | null;
          notas?: string | null;
          activo?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>;
      };

      articulos: {
        Row: {
          id: string;
          nombre: string;
          categoria: string | null;
          precio_unitario: number;
          activo: boolean;
          orden_visual: number;
          /** false = se marca sin número (la ropa suelta no se cuenta). */
          lleva_cantidad: boolean;
        };
        Insert: {
          id?: string;
          nombre: string;
          categoria?: string | null;
          precio_unitario?: number;
          activo?: boolean;
          orden_visual?: number;
          lleva_cantidad?: boolean;
        };
        Update: Partial<Database['public']['Tables']['articulos']['Insert']>;
      };

      ordenes: {
        Row: {
          id: string;
          ref: string;
          cliente_id: string;
          estado: EstadoOrden;
          servicio: ServicioOrden;
          /** Retiro y entrega a domicilio. */
          envio: boolean;
          fecha_ingreso: string;
          fecha_retiro_estimada: string;
          fecha_entrega_real: string | null;
          /**
           * Lo que se cobra por la orden entera, cargado al marcarla lista.
           * Null mientras todavía no tiene precio. Los totales salen de acá,
           * no de los precios de los ítems (ver migración 0004).
           */
          monto: number | null;
          descuento: number;
          notas: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          /** No la mandes: la genera el trigger de la base (EP-00001). */
          ref?: string;
          cliente_id: string;
          estado?: EstadoOrden;
          servicio?: ServicioOrden;
          envio?: boolean;
          fecha_ingreso?: string;
          fecha_retiro_estimada: string;
          fecha_entrega_real?: string | null;
          monto?: number | null;
          descuento?: number;
          notas?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['ordenes']['Insert']>;
      };

      orden_items: {
        Row: {
          id: string;
          orden_id: string;
          articulo_id: string | null;
          descripcion: string;
          cantidad: number;
          precio_unitario: number;
          /** Columna generada por la base: cantidad × precio_unitario. */
          subtotal: number;
        };
        Insert: {
          id?: string;
          orden_id: string;
          articulo_id?: string | null;
          descripcion: string;
          cantidad: number;
          precio_unitario: number;
        };
        Update: Partial<Database['public']['Tables']['orden_items']['Insert']>;
      };

      pagos: {
        Row: {
          id: string;
          orden_id: string;
          monto: number;
          metodo: MetodoPago;
          fecha: string;
          recibido_por: string | null;
          notas: string | null;
          /**
           * Cobros anulables, no borrables (migración 0006): un pago nunca se
           * hace DELETE, se marca. Null = vigente, suma a todo. Estas tres
           * columnas no van en `Insert` — se escriben solo desde `anular_pago`,
           * `revertir_entrega` y `anular_orden`.
           */
          anulado_el: string | null;
          anulado_por: string | null;
          anulado_motivo: string | null;
        };
        Insert: {
          id?: string;
          orden_id: string;
          monto: number;
          metodo: MetodoPago;
          fecha?: string;
          recibido_por?: string | null;
          notas?: string | null;
        };
        Update: Partial<Database['public']['Tables']['pagos']['Insert']>;
      };

      configuracion: {
        Row: { clave: string; valor: string };
        Insert: { clave: string; valor: string };
        Update: Partial<{ clave: string; valor: string }>;
      };
    };

    Views: {
      v_ordenes: {
        Row: Database['public']['Tables']['ordenes']['Row'] & {
          cliente_nombre: string;
          cliente_telefono: string | null;
          cliente_tipo: TipoCliente;
          subtotal: number;
          cantidad_prendas: number;
          total: number;
          pagado: number;
          saldo: number;
          estado_pago: EstadoPago;
        };
      };
    };

    Functions: {
      crear_orden: {
        Args: { payload: CrearOrdenPayload };
        Returns: Database['public']['Tables']['ordenes']['Row'];
      };
      buscar: {
        Args: { termino: string; limite?: number };
        Returns: Database['public']['Views']['v_ordenes']['Row'][];
      };
      orden_totales: {
        Args: { p_orden_id: string };
        Returns: { subtotal: number; total: number; pagado: number; saldo: number }[];
      };
      /** Cobra (si hay algo que cobrar) y entrega, en una sola transacción. */
      entregar_orden: {
        Args: {
          p_orden_id: string;
          /** Solo si la orden todavía no tenía monto. */
          p_monto?: number | null;
          /** Cuánto se cobra en este momento. Null o 0 = no se cobró nada. */
          p_cobro?: number | null;
          p_metodo?: MetodoPago | null;
        };
        Returns: Database['public']['Tables']['ordenes']['Row'];
      };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };

      /**
       * El listado del mostrador (migración 0006): abiertas sin tope +
       * cerradas de los últimos `p_dias`, con tope. Reemplaza al
       * `select * from v_ordenes order by fecha_ingreso desc limit 100` que
       * dejaba caer una orden abierta vieja por debajo del corte.
       */
      ordenes_tablero: {
        Args: { p_dias?: number; p_limite?: number };
        Returns: Database['public']['Views']['v_ordenes']['Row'][];
      };
      /** La barra de pendientes del encabezado, en una sola pasada. */
      resumen_pendientes: {
        Args: { p_dias_sin_retirar?: number };
        Returns: ResumenPendientesRPC;
      };
      /** Todo el jsonb agregado de Analíticas, en un solo viaje. */
      analiticas_mes: {
        Args: { p_mes?: string | null; p_dias_sin_retirar?: number };
        Returns: AnaliticasMes;
      };
      /** Anula un cobro suelto sin tocar el estado de la orden. */
      anular_pago: {
        Args: { p_pago_id: string; p_motivo: string };
        Returns: Database['public']['Tables']['pagos']['Row'];
      };
      /** Entregado → listo, dejando motivo escrito y devolviendo la plata que corresponda. */
      revertir_entrega: {
        Args: { p_orden_id: string; p_pagos_devueltos?: string[]; p_motivo?: string | null };
        Returns: Database['public']['Tables']['ordenes']['Row'];
      };
      /** Anula la orden y, si corresponde, los cobros que se devolvieron. */
      anular_orden: {
        Args: { p_orden_id: string; p_motivo: string; p_pagos_devueltos?: string[] };
        Returns: Database['public']['Tables']['ordenes']['Row'];
      };
    };

    Enums: {
      estado_orden: EstadoOrden;
      metodo_pago: MetodoPago;
      rol_usuario: RolUsuario;
      tipo_cliente: TipoCliente;
      servicio_orden: ServicioOrden;
    };
  };
}

/** Payload de la RPC `crear_orden`. La orden y sus ítems entran atómicos. */
export interface CrearOrdenPayload {
  cliente_id: string;
  /** ISO `aaaa-mm-dd`. */
  fecha_retiro_estimada: string;
  servicio: ServicioOrden;
  envio: boolean;
  notas?: string | null;
  items: {
    articulo_id?: string | null;
    descripcion: string;
    cantidad: number;
  }[];
}

/** El orden es el de los botones al recibir: de lo más pedido a lo menos. */
export const NOMBRE_SERVICIO: Record<ServicioOrden, string> = {
  lavado_secado: 'Lavado y secado',
  con_plancha: 'Con plancha',
  solo_secado: 'Solo secado',
};

/** El orden es el de uso en el mostrador: el efectivo primero. */
export const NOMBRE_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
  mercado_pago: 'Mercado Pago',
};

export const METODOS_PAGO = Object.keys(NOMBRE_METODO_PAGO) as MetodoPago[];

// ── Alias cómodos para el resto de la app ───────────────────────────────────
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Cliente = Database['public']['Tables']['clientes']['Row'];
export type Articulo = Database['public']['Tables']['articulos']['Row'];
export type Orden = Database['public']['Tables']['ordenes']['Row'];
export type OrdenItem = Database['public']['Tables']['orden_items']['Row'];
export type Pago = Database['public']['Tables']['pagos']['Row'];
export type Configuracion = Database['public']['Tables']['configuracion']['Row'];
export type OrdenVista = Database['public']['Views']['v_ordenes']['Row'];

/** Una orden con todo lo que necesitan el detalle y los tickets. */
export interface OrdenCompleta extends OrdenVista {
  items: OrdenItem[];
  pagos: Pago[];
  cliente: Cliente;
}

/* ── Formas de los `jsonb` que devuelven las RPC de agregación (0006) ───────
 *
 * No las genera `supabase gen types` (son `jsonb`, no filas): se escriben a
 * mano acá, igual que el resto de este archivo, y tienen que coincidir con
 * lo que arma cada función en `0006_revertir_y_analiticas.sql`.
 */

/** Lo que devuelve `resumen_pendientes()`. Alimenta la barra fija del encabezado. */
export interface ResumenPendientesRPC {
  recibido: number;
  en_proceso: number;
  listo: number;
  /** Listas hace más de `p_dias_sin_retirar` días: nadie las vino a buscar. */
  olvidadas: number;
}

/** Un día de la serie comparada, mes en curso contra el anterior. */
export interface PuntoSerieAnalitica {
  dia: number;
  /** Suma de `pagos.monto` vigentes con `fecha` ese día. */
  cobrado: number;
  /** Cantidad de órdenes con `fecha_ingreso` ese día. */
  ordenes: number;
  cobrado_anterior: number;
  ordenes_anterior: number;
}

/** Todo lo que devuelve `analiticas_mes()`, en un solo jsonb. */
export interface AnaliticasMes {
  /** `aaaa-mm-dd`, primer día del mes pedido. */
  mes: string;
  mes_anterior: string;
  dias_mes: number;
  dias_mes_anterior: number;
  /**
   * Día de hoy, solo si `mes` es el mes en curso — si no, `null`. Sirve para
   * no comparar el acumulado completo del mes anterior contra un mes a medio
   * terminar: la curva del mes actual se corta acá, no al final.
   */
  dia_de_hoy: number | null;
  totales: {
    /**
     * Σ `total` de las órdenes NO ANULADAS que quedaron COMPLETAMENTE pagadas
     * este mes (`pagado >= total`), ubicadas por la fecha del pago que las
     * saldó — no por cuándo ingresaron (migración `0008`). Una orden anulada
     * no cuenta acá nunca, se haya devuelto la plata o no: no es una venta
     * cerrada. Ver `cobradas_detalle` para la lista.
     */
    cobrado: number;
    cobrado_mes_anterior: number;
    /** Σ de lo anulado de `pagos` con `anulado_el` en este mes. */
    cobros_devueltos: number;
    /** Σ `total` de las no anuladas, por `ordenes.fecha_ingreso`. Puede ser menor que `cobrado`: son preguntas distintas. */
    facturado: number;
    a_cobrar: number;
    ingresadas: number;
    anuladas: number;
    /** Cuántas de las ingresadas (no anuladas) llevaban retiro y entrega a domicilio. */
    con_envio: number;
    /** Entregadas EN el mes (por `fecha_entrega_real`), no las que ingresaron y hoy están entregadas. */
    entregadas: number;
  };
  /** Estado actual de las órdenes que ingresaron este mes. */
  por_estado: Record<EstadoOrden, number>;
  /** Un punto por cada día del mes más largo de los dos (actual y anterior). */
  serie: PuntoSerieAnalitica[];
  por_metodo: Record<MetodoPago, { cobrado: number; cantidad: number }>;
  por_servicio: Record<ServicioOrden, { ordenes: number; facturado: number }>;
  /** Por `orden_items.descripcion` (el nombre al momento de recibir), no por `articulo_id`. */
  por_articulo: { descripcion: string; cantidad: number; ordenes: number }[];
  /** Quién recibió el trabajo (`ordenes.created_by`). */
  por_operador: { nombre: string; ordenes: number; facturado: number }[];
  /** Quién recibió el pago que cerró cada orden cobrada este mes — no es lo mismo que quién recibió la orden. */
  cobrado_por: { nombre: string; cobrado: number; cobros: number }[];
  /** Top 5 por facturado. Las órdenes sin monto no entran. */
  top_clientes: { cliente_id: string; nombre: string; facturado: number; ordenes: number }[];
  /** El desglose de `totales.cobrado`: una fila por orden, más recientes primero. */
  cobradas_detalle: {
    ref: string;
    cliente_id: string;
    cliente_nombre: string;
    total: number;
    /** Fecha del pago que dejó la orden en saldo $0. */
    fecha_cobro: string;
  }[];
  /** Días de `fecha_ingreso` a `fecha_entrega_real`, medido sobre lo entregado en el mes. Null si no hubo entregas. */
  dias_promedio_entrega: number | null;
  /** NO es del mes pedido: es de ahora mismo, igual que la barra del encabezado. */
  listas_sin_retirar: number;
}
