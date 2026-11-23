
import React from "react";
import JalaliField from "../../../Components/shared/JalaliField/JalaliField";
import AthleteReport from "../../../pages/coach/AthleteReport";
import BodyPhotoSets from "../../../Components/shared/BodyPhotoSets/BodyPhotoSets";

const MAIN_FIELDS = [
  ["weight_kg", "وزن", "کیلوگرم"],
  ["height_cm", "قد", "سانتی‌متر"],
  ["waist_cm", "دور کمر", "سانتی‌متر"],
];

const EXTRA_FIELDS = [
  ["chest_cm", "دور سینه"],
  ["hip_cm", "دور باسن"],
  ["neck_cm", "دور گردن"],
  ["left_arm_cm", "دور بازوی چپ"],
  ["right_arm_cm", "دور بازوی راست"],
  ["left_thigh_cm", "دور ران چپ"],
  ["right_thigh_cm", "دور ران راست"],
  ["body_fat_percent", "درصد چربی بدن"],
];

const METRIC_LABELS = {
  weight_kg: "وزن",
  height_cm: "قد",
  waist_cm: "دور کمر",
  chest_cm: "دور سینه",
  neck_cm: "دور گردن",
  hip_cm: "دور باسن",
  left_arm_cm: "دور بازوی چپ",
  right_arm_cm: "دور بازوی راست",
  left_thigh_cm: "دور ران چپ",
  right_thigh_cm: "دور ران راست",
  muscle_mass_kg: "توده عضله",
  body_fat_percent: "چربی بدن",
  body_water_percent: "آب بدن",
  bmi: "شاخص توده بدنی",
  bmi_calculated: "شاخص توده بدنی",
};

const METRIC_UNITS = {
  weight_kg: "کیلوگرم",
  height_cm: "سانتی‌متر",
  waist_cm: "سانتی‌متر",
  chest_cm: "سانتی‌متر",
  neck_cm: "سانتی‌متر",
  hip_cm: "سانتی‌متر",
  left_arm_cm: "سانتی‌متر",
  right_arm_cm: "سانتی‌متر",
  left_thigh_cm: "سانتی‌متر",
  right_thigh_cm: "سانتی‌متر",
  muscle_mass_kg: "کیلوگرم",
  body_fat_percent: "درصد",
  body_water_percent: "درصد",
};

const PANELS = [
  { id: "sizes", label: "اندازه‌های بدن", short: "اندازه‌ها", icon: "ruler" },
  { id: "photos", label: "تصاویر پیشرفت", short: "تصاویر", icon: "image" },
  { id: "records", label: "رکوردهای ورزشی", short: "رکوردها", icon: "trophy" },
  { id: "compare", label: "مقایسه تغییرات", short: "مقایسه", icon: "compare" },
  { id: "report", label: "گزارش عملکرد", short: "گزارش", icon: "chart" },
];

