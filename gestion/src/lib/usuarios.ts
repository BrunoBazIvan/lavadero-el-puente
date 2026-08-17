/**
 * Usuarios sin email.
 *
 * En el mostrador nadie tiene casilla de correo, y hacer escribir una
 * dirección entera con alguien esperando enfrente es tiempo perdido y errores
 * de tipeo. Pero Supabase Auth necesita sí o sí un identificador con formato
 * de email para el login con contraseña. Así que la cuenta se llama `mostrador`
 * y por debajo viaja como `mostrador@interno.lavaderoelpuente.com`.
 *
 * Las dos cosas que decidieron ese dominio y conviene no deshacer:
 *
 * - **Es un subdominio nuestro, y no tiene MX.** Nada de correo va a llegar
 *   ahí, que es exactamente lo que queremos, y al ser propio no puede chocar
 *   con nadie. Un `.local` inventado también "funciona", pero ese TLD está
 *   reservado por RFC 6762 para descubrimiento de equipos en la red local —
 *   usarlo para otra cosa es pedir una confusión rara dentro de unos años.
 * - **Es válido para cualquier validador.** `.invalid` (RFC 2606) sería lo más
 *   correcto en el papel, pero hay validadores que lo rechazan de entrada, y
 *   descubrirlo el día que das de alta a alguien es el peor momento.
 *
 * La contracara está en `../../supabase/USUARIOS.md`: sin casilla real detrás,
 * una contraseña olvidada no se recupera sola, la repone un admin. Por eso al
 * menos un admin tiene que entrar con su email de verdad — si no, quien
 * administra queda como único punto de falla de todo el sistema.
 */

/** El subdominio de las cuentas internas. No tiene ni tiene que tener correo. */
export const DOMINIO_USUARIOS = 'interno.lavaderoelpuente.com';

/**
 * Lo que se escribe en la pantalla de entrada, convertido en lo que espera
 * Supabase.
 *
 * Si ya trae arroba se deja como está, y de eso dependen dos cosas: las cuentas
 * viejas creadas con el email de verdad de la persona —pegarles el dominio las
 * dejaría afuera del sistema— y las de admin, que van con email real a
 * propósito para conservar la recuperación por correo. Los dos formatos
 * conviven en el mismo campo sin que haya que elegir nada.
 */
export function emailDeUsuario(usuario: string): string {
  const limpio = usuario.trim().toLowerCase();
  return limpio.includes('@') ? limpio : `${limpio}@${DOMINIO_USUARIOS}`;
}
