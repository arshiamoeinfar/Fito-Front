import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
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
  const requested = days.find((day) => String(day.id) === String(requestedId ?? ""));
  if (requested) return requested;
  const today = (new Date().getDay() + 1) % 7;
  const todayDay = days.find((day) => day.weekday === today && (day.exercises ?? []).length > 0);
  if (todayDay) return todayDay;
  return days.find((day) => (day.exercises ?? []).length > 0) ?? days[0] ?? null;
}

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function ExerciseStat({ icon, label }) {
  return (
    <div className="flex items-center gap-0.5">
      <img className="size-3.5" src={icon} alt="" />
      <p className="text-[12px] text-[#6B6F77] font-primary-ExtraLight font-medium">
        {label}
      </p>
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
    api("/api/v1/athlete/workout-assignments").then((body) => {
      const rows = body.assignments ?? [];
      const requested = params.get("assignment");
      const picked = rows.find((row) => String(row.id) === requested)
        ?? rows.find((row) => row.status === "active")
        ?? rows[0]
        ?? null;
      setAssignment(picked);
      const day = pickDay(picked?.version?.days ?? [], params.get("day"));
      dayIdRef.current = day?.id ?? null;
      setQueue((day?.exercises ?? []).map((item) => ({
        id: item.id,
        exerciseId: item.exercise_id,
        title: item.exercise?.name ?? "حرکت",
        sets: item.prescribed_sets || 1,
        reps: item.reps_min ?? item.reps_max,
        rest: item.rest_seconds ?? 0,
        weightLabel: item.target_weight_g == null ? "بدون وزن هدف" : `${item.target_weight_g / 1000} کیلوگرم`,
        image: imgMove,
      })));
      setReady(true);
    }).catch((caught) => {
      setError(caught.message);
      setReady(true);
    });
  }, [params]);

  const current = queue[0];
  const upcoming = queue.slice(1);
  const totalSets = current?.sets ?? 1;
  const isLastSet = currentStep === totalSets;
  const progressPercent = totalSets <= 1 ? 0 : ((currentStep - 1) / (totalSets - 1)) * 100;

  const goToExercise = (id) => {
    setQueue((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx <= 0) return prev;
      const item = prev[idx];
      return [item, ...prev.filter((_, index) => index !== idx)];
    });
    setCurrentStep(1);
    setShowCompleteModal(false);
    setReps("");
    setWeightKg("");
  };

  async function handleFinishSet() {
    if (!assignment || !current || reps === "") return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      if (!sessionRef.current) {
        const started = await api("/api/v1/athlete/workout-sessions", {
          method: "POST",
          body: {
            source: "prescribed",
            performed_on: today(),
            workout_assignment_id: assignment.id,
            workout_day_id: dayIdRef.current,
          },
        });
        sessionRef.current = started.id;
      }
      const payload = {
        workout_day_exercise_id: current.id,
        exercise_id: current.exerciseId,
        set_index: currentStep - 1,
        reps: Number(reps),
        is_completed: true,
      };
      if (weightKg !== "") payload.weight_g = Math.round(Number(weightKg) * 1000);
      await api(`/api/v1/athlete/workout-sessions/${sessionRef.current}/sets`, { method: "POST", body: payload });
      setNotice("ست ثبت شد.");
      setReps("");
      setWeightKg("");
      if (isLastSet) {
        setShowCompleteModal(true);
      } else {
        setCurrentStep((step) => step + 1);
      }
    } catch (caught) {
      setError(caught.message);
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return <p className="p-8 text-sm text-slate-500">در حال خواندن برنامه</p>;
  }

  if (!current) {
    return (
      <div className="grid grid-cols-12 min-h-screen px-8 py-6 w-full max-w-[1600px]">
        <div className="col-span-1"><Navbar /></div>
        <div className="col-span-11 py-3">
          <div className="mb-4 flex justify-end">
            <AccountMenu />
          </div>
          <p className="rounded-3xl bg-white p-6 text-sm text-slate-600">{error || "برنامه‌ای برای شروع نیست."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 min-h-screen px-8 py-6 w-full max-w-[1600px]">
      <div className="col-span-1">
        <Navbar />
      </div>

      <div className="col-span-11 py-3">
        <div className="mb-4 flex justify-end">
          <AccountMenu />
        </div>
        {error ? <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}
        <div className="bg-white rounded-3xl overflow-hidden relative">
          <img className="w-full" src={current.image} alt="" />
          <button
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/80 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
            aria-label="پخش ویدیوی حرکت"
            type="button"
          >
            <PlayArrowRoundedIcon className="text-white" fontSize="large" />
          </button>
          <div className="absolute bottom-6 right-6 flex flex-col gap-3">
            <h1 className="text-4xl font-primary text-white">{current.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <img className="size-5" src={Dumbel1} alt="" />
                <p className="text-[12px] text-white font-primary-ExtraLight font-medium">{current.sets} ست</p>
              </div>
              <div className="flex items-center gap-1">
                <BoltOutlinedIcon className="text-white" sx={{ fontSize: 20 }} />
                <p className="text-[12px] text-white font-primary-ExtraLight font-medium">{current.weightLabel}</p>
              </div>
              <div className="flex items-center gap-1">
                <img className="size-5" src={Refresh2} alt="" />
                <p className="text-[12px] text-white font-primary-ExtraLight font-medium">{current.reps ?? "—"} بار تکرار</p>
              </div>
              <div className="flex items-center gap-1">
                <img className="size-5" src={ClockCircle3} alt="" />
                <p className="text-[12px] text-white font-primary-ExtraLight font-medium">{current.rest} ثانیه استراحت</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl mt-5 px-6 py-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 w-full h-2 bg-[#D9E9FF] rounded-full" />
            <div
              className="absolute top-5 right-0 h-2 bg-[#007BFF] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
            {Array.from({ length: totalSets }, (_, index) => {
              const step = index + 1;
              const isDone = step < currentStep;
              const isCurrent = step === currentStep;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      isDone
                        ? "bg-[#007BFF] text-white"
                        : isCurrent
                          ? "bg-[#007BFF] ring-4 ring-[#D9E9FF] text-white"
                          : "bg-[#D9E9FF] text-[#6B6F77]"
                    }`}
                  >
                    {isDone ? <CheckIcon fontSize="small" /> : step}
                  </div>
                  <span className="mt-3 text-sm text-[#6B6F77]">ست {SET_LABELS[index] ?? step}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              تکرار انجام‌شده
              <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" inputMode="numeric" value={reps} onChange={(event) => setReps(event.target.value)} />
            </label>
            <label className="text-sm text-slate-600">
              وزن انجام‌شده (کیلوگرم)
              <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} />
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 mt-8">
            <button
              type="button"
              onClick={handleFinishSet}
              disabled={pending || reps === ""}
              className="w-44 py-3 px-5 bg-[#007BFF] rounded-4xl text-white font-primary-light cursor-pointer hover:bg-blue-600 transition disabled:opacity-50"
            >
              پایان ست
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isLastSet) setCurrentStep((step) => Math.min(step + 1, totalSets));
              }}
              disabled={isLastSet}
              className="w-44 py-3 px-5 bg-[#DBECFF] rounded-4xl text-[#6578BC] font-primary-light cursor-pointer hover:bg-[#c9e0ff] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              پرش به ست بعدی
            </button>
          </div>
        </div>

        <div className="bg-white mt-5 rounded-3xl p-6">
          <h1 className="text-2xl text-[#6B6F77] mb-4 text-right">حرکات بعدی</h1>
          <div className="flex justify-around">
            {upcoming.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => goToExercise(exercise.id)}
                className="flex items-center cursor-pointer text-right hover:opacity-80 transition"
              >
                <div className="relative">
                  <img className="w-40 h-20 rounded-2xl object-cover" src={exercise.image} alt="" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-white/80 flex items-center justify-center">
                      <PlayArrowRoundedIcon className="text-white" fontSize="small" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col mr-3">
                  <h2>{exercise.title}</h2>
                  <div className="flex gap-3">
                    <ExerciseStat icon={Dumbel} label={`${exercise.sets} ست`} />
                    <ExerciseStat icon={Refresh} label={`${exercise.reps ?? "—"} تکرار`} />
                    <ExerciseStat icon={ClockCircle} label={`${exercise.rest} ثانیه استراحت`} />
                  </div>
                </div>
              </button>
            ))}
            {upcoming.length === 0 && (
              <p className="text-[#A0A4AA] py-6">حرکت بعدی‌ای باقی نمانده</p>
            )}
          </div>
        </div>
      </div>

      {showCompleteModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setShowCompleteModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCompleteModal(false)}
              className="absolute top-5 left-5 text-[#A0A4AA] hover:text-[#6B6F77] cursor-pointer"
              aria-label="بستن"
            >
              <CloseIcon fontSize="small" />
            </button>
            <div className="w-16 h-16 rounded-full bg-[#E8F1FF] flex items-center justify-center mx-auto mb-5 text-3xl">🎉</div>
            <h2 className="text-xl font-semibold text-[#4F5965] mb-2">آفرین، عالی بود!</h2>
            <p className="text-sm text-[#A0A4AA] mb-8">ست {current.title} ثبت شد.</p>
            <div className="flex flex-col gap-3">
              {upcoming.length > 0 ? (
                <button
                  type="button"
                  onClick={() => goToExercise(upcoming[0].id)}
                  className="w-full py-3 px-5 bg-[#007BFF] rounded-4xl text-white font-primary-light cursor-pointer hover:bg-blue-600 transition"
                >
                  شروع حرکت بعدی: {upcoming[0].title}
                </button>
              ) : (
                <p className="text-sm text-[#007BFF] font-medium py-2">تمام حرکات این تمرین ثبت شد</p>
              )}
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="w-full py-3 px-5 bg-[#F5F7FB] rounded-4xl text-[#6B6F77] font-primary-light cursor-pointer hover:bg-[#eef1f6] transition"
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
