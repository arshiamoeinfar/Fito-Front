
import { memo, useEffect, useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SortIcon from "@mui/icons-material/Sort";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
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
  progressed: {
    text: "#249B55",
    stroke: "#35B66A",
    fill: "rgba(53,182,106,0.13)",
    background: "#EAF8EF",
    label: "پیشرفت داشته",
  },
  attention: {
    text: "#DC454B",
    stroke: "#EF5350",
    fill: "rgba(239,83,80,0.12)",
    background: "#FFF0F0",
    label: "نیازمند توجه",
  },
  same: {
    text: "#858B95",
    stroke: "#A0A6AF",
    fill: "rgba(160,166,175,0.14)",
    background: "#F1F3F5",
    label: "بدون تغییر",
  },
  unknown: {
    text: "#858B95",
    stroke: "#A0A6AF",
    fill: "rgba(160,166,175,0.14)",
    background: "#F1F3F5",
    label: "اطلاعات ناکافی",
  },
};

function finite(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function fa(value) {
  const number = finite(value);
  if (number == null) return MISSING;

  return (Math.round(number * 10) / 10).toLocaleString("fa-IR", {
    maximumFractionDigits: 1,
  });
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

  if (min != null && max != null && min !== max) {
    repsText = `${fa(min)}–${fa(max)}`;
  } else if (min != null) {
    repsText = fa(min);
  } else if (max != null) {
    repsText = fa(max);
  }

  return `${setsText} × ${repsText}`;
}

function percentText(percent) {
  if (percent == null) return MISSING;

  const digits = fa(Math.abs(percent));

  if (percent > 0) return `+${digits}٪`;
  if (percent < 0) return `−${digits}٪`;

  return `${digits}٪`;
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

  const status =
    percent == null
      ? "unknown"
      : percent > 0
        ? "progressed"
        : percent < 0
          ? "attention"
          : "same";

  const history = Array.isArray(exercise?.history)
    ? exercise.history.map(finite).filter((value) => value != null)
    : [];

  return {
    id: exercise?.id ?? `movement-${index}`,
    name:
      typeof exercise?.name === "string" && exercise.name.trim()
        ? exercise.name
        : "حرکت",
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

  if (a == null && b == null) {
    return left.name.localeCompare(right.name, "fa");
  }

  if (a == null) return 1;
  if (b == null) return -1;

  return 0;
}

function sortRows(rows, sortId) {
  const copy = [...rows];

  copy.sort((left, right) => {
    if (sortId === "name") {
      return left.name.localeCompare(right.name, "fa");
    }

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
      y:
        range === 0
          ? SP_H / 2
          : SP_PAD_Y +
            (1 - (value - min) / range) * (SP_H - SP_PAD_Y * 2),
      value,
    }));

    const line = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
      )
      .join(" ");

    const last = points[points.length - 1];
    const first = points[0];

    return {
      points,
      line,
      area: `${line} L${last.x.toFixed(1)} ${SP_H} L${first.x.toFixed(1)} ${SP_H} Z`,
    };
  }, [data]);

  if (!chart) {
    return (
      <p className="text-xs text-[#A0A6AF]">
        تاریخچه کافی نیست
      </p>
    );
  }

  const activeIndex = hover ?? chart.points.length - 1;
  const active = chart.points[activeIndex];

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width) return;

    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (chart.points.length - 1));

    setHover(
      Math.min(chart.points.length - 1, Math.max(0, index)),
    );
  };

  return (
    <div
      className="relative w-full cursor-crosshair"
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${SP_W} ${SP_H}`}
        className="block h-auto w-full overflow-visible"
        dir="ltr"
      >
        <path d={chart.area} fill={theme.fill} />

        <path
          d={chart.line}
          fill="none"
          stroke={theme.stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hover !== null && (
          <line
            x1={active.x}
            x2={active.x}
            y1="0"
            y2={SP_H}
            stroke={theme.stroke}
            strokeOpacity="0.35"
            strokeDasharray="3 3"
          />
        )}

        <circle
          cx={active.x}
          cy={active.y}
          r={hover !== null ? 5 : 4}
          fill={theme.stroke}
          stroke="#fff"
          strokeWidth="2"
        />
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-[#2C3138] px-2.5 py-1.5 text-center text-[11px] text-white shadow-lg"
          style={{
            left: `${(active.x / SP_W) * 100}%`,
            top: `${(active.y / SP_H) * 100}%`,
            marginTop: -10,
          }}
        >
          <span className="font-semibold">{fa(active.value)}</span>
          <span className="block text-[10px] opacity-70">
            جلسه {fa(hover + 1)}
          </span>
        </div>
      )}
    </div>
  );
});

function Stat({ label, strong = false, color, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-[#9AA0A8]">{label}</p>

      <p
        className={`mt-1.5 text-sm ${
          strong
            ? "font-bold text-[#2C3138]"
            : "font-medium text-[#5C6370]"
        }`}
        style={color ? { color } : undefined}
      >
        {children}
      </p>
    </div>
  );
}

function MovementThumb({ src, className = "" }) {
  const [failed, setFailed] = useState(false);

  const shown = !failed && src ? src : exerciseFallback;

  return (
    <img
      src={shown}
      alt=""
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-2xl object-cover ${className}`}
    />
  );
}

