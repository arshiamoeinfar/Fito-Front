
import Flesh from "../../../../assets/imges/flesh.svg";
import BreakFast from "../../../../assets/imges/break.png";
import imgDinner from "../../../../assets/imges/dinner.png";
import imgLunch from "../../../../assets/imges/lunch.png";
import imgFire from "../../../../assets/imges/Fire.svg";
import Liner from "../../../../assets/imges/Line 1.png";
import { useNavigate } from "react-router-dom";

const SAMPLE_MEALS = [
  { name: "صبحانه", calories: "400 کالری", icon: BreakFast },
  { name: "نهار", calories: "400 کالری", icon: imgLunch },
  { name: "شام", calories: "400 کالری", icon: imgDinner },
];

const SAMPLE_BARS = [
  { name: "کربوهیدرات", value: 80, caption: "190/120" },
  { name: "پروتئین", value: 60, caption: "190/120" },
  { name: "چربی", value: 45, caption: "190/120" },
];

export default function NutritionCard({ meals, bars }) {
  const navigate = useNavigate();

  const mealRows = meals ?? SAMPLE_MEALS;
  const barRows = bars ?? SAMPLE_BARS;

  return (
    <div
      dir="rtl"
      className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6"
    >
      {/* Header */}
      <div className="mb-5 flex min-w-0 items-center justify-between gap-2 sm:mb-6">
        <h2 className="font-primary-light text-base font-bold text-[#6B6F77] sm:text-lg lg:text-xl">
          تغذیه امروز
        </h2>

        <button
          type="button"
          onClick={() => navigate("/dashboardnutrition")}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg text-xs text-[#6B6F77] transition hover:text-black sm:gap-2 sm:text-sm"
        >
          جزئیات بیشتر
          <img src={Flesh} alt="" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:gap-5">
        {/* Meals */}
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-3 lg:flex lg:w-48 lg:shrink-0 lg:flex-col lg:gap-4">
          {mealRows.map((meal) => (
            <div
              key={meal.name}
              className="flex min-w-0 items-center gap-2 rounded-xl bg-[#F8FAFC] p-2 sm:bg-transparent sm:p-0"
            >
              <img
                className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
                src={meal.icon}
                alt=""
              />

              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[11px] font-medium text-[#6B6F77] sm:text-xs">
                  {meal.name}
                </span>

                <p className="font-primary-ExtraLight mt-1 flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-[#6B6F77] sm:text-xs">
                  <img className="h-3.5 w-3.5 shrink-0" src={imgFire} alt="" />
                  {meal.calories}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <img
          src={Liner}
          alt=""
          className="hidden h-28 shrink-0 object-contain lg:block"
        />

        <div className="h-px w-full bg-[#F0F2F5] lg:hidden" />

        {/* Nutrition Bars */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <div className="grid w-full max-w-[360px] grid-cols-3 gap-3 sm:gap-6 lg:gap-5">
            {barRows.map((item) => (
              <div
                key={item.name}
                className="flex min-w-0 flex-col items-center"
              >
                <div className="flex h-24 w-3 items-end overflow-hidden rounded-full bg-[#DBEDFF] sm:h-28 sm:w-3.5">
                  <div
                    className="w-full rounded-full bg-[#007BFF] transition-all duration-500"
                    style={{
                      height: `${Math.min(100, Math.max(0, Number(item.value) || 0))}%`,
                    }}
                  />
                </div>

                <p className="font-primary-light mt-2.5 whitespace-nowrap text-[10px] text-[#6B6F77] sm:mt-3 sm:text-xs lg:text-sm">
                  {item.name}
                </p>

                <p className="font-primary-ExtraLight mt-1 whitespace-nowrap text-[10px] text-[#6B6F77] sm:text-[11px]">
                  {item.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
