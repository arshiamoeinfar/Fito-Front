
import { useEffect, useState } from "react";
import { athleteBody } from "./athleteBody";
import {
  X,
  PlusCircle,
  Dumbbell,
  Clock3,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Activity,
} from "lucide-react";

const defaultInstructions = [
  "وضعیت شروع را با فرم صحیح تنظیم کن.",
  "حرکت را آرام و کنترل‌شده انجام بده.",
  "عضله هدف را در طول حرکت درگیر نگه دار.",
  "به‌آرامی به وضعیت شروع برگرد.",
];

const trackingLabels = {
  weight_reps: "وزنه و تکرار",
  reps: "تکرار",
  duration: "زمان",
  distance: "مسافت",
};

const backMuscles = new Set(["زیر بغل", "پشت", "کول", "باسن", "پشت پا", "ساق"]);

function readingDirection(text) {
  const latin = (String(text).match(/[A-Za-z]/g) || []).length;
  const persian = (String(text).match(/[\u0600-\u06FF]/g) || []).length;

  return latin > persian ? "ltr" : "rtl";
}

function exerciseSteps(exercise) {
  const source = Array.isArray(exercise?.instructions)
    ? exercise.instructions
    : [exercise?.instructions, exercise?.description];
  const lines = source
    .flatMap((item) => String(item || "").split("\n"))
    .map((line) => line.trim())
    .filter((line) => line !== "");

  return lines.length > 0 ? lines : defaultInstructions;
}

const bodyTone = "#D5DCE4";
const targetTone = "#007BFF";
const inertParts = new Set(["hair", "head", "hands", "feet", "knees", "ankles"]);

const figureFor = {
  سینه: { side: "front", parts: ["chest"] },
  شکم: { side: "front", parts: ["abs", "obliques"] },
  سرشانه: { side: "front", parts: ["deltoids"] },
  بازو: { side: "front", parts: ["biceps", "triceps"] },
  ساعد: { side: "front", parts: ["forearm"] },
  "جلو پا": { side: "front", parts: ["quadriceps"] },
  گردن: { side: "front", parts: ["neck"] },
  "زیر بغل": { side: "back", parts: ["upper-back"] },
  پشت: { side: "back", parts: ["lower-back"] },
  کول: { side: "back", parts: ["trapezius"] },
  باسن: { side: "back", parts: ["gluteal"] },
  "پشت پا": { side: "back", parts: ["hamstring"] },
  ساق: { side: "back", parts: ["calves"] },
};

function AthleticFigure({ muscle }) {
  const spec = figureFor[muscle];
  const side = spec?.side || "front";
  const whole = muscle === "تمام‌بدن" || muscle === "کاردیو";
  const highlight = new Set(spec?.parts || []);
  const figure = athleteBody[side];

  return (
    <svg viewBox={figure.vb} className="mx-auto h-[390px] w-auto" role="img" aria-label={`اندام ورزشکار، عضله هدف ${muscle}`}>
      {figure.order.flatMap((name) =>
        figure.parts[name].map((d, index) => (
          <path
            key={`${name}-${index}`}
            d={d}
            fill={
              !inertParts.has(name) && (whole || highlight.has(name))
                ? targetTone
                : name === "hair"
                  ? "#8E98A3"
                  : bodyTone
            }
          />
        )),
      )}
    </svg>
  );
}

function AnatomyView({ muscle = "عمومی", secondary = [] }) {
  const view = backMuscles.has(muscle) ? "نمای پشت" : "نمای جلو";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">آناتومی عضلات</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{view}</span>
      </div>

      <AthleticFigure muscle={muscle} />

      <p className="mt-2 text-center text-sm font-medium text-slate-700">
        {`عضله هدف: ${muscle}`}
      </p>
      {secondary.length > 0 ? (
        <p className="mt-1 text-center text-xs leading-5 text-slate-500">
          {`عضلات کمکی: ${secondary.join("، ")}`}
        </p>
      ) : null}
    </div>
  );
}

