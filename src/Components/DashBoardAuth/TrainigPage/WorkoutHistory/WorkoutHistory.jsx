
import { useEffect, useState } from "react";
import {
  Close as CloseIcon,
  FitnessCenter as FitnessCenterIcon,
  TimerOutlined as TimerIcon,
  Repeat as RepeatIcon,
  CalendarTodayOutlined as CalendarIcon,
  CheckCircleRounded as CheckCircleIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  TrendingUpRounded as TrendingUpIcon,
  HistoryRounded as HistoryIcon,
  EventAvailableRounded as EventIcon,
} from "@mui/icons-material";

const workoutHistory = [
  {
    id: 1,
    date: "امروز",
    day: "روز پا",
    exercises: 8,
    sets: 4,
    duration: "1 ساعت",
    status: "completed",
    details: [
      { id: 1, name: "اسکوات با هالتر", sets: 4, reps: 8, weight: "80 KG", status: "completed" },
      { id: 2, name: "پرس پا", sets: 4, reps: 10, weight: "140 KG", status: "completed" },
      { id: 3, name: "جلو پا دستگاه", sets: 4, reps: 12, weight: "45 KG", status: "completed" },
      { id: 4, name: "پشت پا دستگاه", sets: 4, reps: 10, weight: "40 KG", status: "completed" },
    ],
  },
  {
    id: 2,
    date: "دیروز",
    day: "روز فشاری",
    exercises: 8,
    sets: 4,
    duration: "1 ساعت",
    status: "completed",
    details: [
      { id: 1, name: "پرس سینه", sets: 4, reps: 8, weight: "70 KG", status: "completed" },
      { id: 2, name: "پرس بالا سینه", sets: 4, reps: 10, weight: "50 KG", status: "completed" },
      { id: 3, name: "پرس سرشانه", sets: 4, reps: 10, weight: "30 KG", status: "completed" },
    ],
  },
  {
    id: 3,
    date: "۲۹ مرداد",
    day: "روز فشاری",
    exercises: 8,
    sets: 4,
    duration: "1 ساعت",
    status: "completed",
    details: [
      { id: 1, name: "پرس سینه", sets: 4, reps: 8, weight: "67.5 KG", status: "completed" },
      { id: 2, name: "فلای دستگاه", sets: 4, reps: 12, weight: "45 KG", status: "completed" },
    ],
  },
];

// ===============================
// Workout Details Modal
// ===============================

