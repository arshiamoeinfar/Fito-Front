
import { useState } from "react";
import {
  Trash2,
  ClipboardList,
  ChevronDown,
  Dumbbell,
  Timer,
  Target,
  Zap,
  Settings2,
} from "lucide-react";

function NumberField({
  label,
  value,
  min = 0,
  max = 999,
  onChange,
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium text-slate-400">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") return onChange("");
          const number = Number(raw);
          if (Number.isFinite(number)) {
            onChange(Math.min(max, Math.max(min, number)));
          }
        }}
        className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </label>
  );
}

function TextField({ label, value, placeholder, onChange }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium text-slate-400">
      <span>{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </label>
  );
}

export default function WorkoutPlanTable({
  day,
  items,
  onUpdate,
  onRemove,
}) {
  const [expandedItems, setExpandedItems] = useState([]);

  const toggleDetails = (id) => {
    setExpandedItems((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  };

  const totalSets = items.reduce(
    (total, item) => total + (Number(item.sets) || 0),
    0
  );

  const update = (id, field, value) => {
    onUpdate(id, field, value);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4">

        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#007BFF]">
            <Dumbbell size={19} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-700">
              برنامه تمرینی
              <span className="mr-1 text-[#007BFF]">{day}</span>
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              تنظیم جزئیات و شدت تمرینات
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
            <p className="text-sm font-bold text-[#007BFF]">
              {items.length}
            </p>
            <p className="text-[10px] text-slate-400">حرکت</p>
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
            <p className="text-sm font-bold text-slate-700">
              {totalSets}
            </p>
            <p className="text-[10px] text-slate-400">مجموع ست</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-500">
            <ClipboardList size={22} />
          </span>
          <p className="text-sm font-semibold text-slate-600">
            هنوز حرکتی انتخاب نشده
          </p>
          <p className="mt-1 text-xs text-slate-400">
            از کتابخانه حرکات، تمرین‌های موردنظرت را اضافه کن.
          </p>
        </div>
      ) : (

        <div className="space-y-3 bg-slate-50/60 p-3 sm:p-4">

          {items.map((item, index) => {
            const expanded = expandedItems.includes(item.id);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-blue-200"
              >

                {/* Exercise Header */}
                <div className="flex items-center justify-between gap-3 p-3 sm:p-4">

                  <div className="flex min-w-0 items-center gap-3">

                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-bold text-[#007BFF]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-700">
                        {item.name}
                      </h3>
                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        {item.muscle || "گروه عضلانی مشخص نشده"}
                      </p>
                    </div>

                  </div>

                  <div className="flex shrink-0 items-center gap-1">

                    <button
                      type="button"
                      onClick={() => toggleDetails(item.id)}
                      className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-semibold text-[#007BFF] hover:bg-blue-100"
                    >
                      <Settings2 size={14} />
                      <span className="hidden sm:inline">
                        جزئیات
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      aria-label={`حذف ${item.name}`}
                      className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                </div>

                {/* Main Training Fields */}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-white p-3 sm:grid-cols-4">

                  <NumberField
                    label="ست"
                    value={item.sets}
                    min={1}
                    max={20}
                    onChange={(v) => update(item.id, "sets", v)}
                  />

                  <NumberField
                    label="تکرار"
                    value={item.reps}
                    min={1}
                    max={200}
                    onChange={(v) => update(item.id, "reps", v)}
                  />

                  <NumberField
                    label="استراحت (ثانیه)"
                    value={item.rest}
                    min={0}
                    max={900}
                    onChange={(v) => update(item.id, "rest", v)}
                  />

                  <TextField
                    label="وزنه"
                    value={item.weight}
                    placeholder="مثلاً ۲۰ کیلو"
                    onChange={(v) => update(item.id, "weight", v)}
                  />

                </div>

                {/* Advanced Settings */}
                {expanded && (
                  <div className="space-y-4 border-t border-slate-100 bg-[#FAFBFD] p-4">

                    <div className="flex items-center gap-2">
                      <Zap size={15} className="text-[#007BFF]" />
                      <h4 className="text-xs font-bold text-slate-700">
                        تنظیمات پیشرفته تمرین
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                      <label className="flex flex-col gap-1.5 text-[10px] font-medium text-slate-400">
                        سیستم تمرینی
                        <select
                          value={item.system || "normal"}
                          onChange={(e) =>
                            update(item.id, "system", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400"
                        >
                          <option value="normal">معمولی</option>
                          <option value="dropset">دراپ ست</option>
                          <option value="superset">سوپرست</option>
                          <option value="giantset">جاینت ست</option>
                          <option value="restpause">رست پاز</option>
                          <option value="pyramid">هرمی</option>
                          <option value="failure">تا ناتوانی</option>
                        </select>
                      </label>

                      <TextField
                        label="تمپو"
                        value={item.tempo}
                        placeholder="3-1-2-0"
                        onChange={(v) => update(item.id, "tempo", v)}
                      />

                      <NumberField
                        label="RPE (شدت)"
                        value={item.rpe}
                        min={1}
                        max={10}
                        onChange={(v) => update(item.id, "rpe", v)}
                      />

                      <NumberField
                        label="RIR (تکرار ذخیره)"
                        value={item.rir}
                        min={0}
                        max={10}
                        onChange={(v) => update(item.id, "rir", v)}
                      />

                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">

                      <TextField
                        label="نوع ست"
                        value={item.setType}
                        placeholder="مثلاً ست گرم‌کردنی یا اصلی"
                        onChange={(v) => update(item.id, "setType", v)}
                      />

                      <TextField
                        label="یادداشت اختصاصی مربی"
                        value={item.note}
                        placeholder="نکات اجرای صحیح حرکت..."
                        onChange={(v) => update(item.id, "note", v)}
                      />

                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                      <Target size={15} className="mt-0.5 shrink-0 text-blue-500" />
                      <p className="text-[10px] leading-6 text-blue-700">
                        RPE میزان سختی ست و RIR تعداد تکرار باقی‌مانده تا ناتوانی است.
                        تمپو نیز ترتیب زمان بخش‌های اجرای حرکت را مشخص می‌کند.
                      </p>
                    </div>

                  </div>
                )}

              </article>
            );
          })}

        </div>
      )}

    </section>
  );
}
