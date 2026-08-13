# El Puente · Guía del mostrador

Imprimila y dejala al lado de la computadora.

**Dirección del sistema:** `lavadero-el-puente.vercel.app/gestion/`

Cada persona entra con **su propio usuario**. No se comparten: el sistema anota
quién recibió cada orden, y con un usuario prestado esa información no sirve
para nada.

---

## Recibir ropa

Es la pantalla que se abre al entrar. Se completa de arriba hacia abajo.

### 1 · Cliente

Escribí **nombre o teléfono**, con dos letras o números alcanza. Aparece la
lista abajo: te movés con las flechas ↑ ↓ y elegís con **Enter**.

**Si el cliente es nuevo**, escribí el nombre y apretá Enter: se abre el alta
ahí mismo, sin salir de la pantalla. Con nombre y teléfono alcanza.

> Antes de dar de alta, buscá bien. Dos fichas del mismo cliente hacen que
> después no aparezca el historial completo cuando lo necesites.

### 2 · Qué recibimos

- **Ropa** → se toca y queda marcada. No se cuenta prenda por prenda.
- **Acolchado 1 plaza** / **Acolchado 2 plazas** → llevan cantidad, con los
  botones `−` y `+`, o escribiendo el número.

### 3 · Servicio

Elegí uno: **Lavado y secado**, **Con plancha** o **Solo secado**.

Si además se retira y se entrega a domicilio, tocá **Envío**.

### 4 · Retiro estimado

Viene puesto para el día siguiente. Cambialo si el cliente pide otro día.

Si elegís un **domingo** te avisa, porque el lavadero está cerrado. Te deja
igual, por si es a propósito.

### 5 · Notas

Manchas, prendas delicadas, cualquier cosa que haya que tener en cuenta.
Lo que escribas acá **no sale impreso** en el comprobante del cliente.

### Guardar

**Guardar e imprimir comprobante**. El papel sale solo. Se lo das al cliente:
es lo que trae cuando viene a buscar la ropa.

---

## Cuando la ropa está pronta

Abrí la orden y cambiá el estado a **Lista para retirar**. Te va a pedir el
**monto**: cuánto sale esa orden, ya pesada. Sin monto no la deja marcar lista,
justamente porque es el único momento tranquilo para ponerle precio.

El botón de **WhatsApp** arma solo el mensaje avisándole al cliente que puede
venir, y le dice cuánto tiene que traer.

Si te equivocaste con el precio, en el panel **Cobro** tenés **Corregir el
monto**, mientras la orden no esté entregada.

---

## Cuando el cliente viene a retirar

1. Andá a **Órdenes**
2. Buscá por **la referencia del comprobante** (`EP-00001`), o por teléfono, o
   por nombre
3. Abrí la orden y cambiá el estado a **Entregada**
4. Te pregunta **si quedó pagada**:
   - **Sí, la cobré ahora** → elegí cómo pagó (efectivo, transferencia, débito,
     crédito, Mercado Pago) y listo
   - **No, queda debiendo** → la orden se entrega con saldo abierto. Esto lo
     puede hacer **solo un admin**: si sos operador, cobrá antes de entregar o
     avisale a Bruno

Si el cliente deja una **seña** antes de retirar, usá **Registrar un cobro** en
el panel Cobro. Podés cobrar una parte y el resto queda como saldo.

Los estados van así:

**Recibida** → **En proceso** → **Lista para retirar** → **Entregada**

Marcá **Lista para retirar** apenas la ropa esté pronta. Eso hace que aparezca
en el contador de arriba y que el cliente pueda venir tranquilo.

En la lista de **Órdenes** se ve el monto de cada una y, abajo del importe, lo
que quedó debiendo.

### Si perdió el comprobante

Buscala por teléfono o por nombre. Desde el detalle de la orden podés
**reimprimir** el comprobante.

---

## Órdenes que nadie viene a buscar

En **Órdenes**, arriba de todo, aparece un aviso amarillo cuando hay ropa lista
hace **más de 7 días**. Llamá o mandá un WhatsApp — desde el detalle de la
orden hay un botón que arma el mensaje solo.

---

## Si te equivocaste al recibir

Abrí la orden y tocá **Anular orden**. Te va a pedir dos cosas:

1. Escribir la referencia a mano (`EP-00001`), para que no se anule sin querer
2. Un motivo

El motivo queda guardado con tu nombre y la fecha. Escribí algo que se entienda
dentro de seis meses: *"cliente equivocado"* sirve, *"error"* no.

Una orden **ya entregada** solo la puede anular un admin. Avisale a Bruno.

---

## Cuando algo falla

### No hay internet

El sistema **no guarda nada** sin conexión, y te lo dice en pantalla:
*"No hay conexión con el servidor"*.

Es a propósito: prefiere avisarte antes que hacerte creer que guardó.

**Qué hacer:** anotá en papel el **nombre y teléfono del cliente**, **qué
trajo** y **para cuándo**. Cargalo en el sistema cuando vuelva internet, y
entregale al cliente un comprobante escrito a mano mientras tanto.

### No sale el papel

La orden **ya está guardada** — el sistema te lo dice. Entrá al detalle de la
orden y tocá reimprimir.

Si sigue sin salir, revisá que la impresora esté prendida y con papel. La orden
no se pierde por esto.

### No puedo entrar

- Fijate que el usuario y la contraseña sean los tuyos, no los de otro
- Si dice **"Tu usuario está dado de baja"**, hablá con Bruno
- Si te olvidaste la contraseña, tocá **Olvidé mi contraseña** en la pantalla
  de entrada y te llega un link por mail

### La pantalla dice "Falta configurar la app"

Eso no se arregla desde el mostrador. Avisale a Bruno.

---

## Para Bruno

**Si el lavadero cierra más de una semana** (licencia, vacaciones), el proyecto
de Supabase se pausa solo por falta de uso. Antes de volver a abrir, entrá a
[supabase.com/dashboard](https://supabase.com/dashboard) y despausalo. Tarda un
par de minutos y no se pierde nada.

**Los backups** corren solos todos los días a las 03:00 y quedan en el repo
privado `el-puente-backups`. Si alguna vez hay que recuperar algo, está todo
explicado en `gestion/supabase/RESTAURAR.md`.
