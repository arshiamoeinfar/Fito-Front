import { useEffect, useMemo, useState } from "react";
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

function ProgressChart({ progress }) {
  const categories = progress?.categories ?? [];
  const values = [...(progress?.thisMonth ?? []), ...(progress?.lastMonth ?? [])];
  const maxValue = chartCeiling(values);
  const ticks = maxValue > 0 ? [1, 0.75, 0.5, 0.25].map((ratio) => Math.round(maxValue * ratio)) : [];

  return (
    <div className="rounded-3xl border border-[#A6A9AD] bg-white p-5 sm:p-7">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#6B6F77]">روند پیشرفت وزنه ها</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#007BFF]" />
            <span className="text-xs text-[#6B6F77]">این ماه</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#BFDBFF]" />
            <span className="text-xs text-[#6B6F77]">ماه قبل</span>
          </div>
        </div>
      </div>
      {maxValue <= 0 ? (
        <p className="py-10 text-center text-sm text-[#A0A4AA]">وزنه ثبت نشده</p>
      ) : (
        <div className="flex gap-3">
          <div className="relative h-40 flex-1">
            <div className="absolute inset-0 flex flex-col justify-between pb-5">
              {ticks.map((tick) => <div key={tick} className="h-px bg-[#EEF2F8]" />)}
            </div>
            <div className="relative flex h-full items-end justify-between gap-3 pb-5">
              {categories.map((name, index) => (
                <div key={name} className="flex h-full flex-1 items-end justify-center gap-1">
                  <Bar value={progress.thisMonth[index]} max={maxValue} color="#007BFF" label={`${name} — این ماه`} />
                  <Bar value={progress.lastMonth[index]} max={maxValue} color="#BFDBFF" label={`${name} — ماه قبل`} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-40 flex-col justify-between pb-5 text-xs text-[#C3C7CE]">
            {ticks.map((tick) => <span key={tick}>{tick}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({ value, max, color, label }) {
  const amount = finite(value);
  const height = amount == null || max <= 0 ? 0 : `${(amount / max) * 100}%`;
  return (
    <div
      className="w-2 rounded-t-md"
      style={{ height, background: amount == null ? "transparent" : color }}
      title={amount == null ? `${label}: ${MISSING}` : `${label}: ${faNumber(amount)} کیلوگرم`}
    />
  );
}

function WorkoutCalendarCard({ month, selectedDay, onSelectDay, onPrevMonth, onNextMonth }) {
  const cells = [...Array(month.offset).fill(null), ...month.days];
  return (
    <div className="rounded-3xl bg-[#F2F8FD] p-5 sm:p-7">
      <h3 className="mb-5 text-right text-xl font-primary text-[#6B6F77]">تقویم تمرینات</h3>
      <div className="mb-6 flex items-center justify-between rounded-full bg-white px-5 py-3">
        <button type="button" onClick={onNextMonth} className="cursor-pointer text-[#4F5965] transition hover:text-[#007BFF]" aria-label="ماه بعد">
          <ChevronRightIcon fontSize="small" />
        </button>
        <span className="font-medium text-[#4F5965]">{month.monthLabel}</span>
        <button type="button" onClick={onPrevMonth} className="cursor-pointer text-[#4F5965] transition hover:text-[#007BFF]" aria-label="ماه قبل">
          <ChevronLeftIcon fontSize="small" />
        </button>
      </div>
      <div className="mb-4 grid grid-cols-7 text-center">
        {WEEKDAY_LETTERS.map((letter) => (
          <div key={letter} className="text-sm font-medium text-[#8A93A3]">{letter}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-5 text-center">
        {cells.map((item, index) => {
          if (!item) return <span key={`blank-${index}`} />;
          const selected = item.day === selectedDay;
          return (
            <button key={item.iso} type="button" onClick={() => onSelectDay(item.day)} className="flex cursor-pointer flex-col items-center gap-1.5 outline-none">
              <span className={`text-lg transition ${selected ? "font-bold text-[#007BFF]" : "text-[#4F5965] hover:text-[#007BFF]"}`}>{item.day}</span>
              {item.hasWorkout ? <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-[#007BFF]" : "bg-[#7FB1FF]"}`} /> : <span className="h-1.5 w-1.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutSessionCard({ session }) {
  return (
    <div className="overflow-hidden rounded-t-2xl bg-[#F2F8FD]">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <p className="text-base font-primary text-[#6B6F77]">{session.title}</p>
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#007BFF]">
          <CalendarTodayOutlinedIcon sx={{ fontSize: 15 }} />
          {session.weekday} - {session.dateLabel}
        </div>
      </div>
      <div className="overflow-hidden rounded-b-xl border-x border-b border-[#F0F2F5] bg-white">
        <div className="grid grid-cols-4 border-b border-[#F0F2F5] px-5 py-3 text-xs text-[#8A93A3]">
          <span className="text-right">حرکت</span>
          <span className="text-center">ست</span>
          <span className="text-center">تکرار</span>
          <span className="text-left">وزنه</span>
        </div>
        {session.exercises.length === 0 ? (
          <p className="px-5 py-4 text-sm text-[#A0A4AA]">{MISSING}</p>
        ) : session.exercises.map((exercise) => (
          <div key={exercise.id} className="grid grid-cols-4 border-b border-[#F5F7FA] px-5 py-3.5 text-sm text-[#4F5965] last:border-0">
            <span className="truncate text-right font-medium">{exercise.name}</span>
            <span className="text-center">{exercise.sets}</span>
            <span className="text-center">{exercise.reps}</span>
            <span className="text-left">{exercise.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkoutProgramCard({ month, weekIndex, onPrevWeek, onNextWeek }) {
  const week = month.weeks[weekIndex] ?? month.weeks[0];
  return (
    <div className="flex min-h-0 flex-col rounded-3xl border border-[#A6A9AD] bg-white p-5 sm:p-7">
      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-primary text-[#6B6F77]">برنامه تمرینی ({month.programLabel})</h3>
        <div className="flex items-center gap-3 rounded-full bg-[#007BFF] px-5 py-2.5 text-white">
          <button type="button" onClick={onNextWeek} disabled={weekIndex >= month.weeks.length - 1} className="cursor-pointer transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40" aria-label="هفته بعد">
            <ChevronRightIcon fontSize="small" />
          </button>
          <span className="whitespace-nowrap text-sm font-medium">{week?.label || "هفته اول"}</span>
          <button type="button" onClick={onPrevWeek} disabled={weekIndex <= 0} className="cursor-pointer transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40" aria-label="هفته قبل">
            <ChevronLeftIcon fontSize="small" />
          </button>
        </div>
      </div>
      <div className="program-scroll flex max-h-[620px] flex-col gap-5 overflow-y-auto pr-1">
        {!week?.sessions?.length ? (
          <p className="py-10 text-center text-sm text-[#A0A4AA]">برای این هفته تمرینی ثبت نشده.</p>
        ) : week.sessions.map((session) => <WorkoutSessionCard key={session.id} session={session} />)}
      </div>
    </div>
  );
}

function LinkGlyph() {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E8F1FF] text-[#007BFF]">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.5 5.43" />
        <path d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 0 0 7.07 7.07L13.5 18.57" />
      </svg>
    </span>
  );
}

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

  const assignment = chosenAssignment(assignments, selectedId);
  const month = useMemo(
    () => buildMonth(cursor.year, cursor.month, assignment, sessions),
    [cursor.year, cursor.month, assignment, sessions],
  );
  const activeWeek = Math.min(weekIndex, Math.max(0, month.weeks.length - 1));
  const errorText = typeof loadError === "string" ? loadError.trim() : "";

  useEffect(() => {
    if (!showModal) return;
    const current = jalaliParts(new Date());
    setCursor({ year: current.year, month: current.month });
    setSelectedDay(current.day);
    setWeekIndex(Math.floor((current.day - 1) / 7));
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") setShowModal(false);
    };
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [showModal, setShowModal]);

  if (!showModal) return null;

  const changeMonth = (delta) => {
    const next = shiftMonth(cursor.year, cursor.month, delta);
    setCursor(next);
    setSelectedDay(1);
    setWeekIndex(0);
  };

  const selectDay = (day) => {
    setSelectedDay(day);
    setWeekIndex(Math.floor((day - 1) / 7));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6" onClick={() => setShowModal(false)}>
      <style>{`
        .program-scroll { scrollbar-width: thin; scrollbar-color: #007bff #f3f6fa; }
        .program-scroll::-webkit-scrollbar { width: 8px; }
        .program-scroll::-webkit-scrollbar-thumb { background: #007bff; border-radius: 999px; }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-workouts-title"
        className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[40px] bg-[#F8FAFE] p-5 sm:p-10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <LinkGlyph />
            <div className="min-w-0 text-right">
              <h2 id="all-workouts-title" className="text-2xl font-bold text-[#4F5965]">تمامی تمرینات من</h2>
              <p className="mt-1 text-sm text-[#A0A4AA]">برنامه تمرینیت رو که مربی برات تنظیم کرده اینجا میتونی ببینی</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowModal(false)} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[#007BFF] text-[#007BFF] transition hover:bg-[#E8F1FF]" aria-label="بستن">
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {errorText ? <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorText}</p> : null}
        {!ready ? <p className="py-16 text-center text-sm text-[#A0A4AA]">در حال خواندن تمرین‌ها...</p> : null}
        {ready && !assignment ? <p className="mb-5 text-sm text-[#A0A4AA]">برنامه‌ای ثبت نشده.</p> : null}

        {ready ? (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <WorkoutProgramCard
              month={month}
              weekIndex={activeWeek}
              onPrevWeek={() => setWeekIndex((index) => Math.max(0, index - 1))}
              onNextWeek={() => setWeekIndex((index) => Math.min(month.weeks.length - 1, index + 1))}
            />
            <div className="flex flex-col gap-6">
              <WorkoutCalendarCard
                month={month}
                selectedDay={selectedDay}
                onSelectDay={selectDay}
                onPrevMonth={() => changeMonth(-1)}
                onNextMonth={() => changeMonth(1)}
              />
              <ProgressChart progress={month.progress} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
