export const DUBAI_TIMEZONE = "Asia/Dubai";
export const DUBAI_TIME_LABEL = "Dubai Time";

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

const dubaiTimeFormatter = new Intl.DateTimeFormat("en-AE", {
  timeZone: DUBAI_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dubaiDateTimeFormatter = new Intl.DateTimeFormat("en-AE", {
  timeZone: DUBAI_TIMEZONE,
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function formatDubaiTime(date: Date | string | number): string {
  const parsed = toDate(date);
  if (!isValidDate(parsed)) return "—";
  return dubaiTimeFormatter.format(parsed);
}

export function formatDubaiDateTime(date: Date | string | number): string {
  const parsed = toDate(date);
  if (!isValidDate(parsed)) return "—";
  return dubaiDateTimeFormatter.format(parsed);
}

export function formatDubaiRelativeTime(date: Date | string | number): string {
  const parsed = toDate(date);
  if (!isValidDate(parsed)) return "—";
  const target = parsed.getTime();
  const diffSec = Math.round((target - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en-AE", { numeric: "auto" });
  const abs = Math.abs(diffSec);

  if (abs < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  return rtf.format(Math.round(diffHr / 24), "day");
}
