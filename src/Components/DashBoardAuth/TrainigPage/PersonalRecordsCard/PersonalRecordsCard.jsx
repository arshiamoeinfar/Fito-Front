import React, { useState } from "react";
import Ranking from "../../../../assets/Icons/Ranking.svg";
import {
  KeyboardArrowDownRounded,
  TrendingUpRounded,
  EmojiEventsRounded,
  LocalFireDepartmentRounded,
  CloseRounded,
  CalendarTodayOutlined,
  FitnessCenterRounded,
} from "@mui/icons-material";

// ===============================
// Default Records
// ===============================

const DEFAULT_RECORDS = [
  {
    id: 1,
    exercise: "پرس دمبل",
    value: "24kg × 8",
    isNew: true,
    date: "۲۳ تیر ۱۴۰۵",
    previous: "22kg × 8",
  },
  {
    id: 2,
    exercise: "اسکوات",
    value: "60kg × 6",
    isNew: false,
    date: "۱۸ تیر ۱۴۰۵",
    previous: "55kg × 6",
  },
  {
    id: 3,
    exercise: "ددلیفت",
    value: "80kg × 5",
    isNew: false,
    date: "۱۰ تیر ۱۴۰۵",
    previous: "75kg × 5",
  },
  {
    id: 4,
    exercise: "پرس سینه هالتر",
    value: "50kg × 8",
    isNew: false,
    date: "۲ تیر ۱۴۰۵",
    previous: "45kg × 8",
  },
  {
    id: 5,
    exercise: "زیربغل هالتر",
    value: "40kg × 10",
    isNew: false,
    date: "۲۵ خرداد ۱۴۰۵",
    previous: "37kg × 10",
  },
];

// ===============================
// Record Row
// ===============================

function RecordRow({ record, isOpen, onToggle }) {
  return (
    <div
      className={`group border-b border-slate-100 last:border-b-0 dark:border-slate-700 ${
        isOpen ? "pb-4" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(record.id)}
        aria-expanded={isOpen}
        className="flex w-full min-w-0 items-center gap-3 py-4 text-right outline-none sm:gap-4 sm:py-5"
      >
        {/* Icon */}
        <div
          className={`relative flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 sm:size-14 ${
            record.isNew
              ? "bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 dark:from-blue-950/60 dark:to-blue-900/60 dark:group-hover:from-blue-900 dark:group-hover:to-blue-800"
              : "bg-slate-50 group-hover:bg-blue-50 dark:bg-slate-800 dark:group-hover:bg-blue-950/50"
          }`}
        >
          <img
            className="size-6 object-contain sm:size-7"
            src={Ranking}
            alt=""
          />

          {record.isNew && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-white bg-[#007BFF] dark:border-slate-900">
              <span className="size-1.5 rounded-full bg-white" />
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-primary text-slate-700 transition group-hover:text-[#007BFF] dark:text-slate-200 sm:text-base">
              {record.exercise}
            </h4>

            {record.isNew && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300 sm:text-[11px]">
                <LocalFireDepartmentRounded sx={{ fontSize: 13 }} />
                رکورد جدید
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="text-sm font-primary text-slate-700 dark:text-slate-200"
              dir="ltr"
            >
              {record.value}
            </span>
            <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {record.date}
            </span>
          </div>
        </div>

        {/* Expand Button */}
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-all ${
            isOpen
              ? "rotate-180 bg-blue-50 text-[#007BFF] dark:bg-blue-950/60 dark:text-blue-300"
              : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#007BFF] dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-950/50 dark:group-hover:text-blue-300"
          }`}
        >
          <KeyboardArrowDownRounded />
        </div>
      </button>

      {/* Expanded Details */}
      <div
        className={`grid transition-all duration-300 ${
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70 sm:grid-cols-2 sm:p-4">
            {/* Previous Record */}
            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-white p-3 dark:bg-slate-800">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <TrendingUpRounded sx={{ fontSize: 19 }} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  رکورد قبلی
                </p>
                <p
                  className="mt-1 truncate text-sm font-primary text-slate-600 dark:text-slate-200"
                  dir="ltr"
                >
                  {record.previous || "ثبت نشده"}
                </p>
              </div>
            </div>

            {/* Record Date */}
            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-white p-3 dark:bg-slate-800">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-300">
                <CalendarTodayOutlined sx={{ fontSize: 17 }} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  تاریخ ثبت رکورد
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-600 dark:text-slate-200">
                  {record.date}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===============================
// Personal Records Card
// ===============================

export default function PersonalRecordsCard({
  title = "رکوردهای شخصی",
  records = DEFAULT_RECORDS,
  emptyLabel = "رکوردی ثبت نشده.",
}) {
  const [openId, setOpenId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const visibleRecords = showAll ? records : records.slice(0, 3);

  const newestRecord = records.find((record) => record.isNew);

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleFireClick = () => {
    if (newestRecord) {
      setShowAll(true);
      setOpenId(newestRecord.id);
    }
  };

  return (
    <section
      dir="rtl"
      className="h-full w-full min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 lg:p-7"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-300">
            <EmojiEventsRounded sx={{ fontSize: 23 }} />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg text-[#6B6F77] dark:text-slate-200">
              {title}
            </h3>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              بهترین عملکردهای ثبت‌شده
            </p>
          </div>
        </div>

        {records.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="flex shrink-0 items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#007BFF] transition hover:bg-blue-50 dark:hover:bg-blue-950/50 sm:px-3 sm:text-sm"
          >
            {showAll ? "نمایش کمتر" : "مشاهده همه"}

            <KeyboardArrowDownRounded
              sx={{
                fontSize: 18,
                transform: showAll ? "rotate(180deg)" : "none",
                transition: "transform 200ms",
              }}
            />
          </button>
        )}
      </div>

      {/* New Record Highlight */}
      {newestRecord && (
        <button
          type="button"
          onClick={handleFireClick}
          className="group mb-5 flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-l from-blue-50 via-[#F5F9FF] to-white p-3.5 text-right transition hover:border-blue-200 hover:shadow-sm dark:border-blue-900/60 dark:from-blue-950/60 dark:via-slate-800 dark:to-slate-800 dark:hover:border-blue-800 sm:p-4"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF] shadow-sm dark:bg-slate-700 dark:text-blue-300 sm:size-11">
            <LocalFireDepartmentRounded sx={{ fontSize: 23 }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#007BFF] dark:text-blue-300">
              آخرین رکورد جدید
            </p>
            <p className="mt-1 truncate text-sm font-black text-slate-700 dark:text-slate-100">
              {newestRecord.exercise}
            </p>
            <p
              className="mt-1 text-xs text-slate-500 dark:text-slate-400"
              dir="ltr"
            >
              {newestRecord.value}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#007BFF] transition group-hover:translate-x-[-2px] dark:text-blue-300">
            مشاهده
            <KeyboardArrowDownRounded
              sx={{ fontSize: 17 }}
              className="-rotate-90"
            />
          </div>
        </button>
      )}

      {/* Records List */}
      <div className="min-w-0">
        {visibleRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-500">
              <FitnessCenterRounded sx={{ fontSize: 28 }} />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {emptyLabel}
            </p>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              با پیشرفت در تمرینات، رکوردهایت اینجا نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <div>
            {visibleRecords.map((record) => (
              <RecordRow
                key={record.id}
                record={record}
                isOpen={openId === record.id}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {records.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            مجموع رکوردهای ثبت‌شده
          </span>

          <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {records.length} رکورد
          </span>
        </div>
      )}
    </section>
  );
}