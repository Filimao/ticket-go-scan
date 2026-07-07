export function formatCurrency(amount: number, currency = "MZN") {
  try {
    return new Intl.NumberFormat("pt-MZ", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString("pt-PT")} ${currency}`;
  }
}

export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export function formatEventTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatEventShortDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("pt-PT", { day: "2-digit" }),
    month: d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "").toUpperCase(),
  };
}