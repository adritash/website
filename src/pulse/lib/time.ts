export const IST = "Asia/Kolkata";
const IST_OFFSET_MIN = 330; // India has no daylight saving time.

/** Calendar parts of an instant in IST. */
export function istParts(date: Date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MIN * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(), // 0 = Sunday
    minutesOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** YYYY-MM-DD of the IST calendar day. */
export function istDateKey(date: Date): string {
  const p = istParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Instant for an IST wall-clock time (minutes after midnight) on an IST date key. */
export function istInstant(dateKey: string, minutesOfDay: number): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, minutesOfDay - IST_OFFSET_MIN));
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekdayOfKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function fmt(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour12: true, ...options })
    .format(date)
    .replace(/\bam\b/i, "AM")
    .replace(/\bpm\b/i, "PM");
}

export function formatIstTime(date: Date): string {
  return `${fmt(date, { hour: "numeric", minute: "2-digit" })} IST`;
}

export function formatIstDateTime(date: Date): string {
  return `${fmt(date, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} IST`;
}
