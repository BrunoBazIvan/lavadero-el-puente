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
        };
        Insert: {
          id?: string;
          nombre: string;
          categoria?: string | null;
          precio_unitario: number;
          activo?: boolean;
          orden_visual?: number;
        };
        Update: Partial<Database['public']['Tables']['articulos']['Insert']>;
      };

      ordenes: {
        Row: {
          id: string;
          ref: string;
          cliente_id: string;
          estado: EstadoOrden;
          fecha_ingreso: string;
          fecha_retiro_estimada: string;
          fecha_entrega_real: string | null;
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
          fecha_ingreso?: string;
          fecha_retiro_estimada: string;
          fecha_entrega_real?: string | null;
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
  descuento?: number;
  notas?: string | null;
  items: {
    articulo_id?: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}

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