function StatusBadge({ status }) {
  const theme = STATUS_THEME[status] ?? STATUS_THEME.unknown;

  const Icon =
    status === "progressed"
      ? TrendingUpRoundedIcon
      : status === "attention"
        ? TrendingDownRoundedIcon
        : RemoveRoundedIcon;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
      style={{
        color: theme.text,
        backgroundColor: theme.background,
      }}
    >
      <Icon sx={{ fontSize: 15 }} />
      {theme.label}
    </span>
  );
}

const ExerciseRow = memo(function ExerciseRow({ exercise }) {
  const theme = STATUS_THEME[exercise.status] ?? STATUS_THEME.unknown;

  const percentColor =
    exercise.percent == null || exercise.percent === 0
      ? STATUS_THEME.same.text
      : theme.text;

  return (
    <div className="grid grid-cols-[1.5fr_0.8fr_1fr_1fr_0.9fr_1.2fr] items-center gap-4 border-b border-[#EEF1F4] px-3 py-5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <MovementThumb src={exercise.image} className="h-12 w-12" />

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#2C3138]">
            {exercise.name}
          </p>
          <div className="mt-1">
            <StatusBadge status={exercise.status} />
          </div>
        </div>
      </div>

      <Stat label="ست / تکرار">
        <span dir="ltr">{setsRepsText(exercise)}</span>
      </Stat>

      <Stat label="رکورد فعلی" strong>
        {measureText(exercise.current, exercise.unit)}
      </Stat>

      <Stat label="رکورد قبلی">
        {measureText(exercise.previous, exercise.unit)}
      </Stat>

      <Stat label="درصد پیشرفت" strong color={percentColor}>
        <span dir="ltr">{percentText(exercise.percent)}</span>
      </Stat>

      <div className="min-w-0">
        <Sparkline data={exercise.history} theme={theme} />
      </div>
    </div>
  );
});

