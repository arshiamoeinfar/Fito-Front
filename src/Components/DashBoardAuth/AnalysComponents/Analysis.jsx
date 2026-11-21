
import React from "react";
import JalaliField from "../../../Components/shared/JalaliField/JalaliField";
import AthleteReport from "../../../pages/coach/AthleteReport"
import BodyPhotoSets from "../../../Components/shared/BodyPhotoSets/BodyPhotoSets";

const MAIN_FIELDS = [
  ["weight_kg", "وزن (کیلوگرم)"],
  ["height_cm", "قد (سانتی‌متر)"],
  ["waist_cm", "دور کمر (سانتی‌متر)"],
];

const EXTRA_FIELDS = [
  ["chest_cm", "دور سینه (سانتی‌متر)"],
  ["hip_cm", "دور باسن (سانتی‌متر)"],
  ["neck_cm", "دور گردن (سانتی‌متر)"],
  ["left_arm_cm", "دور بازوی چپ (سانتی‌متر)"],
  ["right_arm_cm", "دور بازوی راست (سانتی‌متر)"],
  ["left_thigh_cm", "دور ران چپ (سانتی‌متر)"],
  ["right_thigh_cm", "دور ران راست (سانتی‌متر)"],
  ["body_fat_percent", "چربی بدن (درصد)"],
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
  ["sizes", "اندازه‌ها"],
  ["photos", "عکس‌ها"],
  ["records", "رکوردها"],
  ["compare", "مقایسه"],
  ["report", "گزارش کلی"],
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
  return `${shown(Math.abs(number))}${unit ? ` ${unit}` : ""} ${number > 0 ? "بیشتر" : "کمتر"
    }`;
}

