import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import JalaliField from "../../Components/shared/JalaliField/JalaliField";
import { dateFromJalali, faDigits, isoDate, jalaliParts, MONTHS, parseMoment, shiftMonth, showDate, todayDateValue } from "../../lib/jalali";
import { printDocument } from "../../lib/printDocument";

const LINE_COLORS = ["#007BFF", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#EC4899", "#0F766E", "#111827", "#C2410C", "#7C3AED", "#BE185D"];

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
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(rows) {
  const text = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${text}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gozaresh.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function shownNumber(value) {
  return Number(value).toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function monthsAgo(count) {
  const parts = jalaliParts(new Date());
  const shifted = shiftMonth(parts.year, parts.month, -count);
  const date = dateFromJalali(shifted.year, shifted.month, 1);
  return date ? isoDate(date) : todayDateValue();
}

function startOfDay(value) {
  const date = parseMoment(value);
  if (!date) {
    return 0;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function monthLabel(time) {
  const parts = jalaliParts(new Date(time));
  return `${MONTHS[parts.month - 1]} ${faDigits(parts.year)}`;
}

function continuousChart(items, start, end) {
  const spanDays = Math.max(1, Math.round((end - start) / 86400000));
  const step = Math.max(1, Math.ceil(spanDays / 400));
  const prepared = items.map((item) => {
    const values = item.points.map((point) => point.value);
    return {
      lowest: Math.min(...values),
      span: Math.max(...values) - Math.min(...values),
      points: item.points
        .map((point) => ({ time: timeOf(point.at), value: point.value }))
        .sort((left, right) => left.time - right.time),
    };
  });
  const rows = [];
  for (let time = start; time <= end; time += step * 86400000) {
    const row = { time };
    prepared.forEach((item, index) => {
      const known = [...item.points].reverse().find((point) => point.time <= time + 86400000 - 1);
      const key = `s${index}`;
      row[`${key}raw`] = known ? known.value : null;
      row[key] = !known ? null : (item.span === 0 ? 50 : ((known.value - item.lowest) / item.span) * 100);
    });
    rows.push(row);
  }
  return { rows, ticks: monthTicks(start, end) };
}

function curveRows(rows, count) {
  return rows.filter((row, index) => {
    const previous = rows[index - 1];
    for (let series = 0; series < count; series += 1) {
      const raw = row[`s${series}raw`];
      if (raw != null && raw !== previous?.[`s${series}raw`]) {
        return true;
      }
    }
    return false;
  });
}

function columnRows(rows, ticks) {
  return ticks.map((tick, index) => {
    const next = ticks[index + 1] ?? Number.POSITIVE_INFINITY;
    let last = null;
    rows.forEach((row) => {
      if (row.time >= tick && row.time < next) {
        last = row;
      }
    });
    return { ...(last || {}), time: tick, label: monthLabel(tick) };
  });
}

function monthTicks(fromMs, toMs) {
  const start = jalaliParts(new Date(fromMs));
  let cursor = { year: start.year, month: start.month };
  const ticks = [];
  for (let index = 0; index < 48; index += 1) {
    const date = dateFromJalali(cursor.year, cursor.month, 1);
    if (!date) {
      break;
    }
    const time = date.getTime();
    if (time > toMs) {
      break;
    }
    if (time >= fromMs) {
      ticks.push(time);
    }
    cursor = shiftMonth(cursor.year, cursor.month, 1);
  }
  if (ticks.length === 0 || ticks[0] - fromMs > 86400000) {
    ticks.unshift(fromMs);
  }
  return ticks;
}

export default function AthleteReport({ name, observations = [], records = [], photos = [], workouts = [], meals = [], sessions = [], programsEmpty = "برنامه‌ای برای این شاگرد ثبت نشده است." }) {
  const series = useMemo(() => {
    const rows = [];
    BODY_SERIES.forEach(([id, label, unit, color]) => {
      const points = observations.flatMap((item) => {
        const value = numberOf(item.metrics?.[id]);
        return value === null ? [] : [{ at: item.measured_at, value }];
      });
      if (points.length) {
        rows.push({ id, label, unit, color, points, kind: "اندازه" });
      }
    });

    const grouped = new Map();
    records.forEach((record) => {
      const value = numberOf(record.amount);
      if (value === null) {
        return;
      }
      const id = `record:${record.exercise_name}:${record.metric}`;
      const current = grouped.get(id) || {
        id,
        label: `${record.exercise_name} · ${record.metric_label}`,
        unit: record.metric === "max_reps" ? "تکرار" : record.metric === "max_duration_s" ? "ثانیه" : record.metric === "max_distance_m" ? "متر" : "کیلوگرم",
        color: "#111827",
        points: [],
        kind: "قدرت",
        metric: record.metric,
      };
      current.points.push({ at: record.recorded_at, value });
      grouped.set(id, current);
    });
    rows.push(...grouped.values());

    const setPoints = sessions.flatMap((session) => {
      const count = Array.isArray(session.sets) ? session.sets.length : null;
      return count === null ? [] : [{ at: session.performed_on, value: count }];
    });
    if (setPoints.length) {
      rows.push({ id: "sets", label: "تعداد ست تمرین", unit: "ست", color: "#0F766E", points: setPoints, kind: "تمرین" });
    }
    return rows.map((item, index) => ({ ...item, color: LINE_COLORS[index % LINE_COLORS.length] }));
  }, [observations, records, sessions]);

  const [picked, setPicked] = useState({});
  const [sort, setSort] = useState("asc");
  const [from, setFrom] = useState(() => monthsAgo(5));
  const [to, setTo] = useState(todayDateValue);
  const [shape, setShape] = useState("curve");
  const [shapeOpen, setShapeOpen] = useState(false);
  const active = series.filter((item) => picked[item.id] ?? (item.id === "weight_kg" || item.id === "waist_cm" || item.metric === "max_weight_g"));

  function order(points) {
    return [...points].sort((left, right) => (sort === "asc" ? timeOf(left.at) - timeOf(right.at) : timeOf(right.at) - timeOf(left.at)));
  }

  const fromMs = startOfDay(from);
  const toMs = startOfDay(to) + 86400000 - 1;
  const rangeOk = fromMs > 0 && toMs >= fromMs;

  function inRange(value) {
    const time = timeOf(value);
    return rangeOk && time >= fromMs && time <= toMs;
  }

  const chart = rangeOk ? continuousChart(active, fromMs, toMs) : { rows: [], ticks: [] };
  const columns = columnRows(chart.rows, chart.ticks);
  const curves = curveRows(chart.rows, active.length);
  const shapeLabel = CHART_SHAPES.find(([id]) => id === shape)?.[1] || "منحنی";

  const programs = order([
    ...workouts.map((item) => ({ at: item.starts_on, kind: "برنامه تمرین", title: item.program?.title || "برنامه تمرین", detail: item.ends_on ? `تا ${showDate(item.ends_on)}` : (item.status === "active" ? "باز" : "تاریخ اتمام ثبت نشده") })),
    ...meals.map((item) => ({ at: item.starts_on, kind: "برنامه غذا", title: item.plan?.title || "برنامه غذا", detail: item.ends_on ? `تا ${showDate(item.ends_on)}` : (item.status === "active" ? "باز" : "تاریخ اتمام ثبت نشده") })),
  ]);

  const timeline = order([
    ...active.flatMap((item) => item.points.map((point) => ({
      at: point.at,
      kind: item.kind,
      title: item.label,
      detail: `${shownNumber(point.value)}${item.unit ? ` ${item.unit}` : ""}`,
    }))),
    ...photos.map((photo) => ({ at: photo.taken_at, kind: "عکس", title: "عکس بدن", detail: "ثبت شده" })),
    ...sessions.map((session) => ({ at: session.performed_on, kind: "تمرین", title: "جلسه تمرین", detail: `${(session.sets || []).length.toLocaleString("fa-IR")} ست · ${session.status === "completed" ? "تمام شده" : "باز"}` })),
  ]).filter((row) => inRange(row.at));

  function exportCsv() {
    downloadCsv([
      ["گزارش", name || "شاگرد"],
      [],
      ["تاریخ", "نوع", "مورد", "مقدار"],
      ...timeline.map((row) => [showDate(row.at), row.kind, row.title, row.detail]),
      [],
      ["برنامه‌ها"],
      ["شروع", "نوع", "عنوان", "اتمام"],
      ...programs.map((row) => [showDate(row.at), row.kind, row.title, row.detail]),
    ]);
  }

  function printReport() {
    printDocument({
      title: `گزارش ${name || "شاگرد"}`,
      intro: `نمودار ${shapeLabel} از ${showDate(from)} تا ${showDate(to)}. مقدار واقعی هر مورد در جدول زیر است.`,
      charts: rangeOk ? [{
        title: `نمودار ${shapeLabel}`,
        shape,
        from: fromMs,
        to: toMs,
        ticks: chart.ticks.map((time) => ({ time, label: monthLabel(time) })),
        columns: columns.map((row) => ({
          values: active.map((_, index) => row[`s${index}`] ?? null),
        })),
        lines: active.map((item, index) => ({
          title: `${item.label}${item.unit ? ` (${item.unit})` : ""}`,
          color: item.color,
          points: (shape === "curve" ? curves : chart.rows).map((row, rowIndex) => {
            const raw = row[`s${index}raw`];
            const changed = raw != null && raw !== (shape === "curve" ? curves : chart.rows)[rowIndex - 1]?.[`s${index}raw`];
            return {
              time: row.time,
              norm: row[`s${index}`],
              label: shape === "curve" && changed ? shownNumber(raw) : "",
            };
          }),
        })),
      }] : [],
      tables: [
        { title: "روند", rows: [["تاریخ", "نوع", "مورد", "مقدار"], ...timeline.map((row) => [showDate(row.at), row.kind, row.title, row.detail])] },
        { title: "برنامه‌ها", rows: [["شروع", "نوع", "عنوان", "اتمام"], ...programs.map((row) => [showDate(row.at), row.kind, row.title, row.detail])] },
      ],
    });
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-7 text-[#6B6F77]">موردهای نمودار را انتخاب کن. بازه را با نوشتن تاریخ شمسی، مثل ۱۴۰۵/۰۱/۰۱، یا از تقویم عوض کن تا ماه‌های دیگر هم روی محور بیایند.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="rounded-2xl bg-white px-4 py-2 text-sm text-[#007BFF] ring-1 ring-[#D6E6FF]">خروجی اکسل</button>
          <button type="button" onClick={printReport} className="rounded-2xl bg-[#007BFF] px-4 py-2 text-sm text-white">چاپ و PDF</button>
        </div>
      </div>
      <label className="mt-4 grid max-w-xs gap-2 text-sm text-[#6B6F77]">
        مرتب‌سازی تاریخ
        <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="asc">از قدیمی به جدید</option>
          <option value="desc">از جدید به قدیمی</option>
        </select>
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        {series.length === 0 ? <p className="text-sm text-[#A0A4AA]">هنوز داده‌ای برای نمودار نیست.</p> : null}
        {series.map((item) => {
          const on = picked[item.id] ?? (item.id === "weight_kg" || item.id === "waist_cm" || item.metric === "max_weight_g");
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPicked((current) => ({ ...current, [item.id]: !on }))}
              className={`rounded-2xl px-3 py-2 text-sm ${on ? "bg-[#007BFF] text-white" : "bg-[#F5F7FB] text-[#6B6F77]"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <h4 className="mt-6 text-base text-[#1F2937]">گزارش کامل</h4>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[#6B6F77]">
          از تاریخ
          <JalaliField value={from} onChange={setFrom} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="grid gap-2 text-sm text-[#6B6F77]">
          تا تاریخ
          <JalaliField value={to} onChange={setTo} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
        </label>
      </div>
      {!rangeOk ? <p className="mt-3 text-sm text-red-700">تاریخ شروع باید قبل از تاریخ پایان باشد.</p> : (
        <div className="mt-4 rounded-2xl bg-[#F5F7FB] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#1F2937]">نمودار {shapeLabel}</p>
            <button type="button" onClick={() => setShapeOpen((open) => !open)} className="rounded-2xl bg-white px-4 py-2 text-sm text-[#007BFF] ring-1 ring-[#D6E6FF]">
              سفارشی‌سازی نمودار
            </button>
          </div>
          {shapeOpen ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {CHART_SHAPES.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setShape(id)}
                  className={`rounded-2xl px-3 py-2 text-sm ${shape === id ? "bg-[#007BFF] text-white" : "bg-white text-[#6B6F77]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <p className="mt-1 text-xs leading-6 text-[#6B6F77]">{SHAPE_HINT[shape]} مقدار واقعی را با نگه داشتن روی نمودار ببین.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {active.map((item) => (
              <span key={item.id} className="text-xs" style={{ color: item.color }}>{item.label}</span>
            ))}
          </div>
          {active.length === 0 ? <p className="mt-3 text-sm text-[#A0A4AA]">حداقل یک مورد را برای نمودار روشن کن.</p> : (
            <div className="mt-3 h-80">
              <ResponsiveContainer width="100%" height="100%">
                {shape === "column" ? (
                  <BarChart data={columns} margin={{ top: 8, right: 28, left: 28, bottom: 8 }}>
                    <CartesianGrid stroke="#E5E7EB" />
                    <XAxis dataKey="label" interval={0} tick={{ fontSize: 11 }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      labelFormatter={(value) => value}
                      formatter={(value, name, item) => {
                        const index = active.findIndex((series) => series.label === name);
                        const raw = item?.payload?.[`s${index}raw`];
                        const unit = active[index]?.unit;
                        return [raw == null ? "—" : `${shownNumber(raw)}${unit ? ` ${unit}` : ""}`, name];
                      }}
                    />
                    {active.map((item, index) => (
                      <Bar key={item.id} dataKey={`s${index}`} name={item.label} fill={item.color} maxBarSize={22} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                ) : (
                  <LineChart data={shape === "curve" ? curves : chart.rows} margin={{ top: shape === "curve" ? 28 : 8, right: 28, left: 28, bottom: 8 }}>
                    <CartesianGrid stroke="#E5E7EB" />
                    <XAxis dataKey="time" type="number" domain={[fromMs, toMs]} scale="time" ticks={chart.ticks} interval={0} tickFormatter={monthLabel} tick={{ fontSize: 11 }} />
                    <YAxis hide domain={shape === "curve" ? [0, 118] : [0, 100]} />
                    <Tooltip
                      labelFormatter={(value) => showDate(new Date(Number(value)))}
                      formatter={(value, name, item) => {
                        const index = active.findIndex((series) => series.label === name);
                        const raw = item?.payload?.[`s${index}raw`];
                        const unit = active[index]?.unit;
                        return [raw == null ? "—" : `${shownNumber(raw)}${unit ? ` ${unit}` : ""}`, name];
                      }}
                    />
                    {active.map((item, index) => (
                      <Line
                        key={item.id}
                        type={shape === "curve" ? "monotone" : "stepAfter"}
                        dataKey={`s${index}`}
                        name={item.label}
                        stroke={item.color}
                        strokeWidth={2.5}
                        connectNulls
                        dot={shape === "line" ? false : (props) => {
                          const source = shape === "curve" ? curves : chart.rows;
                          const raw = props.payload?.[`s${index}raw`];
                          const previous = source[props.index - 1]?.[`s${index}raw`];
                          if (props.cx == null || raw == null || raw === previous) {
                            return null;
                          }
                          const lift = 12 + (index % 3) * 11;
                          return (
                            <g>
                              <circle cx={props.cx} cy={props.cy} r={4.5} fill={item.color} />
                              {shape === "curve" ? (
                                <text x={props.cx} y={props.cy - lift} textAnchor="middle" fontSize="10" fill={item.color}>{shownNumber(raw)}</text>
                              ) : null}
                            </g>
                          );
                        }}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
      <h4 className="mt-6 text-base text-[#1F2937]">برنامه‌ها</h4>
      {programs.length === 0 ? <p className="mt-2 text-sm text-[#A0A4AA]">{programsEmpty}</p> : (
        <ul className="mt-3 space-y-2">
          {programs.map((row, index) => (
            <li key={`${row.kind}-${row.title}-${index}`} className="rounded-2xl bg-[#F5F7FB] px-4 py-3 text-sm text-[#1F2937]">
              {showDate(row.at)} · {row.kind} · {row.title} · {row.detail}
            </li>
          ))}
        </ul>
      )}
      <h4 className="mt-6 text-base text-[#1F2937]">ثبت‌های این بازه</h4>
      {timeline.length === 0 ? <p className="mt-2 text-sm text-[#A0A4AA]">در این بازه ثبتی نیست.</p> : (
        <ul className="mt-3 space-y-2">
          {timeline.map((row, index) => (
            <li key={`${row.kind}-${row.title}-${row.at}-${index}`} className="rounded-2xl bg-[#F5F7FB] px-4 py-3 text-sm text-[#1F2937]">
              {showDate(row.at)} · {row.kind} · {row.title} · {row.detail}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs leading-6 text-[#A0A4AA]">برای PDF، در پنجره چاپ مقصد را «ذخیره به صورت PDF» بگذار. تاریخ ذخیره‌شده در سیستم میلادی می‌ماند و اینجا شمسی دیده می‌شود.</p>
    </div>
  );
}
