interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpieza periódica cada 10 minutos para evitar fugas de memoria
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000).unref?.();
}

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

/**
 * Aplica límite de intentos (Rate Limiting) para prevenir fuerza bruta.
 *
 * @param key Identificador (ej: `login:ip` o `login:email`)
 * @param maxAttempts Máximo de intentos permitidos en la ventana
 * @param windowMs Duración de la ventana en milisegundos (ej: 15 min = 900_000)
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
): RateLimitStatus {
  void windowMs;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
    };
  }

  if (entry.attempts >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.attempts,
  };
}

/**
 * Registra un intento fallido.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
): RateLimitStatus {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, {
      attempts: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
    };
  }

  entry.attempts += 1;
  const allowed = entry.attempts < maxAttempts;
  const retryAfterSeconds = allowed ? undefined : Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

  return {
    allowed,
    remainingAttempts: Math.max(0, maxAttempts - entry.attempts),
    retryAfterSeconds,
  };
}

/**
 * Restablece los intentos tras un inicio de sesión o acción exitosa.
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
