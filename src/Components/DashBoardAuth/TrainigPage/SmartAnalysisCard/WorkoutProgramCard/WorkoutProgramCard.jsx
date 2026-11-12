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
    dot: "bg-gray-200",
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
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-3">
      <span className="text-[#6B6F77] Modam-Medium text-sm">{day}</span>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${style.bg} ${style.border} ${selected ? "ring-2 ring-[#007BFF] ring-offset-2" : ""}`}
      >
        {style.check && (
          <svg
            className="w-6 h-6 text-white"
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
      </div>
      <span className="text-[#6B6F77] Modam-Medium text-sm ">{type}</span>
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
      className="flex w-full max-w-none flex-col gap-6 rounded-3xl bg-white p-5 sm:gap-8 sm:p-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-medium text-[#6B6F77]">{title}</h3>
          {programs.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {programs.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => onProgram?.(program.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs ${String(program.id) === String(selectedProgramId) ? "bg-[#007BFF] text-white" : "bg-[#F2F8FD] text-[#6B6F77]"}`}
                >
                  {program.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="inline-flex bg-blue-50/60 rounded-full p-1">
          <SegmentedControl item1="۷ روز" />
        </div>
      </div>

      {/* Days row */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-2">
        {days.map((d, idx) => (
          <DayCircle
            key={d.id ?? idx}
            day={d.day}
            type={d.type}
            selected={selectedId != null && String(d.id) === String(selectedId)}
            onClick={onSelect && d.id != null ? () => onSelect(d.id) : undefined}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="bg-[#F2F8FD] rounded-2xl px-6 py-4 flex items-center justify-center gap-8 flex-wrap">
        {legend.map((type) => (
          TYPE_STYLES[type] ? (
          <div key={type} className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">{type}</span>
            <span className={`w-3 h-3 rounded-full ${TYPE_STYLES[type].dot}`} />
          </div>
          ) : null
        ))}
      </div>

      {/* Footer: coach info */}
      <div className="flex items-center justify-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
          {coachInitial}
        </div>
        <div className="text-start">
          <p className="text-gray-400 text-xs">برنامه از</p>
          <p className="text-gray-800 font-bold">{coachName}</p>
        </div>
      </div>
    </div>
  );
}
