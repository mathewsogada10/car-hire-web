export function moneyInput(value: string): number {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value))
    throw new Error(
      "Enter a nonnegative KES amount with at most two decimal places.",
    );
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function displayMoney(minor: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(minor / 100);
}
