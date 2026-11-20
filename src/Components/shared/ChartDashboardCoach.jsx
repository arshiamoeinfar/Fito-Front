
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ==================== داده‌های نمونه ====================

const dataByRange = {
  "7 روز": [
    { day: "شنبه", weight: 70, fat: 22, muscle: 35 },
    { day: "یکشنبه", weight: 89, fat: 20, muscle: 37 },
    { day: "دوشنبه", weight: 81, fat: 19, muscle: 38 },
    { day: "سه‌شنبه", weight: 102, fat: 18, muscle: 39 },
    { day: "چهارشنبه", weight: 128, fat: 17, muscle: 40 },
    { day: "پنجشنبه", weight: 78, fat: 18, muscle: 39 },
    { day: "جمعه", weight: 115, fat: 17, muscle: 41 },
  ],
  "30 روز": [
    { day: "هفته ۱", weight: 76, fat: 23, muscle: 34 },
    { day: "هفته ۲", weight: 82, fat: 22, muscle: 36 },
    { day: "هفته ۳", weight: 79, fat: 21, muscle: 37 },
    { day: "هفته ۴", weight: 88, fat: 20, muscle: 38 },
  ],
  "3 ماه": [
    { day: "فروردین", weight: 82, fat: 24, muscle: 33 },
    { day: "اردیبهشت", weight: 79, fat: 22, muscle: 35 },
    { day: "خرداد", weight: 85, fat: 21, muscle: 37 },
  ],
};

// ==================== تنظیمات متریک‌ها ====================

const metrics = {
  وزن: {
    dataKey: "weight",
    color: "#007BFF",
    domain: [60, 140],
    ticks: [60, 80, 100, 120, 140],
    unit: "کیلوگرم",
  },
  چربی: {
    dataKey: "fat",
    color: "#6BAF41",
    domain: [10, 30],
    ticks: [10, 15, 20, 25, 30],
    unit: "درصد",
  },
  عضله: {
    dataKey: "muscle",
    color: "#6366F1",
    domain: [30, 45],
    ticks: [30, 35, 40, 45],
    unit: "کیلوگرم",
  },
};

// ==================== توابع کمکی ====================

function daysOf(range) {
  if (range === "30 روز") return 30;
  if (range === "3 ماه") return 90;
  return 7;
}

function coveringRange(points, dataKey) {
  const ranges = [
    ["7 روز", 7],
    ["30 روز", 30],
    ["3 ماه", 90],
  ];

  for (const [label, days] of ranges) {
    const count = points.filter((point) => {
      const time = new Date(point.at).getTime();

      return (
        Number.isFinite(time) &&
        Math.abs(Date.now() - time) <= days * 86400000 &&
        point[dataKey] !== null &&
        point[dataKey] !== undefined &&
        point[dataKey] !== "" &&
        Number.isFinite(Number(point[dataKey]))
      );
    }).length;

    if (count >= 2) return label;
  }

  return "3 ماه";
}

// ==================== Skeleton ====================

function ProgressChartSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-6 w-40 rounded-lg bg-slate-200 dark:bg-white/10" />

        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-10 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
      </div>

      <div className="flex h-[260px] items-end gap-2 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.03] sm:h-[320px]">
        {[40, 55, 45, 75, 60, 85, 65, 72, 50, 90].map(
          (height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-lg bg-slate-200 dark:bg-white/10"
              style={{ height: `${height}%` }}
            />
          )
        )}
      </div>

      <div className="flex justify-center gap-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-3 w-16 rounded-full bg-slate-200 dark:bg-white/10"
          />
        ))}
      </div>
    </div>
  );
}

// ==================== تولتیپ سفارشی ====================

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0];

  return (
    <div
      dir="rtl"
      className="max-w-[min(240px,85vw)] rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-xl sm:px-4 sm:py-3"
    >
      <p className="mb-1 text-[11px] text-slate-400 sm:text-xs">
        {label}
      </p>

      <p className="text-xs font-bold text-slate-800 sm:text-sm">
        {item.name}: {item.value} {unit}
      </p>
    </div>
  );
};

// ==================== فیلتر dropdown ====================

const FilterPill = ({ value, options, onChange, label }) => {
  return (
    <div className="relative min-w-0 flex-1 sm:flex-none">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-full border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:h-11 sm:px-8 sm:pl-9 sm:text-sm"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 sm:left-3 sm:h-4 sm:w-4" />
    </div>
  );
};

// ==================== کامپوننت اصلی ====================