function sourceLabel(source) {
  if (source === "coach") return "ثبت مربی";
  if (source === "manual" || source === "device") return "ثبت ورزشکار";
  return "";
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
  return (
    <section
      dir="rtl"
      className="col-span-12 rounded-3xl bg-white p-4 text-right sm:p-7"
    >
      <h2 className="text-2xl font-primary text-[#6B6F77]">{name}</h2>

      <p className="mt-4 text-sm leading-7 text-[#6B6F77]">
        {weightNow
          ? `آخرین وزن ${withUnit(weightNow, "weight_kg")}`
          : "وزنی ثبت نشده"}
        {" · "}
        {waistNow
          ? `دور کمر ${withUnit(waistNow, "waist_cm")}`
          : "دور کمر ثبت نشده"}
        {" · "}
        {photos.length.toLocaleString("fa-IR")} عکس
        {" · "}
        {records[0]
          ? `آخرین رکورد ${records[0].exercise_name} ${records[0].display}`
          : "رکوردی نیست"}
      </p>

      {error ? (
        <p className="mt-4 text-sm text-red-700">{error}</p>
      ) : null}

      {notice ? (
        <p className="mt-3 text-sm text-green-700">{notice}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {PANELS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() =>
              setPanel((current) => (current === id ? null : id))
            }
            className={`rounded-2xl px-4 py-2 text-sm ${panel === id
              ? "bg-[#007BFF] text-white"
              : "bg-white text-[#007BFF] ring-1 ring-[#D6E6FF]"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === "sizes" ? (
        <div className="mt-5">
          <form
            onSubmit={saveObservation}
            className="grid gap-3 md:grid-cols-4"
          >
            <label className="text-sm text-[#6B6F77]">
              زمان
              <JalaliField
                required
                withTime
                value={measuredAt}
                onChange={setMeasuredAt}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>

            {MAIN_FIELDS.map(([key, label]) => (
              <label key={key} className="text-sm text-[#6B6F77]">
                {label}
                <input
                  inputMode="decimal"
                  value={metrics[key]}
                  onChange={(event) =>
                    setMetrics((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
            ))}

            <details className="rounded-2xl bg-[#F5F7FB] p-4 md:col-span-4">
              <summary className="cursor-pointer text-sm text-[#007BFF]">
                سایزهای دیگر
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                {EXTRA_FIELDS.map(([key, label]) => (
                  <label key={key} className="text-sm text-[#6B6F77]">
                    {label}
                    <input
                      inputMode="decimal"
                      value={metrics[key]}
                      onChange={(event) =>
                        setMetrics((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                  </label>
                ))}
              </div>
            </details>

            <label className="flex items-center gap-2 text-sm text-[#6B6F77] md:col-span-4">
              <input
                type="checkbox"
                checked={share}
                disabled={!active}
                onChange={(event) => {
                  shareTouched.current = true;
                  setShare(event.target.checked);
                }}
              />
              مربی و دستیار هوش مصنوعی این ثبت را می‌بینند
            </label>

            <button
              type="submit"
              disabled={pending}
              className="w-fit rounded-2xl bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-50 md:col-span-4"
            >
              ثبت اندازه
            </button>
          </form>

          <ul className="mt-4 space-y-3">
            {observations.length === 0 ? (
              <li className="text-sm text-[#A0A4AA]">
                هنوز اندازه‌ای ثبت نشده است.
              </li>
            ) : null}

            {observations.map((item) => (
              <li key={item.id} className="rounded-2xl bg-[#F5F7FB] p-4">
                <p className="text-sm text-[#1F2937]">
                  {when(item.measured_at)}
                  {sourceLabel(item.source)
                    ? ` · ${sourceLabel(item.source)}`
                    : ""}
                </p>

                {metricEntries(item.metrics).length === 0 ? (
                  <p className="mt-2 text-sm text-[#A0A4AA]">
                    در این ثبت اندازه‌ای نیست.
                  </p>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {metricEntries(item.metrics).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-[#A0A4AA]">
                          {METRIC_LABELS[key] || "اندازه"}
                        </p>
                        <p className="mt-1 text-base text-[#1F2937]">
                          {withUnit(value, key)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {panel === "photos" ? (
        <div>
          {photoClosed ? (
            <p className="mt-5 text-sm text-red-700">{photoClosed}</p>
          ) : null}

          {!active && !photoClosed ? (
            <p className="mt-5 text-sm text-[#A0A4AA]">
              رابطه فعالی برای فرستادن عکس نیست.
            </p>
          ) : null}

          {!photoClosed ? (
            <BodyPhotoSets
              sets={sets}
              previews={previewMap}
              canUpload={active}
              canReview={false}
              pending={pending}
              onUpload={uploadPhoto}
              onReview={() => { }}
            />
          ) : null}
        </div>
      ) : null}

      {panel === "records" ? (
        (() => {
          const metricUnit = recordForm.metric === "max_reps" ? "تکرار" : "کیلوگرم";
          const chosen = exercises.find((item) => String(item.id) === String(recordForm.exercise_id));
          const current = chosen
            ? records
              .filter((item) => item.exercise_name === chosen.name && item.metric === recordForm.metric)
              .reduce((best, item) => (!best || Number(item.amount) > Number(best.amount) ? item : best), null)
            : null;
          const setField = (patch) => setRecordForm((state) => ({ ...state, ...patch }));
          const ring =
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121A2B]";
          const control =
            "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-[#E3E8F0] bg-white px-4 py-3 text-base font-normal text-[#1F2937] outline-none transition focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 sm:text-sm dark:border-[#2A3550] dark:bg-[#0B1220] dark:text-[#F3F4F6] dark:[color-scheme:dark] dark:focus:ring-[#007BFF]/25";

          return (
            <div className="mt-5 flex flex-col gap-5">
              {/* توضیح */}
              <div className="flex items-start gap-3 rounded-2xl bg-[#F2F8FF] px-4 py-3.5 dark:bg-[#0F2038]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF] shadow-sm dark:bg-[#0B1220] dark:text-[#6CB0FF] dark:shadow-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
                  </svg>
                </span>
                <p className="text-sm leading-7 text-[#4B5563] dark:text-[#B6C2D6]">
                  رکورد باید از رکورد فعلی همان حرکت بیشتر باشد. دستیار این رابطه
                  همین فهرست را می‌خواند.
                </p>
              </div>

              {/* فرم ثبت */}
              {active ? (
                <form
                  onSubmit={saveRecord}
                  aria-labelledby="record-form-title"
                  className="rounded-2xl border border-[#E8ECF4] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5 dark:border-[#232D42] dark:bg-[#121A2B] dark:shadow-none"
                >
                  <h4 id="record-form-title" className="text-base font-semibold text-[#1F2937] dark:text-[#F3F4F6]">ثبت رکورد جدید</h4>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="min-w-0 text-sm font-medium text-[#6B6F77] md:col-span-2 dark:text-[#9AA3B2]">
                      حرکت
                      <select
                        required
                        value={recordForm.exercise_id}
                        onChange={(event) => setField({ exercise_id: event.target.value })}
                        className={control}
                      >
                        <option value="">یک حرکت</option>
                        {exercises.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="min-w-0">
                      <p id="metric-label" className="text-sm font-medium text-[#6B6F77] dark:text-[#9AA3B2]">نوع رکورد</p>
                      <div role="group" aria-labelledby="metric-label" className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#EEF1F6] p-1 dark:bg-[#0B1220]">
                        {[
                          ["max_weight_g", "سنگین‌ترین وزنه"],
                          ["max_reps", "بیشترین تکرار"],
                        ].map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setField({ metric: id })}
                            aria-pressed={recordForm.metric === id}
                            className={`min-h-10 rounded-lg px-2 py-2 text-sm transition ${ring} ${recordForm.metric === id
                                ? "bg-white font-medium text-[#007BFF] shadow-sm dark:bg-[#1E293B] dark:text-[#6CB0FF] dark:shadow-none"
                                : "text-[#6B6F77] hover:text-[#1F2937] dark:text-[#9AA3B2] dark:hover:text-[#F3F4F6]"
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label htmlFor="record-value" className="text-sm font-medium text-[#6B6F77] dark:text-[#9AA3B2]">مقدار</label>
                      <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-[#E3E8F0] bg-white transition focus-within:border-[#007BFF] focus-within:ring-4 focus-within:ring-[#007BFF]/10 dark:border-[#2A3550] dark:bg-[#0B1220] dark:focus-within:ring-[#007BFF]/25">
                        <input
                          id="record-value"
                          required
                          inputMode="decimal"
                          autoComplete="off"
                          value={recordForm.value}
                          onChange={(event) => setField({ value: event.target.value })}
                          className="min-h-12 w-full min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-[#1F2937] outline-none sm:text-sm dark:text-[#F3F4F6]"
                        />
                        <span className="flex shrink-0 items-center border-r border-[#E3E8F0] bg-[#F5F7FB] px-4 text-xs text-[#6B6F77] dark:border-[#2A3550] dark:bg-[#172036] dark:text-[#9AA3B2]">
                          {metricUnit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {current ? (
                    <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#6B6F77] dark:bg-[#0F1626] dark:text-[#9AA3B2]">
                      رکورد فعلی این حرکت:
                      <span className="rounded-full bg-[#EAF4FF] px-3 py-0.5 text-xs font-bold text-[#0B63CE] dark:bg-[#12294A] dark:text-[#7CB4FF]">{current.display}</span>
                      <span className="text-xs">مقدار تازه باید بیشتر از این باشد.</span>
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending}
                    aria-busy={pending}
                    className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgba(0,123,255,0.5)] transition hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:shadow-none ${ring}`}
                  >
                    {pending ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 motion-safe:animate-spin" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                        <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                    {pending ? "در حال ثبت" : "ثبت رکورد"}
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl bg-[#F1F4F9] px-4 py-3.5 text-sm text-[#6B6F77] dark:bg-[#172036] dark:text-[#9AA3B2]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#8A93A3] dark:bg-[#0B1220] dark:text-[#9AA3B2]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                      <path d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z" />
                    </svg>
                  </span>
                  <p className="leading-7">رابطه فعال نیست؛ رکورد جدید ثبت نمی‌شود.</p>
                </div>
              )}

              {/* فهرست رکوردها */}
              <section aria-labelledby="records-title">
                <div className="mb-3 flex items-center gap-2">
                  <h4 id="records-title" className="text-base font-semibold text-[#1F2937] dark:text-[#F3F4F6]">رکوردهای ثبت‌شده</h4>
                  {records.length > 0 ? (
                    <span className="rounded-full bg-[#EEF1F6] px-2.5 py-0.5 text-xs font-medium text-[#6B6F77] dark:bg-[#1E293B] dark:text-[#9AA3B2]">
                      {records.length.toLocaleString("fa-IR")}
                    </span>
                  ) : null}
                </div>

                {records.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#DDE3EE] bg-[#FAFBFD] px-4 py-10 text-center dark:border-[#2A3550] dark:bg-[#0F1626]">
                    <span className="text-3xl" aria-hidden="true">🏆</span>
                    <p className="text-sm font-medium text-[#4B5563] dark:text-[#B6C2D6]">رکوردی ثبت نشده است.</p>
                  </div>
                ) : (
                  <ul className="grid gap-3 lg:grid-cols-2">
                    {records.map((item) => (
                      <li
                        key={item.id}
                        className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#EEF1F6] bg-white p-3.5 transition hover:border-[#D6E6FF] sm:gap-4 sm:p-4 dark:border-[#232D42] dark:bg-[#121A2B] dark:hover:border-[#35517F]"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#007BFF] sm:h-12 sm:w-12 dark:bg-[#12294A] dark:text-[#6CB0FF]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                            <path d={item.metric === "max_reps"
                              ? "M17 2l3 3-3 3M4 11V9a4 4 0 014-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 01-4 4H4"
                              : "M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"} />
                          </svg>
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">{item.exercise_name}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8A93A3] dark:text-[#8B97AD]">
                            <span>{item.metric_label}</span>
                            <span aria-hidden="true">·</span>
                            <span>{when(item.recorded_at)}</span>
                            {item.manual ? (
                              <span className="rounded-full bg-[#FFF4E0] px-2 py-0.5 text-[11px] font-medium text-[#B45309] dark:bg-[#3A2A10] dark:text-[#FBBF6B]">ثبت دستی</span>
                            ) : null}
                          </p>
                        </div>

                        <p className="shrink-0 text-base font-bold text-[#007BFF] sm:text-lg dark:text-[#6CB0FF]">{item.display}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          );
        })()
      ) : null}


      {panel === "compare" ? (
        <div className="mt-5 rounded-2xl border border-[#E8ECF4] bg-[#FAFBFD] p-4 sm:p-5">
          <p className="text-sm leading-7 text-[#6B6F77]">
            ثبت قدیمی‌تر را در «ثبت قبلی» و ثبت جدیدتر را در «ثبت بعدی» بگذار.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm font-medium text-[#6B6F77]">
              ثبت قبلی
              <select
                value={beforeId}
                onChange={(event) => setBeforeId(event.target.value)}
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#E3E8F0] bg-white px-4 py-3 text-base font-normal text-[#1F2937] outline-none transition focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 sm:text-sm"
              >
                <option value="">یک تاریخ انتخاب کن</option>
                {observations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {observationChoice(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2 text-sm font-medium text-[#6B6F77]">
              ثبت بعدی
              <select
                value={afterId}
                onChange={(event) => setAfterId(event.target.value)}
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#E3E8F0] bg-white px-4 py-3 text-base font-normal text-[#1F2937] outline-none transition focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 sm:text-sm"
              >
                <option value="">یک تاریخ انتخاب کن</option>
                {observations.map((item) => (
                  <option key={`after-${item.id}`} value={item.id}>
                    {observationChoice(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {beforeId && afterId && beforeId === afterId ? (
            <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              دو ثبت باید با هم فرق داشته باشند.
            </p>
          ) : null}

          {!beforeId || !afterId ? (
            <p className="mt-3 rounded-xl bg-[#F1F4F9] px-4 py-2.5 text-sm text-[#6B6F77]">
              تا هر دو تاریخ را انتخاب نکنی، مقایسه‌ای نشان داده نمی‌شود.
            </p>
          ) : null}

          {compare?.metrics?.length ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {compare.metrics.map((item) => (
                <li
                  key={item.metric}
                  className="min-w-0 rounded-2xl border border-[#EEF1F6] bg-white p-4"
                >
                  <p className="text-sm font-medium text-[#1F2937]">
                    {METRIC_LABELS[item.metric] || "اندازه"}
                  </p>
                  <p className="mt-2 break-words text-sm text-[#6B6F77]">
                    قبلی {withUnit(item.before, item.metric)}
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-[#1F2937]">
                    بعدی {withUnit(item.after, item.metric)}
                  </p>
                  <p className="mt-3 inline-flex w-fit max-w-full rounded-full bg-[#EAF4FF] px-3 py-1 text-xs font-medium text-[#0B63CE]">
                    {changeText(item.delta, item.metric)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {panel === "report" ? (
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
      ) : null}
    </section>
  );
}
