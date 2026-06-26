const CURRENCY = "৳";

export function money(amount: number): string {
  return `${CURRENCY}${amount.toFixed(2)}`;
}

export function balance(amount: number): string {
  if (amount > 0) return `+${CURRENCY}${amount.toFixed(2)}`;
  if (amount < 0) return `−${CURRENCY}${Math.abs(amount).toFixed(2)}`; // − (U+2212)
  return `${CURRENCY}0.00`;
}

export function balanceColor(amount: number): string {
  if (amount > 0) return "text-green-600";
  if (amount < 0) return "text-red-600";
  return "text-slate-500";
}
