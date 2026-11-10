import { useEffect, useState } from "react";
import {
  MONTHS,
  WEEKDAYS,
  faDigits,
  formatJalaliNumeric,
  isoDate,
  jalaliParts,
  monthDays,
  parseJalaliText,
  parseMoment,
  shiftMonth,
} from "../../../lib/jalali";

export default function JalaliField({
  value,
  onChange,
  withTime = false,
  required = false,
  className = "",
}) {
  const selected = parseMoment(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => jalaliParts(selected || new Date()));
  const [box, setBox] = useState(null);
  const timeMatch = String(value || "").match(/T(\d{2}):(\d{2})/);
  const hour = timeMatch ? timeMatch[1] : "09";
  const minute = timeMatch ? timeMatch[2] : "00";
  const days = monthDays(view.year, view.month);
  const leading = days[0] ? (days[0].getDay() + 1) % 7 : 0;

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function close(event) {
      if (!event.target.closest?.("[data-jalali-field]")) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function choose(date) {
    const nextDate = isoDate(date);
    onChange(withTime ? `${nextDate}T${hour}:${minute}` : nextDate);
    if (!withTime) {
      setOpen(false);
    }
  }

  function changeTime(nextHour, nextMinute) {
    const base = selected ? isoDate(selected) : isoDate(new Date());
    onChange(`${base}T${nextHour}:${nextMinute}`);
  }

  const formatted = value
    ? `${formatJalaliNumeric(value)}${withTime ? ` ${faDigits(hour)}:${faDigits(minute)}` : ""}`
    : "";
  const [draft, setDraft] = useState(formatted);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(formatted);
    setInvalid(false);
  }, [formatted]);

  function commit() {
    if (!draft.trim()) {
      onChange("");
      setInvalid(false);
      return;
    }
    const parsed = parseJalaliText(draft);
    if (!parsed) {
      setInvalid(true);
      return;
    }
    onChange(withTime && !parsed.includes("T") ? `${parsed}T${hour}:${minute}` : parsed);
    setInvalid(false);
  }

  function openCalendar(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setView(jalaliParts(selected || new Date()));
    setBox({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    setOpen((current) => !current);
  }

  return (
    <div className="relative w-full" data-jalali-field>
      <div className="flex gap-2">
        <button type="button" className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-[#007BFF]" onClick={openCalendar}>تقویم</button>
        <input
          className={`min-w-0 flex-1 text-right ${className}`}
          value={draft}
          placeholder="۱۴۰۵/۰۷/۲۸"
          inputMode="numeric"
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
        />
      </div>
      {invalid ? <p className="mt-1 text-xs text-red-700">تاریخ را مثل ۱۴۰۵/۰۷/۲۸ بنویس.</p> : null}
      <input
        tabIndex={-1}
        aria-hidden="true"
        required={required}
        value={value || ""}
        onChange={() => {}}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
      {open && box ? (
        <div
          className="fixed z-50 w-80 rounded-3xl border border-slate-200 bg-white p-4 text-right shadow-xl"
          style={{ top: box.top, right: box.right }}
        >
          <div className="flex items-center justify-between gap-2">
            <button type="button" className="rounded-xl px-3 py-1 text-sm text-[#007BFF]" onClick={() => setView((current) => shiftMonth(current.year, current.month, 1))}>ماه بعد</button>
            <p className="text-sm text-[#1F2937]">{MONTHS[view.month - 1]} {faDigits(view.year)}</p>
            <button type="button" className="rounded-xl px-3 py-1 text-sm text-[#007BFF]" onClick={() => setView((current) => shiftMonth(current.year, current.month, -1))}>ماه قبل</button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-[#A0A4AA]">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: leading }, (_, index) => <span key={`empty-${index}`} />)}
            {days.map((date) => {
              const parts = jalaliParts(date);
              const active = selected && isoDate(selected) === isoDate(date);
              return (
                <button
                  key={isoDate(date)}
                  type="button"
                  onClick={() => choose(date)}
                  className={`rounded-xl py-2 text-sm ${active ? "bg-[#007BFF] text-white" : "text-[#1F2937] hover:bg-[#F5F7FB]"}`}
                >
                  {faDigits(parts.day)}
                </button>
              );
            })}
          </div>
          {withTime ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-xs text-[#6B6F77]">
                ساعت
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2" value={hour} onChange={(event) => changeTime(event.target.value, minute)}>
                  {Array.from({ length: 24 }, (_, index) => {
                    const text = padClock(index);
                    return <option key={text} value={text}>{faDigits(text)}</option>;
                  })}
                </select>
              </label>
              <label className="text-xs text-[#6B6F77]">
                دقیقه
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2" value={minute} onChange={(event) => changeTime(hour, event.target.value)}>
                  {Array.from({ length: 60 }, (_, index) => {
                    const text = padClock(index);
                    return <option key={text} value={text}>{faDigits(text)}</option>;
                  })}
                </select>
              </label>
            </div>
          ) : null}
          <button type="button" className="mt-3 text-xs text-[#6B6F77]" onClick={() => { onChange(""); setOpen(false); }}>پاک کردن</button>
        </div>
      ) : null}
    </div>
  );
}

function padClock(value) {
  return String(value).padStart(2, "0");
}
