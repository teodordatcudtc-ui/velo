/**
 * Cerințe parolă: protecție la creare cont și la resetare/schimbare parolă.
 */

export const PASSWORD_MIN_LENGTH = 6;

export const PASSWORD_REQUIREMENTS = [
  `Minim ${PASSWORD_MIN_LENGTH} caractere`,
  "Cel puțin o literă mare (A-Z)",
  "Cel puțin o literă mică (a-z)",
  "Cel puțin o cifră (0-9)",
  "Cel puțin un caracter special (ex: ! @ # $ % & *)",
] as const;

export type PasswordValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Parola trebuie să aibă minim ${PASSWORD_MIN_LENGTH} caractere.`,
    };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, error: "Parola trebuie să conțină cel puțin o literă mare (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, error: "Parola trebuie să conțină cel puțin o literă mică (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: "Parola trebuie să conțină cel puțin o cifră (0-9)." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      ok: false,
      error: "Parola trebuie să conțină cel puțin un caracter special (ex: ! @ # $ % & *).",
    };
  }
  return { ok: true };
}
