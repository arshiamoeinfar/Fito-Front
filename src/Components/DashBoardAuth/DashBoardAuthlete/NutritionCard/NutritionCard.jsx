
import React from "react";
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
    <section
      dir="rtl"
      className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <h2 className="text-base font-bold text-[#6B6F77] sm:text-lg lg:text-xl">
          تغذیه امروز
        </h2>

        <button
          type="button"
          onClick={() => navigate("/dashboardnutrition")}
          className="flex shrink-0 items-center gap-1.5 text-xs text-gray-400 transition hover:text-[#007BFF] sm:text-sm"
        >
          جزئیات بیشتر
          <img
            src={Flesh}
            alt=""
            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:gap-5">

        {/* Meals */}
        <div className="grid min-w-0 grid-cols-3 gap-2 lg:w-48 lg:shrink-0 lg:grid-cols-1 lg:gap-4">
          {mealRows.map((meal) => (
            <div
              key={meal.name}
              className="flex min-w-0 flex-col items-center gap-2 rounded-xl bg-gray-50/70 p-2 sm:flex-row sm:justify-start sm:p-3 lg:bg-transparent lg:p-0"
            >
              <img
                src={meal.icon}
                alt=""
                className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
              />

              <div className="flex min-w-0 flex-col items-center sm:items-start">
                <span className="truncate text-[11px] font-medium text-[#6B6F77] sm:text-xs">
                  {meal.name}
                </span>

                <p className="mt-1 flex items-center gap-1 whitespace-nowrap text-[10px] text-gray-400 sm:text-xs">
                  <img
                    src={imgFire}
                    alt=""
                    className="h-3.5 w-3.5 shrink-0"
                  />
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

        <div className="h-px w-full bg-gray-100 lg:hidden" />

        {/* Nutrition Charts */}
        <div className="min-w-0 flex-1">
          {/* Tablet & Mobile: Horizontal bars */}
          <div className="flex flex-col gap-5 lg:hidden">
            {barRows.map((item) => {
              const percentage = Math.min(
                100,
                Math.max(0, Number(item.value) || 0)
              );

              return (
                <div
                  key={item.name}
                  className="flex min-w-0 items-center gap-3 sm:gap-4"
                >
                  <span className="w-20 shrink-0 text-xs text-[#6B6F77] sm:w-24 sm:text-sm">
                    {item.name}
                  </span>

                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#DBEDFF]">
                    <div
                      className="h-full rounded-full bg-[#007BFF] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-16 shrink-0 text-left text-[10px] text-[#6B6F77] sm:w-20 sm:text-xs">
                    {item.caption}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Desktop: Vertical bars */}
          <div className="hidden grid-cols-3 gap-5 lg:grid">
            {barRows.map((item) => {
              const percentage = Math.min(
                100,
                Math.max(0, Number(item.value) || 0)
              );

              return (
                <div
                  key={item.name}
                  className="flex min-w-0 flex-col items-center"
                >
                  <div className="flex h-28 w-3.5 items-end overflow-hidden rounded-full bg-[#DBEDFF]">
                    <div
                      className="w-full rounded-full bg-[#007BFF] transition-all duration-500"
                      style={{ height: `${percentage}%` }}
                    />
                  </div>

                  <p className="mt-3 whitespace-nowrap text-xs text-[#6B6F77]">
                    {item.name}
                  </p>

                  <p className="mt-1 whitespace-nowrap text-[11px] text-gray-400">
                    {item.caption}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
