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

/* ════════════════════════════════════════════════════════════════
   داده‌ای که نمودار انتظار دارد (prop: points)

   [{ date: "2026-11-05", weight: 82.4, fat: 18.2, muscle: 36.1 }, ...]

   • date: تاریخ میلادی YYYY-MM-DD (تاریخ‌ساعت هم قبول است).
     اسم‌های measured_on / measured_at / recorded_at / created_at هم خوانده می‌شود.
   • اگر هیچ نقطه‌ای date نداشته باشد، نمودار مثل قبل با فیلد `day` کار می‌کند.
   ════════════════════════════════════════════════════════════════ */

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

    if (jy < jm) {
      break;
    }

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

  if (leap === -1) {
    leap = 4;
  }

  return { gy, march, leap };
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
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

    if (r.leap === 1) {
      k += 1;
    }
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/* ───────────────────────── ابزارهای تاریخ و متن ───────────────────────── */

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const KINDS = ["7d", "1m", "3m", "1y"];

const pad = (n) => String(n).padStart(2, "0");
const toIso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const fa = (value, digits = 0) =>
  Number(value).toLocaleString("fa-IR", { useGrouping: false, maximumFractionDigits: digits });

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

  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function diffDays(a, b) {
  const pa = parseIso(a);
  const pb = parseIso(b);

  return Math.round((Date.UTC(pa.y, pa.m - 1, pa.d) - Date.UTC(pb.y, pb.m - 1, pb.d)) / 86400000);
}

// شنبه = ۰ ... جمعه = ۶
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
  const raw = point?.date ?? point?.measured_on ?? point?.measured_at ?? point?.recorded_at ?? point?.created_at;

  if (!raw) {
    return null;
  }

  const text = String(raw);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
  }

  // تاریخ‌ساعت: بر اساس زمان محلی کاربر
  return toIso(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}

function resolveKind(range, ranges) {
  const text = String(range ?? "").trim();

  if (KINDS.includes(text)) {
    return text;
  }

  let index = ranges.findIndex((item) => item.id === text || item.label === text);

  if (index === -1) {
    index = ranges.findIndex((item) => String(item.id) === text);
  }

  // اگر هیچ‌چیز انتخاب نشده، SegmentedControl اولین گزینه را نشان می‌دهد
  return KINDS[index === -1 ? 0 : index] || "7d";
}

/* ───────────────────────── ساختن بازه‌ها (bucket) ───────────────────────── */

function dayLabel(iso, withYear = true) {
  const j = jOf(iso);

  return `${fa(j.jd)} ${MONTHS[j.jm - 1]}${withYear ? ` ${fa(j.jy, 0)}` : ""}`;
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
    const position = buckets.length - 1 - (buckets[buckets.length - 1].index - (j.jy * 12 + j.jm - 1));

    return position >= 0 && position < buckets.length ? position : -1;
  }

  const size = kind === "3m" ? 7 : 1;
  const diff = diffDays(endIso, iso);

  if (diff < 0 || diff >= buckets.length * size) {
    return -1;
  }

  return buckets.length - 1 - Math.floor(diff / size);
}

function whichTicks(kind, length) {
  // آخرین نقطه (امروز) همیشه یکی از برچسب‌هاست
  const every = kind === "1m" ? 5 : kind === "3m" ? 2 : 1;

  return Array.from({ length }, (_, i) => i).filter((i) => (length - 1 - i) % every === 0);
}

