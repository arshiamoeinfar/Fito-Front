import { useEffect, useState } from "react";
import Navbar from "../../../Components/shared/Navbar/Navbar";
import AIChat from "../../../Components/DashBoardAuth/DashBoardAuthlete/Aichat/Aichat";
import ProfileCard from "../../../Components/DashBoardAuth/DashBoardAuthlete/ProfileDashboard/ProfileDashboard";
import Mytrain from "../../../Components/DashBoardAuth/DashBoardAuthlete/Mytrain/Mytrain";
import DailyGoalCard from "../../../Components/DashBoardAuth/DashBoardAuthlete/DailyGoalCard/DailyGoalCard";
import StatCard from "../../../Components/shared/StatCard/StatCard";
import NutritionCard from "../../../Components/DashBoardAuth/DashBoardAuthlete/NutritionCard/NutritionCard";
import DailyHydrationCard from "../../../Components/DashBoardAuth/DashBoardAuthlete/DailyHydrationCard/DailyHydrationCard";
import BodyProgressCard from "../../../Components/DashBoardAuth/DashBoardAuthlete/BodyProgressCard/BodyProgressCard";
import { api } from "../../../api/client";
import { useSession } from "../../../api/session";
import imgWalk from "../../../assets/imges/walk.png";
import exerciseImage from "../../../assets/imges/image 13.png";
import breakfastIcon from "../../../assets/imges/break.png";
import lunchIcon from "../../../assets/imges/lunch.png";
import dinnerIcon from "../../../assets/imges/dinner.png";

function optional(path) {
  return api(path).catch(() => null);
}

function isoToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function todayWeekday() {
  return (new Date().getDay() + 1) % 7;
}

function showNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "—";
}

function gramsFromMg(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number / 1000) : null;
}

