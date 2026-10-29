import {
  scrypt,
  randomBytes,
  createHash,
  timingSafeEqual,
  type BinaryLike,
  type ScryptOptions,
} from "node:crypto";

const SCRYPT_KEY_LEN = 64;
const SALT_BYTES = 32;
const SCRYPT_OPTIONS: ScryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

function scryptAsync(
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Hashea una contraseña usando scrypt con sal aleatoria de 32 bytes.
 * Formato retornado: `scrypt$saltHex$derivedKeyHex`
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Contraseña inválida para hashear");
  }
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scryptAsync(
    password.normalize("NFKC"),
    salt,
    SCRYPT_KEY_LEN,
    SCRYPT_OPTIONS,
  )) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

/**
 * Verifica una contraseña en texto plano contra el hash almacenado.
 * Usa `timingSafeEqual` para prevenir ataques de canal lateral (timing attacks).
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const saltHex = parts[1];
  const originalKeyHex = parts[2];
  if (!saltHex || !originalKeyHex) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, "hex");
    const originalKey = Buffer.from(originalKeyHex, "hex");
    if (salt.length !== SALT_BYTES || originalKey.length !== SCRYPT_KEY_LEN) {
      return false;
    }

    const candidateKey = (await scryptAsync(
      password.normalize("NFKC"),
      salt,
      SCRYPT_KEY_LEN,
      SCRYPT_OPTIONS,
    )) as Buffer;

    return timingSafeEqual(candidateKey, originalKey);
  } catch {
    return false;
  }
}

/**
 * Genera un token criptográfico seguro de alta entropía.
 * Para sesiones, verificación de email y recuperación de contraseña.
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Genera el hash SHA-256 de un token en hexadecimal.
 * En la base de datos NUNCA se almacena el token en bruto, solo este hash.
 */
export function hashSecureToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
