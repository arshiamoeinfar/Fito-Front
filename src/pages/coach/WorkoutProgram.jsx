
import React, { useState } from "react";
import { History } from "lucide-react";
import WorkoutHistoryModal from "./WorkoutHistoryModal";

export default function WorkoutProgram({
  onHistoryClick,
  history = [],
  historyLoading = false,
  onHistoryMonthChange,
  exercises = [],
  days = [],
  activeDayId = null,
  onDay,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  function openHistory() {
    setHistoryOpen(true);
    onHistoryClick?.();
  }

  return (
    <section
      dir="rtl"
      className="
        w-full min-w-0
        rounded-2xl sm:rounded-[24px]
        bg-white
        px-3 py-4
        sm:px-5 sm:py-5
        lg:px-7 lg:py-6
      "
    >
      {/* Header */}
      <div className="mb-5 sm:mb-7 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl lg:text-2xl text-[#6B6F77] font-primary">
            برنامه تمرینی فعلی
          </h2>

          <button
            type="button"
            onClick={openHistory}
            aria-haspopup="dialog"
            className="
              group
              inline-flex shrink-0
              items-center justify-center
              gap-2
              rounded-xl
              border border-[#E5EAF1]
              bg-white
              px-3 sm:px-4
              py-2.5
              text-[11px] sm:text-xs
              font-medium
              text-[#7B8491]
              transition-all duration-200
              hover:border-[#BFDBFE]
              hover:bg-[#F3F8FF]
              hover:text-[#007BFF]
              active:scale-[0.98]
              cursor-pointer
            "
          >
            <History
              size={16}
              strokeWidth={1.8}
              className="transition-colors"
            />
            <span>تاریخچه تمرینات</span>
          </button>
        </div>

        {/* Days */}
        {days.length > 0 && (
          <div
            className="
              w-full min-w-0
              overflow-x-auto
              rounded-2xl
              bg-[#EAF4FF]
              scrollbar-thin
              scrollbar-thumb-[#C5DDF8]
            "
          >
            <div
              className="
                flex w-max min-w-full
                items-center
                justify-start
                gap-5 sm:gap-7
                px-4 sm:px-5
                py-3
              "
            >
              {days.map((day) => {
                const isActive =
                  String(day.id) === String(activeDayId);

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => onDay?.(day.id)}
                    className={`
                      relative shrink-0
                      whitespace-nowrap
                      pb-2
                      text-xs sm:text-[13px]
                      font-medium
                      transition-colors duration-200
                      cursor-pointer
                      ${
                        isActive
                          ? "text-[#007BFF]"
                          : "text-[#8B929C] hover:text-[#007BFF]"
                      }
                    `}
                  >
                    {day.label}

                    {isActive && (
                      <span
                        className="
                          absolute
                          -bottom-[13px]
                          right-0 left-0
                          mx-auto
                          h-[4px]
                          w-8 sm:w-10
                          rounded-t-full
                          bg-[#007BFF]
                        "
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {exercises.length === 0 ? (
        <div className="
          flex flex-col items-center justify-center
          rounded-2xl
          border border-dashed border-[#E5EAF1]
          bg-[#FAFBFD]
          px-4 py-10 sm:py-14
          text-center
        ">
          <div className="
            mb-3 flex h-12 w-12 items-center justify-center
            rounded-2xl bg-[#F0F5FB]
          ">
            <History size={22} className="text-[#A0AAB8]" />
          </div>

          <p className="text-sm font-medium text-[#68717D]">
            برای این روز حرکتی ثبت نشده است.
          </p>

          <span className="mt-1 text-xs text-[#A0A4AA]">
            با انتخاب روزهای دیگر می‌توانید برنامه تمرینی را مشاهده کنید.
          </span>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {exercises.map((exercise, index) => (
              <article
                key={`${exercise.name}-${index}`}
                className="
                  rounded-2xl
                  border border-[#EDF0F4]
                  bg-white
                  p-3.5
                  transition-colors
                  hover:border-[#D9E9FC]
                "
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="mb-1 block text-[10px] text-[#A0A4AA]">
                      حرکت {index + 1}
                    </span>

                    <h3 className="break-words text-sm font-semibold text-[#555D68]">
                      {exercise.name || "بدون نام"}
                    </h3>
                  </div>

                  <span className="
                    shrink-0 rounded-lg
                    bg-[#F0F7FF]
                    px-2.5 py-1
                    text-[10px] font-medium
                    text-[#007BFF]
                  ">
                    {exercise.sets || "-"} ست
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#F8FAFC] p-3">
                    <span className="mb-1 block text-[10px] text-[#A0A4AA]">
                      تکرار
                    </span>
                    <p className="break-words text-xs font-medium text-[#68717D]">
                      {exercise.reps || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F8FAFC] p-3">
                    <span className="mb-1 block text-[10px] text-[#A0A4AA]">
                      وزنه
                    </span>
                    <p className="break-words text-xs font-medium text-[#68717D]">
                      {exercise.weight || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F8FAFC] p-3">
                    <span className="mb-1 block text-[10px] text-[#A0A4AA]">
                      استراحت
                    </span>
                    <p className="break-words text-xs font-medium text-[#68717D]">
                      {exercise.rest || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F8FAFC] p-3">
                    <span className="mb-1 block text-[10px] text-[#A0A4AA]">
                      ست
                    </span>
                    <p className="break-words text-xs font-medium text-[#68717D]">
                      {exercise.sets || "-"}
                    </p>
                  </div>
                </div>

                {exercise.note && (
                  <div className="
                    mt-2.5 rounded-xl
                    border border-[#EDF0F4]
                    bg-[#FCFDFE]
                    p-3
                  ">
                    <span className="mb-1 block text-[10px] text-[#A0A4AA]">
                      توضیحات مربی
                    </span>
                    <p className="whitespace-pre-wrap break-words text-xs leading-6 text-[#68717D]">
                      {exercise.note}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Tablet & Desktop Table */}
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="
              w-full min-w-[700px]
              border-collapse text-right
            ">
              <thead>
                <tr className="border-b border-[#EDF0F4]">
                  <th className="w-[22%] pb-5 text-[12px] lg:text-[13px] font-medium text-[#858B94]">
                    حرکت
                  </th>

                  <th className="w-[12%] pb-5 text-[12px] lg:text-[13px] font-medium text-[#858B94]">
                    ست
                  </th>

                  <th className="w-[12%] pb-5 text-[12px] lg:text-[13px] font-medium text-[#858B94]">
                    تکرار
                  </th>

                  <th className="w-[14%] pb-5 text-[12px] lg:text-[13px] font-medium text-[#858B94]">
                    وزنه
                  </th>

                  <th className="w-[14%] pb-5 text-[12px] lg:text-[13px] font-medium text-[#858B94]">
                    استراحت
                  </th>

                  <th className="w-[26%] pb-5 text-[12px] lg:text-[13px] font-medium text-[#858B94]">
                    توضیحات مربی
                  </th>
                </tr>
              </thead>

              <tbody>
                {exercises.map((exercise, index) => (
                  <tr
                    key={`${exercise.name}-${index}`}
                    className="
                      border-b border-[#F0F2F5]
                      last:border-b-0
                    "
                  >
                    <td className="py-5 lg:py-6 text-[12px] lg:text-[13px] font-medium text-[#555D68]">
                      {exercise.name}
                    </td>

                    <td className="py-5 lg:py-6 text-[12px] lg:text-[13px] text-[#68717D]">
                      {exercise.sets}
                    </td>

                    <td className="py-5 lg:py-6 text-[12px] lg:text-[13px] text-[#68717D]">
                      {exercise.reps}
                    </td>

                    <td className="py-5 lg:py-6 text-[12px] lg:text-[13px] text-[#68717D]">
                      {exercise.weight}
                    </td>

                    <td className="py-5 lg:py-6 text-[12px] lg:text-[13px] text-[#68717D]">
                      {exercise.rest}
                    </td>

                    <td className="max-w-[260px] py-5 lg:py-6 text-[12px] lg:text-[13px] text-[#68717D]">
                      <span className="block whitespace-pre-wrap break-words">
                        {exercise.note || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* History Modal */}
      <WorkoutHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={history}
        loading={historyLoading}
        onMonthChange={onHistoryMonthChange}
        exercises={exercises}
      />
    </section>
  );
}
