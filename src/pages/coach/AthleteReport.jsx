
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import JalaliField from "../../Components/shared/JalaliField/JalaliField";
import {
  dateFromJalali,
  faDigits,
  isoDate,
  jalaliParts,
  MONTHS,
  parseMoment,
  shiftMonth,
  showDate,
  todayDateValue,
} from "../../lib/jalali";

import { printDocument } from "../../lib/printDocument";

const LINE_COLORS = [
  "#007BFF",
  "#16A34A",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#0EA5E9",
  "#EC4899",
  "#0F766E",
  "#111827",
  "#C2410C",
  "#7C3AED",
  "#BE185D",
];

const CHART_SHAPES = [
  ["curve", "منحنی"],
  ["line", "خطی عادی"],
  ["points", "خطی نقطه‌ای"],
  ["column", "ستونی"],
];

const SHAPE_HINT = {
  curve: "منحنی از خود ثبت‌ها می‌گذرد، نه پله‌ای. عدد کنار هر نقطه مقدار واقعی است.",
  line: "خط بدون نقطه است و بعد از اولین ثبت تا پایان بازه ادامه پیدا می‌کند.",
  points: "نقطه فقط روی ثبت تازه می‌نشیند و خط تا پایان بازه ادامه پیدا می‌کند.",
  column: "هر ستون، آخرین مقدار همان ماه است. ماه‌های قبل از اولین ثبت خالی می‌مانند.",
};

const BODY_SERIES = [
  ["weight_kg", "وزن", "کیلوگرم", "#007BFF"],
  ["height_cm", "قد", "سانتی‌متر", "#64748B"],
  ["waist_cm", "دور کمر", "سانتی‌متر", "#0EA5E9"],
  ["chest_cm", "دور سینه", "سانتی‌متر", "#8B5CF6"],
  ["hip_cm", "دور باسن", "سانتی‌متر", "#EC4899"],
  ["neck_cm", "دور گردن", "سانتی‌متر", "#14B8A6"],
  ["left_arm_cm", "دور بازوی چپ", "سانتی‌متر", "#F59E0B"],
  ["right_arm_cm", "دور بازوی راست", "سانتی‌متر", "#D97706"],
  ["left_thigh_cm", "دور ران چپ", "سانتی‌متر", "#22C55E"],
  ["right_thigh_cm", "دور ران راست", "سانتی‌متر", "#16A34A"],
  ["body_fat_percent", "چربی بدن", "درصد", "#EF4444"],
  ["muscle_mass_kg", "توده عضله", "کیلوگرم", "#6366F1"],
  ["bmi_calculated", "شاخص توده بدنی", "", "#94A3B8"],
  ["bmi", "شاخص توده بدنی ثبت‌شده", "", "#64748B"],
];

const KIND_STYLE = {
  اندازه:
    "bg-[#EAF4FF] text-[#0B63CE] dark:bg-blue-500/15 dark:text-blue-300",
  قدرت:
    "bg-[#EEF0FF] text-[#4F46E5] dark:bg-indigo-500/15 dark:text-indigo-300",
  تمرین:
    "bg-[#E6F7F4] text-[#0F766E] dark:bg-teal-500/15 dark:text-teal-300",
  عکس:
    "bg-[#FDEBF3] text-[#BE185D] dark:bg-pink-500/15 dark:text-pink-300",
  "برنامه تمرین":
    "bg-[#EAF4FF] text-[#0B63CE] dark:bg-blue-500/15 dark:text-blue-300",
  "برنامه غذا":
    "bg-[#FFF4E0] text-[#B45309] dark:bg-amber-500/15 dark:text-amber-300",
};

const KIND_ORDER = ["اندازه", "قدرت", "تمرین"];

const PRESETS = [
  ["این ماه", 0],
  ["۳ ماه اخیر", 2],
  ["۶ ماه اخیر", 5],
  ["۱ سال اخیر", 11],
];

/* ==================== منطق داده ==================== */

