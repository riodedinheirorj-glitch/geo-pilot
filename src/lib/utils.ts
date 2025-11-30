import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a phone number string to (XX) XXXXX-XXXX.
 * @param value The raw phone number string.
 * @returns The formatted phone number string.
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return "";
  value = value.replace(/\D/g, ""); // Remove tudo que não é dígito

  if (value.length > 11) {
    value = value.substring(0, 11); // Limita a 11 dígitos (DDD + 9 dígitos)
  }

  if (value.length > 10) {
    // (XX) XXXXX-XXXX
    return `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
  } else if (value.length > 6) {
    // (XX) XXXX-XXXX
    return `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6, 10)}`;
  } else if (value.length > 2) {
    // (XX) XXXX
    return `(${value.substring(0, 2)}) ${value.substring(2, 6)}`;
  } else if (value.length > 0) {
    // (XX
    return `(${value.substring(0, 2)}`;
  }
  return value;
}

/**
 * Formats a CPF string to 000.000.000-00.
 * @param value The raw CPF string.
 * @returns The formatted CPF string.
 */
export function formatCpf(value: string): string {
  if (!value) return "";
  value = value.replace(/\D/g, ""); // Remove tudo que não é dígito

  if (value.length > 11) {
    value = value.substring(0, 11); // Limita a 11 dígitos
  }

  if (value.length > 9) {
    return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
  } else if (value.length > 6) {
    return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}`;
  } else if (value.length > 3) {
    return `${value.substring(0, 3)}.${value.substring(3, 6)}`;
  } else if (value.length > 0) {
    return value.substring(0, 3);
  }
  return value;
}