import type { CurrencyCode } from "./types";

const MINOR_DIGITS: Record<CurrencyCode, number> = {
  EUR: 2,
  GBP: 2,
  USD: 2,
  CHF: 2,
  JPY: 0,
  CZK: 2,
  PLN: 2,
  HUF: 2,
};

export function currencyMinorDigits(currency: CurrencyCode): number {
  return MINOR_DIGITS[currency];
}

export function parseMoneyToMinorUnits(value: string, currency: CurrencyCode): bigint | null {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;

  const digits = MINOR_DIGITS[currency];
  const pattern = digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`);
  if (!pattern.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(`${whole}${fraction.padEnd(digits, "0")}`);
}

export function formatMinorUnits(
  amountMinor: string | null,
  currency: CurrencyCode,
  locale = "pt-PT",
): string | null {
  if (amountMinor === null) return null;
  const digits = MINOR_DIGITS[currency];
  const minor = BigInt(amountMinor);
  const divisor = 10n ** BigInt(digits);
  const whole = minor / divisor;
  const fraction = minor % divisor;
  const decimal = digits === 0 ? whole.toString() : `${whole}.${fraction.toString().padStart(digits, "0")}`;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(decimal));
}

export function minorUnitsToInput(amountMinor: string | null, currency: CurrencyCode): string {
  if (amountMinor === null) return "";
  const digits = MINOR_DIGITS[currency];
  const padded = BigInt(amountMinor).toString().padStart(digits + 1, "0");
  if (digits === 0) return padded;
  return `${padded.slice(0, -digits)}.${padded.slice(-digits)}`;
}
