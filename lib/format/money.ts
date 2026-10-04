const moneyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}