function shown(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return number.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function when(value) {
  if (!value) return "—";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value).replace("T", " ").slice(0, 16);
  }

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function metricEntries(metrics) {
  return Object.entries(metrics ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
}

function observationChoice(item) {
  const weight = item.metrics?.weight_kg;
  const date = when(item.measured_at);

  if (weight === null || weight === undefined || weight === "") return date;

  return `${date}، وزن ${shown(weight)} کیلوگرم`;
}

function withUnit(value, key) {
  if (value === null || value === undefined || value === "") return "—";

  const unit = METRIC_UNITS[key];
  return `${shown(value)}${unit ? ` ${unit}` : ""}`;
}

function changeText(delta, key) {
  if (delta === null || delta === undefined || delta === "") {
    return "در یکی از دو ثبت نیست";
  }

  const number = Number(delta);

  if (Number.isNaN(number) || number === 0) return "بدون تغییر";

  const unit = METRIC_UNITS[key] || "";

  return `${shown(Math.abs(number))}${unit ? ` ${unit}` : ""} ${
    number > 0 ? "بیشتر" : "کمتر"
  }`;
}

function sourceLabel(source) {
  if (source === "coach") return "ثبت مربی";
  if (source === "manual" || source === "device") return "ثبت ورزشکار";
  return "";
}

function Icon({ name, className = "h-5 w-5" }) {
  const icons = {
    ruler: (
      <>
        <path d="M3 8h18v8H3z" />
        <path d="M7 8v4M11 8v3M15 8v4M19 8v3" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
        <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
      </>
    ),
    compare: (
      <>
        <path d="M7 3v18M17 3v18M3 7h8M13 17h8" />
        <path d="m8 4-3-1-2 3M16 20l3 1 2-3" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 4 3 6-7" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      </>
    ),
    spinner: (
      <>
        <circle cx="12" cy="12" r="9" strokeOpacity=".2" />
        <path d="M21 12a9 9 0 0 0-9-9" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function MetricCard({ label, value, unit, icon, accent }) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#E9EDF4] bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#C9DFFF] hover:shadow-[0_8px_24px_rgba(30,64,175,0.06)] dark:border-[#29344A] dark:bg-[#151E30] dark:hover:border-[#35517F] dark:hover:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[#8993A5] dark:text-[#98A5BA]">
          {label}
        </p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-[#1E293B] dark:text-white">
          {value}
        </span>
        <span className="text-[10px] text-[#98A2B3] dark:text-[#8B97AD]">
          {unit}
        </span>
      </div>

      <div className="absolute -bottom-5 -left-5 h-16 w-16 rounded-full bg-[#F5F8FE] transition group-hover:scale-125 dark:bg-[#1B2940]" />
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, count }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-bold tracking-wider text-[#007BFF]">
            {eyebrow}
          </p>
        )}
        <h3 className="text-base font-bold text-[#202B3C] dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 text-xs leading-6 text-[#929BAD] dark:text-[#8B97AD]">
            {description}
          </p>
        )}
      </div>

      {count !== undefined && (
        <span className="rounded-lg border border-[#E7EDF5] bg-[#F8FAFD] px-3 py-1.5 text-xs font-semibold text-[#667085] dark:border-[#29344A] dark:bg-[#1A263A] dark:text-[#B6C2D6]">
          {shown(count)} مورد
        </span>
      )}
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE3ED] bg-[#FAFBFD] px-5 py-12 text-center dark:border-[#2A3550] dark:bg-[#101827]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#007BFF] dark:bg-[#142B4B] dark:text-[#70B4FF]">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h4 className="mt-4 text-sm font-bold text-[#344054] dark:text-[#E5E7EB]">
        {title}
      </h4>
      {description && (
        <p className="mt-2 max-w-sm text-xs leading-7 text-[#929BAD] dark:text-[#8B97AD]">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Analysis({
  name,
  weightNow,
  waistNow,
  photos = [],
  records = [],
  error,
  notice,
  panel,
  setPanel,
  saveObservation,
  measuredAt,
  setMeasuredAt,
  metrics = {},
  setMetrics,
  share,
  setShare,
  shareTouched,
  active,
  pending,
  observations = [],
  previewMap = {},
  photoClosed,
  sets = [],
  uploadPhoto,
  recordForm = {},
  setRecordForm,
  exercises = [],
  saveRecord,
  beforeId,
  setBeforeId,
  afterId,
  setAfterId,
  compare,
  workouts = [],
  meals = [],
  sessions = [],
}) {
  const control =
    "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-[#E3E8EF] bg-[#FAFBFD] px-4 py-3 text-sm text-[#263449] outline-none transition placeholder:text-[#A0A8B5] hover:border-[#C4D5EA] focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/10 dark:border-[#2C3950] dark:bg-[#101827] dark:text-[#F3F4F6] dark:placeholder:text-[#75839A] dark:focus:border-[#368EFF] dark:focus:bg-[#111C2D] dark:focus:ring-[#007BFF]/20";

  const labelClass =
    "block min-w-0 text-xs font-semibold text-[#647084] dark:text-[#AAB6C8]";

  const ring =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151E30]";

  const setMetric = (key, value) =>
    setMetrics((current) => ({ ...current, [key]: value }));

  const extraFilled = EXTRA_FIELDS.filter(
    ([key]) => String(metrics[key] ?? "").trim() !== ""
  ).length;

  const chosen = exercises.find(
    (item) => String(item.id) === String(recordForm.exercise_id ?? "")
  );

  const current = chosen
    ? records
        .filter(
          (item) =>
            item.exercise_name === chosen.name &&
            item.metric === (recordForm.metric ?? "max_weight_g")
        )
        .reduce(
          (best, item) =>
            !best || Number(item.amount) > Number(best.amount) ? item : best,
          null
        )
    : null;

  const setRecordField = (patch) =>
    setRecordForm((state) => ({ ...state, ...patch }));

  const metricUnit =
    recordForm.metric === "max_reps" ? "تکرار" : "کیلوگرم";

  return (
    <section
      dir="rtl"
      className="col-span-12 min-w-0 rounded-[26px] border border-[#E9EDF3] bg-[#F8FAFD] p-3 sm:p-5 lg:p-6 dark:border-[#27344A] dark:bg-[#101827]"
    >
      {/* Main header */}
      <div className="relative overflow-hidden rounded-[22px] bg-[#111D32] p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute -left-10 -top-24 h-64 w-64 rounded-full border-[45px] border-white/[0.035]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#007BFF]/20 blur-[70px]" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#42D9A2]" />
              <span className="text-[10px] font-bold tracking-[0.12em] text-[#91A7C7]">
                FITO PERFORMANCE CENTER
              </span>
            </div>

            <h2 className="break-words text-xl font-bold sm:text-2xl">
              آنالیز عملکرد ورزشکار
            </h2>

            <p className="mt-2 text-sm text-[#9AABC4]">
              پرونده اختصاصی {name}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
            <span
              className={`h-2 w-2 rounded-full ${
                active ? "bg-[#42D9A2]" : "bg-[#F4B860]"
              }`}
            />
            <span className="text-xs font-medium text-[#D7E1EF]">
              {active ? "ارتباط فعال" : "ارتباط غیرفعال"}
            </span>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border-l border-white/10 pl-3 sm:pl-5">
            <p className="text-[11px] text-[#91A2BA]">وزن فعلی</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {weightNow ? shown(weightNow) : "—"}
              <span className="mr-1 text-[10px] font-normal text-[#91A2BA]">
                kg
              </span>
            </p>
          </div>

          <div className="border-l border-white/10 pl-3 sm:pl-5">
            <p className="text-[11px] text-[#91A2BA]">دور کمر</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {waistNow ? shown(waistNow) : "—"}
              <span className="mr-1 text-[10px] font-normal text-[#91A2BA]">
                cm
              </span>
            </p>
          </div>

          <div className="border-l border-white/10 pl-3 sm:pl-5">
            <p className="text-[11px] text-[#91A2BA]">تصاویر بدن</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {shown(photos.length)}
              <span className="mr-1 text-[10px] font-normal text-[#91A2BA]">
                تصویر
              </span>
            </p>
          </div>

          <div>
            <p className="text-[11px] text-[#91A2BA]">رکوردهای ورزشی</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {shown(records.length)}
              <span className="mr-1 text-[10px] font-normal text-[#91A2BA]">
                رکورد
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Latest record */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8EDF4] bg-white px-4 py-3.5 dark:border-[#29364C] dark:bg-[#151F31]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF5E5] text-[#D99B35] dark:bg-[#392D18] dark:text-[#F2C16D]">
            <Icon name="trophy" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[#98A2B3]">
              آخرین رکورد ثبت‌شده
            </p>
            <p className="mt-1 truncate text-sm font-bold text-[#344054] dark:text-[#E5E7EB]">
              {records[0]
                ? `${records[0].exercise_name} · ${records[0].display}`
                : "هنوز رکوردی ثبت نشده"}
            </p>
          </div>
        </div>

        {records[0] && (
          <span className="text-[10px] text-[#98A2B3]">
            {when(records[0].recorded_at)}
          </span>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
        >
          <Icon name="check" className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 rounded-2xl border border-[#E8EDF4] bg-white p-2 dark:border-[#29364C] dark:bg-[#151F31]">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
          {PANELS.map((item) => {
            const selected = panel === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setPanel((current) =>
                    current === item.id ? null : item.id
                  )
                }
                aria-pressed={selected}
                className={`flex min-h-[58px] min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-right transition duration-200 ${ring} ${
                  selected
                    ? "bg-[#EAF3FF] text-[#006BE0] dark:bg-[#142D4D] dark:text-[#75B8FF]"
                    : "text-[#7F8A9C] hover:bg-[#F6F8FB] hover:text-[#344054] dark:text-[#9BA8BA] dark:hover:bg-[#1C293E] dark:hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    selected
                      ? "bg-white text-[#007BFF] shadow-sm dark:bg-[#1C3B63] dark:text-[#8BC5FF]"
                      : "bg-[#F3F5F8] text-[#8C98AA] dark:bg-[#202C40] dark:text-[#9AA9BE]"
                  }`}
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold">
                    {item.short}
                  </span>
                  <span className="mt-1 hidden truncate text-[9px] opacity-70 sm:block">
                    {item.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      {panel === "sizes" && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="تعداد اندازه‌گیری"
              value={shown(observations.length)}
              unit="ثبت"
              icon="ruler"
              accent="bg-[#EAF3FF] text-[#007BFF] dark:bg-[#142D4D] dark:text-[#75B8FF]"
            />
            <MetricCard
              label="عکس‌های ثبت‌شده"
              value={shown(photos.length)}
              unit="تصویر"
              icon="image"
              accent="bg-[#F0ECFF] text-[#8061D9] dark:bg-[#292044] dark:text-[#B4A1FF]"
            />
            <MetricCard
              label="رکوردهای ورزشی"
              value={shown(records.length)}
              unit="رکورد"
              icon="trophy"
              accent="bg-[#FFF5E5] text-[#D99B35] dark:bg-[#392D18] dark:text-[#F2C16D]"
            />
            <MetricCard
              label="سایزهای تکمیلی"
              value={shown(extraFilled)}
              unit={`از ${EXTRA_FIELDS.length}`}
              icon="chart"
              accent="bg-[#EAF8F1] text-[#229A65] dark:bg-[#143629] dark:text-[#70D6A4]"
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#E7ECF3] bg-white dark:border-[#29364C] dark:bg-[#151F31]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF0F5] px-5 py-4 dark:border-[#29364C]">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-[#007BFF]">
                  BODY MEASUREMENTS
                </p>
                <h3 className="mt-1.5 text-base font-bold text-[#263449] dark:text-white">
                  ثبت اندازه‌های جدید
                </h3>
                <p className="mt-1 text-xs text-[#98A2B3]">
                  اطلاعات اندازه‌گیری جدید ورزشکار را وارد کن.
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#007BFF] dark:bg-[#142D4D] dark:text-[#75B8FF]">
                <Icon name="ruler" />
              </span>
            </div>

            <form onSubmit={saveObservation} className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className={labelClass}>
                  تاریخ و ساعت
                  <JalaliField
                    required
                    withTime
                    value={measuredAt}
                    onChange={setMeasuredAt}
                    className={control}
                  />
                </label>

                {MAIN_FIELDS.map(([key, label, unit]) => (
                  <label key={key} className={labelClass}>
                    {label} ({unit})
                    <input
                      inputMode="decimal"
                      autoComplete="off"
                      value={metrics[key] ?? ""}
                      onChange={(event) =>
                        setMetric(key, event.target.value)
                      }
                      className={control}
                      placeholder="مثلاً ۸۰"
                    />
                  </label>
                ))}
              </div>

              <details className="group mt-5 overflow-hidden rounded-xl border border-[#E8EDF4] dark:border-[#2C3950]">
                <summary
                  className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 bg-[#FAFBFD] px-4 py-3 text-sm font-semibold text-[#45536A] transition hover:bg-[#F4F7FB] dark:bg-[#101827] dark:text-[#CFD8E5] dark:hover:bg-[#1A263A] ${ring} [&::-webkit-details-marker]:hidden`}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <Icon name="plus" className="h-4 w-4 text-[#007BFF]" />
                    اندازه‌های تکمیلی بدن
                    {extraFilled > 0 && (
                      <span className="rounded-md bg-[#EAF3FF] px-2 py-1 text-[10px] text-[#007BFF] dark:bg-[#142D4D] dark:text-[#75B8FF]">
                        {shown(extraFilled)} تکمیل‌شده
                      </span>
                    )}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>

                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  {EXTRA_FIELDS.map(([key, label]) => (
                    <label key={key} className={labelClass}>
                      {label}
                      <input
                        inputMode="decimal"
                        autoComplete="off"
                        value={metrics[key] ?? ""}
                        onChange={(event) =>
                          setMetric(key, event.target.value)
                        }
                        className={control}
                        placeholder="اختیاری"
                      />
                    </label>
                  ))}
                </div>
              </details>

              <label
                className={`mt-5 flex items-start gap-3 rounded-xl border p-4 transition ${
                  active
                    ? "cursor-pointer border-[#DDE9F8] bg-[#F6FAFF] dark:border-[#294467] dark:bg-[#14243A]"
                    : "cursor-not-allowed border-[#E8EDF3] bg-[#FAFBFD] opacity-60 dark:border-[#29364C] dark:bg-[#101827]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(share)}
                  disabled={!active}
                  onChange={(event) => {
                    shareTouched.current = true;
                    setShare(event.target.checked);
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#007BFF]"
                />
                <span>
                  <span className="block text-xs font-bold text-[#344054] dark:text-white">
                    اشتراک‌گذاری اطلاعات این ثبت
                  </span>
                  <span className="mt-1 block text-[11px] leading-6 text-[#8A95A7] dark:text-[#9AA8BB]">
                    مربی و دستیار هوش مصنوعی می‌توانند اطلاعات این اندازه‌گیری
                    را مشاهده کنند.
                    {!active && " رابطه فعالی با مربی وجود ندارد."}
                  </span>
                </span>
              </label>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-[#A0A9B7]">
                  اطلاعات واردشده در پرونده ورزشکار ذخیره می‌شود.
                </p>
                <button
                  type="submit"
                  disabled={pending}
                  aria-busy={pending}
                  className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#087BEE] px-7 py-3 text-sm font-bold text-white shadow-[0_5px_16px_rgba(0,123,255,0.2)] transition hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${ring}`}
                >
                  {pending ? (
                    <Icon name="spinner" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon name="check" className="h-4 w-4" />
                  )}
                  {pending ? "در حال ذخیره..." : "ذخیره اندازه‌ها"}
                </button>
              </div>
            </form>
          </section>

          <section>
            <SectionHeading
              eyebrow="MEASUREMENT HISTORY"
              title="تاریخچه اندازه‌گیری"
              description="سوابق اندازه‌گیری بدن ورزشکار را مشاهده کن."
              count={observations.length}
            />

            {observations.length === 0 ? (
              <EmptyState
                icon="ruler"
                title="هنوز اطلاعاتی ثبت نشده است"
                description="بعد از اولین اندازه‌گیری، تاریخچه اطلاعات بدن در این قسمت نمایش داده می‌شود."
              />
            ) : (
              <div className="space-y-3">
                {observations.map((item, index) => {
                  const entries = metricEntries(item.metrics);

                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-[#E8EDF4] bg-white transition hover:border-[#C9DFFF] dark:border-[#29364C] dark:bg-[#151F31] dark:hover:border-[#35517F]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF0F5] px-4 py-3.5 dark:border-[#29364C]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#007BFF] dark:bg-[#142D4D] dark:text-[#75B8FF]">
                            <Icon name="calendar" className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-[#344054] dark:text-white">
                              {when(item.measured_at)}
                            </p>
                            <p className="mt-1 text-[10px] text-[#98A2B3]">
                              ثبت {shown(observations.length - index)}
                            </p>
                          </div>
                        </div>

                        {sourceLabel(item.source) && (
                          <span className="rounded-lg border border-[#E6EBF2] bg-[#F8FAFD] px-2.5 py-1 text-[10px] font-semibold text-[#778397] dark:border-[#34415A] dark:bg-[#202C40] dark:text-[#B2BED0]">
                            {sourceLabel(item.source)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4 sm:p-4">
                        {entries.length > 0 ? (
                          entries.map(([key, value]) => (
                            <div
                              key={key}
                              className="min-w-0 rounded-xl bg-[#F7F9FC] p-3 dark:bg-[#101827]"
                            >
                              <p className="truncate text-[10px] text-[#919BAD]">
                                {METRIC_LABELS[key] || "اندازه"}
                              </p>
                              <p className="mt-2 break-words text-sm font-bold text-[#344054] dark:text-[#F3F4F6]">
                                {withUnit(value, key)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="col-span-full py-3 text-xs text-[#98A2B3]">
                            اطلاعات اندازه‌ای برای این ثبت وجود ندارد.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Photos */}
      {panel === "photos" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-[#E4ECF7] bg-white p-4 dark:border-[#29364C] dark:bg-[#151F31]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0ECFF] text-[#8061D9] dark:bg-[#292044] dark:text-[#B4A1FF]">
                <Icon name="image" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#344054] dark:text-white">
                  گالری تصاویر پیشرفت
                </h3>
                <p className="mt-1 text-xs leading-6 text-[#98A2B3]">
                  تصاویر ثبت‌شده ورزشکار را در این بخش بررسی کن.
                </p>
              </div>
            </div>
          </div>

          {photoClosed && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
            >
              {photoClosed}
            </div>
          )}

          {!active && !photoClosed && (
            <div className="flex items-center gap-3 rounded-xl border border-[#E8EDF4] bg-white p-4 dark:border-[#29364C] dark:bg-[#151F31]">
              <Icon name="lock" className="h-5 w-5 shrink-0 text-[#98A2B3]" />
              <p className="text-xs text-[#8490A2]">
                رابطه فعالی برای ارسال عکس وجود ندارد.
              </p>
            </div>
          )}

          {!photoClosed && (
            <div className="min-w-0 overflow-hidden rounded-2xl border border-[#E8EDF4] bg-white p-3 sm:p-5 dark:border-[#29364C] dark:bg-[#151F31]">
              <BodyPhotoSets
                sets={sets}
                previews={previewMap}
                canUpload={active}
                canReview={false}
                pending={pending}
                onUpload={uploadPhoto}
                onReview={() => {}}
              />
            </div>
          )}
        </div>
      )}

      {/* Records */}
      {panel === "records" && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard
              label="تعداد رکوردها"
              value={shown(records.length)}
              unit="رکورد"
              icon="trophy"
              accent="bg-[#FFF5E5] text-[#D99B35] dark:bg-[#392D18] dark:text-[#F2C16D]"
            />
            <MetricCard
              label="حرکت‌های موجود"
              value={shown(exercises.length)}
              unit="حرکت"
              icon="ruler"
              accent="bg-[#EAF3FF] text-[#007BFF] dark:bg-[#142D4D] dark:text-[#75B8FF]"
            />
            <MetricCard
              label="وضعیت ثبت"
              value={active ? "فعال" : "غیرفعال"}
              unit="ارتباط"
              icon="check"
              accent="bg-[#EAF8F1] text-[#229A65] dark:bg-[#143629] dark:text-[#70D6A4]"
            />
          </div>

          {active ? (
            <section className="overflow-hidden rounded-2xl border border-[#E7ECF3] bg-white dark:border-[#29364C] dark:bg-[#151F31]">
              <div className="border-b border-[#EDF0F5] px-5 py-4 dark:border-[#29364C]">
                <p className="text-[10px] font-bold tracking-wider text-[#007BFF]">
                  NEW PERSONAL RECORD
                </p>
                <h3 className="mt-1.5 text-base font-bold text-[#263449] dark:text-white">
                  ثبت رکورد جدید
                </h3>
                <p className="mt-1 text-xs text-[#98A2B3]">
                  رکورد جدید ورزشکار را وارد کن.
                </p>
              </div>

              <form onSubmit={saveRecord} className="p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={`${labelClass} sm:col-span-2`}>
                    انتخاب حرکت ورزشی
                    <select
                      required
                      value={recordForm.exercise_id ?? ""}
                      onChange={(event) =>
                        setRecordField({ exercise_id: event.target.value })
                      }
                      className={control}
                    >
                      <option value="">یک حرکت انتخاب کن</option>
                      {exercises.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <p className={labelClass}>نوع رکورد</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#F2F5F9] p-1 dark:bg-[#101827]">
                      {[
                        ["max_weight_g", "وزنه"],
                        ["max_reps", "تکرار"],
                      ].map(([id, label]) => {
                        const selected =
                          (recordForm.metric ?? "max_weight_g") === id;

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setRecordField({ metric: id })}
                            aria-pressed={selected}
                            className={`min-h-11 rounded-lg px-3 text-xs font-bold transition ${ring} ${
                              selected
                                ? "bg-white text-[#007BFF] shadow-sm dark:bg-[#24344C] dark:text-[#75B8FF]"
                                : "text-[#8490A2] hover:text-[#344054] dark:text-[#9AA8BB]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="record-value" className={labelClass}>
                      مقدار رکورد
                    </label>
                    <div className="mt-2 flex min-h-12 overflow-hidden rounded-xl border border-[#E3E8EF] bg-[#FAFBFD] focus-within:border-[#007BFF] focus-within:ring-4 focus-within:ring-[#007BFF]/10 dark:border-[#2C3950] dark:bg-[#101827]">
                      <input
                        id="record-value"
                        required
                        inputMode="decimal"
                        autoComplete="off"
                        value={recordForm.value ?? ""}
                        onChange={(event) =>
                          setRecordField({ value: event.target.value })
                        }
                        className="w-full min-w-0 bg-transparent px-4 text-sm text-[#263449] outline-none dark:text-white"
                        placeholder="مقدار را وارد کن"
                      />
                      <span className="flex items-center border-r border-[#E3E8EF] bg-[#F1F4F8] px-4 text-xs text-[#7B8798] dark:border-[#2C3950] dark:bg-[#1B273A] dark:text-[#AAB6C8]">
                        {metricUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {current && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE9F9] bg-[#F5F9FF] p-3.5 dark:border-[#294467] dark:bg-[#14243A]">
                    <div>
                      <p className="text-[10px] text-[#8193AB]">
                        رکورد فعلی این حرکت
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#344054] dark:text-white">
                        {chosen?.name}
                      </p>
                    </div>
                    <span className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#007BFF] dark:bg-[#1C3B63] dark:text-[#75B8FF]">
                      {current.display}
                    </span>
                  </div>
                )}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] leading-6 text-[#98A2B3]">
                    مقدار جدید باید از رکورد فعلی همان حرکت بیشتر باشد.
                  </p>
                  <button
                    type="submit"
                    disabled={pending}
                    aria-busy={pending}
                    className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#087BEE] px-7 text-sm font-bold text-white transition hover:bg-[#0069D9] disabled:opacity-50 sm:w-auto ${ring}`}
                  >
                    {pending ? (
                      <Icon name="spinner" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="plus" className="h-4 w-4" />
                    )}
                    {pending ? "در حال ثبت..." : "ثبت رکورد"}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-[#E8EDF4] bg-white p-4 dark:border-[#29364C] dark:bg-[#151F31]">
              <Icon name="lock" className="h-5 w-5 shrink-0 text-[#98A2B3]" />
              <p className="text-xs text-[#8490A2]">
                رابطه فعال نیست؛ امکان ثبت رکورد جدید وجود ندارد.
              </p>
            </div>
          )}

          <section>
            <SectionHeading
              eyebrow="PERFORMANCE HISTORY"
              title="تاریخچه رکوردهای ورزشی"
              description="سوابق قدرت و عملکرد ورزشکار."
              count={records.length}
            />

            {records.length === 0 ? (
              <EmptyState
                icon="trophy"
                title="هنوز رکوردی ثبت نشده است"
                description="با ثبت اولین رکورد، اطلاعات عملکرد ورزشی در این بخش نمایش داده خواهد شد."
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {records.map((item) => (
                  <article
                    key={item.id}
                    className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E8EDF4] bg-white p-4 transition hover:border-[#C9DFFF] dark:border-[#29364C] dark:bg-[#151F31] dark:hover:border-[#35517F]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF5E5] text-[#D99B35] dark:bg-[#392D18] dark:text-[#F2C16D]">
                      <Icon name="trophy" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#344054] dark:text-white">
                        {item.exercise_name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-[#98A2B3]">
                        <span>{item.metric_label}</span>
                        <span>·</span>
                        <span>{when(item.recorded_at)}</span>
                        {item.manual && (
                          <span className="rounded-md bg-[#FFF4E0] px-2 py-1 text-[9px] font-semibold text-[#B45309] dark:bg-[#3A2A10] dark:text-[#FBBF6B]">
                            دستی
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg bg-[#EEF5FF] px-3 py-2 text-sm font-bold text-[#007BFF] dark:bg-[#142D4D] dark:text-[#75B8FF]">
                      {item.display}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Compare */}
      {panel === "compare" && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl bg-[#111D32] p-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#83BCFF]">
                <Icon name="compare" />
              </span>
              <div>
                <h3 className="text-sm font-bold">مقایسه پیشرفت بدن</h3>
                <p className="mt-1 text-xs text-[#9AABC4]">
                  تغییرات بین دو اندازه‌گیری را بررسی کن.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-[#E8EDF4] bg-white p-4 sm:grid-cols-2 sm:p-5 dark:border-[#29364C] dark:bg-[#151F31]">
            <label className={labelClass}>
              <span className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#A7B1C0]" />
                اندازه‌گیری قبلی
              </span>
              <select
                value={beforeId ?? ""}
                onChange={(event) => setBeforeId(event.target.value)}
                className={control}
              >
                <option value="">تاریخ قبلی را انتخاب کن</option>
                {observations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {observationChoice(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              <span className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#007BFF]" />
                اندازه‌گیری جدید
              </span>
              <select
                value={afterId ?? ""}
                onChange={(event) => setAfterId(event.target.value)}
                className={control}
              >
                <option value="">تاریخ جدید را انتخاب کن</option>
                {observations.map((item) => (
                  <option key={`after-${item.id}`} value={item.id}>
                    {observationChoice(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {beforeId && afterId && beforeId === afterId && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
            >
              برای مقایسه، باید دو تاریخ متفاوت انتخاب کنی.
            </div>
          )}

          {(!beforeId || !afterId) && (
            <div className="rounded-xl border border-dashed border-[#DCE3ED] bg-white px-4 py-5 text-center dark:border-[#2A3550] dark:bg-[#151F31]">
              <p className="text-xs text-[#98A2B3]">
                دو تاریخ را انتخاب کن تا نتایج مقایسه نمایش داده شوند.
              </p>
            </div>
          )}

          {beforeId &&
            afterId &&
            beforeId !== afterId &&
            compare?.metrics?.length > 0 && (
              <section>
                <SectionHeading
                  eyebrow="PROGRESS ANALYSIS"
                  title="نتیجه مقایسه"
                  description="میزان تغییر هر شاخص بین دو اندازه‌گیری."
                  count={compare.metrics.length}
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {compare.metrics.map((item) => {
                    const delta = Number(item.delta);
                    const hasDelta =
                      item.delta !== null &&
                      item.delta !== undefined &&
                      item.delta !== "" &&
                      !Number.isNaN(delta);

                    const changed = hasDelta && delta !== 0;

                    return (
                      <article
                        key={item.metric}
                        className="overflow-hidden rounded-2xl border border-[#E8EDF4] bg-white dark:border-[#29364C] dark:bg-[#151F31]"
                      >
                        <div className="border-b border-[#EDF0F5] px-4 py-3 dark:border-[#29364C]">
                          <p className="text-xs font-bold text-[#344054] dark:text-white">
                            {METRIC_LABELS[item.metric] || "اندازه"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-3">
                          <div className="rounded-xl bg-[#F6F8FB] p-3 dark:bg-[#101827]">
                            <p className="text-[10px] text-[#98A2B3]">
                              مقدار قبلی
                            </p>
                            <p className="mt-2 break-words text-sm font-bold text-[#647084] dark:text-[#B6C2D6]">
                              {withUnit(item.before, item.metric)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#EDF5FF] p-3 dark:bg-[#142D4D]">
                            <p className="text-[10px] text-[#6B95C8] dark:text-[#91B9E8]">
                              مقدار جدید
                            </p>
                            <p className="mt-2 break-words text-sm font-bold text-[#007BFF] dark:text-[#83BCFF]">
                              {withUnit(item.after, item.metric)}
                            </p>
                          </div>
                        </div>

                        <div className="px-3 pb-3">
                          <div
                            className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${
                              changed
                                ? "bg-[#ECF8F1] text-[#188452] dark:bg-[#143629] dark:text-[#70D6A4]"
                                : "bg-[#F3F5F8] text-[#788397] dark:bg-[#202C40] dark:text-[#AAB6C8]"
                            }`}
                          >
                            <span className="text-[10px] font-semibold">
                              میزان تغییر
                            </span>
                            <span className="text-xs font-bold">
                              {changeText(item.delta, item.metric)}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

          {beforeId &&
            afterId &&
            beforeId !== afterId &&
            compare &&
            compare.metrics?.length === 0 && (
              <EmptyState
                icon="compare"
                title="اطلاعات مشترکی برای مقایسه وجود ندارد"
                description="برای تاریخ‌های انتخاب‌شده اندازه مشترکی ثبت نشده است."
              />
            )}
        </div>
      )}

      {/* Report */}
      {panel === "report" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8EDF4] bg-white dark:border-[#29364C] dark:bg-[#151F31]">
          <div className="border-b border-[#EDF0F5] px-4 py-4 sm:px-5 dark:border-[#29364C]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#007BFF] dark:bg-[#142D4D] dark:text-[#75B8FF]">
                <Icon name="chart" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-[#007BFF]">
                  ATHLETE OVERVIEW
                </p>
                <h3 className="mt-1 text-sm font-bold text-[#344054] dark:text-white">
                  گزارش جامع ورزشکار
                </h3>
              </div>
            </div>
          </div>

          <div className="min-w-0 p-3 sm:p-5">
            <AthleteReport
              name={name}
              observations={observations}
              records={records}
              photos={photos}
              workouts={workouts}
              meals={meals}
              sessions={sessions}
              programsEmpty="برنامه‌ای ثبت نشده است."
            />
          </div>
        </div>
      )}
    </section>
  );
}
