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

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const row = payload[0]?.payload;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 font-bold text-gray-700">{row?.day}</p>
      {numberOf(row?.weight) !== null && <p className="text-[#007BFF]">وزن: {row.weight} کیلوگرم</p>}
      {numberOf(row?.fat) !== null && <p className="text-[#6BAF41]">چربی: {row.fat}٪</p>}
      {numberOf(row?.muscle) !== null && <p className="text-[#6366F1]">عضله: {row.muscle} کیلوگرم</p>}
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
}) {
  const numbers = points.flatMap((point) => [point.weight, point.fat, point.muscle].map(numberOf).filter((value) => value !== null));
  const lowest = numbers.length ? Math.min(...numbers) : 0;
  const highest = numbers.length ? Math.max(...numbers) : 1;
  const padding = Math.max(1, Math.round((highest - lowest) * 0.15));
  const domainMin = Math.floor(lowest - padding);
  const domainMax = Math.ceil(highest + padding);

  return (
    <div className="w-full rounded-3xl bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-primary text-2xl text-[#6B6F77]">روند تغییرات وزن، چربی و عضله</div>
        <SegmentedControl
          item1="7 روز"
          item2="1 ماه"
          item3="3 ماه"
          item4="1 سال"
          initial={range}
          onChange={onRange}
        />
      </div>
      {athletes.length > 1 && (
        <label className="mt-4 grid max-w-xs gap-2 text-right text-xs text-[#6B6F77]" dir="rtl">
          شاگرد
          <select
            value={athleteId}
            onChange={(event) => onAthlete?.(event.target.value)}
            className="rounded-2xl border border-[#F0F2F5] bg-[#F5F7FB] px-4 py-3 text-sm"
          >
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>{athlete.name}</option>
            ))}
          </select>
        </label>
      )}
      {athletes.length === 1 && (
        <p className="mt-3 text-right text-sm text-[#6B6F77]" dir="rtl">{athletes[0].name}</p>
      )}
      {points.length === 0 ? (
        <p className="px-2 py-16 text-center text-sm text-[#A0A4AA]">اندازه‌گیری بدنی در این بازه نیست.</p>
      ) : (
        <div className="w-full rounded-[32px] bg-white p-6" dir="rtl">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 15, right: 8, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007BFF" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#007BFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6BAF41" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#6BAF41" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="muscleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#DCE3EB" strokeDasharray="7 7" vertical horizontal />
                <XAxis dataKey="day" tick={{ fill: "#777", fontSize: 14 }} axisLine={false} tickMargin={12} />
                <YAxis domain={[domainMin, domainMax]} width={56} tick={{ fill: "#777", fontSize: 14 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#007BFF", strokeDasharray: "5 5" }} />
                <Area type="monotone" dataKey="weight" name="وزن" stroke="#007BFF" strokeWidth={3} fill="url(#weightGradient)" connectNulls dot={false} />
                <Area type="monotone" dataKey="fat" name="چربی" stroke="#6BAF41" strokeWidth={3} fill="url(#fatGradient)" connectNulls dot={false} />
                <Area type="monotone" dataKey="muscle" name="عضله" stroke="#6366F1" strokeWidth={3} fill="url(#muscleGradient)" connectNulls dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-10">
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-8 rounded-full bg-[#007BFF]" />
              <span className="text-gray-600">وزن (کیلوگرم)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-8 rounded-full bg-[#6BAF41]" />
              <span className="text-gray-600">چربی (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-8 rounded-full bg-[#6366F1]" />
              <span className="text-gray-600">عضله (کیلوگرم)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
