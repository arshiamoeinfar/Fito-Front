import { useEffect, useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import {
  MONTHS,
  faDigits,
  isoDate,
  jalaliParts,
  monthDays,
  parseMoment,
  shiftMonth,
} from "../../../../lib/jalali";

const MISSING = "ثبت نشده";
const WEEKDAY_LETTERS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const WEEKDAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const WEEK_LABELS = ["اول", "دوم", "سوم", "چهارم", "پنجم"];

/* ═════════════ منطق داده (بدون تغییر) ═════════════ */

function finite(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function faNumber(value) {
  const number = finite(value);
  if (number == null) return MISSING;
  const rounded = Math.round(number * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return faDigits(text);
}

function weightText(grams) {
  const value = finite(grams);
  if (value == null) return MISSING;
  return `${faNumber(value / 1000)} کیلوگرم`;
}

function repsText(min, max) {
  const left = finite(min);
  const right = finite(max);
  if (left == null && right == null) return MISSING;
  if (left != null && right != null && left !== right) return `${faNumber(left)}–${faNumber(right)}`;
  return faNumber(left ?? right);
}

function setsText(value) {
  return finite(value) == null ? MISSING : faNumber(value);
}

function fitoWeekday(date) {
  return (date.getDay() + 1) % 7;
}

function chosenAssignment(assignments, selectedId) {
  const list = Array.isArray(assignments) ? assignments : [];
  return list.find((row) => String(row?.id) === String(selectedId))
    ?? list.find((row) => row?.status === "active")
    ?? list[0]
    ?? null;
}

function loggedWeights(sessions) {
  const byDate = new Map();
  (Array.isArray(sessions) ? sessions : []).forEach((session) => {
    const key = String(session?.performed_on || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    const day = byDate.get(key) ?? new Map();
    (session?.sets ?? []).forEach((set) => {
      if (set?.is_completed === false) return;
      const id = finite(set?.exercise_id);
      const grams = finite(set?.weight_g);
      if (id == null || grams == null || grams <= 0) return;
      const name = set?.exercise?.name || "حرکت";
      const current = day.get(id) ?? { name, grams: 0 };
      current.grams = Math.max(current.grams, grams);
      current.name = name || current.name;
      day.set(id, current);
    });
    byDate.set(key, day);
  });
  return byDate;
}

function monthPeaks(sessions, year, month) {
  const peaks = new Map();
  (Array.isArray(sessions) ? sessions : []).forEach((session) => {
    const date = parseMoment(session?.performed_on);
    if (!date) return;
    const parts = jalaliParts(date);
    if (parts.year !== year || parts.month !== month) return;
    (session?.sets ?? []).forEach((set) => {
      if (set?.is_completed === false) return;
      const grams = finite(set?.weight_g);
      if (grams == null || grams <= 0) return;
      const name = set?.exercise?.name || "حرکت";
      peaks.set(name, Math.max(peaks.get(name) ?? 0, grams / 1000));
    });
  });
  return peaks;
}

function buildMonth(year, month, assignment, sessions) {
  const dates = monthDays(year, month);
  const logs = loggedWeights(sessions);
  const planDays = (assignment?.version?.days ?? []).filter((day) => Array.isArray(day?.exercises) && day.exercises.length > 0);
  const byWeekday = new Map();
  planDays.forEach((day) => {
    const weekday = finite(day?.weekday);
    if (weekday == null || weekday < 0 || weekday > 6) return;
    const list = byWeekday.get(weekday) ?? [];
    list.push(day);
    byWeekday.set(weekday, list);
  });

  const calendar = dates.map((date) => {
    const parts = jalaliParts(date);
    const iso = isoDate(date);
    const weekday = fitoWeekday(date);
    return {
      day: parts.day,
      date,
      iso,
      weekday,
      hasWorkout: (byWeekday.get(weekday) ?? []).length > 0 || logs.has(iso),
    };
  });

  const weeks = [];
  for (let start = 0; start < calendar.length; start += 7) {
    const slice = calendar.slice(start, start + 7);
    const cards = [];
    slice.forEach((item) => {
      const dayLogs = logs.get(item.iso);
      (byWeekday.get(item.weekday) ?? []).forEach((day, index) => {
        cards.push({
          id: `${item.iso}-${day?.id ?? index}`,
          day: item.day,
          weekday: WEEKDAY_NAMES[item.weekday] || MISSING,
          dateLabel: `${faDigits(item.day)} ${MONTHS[month - 1] || ""}`.trim(),
          title: day?.title || WEEKDAY_NAMES[item.weekday] || "تمرین",
          exercises: (day?.exercises ?? []).map((itemExercise, exerciseIndex) => {
            const id = finite(itemExercise?.exercise?.id);
            const prescribed = finite(itemExercise?.target_weight_g);
            const logged = id == null ? null : dayLogs?.get(id)?.grams;
            return {
              id: itemExercise?.id ?? `${item.iso}-${exerciseIndex}`,
              name: itemExercise?.exercise?.name || "حرکت",
              sets: setsText(itemExercise?.prescribed_sets),
              reps: repsText(itemExercise?.reps_min, itemExercise?.reps_max),
              weight: prescribed != null ? weightText(prescribed) : logged != null ? weightText(logged) : MISSING,
            };
          }),
        });
      });
    });
    weeks.push({
      label: `هفته ${WEEK_LABELS[weeks.length] || faDigits(weeks.length + 1)}`,
      firstDay: slice[0]?.day ?? 1,
      sessions: cards,
    });
  }

  const previous = shiftMonth(year, month, -1);
  const currentPeaks = monthPeaks(sessions, year, month);
  const previousPeaks = monthPeaks(sessions, previous.year, previous.month);
  const programNames = planDays.flatMap((day) => (day.exercises ?? []).map((item) => item?.exercise?.name).filter(Boolean));
  const names = [];
  [...programNames, ...currentPeaks.keys(), ...previousPeaks.keys()].forEach((name) => {
    if (!names.includes(name) && (currentPeaks.has(name) || previousPeaks.has(name))) names.push(name);
  });
  names.sort((left, right) => (currentPeaks.get(right) ?? 0) - (currentPeaks.get(left) ?? 0));
  const categories = names.slice(0, 6);

  return {
    monthLabel: `${MONTHS[month - 1] || ""} ${faDigits(year)}`.trim(),
    programLabel: MONTHS[month - 1] || MISSING,
    monthName: MONTHS[month - 1] || "",
    offset: calendar[0] ? fitoWeekday(calendar[0].date) : 0,
    days: calendar,
    weeks: weeks.length ? weeks : [{ label: "هفته اول", firstDay: 1, sessions: [] }],
    progress: {
      categories,
      thisMonth: categories.map((name) => currentPeaks.get(name) ?? null),
      lastMonth: categories.map((name) => previousPeaks.get(name) ?? null),
    },
  };
}

function chartCeiling(values) {
  const peak = Math.max(0, ...values.filter((value) => finite(value) != null));
  if (peak <= 0) return 0;
  const step = peak <= 20 ? 5 : peak <= 60 ? 10 : 20;
  return Math.ceil((peak * 1.15) / step) * step;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/* ═════════════ نمودار پیشرفت ═════════════ */

function Bar({ value, max, color }) {
  const amount = finite(value);
  const height = amount == null || max <= 0 ? 0 : `${(amount / max) * 100}%`;
  return (
    <div
      aria-hidden="true"
      className="w-2.5 rounded-t-md transition-[height] duration-500 sm:w-3"
      style={{ height, background: amount == null ? "transparent" : color }}
    />
  );
}

function Delta({ current, previous }) {
  const now = finite(current);
  const before = finite(previous);

  if (now == null) {
    return <span className="text-[11px] text-[#A0A4AA]">—</span>;
  }

  if (before == null) {
    return <span className="rounded-full bg-[#EAF4FF] px-2 py-0.5 text-[11px] font-medium text-[#007BFF]">جدید</span>;
  }

  const diff = Math.round((now - before) * 10) / 10;

  if (diff === 0) {
    return <span className="rounded-full bg-[#F1F4F9] px-2 py-0.5 text-[11px] text-[#6B6F77]">بدون تغییر</span>;
  }

  return (
    <span
      dir="ltr"
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${diff > 0 ? "bg-[#E9F9EF] text-[#1F9D4E]" : "bg-[#FDECEC] text-[#E5484D]"}`}
    >
      {diff > 0 ? "+" : "−"}{faNumber(Math.abs(diff))}
    </span>
  );
}

function ProgressChart({ progress }) {
  const categories = progress?.categories ?? [];
  const values = [...(progress?.thisMonth ?? []), ...(progress?.lastMonth ?? [])];
  const maxValue = chartCeiling(values);
  const ticks = maxValue > 0 ? [1, 0.75, 0.5, 0.25].map((ratio) => Math.round(maxValue * ratio)) : [];

  return (
    <section aria-labelledby="progress-title" className="rounded-3xl border border-[#E3E8F0] bg-white p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 id="progress-title" className="text-base font-semibold text-[#4F5965] sm:text-lg">روند پیشرفت وزنه‌ها</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#007BFF]" aria-hidden="true" />
            <span className="text-xs text-[#6B6F77]">این ماه</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#BFDBFF]" aria-hidden="true" />
            <span className="text-xs text-[#6B6F77]">ماه قبل</span>
          </div>
        </div>
      </div>

      {maxValue <= 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-3xl" aria-hidden="true">🏋️</span>
          <p className="text-sm text-[#6B6F77]">هنوز وزنه‌ای ثبت نشده</p>
          <p className="text-xs leading-6 text-[#A0A4AA]">بعد از ثبت اولین تمرین، روند پیشرفتت اینجا نشان داده می‌شود.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3" aria-hidden="true">
            <div className="relative h-36 flex-1 sm:h-40">
              <div className="absolute inset-0 flex flex-col justify-between pb-1">
                {ticks.map((tick) => <div key={tick} className="h-px bg-[#EEF2F8]" />)}
              </div>
              <div className="relative flex h-full items-end justify-between gap-2 sm:gap-3">
                {categories.map((name, index) => (
                  <div key={name} className="flex h-full flex-1 items-end justify-center gap-1">
                    <Bar value={progress.thisMonth[index]} max={maxValue} color="#007BFF" />
                    <Bar value={progress.lastMonth[index]} max={maxValue} color="#BFDBFF" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex h-36 flex-col justify-between pb-1 text-xs text-[#9AA3B2] sm:h-40">
              {ticks.map((tick) => <span key={tick}>{faDigits(tick)}</span>)}
            </div>
          </div>

          {/* نام هر حرکت و مقدار دقیق؛ نمودار به‌تنهایی نام حرکت‌ها را نشان نمی‌داد */}
          <ul className="mt-5 grid gap-2 border-t border-[#F0F2F5] pt-4">
            {categories.map((name, index) => (
              <li key={name} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-[#4F5965]">{name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-[#6B6F77]">
                    {finite(progress.thisMonth[index]) == null ? MISSING : `${faNumber(progress.thisMonth[index])} کیلو`}
                  </span>
                  <Delta current={progress.thisMonth[index]} previous={progress.lastMonth[index]} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* ═════════════ تقویم ═════════════ */

function WorkoutCalendarCard({ month, selectedDay, todayDay, canJumpToday, onSelectDay, onPrevMonth, onNextMonth, onToday }) {
  const cells = [...Array(month.offset).fill(null), ...month.days];

  return (
    <section aria-labelledby="calendar-title" className="rounded-3xl bg-[#F2F8FD] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 id="calendar-title" className="text-right text-lg font-primary text-[#4F5965] sm:text-xl">تقویم تمرینات</h3>
        {canJumpToday && (
          <button
            type="button"
            onClick={onToday}
            className="min-h-9 rounded-full bg-white px-4 text-xs font-medium text-[#007BFF] transition hover:bg-[#E8F1FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
          >
            برو به امروز
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-full bg-white px-2 py-1.5">
        <button type="button" onClick={onNextMonth} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#4F5965] transition hover:bg-[#F2F8FD] hover:text-[#007BFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]" aria-label="ماه بعد">
          <ChevronRightIcon fontSize="small" />
        </button>
        <span className="font-medium text-[#4F5965]" aria-live="polite">{month.monthLabel}</span>
        <button type="button" onClick={onPrevMonth} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#4F5965] transition hover:bg-[#F2F8FD] hover:text-[#007BFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]" aria-label="ماه قبل">
          <ChevronLeftIcon fontSize="small" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center" aria-hidden="true">
        {WEEKDAY_LETTERS.map((letter) => (
          <div key={letter} className="text-sm font-medium text-[#8A93A3]">{letter}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cells.map((item, index) => {
          if (!item) return <span key={`blank-${index}`} />;
          const selected = item.day === selectedDay;
          const isToday = item.day === todayDay;

          return (
            <button
              key={item.iso}
              type="button"
              onClick={() => onSelectDay(item.day)}
              aria-pressed={selected}
              aria-label={`${faDigits(item.day)} ${month.monthName}${isToday ? "، امروز" : ""}${item.hasWorkout ? "، تمرین دارد" : ""}`}
              className="group flex h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition ${
                  selected
                    ? "bg-[#007BFF] font-bold text-white"
                    : isToday
                      ? "font-bold text-[#007BFF] ring-1 ring-[#007BFF]"
                      : "text-[#4F5965] group-hover:bg-white"
                }`}
              >
                {faDigits(item.day)}
              </span>
              {item.hasWorkout ? <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-[#007BFF]" : "bg-[#7FB1FF]"}`} /> : <span className="h-1.5 w-1.5" />}
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-[#6B6F77]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#7FB1FF]" aria-hidden="true" />
        روزهایی که تمرین دارند
      </p>
    </section>
  );
}

/* ═════════════ کارت جلسه ═════════════ */

function WorkoutSessionCard({ session, highlighted }) {
  return (
    <article
      id={`session-${session.id}`}
      className={`overflow-hidden rounded-2xl bg-[#F2F8FD] transition ${highlighted ? "ring-2 ring-[#007BFF] ring-offset-2 ring-offset-white" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 sm:px-5 sm:py-3.5">
        <h4 className="min-w-0 break-words text-base font-primary text-[#4F5965]">{session.title}</h4>
        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-[#007BFF]">
          <CalendarTodayOutlinedIcon sx={{ fontSize: 15 }} />
          {session.weekday} - {session.dateLabel}
        </div>
      </div>

      <div className="overflow-hidden rounded-b-xl border-x border-b border-[#F0F2F5] bg-white">
        {session.exercises.length === 0 ? (
          <p className="px-5 py-4 text-sm text-[#A0A4AA]">{MISSING}</p>
        ) : (
          <>
            {/* موبایل: هر حرکت یک ردیف با چیپ‌های ست، تکرار و وزنه */}
            <ul className="sm:hidden">
              {session.exercises.map((exercise) => (
                <li key={exercise.id} className="border-b border-[#F5F7FA] px-4 py-3 last:border-0">
                  <p className="break-words text-sm font-medium text-[#4F5965]">{exercise.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-[#F5F7FB] px-3 py-1 text-[#4F5965]">
                      <span className="text-[#8A93A3]">ست </span>{exercise.sets}
                    </span>
                    <span className="rounded-full bg-[#F5F7FB] px-3 py-1 text-[#4F5965]">
                      <span className="text-[#8A93A3]">تکرار </span>{exercise.reps}
                    </span>
                    <span className="rounded-full bg-[#EAF4FF] px-3 py-1 text-[#0B63CE]">
                      <span className="text-[#6A9FDB]">وزنه </span>{exercise.weight}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* تبلت و دسکتاپ: جدول */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[minmax(0,1.8fr)_0.6fr_0.9fr_1.2fr] border-b border-[#F0F2F5] px-5 py-3 text-xs text-[#8A93A3]">
                <span className="text-right">حرکت</span>
                <span className="text-center">ست</span>
                <span className="text-center">تکرار</span>
                <span className="text-left">وزنه</span>
              </div>
              {session.exercises.map((exercise) => (
                <div key={exercise.id} className="grid grid-cols-[minmax(0,1.8fr)_0.6fr_0.9fr_1.2fr] items-center gap-2 border-b border-[#F5F7FA] px-5 py-3.5 text-sm text-[#4F5965] last:border-0">
                  <span className="break-words text-right font-medium">{exercise.name}</span>
                  <span className="text-center">{exercise.sets}</span>
                  <span className="text-center">{exercise.reps}</span>
                  <span className="text-left">{exercise.weight}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function WorkoutProgramCard({ month, weekIndex, selectedDay, onPrevWeek, onNextWeek }) {
  const week = month.weeks[weekIndex] ?? month.weeks[0];

  return (
    <section aria-labelledby="program-title" className="flex min-h-0 flex-col rounded-3xl border border-[#E3E8F0] bg-white p-4 sm:p-6">
      <div className="mb-5 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h3 id="program-title" className="text-lg font-primary text-[#4F5965] sm:text-xl">برنامه تمرینی ({month.programLabel})</h3>
        <div className="flex items-center gap-1 rounded-full bg-[#007BFF] px-1.5 py-1 text-white">
          <button type="button" onClick={onNextWeek} disabled={weekIndex >= month.weeks.length - 1} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="هفته بعد">
            <ChevronRightIcon fontSize="small" />
          </button>
          <span className="min-w-[4.5rem] whitespace-nowrap text-center text-sm font-medium" aria-live="polite">{week?.label || "هفته اول"}</span>
          <button type="button" onClick={onPrevWeek} disabled={weekIndex <= 0} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="هفته قبل">
            <ChevronLeftIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* اسکرول داخلی فقط روی دسکتاپ؛ روی موبایل اسکرول تودرتو آزاردهنده است */}
      <div className="program-scroll flex flex-col gap-4 p-1 sm:gap-5 lg:max-h-[620px] lg:overflow-y-auto lg:pr-2">
        {!week?.sessions?.length ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-3xl" aria-hidden="true">🛌</span>
            <p className="text-sm text-[#6B6F77]">برای این هفته تمرینی ثبت نشده.</p>
            <p className="text-xs text-[#A0A4AA]">می‌توانی هفته یا ماه دیگری را ببینی.</p>
          </div>
        ) : week.sessions.map((session) => (
          <WorkoutSessionCard key={session.id} session={session} highlighted={session.day === selectedDay} />
        ))}
      </div>
    </section>
  );
}

function LinkGlyph() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F1FF] text-[#007BFF] sm:h-14 sm:w-14">
      <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.5 5.43" />
        <path d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 0 0 7.07 7.07L13.5 18.57" />
      </svg>
    </span>
  );
}

function ModalSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6" role="status" aria-label="در حال خواندن تمرین‌ها">
      <div className="h-72 rounded-3xl bg-white lg:row-span-2 lg:h-[420px]" />
      <div className="order-first h-80 rounded-3xl bg-[#EAF1F8] lg:order-none" />
      <div className="h-48 rounded-3xl bg-white" />
    </div>
  );
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function WorkoutProgramModal({
  showModal,
  setShowModal,
  assignments = [],
  sessions = [],
  selectedId = "",
  loadError = "",
  ready = true,
}) {
  const today = jalaliParts(new Date());
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selectedDay, setSelectedDay] = useState(today.day);
  const [weekIndex, setWeekIndex] = useState(Math.floor((today.day - 1) / 7));
  const dialogRef = useRef(null);
  const bodyRef = useRef(null);
  const returnFocusRef = useRef(null);
  const pickedRef = useRef(false);

  const assignment = chosenAssignment(assignments, selectedId);
  const month = useMemo(
    () => buildMonth(cursor.year, cursor.month, assignment, sessions),
    [cursor.year, cursor.month, assignment, sessions],
  );
  const activeWeek = Math.min(weekIndex, Math.max(0, month.weeks.length - 1));
  const errorText = typeof loadError === "string" ? loadError.trim() : "";
  const inCurrentMonth = cursor.year === today.year && cursor.month === today.month;
  const todayDay = inCurrentMonth ? today.day : null;
  const canJumpToday = !inCurrentMonth || selectedDay !== today.day;

  useEffect(() => {
    if (!showModal) return;
    const current = jalaliParts(new Date());
    pickedRef.current = false;
    setCursor({ year: current.year, month: current.month });
    setSelectedDay(current.day);
    setWeekIndex(Math.floor((current.day - 1) / 7));
  }, [showModal]);

  // فوکوس: هنگام باز شدن روی دیالوگ، هنگام بسته شدن برگرد به دکمه‌ای که آن را باز کرده
  useEffect(() => {
    if (!showModal) return undefined;
    returnFocusRef.current = document.activeElement;
    const timer = setTimeout(() => dialogRef.current?.focus({ preventScroll: true }), 0);
    return () => {
      clearTimeout(timer);
      returnFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setShowModal(false);
        return;
      }

      // حلقه‌ی Tab داخل دیالوگ
      if (event.key === "Tab" && dialogRef.current) {
        const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && (active === first || active === dialogRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [showModal, setShowModal]);

  // وقتی کاربر روزی را از تقویم انتخاب کرد، به کارت همان روز اسکرول کن
  useEffect(() => {
    if (!showModal || !pickedRef.current) return;
    const target = month.weeks[activeWeek]?.sessions.find((session) => session.day === selectedDay);
    if (!target) return;
    const node = bodyRef.current?.querySelector(`[id="session-${target.id}"]`);
    node?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
  }, [showModal, selectedDay, activeWeek, month]);

  if (!showModal) return null;

  const changeMonth = (delta) => {
    const next = shiftMonth(cursor.year, cursor.month, delta);
    pickedRef.current = false;
    setCursor(next);
    setSelectedDay(1);
    setWeekIndex(0);
  };

  const selectDay = (day) => {
    pickedRef.current = true;
    setSelectedDay(day);
    setWeekIndex(Math.floor((day - 1) / 7));
  };

  const goToday = () => {
    const current = jalaliParts(new Date());
    pickedRef.current = true;
    setCursor({ year: current.year, month: current.month });
    setSelectedDay(current.day);
    setWeekIndex(Math.floor((current.day - 1) / 7));
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:px-4 sm:py-6"
      onClick={() => setShowModal(false)}
    >
      <style>{`
        .program-scroll { scrollbar-width: thin; scrollbar-color: #007bff #f3f6fa; }
        .program-scroll::-webkit-scrollbar { width: 8px; }
        .program-scroll::-webkit-scrollbar-thumb { background: #007bff; border-radius: 999px; }
        @media (prefers-reduced-motion: no-preference) {
          .sheet-in { animation: sheet-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1); }
          @keyframes sheet-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        }
      `}</style>

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-workouts-title"
        className="sheet-in flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[28px] bg-[#F8FAFE] outline-none sm:max-h-[92vh] sm:rounded-[40px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* دستگیره‌ی بصری شیت روی موبایل */}
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-[#D5DCE8]" />
        </div>

        {/* هدر ثابت */}
        <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-3 sm:gap-4 sm:px-10 sm:pb-6 sm:pt-10">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <LinkGlyph />
            <div className="min-w-0 text-right">
              <h2 id="all-workouts-title" className="text-lg font-bold text-[#4F5965] sm:text-2xl">تمامی تمرینات من</h2>
              <p className="mt-1 text-xs leading-6 text-[#6B6F77] sm:text-sm">برنامه تمرینیت رو که مربی برات تنظیم کرده اینجا میتونی ببینی</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[#007BFF] text-[#007BFF] transition hover:bg-[#E8F1FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2"
            aria-label="بستن"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* بدنه‌ی اسکرول‌شونده */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1 sm:px-10 sm:pb-10">
          {errorText ? (
            <p role="alert" className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-7 text-red-700">{errorText}</p>
          ) : null}

          {!ready ? <ModalSkeleton /> : null}

          {ready && !assignment ? (
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-sm text-[#6B6F77]">
              <span className="text-2xl" aria-hidden="true">📋</span>
              <p className="leading-7">هنوز برنامه‌ای برایت ثبت نشده. وقتی مربی‌ات برنامه را بدهد، اینجا می‌بینی.</p>
            </div>
          ) : null}

          {ready ? (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
              {/* روی موبایل: اول تقویم (برای انتخاب روز)، بعد برنامه، بعد نمودار */}
              <div className="order-2 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <WorkoutProgramCard
                  month={month}
                  weekIndex={activeWeek}
                  selectedDay={selectedDay}
                  onPrevWeek={() => setWeekIndex((index) => Math.max(0, index - 1))}
                  onNextWeek={() => setWeekIndex((index) => Math.min(month.weeks.length - 1, index + 1))}
                />
              </div>
              <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
                <WorkoutCalendarCard
                  month={month}
                  selectedDay={selectedDay}
                  todayDay={todayDay}
                  canJumpToday={canJumpToday}
                  onSelectDay={selectDay}
                  onPrevMonth={() => changeMonth(-1)}
                  onNextMonth={() => changeMonth(1)}
                  onToday={goToday}
                />
              </div>
              <div className="order-3 lg:order-none lg:col-start-2 lg:row-start-2">
                <ProgressChart progress={month.progress} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}