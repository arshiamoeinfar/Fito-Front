
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  StickyNote,
  X,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   داده‌ای که مودال انتظار دارد (prop: sessions)

   [
     {
       id: 1,
       date: "2026-11-05",
       title: "روز سینه و پشت‌بازو",
       completed: true,
       exercises: [
         { name, sets, reps, weight, rest, note }
       ],
     },
   ]
   ════════════════════════════════════════════════════════════════ */

/* ───────────────────────── تقویم جلالی ───────────────────────── */

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
  1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;

function jalCal(jy, withoutLeap) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;

    if (jy < jm) break;

    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);

  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG =
    div(gy, 4) -
    div((div(gy, 100) + 1) * 3, 4) -
    150;

  const march = 20 + leapJ - leapG;

  if (withoutLeap) return { gy, march };

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }

  let leap = mod(mod(n + 1, 33) - 1, 4);

  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function g2d(gy, gm, gd) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;

  d =
    d -
    div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) +
    752;

  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;

  j +=
    div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 -
    3908;

  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);

  return { gy, gm, gd };
}

function j2d(jy, jm, jd) {
  const r = jalCal(jy, true);

  return (
    g2d(r.gy, 3, r.march) +
    (jm - 1) * 31 -
    div(jm, 7) * (jm - 7) +
    jd -
    1
  );
}

function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy, false);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return {
        jy,
        jm: 1 + div(k, 31),
        jd: mod(k, 31) + 1,
      };
    }

    k -= 186;
  } else {
    jy -= 1;
    k += 179;

    if (r.leap === 1) k += 1;
  }

  return {
    jy,
    jm: 7 + div(k, 30),
    jd: mod(k, 30) + 1,
  };
}

const toJalaali = (gy, gm, gd) => d2j(g2d(gy, gm, gd));
const toGregorian = (jy, jm, jd) => d2g(j2d(jy, jm, jd));
const isLeapJalali = (jy) => jalCal(jy, false).leap === 0;

function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalali(jy) ? 30 : 29;
}

/* ───────────────────────── ابزارهای تاریخ و متن ───────────────────────── */

const MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

const WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const MIN_YEAR = 1300;
const MAX_YEAR = 1600;

const pad = (n) => String(n).padStart(2, "0");

const toFa = (n) =>
  Number(n || 0).toLocaleString("fa-IR", {
    useGrouping: false,
  });

const faDigits = (value) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);

const show = (value) =>
  value === undefined || value === null || value === ""
    ? "—"
    : faDigits(value);

const toIso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function parseIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function todayIso() {
  const now = new Date();

  return toIso(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
}

function isoToJ(iso) {
  const { y, m, d } = parseIso(iso);
  return toJalaali(y, m, d);
}

function jToIso(jy, jm, jd) {
  const g = toGregorian(jy, jm, jd);
  return toIso(g.gy, g.gm, g.gd);
}

function weekdayIndex(iso) {
  const { y, m, d } = parseIso(iso);
  return (new Date(y, m - 1, d).getDay() + 1) % 7;
}

function addDays(iso, amount) {
  const { y, m, d } = parseIso(iso);
  const date = new Date(Date.UTC(y, m - 1, d + amount));

  return toIso(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function diffDays(a, b) {
  const pa = parseIso(a);
  const pb = parseIso(b);

  return Math.round(
    (
      Date.UTC(pa.y, pa.m - 1, pa.d) -
      Date.UTC(pb.y, pb.m - 1, pb.d)
    ) / 86400000,
  );
}

function shiftMonth(iso, delta) {
  const j = isoToJ(iso);
  const index = j.jy * 12 + (j.jm - 1) + delta;

  const jy = Math.min(
    MAX_YEAR,
    Math.max(MIN_YEAR, div(index, 12)),
  );

  const jm = mod(index, 12) + 1;

  return jToIso(
    jy,
    jm,
    Math.min(j.jd, jalaliMonthLength(jy, jm)),
  );
}

function longDate(iso) {
  const j = isoToJ(iso);

  return `${WEEKDAYS[weekdayIndex(iso)]}، ${toFa(j.jd)} ${MONTHS[j.jm - 1]} ${toFa(j.jy)}`;
}

function relativeLabel(iso, today) {
  const diff = diffDays(iso, today);

  if (diff === 0) return "امروز";
  if (diff === -1) return "دیروز";
  if (diff === 1) return "فردا";

  const abs = Math.abs(diff);
  let text;

  if (abs < 14) {
    text = `${toFa(abs)} روز`;
  } else if (abs < 60) {
    text = `${toFa(Math.round(abs / 7))} هفته`;
  } else {
    text = `${toFa(Math.round(abs / 30))} ماه`;
  }

  return diff < 0 ? `${text} پیش` : `${text} دیگر`;
}

function monthCells(jy, jm) {
  const first = jToIso(jy, jm, 1);
  const offset = weekdayIndex(first);
  const length = jalaliMonthLength(jy, jm);
  const cells = Array(offset).fill(null);

  for (let day = 1; day <= length; day += 1) {
    cells.push({
      day,
      iso: jToIso(jy, jm, day),
    });
  }

  while (cells.length < 42) {
    cells.push(null);
  }

  return cells;
}

/* ───────────────────────── مودال ───────────────────────── */

export default function WorkoutHistoryModal({
  open,
  onClose,
  sessions = [],
  loading = false,
  onMonthChange,
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);

      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true)),
      );

      return () => cancelAnimationFrame(id);
    }

    setVisible(false);

    const timer = setTimeout(() => setMounted(false), 220);

    return () => clearTimeout(timer);
  }, [open]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <HistoryDialog
      visible={visible}
      onClose={onClose}
      sessions={sessions}
      loading={loading}
      onMonthChange={onMonthChange}
    />,
    document.body,
  );
}