const ProgressChart = ({ points = null, loading = false }) => {
  const [range, setRange] = useState(null);
  const [metric, setMetric] = useState("وزن");

  const currentMetric = metrics[metric];

  const chosen = useMemo(
    () =>
      range ??
      (Array.isArray(points)
        ? coveringRange(points, currentMetric.dataKey)
        : "7 روز"),
    [range, points, currentMetric.dataKey]
  );

  const chartData = useMemo(() => {
    if (!Array.isArray(points)) {
      return dataByRange[chosen] || [];
    }

    return points.filter((point) => {
      const time = new Date(point.at).getTime();

      const recent =
        !Number.isFinite(time) ||
        Math.abs(Date.now() - time) <= daysOf(chosen) * 86400000;

      const value = point[currentMetric.dataKey];

      return (
        recent &&
        value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isFinite(Number(value))
      );
    });
  }, [points, chosen, currentMetric.dataKey]);

  const values = useMemo(
    () =>
      chartData
        .map((point) => Number(point[currentMetric.dataKey]))
        .filter((value) => Number.isFinite(value)),
    [chartData, currentMetric.dataKey]
  );

  const padding = values.length
    ? Math.max(
        1,
        Math.round(
          (Math.max(...values) - Math.min(...values)) * 0.2
        )
      )
    : 1;

  const domain = values.length
    ? [
        Math.floor(Math.min(...values) - padding),
        Math.ceil(Math.max(...values) + padding),
      ]
    : currentMetric.domain;

  const gradientId = `areaGradient-${currentMetric.dataKey}`;
  const hasData = chartData.length > 0;

  return (
    <section
      dir="rtl"
      className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-5 md:p-6 lg:p-7"
    >
      {loading ? (
        <ProgressChartSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl text-[#6B6F77] font-primary">
                روند پیشرفت شاگرد
              </h2>

              <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                بررسی تغییرات و عملکرد بدنی شاگرد
              </p>
            </div>

            {/* Filters */}
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              <FilterPill
                label="بازه زمانی"
                value={chosen}
                options={Object.keys(dataByRange)}
                onChange={setRange}
              />

              <FilterPill
                label="نوع اندازه‌گیری"
                value={metric}
                options={Object.keys(metrics)}
                onChange={setMetric}
              />
            </div>
          </div>

          {/* Metric information */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: currentMetric.color }}
              />

              <span className="text-xs font-semibold text-slate-600 sm:text-sm">
                {metric}
              </span>

              <span className="text-[10px] text-slate-400 sm:text-xs">
                ({currentMetric.unit})
              </span>
            </div>

            {hasData && (
              <span className="text-[10px] text-slate-400 sm:text-xs">
                {chartData.length.toLocaleString("fa-IR")} اندازه‌گیری
              </span>
            )}
          </div>

          {/* Chart */}
          <div className="relative min-h-[240px] w-full min-w-0 flex-1 sm:min-h-[300px] lg:min-h-[320px]">
            {!hasData ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 py-10 text-center dark:bg-white/[0.03]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path
                      d="M3 17l5-5 4 3 8-9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 6h5v5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <p className="text-sm font-semibold text-slate-600">
                  اندازه‌گیری بدنی در این بازه نیست
                </p>

                <p className="mt-1 max-w-xs text-xs leading-6 text-slate-400">
                  با ثبت اندازه‌گیری‌های جدید، روند پیشرفت شاگرد در این قسمت نمایش داده می‌شود.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 12,
                    right: 4,
                    left: 0,
                    bottom: 4,
                  }}
                >
                  <defs>
                    <linearGradient
                      id={gradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={currentMetric.color}
                        stopOpacity={0.28}
                      />

                      <stop
                        offset="100%"
                        stopColor={currentMetric.color}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#DCE3EB"
                    strokeDasharray="5 5"
                    vertical
                    horizontal
                  />

                  <XAxis
                    dataKey="day"
                    tick={{
                      fill: "#777",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={{ stroke: "#8FA7C0" }}
                    tickMargin={10}
                    minTickGap={12}
                  />

                  <YAxis
                    domain={domain}
                    ticks={
                      Array.isArray(points)
                        ? undefined
                        : currentMetric.ticks
                    }
                    tickMargin={8}
                    width={42}
                    tick={{
                      fill: "#777",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={{ stroke: "#8FA7C0" }}
                  />

                  <Tooltip
                    content={
                      <CustomTooltip unit={currentMetric.unit} />
                    }
                    cursor={{
                      stroke: "#007BFF",
                      strokeDasharray: "5 5",
                    }}
                  />

                  <Area
                    type="natural"
                    dataKey={currentMetric.dataKey}
                    name={metric}
                    stroke={currentMetric.color}
                    strokeWidth={2.5}
                    fill={`url(#${gradientId})`}
                    fillOpacity={1}
                    dot={
                      chartData.length <= 2
                        ? {
                            r: 4,
                            strokeWidth: 2,
                            fill: "#fff",
                            stroke: currentMetric.color,
                          }
                        : false
                    }
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      fill: "#fff",
                      stroke: currentMetric.color,
                    }}
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default ProgressChart;
