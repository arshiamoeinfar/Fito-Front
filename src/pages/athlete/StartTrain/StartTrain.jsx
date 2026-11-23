
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import Navbar from "../../../Components/shared/Navbar/Navbar";
import AccountMenu from "../../../Components/DashBoardAuth/HeaderDashBoard/AccountMenu";

import imgMove from "../../../assets/imges/image 13.png";
import Dumbel from "../../../assets/imges/Dumbbell Large Minimalistic.png";
import Refresh from "../../../assets/imges/Refresh.svg";
import ClockCircle from "../../../assets/imges/Clock Circle.svg";
import Dumbel1 from "../../../assets/Icons/Dumbbell Large Minimalistic.png";
import Refresh2 from "../../../assets/Icons/Refresh.png";
import ClockCircle3 from "../../../assets/Icons/Clock Circle.png";

import { api } from "../../../api/client";

const SET_LABELS = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"];

function pickDay(days, requestedId) {
  const requested = days.find(
    (day) => String(day.id) === String(requestedId ?? "")
  );

  if (requested) return requested;

  const today = (new Date().getDay() + 1) % 7;

  const todayDay = days.find(
    (day) =>
      day.weekday === today && (day.exercises ?? []).length > 0
  );

  if (todayDay) return todayDay;

  return (
    days.find((day) => (day.exercises ?? []).length > 0) ??
    days[0] ??
    null
  );
}

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function ExerciseStat({ icon, label }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <img
        className="h-4 w-4 shrink-0 object-contain"
        src={icon}
        alt=""
      />
      <span className="text-xs font-primary-ExtraLight font-medium text-[#6B6F77]">
        {label}
      </span>
    </div>
  );
}