/* ───────────────────────── دیالوگ ───────────────────────── */

function HistoryDialog({
  visible,
  onClose,
  sessions,
  loading,
  onMonthChange,
}) {
  const today = useMemo(todayIso, []);
  const todayJ = useMemo(() => isoToJ(today), [today]);

  const dialogRef = useRef(null);
  const gridRef = useRef(null);
  const focusRef = useRef(true);
  const pickedRef = useRef(false);

  const previousFocus = useRef(
    typeof document !== "undefined" ? document.activeElement : null,
  );

  const monthChangeRef = useRef(onMonthChange);
  monthChangeRef.current = onMonthChange;

  const [selected, setSelected] = useState(today);
  const [view, setView] = useState({
    jy: todayJ.jy,
    jm: todayJ.jm,
  });
  const [mode, setMode] = useState("days");

  /* گروه‌بندی جلسه‌ها بر اساس تاریخ */
  const byDate = useMemo(() => {
    const map = new Map();

    for (const session of sessions) {
      const key = String(session?.date || "").slice(0, 10);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        continue;
      }

      map.set(key, [
        ...(map.get(key) || []),
        session,
      ]);
    }

    return map;
  }, [sessions]);

  const dates = useMemo(
    () => [...byDate.keys()].sort(),
    [byDate],
  );

  const latest = useMemo(() => {
    const past = dates.filter((date) => date <= today);

    return past.length
      ? past[past.length - 1]
      : dates[0] || null;
  }, [dates, today]);

  useEffect(() => {
    if (!pickedRef.current && latest) {
      const j = isoToJ(latest);

      setSelected(latest);
      setView({
        jy: j.jy,
        jm: j.jm,
      });
    }
  }, [latest]);

  /* اطلاع به والد برای لود تنبل ماه */
  useEffect(() => {
    const first = jToIso(view.jy, view.jm, 1);
    const last = jToIso(
      view.jy,
      view.jm,
      jalaliMonthLength(view.jy, view.jm),
    );

    monthChangeRef.current?.({
      jy: view.jy,
      jm: view.jm,
      from: first,
      to: last,
    });
  }, [view.jy, view.jm]);

  /* قفل اسکرول و بازگرداندن فوکوس */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const opener = previousFocus.current;

    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (focusRef.current && mode === "days") {
      focusRef.current = false;

      gridRef.current
        ?.querySelector(`[data-iso="${selected}"]`)
        ?.focus({ preventScroll: true });
    }
  }, [selected, view, mode]);

  /* اکشن‌ها */
  function select(iso, { focus = false } = {}) {
    const j = isoToJ(iso);

    pickedRef.current = true;
    focusRef.current = focus;

    setSelected(iso);
    setView({
      jy: j.jy,
      jm: j.jm,
    });
  }

  function step(delta) {
    setView((current) => {
      if (mode === "months") {
        return {
          ...current,
          jy: Math.min(
            MAX_YEAR,
            Math.max(MIN_YEAR, current.jy + delta),
          ),
        };
      }

      const index =
        current.jy * 12 +
        (current.jm - 1) +
        delta;

      const jy = div(index, 12);

      if (jy < MIN_YEAR || jy > MAX_YEAR) {
        return current;
      }

      return {
        jy,
        jm: mod(index, 12) + 1,
      };
    });
  }

  function goToday() {
    setMode("days");
    select(today);
  }

  const viewFirst = jToIso(view.jy, view.jm, 1);
  const viewLength = jalaliMonthLength(view.jy, view.jm);

  const selectedInView =
    selected >= viewFirst &&
    selected <= jToIso(view.jy, view.jm, viewLength);

  const tabIso = selectedInView ? selected : viewFirst;

  const cells = useMemo(
    () => monthCells(view.jy, view.jm),
    [view.jy, view.jm],
  );

  const monthSessionDays = useMemo(() => {
    let count = 0;

    const last = jToIso(view.jy, view.jm, viewLength);

    for (const date of dates) {
      if (date >= viewFirst && date <= last) {
        count += 1;
      }
    }

    return count;
  }, [dates, viewFirst, view.jy, view.jm, viewLength]);

  const prevSession = useMemo(
    () => [...dates].reverse().find((date) => date < selected) || null,
    [dates, selected],
  );

  const nextSession = useMemo(
    () => dates.find((date) => date > selected) || null,
    [dates, selected],
  );

  /* کیبورد */
  function onDialogKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();

      if (mode === "months") {
        setMode("days");
      } else {
        onClose?.();
      }

      return;
    }

    if (event.key === "Tab") {
      const nodes = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function onGridKeyDown(event) {
    const current =
      event.target.closest("[data-iso]")?.dataset.iso ||
      tabIso;

    let next = null;

    if (event.key === "ArrowRight") next = addDays(current, -1);
    else if (event.key === "ArrowLeft") next = addDays(current, 1);
    else if (event.key === "ArrowUp") next = addDays(current, -7);
    else if (event.key === "ArrowDown") next = addDays(current, 7);
    else if (event.key === "PageUp") next = shiftMonth(current, -1);
    else if (event.key === "PageDown") next = shiftMonth(current, 1);
    else if (event.key === "Home") {
      const j = isoToJ(current);
      next = jToIso(j.jy, j.jm, 1);
    } else if (event.key === "End") {
      const j = isoToJ(current);
      next = jToIso(
        j.jy,
        j.jm,
        jalaliMonthLength(j.jy, j.jm),
      );
    }

    if (next) {
      event.preventDefault();
      select(next, { focus: true });
    }
  }

  const isCurrentMonth =
    view.jy === todayJ.jy &&
    view.jm === todayJ.jm;

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      className={`
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-[#0F172A]/45
        p-0 sm:p-4 lg:p-6
        backdrop-blur-[3px]
        transition-opacity duration-200
        motion-reduce:transition-none
        ${visible ? "opacity-100" : "opacity-0"}
      `}
    >
      <style>{`
        @keyframes wh-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }

        .wh-anim {
          animation: wh-fade 220ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .wh-anim { animation: none; }
        }
      `}</style>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wh-title"
        dir="rtl"
        onKeyDown={onDialogKeyDown}
        className={`
          flex
          h-full max-h-[100dvh]
          w-full max-w-[980px]
          flex-col
          overflow-hidden
          rounded-none sm:rounded-[24px]
          bg-white text-right
          shadow-2xl shadow-slate-900/20
          transition duration-200
          motion-reduce:transition-none
          sm:max-h-[94vh]
          ${visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-95 opacity-0"
          }
        `}
      >
        {/* هدر */}
        <div className="
          flex shrink-0 items-center justify-between gap-3
          border-b border-[#EDF0F4]
          px-4 py-3
          sm:px-6 sm:py-4
        ">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-xl bg-[#EAF4FF] text-[#007BFF]
              sm:h-10 sm:w-10
            ">
              <CalendarDays size={19} strokeWidth={1.8} />
            </span>

            <div className="min-w-0">
              <h2
                id="wh-title"
                className="font-primary text-base sm:text-xl text-[#4B5563]"
              >
                تاریخچه تمرینات
              </h2>

              <p className="mt-0.5 hidden text-xs text-[#94A3B8] sm:block">
                یک روز را انتخاب کن تا برنامهٔ همان روز را ببینی
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="
              flex h-9 w-9 shrink-0
              cursor-pointer items-center justify-center
              rounded-xl text-[#94A3B8]
              transition hover:bg-[#F3F6FA]
              hover:text-[#475569]
              active:scale-95
              sm:h-10 sm:w-10
            "
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* بدنه */}
        <div className="
          min-h-0 flex-1
          overflow-y-auto
          md:grid md:h-[600px]
          md:flex-none
          md:grid-cols-[minmax(270px,340px)_minmax(0,1fr)]
          md:overflow-hidden
        ">
          {/* ستون تقویم */}
          <aside className="
            flex flex-col
            border-b border-[#EDF0F4]
            bg-[#F8FAFD]
            p-3 sm:p-5
            md:min-h-0 md:overflow-y-auto
            md:border-b-0 md:border-l
          ">
            {/* ناوبری ماه */}
            <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={mode === "months" ? "سال قبل" : "ماه قبل"}
                className="
                  flex h-9 w-9 shrink-0
                  cursor-pointer items-center justify-center
                  rounded-xl text-[#7B8491]
                  transition hover:bg-white
                  hover:text-[#007BFF] active:scale-95
                "
              >
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode(mode === "days" ? "months" : "days")
                }
                aria-expanded={mode === "months"}
                className="
                  flex min-w-0 cursor-pointer
                  items-center justify-center gap-1.5
                  rounded-xl px-3 py-1.5
                  text-sm font-bold text-[#475569]
                  transition hover:bg-white
                "
              >
                <span className="truncate">
                  {mode === "days"
                    ? `${MONTHS[view.jm - 1]} ${toFa(view.jy)}`
                    : `سال ${toFa(view.jy)}`
                  }
                </span>

                <ChevronDown
                  size={14}
                  className={`
                    shrink-0 text-[#94A3B8] transition-transform
                    ${mode === "months" ? "rotate-180" : ""}
                  `}
                />
              </button>

              <button
                type="button"
                onClick={() => step(1)}
                aria-label={mode === "months" ? "سال بعد" : "ماه بعد"}
                className="
                  flex h-9 w-9 shrink-0
                  cursor-pointer items-center justify-center
                  rounded-xl text-[#7B8491]
                  transition hover:bg-white
                  hover:text-[#007BFF] active:scale-95
                "
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {mode === "months" ? (
              <div className="wh-anim grid grid-cols-3 gap-2">
                {MONTHS.map((name, index) => {
                  const active = view.jm === index + 1;
                  const current =
                    todayJ.jy === view.jy &&
                    todayJ.jm === index + 1;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setView({
                          jy: view.jy,
                          jm: index + 1,
                        });
                        setMode("days");
                      }}
                      className={`
                        cursor-pointer rounded-xl
                        py-2.5 sm:py-3
                        text-xs sm:text-sm
                        font-medium transition active:scale-95
                        ${
                          active
                            ? "bg-[#007BFF] text-white shadow-sm shadow-blue-200"
                            : current
                              ? "bg-white text-[#007BFF] ring-2 ring-[#BFDBFE]"
                              : "bg-white text-[#64748B] hover:bg-[#EAF4FF] hover:text-[#007BFF]"
                        }
                      `}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                {/* روزهای هفته */}
                <div className="mb-1 grid grid-cols-7 text-center">
                  {WEEKDAYS_SHORT.map((label, index) => (
                    <span
                      key={label}
                      title={WEEKDAYS[index]}
                      className={`
                        py-1.5 text-[11px] font-semibold
                        ${index === 6 ? "text-red-300" : "text-[#94A3B8]"}
                      `}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* روزهای ماه */}
                <div
                  ref={gridRef}
                  role="group"
                  aria-label={`${MONTHS[view.jm - 1]} ${toFa(view.jy)}`}
                  onKeyDown={onGridKeyDown}
                  className="
                    wh-anim grid grid-cols-7
                    place-items-center gap-y-1
                  "
                  key={`${view.jy}-${view.jm}`}
                >
                  {cells.map((cell, index) => {
                    if (!cell) {
                      return (
                        <span
                          key={`blank-${index}`}
                          className="aspect-square w-full max-w-10"
                        />
                      );
                    }

                    const isSelected = cell.iso === selected;
                    const isToday = cell.iso === today;
                    const has = byDate.has(cell.iso);
                    const friday = index % 7 === 6;

                    const done = (
                      byDate.get(cell.iso) || []
                    ).some((session) => session.completed !== false);

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        data-iso={cell.iso}
                        tabIndex={cell.iso === tabIso ? 0 : -1}
                        aria-pressed={isSelected}
                        aria-label={`
                          ${longDate(cell.iso)}
                          ${has ? "، تمرین دارد" : ""}
                          ${isToday ? "، امروز" : ""}
                        `}
                        onClick={() => select(cell.iso)}
                        className={`
                          relative flex aspect-square
                          w-full max-w-10
                          cursor-pointer items-center justify-center
                          rounded-xl
                          text-[12px] sm:text-[13px]
                          outline-none transition
                          focus-visible:ring-2
                          focus-visible:ring-[#007BFF]
                          focus-visible:ring-offset-1
                          active:scale-90
                          ${
                            isSelected
                              ? "bg-[#007BFF] font-bold text-white shadow-md shadow-blue-200"
                              : isToday
                                ? "bg-white font-bold text-[#007BFF] ring-2 ring-[#BFDBFE]"
                                : friday
                                  ? "text-red-400 hover:bg-white"
                                  : "text-[#4B5563] hover:bg-white hover:text-[#007BFF]"
                          }
                        `}
                      >
                        {toFa(cell.day)}

                        {has && (
                          <span
                            className={`
                              absolute bottom-1
                              h-1 w-1 rounded-full
                              ${
                                isSelected
                                  ? "bg-white"
                                  : done
                                    ? "bg-[#007BFF]"
                                    : "border border-[#007BFF] bg-transparent"
                              }
                            `}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* آمار ماه و امروز */}
            <div className="mt-3 pt-2 sm:mt-auto sm:pt-5">
              <div className="
                flex items-center justify-between gap-2
                rounded-2xl bg-white
                px-3 py-3 sm:px-4
              ">
                <div className="flex min-w-0 items-center gap-2 text-[11px] sm:text-xs text-[#64748B]">
                  <Dumbbell
                    size={15}
                    className="shrink-0 text-[#007BFF]"
                  />

                  <span className="min-w-0">
                    {monthSessionDays > 0 ? (
                      <>
                        <b className="text-[#334155]">
                          {toFa(monthSessionDays)}
                        </b>{" "}
                        روز تمرین در {MONTHS[view.jm - 1]}
                      </>
                    ) : (
                      `در ${MONTHS[view.jm - 1]} تمرینی ثبت نشده`
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={goToday}
                  disabled={
                    isCurrentMonth &&
                    selected === today &&
                    mode === "days"
                  }
                  className="
                    shrink-0 cursor-pointer
                    rounded-lg bg-[#EAF4FF]
                    px-3 py-2
                    text-[11px] sm:text-xs
                    font-semibold text-[#007BFF]
                    transition hover:bg-[#DCEBFF]
                    active:scale-95
                    disabled:cursor-default disabled:opacity-40
                  "
                >
                  امروز
                </button>
              </div>

              <div className="
                mt-3 flex flex-wrap
                items-center justify-center
                gap-x-4 gap-y-2
                text-[10px] sm:text-[11px]
                text-[#94A3B8]
              ">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#007BFF]" />
                  روز تمرین
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-white ring-2 ring-[#BFDBFE]" />
                  امروز
                </span>
              </div>
            </div>
          </aside>

          {/* ستون جزئیات روز */}
          <section
            className="
              flex min-h-[320px] min-w-0
              flex-col
              md:min-h-0 md:overflow-y-auto
            "
            aria-live="polite"
          >
            <DayDetail
              key={selected}
              iso={selected}
              today={today}
              sessions={byDate.get(selected) || []}
              loading={loading}
              prevSession={prevSession}
              nextSession={nextSession}
              onJump={(iso) => select(iso)}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── جزئیات روز ───────────────────────── */

function DayDetail({
  iso,
  today,
  sessions,
  loading,
  prevSession,
  nextSession,
  onJump,
}) {
  const isFuture = iso > today;
  const relative = relativeLabel(iso, today);

  return (
    <div className="wh-anim flex flex-1 flex-col min-w-0">
      {/* هدر روز */}
      <div className="
        sticky top-0 z-10
        flex flex-col sm:flex-row
        sm:items-center sm:justify-between
        gap-3
        border-b border-[#EDF0F4]
        bg-white/95
        px-4 py-3
        sm:px-6 sm:py-4
        backdrop-blur
      ">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-primary text-base sm:text-lg text-[#4B5563]">
              {longDate(iso)}
            </h3>

            <span className="
              rounded-full bg-[#F1F5F9]
              px-2.5 py-1
              text-[10px] sm:text-[11px]
              font-medium text-[#64748B]
            ">
              {relative}
            </span>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            disabled={!prevSession}
            onClick={() => onJump(prevSession)}
            className="
              flex flex-1 sm:flex-none
              cursor-pointer items-center justify-center gap-1
              rounded-lg border border-[#E5EAF1]
              px-2.5 py-2
              text-[11px] sm:text-xs
              text-[#64748B]
              transition hover:border-[#BFDBFE]
              hover:bg-[#F3F8FF] hover:text-[#007BFF]
              active:scale-95
              disabled:cursor-default disabled:opacity-40
            "
          >
            <ChevronRight size={14} />
            تمرین قبلی
          </button>

          <button
            type="button"
            disabled={!nextSession}
            onClick={() => onJump(nextSession)}
            className="
              flex flex-1 sm:flex-none
              cursor-pointer items-center justify-center gap-1
              rounded-lg border border-[#E5EAF1]
              px-2.5 py-2
              text-[11px] sm:text-xs
              text-[#64748B]
              transition hover:border-[#BFDBFE]
              hover:bg-[#F3F8FF] hover:text-[#007BFF]
              active:scale-95
              disabled:cursor-default disabled:opacity-40
            "
          >
            تمرین بعدی
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* محتوا */}
      <div className="
        min-w-0 flex-1
        space-y-5 sm:space-y-6
        px-3 py-4
        sm:px-6 sm:py-5
      ">
        {loading && sessions.length === 0 ? (
          <Skeleton />
        ) : sessions.length === 0 ? (
          <EmptyDay
            isFuture={isFuture}
            nextSession={nextSession}
            prevSession={prevSession}
            today={today}
            iso={iso}
            onJump={onJump}
          />
        ) : (
          sessions.map((session, sessionIndex) => (
            <SessionBlock
              key={session.id ?? sessionIndex}
              session={session}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── جلسه تمرینی ───────────────────────── */

function SessionBlock({ session }) {
  const exercises = Array.isArray(session.exercises)
    ? session.exercises
    : [];

  const totalSets = exercises.reduce(
    (sum, exercise) => sum + (Number(exercise.sets) || 0),
    0,
  );

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {session.title && (
          <span className="
            rounded-lg bg-[#EAF4FF]
            px-3 py-1.5
            text-xs font-bold text-[#007BFF]
          ">
            {session.title}
          </span>
        )}

        <span className="
          rounded-lg bg-[#F1F5F9]
          px-3 py-1.5 text-xs text-[#64748B]
        ">
          {toFa(exercises.length)} حرکت
        </span>

        {totalSets > 0 && (
          <span className="
            rounded-lg bg-[#F1F5F9]
            px-3 py-1.5 text-xs text-[#64748B]
          ">
            {toFa(totalSets)} ست
          </span>
        )}

        {session.completed === true && (
          <span className="
            flex items-center gap-1
            rounded-lg bg-emerald-50
            px-3 py-1.5
            text-xs font-medium text-emerald-600
          ">
            <Check size={13} strokeWidth={2.5} />
            انجام شد
          </span>
        )}

        {session.completed === false && (
          <span className="
            rounded-lg bg-amber-50
            px-3 py-1.5
            text-xs font-medium text-amber-600
          ">
            انجام نشد
          </span>
        )}
      </div>

      {exercises.length === 0 ? (
        <p className="
          rounded-2xl bg-[#F8FAFD]
          px-4 py-6
          text-center text-sm text-[#94A3B8]
        ">
          برای این جلسه حرکتی ثبت نشده است.
        </p>
      ) : (
        <ol className="space-y-3">
          {exercises.map((exercise, index) => (
            <li
              key={`${exercise.name}-${index}`}
              className="
                rounded-2xl
                border border-[#EDF0F4]
                bg-white
                p-3 sm:p-4
                transition hover:border-[#D6E6FA]
              "
            >
              <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                <span className="
                  flex h-8 w-8 shrink-0
                  items-center justify-center
                  rounded-lg bg-[#EAF4FF]
                  text-xs font-bold text-[#007BFF]
                ">
                  {toFa(index + 1)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="
                    break-words
                    text-sm font-semibold text-[#3F4752]
                  ">
                    {exercise.name || "حرکت بدون نام"}
                  </p>

                  <dl className="
                    mt-3 grid grid-cols-2
                    gap-2
                    sm:grid-cols-4
                  ">
                    {[
                      ["ست", exercise.sets],
                      ["تکرار", exercise.reps],
                      ["وزنه", exercise.weight],
                      ["استراحت", exercise.rest],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="
                          min-w-0 rounded-xl
                          bg-[#F8FAFD]
                          px-2.5 py-2
                          sm:px-3
                        "
                      >
                        <dt className="text-[10px] text-[#94A3B8]">
                          {label}
                        </dt>

                        <dd className="
                          mt-0.5 break-words
                          text-xs sm:text-[13px]
                          font-medium text-[#475569]
                        ">
                          {show(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {exercise.note ? (
                    <div className="
                      mt-3 flex min-w-0 items-start gap-2
                      rounded-xl bg-[#FFF9EC]
                      px-3 py-2.5
                      text-xs leading-6 text-[#8A6A1F]
                    ">
                      <StickyNote
                        size={14}
                        className="mt-1 shrink-0"
                      />

                      <span className="min-w-0 break-words">
                        <b className="font-semibold">
                          توضیح مربی:{" "}
                        </b>
                        {exercise.note}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ───────────────────────── روز بدون تمرین ───────────────────────── */

function EmptyDay({
  isFuture,
  prevSession,
  nextSession,
  today,
  iso,
  onJump,
}) {
  const candidates = [prevSession, nextSession].filter(Boolean);

  const nearest = candidates.sort(
    (a, b) =>
      Math.abs(diffDays(a, iso)) -
      Math.abs(diffDays(b, iso)),
  )[0];

  return (
    <div className="
      flex flex-1 flex-col
      items-center justify-center
      py-10 sm:py-12
      text-center
    ">
      <span className="
        mb-4 flex h-14 w-14 sm:h-16 sm:w-16
        items-center justify-center
        rounded-2xl bg-[#F1F5F9]
        text-3xl
      ">
        {isFuture ? "⏳" : "😴"}
      </span>

      <p className="text-sm font-semibold text-[#4B5563]">
        {isFuture
          ? "این روز هنوز نرسیده است"
          : "در این روز تمرینی ثبت نشده"
        }
      </p>

      <p className="
        mt-1 max-w-[280px]
        text-xs leading-6 text-[#94A3B8]
      ">
        {isFuture
          ? "برنامهٔ روزهای آینده بعد از انجام شدن اینجا دیده می‌شود."
          : "یا استراحت کرده‌ای یا تمرینی برایش ثبت نشده."
        }
      </p>

      {nearest && (
        <button
          type="button"
          onClick={() => onJump(nearest)}
          className="
            mt-5 max-w-full
            cursor-pointer rounded-xl
            bg-[#EAF4FF]
            px-4 py-2.5
            text-xs font-semibold text-[#007BFF]
            transition hover:bg-[#DCEBFF]
            active:scale-95
          "
        >
          برو به نزدیک‌ترین تمرین · {relativeLabel(nearest, today)}
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── اسکلت بارگذاری ───────────────────────── */

function Skeleton() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-label="در حال بارگذاری تاریخچه تمرینات"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="
            animate-pulse
            rounded-2xl
            border border-[#EDF0F4]
            bg-white
            p-3 sm:p-4
          "
        >
          <div className="flex gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-[#EEF2F7]" />

            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-1/3 rounded bg-[#EEF2F7]" />

              <div className="
                grid grid-cols-2
                gap-2 sm:grid-cols-4
              ">
                {[0, 1, 2, 3].map((cell) => (
                  <div
                    key={cell}
                    className="h-10 rounded-xl bg-[#F3F6FA]"
                  />
                ))}
              </div>

              <div className="h-9 w-full rounded-xl bg-[#F3F6FA]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
