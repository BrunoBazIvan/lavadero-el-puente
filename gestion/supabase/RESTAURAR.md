# Restaurar la base desde un backup

Los backups los hace solo `.github/workflows/backup.yml`, todos los días a las
03:00 (hora de Uruguay), y los guarda en el repo privado
**`BrunoBazIvan/el-puente-backups`**, en `dumps/AAAA-MM-DD/`.

Cada carpeta tiene tres archivos, y **el orden en que se aplican importa**:

| Archivo | Qué trae |
|---|---|
| `roles.sql` | Los roles de Postgres |
| `schema.sql` | Tablas, vistas, funciones, triggers y políticas de RLS |
| `data.sql` | Los datos: clientes, órdenes, artículos, configuración |

> Este documento está escrito para leerse el día que algo salió mal. Los
> comandos van completos y en orden, para no tener que pensar nada.

---

## Antes que nada: no restaures encima de la base viva

Si todavía hay datos en producción, restaurar arriba los pisa. Primero
averiguá qué se perdió realmente. Muchas veces conviene levantar el backup
**al lado**, en un Supabase local, sacar de ahí lo que falta y meterlo a mano
en producción.

Restaurar completo encima de producción es para cuando la base está perdida
del todo.

---

## Opción A — Levantar el backup en local para mirarlo

Es lo que hay que hacer en el 90% de los casos, y también la forma de
**probar que el backup sirve** sin tocar nada.

```bash
# 1. Traer los backups (la primera vez)
git clone https://github.com/BrunoBazIvan/el-puente-backups.git ~/el-puente-backups

# 2. Levantar un Supabase local y vaciarlo
cd "/home/brunobaz/Escritorio/lavadero el puente landing/gestion"
npx supabase start
npx supabase db reset          # deja la base limpia, con las migraciones puestas

# 3. Restaurar el backup del día que quieras
DIA=2026-08-01
DUMP=~/el-puente-backups/dumps/$DIA

psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file "$DUMP/roles.sql" \
  --file "$DUMP/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$DUMP/data.sql"
```

`session_replication_role = replica` apaga los triggers mientras entran los
datos. Sin eso, los triggers de la orden (`guard_orden_update` y compañía)
rechazan filas históricas que en su momento fueron perfectamente válidas.

**Comprobar que llegó todo:**

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
select 'clientes' t, count(*) from clientes
union all select 'ordenes', count(*) from ordenes
union all select 'orden_items', count(*) from orden_items
union all select 'articulos', count(*) from articulos;"
```

Para verlo por pantalla: Supabase Studio local en http://127.0.0.1:54323

Cuando terminaste, `npx supabase stop`.

---

## Opción B — Restaurar encima de producción

**Esto pisa todo lo que haya.** Solo si la base de producción está perdida.

```bash
DIA=2026-08-01
DUMP=~/el-puente-backups/dumps/$DIA

# La cadena de conexión sale de:
# Supabase → Project Settings → Database → Session pooler
DB_URL='postgresql://postgres.ojmbcxxyfuygtmzjyvhq:LA_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'

psql "$DB_URL" \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file "$DUMP/roles.sql" \
  --file "$DUMP/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$DUMP/data.sql"
```

`--single-transaction` junto con `ON_ERROR_STOP=1` hacen que, si algo falla a
mitad de camino, no quede nada aplicado: o entra todo o no entra nada. No
saques ninguno de los dos.

### Los usuarios no vuelven con esto

`data.sql` trae el esquema `public`, no `auth`. Después de restaurar, los
usuarios de login hay que recrearlos a mano en **Authentication → Users**, y
volver a marcar como admin al que corresponda:

```sql
update public.profiles set rol = 'admin' where id = 'EL_UUID_DEL_USUARIO';
```

Es a propósito: las tablas de `auth` son de Supabase y volcarlas trae más
problemas de los que resuelve. Para un lavadero con dos o tres usuarios,
recrearlos son cinco minutos.

---

## Si el backup del día falla

El workflow corta y falla si el dump sale vacío o le faltan tablas, así que
GitHub te manda un mail de "workflow failed". Cuando pase:

1. Fijate el log en la pestaña **Actions** del repo
2. Lo más probable es que haya cambiado la contraseña de la base o que el
   secret `SUPABASE_DB_URL` esté vencido
3. Corregí el secret y disparalo a mano con **Run workflow** — no esperes a
   mañana, ese día quedás sin respaldo nuevo

## Probá esto una vez por año

Un backup que nunca se restauró no es un backup. Hacé la Opción A de vez en
cuando, aunque no haya pasado nada. Son diez minutos y es la única forma de
saber que el día que lo necesites va a estar.
