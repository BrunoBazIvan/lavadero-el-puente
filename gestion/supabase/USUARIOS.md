# Dar de alta, cambiar y bajar usuarios

No hay pantalla para esto: la app no tiene registro público ni administración
de usuarios a propósito (`src/pages/Login.tsx`). Las cuentas se crean en el
**dashboard de Supabase**, y el perfil del sistema nace solo.

---

## Cómo funciona

Un usuario del sistema son **dos cosas**:

| Dónde | Qué es | Quién lo crea |
|---|---|---|
| `auth.users` (Supabase Auth) | El identificador y la contraseña | Vos, en el dashboard |
| `public.profiles` | El nombre que se ve arriba a la derecha, el rol y si está activo | El trigger `on_auth_user_created`, solo |

El trigger es `handle_new_user()` (`migrations/0001_init.sql:60`). Lee el
**User Metadata** del usuario nuevo:

- `nombre` → si no está, usa lo que va antes de la arroba
- `rol` → si no está, queda **`operador`**

Un usuario de Auth **sin** perfil activo no puede entrar: `AuthProvider` lo
saca con un cartel que lo explica. No queda dando vueltas por una app que le
tira error en cada pantalla.

### Usuario, no email

En el mostrador nadie tiene casilla de correo. Pero Supabase Auth necesita sí o
sí algo con formato de email para el login con contraseña. Así que la cuenta se
llama `mostrador` y **por debajo** viaja como:

```
mostrador@interno.lavaderoelpuente.com
```

Es un subdominio nuestro **sin MX**: no le llega correo a nadie, que es
justamente lo que queremos, y al ser propio no puede chocar con nadie. La app
le pega ese sufijo sola antes de hablar con Supabase (`src/lib/usuarios.ts`),
así que en la pantalla de entrada se escribe **`mostrador` y la contraseña**,
nada más.

Elegí usuarios **cortos, en minúscula y en una sola palabra**: se tipean de
pie y con apuro. `mostrador`, `noche`, `sofia`.

### Los admins van con email de verdad

Es la única regla de esto que no conviene negociar. Una cuenta interna **no
puede recuperar su contraseña sola** —no hay casilla adonde mandar el link—,
así que si todas fueran internas, quien administra queda como **único punto de
falla del sistema entero**: nadie más puede reponer nada, y si pierde su propia
contraseña la única salida es la `service_role`.

Con al menos dos admins entrando por email real, cualquiera de los dos
desatasca al otro desde el dashboard. Es la regla vieja de tener siempre dos
personas con llave.

Los dos formatos **conviven en el mismo campo** y no hay que elegir nada: si lo
que se escribe trae arroba, se manda tal cual; si no, se le pega el dominio
interno. Rocío escribe su email entero, el mostrador escribe `mostrador`.

---

## Alta

### 1. Crear el usuario en Auth

Dashboard de Supabase → **Authentication** → **Users** → **Add user** →
**Create new user**.

- **Email**: si la cuenta es de **admin**, su email de verdad. Si es de
  **mostrador**, el usuario con el dominio interno:
  `mostrador@interno.lavaderoelpuente.com`.
- **Password**: la que va a usar. Escribila en algún lado antes de guardar —
  después no se puede volver a leer, solo reemplazar.
- **Auto Confirm User**: **sí**, siempre. Para las cuentas internas es
  obligatorio: sin esto quedan esperando una confirmación por mail que nunca va
  a llegar, porque la casilla no existe.

Si el formulario te deja cargar **User Metadata**, poné ahí el nombre y el rol
y ya está:

```json
{ "nombre": "Rocío Fernández", "rol": "admin" }
```

Los roles son dos y se escriben así: `admin` u `operador`.

### 2. Si no viste el campo de metadata

Pasa: el formulario del dashboard cambió más de una vez. No importa — el perfil
ya se creó igual, con el nombre sacado del usuario y rol `operador`. Arreglalo
desde **SQL Editor**:

```sql
update public.profiles p
set    nombre = 'Rocío Fernández',
       rol    = 'admin'
from   auth.users u
where  u.id = p.id
  and  u.email = 'EL_EMAIL_CON_EL_QUE_LA_CREASTE';
```

El SQL Editor corre por encima de la RLS, así que esto funciona aunque la
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

Decile que entre a `www.lavaderoelpuente.com/gestion/`. Si es una cuenta
interna, escribe **el usuario solo** —`mostrador`, sin arroba y sin
`@interno.lavaderoelpuente.com`— y la contraseña. Si es de admin, su email
entero.

---

## Cambiar una contraseña

Sin casilla de correo detrás, **nadie puede recuperar su contraseña solo**: la
pantalla de entrada no tiene "Olvidé mi contraseña" porque ese mail no llegaría
a ningún lado. La repone un admin, y son dos minutos.

Si el dashboard te ofrece cambiarla desde la ficha del usuario, usá eso. Si no
—cambia seguido de lugar—, va por la **API de administración**, que es la
forma oficial. La `service_role` la sacás de Settings → API, y **no se pega en
ningún archivo del repo ni en el navegador**:

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

**La excepción:** una cuenta con email de verdad (la tuya) sí puede recuperar
sola. Desde el dashboard, en la ficha del usuario, **Send password recovery**;
el link cae en `/gestion/recuperar`, que sigue en pie justo para eso. Que al
menos un admin tenga email real es lo que evita quedarse afuera del sistema sin
salida.

---

## Cambiar el rol de alguien

```sql
update public.profiles set rol = 'admin'
where  id = (select id from auth.users where email = 'EL_EMAIL_DE_LA_CUENTA');
```

Se aplica cuando la persona vuelve a entrar: el rol se lee al abrir sesión.

---

## Dar de baja

**No borres el usuario.** Sus órdenes y sus cobros lo referencian
(`ordenes.created_by`, `pagos.recibido_por`), y el historial tiene que seguir
en pie. Se apaga el perfil:

```sql
update public.profiles set activo = false
where  id = (select id from auth.users where email = 'mostrador@interno.lavaderoelpuente.com');
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