function tickParts(kind, bucket, previous, isFirst) {
  if (kind === "7d") {
    return {
      top: WEEKDAYS[bucket.weekday],
      bottom: isFirst || bucket.jd === 1 ? `${fa(bucket.jd)} ${MONTHS[bucket.jm - 1]}` : fa(bucket.jd),
    };
  }

  if (kind === "1y") {
    return {
      top: isFirst || bucket.jm === 1 || previous?.jy !== bucket.jy ? fa(bucket.jy) : "",
      bottom: MONTHS[bucket.jm - 1],
    };
  }

  // 1m و 3m: عدد روز، و نام ماه هر جا ماه عوض شد
  return {
    top: isFirst || previous?.jm !== bucket.jm ? MONTHS[bucket.jm - 1] : "",
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
  return Math.round((list.reduce((sum, value) => sum + value, 0) / list.length) * 10) / 10;
}

/* ───────────────────────── تبدیل points به داده‌ی نمودار ───────────────────────── */

function buildChart(points, metrics, kind, endIso) {
  const dated = points.map((point) => ({ point, iso: dateOf(point) })).filter((row) => row.iso);

  // سازگاری با نسخه‌ی قبلی: اگر هیچ نقطه‌ای date ندارد، همان `day` استفاده می‌شود
  if (!dated.length) {
    return {
      legacy: true,
      rows: points.map((point, index) => ({ ...point, key: `${point.day}-${index}`, fullLabel: point.day })),
      ticks: undefined,
      tickInfo: {},
      caption: "",
    };
  }

  const buckets = buildBuckets(kind, endIso);
  const sorted = dated.slice().sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));

  for (const { point, iso } of sorted) {
    const position = placeInBucket(kind, buckets, endIso, iso);

    if (position !== -1) {
      buckets[position].values.push(point);
    }
  }

  const rows = buckets.map((bucket) => {
    const row = { key: bucket.key, fullLabel: bucket.fullLabel, aggregated: bucket.type !== "day", count: bucket.values.length };

    for (const metric of metrics) {
      const numbers = bucket.values.map((point) => numberOf(point[metric.key])).filter((value) => value !== null);

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
    tickInfo[buckets[index].key] = tickParts(kind, buckets[index], previous, order === 0);
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

  if (!info) {
    return null;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" y={22} fill="var(--muted)" fontSize={12} opacity={0.8}>
        {info.top}
      </text>
      <text textAnchor="middle" y={42} fill="var(--muted)" fontSize={14} fontWeight={600}>
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
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-lg" dir="rtl">
      <p className="mb-2 font-bold text-foreground">{row?.fullLabel || row?.day}</p>
      {metrics.map((metric) => {
        const val = numberOf(row?.[metric.key]);
        if (val === null) return null;
        return (
          <p key={metric.key} className={metric.textClass || ""}>
            {metric.label}: {fa(val, 1)} {metric.unit}
          </p>
        );
      })}
      {row?.aggregated && row?.count > 1 && (
        <p className="mt-2 text-xs text-muted">میانگین {fa(row.count)} اندازه‌گیری</p>
      )}
    </div>
  );
};

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
}) {
  const kind = resolveKind(range, ranges);
  const endIso = endDate ? String(endDate).slice(0, 10) : todayIso();

  const chart = useMemo(() => buildChart(points, metrics, kind, endIso), [points, metrics, kind, endIso]);

  // دامنه‌ی هوشمند بر اساس داده‌های همان بازه
  const numbers = chart.rows.flatMap((row) =>
    metrics.map((metric) => numberOf(row[metric.key])).filter((value) => value !== null),
  );

  const lowest = numbers.length ? Math.min(...numbers) : 60;
  const highest = numbers.length ? Math.max(...numbers) : 140;
  const padding = Math.max(1, Math.round((highest - lowest) * 0.15));
  const domainMin = Math.floor(lowest - padding);
  const domainMax = Math.ceil(highest + padding);

  const hasData = numbers.length > 0;

  return (
    <div className="bg-surface rounded-3xl p-4 w-full">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="text-2xl text-foreground font-primary">{title}</div>
          {chart.caption && (
            <p className="mt-1 text-right text-xs text-muted" dir="rtl">
              {chart.caption}
            </p>
          )}
        </div>
        <div className="p-2 flex justify-center items-center">
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

      {athletes.length > 1 && (
        <label className="mt-4 grid max-w-xs gap-2 text-right text-xs text-muted" dir="rtl">
          شاگرد
          <select
            value={athleteId}
            onChange={(event) => onAthlete?.(event.target.value)}
            className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:outline-none"
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
        <p className="mt-3 text-right text-sm text-muted" dir="rtl">
          {athletes[0].name}
        </p>
      )}

      {!hasData ? (
        <p className="px-2 py-16 text-center text-sm text-muted">
          اندازه‌گیری بدنی در این بازه نیست.
        </p>
      ) : (
        <div className="w-full rounded-[32px] bg-surface p-6" dir="rtl">
          <div className="h-80 w-full">
            <ResponsiveContainer width="105%" height="100%">
              <AreaChart
                data={chart.rows}
                margin={{
                  top: 15,
                  right: 0,
                  left: 0,
                  bottom: 10,
                }}
              >
                <defs>
                  {metrics.map((metric) => (
                    <linearGradient key={metric.gradientId} id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={metric.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="7 7"
                  vertical={true}
                  horizontal={true}
                />

                {chart.legacy ? (
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--muted)", fontSize: 16 }}
                    axisLine={false}
                    tickLine={{ stroke: "var(--border)" }}
                    tickMargin={18}
                  />
                ) : (
                  <XAxis
                    dataKey="key"
                    ticks={chart.ticks}
                    interval={0}
                    height={64}
                    padding={{ left: 12, right: 12 }}
                    axisLine={false}
                    tickLine={{ stroke: "var(--border)" }}
                    tick={<AxisTick tickInfo={chart.tickInfo} />}
                  />
                )}

                <YAxis
                  domain={[domainMin, domainMax]}
                  tickMargin={40}
                  width={70}
                  tickFormatter={(value) => fa(value, 1)}
                  tick={{
                    fill: "var(--muted)",
                    fontSize: 16,
                  }}
                  axisLine={false}
                  tickLine={{
                    stroke: "var(--border)",
                  }}
                />

                <Tooltip
                  content={<CustomTooltip metrics={metrics} />}
                  cursor={{
                    stroke: "#007BFF",
                    strokeDasharray: "5 5",
                  }}
                />

                {metrics.map((metric) => {
                  // وقتی نقطه‌ها کم‌اند خط دیده نمی‌شود، پس نقطه‌ها را نشان بده
                  const filled = chart.rows.filter((row) => numberOf(row[metric.key]) !== null).length;

                  return (
                    <Area
                      key={metric.key}
                      type="natural"
                      dataKey={metric.key}
                      name={metric.label}
                      stroke={metric.color}
                      strokeWidth={3}
                      fill={`url(#${metric.gradientId})`}
                      fillOpacity={1}
                      connectNulls
                      dot={filled < 3 ? { r: 4, strokeWidth: 2, fill: "#fff", stroke: metric.color } : false}
                      activeDot={{
                        r: 6,
                        strokeWidth: 3,
                        fill: "#fff",
                      }}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {metrics.map((metric) => (
              <div key={metric.key} className="flex items-center gap-2">
                <span
                  className="h-[3px] w-8 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
                <span className="text-muted">
                  {metric.label} ({metric.unit})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}