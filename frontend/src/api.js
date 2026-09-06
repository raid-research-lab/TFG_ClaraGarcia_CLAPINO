/*
 * Base de la API de CLAPINO.
 *
 * En producción el frontend y el backend se sirven bajo el mismo
 * dominio, y las peticiones a la API cuelgan de /clapino/api.
 *
 * Se puede sobrescribir en tiempo de compilación con la variable
 * de entorno VITE_API_BASE.
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "/clapino/api";
