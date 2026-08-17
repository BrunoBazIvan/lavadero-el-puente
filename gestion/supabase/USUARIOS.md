# Dar de alta, cambiar y bajar usuarios

No hay pantalla para esto: la app no tiene registro público ni administración
de usuarios a propósito (`src/pages/Login.tsx`). Las cuentas se crean en el
**dashboard de Supabase**, y el perfil del sistema nace solo.

---

## Cómo funciona

Un usuario del sistema son **dos cosas**:

| Dónde | Qué es | Quién lo crea |
|---|---|---|
| `auth.users` (Supabase Auth) | El email y la contraseña | Vos, en el dashboard |
| `public.profiles` | El nombre que se ve arriba a la derecha, el rol y si está activo | El trigger `on_auth_user_created`, solo |

El trigger es `handle_new_user()` (`migrations/0001_init.sql:60`). Lee el
**User Metadata** del usuario nuevo:

- `nombre` → si no está, usa lo que va antes de la arroba
- `rol` → si no está, queda **`operador`**

Un usuario de Auth **sin** perfil activo no puede entrar: `AuthProvider` lo
saca con un cartel que lo explica. No queda dando vueltas por una app que le
tira error en cada pantalla.

### Toda cuenta va con una casilla que alguien lee

Es la única regla de esto que no conviene negociar, y no es burocracia: una
cuenta sin correo detrás **no puede recuperar su contraseña sola**. Cada olvido
pasa a ser una intervención manual, con la `service_role` en la mano, y quien
administra queda como **único punto de falla del sistema entero**.

Con una casilla real, "Olvidé mi contraseña" resuelve el 100% de los casos sin
que nadie llame a nadie.

La cuenta del mostrador no tiene una persona fija, así que usa la casilla del
negocio (`lavaderoindustrialelpuente@gmail.com`). Es más largo de tipear que un
usuario suelto, pero el navegador de esa PC lo recuerda y la sesión queda
abierta durante el turno: se escribe entero muy pocas veces.

---

## Alta

### 1. Crear el usuario en Auth

Dashboard de Supabase → **Authentication** → **Users** → **Add user** →
**Create new user**.

- **Email**: el de la persona, o el del negocio si es una cuenta de puesto.
  Tiene que ser uno que alguien lea de verdad — es por donde llega el mail de
  recuperar contraseña.
- **Password**: una provisoria.
- **Auto Confirm User**: **sí**. Si no, no puede entrar hasta confirmar el mail.

Si el formulario te deja cargar **User Metadata**, poné ahí el nombre y el rol
y ya está:

```json
{ "nombre": "Rocío Fernández", "rol": "admin" }
```

Los roles son dos y se escriben así: `admin` u `operador`.

### 2. Si no viste el campo de metadata

Pasa: el formulario del dashboard cambió más de una vez. No importa — el perfil
ya se creó igual, con el nombre sacado del email y rol `operador`. Arreglalo
desde **SQL Editor**:

```sql
update public.profiles p
set    nombre = 'Rocío Fernández',
       rol    = 'admin'
from   auth.users u
where  u.id = p.id
  and  u.email = 'ACÁ_EL_EMAIL'
returning p.id, p.nombre, p.rol, p.activo;
```

El `returning` está para ver qué cambió: **cero filas quiere decir que el
usuario no existe o que el email tiene un tipeo distinto**, no que ya estaba
bien. El SQL Editor corre por encima de la RLS, así que esto funciona aunque la
política diga que solo un admin puede tocar perfiles ajenos.

### 3. Comprobar que quedó bien

```sql
select u.email, p.nombre, p.rol, p.activo, p.created_at
from   public.profiles p
join   auth.users u on u.id = p.id
order  by p.created_at;
```

Tienen que estar las dos columnas como esperás **antes** de darle la contraseña
a nadie. Un `rol` equivocado no se nota hasta que alguien no encuentra un
botón, o hasta que encuentra uno que no debería.

### 4. Entregarle la cuenta

Decile que entre a `www.lavaderoelpuente.com/gestion/` con el email y la
contraseña provisoria, y que enseguida use **¿Olvidaste tu contraseña?** para
ponerse una propia. Así la provisoria no queda anotada en ningún lado.

Para que ese link caiga en la app y no en la landing, `/gestion/recuperar`
tiene que estar en las **Redirect URLs** del panel de Auth. Se configura una
vez.

---

## Si alguien no puede entrar y el mail no le llega

Primero descartá lo aburrido: que el mail no haya caído en correo no deseado, y
que la casilla sea la que está cargada en Auth.

Si hay que forzarlo, va por la **API de administración**, que es la forma
oficial. La `service_role` la sacás de Settings → API, y **no se pega en ningún
archivo del repo ni en el navegador**:

```bash
SUPABASE_URL="https://TU_PROYECTO.supabase.co"
SERVICE_ROLE="…"                 # Settings → API. No la guardes.
USER_ID="…"                      # el id que ves en Authentication → Users

curl -X PUT "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SERVICE_ROLE" \
  -H "Authorization: Bearer $SERVICE_ROLE" \
  -H "Content-Type: application/json" \
  -d '{"password":"LA_NUEVA"}'
```

> Vas a encontrar por ahí la receta de hacerlo con un `update` sobre
> `auth.users` y `crypt()`. Funciona, pero le estás escribiendo a mano adentro
> de una tabla que administra Supabase: el día que cambien cómo guardan la
> contraseña, la cuenta queda inutilizable y sin aviso. Usalo solo si no te
> queda otra.

---

## Cambiar el rol de alguien

```sql
update public.profiles set rol = 'admin'
where  id = (select id from auth.users where email = 'ACÁ_EL_EMAIL');
```

Se aplica cuando la persona vuelve a entrar: el rol se lee al abrir sesión.

---

## Dar de baja

**No borres el usuario.** Sus órdenes y sus cobros lo referencian
(`ordenes.created_by`, `pagos.recibido_por`), y el historial tiene que seguir
en pie. Se apaga el perfil:

```sql
update public.profiles set activo = false
where  id = (select id from auth.users where email = 'ACÁ_EL_EMAIL');
```

La próxima vez que intente entrar, la app le cierra la sesión y le dice que
está dado de baja. La RLS lo bloquea igual del lado de la base: `is_staff()` le
da false, así que no lee ni escribe nada.

Para reactivarlo, lo mismo con `activo = true`.

---

## Qué cambia entre un rol y el otro

Un **operador** puede hacer todo el trabajo del mostrador: recibir ropa, buscar
y avanzar órdenes, cobrar y entregar.

Lo que es **solo de admin**:

- Las secciones **Clientes** y **Artículos** (`src/App.tsx`). El operador igual
  elige un cliente y marca artículos dentro de "Recibir ropa" — lo que no puede
  es navegar el padrón. Es partición de navegación, no de datos: la RLS le
  sigue dejando leer esas tablas porque las necesita para recibir.
- **Entregar una orden con saldo abierto** (`guard_orden_update`).
- **Anular una orden ya entregada** (`0001_init.sql:286`).
- **Corregir o borrar un pago** ya registrado.
- Crear, editar y dar de baja usuarios, clientes y artículos.
