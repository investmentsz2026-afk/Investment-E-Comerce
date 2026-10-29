/**
 * Variables de entorno exclusivas del servidor.
 * Se validan de forma diferida (al primer uso) para que el sitio público
 * pueda compilarse y funcionar aunque la base de datos aún no esté configurada.
 */
export interface ServerEnv {
  DATABASE_URL: string;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL no está definida. Copia .env.example a .env.local y agrega la cadena de conexión de Neon.",
    );
  }
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error("DATABASE_URL debe ser una cadena de conexión PostgreSQL válida (postgresql://...).");
  }

  cached = { DATABASE_URL: url };
  return cached;
}