function HeroStat({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 backdrop-blur-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="truncate text-[10px] text-white/65">{label}</p>
        <p className="truncate text-xs font-semibold text-white sm:text-sm">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function StartTrain() {
  const [params] = useSearchParams();

  const [queue, setQueue] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [reps, setReps] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  const sessionRef = useRef(null);
  const dayIdRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadWorkout() {
      try {
        const body = await api("/api/v1/athlete/workout-assignments");

        if (!mounted) return;

        const rows = body.assignments ?? [];
        const requested = params.get("assignment");

        const picked =
          rows.find((row) => String(row.id) === requested) ??
          rows.find((row) => row.status === "active") ??
          rows[0] ??
          null;

        setAssignment(picked);

        const day = pickDay(
          picked?.version?.days ?? [],
          params.get("day")
        );

        dayIdRef.current = day?.id ?? null;

        setQueue(
          (day?.exercises ?? []).map((item) => ({
            id: item.id,
            exerciseId: item.exercise_id,
            title: item.exercise?.name ?? "حرکت",
            sets: item.prescribed_sets || 1,
            reps: item.reps_min ?? item.reps_max,
            rest: item.rest_seconds ?? 0,
            weightLabel:
              item.target_weight_g == null
                ? "بدون وزن هدف"
                : `${item.target_weight_g / 1000} کیلوگرم`,
            image: imgMove,
          }))
        );
      } catch (caught) {
        if (mounted) {
          setError(caught.message || "دریافت برنامه با خطا مواجه شد.");
        }
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadWorkout();

    return () => {
      mounted = false;
    };
  }, [params]);

  const current = queue[0];
  const upcoming = queue.slice(1);

  const totalSets = current?.sets ?? 1;
  const isLastSet = currentStep === totalSets;

  const progressPercent =
    totalSets <= 1
      ? 0
      : ((currentStep - 1) / (totalSets - 1)) * 100;

  const completedSets = currentStep - 1;

  const goToExercise = (id) => {
    setQueue((prev) => {
      const index = prev.findIndex((item) => item.id === id);

      if (index <= 0) return prev;

      const selected = prev[index];

      return [
        selected,
        ...prev.filter((_, itemIndex) => itemIndex !== index),
      ];
    });

    setCurrentStep(1);
    setShowCompleteModal(false);
    setReps("");
    setWeightKg("");
    setError("");
    setNotice("");
  };

  async function handleFinishSet() {
    if (!assignment || !current || reps === "") return;

    setPending(true);
    setError("");
    setNotice("");

    try {
      if (!sessionRef.current) {
        const started = await api(
          "/api/v1/athlete/workout-sessions",
          {
            method: "POST",
            body: {
              source: "prescribed",
              performed_on: today(),
              workout_assignment_id: assignment.id,
              workout_day_id: dayIdRef.current,
            },
          }
        );

        sessionRef.current = started.id;
      }

      const payload = {
        workout_day_exercise_id: current.id,
        exercise_id: current.exerciseId,
        set_index: currentStep - 1,
        reps: Number(reps),
        is_completed: true,
      };

      if (weightKg !== "") {
        payload.weight_g = Math.round(Number(weightKg) * 1000);
      }

      await api(
        `/api/v1/athlete/workout-sessions/${sessionRef.current}/sets`,
        {
          method: "POST",
          body: payload,
        }
      );

      setNotice("ست با موفقیت ثبت شد.");
      setReps("");
      setWeightKg("");

      if (isLastSet) {
        setShowCompleteModal(true);
      } else {
        setCurrentStep((step) => step + 1);
      }
    } catch (caught) {
      setError(caught.message || "ثبت ست انجام نشد.");
    } finally {
      setPending(false);
    }
  }

  const handleSkipSet = () => {
    if (!isLastSet) {
      setCurrentStep((step) => Math.min(step + 1, totalSets));
      setReps("");
      setWeightKg("");
      setNotice("");
      setError("");
    }
  };

  if (!ready) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F5F7FB] px-4"
      >
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-12 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D9E9FF] border-t-[#007BFF]" />
          <p className="text-sm text-[#6B6F77]">
            در حال دریافت برنامه تمرینی...
          </p>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#F5F7FB] px-3 py-4 sm:px-5 lg:px-8 lg:py-6"
      >
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 lg:grid-cols-[90px_minmax(0,1fr)]">
          <aside className="min-w-0">
            <Navbar />
          </aside>

          <main className="min-w-0 py-2 lg:py-3">
            <div className="mb-5 flex justify-end">
              <AccountMenu />
            </div>

            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white px-5 py-12 text-center shadow-sm">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-[#007BFF]">
                <FitnessCenterRoundedIcon sx={{ fontSize: 38 }} />
              </div>

              <h2 className="text-lg font-bold text-[#374151] sm:text-xl">
                برنامه تمرینی در دسترس نیست
              </h2>

              <p className="mt-2 max-w-md text-sm leading-7 text-[#8B929C]">
                {error || "در حال حاضر حرکتی برای شروع تمرین وجود ندارد."}
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full overflow-x-hidden bg-[#F5F7FB] px-3 py-4 sm:px-5 lg:px-8 lg:py-6"
    >
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 lg:grid-cols-[90px_minmax(0,1fr)]">
        {/* Navigation */}
        <aside className="min-w-0">
          <Navbar />
        </aside>

        {/* Main content */}
        <main className="min-w-0 py-1 lg:py-3">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-[#9AA1AB]">تمرین امروز</p>
              <h1 className="mt-1 text-lg font-bold text-[#374151] sm:text-xl">
                اجرای برنامه تمرینی
              </h1>
            </div>

            <AccountMenu />
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <CloseIcon fontSize="small" className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckIcon fontSize="small" className="mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* Current exercise hero */}
          <section className="relative isolate min-h-[320px] overflow-hidden rounded-3xl bg-[#17243A] shadow-sm sm:min-h-[390px] lg:min-h-[460px]">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={current.image}
              alt={current.title}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#101827]/95 via-[#101827]/35 to-[#101827]/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent" />

            {/* Play button */}
            <button
              type="button"
              aria-label="پخش ویدیوی حرکت"
              className="absolute left-1/2 top-[38%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/15 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-white/25 sm:h-[72px] sm:w-[72px]"
            >
              <PlayArrowRoundedIcon sx={{ fontSize: 38 }} />
            </button>

            {/* Exercise information */}
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7 lg:p-9">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  حرکت فعلی
                </span>

                <span className="rounded-full bg-[#007BFF] px-3 py-1 text-[11px] font-medium text-white">
                  ست {currentStep} از {totalSets}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                {current.title}
              </h2>

              <p className="mt-2 text-xs text-white/65 sm:text-sm">
                با تمرکز روی فرم صحیح، حرکت را اجرا کن.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                <HeroStat
                  icon={
                    <FitnessCenterRoundedIcon
                      sx={{ fontSize: 19, color: "white" }}
                    />
                  }
                  label="تعداد ست"
                  value={`${current.sets} ست`}
                />

                <HeroStat
                  icon={
                    <BoltOutlinedIcon
                      sx={{ fontSize: 20, color: "white" }}
                    />
                  }
                  label="وزن هدف"
                  value={current.weightLabel}
                />

                <HeroStat
                  icon={
                    <img
                      src={Refresh2}
                      alt=""
                      className="h-5 w-5 object-contain brightness-0 invert"
                    />
                  }
                  label="تعداد تکرار"
                  value={`${current.reps ?? "—"} بار`}
                />

                <HeroStat
                  icon={
                    <TimerOutlinedIcon
                      sx={{ fontSize: 19, color: "white" }}
                    />
                  }
                  label="زمان استراحت"
                  value={`${current.rest} ثانیه`}
                />
              </div>
            </div>
          </section>

          {/* Set progress */}
          <section className="mt-5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#374151]">
                  پیشرفت ست‌ها
                </h3>
                <p className="mt-1 text-xs text-[#9AA1AB]">
                  هر ست را پس از انجام ثبت کن
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-[#007BFF]">
                {completedSets} از {totalSets} ست تکمیل شده
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#E8F1FF]">
              <div
                className="h-full rounded-full bg-[#007BFF] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Steps */}
            <div className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${totalSets}, minmax(0, 1fr))` }}>
              {Array.from({ length: totalSets }, (_, index) => {
                const step = index + 1;
                const isDone = step < currentStep;
                const isCurrent = step === currentStep;

                return (
                  <div
                    key={step}
                    className="flex min-w-0 flex-col items-center gap-2"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-11 sm:w-11 sm:text-sm ${
                        isDone
                          ? "bg-[#007BFF] text-white"
                          : isCurrent
                            ? "bg-[#007BFF] text-white ring-4 ring-[#D9E9FF]"
                            : "bg-[#F0F4FA] text-[#9AA1AB]"
                      }`}
                    >
                      {isDone ? (
                        <CheckIcon fontSize="small" />
                      ) : (
                        step
                      )}
                    </div>

                    <span
                      className={`whitespace-nowrap text-[10px] sm:text-xs ${
                        isCurrent
                          ? "font-bold text-[#007BFF]"
                          : isDone
                            ? "text-[#6B6F77]"
                            : "text-[#A0A7B1]"
                      }`}
                    >
                      ست {SET_LABELS[index] ?? step}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Set form */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="mb-5">
                <h3 className="font-bold text-[#374151]">
                  ثبت عملکرد این ست
                </h3>
                <p className="mt-1 text-xs text-[#9AA1AB]">
                  اطلاعات واقعی اجرای حرکت را وارد کن.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-medium text-[#596273]">
                    تکرار انجام‌شده
                  </span>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      placeholder="مثلاً ۱۲"
                      value={reps}
                      onChange={(event) => setReps(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-[#FAFBFD] px-4 py-3.5 text-sm text-[#374151] outline-none transition placeholder:text-[#B5BBC4] focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#A0A7B1]">
                      تکرار
                    </span>
                  </div>
                </label>

                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-medium text-[#596273]">
                    وزن انجام‌شده
                  </span>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="مثلاً ۲۰"
                      value={weightKg}
                      onChange={(event) => setWeightKg(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-[#FAFBFD] px-4 py-3.5 text-sm text-[#374151] outline-none transition placeholder:text-[#B5BBC4] focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#A0A7B1]">
                      کیلوگرم
                    </span>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleSkipSet}
                  disabled={isLastSet || pending}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#DCEAFF] bg-[#F2F7FF] px-5 text-sm font-semibold text-[#5379B8] transition hover:bg-[#E7F1FF] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[180px]"
                >
                  <SkipNextRoundedIcon fontSize="small" />
                  پرش به ست بعدی
                </button>

                <button
                  type="button"
                  onClick={handleFinishSet}
                  disabled={
                    pending ||
                    reps === "" ||
                    Number(reps) <= 0
                  }
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-7 text-sm font-bold text-white shadow-lg shadow-blue-500/15 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:mr-auto sm:w-auto sm:min-w-[200px]"
                >
                  {pending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      <CheckIcon fontSize="small" />
                      ثبت و پایان ست
                    </>
                  )}
                </button>
              </div>

              {isLastSet && (
                <p className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
                  <CheckIcon fontSize="small" />
                  این آخرین ست این حرکت است.
                </p>
              )}
            </div>
          </section>

          {/* Upcoming exercises */}
          <section className="mt-5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#374151]">
                  حرکات بعدی
                </h3>
                <p className="mt-1 text-xs text-[#9AA1AB]">
                  برای رفتن به حرکت دیگر، آن را انتخاب کن.
                </p>
              </div>

              <span className="rounded-xl bg-[#F5F7FB] px-3 py-2 text-xs text-[#7B8491]">
                {upcoming.length} حرکت باقی‌مانده
              </span>
            </div>

            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => goToExercise(exercise.id)}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3 text-right transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <div className="relative h-[76px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-slate-200 sm:h-[84px] sm:w-[112px]">
                      <img
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        src={exercise.image}
                        alt={exercise.title}
                      />

                      <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-black/20 text-white backdrop-blur-sm">
                          <PlayArrowRoundedIcon fontSize="small" />
                        </div>
                      </div>

                      <span className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-[#374151] transition group-hover:text-[#007BFF]">
                        {exercise.title}
                      </h4>

                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                        <ExerciseStat
                          icon={Dumbel}
                          label={`${exercise.sets} ست`}
                        />

                        <ExerciseStat
                          icon={Refresh}
                          label={`${exercise.reps ?? "—"} تکرار`}
                        />

                        <ExerciseStat
                          icon={ClockCircle}
                          label={`${exercise.rest} ثانیه`}
                        />
                      </div>
                    </div>

                    <ArrowBackRoundedIcon
                      className="shrink-0 text-[#B7C0CC] transition group-hover:-translate-x-1 group-hover:text-[#007BFF]"
                      fontSize="small"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-[#FAFBFD] px-4 py-9 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF]">
                  <EmojiEventsRoundedIcon />
                </div>

                <p className="text-sm font-semibold text-[#596273]">
                  به آخرین حرکت رسیدی!
                </p>

                <p className="mt-1 text-xs text-[#A0A7B1]">
                  بعد از تکمیل این حرکت، تمام حرکات برنامه ثبت شده‌اند.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Exercise completion modal */}
      {showCompleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#101827]/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowCompleteModal(false)}
        >
          <div
            className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white p-6 text-center shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCompleteModal(false)}
              className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F7FB] text-[#929AA5] transition hover:bg-slate-100 hover:text-[#374151]"
              aria-label="بستن"
            >
              <CloseIcon fontSize="small" />
            </button>

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-blue-50 to-[#DCEBFF] text-[#007BFF]">
              <EmojiEventsRoundedIcon sx={{ fontSize: 42 }} />
            </div>

            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
              حرکت تکمیل شد
            </span>

            <h2 className="mt-4 text-xl font-bold text-[#374151]">
              آفرین، عالی بود!
            </h2>

            <p className="mt-2 text-sm leading-7 text-[#929AA5]">
              تمام ست‌های حرکت
              <span className="mx-1 font-semibold text-[#596273]">
                {current.title}
              </span>
              را انجام دادی.
            </p>

            <div className="my-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#F5F7FB] p-4">
                <p className="text-xs text-[#929AA5]">ست‌های تکمیل‌شده</p>
                <p className="mt-2 text-xl font-bold text-[#007BFF]">
                  {totalSets}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F5F7FB] p-4">
                <p className="text-xs text-[#929AA5]">حرکات باقی‌مانده</p>
                <p className="mt-2 text-xl font-bold text-[#374151]">
                  {upcoming.length}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {upcoming.length > 0 ? (
                <button
                  type="button"
                  onClick={() => goToExercise(upcoming[0].id)}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-5 text-sm font-bold text-white transition hover:bg-blue-600"
                >
                  <PlayArrowRoundedIcon fontSize="small" />
                  شروع حرکت بعدی
                </button>
              ) : (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  تمام حرکات این برنامه ثبت شد 🎉
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="min-h-12 w-full rounded-2xl bg-[#F5F7FB] px-5 text-sm font-semibold text-[#6B6F77] transition hover:bg-[#EDF0F5]"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
