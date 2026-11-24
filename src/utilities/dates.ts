const pad = (value: number, length = 2) => String(value).padStart(length, "0");

export function instantInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const minute = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  return (
    minute +
    (seconds || milliseconds
      ? `:${pad(seconds)}${milliseconds ? `.${pad(milliseconds, 3)}` : ""}`
      : "")
  );
}

export function parseInstant(value: string, original?: string): string {
  if (original && instantInput(original) === value) return original;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      value,
    );
  if (!parts) throw new Error("Enter a valid local date and time.");
  const [, y, m, d, h, min, s = "0", ms = "0"] = parts;
  const date = new Date(0);
  date.setFullYear(Number(y), Number(m) - 1, Number(d));
  date.setHours(Number(h), Number(min), Number(s), Number(ms.padEnd(3, "0")));
  const expected = [
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(h),
    Number(min),
    Number(s),
  ];
  const components = (n: Date) => [
    n.getFullYear(),
    n.getMonth(),
    n.getDate(),
    n.getHours(),
    n.getMinutes(),
    n.getSeconds(),
  ];
  if (!components(date).every((n, i) => n === expected[i]))
    throw new Error(
      "This local date/time is invalid or does not exist during a clock change.",
    );
  const laterOffset = new Date(
    date.valueOf() + 4 * 3600000,
  ).getTimezoneOffset();
  const later = new Date(
    date.valueOf() + (laterOffset - date.getTimezoneOffset()) * 60000,
  );
  if (
    later.valueOf() !== date.valueOf() &&
    components(later).every((n, i) => n === expected[i])
  )
    throw new Error(
      "This local time occurs twice during a clock change. Keep the existing time or choose an unambiguous time.",
    );
  return date.toISOString();
}

export const displayInstant = (value: unknown) =>
  instantInput(String(value ?? "")).replace("T", " ") || "Not recorded";