function ExerciseCard({ exercise }) {
  const theme = STATUS_THEME[exercise.status] ?? STATUS_THEME.unknown;

  const percentColor =
    exercise.percent == null || exercise.percent === 0
      ? STATUS_THEME.same.text
      : theme.text;

  return (
    <article className="rounded-2xl border border-[#EDF0F4] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MovementThumb src={exercise.image} className="h-14 w-14" />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-[#2C3138]">
              {exercise.name}
            </h3>

            <p className="mt-1 text-xs text-[#9299A3]">
              {setsRepsText(exercise)} ست / تکرار
            </p>
          </div>
        </div>

        <StatusBadge status={exercise.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
        <Stat label="رکورد فعلی" strong>
          {measureText(exercise.current, exercise.unit)}
        </Stat>

        <Stat label="رکورد قبلی">
          {measureText(exercise.previous, exercise.unit)}
        </Stat>

        <Stat label="میزان پیشرفت" strong color={percentColor}>
          <span dir="ltr">{percentText(exercise.percent)}</span>
        </Stat>

        <Stat label="تعداد جلسات ثبت‌شده">
          {fa(exercise.history.length)} جلسه
        </Stat>
      </div>

      <div className="mt-5 rounded-xl bg-[#F8FAFC] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-[#69717D]">
            روند عملکرد
          </p>
          <span className="text-[10px] text-[#A0A6AF]">
            بر اساس جلسات
          </span>
        </div>

        <Sparkline data={exercise.history} theme={theme} />
      </div>
    </article>
  );
}

function SummaryCard({ label, value, icon, color, background }) {
  const Icon = icon;

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#EDF0F4] bg-white p-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: background, color }}
      >
        <Icon sx={{ fontSize: 23 }} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-[#9299A3]">{label}</p>
        <p className="mt-1 text-xl font-bold text-[#2C3138]">
          {fa(value)}
        </p>
      </div>
    </div>
  );
}

function ChartGlyph() {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F1FF] text-[#007BFF]">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
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
    () =>
      (Array.isArray(exercises) ? exercises : []).map(enrich),
    [exercises],
  );

  const visible = useMemo(() => {
    const filtered = enriched.filter(
      (row) => filter === "all" || row.status === filter,
    );

    return sortRows(filtered, sortId);
  }, [enriched, filter, sortId]);

  const activeSort =
    SORTS.find((item) => item.id === sortId) ?? SORTS[0];

  const errorText =
    typeof loadError === "string" ? loadError.trim() : "";

  const summary = useMemo(
    () => ({
      total: enriched.length,
      progressed: enriched.filter((item) => item.status === "progressed").length,
      attention: enriched.filter((item) => item.status === "attention").length,
      same: enriched.filter((item) => item.status === "same").length,
    }),
    [enriched],
  );

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

      if (sortOpen) {
        setSortOpen(false);
      } else {
        onClose?.();
      }
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
      if (
        sortRef.current &&
        !sortRef.current.contains(event.target)
      ) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#08111F]/55 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <style>{`
        @keyframes progressModalIn {
          from { opacity: 0; transform: translateY(12px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .progress-modal-in {
          animation: progressModalIn .22s ease-out;
        }

        .progress-scroll {
          scrollbar-width: thin;
          scrollbar-color: #007bff #f3f6fa;
        }

        .progress-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .progress-scroll::-webkit-scrollbar-track {
          background: #f3f6fa;
          border-radius: 999px;
        }

        .progress-scroll::-webkit-scrollbar-thumb {
          background: #007bff;
          border-radius: 999px;
        }

        .filter-scroll {
          scrollbar-width: none;
        }

        .filter-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-progress-title"
        dir="rtl"
        className="progress-modal-in flex max-h-[94dvh] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-[24px] bg-[#F7F9FC] shadow-2xl sm:rounded-[30px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#EDF0F4] bg-white px-4 py-4 sm:px-7 sm:py-5 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <ChartGlyph />

            <div className="min-w-0">
              <h2
                id="exercise-progress-title"
                className="text-base font-bold text-[#2C3138] sm:text-xl"
              >
                تحلیل پیشرفت حرکات
              </h2>

              <p className="mt-1 text-[11px] text-[#8E939B] sm:text-sm">
                بررسی عملکرد و روند تغییرات تمام حرکات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E7EBF0] text-[#6B7280] transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            aria-label="بستن"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Content */}
        <div className="progress-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {errorText && (
            <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorText}
            </p>
          )}

          {/* Summary */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#39414C] sm:text-base">
                خلاصه عملکرد
              </h3>

              <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-[11px] font-semibold text-[#007BFF]">
                {fa(summary.total)} حرکت
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <SummaryCard
                label="کل حرکات"
                value={summary.total}
                icon={FitnessCenterRoundedIcon}
                color="#007BFF"
                background="#EAF2FF"
              />

              <SummaryCard
                label="پیشرفت کرده"
                value={summary.progressed}
                icon={TrendingUpRoundedIcon}
                color="#249B55"
                background="#EAF8EF"
              />

              <SummaryCard
                label="نیازمند توجه"
                value={summary.attention}
                icon={TrendingDownRoundedIcon}
                color="#DC454B"
                background="#FFF0F0"
              />

              <SummaryCard
                label="بدون تغییر"
                value={summary.same}
                icon={RemoveRoundedIcon}
                color="#858B95"
                background="#F1F3F5"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 rounded-2xl border border-[#EDF0F4] bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="filter-scroll flex items-center gap-2 overflow-x-auto pb-1">
                {FILTERS.map((item) => {
                  const active = filter === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition sm:text-sm ${
                        active
                          ? "border-[#007BFF] bg-[#007BFF] text-white shadow-sm shadow-blue-200"
                          : "border-[#E4E7EC] bg-white text-[#6B7280] hover:border-[#007BFF] hover:text-[#007BFF]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative shrink-0" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setSortOpen((open) => !open)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#E4E7EC] bg-white px-4 py-2.5 text-xs text-[#6B7280] transition hover:border-[#007BFF] hover:text-[#007BFF] sm:w-auto sm:text-sm"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                >
                  <span className="flex items-center gap-2">
                    <SortIcon sx={{ fontSize: 18 }} />
                    مرتب‌سازی: {activeSort.label}
                  </span>

                  <KeyboardArrowDownIcon
                    sx={{ fontSize: 18 }}
                    className={`transition-transform ${
                      sortOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {sortOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 top-full z-30 mt-2 w-full min-w-48 rounded-2xl border border-[#E4E7EC] bg-white p-1.5 shadow-xl sm:w-52"
                  >
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
                          className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-right text-xs transition sm:text-sm ${
                            active
                              ? "bg-[#007BFF]/10 text-[#007BFF]"
                              : "text-[#6B7280] hover:bg-[#F5F7FB]"
                          }`}
                        >
                          <span>{item.label}</span>
                          {active && <CheckIcon sx={{ fontSize: 16 }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exercise list */}
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#39414C] sm:text-base">
              جزئیات حرکات
            </h3>

            <span className="text-xs text-[#9299A3]">
              {fa(visible.length)} نتیجه
            </span>
          </div>

          {!ready ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-[#EDF0F4] bg-white">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#DCEAFF] border-t-[#007BFF]" />
              <p className="mt-4 text-sm text-[#8A8F98]">
                در حال خواندن پیشرفت حرکات...
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDE3EB] bg-white px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F5FA] text-[#8A96A5]">
                <FitnessCenterRoundedIcon sx={{ fontSize: 27 }} />
              </div>

              <p className="mt-4 text-sm font-semibold text-[#56606D]">
                {filter === "all"
                  ? "هنوز حرکتی ثبت نشده است"
                  : "حرکتی با این فیلتر پیدا نشد"}
              </p>

              <p className="mt-1 text-xs text-[#A0A6AF]">
                پس از ثبت جلسات تمرینی، اطلاعات این قسمت نمایش داده می‌شود.
              </p>

              {filter !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="mt-4 cursor-pointer rounded-xl bg-[#EAF2FF] px-4 py-2 text-xs font-semibold text-[#007BFF] transition hover:bg-[#DCEAFF]"
                >
                  نمایش همه حرکات
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-[#EDF0F4] bg-white xl:block">
                <div className="grid grid-cols-[1.5fr_0.8fr_1fr_1fr_0.9fr_1.2fr] items-center gap-4 border-b border-[#EDF0F4] bg-[#F8FAFC] px-5 py-4 text-[11px] font-semibold text-[#9299A3]">
                  <span>نام حرکت</span>
                  <span>ست / تکرار</span>
                  <span>رکورد فعلی</span>
                  <span>رکورد قبلی</span>
                  <span>پیشرفت</span>
                  <span>روند عملکرد</span>
                </div>

                <div className="px-3">
                  {visible.map((exercise) => (
                    <ExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile and tablet cards */}
              <div className="grid grid-cols-1 gap-3 xl:hidden">
                {visible.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                  />
                ))}
              </div>
            </>
          )}

          <div className="mt-5 rounded-2xl border border-[#E5EEFC] bg-[#EDF5FF] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF]">
                <TrendingUpRoundedIcon />
              </div>

              <div>
                <p className="text-xs font-bold text-[#2766A9]">
                  نکته تحلیل عملکرد
                </p>
                <p className="mt-1 text-xs leading-6 text-[#55728F]">
                  درصد پیشرفت بر اساس مقایسه رکورد فعلی و قبلی محاسبه شده است.
                  برای تحلیل دقیق‌تر، تاریخچه ثبت‌شده جلسات و شرایط اجرای حرکت
                  نیز باید در نظر گرفته شود.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
