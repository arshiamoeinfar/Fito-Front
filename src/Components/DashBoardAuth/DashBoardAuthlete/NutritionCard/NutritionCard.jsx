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
    <div className="rounded-3xl bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-primary-light text-xl font-bold text-[#6B6F77]">تغذیه امروز</h2>
        <button
          type="button"
          onClick={() => navigate("/dashboardnutrition")}
          className="flex cursor-pointer items-center gap-2 text-sm text-[#6B6F77] transition hover:text-black"
        >
          جزئیات بیشتر
          <img src={Flesh} alt="" className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col sm:w-48">
          {mealRows.map((meal) => (
            <div key={meal.name} className="mb-4 flex items-center justify-start">
              <img className="size-10" src={meal.icon} alt="" />
              <div className="mr-4 flex flex-col">
                <span className="text-[12px] font-medium text-[#6B6F77]">{meal.name}</span>
                <p className="font-primary-ExtraLight flex text-[12px] font-medium text-[#6B6F77]">
                  <img className="size-3.5" src={imgFire} alt="" />
                  {meal.calories}
                </p>
              </div>
            </div>
          ))}
        </div>
        <img src={Liner} alt="" className="hidden h-28 sm:block" />
        <div className="flex items-center justify-center sm:mr-4">
          <div className="flex justify-center gap-5">
            {barRows.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <div className="flex h-30 w-3 items-end overflow-hidden rounded-full bg-[#DBEDFF]">
                  <div
                    className="w-full rounded-full bg-[#007BFF] transition-all duration-500"
                    style={{ height: `${item.value}%` }}
                  />
                </div>
                <p className="font-primary-light mt-3 text-sm whitespace-nowrap text-[#6B6F77]">{item.name}</p>
                <p className="font-primary-ExtraLight mt-1 text-[11px] whitespace-nowrap text-[#6B6F77]">{item.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
