/**
 * UserData:
 * -----------
 * Esta interfaz define la estructura básica de los datos de usuario que se utilizan en la aplicación.
 * Incluye el primer nombre, el apellido y la URL de la imagen de perfil del usuario.
 *
 * Nota:
 * - La propiedad 'profileImage' puede ser 'null' en caso de que el usuario no tenga una imagen de perfil asignada.
 */
export interface UserData {
  /** Primer nombre del usuario */
  firstName: string;
  /** Apellido del usuario */
  lastName: string;
  /** URL de la imagen de perfil del usuario, o null si no está disponible */
  profileImage: string | null;
}
