
import React, { useMemo } from "react";
import SegmentedControl from "../SegmentedControl/SegmentedControl";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/* ───────────────────────── تقویم جلالی ───────────────────────── */

const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;

function jalCal(jy) {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;

  for (let i = 1; i < BREAKS.length; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;

    if (jy < jm) break;

    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  const n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);

  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  let m = n;

  if (jump - m < 6) {
    m = m - jump + div(jump + 4, 33) * 33;
  }

  let leap = mod(mod(m + 1, 33) - 1, 4);

  if (leap === -1) leap = 4;

  return { gy, march, leap };
}

function g2d(gy, gm, gd) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;

  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;

  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;

  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);

  return { gy, gm, gd };
}

function toJalaali(gy, gm, gd) {
  const jdn = g2d(gy, gm, gd);
  const year = d2g(jdn).gy;
  let jy = year - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(year, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }

    k -= 186;
  } else {
    jy -= 1;
    k += 179;

    if (r.leap === 1) k += 1;
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/* ───────────────────────── ابزارهای تاریخ و متن ───────────────────────── */

const MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر",
  "مرداد", "شهریور", "مهر", "آبان",
  "آذر", "دی", "بهمن", "اسفند",
];

const WEEKDAYS = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
  "چهارشنبه", "پنجشنبه", "جمعه",
];

const KINDS = ["7d", "1m", "3m", "1y"];

const pad = (n) => String(n).padStart(2, "0");
const toIso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const fa = (value, digits = 0) =>
  Number(value).toLocaleString("fa-IR", {
    useGrouping: false,
    maximumFractionDigits: digits,
  });

function parseIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function todayIso() {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function jOf(iso) {
  const { y, m, d } = parseIso(iso);
  return toJalaali(y, m, d);
}

function addDays(iso, amount) {
  const { y, m, d } = parseIso(iso);
  const date = new Date(Date.UTC(y, m - 1, d + amount));

  return toIso(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

function diffDays(a, b) {
  const pa = parseIso(a);
  const pb = parseIso(b);

  return Math.round(
    (Date.UTC(pa.y, pa.m - 1, pa.d) -
      Date.UTC(pb.y, pb.m - 1, pb.d)) /
      86400000
  );
}

function weekdayOf(iso) {
  const { y, m, d } = parseIso(iso);
  return (new Date(y, m - 1, d).getDay() + 1) % 7;
}

function numberOf(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateOf(point) {
  const raw =
    point?.date ??
    point?.measured_on ??
    point?.measured_at ??
    point?.recorded_at ??
    point?.created_at;

  if (!raw) return null;

  const text = String(raw);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return /^\d{4}-\d{2}-\d{2}/.test(text)
      ? text.slice(0, 10)
      : null;
  }

  return toIso(
    parsed.getFullYear(),
    parsed.getMonth() + 1,
    parsed.getDate()
  );
}

function resolveKind(range, ranges) {
  const text = String(range ?? "").trim();

  if (KINDS.includes(text)) return text;

  let index = ranges.findIndex(
    (item) => item.id === text || item.label === text
  );

  if (index === -1) {
    index = ranges.findIndex(
      (item) => String(item.id) === text
    );
  }

  return KINDS[index === -1 ? 0 : index] || "7d";
}

/* ───────────────────────── ساخت بازه‌ها ───────────────────────── */

function dayLabel(iso, withYear = true) {
  const j = jOf(iso);

  return `${fa(j.jd)} ${MONTHS[j.jm - 1]}${
    withYear ? ` ${fa(j.jy, 0)}` : ""
  }`;
}

function buildBuckets(kind, endIso) {
  if (kind === "1y") {
    const end = jOf(endIso);
    const base = end.jy * 12 + end.jm - 1;

    return Array.from({ length: 12 }, (_, i) => {
      const index = base - (11 - i);
      const jy = div(index, 12);
      const jm = mod(index, 12) + 1;

      return {
        key: `${jy}-${pad(jm)}`,
        type: "month",
        jy,
        jm,
        jd: 1,
        index,
        fullLabel: `${MONTHS[jm - 1]} ${fa(jy)}`,
        values: [],
      };
    });
  }

  const count = kind === "7d" ? 7 : kind === "1m" ? 30 : 13;
  const size = kind === "3m" ? 7 : 1;

  return Array.from({ length: count }, (_, i) => {
    const bucketEnd = addDays(endIso, -(count - 1 - i) * size);
    const bucketStart = addDays(bucketEnd, -(size - 1));
    const j = jOf(bucketStart);
    const weekday = weekdayOf(bucketStart);

    return {
      key: bucketStart,
      type: size === 1 ? "day" : "week",
      start: bucketStart,
      end: bucketEnd,
      jy: j.jy,
      jm: j.jm,
      jd: j.jd,
      weekday,
      fullLabel:
        size === 1
          ? `${WEEKDAYS[weekday]} ${dayLabel(bucketStart)}`
          : `هفته ${dayLabel(bucketStart, false)} تا ${dayLabel(bucketEnd)}`,
      values: [],
    };
  });
}

function placeInBucket(kind, buckets, endIso, iso) {
  if (kind === "1y") {
    const j = jOf(iso);
    const position =
      buckets.length -
      1 -
      (buckets[buckets.length - 1].index -
        (j.jy * 12 + j.jm - 1));

    return position >= 0 && position < buckets.length
      ? position
      : -1;
  }

  const size = kind === "3m" ? 7 : 1;
  const diff = diffDays(endIso, iso);

  if (diff < 0 || diff >= buckets.length * size) {
    return -1;
  }

  return buckets.length - 1 - Math.floor(diff / size);
}

function whichTicks(kind, length) {
  const every = kind === "1m" ? 5 : kind === "3m" ? 2 : 1;

  return Array.from({ length }, (_, i) => i).filter(
    (i) => (length - 1 - i) % every === 0
  );
}

function tickParts(kind, bucket, previous, isFirst) {
  if (kind === "7d") {
    return {
      top: WEEKDAYS[bucket.weekday],
      bottom:
        isFirst || bucket.jd === 1
          ? `${fa(bucket.jd)} ${MONTHS[bucket.jm - 1]}`
          : fa(bucket.jd),
    };
  }

  if (kind === "1y") {
    return {
      top:
        isFirst ||
        bucket.jm === 1 ||
        previous?.jy !== bucket.jy
          ? fa(bucket.jy)
          : "",
      bottom: MONTHS[bucket.jm - 1],
    };
  }

  return {
    top:
      isFirst || previous?.jm !== bucket.jm
        ? MONTHS[bucket.jm - 1]
        : "",
    bottom: fa(bucket.jd),
  };
}

function captionOf(kind, buckets) {
  const first = buckets[0];
  const last = buckets[buckets.length - 1];

  if (kind === "1y") {
    return `${MONTHS[first.jm - 1]} ${fa(first.jy)} تا ${MONTHS[last.jm - 1]} ${fa(last.jy)}`;
  }

  return `${dayLabel(first.start)} تا ${dayLabel(last.end)}`;
}

function average(list) {
  return Math.round(
    (list.reduce((sum, value) => sum + value, 0) / list.length) * 10
  ) / 10;
}

/* ───────────────────────── ساخت داده نمودار ───────────────────────── */

function buildChart(points, metrics, kind, endIso) {
  const dated = points
    .map((point) => ({ point, iso: dateOf(point) }))
    .filter((row) => row.iso);

  if (!dated.length) {
    return {
      legacy: true,
      rows: points.map((point, index) => ({
        ...point,
        key: `${point.day}-${index}`,
        fullLabel: point.day,
      })),
      ticks: undefined,
      tickInfo: {},
      caption: "",
    };
  }

  const buckets = buildBuckets(kind, endIso);
  const sorted = dated
    .slice()
    .sort((a, b) =>
      a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0
    );

  for (const { point, iso } of sorted) {
    const position = placeInBucket(kind, buckets, endIso, iso);

    if (position !== -1) {
      buckets[position].values.push(point);
    }
  }

  const rows = buckets.map((bucket) => {
    const row = {
      key: bucket.key,
      fullLabel: bucket.fullLabel,
      aggregated: bucket.type !== "day",
      count: bucket.values.length,
    };

    for (const metric of metrics) {
      const numbers = bucket.values
        .map((point) => numberOf(point[metric.key]))
        .filter((value) => value !== null);

      if (!numbers.length) {
        row[metric.key] = null;
      } else if (bucket.type === "day") {
        row[metric.key] = numbers[numbers.length - 1];
      } else {
        row[metric.key] = average(numbers);
      }
    }

    return row;
  });

  const visible = whichTicks(kind, buckets.length);
  const tickInfo = {};
  let previous = null;

  visible.forEach((index, order) => {
    tickInfo[buckets[index].key] = tickParts(
      kind,
      buckets[index],
      previous,
      order === 0
    );

    previous = buckets[index];
  });

  return {
    legacy: false,
    rows,
    ticks: visible.map((index) => buckets[index].key),
    tickInfo,
    caption: captionOf(kind, buckets),
  };
}

/* ───────────────────────── اجزای نمودار ───────────────────────── */

function AxisTick({ x, y, payload, tickInfo }) {
  const info = tickInfo[payload.value];

  if (!info) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="middle"
        y={19}
        fill="var(--muted)"
        fontSize={10}
        opacity={0.8}
      >
        {info.top}
      </text>

      <text
        textAnchor="middle"
        y={36}
        fill="var(--muted)"
        fontSize={11}
        fontWeight={600}
      >
        {info.bottom}
      </text>
    </g>
  );
}

const CustomTooltip = ({ active, payload, metrics }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const row = payload[0]?.payload;

  return (
    <div
      className="max-w-[min(260px,85vw)] rounded-xl border border-border bg-surface px-3 py-2.5 shadow-lg sm:px-4 sm:py-3"
      dir="rtl"
    >
      <p className="mb-2 text-xs font-bold text-foreground sm:text-sm">
        {row?.fullLabel || row?.day}
      </p>

      {metrics.map((metric) => {
        const val = numberOf(row?.[metric.key]);

        if (val === null) return null;

        return (
          <p
            key={metric.key}
            className={`text-xs sm:text-sm ${metric.textClass || ""}`}
          >
            {metric.label}: {fa(val, 1)} {metric.unit}
          </p>
        );
      })}

      {row?.aggregated && row?.count > 1 && (
        <p className="mt-2 text-[10px] text-muted sm:text-xs">
          میانگین {fa(row.count)} اندازه‌گیری
        </p>
      )}
    </div>
  );
};

/* ───────────────────────── Skeleton ───────────────────────── */

function ChartSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-4 rounded-2xl bg-surface p-3 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-24 rounded-lg bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-16 rounded-lg bg-gray-200 dark:bg-white/10" />
      </div>

      <div className="flex h-64 items-end gap-2 sm:h-80">
        {[35, 55, 42, 70, 50, 82, 60, 75, 45, 65, 52, 90].map(
          (height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-lg bg-gray-200 dark:bg-white/10"
              style={{ height: `${height}%` }}
            />
          )
        )}
      </div>

      <div className="flex justify-center gap-5">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-3 w-16 rounded-lg bg-gray-200 dark:bg-white/10"
          />
        ))}
      </div>
    </div>
  );
};

