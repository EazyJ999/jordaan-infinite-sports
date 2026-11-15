export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** 082… or 2782… stored as 0XXXXXXXXX. */
export function normalMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

/** South African mobile: 082… or +27 82… */
export function validMobile(value: string) {
  const digits = normalMobile(value);
  return digits.startsWith("0") && digits.length === 10;
}

export function contactOk(email: string, phone: string) {
  return validEmail(email) || validMobile(phone);
}
