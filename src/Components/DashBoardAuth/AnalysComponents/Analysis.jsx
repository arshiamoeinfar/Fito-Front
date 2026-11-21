
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
  return `${shown(Math.abs(number))}${unit ? ` ${unit}` : ""} ${
    number > 0 ? "بیشتر" : "کمتر"
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
            className={`rounded-2xl px-4 py-2 text-sm ${
              panel === id
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
              onReview={() => {}}
            />
          ) : null}
        </div>
      ) : null}

      {panel === "records" ? (
        <div className="mt-5">
          <p className="text-sm leading-7 text-[#6B6F77]">
            رکورد باید از رکورد فعلی همان حرکت بیشتر باشد. دستیار این رابطه
            همین فهرست را می‌خواند.
          </p>

          {active ? (
            <form
              onSubmit={saveRecord}
              className="mt-4 grid gap-3 md:grid-cols-4"
            >
              <label className="text-sm text-[#6B6F77] md:col-span-2">
                حرکت
                <select
                  required
                  value={recordForm.exercise_id}
                  onChange={(event) =>
                    setRecordForm((current) => ({
                      ...current,
                      exercise_id: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <option value="">یک حرکت</option>
                  {exercises.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-[#6B6F77]">
                نوع
                <select
                  value={recordForm.metric}
                  onChange={(event) =>
                    setRecordForm((current) => ({
                      ...current,
                      metric: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <option value="max_weight_g">
                    سنگین‌ترین وزنه (کیلوگرم)
                  </option>
                  <option value="max_reps">بیشترین تکرار</option>
                </select>
              </label>

              <label className="text-sm text-[#6B6F77]">
                مقدار
                <input
                  required
                  inputMode="decimal"
                  value={recordForm.value}
                  onChange={(event) =>
                    setRecordForm((current) => ({
                      ...current,
                      value: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>

              <button
                type="submit"
                disabled={pending}
                className="w-fit rounded-2xl bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-50 md:col-span-4"
              >
                ثبت رکورد
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-[#A0A4AA]">
              رابطه فعال نیست؛ رکورد جدید ثبت نمی‌شود.
            </p>
          )}

          <ul className="mt-4 space-y-2">
            {records.length === 0 ? (
              <li className="text-sm text-[#A0A4AA]">
                رکوردی ثبت نشده است.
              </li>
            ) : null}

            {records.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl bg-[#F5F7FB] px-4 py-3 text-sm text-[#1F2937]"
              >
                {item.exercise_name} · {item.metric_label} · {item.display} ·{" "}
                {when(item.recorded_at)}
                {item.manual ? " · ثبت دستی" : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {panel === "compare" ? (
        <div className="mt-5 rounded-2xl border border-[#EEF2F6] p-4">
          <p className="text-sm leading-7 text-[#6B6F77]">
            ثبت قدیمی‌تر را در «ثبت قبلی» و ثبت جدیدتر را در «ثبت بعدی» بگذار.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[#6B6F77]">
              ثبت قبلی
              <select
                value={beforeId}
                onChange={(event) => setBeforeId(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <option value="">یک تاریخ انتخاب کن</option>
                {observations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {observationChoice(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[#6B6F77]">
              ثبت بعدی
              <select
                value={afterId}
                onChange={(event) => setAfterId(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
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
            <p className="mt-3 text-sm text-[#6B6F77]">
              دو ثبت باید با هم فرق داشته باشند.
            </p>
          ) : null}

          {!beforeId || !afterId ? (
            <p className="mt-3 text-sm text-[#A0A4AA]">
              تا هر دو تاریخ را انتخاب نکنی، مقایسه‌ای نشان داده نمی‌شود.
            </p>
          ) : null}

          {compare?.metrics?.length ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {compare.metrics.map((item) => (
                <li
                  key={item.metric}
                  className="rounded-2xl bg-[#F5F7FB] p-4"
                >
                  <p className="text-sm text-[#1F2937]">
                    {METRIC_LABELS[item.metric] || "اندازه"}
                  </p>
                  <p className="mt-2 text-sm text-[#6B6F77]">
                    قبلی {withUnit(item.before, item.metric)}
                  </p>
                  <p className="mt-1 text-sm text-[#6B6F77]">
                    بعدی {withUnit(item.after, item.metric)}
                  </p>
                  <p className="mt-2 text-sm text-[#007BFF]">
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