/* ───────────────────────── کامپوننت اصلی ───────────────────────── */

export default function BodyChangeChart({
  points = [],
  athletes = [],
  athleteId = "",
  onAthlete,
  onRange,
  range = "",
  endDate,
  title = "روند تغییرات وزن، چربی و عضله",
  metrics = [
    {
      key: "weight",
      label: "وزن",
      unit: "کیلوگرم",
      color: "#007BFF",
      textClass: "text-primary",
      gradientId: "weightGradient",
    },
    {
      key: "fat",
      label: "چربی",
      unit: "٪",
      color: "#6BAF41",
      textClass: "text-success",
      gradientId: "fatGradient",
    },
    {
      key: "muscle",
      label: "عضله",
      unit: "کیلوگرم",
      color: "#6366F1",
      textClass: "text-[#6366F1]",
      gradientId: "muscleGradient",
    },
  ],
  ranges = [
    { id: "7d", label: "7 روز" },
    { id: "1m", label: "1 ماه" },
    { id: "3m", label: "3 ماه" },
    { id: "1y", label: "1 سال" },
  ],
  loading = false,
}) {
  const kind = resolveKind(range, ranges);
  const endIso = endDate
    ? String(endDate).slice(0, 10)
    : todayIso();

  const chart = useMemo(
    () => buildChart(points, metrics, kind, endIso),
    [points, metrics, kind, endIso]
  );

  const numbers = chart.rows.flatMap((row) =>
    metrics
      .map((metric) => numberOf(row[metric.key]))
      .filter((value) => value !== null)
  );

  const lowest = numbers.length ? Math.min(...numbers) : 60;
  const highest = numbers.length ? Math.max(...numbers) : 140;
  const padding = Math.max(
    1,
    Math.round((highest - lowest) * 0.15)
  );

  const domainMin = Math.floor(lowest - padding);
  const domainMax = Math.ceil(highest + padding);
  const hasData = numbers.length > 0;

  return (
    <section
      dir="rtl"
      className="w-full min-w-0 overflow-hidden rounded-2xl bg-surface p-3.5 sm:rounded-3xl sm:p-5 lg:p-6"
    >
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-primary text-[#6B6F77] md:text-xl">
            {title}
          </h2>

          {chart.caption && (
            <p className="mt-1 text-xs text-muted sm:text-sm">
              {chart.caption}
            </p>
          )}
        </div>

        <div className="flex w-full min-w-0 items-center justify-start lg:w-auto lg:justify-end">
          <div className="w-full max-w-full overflow-x-auto lg:w-auto">
            <div className="flex min-w-0 justify-start lg:justify-end">
              <SegmentedControl
                item1={ranges[0]?.label}
                item2={ranges[1]?.label}
                item3={ranges[2]?.label}
                item4={ranges[3]?.label}
                initial={range}
                onChange={onRange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Athlete selector */}
      {athletes.length > 1 && (
        <label
          className="mt-4 grid w-full max-w-full gap-2 text-right text-xs text-muted sm:max-w-xs"
          dir="rtl"
        >
          شاگرد
          <select
            value={athleteId}
            onChange={(event) => onAthlete?.(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary sm:rounded-2xl sm:px-4"
          >
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {athletes.length === 1 && (
        <p className="mt-3 text-right text-xs text-muted sm:text-sm" dir="rtl">
          {athletes[0].name}
        </p>
      )}

      {/* Chart */}
      <div className="mt-4 min-w-0">
        {loading ? (
          <ChartSkeleton />
        ) : !hasData ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl bg-gray-50 px-4 py-12 text-center dark:bg-white/[0.03] sm:min-h-[280px]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/10">
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

            <p className="text-sm font-semibold text-foreground">
              هنوز داده‌ای برای نمایش وجود ندارد
            </p>

            <p className="mt-1 max-w-xs text-xs leading-6 text-muted">
              اندازه‌گیری‌های بدنی شاگرد در این بازه زمانی نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <div className="w-full min-w-0 rounded-2xl bg-surface p-1.5 sm:rounded-3xl sm:p-4 lg:p-5">
            <div className="h-[250px] w-full min-w-0 sm:h-[310px] lg:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chart.rows}
                  margin={{
                    top: 12,
                    right: 4,
                    left: 0,
                    bottom: 8,
                  }}
                >
                  <defs>
                    {metrics.map((metric) => (
                      <linearGradient
                        key={metric.gradientId}
                        id={metric.gradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={metric.color}
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor={metric.color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="5 5"
                    vertical
                    horizontal
                  />

                  {chart.legacy ? (
                    <XAxis
                      dataKey="day"
                      tick={{
                        fill: "var(--muted)",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={{ stroke: "var(--border)" }}
                      tickMargin={10}
                      minTickGap={12}
                    />
                  ) : (
                    <XAxis
                      dataKey="key"
                      ticks={chart.ticks}
                      interval={0}
                      height={48}
                      padding={{ left: 6, right: 6 }}
                      axisLine={false}
                      tickLine={{ stroke: "var(--border)" }}
                      tick={<AxisTick tickInfo={chart.tickInfo} />}
                    />
                  )}

                  <YAxis
                    domain={[domainMin, domainMax]}
                    tickMargin={8}
                    width={42}
                    tickFormatter={(value) => fa(value, 1)}
                    tick={{
                      fill: "var(--muted)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={{ stroke: "var(--border)" }}
                  />

                  <Tooltip
                    content={<CustomTooltip metrics={metrics} />}
                    cursor={{
                      stroke: "#007BFF",
                      strokeDasharray: "5 5",
                    }}
                  />

                  {metrics.map((metric) => {
                    const filled = chart.rows.filter(
                      (row) => numberOf(row[metric.key]) !== null
                    ).length;

                    return (
                      <Area
                        key={metric.key}
                        type="natural"
                        dataKey={metric.key}
                        name={metric.label}
                        stroke={metric.color}
                        strokeWidth={2.5}
                        fill={`url(#${metric.gradientId})`}
                        fillOpacity={1}
                        connectNulls
                        dot={
                          filled < 3
                            ? {
                                r: 3.5,
                                strokeWidth: 2,
                                fill: "#fff",
                                stroke: metric.color,
                              }
                            : false
                        }
                        activeDot={{
                          r: 5,
                          strokeWidth: 2,
                          fill: "#fff",
                          stroke: metric.color,
                        }}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:mt-5 sm:gap-x-8">
              {metrics.map((metric) => (
                <div
                  key={metric.key}
                  className="flex min-w-0 items-center gap-1.5 sm:gap-2"
                >
                  <span
                    className="h-[3px] w-5 shrink-0 rounded-full sm:w-8"
                    style={{ backgroundColor: metric.color }}
                  />

                  <span className="text-[10px] text-muted sm:text-xs">
                    {metric.label} ({metric.unit})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