function kcalText(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number)} کالری` : "—";
}

function mediaSrc(path) {
  if (typeof path !== "string") return "";
  const value = path.trim();
  if (value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/")) return value;
  return "";
}

const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const MEAL_ROWS = [
  { type: "breakfast", name: "صبحانه", icon: breakfastIcon },
  { type: "lunch", name: "نهار", icon: lunchIcon },
  { type: "dinner", name: "شام", icon: dinnerIcon },
];

function todayMealDay(assignment) {
  const days = assignment?.version?.days ?? [];
  const today = WEEKDAYS[new Date().getDay()];
  return days.find((item) => item.title === today) ?? days[0] ?? null;
}

export default function DashboardAthlete() {
  const { account, refresh } = useSession();
  const [workout, setWorkout] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [meal, setMeal] = useState(null);
  const [weight, setWeight] = useState(null);
  const [series, setSeries] = useState([]);
  const [height, setHeight] = useState(null);
  const [openFeedback, setOpenFeedback] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const [waterSaving, setWaterSaving] = useState(false);
  const [waterError, setWaterError] = useState("");
  const [bloodError, setBloodError] = useState("");
  const [bloodSaving, setBloodSaving] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      optional("/api/v1/athlete/workout-assignments"),
      optional("/api/v1/athlete/workout-sessions"),
      optional("/api/v1/athlete/meal-assignments"),
      optional("/api/v1/athlete/body-series?metric=weight_kg"),
      optional("/api/v1/athlete/body-observations"),
      optional("/api/v1/athlete/feedback-threads"),
      optional(`/api/v1/athlete/hydration?logged_on=${isoToday()}`),
    ]).then(([workouts, sessionBody, meals, seriesBody, observations, threads, hydration]) => {
      if (!active) return;
      const assignment = (workouts?.assignments ?? []).find((row) => row.status === "active") ?? null;
      const mealAssignment = (meals?.assignments ?? []).find((row) => row.status === "active") ?? null;
      const points = seriesBody?.points ?? [];
      const latestObservation = (observations?.observations ?? [])[0] ?? null;
      const open = (threads?.threads ?? []).filter((row) => row.status === "open").length;
      setWorkout(assignment);
      setSessions(sessionBody?.sessions ?? []);
      setMeal(mealAssignment);
      setSeries(points);
      setWeight(points.length ? points[points.length - 1] : null);
      setHeight(latestObservation?.metrics?.height_cm ?? null);
      setOpenFeedback(open);
      if (!hydration) {
        setWaterError("آب امروز خوانده نشد.");
      } else {
        setWaterMl(Number(hydration.amount_ml) || 0);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const name = account?.profiles?.athlete?.display_name || "ورزشکار";
  const storedBlood = account?.profiles?.athlete?.blood_group || "";
  const [bloodGroup, setBloodGroup] = useState(storedBlood);

  useEffect(() => {
    setBloodGroup(storedBlood);
  }, [storedBlood]);

  async function saveBlood(value) {
    if (bloodSaving) return;
    const previous = bloodGroup;
    setBloodGroup(value);
    setBloodSaving(true);
    setBloodError("");
    try {
      await api("/api/v1/athlete/profile", {
        method: "PATCH",
        body: { blood_group: value || null },
      });
      await refresh();
    } catch {
      setBloodGroup(previous);
      setBloodError("گروه خونی ذخیره نشد.");
    } finally {
      setBloodSaving(false);
    }
  }

  async function changeWater(next) {
    if (waterSaving) return;
    const previous = waterMl;
    setWaterMl(next);
    setWaterSaving(true);
    setWaterError("");
    try {
      await api("/api/v1/athlete/hydration", {
        method: "PUT",
        body: { logged_on: isoToday(), amount_ml: next },
      });
    } catch {
      setWaterMl(previous);
      setWaterError("آب امروز ذخیره نشد.");
    } finally {
      setWaterSaving(false);
    }
  }
  const days = workout?.version?.days ?? [];
  const day = days.find((item) => item.weekday === todayWeekday()) ?? days[0] ?? null;
  const exercises = (day?.exercises ?? []).map((item) => {
    const image = (item.exercise?.media ?? []).map((media) => mediaSrc(media.path)).find(Boolean);
    return {
      id: item.id,
      exerciseId: item.exercise_id,
      name: item.exercise?.name || "حرکت",
      sets: item.prescribed_sets ?? "—",
      reps: item.reps_min ?? item.reps_max ?? "—",
      rest: item.rest_seconds ?? "—",
      image: image || exerciseImage,
    };
  });
  const startTo = workout
    ? `/dashboardAthlete/start-training?assignment=${workout.id}${day?.id ? `&day=${day.id}` : ""}`
    : "/trainingpage";
  const today = isoToday();
  const doneIds = new Set(
    sessions
      .filter((row) => row.performed_on === today)
      .flatMap((row) => (row.sets ?? []).map((set) => set.exercise_id)),
  );
  const done = exercises.filter((item) => doneIds.has(item.exerciseId)).length;
  const total = exercises.length;
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const mealDay = todayMealDay(meal);
  const meals = MEAL_ROWS.map((slot) => {
    const found = (mealDay?.meals ?? []).find((item) => item.meal_type === slot.type);
    return { name: slot.name, icon: slot.icon, calories: kcalText(found?.totals?.energy_kcal) };
  });
  const macroGrams = [
    { name: "کربوهیدرات", grams: gramsFromMg(mealDay?.totals?.carbohydrate_mg) },
    { name: "پروتئین", grams: gramsFromMg(mealDay?.totals?.protein_mg) },
    { name: "چربی", grams: gramsFromMg(mealDay?.totals?.fat_mg) },
  ];
  const macroMax = Math.max(...macroGrams.map((item) => item.grams || 0), 1);
  const bars = macroGrams.map((item) => ({
    name: item.name,
    value: item.grams ? Math.max(8, Math.round((item.grams / macroMax) * 100)) : 0,
    caption: item.grams == null ? "—" : `${item.grams} گرم`,
  }));
  const weightSeries = series
    .map((point) => ({ value: Number(point.value) }))
    .filter((point) => Number.isFinite(point.value));
  const weightLabel = weight ? `${weight.value} کیلو` : "وزنی ثبت نشده";

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)_320px] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-1 lg:py-3">
          <div className="grid h-full grid-cols-12 gap-4 lg:gap-6">
            <div className="relative col-span-12 flex min-h-44 w-full items-center justify-center overflow-hidden rounded-4xl bg-[#007BFF] lg:col-span-6 lg:max-h-44">
              <DailyGoalCard
                done={done}
                total={total}
                percent={percent}
                to={startTo}
                summary={total ? `${done} از ${total} حرکت امروز` : "برنامه فعالی برای امروز نیست"}
              />
            </div>
            <div className="col-span-12 lg:col-span-6 lg:row-span-2">
              <Mytrain exercises={exercises} dayTitle={day?.title || "امروز"} startTo={startTo} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <NutritionCard meals={meals} bars={bars} />
            </div>
            <div className="col-span-12 mt-1 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              <StatCard title="وزن" value={weight ? `${weight.value}` : "—"} img={imgWalk} />
              <StatCard title="قد" value={showNumber(height)} img={imgWalk} />
              <StatCard title="جلسه ثبت‌شده" value={String(sessions.length)} img={imgWalk} />
              <StatCard title="بازخورد باز" value={String(openFeedback)} img={imgWalk} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <div className="flex h-auto flex-col rounded-3xl bg-white p-6">
                <DailyHydrationCard
                  amountMl={waterMl}
                  onChange={changeWater}
                  saving={waterSaving}
                  error={waterError}
                />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6">
              <BodyProgressCard
                isShowMore
                count={[1]}
                title="پیشرفت بدن"
                series={weightSeries}
                metric="وزن"
                change={weightLabel}
              />
            </div>
          </div>
        </div>
        <div className="mt-1 min-w-0 lg:mt-3">
          <ProfileCard
            name={name}
            detail={account?.phone || ""}
            age=""
            height={showNumber(height)}
            weight={weight ? String(weight.value) : "—"}
            extraLabel="گروه خونی"
            extra={bloodGroup}
            onExtraChange={saveBlood}
          />
          {bloodError ? <p className="mt-2 text-center text-sm text-red-700">{bloodError}</p> : null}
          <AIChat />
        </div>
      </div>
    </div>
  );
}
