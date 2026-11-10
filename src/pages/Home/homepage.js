import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { faDigits } from "../../lib/jalali";

const BUILTIN = new Set([
  "nav",
  "hero",
  "stats",
  "features",
  "how",
  "showcase",
  "why",
  "workout",
  "nutrition",
  "coaches",
  "ai",
  "pricing",
  "cta",
  "footer",
]);

export function useHomepage() {
  const [state, setState] = useState({
    blocks: {},
    sections: [],
    loading: true,
  });

  useEffect(() => {
    let active = true;

    api("/api/v1/homepage")
      .then((body) => {
        if (!active) return;

        setState({
          blocks: body?.blocks ?? {},
          sections: Array.isArray(body?.sections)
            ? body.sections
            : [],
          loading: false,
        });
      })
      .catch(() => {
        if (!active) return;

        setState((prev) => ({
          ...prev,
          loading: false,
        }));
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function text(blocks, key, fallback) {
  const value = blocks?.[key]?.text;

  return typeof value === "string" ? value : fallback;
}

export function items(blocks, key, fallback) {
  const value = blocks?.[key]?.items;

  return Array.isArray(value) ? value : fallback;
}

export function regionStyle(sections, key) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return undefined;
  }

  const section = sections.find((item) => item.key === key);

  if (!section) return undefined;

  if (section.visible === false) {
    return { display: "none" };
  }

  const sort = Number(section.sort);

  return {
    order: Number.isFinite(sort) ? sort : 0,
  };
}
export function customSections(sections) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections.filter((section) => (
    section.placement === "body"
    && !BUILTIN.has(section.template)
    && section.visible !== false
  ));
}

const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

function optional(path) {
  return api(path).catch(() => null);
}

function isoToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function grams(value) {
  const number = Number(value);

  return Number.isFinite(number) ? Math.round(number / 1000) : 0;
}

function liters(value) {
  const number = Number(value) / 1000;

  if (!Number.isFinite(number)) {
    return "—";
  }

  return faDigits(number.toFixed(number >= 10 ? 0 : 1).replace(/\.0$/, ""));
}

function setsLabel(item) {
  const sets = item?.prescribed_sets;
  const reps = item?.reps_min ?? item?.reps_max;

  if (sets && reps) {
    return `${faDigits(sets)} × ${faDigits(reps)}`;
  }

  if (sets) {
    return `${faDigits(sets)} ست`;
  }

  return "—";
}

function chartBars(values) {
  if (!values.length) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values.slice(-12).map((value) => Math.round(20 + ((value - min) / span) * 75));
}

function signedPercent(from, to) {
  if (!from) {
    return "";
  }

  const delta = ((to - from) / from) * 100;
  const rounded = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;

  return faDigits(rounded);
}

function athleteView(account, workouts, sessionsBody, meals, hydration, seriesBody) {
  const assignment = (workouts?.assignments ?? []).find((row) => row.status === "active") ?? null;
  const days = assignment?.version?.days ?? [];
  const weekday = (new Date().getDay() + 1) % 7;
  const day = days.find((item) => item.weekday === weekday) ?? days[0] ?? null;
  const today = isoToday();
  const doneIds = new Set(
    (sessionsBody?.sessions ?? [])
      .filter((row) => row.performed_on === today)
      .flatMap((row) => (row.sets ?? []).map((set) => set.exercise_id)),
  );
  const exercises = (day?.exercises ?? []).map((item) => ({
    name: item.exercise?.name || "حرکت",
    sets: setsLabel(item),
    done: doneIds.has(item.exercise_id) ? "1" : "0",
  }));
  const done = exercises.filter((item) => item.done === "1").length;
  const percent = exercises.length ? Math.round((done / exercises.length) * 100) : 0;
  const meal = (meals?.assignments ?? []).find((row) => row.status === "active") ?? null;
  const mealDays = meal?.version?.days ?? [];
  const mealDay = mealDays.find((item) => item.title === WEEKDAYS[new Date().getDay()]) ?? mealDays[0] ?? null;
  const totals = mealDay?.totals;
  const protein = grams(totals?.protein_mg);
  const carbs = grams(totals?.carbohydrate_mg);
  const fat = grams(totals?.fat_mg);
  const macroBase = protein * 4 + carbs * 4 + fat * 9 || 1;
  const points = (seriesBody?.points ?? []).map((point) => Number(point.value)).filter((value) => Number.isFinite(value));
  const name = account?.profiles?.athlete?.display_name || "ورزشکار";
  const waterMl = Number(hydration?.amount_ml) || 0;
  const goalMl = Number(hydration?.goal_ml) || 4000;

  return {
    initials: name.trim().slice(0, 1) || "و",
    name,
    workoutTitle: day?.title || assignment?.program?.title || "برنامه‌ای برای امروز نیست",
    exercises,
    percent,
    percentText: `${faDigits(percent)}%`,
    moves: `${faDigits(done)} از ${faDigits(exercises.length)} حرکت`,
    remain: exercises.length ? `${faDigits(Math.max(exercises.length - done, 0))} حرکت مانده` : "حرکتی برای امروز نیست",
    kcal: totals?.energy_kcal == null ? "—" : faDigits(Math.round(Number(totals.energy_kcal))),
    kcalLabel: totals?.energy_kcal == null ? "— kcal" : `${faDigits(Math.round(Number(totals.energy_kcal)))} kcal`,
    macros: totals ? [
      { label: "پروتئین", value: `${faDigits(protein)}g`, percent: `${Math.round((protein * 4 / macroBase) * 100)}%` },
      { label: "کربوهیدرات", value: `${faDigits(carbs)}g`, percent: `${Math.round((carbs * 4 / macroBase) * 100)}%` },
      { label: "چربی", value: `${faDigits(fat)}g`, percent: `${Math.round((fat * 9 / macroBase) * 100)}%` },
    ] : null,
    waterLiters: hydration ? liters(waterMl) : "—",
    waterDetail: hydration ? `${liters(waterMl)} از ${liters(goalMl)} لیتر` : "—",
    waterPercent: hydration ? `${Math.min(100, Math.round((waterMl / goalMl) * 100))}%` : "—",
    bodyValue: points.length >= 2 ? signedPercent(points[0], points[points.length - 1]) : (points.length === 1 ? `${faDigits(points[points.length - 1])} کیلو` : "—"),
    bodyDelta: points.length >= 2 ? signedPercent(points[points.length - 2], points[points.length - 1]) : "",
    chart: chartBars(points),
  };
}

function coachView(relationshipsBody, workoutsBody, mealsBody, threadsBody) {
  const relationships = Array.isArray(relationshipsBody?.relationships) ? relationshipsBody.relationships : [];
  const active = relationships.filter((row) => row.status === "active");
  const workouts = Array.isArray(workoutsBody?.assignments) ? workoutsBody.assignments : [];
  const meals = Array.isArray(mealsBody?.assignments) ? mealsBody.assignments : [];
  const threads = Array.isArray(threadsBody?.threads) ? threadsBody.threads : [];

  return {
    count: `${faDigits(active.length)} شاگرد`,
    students: relationships.slice(0, 4).map((row) => {
      const name = row.athlete?.display_name || "شاگرد";

      return {
        avatar: name.trim().slice(0, 1) || "ش",
        name,
        status: row.status === "active" ? "فعال" : "پایان‌یافته",
      };
    }),
    metrics: [
      { label: "برنامه‌های فعال", value: faDigits(workouts.filter((row) => row.status === "active").length) },
      { label: "برنامه تغذیه", value: faDigits(meals.filter((row) => row.status === "active").length) },
      { label: "بازخورد باز", value: faDigits(threads.filter((row) => row.status === "open").length) },
      { label: "شاگرد فعال", value: faDigits(active.length) },
    ],
  };
}

export function useLiveHome(account) {
  const athleteId = account?.profiles?.athlete?.id ?? null;
  const coachId = account?.profiles?.coach?.id ?? null;
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!athleteId && !coachId) {
      return undefined;
    }

    let active = true;

    Promise.all([
      athleteId ? Promise.all([
        optional("/api/v1/athlete/workout-assignments"),
        optional("/api/v1/athlete/workout-sessions"),
        optional("/api/v1/athlete/meal-assignments"),
        optional(`/api/v1/athlete/hydration?logged_on=${isoToday()}`),
        optional("/api/v1/athlete/body-series?metric=weight_kg"),
      ]) : Promise.resolve(null),
      coachId ? Promise.all([
        optional("/api/v1/coach/relationships"),
        optional("/api/v1/coach/workout-assignments"),
        optional("/api/v1/coach/meal-assignments"),
        optional("/api/v1/coach/feedback-threads"),
      ]) : Promise.resolve(null),
    ]).then(([athleteRows, coachRows]) => {
      if (!active) {
        return;
      }

      setLive({
        athlete: athleteRows ? athleteView(account, ...athleteRows) : null,
        coach: coachRows ? coachView(...coachRows) : null,
      });
    });

    return () => {
      active = false;
    };
  }, [account, athleteId, coachId]);

  return athleteId || coachId ? live : null;
}
