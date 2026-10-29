/**
 * Validadores y normalizadores para autenticación y formularios de INVESTMENTS.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Normaliza un correo electrónico: quita espacios y convierte a minúsculas.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Valida formato de correo electrónico.
 */
export function validateEmail(email: string): ValidationResult {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { valid: false, error: "El correo electrónico es obligatorio" };
  }
  if (normalized.length > 255) {
    return { valid: false, error: "El correo electrónico no puede superar los 255 caracteres" };
  }
  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, error: "Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)" };
  }
  return { valid: true };
}

/**
 * Valida robustez de contraseña:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { valid: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }
  if (password.length > 128) {
    return { valid: false, error: "La contraseña no puede exceder los 128 caracteres" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "La contraseña debe incluir al menos una letra mayúscula" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "La contraseña debe incluir al menos una letra minúscula" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "La contraseña debe incluir al menos un número" };
  }
  return { valid: true };
}

/**
 * Valida nombres o apellidos:
 * - No vacío
 * - Máximo 120 caracteres
 * - Caracteres alfabéticos y signos de puntuación válidos (espacios, tildes, guiones)
 */
export function validateName(name: string, fieldName = "nombre"): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: `El campo ${fieldName} es obligatorio` };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: `El campo ${fieldName} debe tener al menos 2 caracteres` };
  }
  if (trimmed.length > 120) {
    return { valid: false, error: `El campo ${fieldName} no puede exceder los 120 caracteres` };
  }
  if (/[<>{}[\]\\/]/.test(trimmed)) {
    return { valid: false, error: `El campo ${fieldName} contiene caracteres no permitidos` };
  }
  return { valid: true };
}

/**
 * Valida teléfono de contacto en Perú:
 * - Opcional o 9 dígitos (celular) o formato con prefijo (ej: +51 987654321, 01 4455667)
 */
export function validatePhone(phone: string, required = false): ValidationResult {
  const trimmed = phone.trim();
  if (!trimmed) {
    if (required) return { valid: false, error: "El teléfono de contacto es obligatorio" };
    return { valid: true };
  }
  const digitsOnly = trimmed.replace(/\D/g, "");
  // Celular en Perú: 9 dígitos iniciando con 9, o con prefijo 51 (11 dígitos)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { valid: false, error: "Ingresa un número telefónico válido (ej: 987 654 321)" };
  }
  return { valid: true };
}

/**
 * Valida formato de RUC en Perú:
 * - Exactamente 11 dígitos numéricos
 * - Prefijos válidos: 10 (persona natural con negocio), 20 (persona jurídica), 15, 17
 * Nota: Valida formato, longitud y prefijo formal sin pretender certificar ante SUNAT
 * (cumpliendo con la directiva de no afirmar verificación SUNAT sin integración oficial).
 */
export function validateRucFormat(ruc: string): ValidationResult {
  const trimmed = ruc.trim();
  if (!trimmed) {
    return { valid: false, error: "El RUC de la empresa es obligatorio" };
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length !== 11) {
    return { valid: false, error: "El RUC debe tener exactamente 11 dígitos numéricos" };
  }
  const prefix = digits.slice(0, 2);
  if (!["10", "20", "15", "17"].includes(prefix)) {
    return {
      valid: false,
      error: "El RUC debe iniciar con 10 (persona con negocio) o 20 (empresa/persona jurídica)",
    };
  }
  return { valid: true };
}
