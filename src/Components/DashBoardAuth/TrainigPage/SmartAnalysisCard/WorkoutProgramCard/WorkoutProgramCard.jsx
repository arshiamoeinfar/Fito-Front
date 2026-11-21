
import React, { useState } from "react";
import SegmentedControl from "../../../../shared/SegmentedControl/SegmentedControl";

const TYPE_STYLES = {
  کششی: {
    bg: "bg-indigo-400",
    border: "border-indigo-400",
    dot: "bg-indigo-400",
    check: true,
  },
  پا: {
    bg: "bg-green-400",
    border: "border-green-400",
    dot: "bg-green-400",
    check: true,
  },
  فشاری: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    dot: "bg-amber-400",
    check: false,
  },
  استراحت: {
    bg: "bg-gray-100",
    border: "border-gray-200",
    dot: "bg-gray-300",
    check: false,
  },
  تمرین: {
    bg: "bg-[#007BFF]",
    border: "border-[#007BFF]",
    dot: "bg-[#007BFF]",
    check: true,
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
      disabled={!onClick}
      aria-pressed={selected}
      className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl py-2 transition ${
        selected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`text-xs ${
          selected ? "font-bold text-[#007BFF]" : "text-gray-500"
        }`}
      >
        {day}
      </span>

      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition sm:h-11 sm:w-11 ${
          style.bg
        } ${style.border} ${
          selected ? "ring-2 ring-[#007BFF] ring-offset-2" : ""
        }`}
      >
        {style.check && (
          <svg
            className="h-5 w-5 text-white"
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
      </span>

      <span className="whitespace-nowrap text-[10px] text-gray-500 sm:text-xs">
        {type}
      </span>
    </button>
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
    <div
      dir="rtl"
      className="flex w-full min-w-0 flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-gray-700 sm:text-lg">
          {title}
        </h3>

        <div className="rounded-full bg-blue-50/70 p-1">
          <SegmentedControl item1="۷ روز" />
        </div>
      </div>

      {/* Programs */}
      {programs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {programs.map((program) => {
            const active =
              String(program.id) === String(selectedProgramId);

            return (
              <button
                key={program.id}
                type="button"
                onClick={() => onProgram?.(program.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                  active
                    ? "bg-[#007BFF] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {program.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Days */}
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

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-gray-100 pt-4">
        {legend.map((type) =>
          TYPE_STYLES[type] ? (
            <div key={type} className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${TYPE_STYLES[type].dot}`}
              />
              <span className="text-xs text-gray-500">{type}</span>
            </div>
          ) : null
        )}
      </div>

      {/* Coach */}
      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
          {coachInitial}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] text-gray-400">برنامه از</p>
          <p className="mt-0.5 truncate text-sm font-bold text-gray-700">
            {coachName}
          </p>
        </div>
      </div>
    </div>
  );
}
