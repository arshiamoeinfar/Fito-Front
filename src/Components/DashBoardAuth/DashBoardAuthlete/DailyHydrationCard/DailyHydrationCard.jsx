import Water from "../../../../assets/imges/water.png";

const GLASS_ML = 250;
const GOAL_ML = 4000;

function amountLabel(ml) {
  const amount = Number(ml) || 0;
  if (amount >= 1000) {
    const liters = amount / 1000;
    const rounded = Number.isInteger(liters) ? liters : Math.round(liters * 10) / 10;
    return `${rounded.toLocaleString("fa-IR")} لیتر`;
  }
  return `${amount.toLocaleString("fa-IR")} میلی‌لیتر`;
}

export default function DailyHydrationCard({ amountMl = 0, onChange, saving = false, error = "" }) {
  const waterAmount = Math.max(0, Number(amountMl) || 0);
  const glassCount = Math.ceil(waterAmount / GLASS_ML);
  const shownGlasses = Math.min(16, Math.max(glassCount, 4));

  const addWater = () => {
    if (saving || !onChange) return;
    onChange(Math.min(20000, waterAmount + GLASS_ML));
  };

  const removeWater = () => {
    if (saving || !onChange || waterAmount === 0) return;
    onChange(Math.max(0, waterAmount - GLASS_ML));
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg text-[#6B6F77]">آب‌رسانی روزانه</h1>
        <span className="shrink-0 text-sm text-[#6B6F77] font-primary-light">
          {amountLabel(waterAmount)} / {(GOAL_ML / 1000).toLocaleString("fa-IR")} لیتر
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-around gap-3 sm:mt-10 sm:gap-4">
        {Array.from({ length: shownGlasses }).map((_, index) => {
          const isFilled = index < glassCount;

          return (
            <button
              key={index}
              type="button"
              onClick={addWater}
              disabled={saving}
              className="relative size-11 transition-transform duration-200 hover:scale-110 active:scale-95 disabled:opacity-60 sm:size-12"
            >
              <img
                className={`size-11 object-contain transition-opacity duration-300 sm:size-12 ${isFilled ? "opacity-100" : "opacity-20"}`}
                src={Water}
                alt=""
              />
              {!isFilled ? (
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-[#007BFF]">+</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={removeWater}
          disabled={saving || waterAmount === 0}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-[#6B6F77] hover:bg-gray-200 disabled:opacity-40"
        >
          −
        </button>
        <button
          type="button"
          onClick={addWater}
          disabled={saving}
          className="flex h-9 items-center justify-center rounded-xl bg-[#007BFF] px-4 text-sm text-white transition hover:bg-[#006fe6] disabled:opacity-60"
        >
          {saving ? "در حال ذخیره" : "+ افزودن آب"}
        </button>
      </div>
      {error ? <p className="mt-3 text-center text-sm text-red-700">{error}</p> : null}
    </>
  );
}
