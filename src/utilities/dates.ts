export function instantInput(value: string): string {
  const n = new Date(value);
  if (Number.isNaN(n.valueOf())) return "";
  return new Date(n.valueOf() + 3 * 3600000).toISOString().slice(0, 16);
}
export function parseInstant(value: string): string {
  const n = new Date(`${value}:00+03:00`);
  if (Number.isNaN(n.valueOf()))
    throw new Error("Invalid Nairobi date and time");
  return n.toISOString();
}
