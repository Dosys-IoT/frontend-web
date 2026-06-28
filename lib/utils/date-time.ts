const LIMA_TIME_ZONE = "America/Lima";

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: LIMA_TIME_ZONE,
    ...options,
  });
}

export function toLimaDate(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatter({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2");
}

export function getLimaMonthKey(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = formatter({
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return year && month ? `${year}-${month}` : "";
}

export function getLimaDateKey(value: string | Date): string {
  return toLimaDate(value);
}

export function getLimaDayKey(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatter({ weekday: "short" })
    .format(date)
    .slice(0, 3)
    .toUpperCase();
}

export function formatLimaDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatter({
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatRelativeLastSeen(value: string | Date | null | undefined, now: Date = new Date()): string {
  if (!value) return "No signal yet";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatLimaTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatter({
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatLimaDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatter({
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function getLimaWeekdayLabel(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatter({ weekday: "short" }).format(date);
}

export function getPreviousLimaMonthKey(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = formatter({
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");
  if (!year || !month) return "";
  const previous = new Date(Date.UTC(year, month - 2, 1));
  return getLimaMonthKey(previous);
}

export function getLimaRangeKey(value: string | Date): string {
  return getLimaDateKey(value);
}
