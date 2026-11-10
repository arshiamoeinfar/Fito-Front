import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Dumbbell, MessageCircle, Utensils } from "lucide-react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import StatCard from "../../Components/shared/StatCard/StatCard";
import NeedsAttention from "../../Components/CoachDashboard/NeedsAttention";
import TodayActions from "../../Components/CoachDashboard/TodayActions";
import BodyChangeChart from "../../Components/shared/BodyChangeChart/BodyChangeChart";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";
import imgWalk from "../../assets/imges/walk.png";

const CHART_RANGES = { "7 روز": 7, "1 ماه": 30, "3 ماه": 90, "1 سال": 365 };

function countFa(value) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function when(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

function daysUntil(value) {
  if (!value) {
    return null;
  }

  const end = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(end.getTime())) {
    return null;
  }

  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

async function optional(path) {
  try {
    return await api(path);
  } catch {
    return null;
  }
}

export default function CoachDashboard() {
  const { account } = useSession();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [chartAthlete, setChartAthlete] = useState("");
  const [chartRange, setChartRange] = useState("1 ماه");
  const name = account?.profiles?.coach?.display_name || "مربی";

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/coach/relationships"),
      api("/api/v1/coach/access"),
      optional("/api/v1/coach/workout-assignments"),
      optional("/api/v1/coach/meal-assignments"),
      optional("/api/v1/coach/feedback-threads"),
    ]).then(async ([relBody, accessBody, workoutBody, mealBody, threadBody]) => {
      if (!active) {
        return;
      }

      const relationships = Array.isArray(relBody?.relationships) ? relBody.relationships : [];
      const series = [];

      for (const row of relationships.filter((item) => item.status === "active")) {
        const body = await optional(`/api/v1/coach/relationships/${row.id}/body-series?metric=weight_kg`);
        const points = Array.isArray(body?.points) ? body.points : [];

        if (points.length > 0) {
          series.push({
            id: row.id,
            name: row.athlete?.display_name || "—",
            points,
          });
        }
      }

      if (!active) {
        return;
      }

      setSnapshot({
        relationships,
        access: accessBody,
        workouts: Array.isArray(workoutBody?.assignments) ? workoutBody.assignments : [],
        meals: Array.isArray(mealBody?.assignments) ? mealBody.assignments : [],
        threads: Array.isArray(threadBody?.threads) ? threadBody.threads : [],
        series,
      });
      setReady(true);
    }, (caught) => {
      if (!active) {
        return;
      }

      setError(caught instanceof ApiError ? caught.message : "ارتباط با سرور برقرار نشد.");
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const relationships = snapshot?.relationships ?? [];
  const activeRows = relationships.filter((row) => row.status === "active");
  const features = snapshot?.access?.features ?? [];
  const period = snapshot?.access?.access?.status === "active" ? snapshot.access.access : null;
  const workouts = (snapshot?.workouts ?? []).filter((row) => row.status === "active");
  const meals = (snapshot?.meals ?? []).filter((row) => row.status === "active");
  const openThreads = (snapshot?.threads ?? []).filter((row) => row.status !== "resolved");
  const workoutIds = new Set(workouts.map((row) => row.coaching_relationship_id));
  const mealIds = new Set(meals.map((row) => row.coaching_relationship_id));
  const threadIds = new Set(openThreads.map((row) => row.coaching_relationship_id));
  const hasWorkout = features.includes("workout_programs");
  const hasNutrition = features.includes("nutrition_programs");

  const attention = activeRows.flatMap((row) => {
    const reasons = [];

    if (hasWorkout && !workoutIds.has(row.id)) {
      reasons.push("برنامه تمرین فعال ندارد");
    }

    if (hasNutrition && !mealIds.has(row.id)) {
      reasons.push("برنامه تغذیه فعال ندارد");
    }

    if (threadIds.has(row.id)) {
      reasons.push("بازخورد باز دارد");
    }

    if (reasons.length === 0) {
      return [];
    }

    const assignment = workouts.find((item) => item.coaching_relationship_id === row.id);

    return [{
      id: row.id,
      name: row.athlete?.display_name || "—",
      status: "نیازمند پیگیری",
      reason: reasons.join("، "),
      program: assignment?.program?.title || "ندارد",
    }];
  });

  const missingWorkout = hasWorkout ? activeRows.filter((row) => !workoutIds.has(row.id)) : [];
  const missingMeal = hasNutrition ? activeRows.filter((row) => !mealIds.has(row.id)) : [];
  const expiring = workouts.filter((row) => {
    const days = daysUntil(row.ends_on);
    return days !== null && days >= 0 && days <= 3;
  });
  const actions = [];

  if (!period) {
    actions.push({
      id: "access",
      icon: CalendarClock,
      title: "دوره فعالی نیست",
      description: "تا فعال شدن دوره، افزودن شاگرد و ساخت برنامه قفل است.",
      count: "بدون دوره",
      type: "warning",
      button: "پلن‌ها",
      to: "/coach/plans",
    });
  }

  if (missingWorkout.length > 0) {
    actions.push({
      id: "workout",
      icon: Dumbbell,
      title: "شاگردان بدون برنامه تمرین",
      description: "برای این شاگردان برنامه تمرین فعال نیست.",
      count: `${countFa(missingWorkout.length)} شاگرد`,
      type: "blue",
      button: "برنامه‌ها",
      to: "/coach/programs",
    });
  }

  if (missingMeal.length > 0) {
    actions.push({
      id: "meal",
      icon: Utensils,
      title: "شاگردان بدون برنامه تغذیه",
      description: "برای این شاگردان برنامه تغذیه فعال نیست.",
      count: `${countFa(missingMeal.length)} شاگرد`,
      type: "blue",
      button: "غذا",
      to: "/coach/nutrition",
    });
  }

  if (openThreads.length > 0) {
    actions.push({
      id: "feedback",
      icon: MessageCircle,
      title: "بازخورد باز",
      description: "موضوع‌هایی که هنوز بسته نشده‌اند.",
      count: `${countFa(openThreads.length)} موضوع`,
      type: "green",
      button: "پیام‌ها",
      to: "/coach/message",
    });
  }

  if (expiring.length > 0) {
    actions.push({
      id: "expiring",
      icon: CalendarClock,
      title: "برنامه‌های رو به پایان",
      description: "پایان این برنامه‌ها در سه روز آینده است.",
      count: `${countFa(expiring.length)} برنامه`,
      type: "warning",
      button: "برنامه‌ها",
      to: "/coach/programs",
    });
  }

  const capacity = period ? countFa(period.athlete_capacity) : "—";
  const capacityProgress = period && period.athlete_capacity > 0
    ? Math.min(100, Math.round((activeRows.length / period.athlete_capacity) * 100))
    : 0;
  const series = snapshot?.series ?? [];
  const selectedSeries = series.find((row) => String(row.id) === String(chartAthlete)) || series[0];
  const chartPoints = useMemo(() => {
    if (!selectedSeries) {
      return [];
    }

    const days = CHART_RANGES[chartRange] || 30;
    const cutoff = Date.now() - days * 86400000;
    const recent = selectedSeries.points.filter((point) => {
      const time = new Date(point.measured_at).getTime();
      return !Number.isNaN(time) && time >= cutoff;
    });
    const rows = recent.length > 0 ? recent : selectedSeries.points;

    return rows.map((point) => ({
      day: when(point.measured_at),
      weight: Number(point.value),
      fat: null,
      muscle: null,
    }));
  }, [chartRange, selectedSeries]);

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard
              title="داشبورد مربی"
              description={`سلام ${name}، امروز آماده‌ای شاگردانت را بهتر کنی؟`}
            />
            {error && (
              <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700" dir="rtl">
                {error}
              </p>
            )}
            <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
              <StatCard title="قدم امروز" value="7234" img={imgWalk} />
              <StatCard title="قدم امروز" value="7234" img={imgWalk} />
              <StatCard title="قدم امروز" value="7234" img={imgWalk} />
              <StatCard title="قدم امروز" value="7234" img={imgWalk} />
            </div>
            <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
              <StatCard title="شاگرد فعال" value={ready ? countFa(activeRows.length) : "…"} type="circle" progress={capacityProgress} color="#007BFF" colorBg="#EAF4FF" />
              <StatCard title="ظرفیت دوره" value={ready ? capacity : "…"} type="circle" progress={period ? 100 : 0} color="#6BAF41" colorBg="#E9FFDB" />
              <StatCard title="برنامه تمرین فعال" value={ready ? countFa(workouts.length) : "…"} type="circle" progress={workouts.length > 0 ? 100 : 0} color="#1683F7" colorBg="#EEF6FF" />
              <StatCard title="بازخورد باز" value={ready ? countFa(openThreads.length) : "…"} type="circle" progress={openThreads.length > 0 ? 100 : 0} color="#E9A820" colorBg="#FFF7E6" />
            </div>
            <div className="col-span-12">
              <NeedsAttention rows={attention} />
            </div>
            <div className="col-span-12 min-w-0 lg:col-span-8">
              <BodyChangeChart
                points={chartPoints}
                athletes={series.map((row) => ({ id: row.id, name: row.name }))}
                athleteId={selectedSeries ? String(selectedSeries.id) : ""}
                onAthlete={setChartAthlete}
                onRange={setChartRange}
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <TodayActions actions={actions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