function numberOf(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function timeOf(value) {
  return parseMoment(value)?.getTime() || 0;
}

function csvCell(value) {
  const text = String(value ?? "");

  return /[",\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

function downloadCsv(rows) {
  const text = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  const blob = new Blob([`\uFEFF${text}`], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "gozaresh.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function shownNumber(value) {
  return Number(value).toLocaleString("fa-IR", {
    maximumFractionDigits: 2,
  });
}

function monthsAgo(count) {
  const parts = jalaliParts(new Date());
  const shifted = shiftMonth(parts.year, parts.month, -count);
  const date = dateFromJalali(shifted.year, shifted.month, 1);

  return date ? isoDate(date) : todayDateValue();
}

function startOfDay(value) {
  const date = parseMoment(value);

  if (!date) return 0;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

function monthLabel(time) {
  const parts = jalaliParts(new Date(time));

  return `${MONTHS[parts.month - 1]} ${faDigits(parts.year)}`;
}

function continuousChart(items, start, end) {
  const spanDays = Math.max(
    1,
    Math.round((end - start) / 86400000)
  );

  const step = Math.max(1, Math.ceil(spanDays / 400));

  const prepared = items.map((item) => {
    const values = item.points.map((point) => point.value);

    return {
      lowest: Math.min(...values),
      span: Math.max(...values) - Math.min(...values),

      points: item.points
        .map((point) => ({
          time: timeOf(point.at),
          value: point.value,
        }))
        .sort((left, right) => left.time - right.time),
    };
  });

  const rows = [];

  for (
    let time = start;
    time <= end;
    time += step * 86400000
  ) {
    const row = { time };

    prepared.forEach((item, index) => {
      const known = [...item.points]
        .reverse()
        .find(
          (point) =>
            point.time <= time + 86400000 - 1
        );

      const key = `s${index}`;

      row[`${key}raw`] = known ? known.value : null;

      row[key] = !known
        ? null
        : item.span === 0
          ? 50
          : ((known.value - item.lowest) / item.span) * 100;
    });

    rows.push(row);
  }

  return {
    rows,
    ticks: monthTicks(start, end),
  };
}

function curveRows(rows, count) {
  return rows.filter((row, index) => {
    const previous = rows[index - 1];

    for (let series = 0; series < count; series += 1) {
      const raw = row[`s${series}raw`];

      if (
        raw != null &&
        raw !== previous?.[`s${series}raw`]
      ) {
        return true;
      }
    }

    return false;
  });
}

function columnRows(rows, ticks) {
  return ticks.map((tick, index) => {
    const next =
      ticks[index + 1] ?? Number.POSITIVE_INFINITY;

    let last = null;

    rows.forEach((row) => {
      if (row.time >= tick && row.time < next) {
        last = row;
      }
    });

    return {
      ...(last || {}),
      time: tick,
      label: monthLabel(tick),
    };
  });
}

function monthTicks(fromMs, toMs) {
  const start = jalaliParts(new Date(fromMs));

  let cursor = {
    year: start.year,
    month: start.month,
  };

  const ticks = [];

  for (let index = 0; index < 48; index += 1) {
    const date = dateFromJalali(
      cursor.year,
      cursor.month,
      1
    );

    if (!date) break;

    const time = date.getTime();

    if (time > toMs) break;

    if (time >= fromMs) {
      ticks.push(time);
    }

    cursor = shiftMonth(
      cursor.year,
      cursor.month,
      1
    );
  }

  if (
    ticks.length === 0 ||
    ticks[0] - fromMs > 86400000
  ) {
    ticks.unshift(fromMs);
  }

  return ticks;
}

/* ==================== ابزارهای رابط ==================== */

function useMedia(query) {
  const [matches, setMatches] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.(query).matches)
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.matchMedia
    ) {
      return undefined;
    }

    const media = window.matchMedia(query);

    const handler = (event) => {
      setMatches(event.matches);
    };

    setMatches(media.matches);

    media.addEventListener("change", handler);

    return () => {
      media.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

const fieldInput =
  "min-h-11 w-full rounded-xl border border-[#E3E8F0] bg-white px-4 py-3 text-base text-[#1F2937] outline-none transition focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 sm:text-sm dark:border-[#303B4D] dark:bg-[#182334] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400";

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]";

function Icon({
  name,
  className = "h-4 w-4",
}) {
  const paths = {
    download:
      "M12 4v11M7.5 11L12 15.5 16.5 11M5 19h14",
    print:
      "M7 9V4h10v5M7 17H5a1 1 0 01-1-1v-5a2 2 0 012-2h12a2 2 0 012 2v5a1 1 0 01-1 1h-2M7 14h10v6H7z",
    close:
      "M6 6l12 12M18 6L6 18",
    chevron:
      "M6 9l6 6 6-6",
    info:
      "M12 11v5M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
  className = "",
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid gap-1 rounded-2xl bg-[#EEF1F6] p-1 dark:bg-[#202B3B] ${className}`}
    >
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={`min-h-10 rounded-xl px-3 py-2 text-sm transition ${focusRing} ${
            value === id
              ? "bg-white font-medium text-[#007BFF] shadow-sm dark:bg-[#334155] dark:text-blue-400"
              : "text-[#6B6F77] hover:text-[#1F2937] dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function KindChip({ kind }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
        KIND_STYLE[kind] ||
        "bg-[#F1F4F9] text-[#6B6F77] dark:bg-slate-700 dark:text-gray-300"
      }`}
    >
      {kind}
    </span>
  );
}

function EmptyBox({ emoji, title, text }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#DDE3EE] bg-[#FAFBFD] px-4 py-10 text-center dark:border-[#344154] dark:bg-[#182334]">
      <span className="text-3xl" aria-hidden="true">
        {emoji}
      </span>

      <p className="text-sm font-medium text-[#4B5563] dark:text-gray-200">
        {title}
      </p>

      {text ? (
        <p className="max-w-sm text-xs leading-6 text-[#8A93A3] dark:text-gray-400">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function Row({
  at,
  kind,
  title,
  detail,
}) {
  return (
    <li className="flex flex-col gap-1.5 rounded-2xl border border-[#EEF1F6] bg-white px-4 py-3 transition-colors sm:flex-row sm:items-center sm:gap-4 dark:border-[#303B4D] dark:bg-[#182334]">
      <div className="flex items-center justify-between gap-3 sm:w-56 sm:shrink-0 sm:justify-start">
        <span className="text-xs text-[#6B6F77] sm:w-24 sm:text-sm dark:text-gray-400">
          {showDate(at)}
        </span>

        <KindChip kind={kind} />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="min-w-0 break-words text-sm text-[#1F2937] dark:text-gray-200">
          {title}
        </span>

        <span className="shrink-0 text-sm font-medium text-[#374151] dark:text-gray-300">
          {detail}
        </span>
      </div>
    </li>
  );
}

/* ==================== کامپوننت اصلی ==================== */

export default function AthleteReport({
  name,
  observations = [],
  records = [],
  photos = [],
  workouts = [],
  meals = [],
  sessions = [],
  programsEmpty = "برنامه‌ای برای این شاگرد ثبت نشده است.",
}) {
  const series = useMemo(() => {
    const rows = [];

    BODY_SERIES.forEach(([id, label, unit, color]) => {
      const points = observations.flatMap((item) => {
        const value = numberOf(item.metrics?.[id]);

        return value === null
          ? []
          : [
              {
                at: item.measured_at,
                value,
              },
            ];
      });

      if (points.length) {
        rows.push({
          id,
          label,
          unit,
          color,
          points,
          kind: "اندازه",
        });
      }
    });

    const grouped = new Map();

    records.forEach((record) => {
      const value = numberOf(record.amount);

      if (value === null) return;

      const id = `record:${record.exercise_name}:${record.metric}`;

      const current = grouped.get(id) || {
        id,
        label: `${record.exercise_name} · ${record.metric_label}`,
        unit:
          record.metric === "max_reps"
            ? "تکرار"
            : record.metric === "max_duration_s"
              ? "ثانیه"
              : record.metric === "max_distance_m"
                ? "متر"
                : "کیلوگرم",
        color: "#111827",
        points: [],
        kind: "قدرت",
        metric: record.metric,
      };

      current.points.push({
        at: record.recorded_at,
        value,
      });

      grouped.set(id, current);
    });

    rows.push(...grouped.values());

    const setPoints = sessions.flatMap((session) => {
      const count = Array.isArray(session.sets)
        ? session.sets.length
        : null;

      return count === null
        ? []
        : [
            {
              at: session.performed_on,
              value: count,
            },
          ];
    });

    if (setPoints.length) {
      rows.push({
        id: "sets",
        label: "تعداد ست تمرین",
        unit: "ست",
        color: "#0F766E",
        points: setPoints,
        kind: "تمرین",
      });
    }

    return rows.map((item, index) => ({
      ...item,
      color: LINE_COLORS[index % LINE_COLORS.length],
    }));
  }, [observations, records, sessions]);

  const [picked, setPicked] = useState({});
  const [sort, setSort] = useState("asc");
  const [from, setFrom] = useState(() => monthsAgo(5));
  const [to, setTo] = useState(todayDateValue);
  const [shape, setShape] = useState("curve");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState("records");
  const [visible, setVisible] = useState(12);

  const narrow = useMedia("(max-width: 639px)");

  const isOn = (item) =>
    picked[item.id] ??
    (item.id === "weight_kg" ||
      item.id === "waist_cm" ||
      item.metric === "max_weight_g");

  const active = series.filter(isOn);

  function order(points) {
    return [...points].sort((left, right) =>
      sort === "asc"
        ? timeOf(left.at) - timeOf(right.at)
        : timeOf(right.at) - timeOf(left.at)
    );
  }

  const fromMs = startOfDay(from);
  const toMs = startOfDay(to) + 86400000 - 1;

  const rangeOk = fromMs > 0 && toMs >= fromMs;

  function inRange(value) {
    const time = timeOf(value);

    return (
      rangeOk &&
      time >= fromMs &&
      time <= toMs
    );
  }

  const chart = rangeOk
    ? continuousChart(active, fromMs, toMs)
    : { rows: [], ticks: [] };

  const columns = columnRows(chart.rows, chart.ticks);
  const curves = curveRows(chart.rows, active.length);

  const shapeLabel =
    CHART_SHAPES.find(([id]) => id === shape)?.[1] ||
    "منحنی";

  const maxLabels = narrow ? 4 : 8;

  const stride = Math.max(
    1,
    Math.ceil(chart.ticks.length / maxLabels)
  );

  const shownTicks = chart.ticks.filter(
    (_, index) => index % stride === 0
  );

  const sideMargin = narrow ? 12 : 24;

  const programs = order([
    ...workouts.map((item) => ({
      at: item.starts_on,
      kind: "برنامه تمرین",
      title: item.program?.title || "برنامه تمرین",
      detail: item.ends_on
        ? `تا ${showDate(item.ends_on)}`
        : item.status === "active"
          ? "باز"
          : "تاریخ اتمام ثبت نشده",
    })),

    ...meals.map((item) => ({
      at: item.starts_on,
      kind: "برنامه غذا",
      title: item.plan?.title || "برنامه غذا",
      detail: item.ends_on
        ? `تا ${showDate(item.ends_on)}`
        : item.status === "active"
          ? "باز"
          : "تاریخ اتمام ثبت نشده",
    })),
  ]);

  const timeline = order([
    ...active.flatMap((item) =>
      item.points.map((point) => ({
        at: point.at,
        kind: item.kind,
        title: item.label,
        detail: `${shownNumber(point.value)}${item.unit ? ` ${item.unit}` : ""}`,
      }))
    ),

    ...photos.map((photo) => ({
      at: photo.taken_at,
      kind: "عکس",
      title: "عکس بدن",
      detail: "ثبت شده",
    })),

    ...sessions.map((session) => ({
      at: session.performed_on,
      kind: "تمرین",
      title: "جلسه تمرین",
      detail: `${(session.sets || []).length.toLocaleString("fa-IR")} ست · ${
        session.status === "completed"
          ? "تمام شده"
          : "باز"
      }`,
    })),
  ]).filter((row) => inRange(row.at));

  const summaries = active.map((item) => {
    const sorted = [...item.points]
      .map((point) => ({
        ...point,
        time: timeOf(point.at),
      }))
      .sort((left, right) => left.time - right.time);

    const last =
      [...sorted]
        .reverse()
        .find((point) => point.time <= toMs) ?? null;

    const first =
      sorted.find(
        (point) =>
          point.time >= fromMs &&
          point.time <= toMs
      ) ?? null;

    const diff =
      first && last && first !== last
        ? Math.round(
            (last.value - first.value) * 100
          ) / 100
        : null;

    return {
      item,
      last,
      diff,
    };
  });

  const todayValue = todayDateValue();

  const presets = PRESETS.map(([label, count]) => ({
    label,
    value: monthsAgo(count),
  }));

  function exportCsv() {
    downloadCsv([
      ["گزارش", name || "شاگرد"],
      [],
      ["تاریخ", "نوع", "مورد", "مقدار"],
      ...timeline.map((row) => [
        showDate(row.at),
        row.kind,
        row.title,
        row.detail,
      ]),
      [],
      ["برنامه‌ها"],
      ["شروع", "نوع", "عنوان", "اتمام"],
      ...programs.map((row) => [
        showDate(row.at),
        row.kind,
        row.title,
        row.detail,
      ]),
    ]);
  }

  function printReport() {
    printDocument({
      title: `گزارش ${name || "شاگرد"}`,

      intro: `نمودار ${shapeLabel} از ${showDate(from)} تا ${showDate(to)}. مقدار واقعی هر مورد در جدول زیر است.`,

      charts: rangeOk
        ? [
            {
              title: `نمودار ${shapeLabel}`,
              shape,
              from: fromMs,
              to: toMs,

              ticks: chart.ticks.map((time) => ({
                time,
                label: monthLabel(time),
              })),

              columns: columns.map((row) => ({
                values: active.map(
                  (_, index) => row[`s${index}`] ?? null
                ),
              })),

              lines: active.map((item, index) => ({
                title: `${item.label}${item.unit ? ` (${item.unit})` : ""}`,
                color: item.color,

                points: (
                  shape === "curve"
                    ? curves
                    : chart.rows
                ).map((row, rowIndex, source) => {
                  const raw = row[`s${index}raw`];

                  const changed =
                    raw != null &&
                    raw !==
                      source[rowIndex - 1]?.[
                        `s${index}raw`
                      ];

                  return {
                    time: row.time,
                    norm: row[`s${index}`],
                    label:
                      shape === "curve" && changed
                        ? shownNumber(raw)
                        : "",
                  };
                }),
              })),
            },
          ]
        : [],

      tables: [
        {
          title: "روند",
          rows: [
            ["تاریخ", "نوع", "مورد", "مقدار"],
            ...timeline.map((row) => [
              showDate(row.at),
              row.kind,
              row.title,
              row.detail,
            ]),
          ],
        },

        {
          title: "برنامه‌ها",
          rows: [
            ["شروع", "نوع", "عنوان", "اتمام"],
            ...programs.map((row) => [
              showDate(row.at),
              row.kind,
              row.title,
              row.detail,
            ]),
          ],
        },
      ],
    });
  }

  const tooltipFormatter = (
    value,
    seriesName,
    item
  ) => {
    const index = active.findIndex(
      (entry) => entry.label === seriesName
    );

    const raw = item?.payload?.[`s${index}raw`];
    const unit = active[index]?.unit;

    return [
      raw == null
        ? "—"
        : `${shownNumber(raw)}${unit ? ` ${unit}` : ""}`,
      seriesName,
    ];
  };

  const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid #475569",
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
    fontSize: 12,
    boxShadow: "0 8px 24px -12px rgba(0,0,0,0.4)",
  };

  const listSource =
    tab === "records" ? timeline : programs;

  const shownRows = listSource.slice(0, visible);

  return (
    <div className="mt-5 flex flex-col gap-5 text-[#1F2937] transition-colors dark:text-gray-100">

      {/* ==================== سربرگ ==================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1F2937] dark:text-white">
            گزارش پیشرفت
          </h3>

          <p className="mt-1 text-sm leading-7 text-[#6B6F77] dark:text-gray-400">
            بازه و موردها را انتخاب کن تا نمودار و فهرست ثبت‌ها به‌روز شود.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button
            type="button"
            onClick={exportCsv}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm text-[#007BFF] ring-1 ring-[#D6E6FF] transition hover:bg-[#F2F8FF] dark:bg-[#182334] dark:text-blue-400 dark:ring-[#344154] dark:hover:bg-[#253247] ${focusRing}`}
          >
            <Icon name="download" />
            خروجی اکسل
          </button>

          <button
            type="button"
            onClick={printReport}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-4 py-2 text-sm text-white transition hover:bg-[#0069D9] ${focusRing}`}
          >
            <Icon name="print" />
            چاپ و PDF
          </button>
        </div>
      </div>

      {/* ==================== تنظیمات ==================== */}

      <section
        aria-label="تنظیمات گزارش"
        className="rounded-2xl bg-[#F8FAFC] p-4 transition-colors sm:p-5 dark:bg-[#141E2D]"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-medium text-[#6B6F77] dark:text-gray-400">
            از تاریخ

            <JalaliField
              value={from}
              onChange={setFrom}
              className={fieldInput}
            />
          </label>

          <label className="grid gap-2 text-xs font-medium text-[#6B6F77] dark:text-gray-400">
            تا تاریخ

            <JalaliField
              value={to}
              onChange={setTo}
              className={fieldInput}
            />
          </label>
        </div>

        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="بازه‌های آماده"
        >
          {presets.map((preset) => {
            const on =
              from === preset.value &&
              to === todayValue;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setFrom(preset.value);
                  setTo(todayValue);
                }}
                aria-pressed={on}
                className={`min-h-9 rounded-full px-4 text-xs transition ${focusRing} ${
                  on
                    ? "bg-[#007BFF] text-white"
                    : "bg-white text-[#4B5563] ring-1 ring-[#E3E8F0] hover:ring-[#BFDBFF] dark:bg-[#202B3B] dark:text-gray-300 dark:ring-[#344154] dark:hover:ring-blue-500"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {!rangeOk ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
          >
            تاریخ شروع باید قبل از تاریخ پایان باشد.
          </p>
        ) : (
          <p className="mt-3 text-xs leading-6 text-[#8A93A3] dark:text-gray-400">
            تاریخ را می‌توانی شمسی تایپ کنی، مثل ۱۴۰۵/۰۱/۰۱، یا از تقویم انتخاب کنی.
          </p>
        )}

        {/* انتخاب موردها */}

        <div className="mt-4 border-t border-[#E8ECF4] pt-4 dark:border-[#303B4D]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-[#374151] dark:text-gray-200">
              موردهای نمودار

              <span className="mr-2 text-xs font-normal text-[#8A93A3] dark:text-gray-400">
                {faDigits(active.length)} از {faDigits(series.length)}
              </span>
            </p>

            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              aria-expanded={pickerOpen}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs text-[#007BFF] ring-1 ring-[#D6E6FF] transition hover:bg-[#F2F8FF] dark:bg-[#202B3B] dark:text-blue-400 dark:ring-[#344154] dark:hover:bg-[#29384D] ${focusRing}`}
            >
              {pickerOpen
                ? "بستن فهرست"
                : "انتخاب موردها"}

              <Icon
                name="chevron"
                className={`h-3.5 w-3.5 transition ${
                  pickerOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {series.length === 0 ? (
            <p className="mt-3 text-sm text-[#A0A4AA] dark:text-gray-500">
              هنوز داده‌ای برای نمودار نیست.
            </p>
          ) : !pickerOpen ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {active.length === 0 ? (
                <p className="text-sm text-[#A0A4AA] dark:text-gray-500">
                  هیچ موردی انتخاب نشده.
                </p>
              ) : null}

              {active.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setPicked((current) => ({
                      ...current,
                      [item.id]: false,
                    }))
                  }
                  aria-label={`حذف ${item.label} از نمودار`}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-3 text-xs text-[#374151] ring-1 ring-[#E3E8F0] transition hover:ring-[#BFDBFF] dark:bg-[#202B3B] dark:text-gray-200 dark:ring-[#344154] dark:hover:ring-blue-500 ${focusRing}`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: item.color,
                    }}
                    aria-hidden="true"
                  />

                  {item.label}

                  <Icon
                    name="close"
                    className="h-3 w-3 text-[#8A93A3] dark:text-gray-400"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3 grid gap-4">
              {KIND_ORDER.map((kind) => {
                const group = series.filter(
                  (item) => item.kind === kind
                );

                if (group.length === 0) return null;

                return (
                  <div key={kind}>
                    <p className="mb-2 text-xs text-[#8A93A3] dark:text-gray-400">
                      {kind}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {group.map((item) => {
                        const on = isOn(item);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setPicked((current) => ({
                                ...current,
                                [item.id]: !on,
                              }))
                            }
                            aria-pressed={on}
                            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm transition ${focusRing} ${
                              on
                                ? "text-white shadow-sm"
                                : "bg-white text-[#6B6F77] ring-1 ring-[#E3E8F0] hover:ring-[#BFDBFF] dark:bg-[#202B3B] dark:text-gray-300 dark:ring-[#344154] dark:hover:ring-blue-500"
                            }`}
                            style={
                              on
                                ? {
                                    background: item.color,
                                  }
                                : undefined
                            }
                          >
                            {!on ? (
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  background: item.color,
                                }}
                                aria-hidden="true"
                              />
                            ) : null}

                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setPicked(
                      Object.fromEntries(
                        series.map((item) => [
                          item.id,
                          false,
                        ])
                      )
                    )
                  }
                  className={`rounded-lg px-1 text-[#6B6F77] underline underline-offset-4 dark:text-gray-400 ${focusRing}`}
                >
                  پاک کردن همه
                </button>

                <button
                  type="button"
                  onClick={() => setPicked({})}
                  className={`rounded-lg px-1 text-[#007BFF] underline underline-offset-4 dark:text-blue-400 ${focusRing}`}
                >
                  برگشت به پیش‌فرض
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================== نمودار ==================== */}

      {rangeOk ? (
        <section
          aria-label="نمودار"
          className="rounded-2xl border border-[#E8ECF4] bg-white p-4 transition-colors sm:p-5 dark:border-[#303B4D] dark:bg-[#182334]"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h4 className="text-base font-semibold text-[#1F2937] dark:text-white">
              نمودار {shapeLabel}
            </h4>

            <Segmented
              label="شکل نمودار"
              options={CHART_SHAPES}
              value={shape}
              onChange={setShape}
              className="grid-cols-2 sm:grid-cols-4"
            />
          </div>

          {active.length === 0 ? (
            <div className="mt-4">
              <EmptyBox
                emoji="📈"
                title="موردی برای نمودار انتخاب نشده"
                text="از بخش «موردهای نمودار» حداقل یک مورد را روشن کن."
              />
            </div>
          ) : (
            <>
              {/* خلاصه موارد */}

              <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {summaries.map(
                  ({ item, last, diff }) => (
                    <li
                      key={item.id}
                      className="relative overflow-hidden rounded-2xl border border-[#EEF1F6] bg-[#FAFBFD] px-4 py-3 dark:border-[#303B4D] dark:bg-[#202B3B]"
                    >
                      <span
                        className="absolute inset-y-0 right-0 w-1"
                        style={{
                          background: item.color,
                        }}
                        aria-hidden="true"
                      />

                      <p className="truncate text-xs text-[#6B6F77] dark:text-gray-400">
                        {item.label}
                      </p>

                      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="text-lg font-bold text-[#1F2937] dark:text-white">
                          {last
                            ? shownNumber(last.value)
                            : "—"}

                          {last && item.unit ? (
                            <span className="mr-1 text-xs font-normal text-[#8A93A3] dark:text-gray-400">
                              {item.unit}
                            </span>
                          ) : null}
                        </p>

                        {diff != null ? (
                          <span
                            dir="ltr"
                            className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#4B5563] ring-1 ring-[#E3E8F0] dark:bg-[#182334] dark:text-gray-300 dark:ring-[#475569]"
                          >
                            {diff > 0
                              ? "▲ "
                              : diff < 0
                                ? "▼ "
                                : ""}

                            {diff === 0
                              ? "بدون تغییر"
                              : shownNumber(
                                  Math.abs(diff)
                                )}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  )
                )}
              </ul>

              {/* نمودار Recharts */}

              <div
                className="mt-4 h-64 sm:h-80"
                role="img"
                aria-label={`نمودار ${shapeLabel} برای ${active
                  .map((item) => item.label)
                  .join("، ")}`}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  {shape === "column" ? (
                    <BarChart
                      data={columns}
                      margin={{
                        top: 8,
                        right: sideMargin,
                        left: sideMargin,
                        bottom: 8,
                      }}
                    >
                      <CartesianGrid
                        stroke={
                          "var(--chart-grid, #EEF1F6)"
                        }
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        interval={stride - 1}
                        tick={{
                          fontSize: 11,
                          fill: "#94A3B8",
                        }}
                        axisLine={{
                          stroke: "#475569",
                        }}
                        tickLine={false}
                      />

                      <YAxis
                        hide
                        domain={[0, 100]}
                      />

                      <Tooltip
                        cursor={{
                          fill: "rgba(0,123,255,0.08)",
                        }}
                        contentStyle={tooltipStyle}
                        labelStyle={{
                          color: "#F8FAFC",
                        }}
                        itemStyle={{
                          color: "#E2E8F0",
                        }}
                        labelFormatter={(value) => value}
                        formatter={tooltipFormatter}
                      />

                      {active.map((item, index) => (
                        <Bar
                          key={item.id}
                          dataKey={`s${index}`}
                          name={item.label}
                          fill={item.color}
                          maxBarSize={22}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart
                      data={
                        shape === "curve"
                          ? curves
                          : chart.rows
                      }
                      margin={{
                        top:
                          shape === "curve" ? 28 : 8,
                        right: sideMargin,
                        left: sideMargin,
                        bottom: 8,
                      }}
                    >
                      <CartesianGrid
                        stroke="#334155"
                        strokeOpacity={0.35}
                        vertical={false}
                      />

                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={[fromMs, toMs]}
                        scale="time"
                        ticks={shownTicks}
                        interval={0}
                        tickFormatter={monthLabel}
                        tick={{
                          fontSize: 11,
                          fill: "#94A3B8",
                        }}
                        axisLine={{
                          stroke: "#475569",
                        }}
                        tickLine={{
                          stroke: "#475569",
                        }}
                      />

                      <YAxis
                        hide
                        domain={
                          shape === "curve"
                            ? [0, 118]
                            : [0, 100]
                        }
                      />

                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{
                          color: "#F8FAFC",
                        }}
                        itemStyle={{
                          color: "#E2E8F0",
                        }}
                        labelFormatter={(value) =>
                          showDate(
                            new Date(Number(value))
                          )
                        }
                        formatter={tooltipFormatter}
                      />

                      {active.map((item, index) => (
                        <Line
                          key={item.id}
                          type={
                            shape === "curve"
                              ? "monotone"
                              : "stepAfter"
                          }
                          dataKey={`s${index}`}
                          name={item.label}
                          stroke={item.color}
                          strokeWidth={2.5}
                          connectNulls
                          dot={
                            shape === "line"
                              ? false
                              : (props) => {
                                  const source =
                                    shape === "curve"
                                      ? curves
                                      : chart.rows;

                                  const raw =
                                    props.payload?.[
                                      `s${index}raw`
                                    ];

                                  const previous =
                                    source[props.index - 1]?.[
                                      `s${index}raw`
                                    ];

                                  if (
                                    props.cx == null ||
                                    raw == null ||
                                    raw === previous
                                  ) {
                                    return null;
                                  }

                                  const lift =
                                    12 + (index % 3) * 11;

                                  return (
                                    <g
                                      key={`${item.id}-${props.index}`}
                                    >
                                      <circle
                                        cx={props.cx}
                                        cy={props.cy}
                                        r={4.5}
                                        fill={item.color}
                                        stroke="#fff"
                                        strokeWidth={1.5}
                                      />

                                      {shape === "curve" ? (
                                        <text
                                          x={props.cx}
                                          y={
                                            props.cy - lift
                                          }
                                          textAnchor="middle"
                                          fontSize="10"
                                          fill={item.color}
                                        >
                                          {shownNumber(raw)}
                                        </text>
                                      ) : null}
                                    </g>
                                  );
                                }
                          }
                        />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-[#8A93A3] dark:text-gray-400">
                <Icon
                  name="info"
                  className="mt-1 h-3.5 w-3.5 shrink-0"
                />

                <span>
                  {SHAPE_HINT[shape]} هر مورد در مقیاس خودش کشیده می‌شود تا موردهای با واحد متفاوت کنار هم دیده شوند؛ مقدار واقعی را با{" "}
                  {narrow
                    ? "لمس"
                    : "نگه داشتن ماوس روی"}{" "}
                  نمودار ببین.
                </span>
              </p>
            </>
          )}
        </section>
      ) : null}



      <section
        aria-label="فهرست ثبت‌ها"
        className="rounded-2xl border border-[#E8ECF4] bg-white p-4 transition-colors sm:p-5 dark:border-[#303B4D] dark:bg-[#182334]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            label="نوع فهرست"
            options={[
              [
                "records",
                `ثبت‌های این بازه (${faDigits(timeline.length)})`,
              ],
              [
                "programs",
                `برنامه‌ها (${faDigits(programs.length)})`,
              ],
            ]}
            value={tab}
            onChange={(id) => {
              setTab(id);
              setVisible(12);
            }}
            className="grid-cols-2"
          />

          <Segmented
            label="مرتب‌سازی تاریخ"
            options={[
              ["desc", "جدیدترین"],
              ["asc", "قدیمی‌ترین"],
            ]}
            value={sort}
            onChange={setSort}
            className="grid-cols-2 sm:w-60"
          />
        </div>

        <div
          className="mt-4"
          aria-live="polite"
        >
          {listSource.length === 0 ? (
            tab === "records" ? (
              <EmptyBox
                emoji="🗂️"
                title="در این بازه ثبتی نیست"
                text="بازه را بزرگ‌تر کن یا موردهای بیشتری را انتخاب کن."
              />
            ) : (
              <EmptyBox
                emoji="📋"
                title={programsEmpty}
              />
            )
          ) : (
            <>
              <ul className="grid gap-2">
                {shownRows.map((row, index) => (
                  <Row
                    key={`${row.kind}-${row.title}-${row.at}-${index}`}
                    at={row.at}
                    kind={row.kind}
                    title={row.title}
                    detail={row.detail}
                  />
                ))}
              </ul>

              {listSource.length > visible ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisible((count) => count + 20)
                  }
                  className={`mt-3 min-h-11 w-full rounded-2xl bg-[#F5F7FB] text-sm text-[#007BFF] transition hover:bg-[#EAF1FB] dark:bg-[#202B3B] dark:text-blue-400 dark:hover:bg-[#29384D] ${focusRing}`}
                >
                  نمایش بیشتر (
                  {faDigits(
                    listSource.length - visible
                  )}{" "}
                  مورد دیگر)
                </button>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* ==================== توضیحات ==================== */}

      <p className="flex items-start gap-2 text-xs leading-6 text-[#A0A4AA] dark:text-gray-500">
        <Icon
          name="info"
          className="mt-1 h-3.5 w-3.5 shrink-0"
        />

        <span>
          برای PDF، در پنجره چاپ مقصد را «ذخیره به صورت PDF» بگذار. تاریخ ذخیره‌شده در سیستم میلادی می‌ماند و اینجا شمسی دیده می‌شود.
        </span>
      </p>
    </div>
  );
}
