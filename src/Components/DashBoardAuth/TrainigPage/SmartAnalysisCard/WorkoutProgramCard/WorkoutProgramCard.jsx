
import React, { useState } from "react";
import SegmentedControl from "../../../../shared/SegmentedControl/SegmentedControl";

const TYPE_STYLES = {
  کششی: {
    bg: "bg-indigo-400",
    border: "border-indigo-400",
    dot: "bg-indigo-400",
    check: true,
    text: "text-indigo-600",
  },
  پا: {
    bg: "bg-green-400",
    border: "border-green-400",
    dot: "bg-green-400",
    check: true,
    text: "text-green-600",
  },
  فشاری: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    dot: "bg-amber-400",
    check: false,
    text: "text-amber-600",
  },
  استراحت: {
    bg: "bg-gray-100",
    border: "border-gray-200",
    dot: "bg-gray-300",
    check: false,
    text: "text-gray-500",
  },
  تمرین: {
    bg: "bg-[#007BFF]",
    border: "border-[#007BFF]",
    dot: "bg-[#007BFF]",
    check: true,
    text: "text-[#007BFF]",
  },
};

const LEGEND_ORDER = ["کششی", "پا", "فشاری", "استراحت"];

const DEFAULT_DAYS = [
  { day: "ش", type: "کششی" },
  { day: "ی", type: "پا" },
  { day: "د", type: "استراحت" },
  { day: "س", type: "کششی" },
  { day: "چ", type: "فشاری" },
  { day: "پ", type: "استراحت" },
  { day: "ج", type: "فشاری" },
];

function DayCircle({ day, type, selected, onClick }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES["استراحت"];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-2xl px-1 py-3 transition-all duration-200 ${
        selected
          ? "bg-blue-50/80"
          : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`text-sm font-medium transition-colors ${
          selected ? "text-[#007BFF]" : "text-[#6B6F77]"
        }`}
      >
        {day}
      </span>

      <div
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-12 sm:w-12 ${
          style.bg
        } ${style.border} ${
          selected
            ? "ring-2 ring-[#007BFF] ring-offset-2 scale-105"
            : "group-hover:scale-105"
        }`}
      >
        {style.check && (
          <svg
            className="h-5 w-5 text-white sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}

        {selected && (
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-[#007BFF]" />
        )}
      </div>

      <span
        className={`whitespace-nowrap text-[10px] font-medium sm:text-xs ${
          selected ? "text-[#007BFF]" : "text-[#6B6F77]"
        }`}
      >
        {type}
      </span>
    </button>
  );
}

function LegendItem({ type }) {
  const style = TYPE_STYLES[type];

  if (!style) return null;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
      />
      <span className="text-xs font-medium text-gray-600 sm:text-sm">
        {type}
      </span>
    </div>
  );
}

export default function WorkoutProgramCard({
  title = "برنامه تمرینی",
  days = DEFAULT_DAYS,
  coachName = "مهدی خواجه",
  coachInitial = "مخ",
  legend = LEGEND_ORDER,
  selectedId,
  onSelect,
  programs = [],
  selectedProgramId,
  onProgram,
}) {
  const [range, setRange] = useState("7 روز");

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:gap-7 sm:p-6 lg:p-7">
      {/* Header */}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className=" w-full">
          <div className="flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-[#007BFF]" />
            <h3 className="text-lg font-bold text-gray-800 sm:text-xl">
              {title}
            </h3>
          </div>

          <p className="mt-2 pr-3 text-xs text-gray-400 sm:text-sm">
            برنامه هفتگی تمرین و استراحت شما
          </p>

          {programs.length > 1 && (
            <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-2 scrollbar-thin bg-amber-200/0 scrollbar-thumb-blue-200/50 scrollbar-track-blue-50/20 sm:mt-5">
              {programs.map((program) => {
                const isActive =
                  String(program.id) === String(selectedProgramId);

                return (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => onProgram?.(program.id)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 sm:text-sm ${
                      isActive
                        ? "bg-[#007BFF] text-white shadow-md shadow-blue-200"
                        : "border border-gray-100 bg-gray-50 text-gray-600 hover:border-blue-200 hover:bg-blue-50"
                    }`}
                  >
                    {program.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs font-medium text-gray-400">
            بازه نمایش
          </span>

          <div className="rounded-xl">
            <SegmentedControl item1="۷ روز" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gray-100" />

      {/* Days */}
      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-700">
            روزهای هفته
          </h4>

          <span className="text-[11px] text-gray-400">
            برای مشاهده جزئیات انتخاب کنید
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((d, idx) => (
            <DayCircle
              key={d.id ?? idx}
              day={d.day}
              type={d.type}
              selected={
                selectedId != null &&
                String(d.id) === String(selectedId)
              }
              onClick={
                onSelect && d.id != null
                  ? () => onSelect(d.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-2xl border border-blue-50 bg-[#F7FAFE] p-4 sm:px-5 sm:py-4">
        <div className="mb-3 text-xs font-bold text-gray-600">
          راهنمای وضعیت تمرین
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-7">
          {legend.map((type) => (
            <LegendItem key={type} type={type} />
          ))}
        </div>
      </div>

      {/* Coach */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007BFF] to-blue-600 text-sm font-bold text-white shadow-md shadow-blue-100 sm:h-12 sm:w-12">
            {coachInitial}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 sm:text-xs">
              تنظیم و ارائه برنامه توسط
            </p>
            <p className="mt-1 truncate text-sm font-bold text-gray-800 sm:text-base">
              {coachName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-medium text-green-600 sm:text-xs">
            مربی شما
          </span>
        </div>
      </div>
    </div>
  );
}
