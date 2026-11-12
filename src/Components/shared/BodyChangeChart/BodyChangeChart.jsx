import React from "react";
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

function numberOf(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const CustomTooltip = ({ active, payload, metrics }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const row = payload[0]?.payload;

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-lg" dir="rtl">
      <p className="mb-2 font-bold text-foreground">{row?.day}</p>
      {metrics.map((metric) => {
        const val = numberOf(row?.[metric.key]);
        if (val === null) return null;
        return (
          <p key={metric.key} className={metric.textClass || ""}>
            {metric.label}: {row[metric.key]} {metric.unit}
          </p>
        );
      })}
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
  title = "روند تغییرات وزن، چربی و عضله",
  metrics = [
    { 
      key: "weight", 
      label: "وزن", 
      unit: "کیلوگرم", 
      color: "#007BFF", 
      textClass: "text-primary", 
      gradientId: "weightGradient" 
    },
    { 
      key: "fat", 
      label: "چربی", 
      unit: "٪", 
      color: "#6BAF41", 
      textClass: "text-success", 
      gradientId: "fatGradient" 
    },
    { 
      key: "muscle", 
      label: "عضله", 
      unit: "کیلوگرم", 
      color: "#6366F1", 
      textClass: "text-[#6366F1]", 
      gradientId: "muscleGradient" 
    },
  ],
  ranges = [
    { id: "7d", label: "7 روز" },
    { id: "1m", label: "1 ماه" },
    { id: "3m", label: "3 ماه" },
    { id: "1y", label: "1 سال" },
  ],
}) {
  // محاسبه هوشمند دامنه (Min و Max) بر اساس داده‌های موجود
  const metricKeys = metrics.map((m) => m.key);
  const numbers = points.flatMap((point) =>
    metricKeys.map((key) => numberOf(point[key])).filter((value) => value !== null)
  );

  const lowest = numbers.length ? Math.min(...numbers) : 60;
  const highest = numbers.length ? Math.max(...numbers) : 140;
  const padding = Math.max(1, Math.round((highest - lowest) * 0.15));
  const domainMin = Math.floor(lowest - padding);
  const domainMax = Math.ceil(highest + padding);

  return (
    <div className="bg-surface rounded-3xl p-4 w-full">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="text-2xl text-foreground font-primary">
          {title}
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

      {points.length === 0 ? (
        <p className="px-2 py-16 text-center text-sm text-muted">
          اندازه‌گیری بدنی در این بازه نیست.
        </p>
      ) : (
        <div className="w-full rounded-[32px] bg-surface p-6" dir="rtl">
          <div className="h-80 w-full">
            <ResponsiveContainer width="105%" height="100%">
              <AreaChart
                data={points}
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

                <XAxis
                  dataKey="day"
                  tick={{
                    fill: "var(--muted)",
                    fontSize: 16,
                  }}
                  axisLine={false}
                  tickLine={{
                    stroke: "var(--border)",
                  }}
                  tickMargin={18}
                />

                <YAxis
                  domain={[domainMin, domainMax]}
                  tickMargin={40}
                  width={70}
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

                {metrics.map((metric) => (
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
                    dot={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 3,
                      fill: "#fff",
                    }}
                  />
                ))}
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