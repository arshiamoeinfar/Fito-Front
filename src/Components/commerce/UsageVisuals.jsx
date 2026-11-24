import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const KIND_META = {
  chat: ["گفتگو", "#007BFF"],
  workout_program: ["برنامه تمرین", "#0B5FD0"],
  meal_plan: ["برنامه غذا", "#16845A"],
  body_analysis: ["تحلیل بدن", "#7C5CFC"],
  progress_review: ["مرور پیشرفت", "#E39B2B"],
  conversation: ["گفتگو", "#007BFF"],
  generation: ["ساخت برنامه", "#0B5FD0"],
};

export function kindLabel(kind) {
  return KIND_META[kind]?.[0] || kind;
}

function kindColor(kind) {
  return KIND_META[kind]?.[1] || "#6B7280";
}

export function CreditGauge({ used = 0, total = 0, caption = "مانده کردیت" }) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeUsed = Math.min(safeTotal, Math.max(0, Number(used) || 0));
  const remaining = Math.max(0, safeTotal - safeUsed);
  const slices = safeTotal === 0
    ? [{ name: "خالی", value: 1, fill: "#E6EDF7" }]
    : [
      { name: "مانده", value: remaining, fill: "#007BFF" },
      { name: "مصرف‌شده", value: Math.max(safeUsed, 0.0001), fill: "#D7E6FA" },
    ];

  return (
    <div className="relative mx-auto h-44 w-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={slices} dataKey="value" innerRadius={58} outerRadius={76} startAngle={90} endAngle={-270} stroke="none">
            {slices.map((slice) => <Cell key={slice.name} fill={slice.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold text-[#16324F]">{remaining.toLocaleString("fa-IR")}</span>
        <span className="text-xs text-[#6B7280]">{caption}</span>
      </div>
      <p className="sr-only">{caption}: {remaining.toLocaleString("fa-IR")} از {safeTotal.toLocaleString("fa-IR")}. مصرف‌شده {safeUsed.toLocaleString("fa-IR")}.</p>
    </div>
  );
}

export function KindBars({ rows = [] }) {
  const prepared = rows.map((row) => ({
    kind: row.kind,
    label: kindLabel(row.kind),
    credits: Number(row.credits) || 0,
    color: kindColor(row.kind),
  }));
  const peak = Math.max(1, ...prepared.map((row) => row.credits));

  if (prepared.length === 0) {
    return <p className="text-sm leading-7 text-[#6B7280]">هنوز مصرفی به تفکیک نوع ثبت نشده.</p>;
  }

  return (
    <ul className="grid gap-3" aria-label="مصرف به تفکیک نوع">
      {prepared.map((row) => (
        <li key={row.kind}>
          <div className="mb-1 flex items-center justify-between text-xs text-[#4B5563]">
            <span>{row.label}</span>
            <span>{row.credits.toLocaleString("fa-IR")} کردیت</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF3FA]">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(6, (row.credits / peak) * 100)}%`, background: row.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TokenSplit({ prompt = 0, completion = 0 }) {
  const input = Math.max(0, Number(prompt) || 0);
  const output = Math.max(0, Number(completion) || 0);
  const total = input + output;
  const slices = total === 0
    ? [{ name: "خالی", value: 1, fill: "#E6EDF7" }]
    : [
      { name: "ورودی", value: input, fill: "#007BFF" },
      { name: "خروجی", value: output, fill: "#7C5CFC" },
    ];

  return (
    <div className="flex items-center gap-4">
      <div className="h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" innerRadius={34} outerRadius={48} startAngle={90} endAngle={-270} stroke="none">
              {slices.map((slice) => <Cell key={slice.name} fill={slice.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 text-sm text-[#243142]">
        <p><span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-[#007BFF]" /> ورودی {input.toLocaleString("fa-IR")}</p>
        <p><span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-[#7C5CFC]" /> خروجی {output.toLocaleString("fa-IR")}</p>
        <p className="text-xs text-[#6B7280]">جمع توکن واقعی {total.toLocaleString("fa-IR")}</p>
      </div>
    </div>
  );
}
