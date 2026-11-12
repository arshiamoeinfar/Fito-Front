import { memo, useEffect, useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SortIcon from "@mui/icons-material/Sort";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import exerciseFallback from "../../../assets/imges/image 13.png";

const MISSING = "ثبت نشده";

const FILTERS = [
  { id: "all", label: "همه" },
  { id: "progressed", label: "پیشرفت کرده" },
  { id: "attention", label: "نیازمند توجه" },
  { id: "same", label: "بدون تغییر" },
];

const SORTS = [
  { id: "progress-desc", label: "بیشترین پیشرفت" },
  { id: "progress-asc", label: "کمترین پیشرفت" },
  { id: "record-desc", label: "بیشترین رکورد" },
  { id: "name", label: "نام حرکت" },
];

const STATUS_THEME = {
  progressed: { text: "#2BA84A", stroke: "#6BAF41", fill: "rgba(107,175,65,0.18)" },
  attention: { text: "#E5484D", stroke: "#EF4444", fill: "rgba(239,68,68,0.12)" },
  same: { text: "#8A8F98", stroke: "#9AA1A8", fill: "rgba(154,161,168,0.16)" },
  unknown: { text: "#8A8F98", stroke: "#9AA1A8", fill: "rgba(154,161,168,0.16)" },
};

function finite(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function fa(value) {
  const number = finite(value);
  if (number == null) return MISSING;
  const rounded = Math.round(number * 10) / 10;
  return rounded.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
}

function measureText(value, unit) {
  if (finite(value) == null) return MISSING;
  const suffix = unit === "reps" ? "تکرار" : "کیلوگرم";
  return `${fa(value)} ${suffix}`;
}

function setsRepsText(exercise) {
  const sets = finite(exercise.sets);
  const min = finite(exercise.repsMin);
  const max = finite(exercise.repsMax);
  if (sets == null && min == null && max == null) return MISSING;
  const setsText = sets == null ? MISSING : fa(sets);
  let repsText = MISSING;
  if (min != null && max != null && min !== max) repsText = `${fa(min)}–${fa(max)}`;
  else if (min != null) repsText = fa(min);
  else if (max != null) repsText = fa(max);
  return `${setsText}×${repsText}`;
}

function percentText(percent) {
  if (percent == null) return MISSING;
  const digits = fa(Math.abs(percent));
  if (percent > 0) return `\u200E+${digits}٪`;
  if (percent < 0) return `\u200E\u2212${digits}٪`;
  return `\u200E${digits}٪`;
}

function enrich(exercise, index) {
  const current = finite(exercise?.current);
  const previous = finite(exercise?.previous);
  let percent = null;
  if (current != null && previous != null && previous !== 0) {
    percent = Math.round(((current - previous) / previous) * 100);
  } else if (current === 0 && previous === 0) {
    percent = 0;
  }
  const status = percent == null ? "unknown" : percent > 0 ? "progressed" : percent < 0 ? "attention" : "same";
  const history = Array.isArray(exercise?.history) ? exercise.history.map(finite).filter((value) => value != null) : [];
  return {
    id: exercise?.id ?? `movement-${index}`,
    name: typeof exercise?.name === "string" && exercise.name.trim() ? exercise.name : "حرکت",
    image: typeof exercise?.image === "string" ? exercise.image : "",
    sets: exercise?.sets,
    repsMin: exercise?.repsMin,
    repsMax: exercise?.repsMax,
    current,
    previous,
    unit: exercise?.unit === "reps" ? "reps" : "weight",
    history,
    percent,
    status,
  };
}

function compareMissingLast(left, right, read) {
  const a = read(left);
  const b = read(right);
  if (a == null && b == null) return left.name.localeCompare(right.name, "fa");
  if (a == null) return 1;
  if (b == null) return -1;
  return 0;
}

function sortRows(rows, sortId) {
  const copy = [...rows];
  copy.sort((left, right) => {
    if (sortId === "name") return left.name.localeCompare(right.name, "fa");
    if (sortId === "record-desc") {
      const missing = compareMissingLast(left, right, (row) => row.current);
      return missing || right.current - left.current;
    }
    if (sortId === "progress-asc") {
      const missing = compareMissingLast(left, right, (row) => row.percent);
      return missing || left.percent - right.percent;
    }
    const missing = compareMissingLast(left, right, (row) => row.percent);
    return missing || right.percent - left.percent;
  });
  return copy;
}

const SP_W = 310;
const SP_H = 90;
const SP_PAD_Y = 10;
const SP_PAD_X = 2;

const Sparkline = memo(function Sparkline({ data, theme }) {
  const [hover, setHover] = useState(null);
  const chart = useMemo(() => {
    if (!Array.isArray(data) || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const stepX = (SP_W - SP_PAD_X * 2) / (data.length - 1);
    const points = data.map((value, index) => ({
      x: SP_PAD_X + index * stepX,
      y: range === 0 ? SP_H / 2 : SP_PAD_Y + (1 - (value - min) / range) * (SP_H - SP_PAD_Y * 2),
      value,
    }));
    const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
    const last = points[points.length - 1];
    const first = points[0];
    return {
      points,
      line,
      area: `${line} L${last.x.toFixed(1)} ${SP_H} L${first.x.toFixed(1)} ${SP_H} Z`,
    };
  }, [data]);

  if (!chart) return <p className="text-sm text-[#8A8F98]">{MISSING}</p>;

  const activeIndex = hover ?? chart.points.length - 1;
  const active = chart.points[activeIndex];

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (chart.points.length - 1));
    setHover(Math.min(chart.points.length - 1, Math.max(0, index)));
  };

  return (
    <div className="relative w-full max-w-[190px] cursor-crosshair" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${SP_W} ${SP_H}`} className="block h-auto w-full overflow-visible" dir="ltr">
        <path d={chart.area} fill={theme.fill} />
        <path d={chart.line} fill="none" stroke={theme.stroke} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null ? (
          <line x1={active.x} x2={active.x} y1="0" y2={SP_H} stroke={theme.stroke} strokeOpacity="0.35" strokeDasharray="3 3" />
        ) : null}
        <circle cx={active.x} cy={active.y} r={hover !== null ? 5 : 4} fill={theme.stroke} stroke="#fff" strokeWidth="2" />
      </svg>
      {hover !== null ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-[#2C3138] px-2.5 py-1.5 text-center text-[11px] text-white shadow-lg"
          style={{ left: `${(active.x / SP_W) * 100}%`, top: `${(active.y / SP_H) * 100}%`, marginTop: -10 }}
        >
          <span className="font-semibold">{fa(active.value)}</span>
          <span className="block text-[10px] opacity-70">جلسه {fa(hover + 1)}</span>
        </div>
      ) : null}
    </div>
  );
});

function Stat({ label, strong = false, color, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#9AA0A8]">{label}</p>
      <p className={`mt-2 text-[15px] ${strong ? "font-bold text-[#2C3138]" : "font-medium text-[#5C6370]"}`} style={color ? { color } : undefined}>
        {children}
      </p>
    </div>
  );
}

function MovementThumb({ src }) {
  const [failed, setFailed] = useState(false);
  const shown = !failed && src ? src : exerciseFallback;
  return (
    <img
      src={shown}
      alt=""
      onError={() => setFailed(true)}
      className="h-14 w-14 shrink-0 rounded-2xl object-cover"
    />
  );
}

const ExerciseRow = memo(function ExerciseRow({ exercise }) {
  const theme = STATUS_THEME[exercise.status] ?? STATUS_THEME.unknown;
  const percentColor = exercise.percent == null || exercise.percent === 0 ? STATUS_THEME.same.text : theme.text;
  return (
    <div className="grid grid-cols-[1.5fr_0.9fr_1fr_1fr_1fr_1.4fr] items-center gap-4 border-b border-[#EEF1F4] px-2 py-5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-4">
        <MovementThumb src={exercise.image} />
        <p className="truncate text-[15px] font-semibold text-[#2C3138]">{exercise.name}</p>
      </div>
      <Stat label="ست / تکرار">
        <span dir="ltr">{setsRepsText(exercise)}</span>
      </Stat>
      <Stat label="رکورد فعلی" strong>{measureText(exercise.current, exercise.unit)}</Stat>
      <Stat label="رکورد قبلی">{measureText(exercise.previous, exercise.unit)}</Stat>
      <Stat label="درصد پیشرفت" strong color={percentColor}>
        <span dir="ltr">{percentText(exercise.percent)}</span>
      </Stat>
      <Sparkline data={exercise.history} theme={theme} />
    </div>
  );
});

function ChartGlyph() {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E7F8EA] text-[#3CB371]">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 16.5l4.2-4.2 3 3L20 7" />
        <path d="M14.5 7H20v5.5" />
      </svg>
    </span>
  );
}

export default function ExerciseProgressModal({
  isOpen,
  onClose,
  exercises = [],
  loadError = "",
  ready = true,
}) {
  const [filter, setFilter] = useState("all");
  const [sortId, setSortId] = useState("progress-desc");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  const enriched = useMemo(
    () => (Array.isArray(exercises) ? exercises : []).map(enrich),
    [exercises],
  );

  const visible = useMemo(() => {
    const filtered = enriched.filter((row) => filter === "all" || row.status === filter);
    return sortRows(filtered, sortId);
  }, [enriched, filter, sortId]);

  const activeSort = SORTS.find((item) => item.id === sortId) ?? SORTS[0];
  const errorText = typeof loadError === "string" ? loadError.trim() : "";

  useEffect(() => {
    if (!isOpen) return;
    setFilter("all");
    setSortId("progress-desc");
    setSortOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key !== "Escape") return;
      if (sortOpen) setSortOpen(false);
      else onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, sortOpen, onClose]);

  useEffect(() => {
    if (!sortOpen) return undefined;
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6" onClick={onClose}>
      <style>{`
        @keyframes progressModalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
        .progress-modal-in { animation: progressModalIn .22s ease-out; }
        .progress-scroll { scrollbar-width: thin; scrollbar-color: #007bff #f3f6fa; }
        .progress-scroll::-webkit-scrollbar { width: 10px; }
        .progress-scroll::-webkit-scrollbar-track { background: #f3f6fa; border-radius: 999px; }
        .progress-scroll::-webkit-scrollbar-thumb { background: #007bff; border-radius: 999px; }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-progress-title"
        className="progress-modal-in flex max-h-[90vh] min-h-[520px] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div dir="rtl" className="flex shrink-0 items-start justify-between gap-4 px-6 pb-5 pt-8 sm:px-10 sm:pt-9">
          <div className="flex min-w-0 items-center gap-4">
            <ChartGlyph />
            <div className="min-w-0">
              <h2 id="exercise-progress-title" className="text-xl font-bold text-[#2C3138]">پیشرفت حرکات</h2>
              <p className="mt-1 text-sm text-[#8E939B]">مرور عملکرد تمام حرکات</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[#007BFF] text-[#007BFF] transition hover:bg-[#007BFF]/10"
            aria-label="بستن"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col pb-4">
          <div dir="rtl" className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EEF1F4] px-6 pb-5 sm:px-10">
            <div className="flex flex-wrap items-center gap-3">
              {FILTERS.map((item) => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm transition ${active ? "border-[#007BFF] bg-[#007BFF] text-white" : "border-[#E4E7EC] bg-white text-[#6B7280] hover:border-[#007BFF] hover:text-[#007BFF]"}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen((open) => !open)}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-[#E4E7EC] bg-white px-5 py-2.5 text-sm text-[#6B7280] transition hover:border-[#007BFF] hover:text-[#007BFF]"
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
              >
                <SortIcon sx={{ fontSize: 18 }} />
                {activeSort.label}
                <KeyboardArrowDownIcon sx={{ fontSize: 18 }} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen ? (
                <div role="listbox" className="absolute left-0 top-full z-20 mt-2 w-48 rounded-2xl border border-[#E4E7EC] bg-white p-1.5 shadow-xl">
                  {SORTS.map((item) => {
                    const active = item.id === sortId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setSortId(item.id);
                          setSortOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-right text-sm transition ${active ? "bg-[#007BFF]/10 text-[#007BFF]" : "text-[#6B7280] hover:bg-[#F5F7FB]"}`}
                      >
                        <span>{item.label}</span>
                        {active ? <CheckIcon sx={{ fontSize: 16 }} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="progress-scroll min-h-0 flex-1 overflow-auto px-6 sm:px-10">
            {errorText ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorText}</p> : null}
            {!ready ? (
              <p className="py-16 text-center text-sm text-[#8A8F98]">در حال خواندن پیشرفت حرکات...</p>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-[#8A8F98]">{filter === "all" ? "حرکتی ثبت نشده" : "حرکتی با این فیلتر پیدا نشد"}</p>
                {filter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="mt-4 cursor-pointer rounded-full bg-[#007BFF]/10 px-5 py-2 text-sm font-medium text-[#007BFF]"
                  >
                    نمایش همه حرکات
                  </button>
                ) : null}
              </div>
            ) : (
              <div dir="rtl" className="min-w-[920px]">
                {visible.map((exercise) => <ExerciseRow key={exercise.id} exercise={exercise} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
