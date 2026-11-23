
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import StatCard from "../../Components/shared/StatCard/StatCard";
import BodyChangeChart from "../../Components/shared/BodyChangeChart/BodyChangeChart";
import SupplementaryReports from "../../Components/CoachDashboard/Supplementaryreports";
import { api, ApiError } from "../../api/client";

const RANGES = {
  "7 روز": 7,
  "1 ماه": 30,
  "3 ماه": 90,
  "1 سال": 365,
};

const REPORT_COLORS = [
  { color: "#5FA83D", colorLight: "#8FD16A", track: "#E5F6DA" },
  { color: "#1683F7", colorLight: "#7DB7F8", track: "#EAF4FF" },
  { color: "#C89B1D", colorLight: "#E6C158", track: "#F7EDD3" },
  { color: "#17ADC2", colorLight: "#5FD3E3", track: "#DBF5F8" },
];

function countFa(value) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function dayLabel(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function optional(path) {
  try {
    return await api(path);
  } catch {
    return null;
  }
}

function pointsOf(body) {
  return Array.isArray(body?.points) ? body.points : [];
}

function StatCardSkeleton() {
  return (
    <div className="min-w-0 animate-pulse rounded-3xl border border-slate-100 bg-white p-4 sm:p-5">
      <div className="h-3 w-20 rounded-full bg-slate-100" />
      <div className="mt-5 h-8 w-14 rounded-xl bg-slate-100" />
      <div className="mt-4 h-2 w-full rounded-full bg-slate-100" />
    </div>
  );
}

export default function ReportPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [athleteId, setAthleteId] = useState("");
  const [range, setRange] = useState("7 روز");

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        const [
          relBody,
          accessBody,
          workoutBody,
          mealBody,
          threadBody,
        ] = await Promise.all([
          api("/api/v1/coach/relationships"),
          api("/api/v1/coach/access"),
          optional("/api/v1/coach/workout-assignments"),
          optional("/api/v1/coach/meal-assignments"),
          optional("/api/v1/coach/feedback-threads"),
        ]);

        if (!active) return;

        const relationships = Array.isArray(relBody?.relationships)
          ? relBody.relationships
          : [];

        const bodies = await Promise.all(
          relationships.map(async (row) => {
            const [weight, fat, muscle, sessions] = await Promise.all([
              optional(
                `/api/v1/coach/relationships/${row.id}/body-series?metric=weight_kg`
              ),
              optional(
                `/api/v1/coach/relationships/${row.id}/body-series?metric=body_fat_percent`
              ),
              optional(
                `/api/v1/coach/relationships/${row.id}/body-series?metric=muscle_mass_kg`
              ),
              row.status === "active"
                ? optional(
                    `/api/v1/coach/relationships/${row.id}/workout-sessions`
                  )
                : Promise.resolve(null),
            ]);

            return {
              id: row.id,
              name: row.athlete?.display_name || "—",
              status: row.status,
              weight: pointsOf(weight),
              fat: pointsOf(fat),
              muscle: pointsOf(muscle),
              sessions: Array.isArray(sessions?.sessions)
                ? sessions.sessions
                : [],
            };
          })
        );

        if (!active) return;

        setSnapshot({
          relationships,
          access: accessBody,
          workouts: Array.isArray(workoutBody?.assignments)
            ? workoutBody.assignments
            : [],
          meals: Array.isArray(mealBody?.assignments)
            ? mealBody.assignments
            : [],
          threads: Array.isArray(threadBody?.threads)
            ? threadBody.threads
            : [],
          bodies,
        });

        setAthleteId(
          String(
            bodies.find(
              (row) =>
                row.weight.length ||
                row.fat.length ||
                row.muscle.length
            )?.id ||
              bodies[0]?.id ||
              ""
          )
        );
      } catch (caught) {
        if (!active) return;

        setError(
          caught instanceof ApiError
            ? caught.message
            : "ارتباط با سرور برقرار نشد."
        );
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  const relationships = snapshot?.relationships ?? [];

  const activeRows = relationships.filter(
    (row) => row.status === "active"
  );

  const features = snapshot?.access?.features ?? [];

  const workouts = (snapshot?.workouts ?? []).filter(
    (row) => row.status === "active"
  );

  const meals = (snapshot?.meals ?? []).filter(
    (row) => row.status === "active"
  );

  const threads = snapshot?.threads ?? [];
  const bodies = snapshot?.bodies ?? [];

  const sessions = bodies.flatMap((row) => row.sessions);

  const completedSessions = sessions.filter(
    (row) => row.status === "completed"
  );

  const measured = bodies.filter(
    (row) => row.weight.length > 0
  );

  const workoutIds = new Set(
    workouts.map((row) => row.coaching_relationship_id)
  );

  const mealIds = new Set(
    meals.map((row) => row.coaching_relationship_id)
  );

  const selected =
    bodies.find(
      (row) => String(row.id) === String(athleteId)
    ) || bodies[0];

  const chartPoints = useMemo(() => {
    if (!selected) return [];

    const days = RANGES[range] || 30;
    const cutoff = Date.now() - days * 86400000;

    const recent = (points) =>
      points.filter((point) => {
        const time = new Date(point.measured_at).getTime();
        return !Number.isNaN(time) && time >= cutoff;
      });

    const weight = recent(selected.weight);
    const fat = recent(selected.fat);
    const muscle = recent(selected.muscle);

    const rows = new Map();

    function add(points, field) {
      for (const point of points) {
        const key = point.measured_at;

        const current = rows.get(key) || {
          day: dayLabel(key),
          weight: null,
          fat: null,
          muscle: null,
          sort: new Date(key).getTime(),
        };

        current[field] = Number(point.value);
        rows.set(key, current);
      }
    }

    add(weight, "weight");
    add(fat, "fat");
    add(muscle, "muscle");

    return [...rows.values()].sort(
      (left, right) => left.sort - right.sort
    );
  }, [range, selected]);

  const reportRows = [];

  if (features.includes("workout_programs")) {
    reportRows.push({
      id: "workout",
      label: "شاگردان با برنامه تمرین",
      percent: percent(
        activeRows.filter((row) => workoutIds.has(row.id)).length,
        activeRows.length
      ),
    });
  }

  if (features.includes("nutrition_programs")) {
    reportRows.push({
      id: "meal",
      label: "شاگردان با برنامه تغذیه",
      percent: percent(
        activeRows.filter((row) => mealIds.has(row.id)).length,
        activeRows.length
      ),
    });
  }

  reportRows.push({
    id: "weight",
    label: "شاگردان با اندازه‌گیری وزن",
    percent: percent(measured.length, relationships.length),
  });

  reportRows.push({
    id: "sessions",
    label: "جلسه‌های تکمیل‌شده",
    percent: percent(
      completedSessions.length,
      sessions.length
    ),
  });

  const reports = reportRows.map((row, index) => ({
    ...row,
    ...REPORT_COLORS[index % REPORT_COLORS.length],
  }));

  const stats = [
    {
      title: "شاگرد فعال",
      value: activeRows.length,
      progress: activeRows.length ? 100 : 0,
      color: "#007BFF",
      colorBg: "#EAF4FF",
    },
    {
      title: "جلسه ثبت‌شده",
      value: sessions.length,
      progress: percent(
        completedSessions.length,
        sessions.length
      ),
      color: "#6BAF41",
      colorBg: "#E9FFDB",
    },
    {
      title: "اندازه‌گیری وزن",
      value: measured.length,
      progress: percent(
        measured.length,
        relationships.length
      ),
      color: "#1683F7",
      colorBg: "#EEF6FF",
    },
    {
      title: "بازخورد باز",
      value: threads.filter(
        (row) => row.status !== "resolved"
      ).length,
      progress: threads.some(
        (row) => row.status !== "resolved"
      )
        ? 100
        : 0,
      color: "#E9A820",
      colorBg: "#FFF7E6",
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full overflow-x-hidden bg-[#F5F7FB]"
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 gap-4 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        {/* Sidebar */}
        <aside className="">
          <Navbar />
        </aside>

        {/* Main content */}
        <main className="min-w-0 py-1 sm:py-2 lg:py-3">
          <div className="grid min-w-0 grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
            {/* Header */}
            <div className="col-span-12 min-w-0">
              <HeaderDashBoard
                title="گزارش‌ها"
                description="تحلیل عملکرد کلی شاگردان"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="col-span-12 min-w-0">
                <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-right text-sm leading-7 text-red-700 sm:rounded-3xl sm:px-6">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                    !
                  </span>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Statistics */}
            <section className="col-span-12 min-w-0">
            

              <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 xl:gap-5">
                {ready
                  ? stats.map((stat) => (
                      <div
                        key={stat.title}
                        className="min-w-0 overflow-hidden"
                      >
                        <StatCard
                          title={stat.title}
                          value={countFa(stat.value)}
                          type="circle"
                          progress={stat.progress}
                          color={stat.color}
                          colorBg={stat.colorBg}
                        />
                      </div>
                    ))
                  : Array.from({ length: 4 }).map((_, index) => (
                      <StatCardSkeleton key={index} />
                    ))}
              </div>
            </section>

            {/* Chart */}
            <section className="col-span-12 min-w-0 xl:col-span-8">
              <div className="h-full min-w-0 overflow-hidden rounded-3xl border border-slate-100/80 bg-white shadow-sm shadow-slate-200/30">
                <div className="min-w-0 p-2 sm:p-3 lg:p-4">
                  <BodyChangeChart
                    points={ready ? chartPoints : []}
                    athletes={bodies.map((row) => ({
                      id: row.id,
                      name: row.name,
                    }))}
                    athleteId={athleteId}
                    onAthlete={setAthleteId}
                    onRange={setRange}
                  />
                </div>
              </div>
            </section>

            {/* Supplementary reports */}
            <section className="col-span-12 min-w-0 xl:col-span-4">
              <div className="h-full min-w-0 overflow-hidden rounded-3xl border border-slate-100/80 bg-white shadow-sm shadow-slate-200/30">
                <div className="min-w-0 p-3 sm:p-4">
                  <SupplementaryReports
                    reports={ready ? reports : []}
                  />
                </div>
              </div>
            </section>

            {/* Footer spacing */}
            <div className="col-span-12 h-2 sm:h-4" />
          </div>
        </main>
      </div>
    </div>
  );
}
