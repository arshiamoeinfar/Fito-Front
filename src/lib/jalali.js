const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const monthCache = new Map();

function pad(value) {
  return String(value).padStart(2, "0");
}

function atNoon(year, monthIndex, day) {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

export function faDigits(value) {
  return String(value ?? "").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);
}

export function latinDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function jalaliParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function dateFromJalali(year, month, day) {
  let cursor = atNoon(year + 621, 2, 1);

  for (let index = 0; index < 400; index += 1) {
    const parts = jalaliParts(cursor);
    if (parts.year === year && parts.month === month && parts.day === day) {
      return cursor;
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 12, 0, 0, 0);
  }

  return null;
}

export function monthDays(year, month) {
  const key = `${year}-${month}`;
  if (monthCache.has(key)) {
    return monthCache.get(key);
  }

  const first = dateFromJalali(year, month, 1);
  const days = [];
  if (!first) {
    monthCache.set(key, days);
    return days;
  }

  let cursor = first;
  for (let index = 0; index < 31; index += 1) {
    const parts = jalaliParts(cursor);
    if (parts.year !== year || parts.month !== month) {
      break;
    }
    days.push(cursor);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 12, 0, 0, 0);
  }

  monthCache.set(key, days);
  return days;
}

export function shiftMonth(year, month, delta) {
  const index = month - 1 + delta;
  return {
    year: year + Math.floor(index / 12),
    month: ((index % 12) + 12) % 12 + 1,
  };
}

export function parseMoment(value) {
  const text = String(value || "");
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return atNoon(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  const localDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (localDateTime) {
    return new Date(
      Number(localDateTime[1]),
      Number(localDateTime[2]) - 1,
      Number(localDateTime[3]),
      Number(localDateTime[4]),
      Number(localDateTime[5]),
      0,
      0,
    );
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatJalaliNumeric(value) {
  const date = parseMoment(value);
  if (!date) {
    return "";
  }
  const parts = jalaliParts(date);
  return faDigits(`${parts.year}/${pad(parts.month)}/${pad(parts.day)}`);
}

export function parseJalaliText(text) {
  const match = latinDigits(text).trim().match(/^(\d{4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = dateFromJalali(year, month, day);
  if (!date) {
    return null;
  }
  const parts = jalaliParts(date);
  if (parts.year !== year || parts.month !== month || parts.day !== day) {
    return null;
  }
  const iso = isoDate(date);
  if (match[4] == null) {
    return iso;
  }
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (hour > 23 || minute > 59) {
    return null;
  }
  return `${iso}T${pad(hour)}:${pad(minute)}`;
}

export function todayDateValue() {
  return isoDate(new Date());
}

export function nowDateTimeValue() {
  const date = new Date();
  return `${isoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function showDate(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const date = parseMoment(value);
  if (!date) {
    return String(value);
  }
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export function showDay(value) {
  const date = parseMoment(value);
  if (!date) {
    return "";
  }
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(date);
}

export function showDateTime(value) {
  const date = parseMoment(value);
  if (!date) {
    return value ? String(value) : "—";
  }
  const day = showDate(value);
  const clock = String(value).match(/T(\d{2}):(\d{2})/);
  if (clock && !String(value).endsWith("Z")) {
    return `${day} ساعت ${faDigits(clock[1])}:${faDigits(clock[2])}`;
  }
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export { MONTHS, WEEKDAYS };