function WorkoutDetails({ workout, onClose }) {
  useEffect(() => {
    if (!workout) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [workout, onClose]);

  if (!workout) return null;

  const completedExercises = workout.details?.filter(
    (exercise) => exercise.status === "completed"
  ).length ?? 0;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        dir="rtl"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-[0_25px_80px_-20px_rgba(15,23,42,0.35)] sm:rounded-[30px]"
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-slate-100 bg-gradient-to-l from-[#F0F7FF] via-white to-white px-5 py-5 sm:px-7 sm:py-6">
          <div className="absolute -left-12 -top-16 size-40 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-[#007BFF]">
                  <FitnessCenterIcon sx={{ fontSize: 18 }} />
                </span>
                <span className="text-xs font-semibold text-[#007BFF]">
                  جزئیات جلسه تمرینی
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-800 sm:text-2xl">
                {workout.day}
              </h2>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <CalendarIcon sx={{ fontSize: 15 }} />
                {workout.date}
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="بستن"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-slate-100 p-4 sm:gap-3 sm:p-6">
          <SummaryItem
            icon={<FitnessCenterIcon />}
            label="حرکات"
            value={workout.exercises}
            color="blue"
          />

          <SummaryItem
            icon={<RepeatIcon />}
            label="ست‌ها"
            value={workout.sets}
            color="purple"
          />

          <SummaryItem
            icon={<TimerIcon />}
            label="مدت تمرین"
            value={workout.duration || "—"}
            color="orange"
          />
        </div>

        {/* Exercises */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                حرکات انجام شده
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                جزئیات عملکرد در این جلسه
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
              {completedExercises} حرکت تکمیل شده
            </span>
          </div>

          <div className="space-y-3">
            {workout.details?.map((exercise, index) => (
              <div
                key={exercise.id}
                className="group rounded-2xl border border-slate-100 bg-white p-3.5 transition hover:border-blue-100 hover:bg-[#FAFCFF] hover:shadow-sm sm:p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF] transition group-hover:bg-blue-100">
                    <FitnessCenterIcon />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-700">
                        {exercise.name}
                      </h4>
                      {exercise.status === "completed" && (
                        <CheckCircleIcon
                          sx={{ fontSize: 16 }}
                          className="text-emerald-500"
                        />
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-slate-400">
                      حرکت {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-black text-slate-800" dir="ltr">
                      {exercise.weight || "—"}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 text-[11px] ${
                        exercise.status === "completed"
                          ? "text-emerald-600"
                          : "text-amber-500"
                      }`}
                    >
                      {exercise.status === "completed" ? (
                        <>
                          <CheckCircleIcon sx={{ fontSize: 13 }} />
                          انجام شده
                        </>
                      ) : (
                        "تکمیل نشده"
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <RepeatIcon sx={{ fontSize: 16 }} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {exercise.sets} ست
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <TrendingUpIcon sx={{ fontSize: 16 }} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {exercise.reps} تکرار
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {(!workout.details || workout.details.length === 0) && (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                <FitnessCenterIcon className="text-slate-300" sx={{ fontSize: 32 }} />
                <p className="mt-2 text-sm text-slate-400">
                  جزئیاتی برای این تمرین ثبت نشده است.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#007BFF] py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/15 transition hover:bg-[#0069DB] active:scale-[0.99]"
          >
            بستن جزئیات
          </button>
        </div>
      </div>
    </div>
  );
}

// ===============================
// Summary Item
// ===============================

function SummaryItem({ icon, label, value, color }) {
  const themes = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center sm:p-4">
      <div
        className={`mx-auto mb-2 flex size-9 items-center justify-center rounded-xl ${themes[color]}`}
      >
        {icon}
      </div>
      <p className="text-[10px] text-slate-400 sm:text-xs">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-700 sm:text-base">
        {value}
      </p>
    </div>
  );
}

// ===============================
// Main Component
// ===============================

export default function WorkoutHistory({
  items,
  emptyLabel = "هنوز تمرینی ثبت نشده.",
}) {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const source = items ?? workoutHistory;
  const visibleWorkouts = showAll ? source : source.slice(0, 3);

  return (
    <>
      <section
        dir="rtl"
        className="h-full min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
      >
        {/* Header */}
        <div className="mb-7 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF]">
              <HistoryIcon />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg text-[#6B6F77]">
                تاریخچه تمرین‌ها
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                مرور جلسات تمرینی اخیر
              </p>
            </div>
          </div>

          {source.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex shrink-0 items-center gap-1 rounded-xl px-2 py-2 text-xs font-bold text-[#007BFF] transition hover:bg-blue-50 sm:px-3 sm:text-sm"
            >
              {showAll ? "نمایش کمتر" : "مشاهده همه"}
              <ChevronLeftIcon
                sx={{
                  fontSize: 17,
                  transform: showAll ? "rotate(-90deg)" : "none",
                  transition: "transform 200ms",
                }}
              />
            </button>
          )}
        </div>

        {/* Timeline */}
        {visibleWorkouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <EventIcon sx={{ fontSize: 28 }} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600">
              {emptyLabel}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              پس از ثبت اولین جلسه، تاریخچه اینجا نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute right-[10px] top-5 bottom-5 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-transparent" />

            <div className="space-y-5 sm:space-y-6">
              {visibleWorkouts.map((workout, index) => (
                <button
                  key={workout.id}
                  onClick={() => setSelectedWorkout(workout)}
                  className="group relative flex w-full gap-4 text-right outline-none"
                >
                  {/* Timeline Point */}
                  <div className="relative z-10 flex shrink-0 justify-center pt-5">
                    <div
                      className={`size-[21px] rounded-full border-[5px] shadow-sm transition-all ${
                        index === 0
                          ? "border-blue-100 bg-[#007BFF] ring-4 ring-blue-50"
                          : "border-slate-100 bg-white group-hover:border-blue-100 group-hover:bg-[#007BFF]"
                      }`}
                    />
                  </div>

                  {/* Workout Card */}
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-blue-100 group-hover:bg-[#FAFCFF] group-hover:shadow-md sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${
                              workout.status === "completed"
                                ? "bg-emerald-500"
                                : "bg-amber-400"
                            }`}
                          />
                          <span className="text-xs font-medium text-slate-400">
                            {workout.date}
                          </span>
                        </div>

                        <h3 className="mt-2 truncate text-base font-primary text-[#6B6F77] transition group-hover:text-[#007BFF] sm:text-lg">
                          {workout.day}
                        </h3>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-2 text-[#007BFF] transition group-hover:bg-[#007BFF] group-hover:text-white">
                        <span className="hidden text-xs font-bold sm:inline">
                          جزئیات
                        </span>
                        <ChevronLeftIcon sx={{ fontSize: 17 }} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 pt-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FitnessCenterIcon sx={{ fontSize: 16 }} className="text-slate-400" />
                        <span>{workout.exercises} حرکت</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <RepeatIcon sx={{ fontSize: 16 }} className="text-slate-400" />
                        <span>{workout.sets} ست</span>
                      </div>

                      {workout.duration && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <TimerIcon sx={{ fontSize: 16 }} className="text-slate-400" />
                          <span>{workout.duration}</span>
                        </div>
                      )}

                      {workout.status === "completed" && (
                        <span className="mr-auto flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircleIcon sx={{ fontSize: 14 }} />
                          تکمیل شده
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedWorkout && (
        <WorkoutDetails
          workout={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
        />
      )}
    </>
  );
}
