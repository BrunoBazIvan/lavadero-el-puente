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
    };

    Enums: {
      estado_orden: EstadoOrden;
      metodo_pago: MetodoPago;
      rol_usuario: RolUsuario;
      tipo_cliente: TipoCliente;
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
