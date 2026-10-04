import { format } from "date-fns";
import { th } from "date-fns/locale";

// All date math/display is pinned to Asia/Bangkok (requirement section 7:
// "timestamp ... แสดงผลโซน Asia/Bangkok"), independent of the server's own
// runtime timezone — dev machines here run +07:00, but Vercel's functions run
// UTC, so relying on local Date getters silently shifts days between the two.
const BANGKOK_TZ = "Asia/Bangkok";

// Buddhist Era (พ.ศ. = ค.ศ. + 543) is the default per requirement section 4;
// a ค.ศ./พ.ศ. toggle in settings is deferred to a later phase.
function toBuddhistYear(year: number): number {
  return year + 543;
}

function bangkokParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === "24" ? "00" : get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

// A Date whose LOCAL getters read back Bangkok's wall-clock numbers, no
// matter what timezone the current process is actually running in. Feed this
// into date-fns' format() (which only ever reads local getters) instead of
// the original instant.
function toBangkokWallClock(date: Date): Date {
  const p = bangkokParts(date);
  return new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`);
}

function parse(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

export function formatThaiDateShort(date: Date | string): string {
  const d = toBangkokWallClock(parse(date));
  const shortYear = String(toBuddhistYear(d.getFullYear())).slice(-2);
  return `${format(d, "d MMM", { locale: th })} ${shortYear}`;
}

export function formatThaiDateLong(date: Date | string): string {
  const d = toBangkokWallClock(parse(date));
  return `${format(d, "d MMMM", { locale: th })} ${toBuddhistYear(d.getFullYear())}`;
}

export function formatThaiTime(date: Date | string): string {
  const d = toBangkokWallClock(parse(date));
  return format(d, "HH:mm");
}

// yyyy-MM-dd for "today" as seen in Asia/Bangkok — used server-side for
// month/day boundary math so results don't depend on the host's own TZ.
export function todayISODateBangkok(): string {
  const p = bangkokParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

// Calendar-month bounds (first/last day) in Asia/Bangkok. `monthParam` is an
// optional "yyyy-MM" string (e.g. from a `?month=` query param); omit it for
// the current month.
export function bangkokMonthBounds(monthParam?: string): { from: string; to: string } {
  let year: number;
  let month: number; // 1-indexed
  if (monthParam) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  } else {
    const p = bangkokParts(new Date());
    year = Number(p.year);
    month = Number(p.month);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(daysInMonth)}`,
  };
}

// yyyy-MM-dd for "N days ago" as seen in Asia/Bangkok.
export function bangkokDateDaysAgo(n: number): string {
  const p = bangkokParts(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
  return `${p.year}-${p.month}-${p.day}`;
}

// Adjacent-month "yyyy-MM" keys for prev/next navigation, computed from a
// bounds.from value ("yyyy-MM-dd").
export function adjacentMonthKeys(from: string): { prevKey: string; nextKey: string } {
  const [year, month] = from.split("-").map(Number);
  const prev = new Date(Date.UTC(year, month - 2, 1));
  const next = new Date(Date.UTC(year, month, 1));
  const key = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return { prevKey: key(prev), nextKey: key(next) };
}

// This client-side default ("today"/"yesterday" when picking occurred_on) is
// intentionally the viewer's own local date, not Bangkok — a family member
// physically elsewhere should still get *their* today.
export function todayISODate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function yesterdayISODate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return format(d, "yyyy-MM-dd");
}