export default function ExerciseDetailsModal({
  exercise,
  student,
  onClose,
  onAdd,
}) {
  const [settings, setSettings] = useState({
    sets: exercise?.sets ?? 3,
    reps: exercise?.reps ?? "10-12",
    rest: exercise?.rest ?? 60,
    weight: exercise?.weight ?? "",
    notes: exercise?.notes ?? "",
  });

  useEffect(() => {
    if (!exercise) return;

    setSettings({
      sets: exercise.sets ?? 3,
      reps: exercise.reps ?? "10-12",
      rest: exercise.rest ?? 60,
      weight: exercise.weight ?? "",
      notes: exercise.notes ?? "",
    });
  }, [exercise]);

  useEffect(() => {
    if (!exercise) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [exercise, onClose]);

  if (!exercise) return null;

  const instructions = exerciseSteps(exercise);
  const secondary = Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : [];
  const tracking = trackingLabels[exercise.trackingType] || "ثبت حرکت";
  const writtenGuide = String(exercise.goal || "").trim();
  const guide = writtenGuide
    || `این حرکت روی ${exercise.muscle || "عضله هدف"} تمرکز دارد${secondary.length ? ` و ${secondary.join(" و ")} را هم درگیر می‌کند` : ""}.`;

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleAdd = () => {
    const sets = Number(settings.sets);
    const rest = Number(settings.rest);

    if (!Number.isInteger(sets) || sets < 1 || sets > 20) {
      return;
    }

    if (!Number.isFinite(rest) || rest < 0 || rest > 600) {
      return;
    }

    if (!String(settings.reps).trim()) {
      return;
    }

    onAdd?.({
      ...exercise,
      ...settings,
      sets,
      rest,
      studentId: student?.id ?? null,
      studentName: student?.name ?? null,
    });

    onClose?.();
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-modal-title"
        className="relative max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-[26px] bg-white p-4 shadow-2xl sm:p-6 lg:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن پنجره"
          className="absolute left-4 top-4 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
        >
          <X size={20} />
        </button>

        {/* هدر مخصوص پنل مربی */}
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="pr-1">
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
              <Dumbbell size={17} />
              <span>تنظیم برنامه تمرینی</span>
            </div>

            <h2
              id="exercise-modal-title"
              className="text-xl font-bold text-slate-800 sm:text-2xl"
            >
              {exercise.name}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {student?.name
                ? `در حال تنظیم حرکت برای ${student.name}`
                : "جزئیات حرکت و تنظیمات تمرین شاگرد"}
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700">
            {exercise.target || `عضله هدف: ${exercise.muscle || "عمومی"}`}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ستون اطلاعات و آناتومی */}
          <div className="min-w-0 space-y-5">
            <div className="overflow-hidden rounded-2xl bg-slate-900">
              <img
                src={exercise.image}
                alt={exercise.name}
                className="aspect-video w-full object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 p-3">
                <Activity className="mb-2 text-blue-500" size={20} />
                <p className="text-xs text-slate-400">نوع ثبت</p>
                <p className="mt-1 text-sm font-bold text-slate-700">
                  {tracking}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <Clock3 className="mb-2 text-blue-500" size={20} />
                <p className="text-xs text-slate-400">زمان استراحت</p>
                <p className="mt-1 text-sm font-bold text-slate-700">
                  {settings.rest} ثانیه
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <Dumbbell className="mb-2 text-blue-500" size={20} />
                <p className="text-xs text-slate-400">تعداد ست</p>
                <p className="mt-1 text-sm font-bold text-slate-700">
                  {settings.sets} ست
                </p>
              </div>
            </div>

            <AnatomyView muscle={exercise.muscle || "عمومی"} secondary={secondary} />
          </div>

          {/* ستون تنظیمات و راهنمای اجرا */}
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="text-sky-600" size={18} />
                <h3 className="font-bold text-slate-800">
                  {student?.name ? `پیشنهاد هوش مصنوعی برای ${student.name}` : "پیشنهاد هوش مصنوعی"}
                </h3>
              </div>
              {exercise.reason ? (
                <>
                  <p className="text-sm leading-7 text-slate-700">{exercise.reason}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    تعداد ست، تکرار و وزنه پایین از همین تحلیل پر شده. اگر عوضشان نکنید، همین مقدارها ذخیره می‌شود.
                  </p>
                </>
              ) : (
                <p className="text-sm leading-7 text-slate-600">
                  اول شاگرد را انتخاب کنید تا تعداد ست، تکرار و وزنه از تحلیل همان شاگرد پیشنهاد شود.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Dumbbell className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800">
                  تنظیمات حرکت برای شاگرد
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium text-slate-600">
                  تعداد ست
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.sets}
                    onChange={(event) =>
                      updateSetting("sets", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-600">
                  تعداد تکرار
                  <input
                    type="text"
                    value={settings.reps}
                    onChange={(event) =>
                      updateSetting("reps", event.target.value)
                    }
                    placeholder="مثلاً 10-12"
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-600">
                  استراحت (ثانیه)
                  <input
                    type="number"
                    min="0"
                    max="600"
                    step="5"
                    value={settings.rest}
                    onChange={(event) =>
                      updateSetting("rest", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-600">
                  وزنه (کیلوگرم)
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={settings.weight}
                    onChange={(event) =>
                      updateSetting("weight", event.target.value)
                    }
                    placeholder="اختیاری"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm font-medium text-slate-600">
                یادداشت اختصاصی مربی برای این حرکت
                <textarea
                  rows={3}
                  value={settings.notes}
                  onChange={(event) =>
                    updateSetting("notes", event.target.value)
                  }
                  placeholder="مثلاً در ست آخر، اجرای حرکت آهسته‌تر باشد..."
                  className={`${inputClass} resize-y`}
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  setSettings({
                    sets: 3,
                    reps: "10-12",
                    rest: 60,
                    weight: "",
                    notes: "",
                  })
                }
                className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600"
              >
                <RotateCcw size={14} />
                بازگرداندن مقادیر پیش‌فرض
              </button>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">
                  راهنمای هوشمند حرکت
                </h3>
              </div>

              <div className="mb-4 rounded-xl bg-blue-50 p-4">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs text-white">
                  <Sparkles size={12} />
                  راهنما
                </span>

                <p dir={readingDirection(guide)} className="text-sm leading-7 text-slate-600">
                  {guide}
                </p>
              </div>

              <h4 className="mb-4 text-sm font-bold text-slate-700">نحوه اجرا</h4>

              <ol className="space-y-3">
                {instructions.map(
                  (item, index) => (
                    <li
                      key={`step-${index}`}
                      className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                        {index + 1}
                      </span>
                      <span dir={readingDirection(item)}>{item}</span>
                    </li>
                  )
                )}
              </ol>

              <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">
                <ShieldCheck className="mt-1 shrink-0" size={16} />
                <p>
                  تنظیمات نهایی باید با سطح آمادگی، هدف تمرینی و شرایط شاگرد
                  هماهنگ باشند.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* دکمه‌های عملیاتی مربی */}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-6 py-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <PlusCircle size={19} />
            افزودن حرکت به برنامه شاگرد
          </button>
        </div>
      </section>
    </div>
  );
}
