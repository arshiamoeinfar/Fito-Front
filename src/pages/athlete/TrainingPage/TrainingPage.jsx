import { useEffect, useMemo, useState } from "react";
import Navbar from "../../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import StatCard from "../../../Components/shared/StatCard/StatCard";
import Mytrain from "../../../Components/DashBoardAuth/DashBoardAuthlete/Mytrain/Mytrain";
import BodyProgressCard from "../../../Components/DashBoardAuth/DashBoardAuthlete/BodyProgressCard/BodyProgressCard";
import SmartAnalysisCard from "../../../Components/DashBoardAuth/TrainigPage/SmartAnalysisCard/SmartAnalysisCard/SmartAnalysisCard";
import WorkoutProgramCard from "../../../Components/DashBoardAuth/TrainigPage/SmartAnalysisCard/WorkoutProgramCard/WorkoutProgramCard";
import WorkoutHistory from "../../../Components/DashBoardAuth/TrainigPage/WorkoutHistory/WorkoutHistory";
import WorkoutNotes from "../../../Components/DashBoardAuth/TrainigPage/WorkoutNotes/WorkoutNotes";
import PersonalRecordsCard from "../../../Components/DashBoardAuth/TrainigPage/PersonalRecordsCard/PersonalRecordsCard";
import { api } from "../../../api/client";
import { useSession } from "../../../api/session";
import { showDate } from "../../../lib/jalali";
import Walk from "../../../assets/imges/walk.png";
import exerciseImage from "../../../assets/imges/image 13.png";

const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const SHORT_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function optional(path) {
  return api(path).catch(() => null);
}

function todayWeekday() {
  return (new Date().getDay() + 1) % 7;
}

function pickAssignmentId(rows, currentId) {
  if (currentId && rows.some((row) => String(row.id) === String(currentId))) {
    return String(currentId);
  }
  const active = rows.find((row) => row.status === "active");
  return String((active ?? rows[0])?.id ?? "");
}

function preferredDay(days) {
  const today = todayWeekday();
  return days.find((day) => day.weekday === today)
    ?? days.find((day) => (day.exercises ?? []).length > 0)
    ?? days[0]
    ?? null;
}

function weekdayName(weekday) {
  return WEEKDAYS[weekday] ?? "";
}

function dayLabel(day) {
  return day?.title || weekdayName(day?.weekday) || "روز تمرین";
}

function programTitle(assignment) {
  return assignment?.program?.title || "برنامه تمرین";
}

function mediaSrc(path) {
  if (typeof path !== "string") return "";
  const value = path.trim();
  if (value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/")) return value;
  return "";
}

function coverImage(exercise) {
  const image = (exercise?.media ?? []).find((item) => item.media_type === "image" && mediaSrc(item.path));
  return image ? mediaSrc(image.path) : "";
}

function orderedAssignments(rows) {
  return [...rows].sort((left, right) => {
    if (left.status === "active" && right.status !== "active") return -1;
    if (right.status === "active" && left.status !== "active") return 1;
    return 0;
  });
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "م";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

function findDay(assignments, dayId) {
  for (const assignment of assignments) {
    const day = (assignment.version?.days ?? []).find((item) => item.id === dayId);
    if (day) return day;
  }
  return null;
}

function formatMeasure(value, unit) {
  if (unit === "weight") {
    const rounded = Math.round(value * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
    return `${text} کیلو`;
  }
  return `${value} تکرار`;
}

function movementSeries(sessions) {
  const ordered = [...sessions].sort((left, right) => String(left.performed_on).localeCompare(String(right.performed_on)) || left.id - right.id);
  const byExercise = new Map();
  ordered.forEach((session) => {
    const grouped = new Map();
    (session.sets ?? []).forEach((set) => {
      if (set.is_completed === false) return;
      const bucket = grouped.get(Number(set.exercise_id)) ?? { name: set.exercise?.name || "حرکت", weights: [], reps: [] };
      if (set.weight_g) bucket.weights.push(Number(set.weight_g));
      if (set.reps) bucket.reps.push(Number(set.reps));
      grouped.set(Number(set.exercise_id), bucket);
    });
    grouped.forEach((bucket, id) => {
      const useWeight = bucket.weights.length > 0;
      const raw = useWeight ? Math.max(...bucket.weights) : Math.max(0, ...bucket.reps);
      if (!raw) return;
      const current = byExercise.get(id) ?? { id, name: bucket.name, unit: useWeight ? "weight" : "reps", points: [] };
      if (useWeight) current.unit = "weight";
      current.name = bucket.name || current.name;
      current.points.push({ value: useWeight ? raw / 1000 : raw });
      byExercise.set(id, current);
    });
  });
  return [...byExercise.values()];
}

function percentChange(first, last) {
  if (!first) return null;
  return Math.round(((last - first) / first) * 100);
}

function signedPercent(value) {
  if (value == null) return "—";
  return `\u200E${value > 0 ? "+" : ""}${value}%`;
}

function durationLabel(start, end) {
  if (!start || !end) return "";
  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return "";
  if (minutes < 60) return `${minutes} دقیقه`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ساعت و ${rest} دقیقه` : `${hours} ساعت`;
}

function fold(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hit(query, values) {
  if (!query) return true;
  return values.some((value) => fold(value).includes(query));
}

function restSuggestion(exercises) {
  const rest = exercises.find((item) => item.rest_seconds)?.rest_seconds;
  return rest ? `${rest} ثانیه استراحت بین ست‌ها` : "هر ست را تا پایان دامنه تکرار ادامه بده";
}

function finiteNumber(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function progressMovements(assignments, tracks, sessions, selectedId) {
  const byId = new Map();
  const list = Array.isArray(assignments) ? assignments : [];
  const selected = list.find((row) => String(row?.id) === String(selectedId));
  const ordered = [
    ...list.filter((row) => row !== selected && row?.status !== "active"),
    ...list.filter((row) => row !== selected && row?.status === "active"),
    ...(selected ? [selected] : []),
  ];
  ordered.forEach((assignment) => {
      (assignment?.version?.days ?? []).forEach((day) => {
        (day?.exercises ?? []).forEach((item) => {
          const exercise = item?.exercise;
          const id = finiteNumber(exercise?.id);
          if (id == null) return;
          const current = byId.get(id) ?? {
            id,
            name: exercise?.name || "حرکت",
            image: "",
            sets: null,
            repsMin: null,
            repsMax: null,
          };
          if (exercise?.name) current.name = exercise.name;
          const image = coverImage(exercise);
          if (image) current.image = image;
          const sets = finiteNumber(item?.prescribed_sets);
          if (sets != null) current.sets = sets;
          const repsMin = finiteNumber(item?.reps_min);
          const repsMax = finiteNumber(item?.reps_max);
          if (repsMin != null) current.repsMin = repsMin;
          if (repsMax != null) current.repsMax = repsMax;
          byId.set(id, current);
        });
      });
    });

  const performed = new Map();
  [...(Array.isArray(sessions) ? sessions : [])]
    .sort((left, right) => String(left?.performed_on).localeCompare(String(right?.performed_on)) || (left?.id ?? 0) - (right?.id ?? 0))
    .forEach((session) => {
      const grouped = new Map();
      (session?.sets ?? []).forEach((set) => {
        if (set?.is_completed === false) return;
        const id = finiteNumber(set?.exercise_id);
        if (id == null) return;
        const bucket = grouped.get(id) ?? { sets: 0, reps: null, name: set?.exercise?.name || "" };
        bucket.sets += 1;
        const reps = finiteNumber(set?.reps);
        if (reps != null) bucket.reps = reps;
        if (set?.exercise?.name) bucket.name = set.exercise.name;
        grouped.set(id, bucket);
      });
      grouped.forEach((bucket, id) => performed.set(id, bucket));
    });

  performed.forEach((bucket, id) => {
    if (byId.has(id)) return;
    byId.set(id, {
      id,
      name: bucket.name || "حرکت",
      image: "",
      sets: null,
      repsMin: null,
      repsMax: null,
    });
  });

  (Array.isArray(tracks) ? tracks : []).forEach((track) => {
    const id = finiteNumber(track?.id);
    if (id == null) return;
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        name: track?.name || performed.get(id)?.name || "حرکت",
        image: "",
        sets: null,
        repsMin: null,
        repsMax: null,
      });
    }
  });

  const trackById = new Map((Array.isArray(tracks) ? tracks : []).map((track) => [finiteNumber(track?.id), track]));
  return [...byId.values()].map((row) => {
    const track = trackById.get(row.id);
    const points = (track?.points ?? []).map((point) => finiteNumber(point?.value)).filter((value) => value != null);
    const done = performed.get(row.id);
    let repsMin = row.repsMin;
    const repsMax = row.repsMax;
    if (repsMin == null && repsMax == null && done?.reps != null) repsMin = done.reps;
    return {
      id: row.id,
      name: row.name || done?.name || "حرکت",
      image: row.image || "",
      sets: row.sets ?? done?.sets ?? null,
      repsMin,
      repsMax,
      current: points.length ? points.at(-1) : null,
      previous: points.length > 1 ? points.at(-2) : null,
      unit: track?.unit === "reps" ? "reps" : "weight",
      history: points,
    };
  });
}

export default function TrainingPage() {
  const { account } = useSession();
  const [assignments, setAssignments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [weight, setWeight] = useState(null);
  const [coachName, setCoachName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [dayId, setDayId] = useState("");
  const [error, setError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api("/api/v1/athlete/workout-assignments").then((value) => ({ ok: true, value }), (reason) => ({ ok: false, reason })),
      api("/api/v1/athlete/workout-sessions").then((value) => ({ ok: true, value }), (reason) => ({ ok: false, reason })),
      optional("/api/v1/athlete/body-series?metric=weight_kg"),
      optional("/api/v1/athlete/records"),
      optional("/api/v1/athlete/relationships"),
    ]).then(([workouts, sessionBody, seriesBody, recordBody, relationshipBody]) => {
      if (!active) return;
      if (workouts.ok) {
        const rows = workouts.value.assignments ?? [];
        setAssignments(rows);
        setSelectedId((current) => pickAssignmentId(rows, current));
      } else {
        setAssignments([]);
        setError(workouts.reason?.message || "برنامه خوانده نشد.");
      }
      if (sessionBody.ok) {
        setSessions(sessionBody.value.sessions ?? []);
        setSessionError("");
      } else {
        setSessions([]);
        const message = sessionBody.reason?.message || "تمرین‌های ثبت‌شده خوانده نشد.";
        setSessionError(message);
        if (workouts.ok) setError(message);
      }
      const points = seriesBody?.points ?? [];
      setWeight(points.length ? points[points.length - 1] : null);
      setRecords(recordBody?.records ?? []);
      const coach = (relationshipBody?.relationships ?? []).find((row) => row.status === "active");
      setCoachName(coach?.coach?.display_name || "");
      setReady(true);
    }).catch(() => {
      if (!active) return;
      setReady(true);
      setSessionError("تمرین‌های ثبت‌شده خوانده نشد.");
    });
    return () => {
      active = false;
    };
  }, []);

  const programs = orderedAssignments(assignments);
  const assignment = programs.find((row) => String(row.id) === selectedId) ?? null;
  const days = assignment?.version?.days ?? [];
  const day = days.find((item) => String(item.id) === dayId) ?? null;
  const exercises = day?.exercises ?? [];
  const canStart = Boolean(assignment?.status === "active" && day && exercises.length > 0);

  useEffect(() => {
    setDayId(String(preferredDay(days)?.id ?? ""));
  }, [assignment?.id]);

  const trainingDayCount = days.filter((item) => (item.exercises ?? []).length > 0).length;
  const name = account?.profiles?.athlete?.display_name || "ورزشکار";
  const startTo = canStart
    ? `/dashboardAthlete/start-training?assignment=${assignment.id}&day=${day.id}`
    : "/trainingpage";
  const tracks = useMemo(() => movementSeries(sessions), [sessions]);
  const movements = useMemo(
    () => progressMovements(assignments, tracks, sessions, selectedId),
    [assignments, tracks, sessions, selectedId],
  );
  const trackByExercise = useMemo(() => new Map(tracks.map((item) => [item.id, item])), [tracks]);
  const trainRows = exercises.map((item) => {
    const exercise = item.exercise;
    const bank = Boolean(exercise?.from_bank && exercise?.id);
    const track = trackByExercise.get(Number(exercise?.id));
    const points = track?.points ?? [];
    const latest = points.at(-1)?.value;
    const earlier = points.length > 1 ? points.at(-2)?.value : null;
    return {
      id: item.id,
      name: exercise?.name || "حرکت",
      sets: item.prescribed_sets ?? "—",
      reps: item.reps_min ?? item.reps_max ?? "—",
      rest: item.rest_seconds ?? "—",
      image: coverImage(exercise) || exerciseImage,
      to: bank ? `/trainingpage/exercises/${exercise.id}` : startTo,
      previous: earlier == null ? "—" : formatMeasure(earlier, track.unit),
      current: latest == null ? "—" : formatMeasure(latest, track.unit),
      progress: earlier == null ? "—" : signedPercent(percentChange(earlier, latest)),
    };
  });
  const weekDays = SHORT_DAYS.map((label, weekday) => {
    const item = days.find((dayItem) => dayItem.weekday === weekday);
    if (!item) return { day: label, type: "استراحت" };
    return {
      id: item.id,
      day: label,
      type: (item.exercises ?? []).length ? "تمرین" : "استراحت",
    };
  });
  const notes = useMemo(() => {
    const fromCoach = days.flatMap((item) => (
      (item.exercises ?? [])
        .filter((exercise) => exercise.coach_note)
        .map((exercise) => ({
          id: `coach-${exercise.id}`,
          date: dayLabel(item),
          title: exercise.exercise?.name || dayLabel(item),
          text: exercise.coach_note,
        }))
    ));
    const fromSessions = [...sessions]
      .filter((session) => session.athlete_note)
      .sort((left, right) => String(right.performed_on).localeCompare(String(left.performed_on)) || right.id - left.id)
      .map((session) => {
        const sessionDay = findDay(assignments, session.workout_day_id);
        return {
          id: `session-${session.id}`,
          date: showDate(session.performed_on),
          title: sessionDay ? dayLabel(sessionDay) : "تمرین",
          text: session.athlete_note,
        };
      });
    return [...fromSessions, ...fromCoach];
  }, [assignments, days, sessions]);
  const history = useMemo(() => [...sessions]
    .sort((left, right) => String(right.performed_on).localeCompare(String(left.performed_on)) || right.id - left.id)
    .map((row) => {
    const sessionDay = findDay(assignments, row.workout_day_id);
    const groups = new Map();
    (row.sets ?? []).forEach((set) => {
      const id = set.exercise_id || set.exercise?.id || set.id;
      const current = groups.get(id) ?? {
        id,
        name: set.exercise?.name || "حرکت",
        sets: 0,
        reps: set.reps ?? "—",
        weightGrams: 0,
        repsMax: 0,
      };
      current.sets += 1;
      if (Number(set.weight_g) > current.weightGrams) {
        current.weightGrams = Number(set.weight_g);
        current.reps = set.reps ?? current.reps;
      }
      if (Number(set.reps) > current.repsMax) current.repsMax = Number(set.reps);
      groups.set(id, current);
    });
    return {
      id: row.id,
      date: showDate(row.performed_on),
      day: sessionDay ? dayLabel(sessionDay) : "تمرین",
      exercises: groups.size,
      sets: row.sets?.length ?? 0,
      duration: durationLabel(row.started_at, row.completed_at),
      details: [...groups.values()].map((item) => ({
        id: item.id,
        name: item.name,
        sets: item.sets,
        reps: item.reps,
        weight: item.weightGrams ? `${item.weightGrams / 1000} کیلو` : item.repsMax ? `${item.repsMax} تکرار` : "—",
      })),
    };
  }), [assignments, sessions]);
  const recordRows = useMemo(() => {
    const sorted = [...records].sort((left, right) => String(left.recorded_at).localeCompare(String(right.recorded_at)) || left.id - right.id);
    const previous = new Map();
    const rows = sorted.map((row) => {
      const key = `${row.exercise_name}|${row.metric}`;
      const prior = previous.get(key);
      previous.set(key, row);
      const recordedAt = row.recorded_at ? new Date(row.recorded_at).getTime() : 0;
      return {
        id: row.id,
        key,
        exercise: row.exercise_name || "حرکت",
        value: row.display || "—",
        date: showDate(row.recorded_at),
        previous: prior?.display || "—",
        recordedAt,
      };
    });
    const newest = new Map();
    rows.forEach((row) => newest.set(row.key, row.id));
    const recent = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return rows
      .map((row) => ({ ...row, isNew: newest.get(row.key) === row.id && row.recordedAt >= recent }))
      .reverse();
  }, [records]);
  const progressItems = tracks
    .filter((item) => item.points.length > 0)
    .sort((left, right) => right.points.length - left.points.length)
    .slice(0, 4)
    .map((item) => {
      const first = item.points[0].value;
      const last = item.points.at(-1).value;
      return {
        metric: item.name,
        change: `${formatMeasure(first, item.unit)} → ${formatMeasure(last, item.unit)}`,
        series: item.points.map((point) => ({ value: point.value })),
        percent: item.points.length > 1 ? percentChange(first, last) : null,
      };
    });
  const folded = fold(search);
  const visibleRows = folded
    ? trainRows.filter((row) => hit(folded, [row.name]) || hit(folded, [day ? dayLabel(day) : ""]))
    : trainRows;
  const visibleHistory = folded
    ? history.filter((row) => hit(folded, [row.day, row.date, ...(row.details ?? []).map((detail) => detail.name)]))
    : history;
  const visibleRecords = folded
    ? recordRows.filter((row) => hit(folded, [row.exercise, row.value, row.previous]))
    : recordRows;
  const visibleNotes = folded
    ? notes.filter((row) => hit(folded, [row.title, row.text, row.date]))
    : notes;
  const visibleProgress = folded
    ? progressItems.filter((row) => hit(folded, [row.metric, row.change]))
    : progressItems;
  const searchResults = useMemo(() => {
    if (!folded) return [];
    const rows = [];
    days.forEach((item) => {
      (item.exercises ?? []).forEach((exercise) => {
        const name = exercise?.exercise?.name || "";
        if (!hit(folded, [name, dayLabel(item)])) return;
        rows.push({
          id: `move-${exercise.id}`,
          kind: "حرکت",
          title: name || "حرکت",
          detail: dayLabel(item),
          dayId: String(item.id),
        });
      });
    });
    history.forEach((row) => {
      (row.details ?? []).forEach((detail) => {
        if (!hit(folded, [detail.name, row.day, row.date])) return;
        rows.push({
          id: `hist-${row.id}-${detail.id}`,
          kind: "تاریخچه",
          title: detail.name || "حرکت",
          detail: [row.date, row.day].filter(Boolean).join(" · "),
          target: "training-history",
        });
      });
    });
    recordRows.forEach((row) => {
      if (!hit(folded, [row.exercise, row.value])) return;
      rows.push({
        id: `rec-${row.id}`,
        kind: "رکورد",
        title: row.exercise,
        detail: row.value,
        target: "training-records",
      });
    });
    notes.forEach((row) => {
      if (!hit(folded, [row.title, row.text, row.date])) return;
      rows.push({
        id: `note-${row.id}`,
        kind: "یادداشت",
        title: row.title || "یادداشت",
        detail: row.date,
        target: "training-notes",
      });
    });
    const seen = new Set();
    return rows.filter((row) => {
      const key = `${row.kind}|${row.title}|${row.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }, [folded, days, history, recordRows, notes]);
  const pickSearch = (result) => {
    if (!result) return;
    if (result.dayId) setDayId(String(result.dayId));
    setSearch(result.title || "");
    if (result.target) {
      window.requestAnimationFrame(() => {
        document.getElementById(result.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };
  const analysis = useMemo(() => {
    const suggestion = restSuggestion(exercises);
    if (progressItems.length === 0) {
      return {
        description: "هنوز جلسه‌ای ثبت نشده تا پیشرفتت سنجیده شود.",
        stats: [
          { label: "نقطه قوت:", value: "ثبت نشده" },
          { label: "نیاز به توجه:", value: "ثبت نشده" },
          { label: "پیشنهاد:", value: suggestion },
        ],
      };
    }
    const ranked = [...progressItems].sort((left, right) => (right.percent ?? -999) - (left.percent ?? -999));
    const best = ranked[0];
    const weak = ranked.at(-1);
    const same = best.metric === weak.metric;
    return {
      description: best.percent > 0
        ? `در حرکت ${best.metric} از شروع ثبت‌ها ${best.percent}٪ جلو رفته‌ای. ${same ? "برای بقیه حرکت‌ها هنوز سابقه کافی نیست." : `حرکت ${weak.metric} رشد کمتری داشته است.`}`
        : `جلسه‌های ${best.metric} ثبت شده‌اند و هنوز رشد مشخصی در عددها دیده نمی‌شود.`,
      stats: [
        { label: "نقطه قوت:", value: best.percent == null ? best.change : `${best.metric} ${signedPercent(best.percent)}` },
        { label: "نیاز به توجه:", value: same || weak.percent == null ? "ثبت جلسه بعدی" : `${weak.metric} ${signedPercent(weak.percent)}` },
        { label: "پیشنهاد:", value: suggestion },
      ],
    };
  }, [exercises, progressItems]);
  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-1 lg:py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard
              title="تمرین های من"
              description={`سلام ${name}، امروز آماده‌ای؟`}
              searchValue={search}
              onSearchChange={setSearch}
              searchResults={searchResults}
              onSearchPick={pickSearch}
              searchHint={ready ? "" : "در حال خواندن تمرین‌ها..."}
            />
            {error ? <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-sm text-red-700">{error}</p> : null}
            <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
              <StatCard title="وزن" value={weight?.value ?? "—"} img={Walk} />
              <StatCard title="جلسه ثبت‌شده" value={String(sessions.length)} img={Walk} />
              <StatCard title="حرکت امروز" value={String(exercises.length)} img={Walk} />
              <StatCard title="روز تمرین" value={String(trainingDayCount)} img={Walk} />
            </div>
            <div className="col-span-12 lg:col-span-7">
              <div className="mb-4 lg:mb-5">
                <Mytrain
                  exercises={visibleRows}
                  emptyLabel={folded ? "حرکتی با این نام پیدا نشد." : "برای امروز حرکتی ثبت نشده."}
                  dayTitle={day ? dayLabel(day) : "امروز"}
                  startTo={startTo}
                  startTraining={canStart}
                  showRecord
                  hrTrue
                  showDetail
                  assignments={assignments}
                  sessions={sessions}
                  selectedId={selectedId}
                  loadError={error || sessionError}
                  ready={ready}
                />
              </div>
              <div className="mb-4 lg:mb-5">
                <BodyProgressCard
                  items={visibleProgress}
                  title="پیشرفت حرکات هفته"
                  movements={movements}
                  loadError={sessionError}
                  ready={ready}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-7 lg:gap-3">
                <div className="min-w-0 lg:col-span-3 lg:mb-5">
                  <div id="training-history">
                    <WorkoutHistory items={visibleHistory} emptyLabel={folded ? "در تاریخچه چیزی پیدا نشد." : "هنوز تمرینی ثبت نشده."} />
                  </div>
                </div>
                <div className="min-w-0 lg:col-span-4 lg:mb-5">
                  <div id="training-records">
                    <PersonalRecordsCard records={visibleRecords} emptyLabel={folded ? "رکوردی با این نام پیدا نشد." : "رکوردی ثبت نشده."} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <div className="mb-4 lg:mb-5">
                <SmartAnalysisCard description={analysis.description} stats={analysis.stats} reportTo="/AnalysisPage" />
              </div>
              <div className="mb-4 lg:mb-5">
                <WorkoutProgramCard
                  days={weekDays}
                  legend={["تمرین", "استراحت"]}
                  coachName={coachName || "مربی"}
                  coachInitial={initials(coachName || "مربی")}
                  selectedId={day?.id}
                  onSelect={(id) => setDayId(String(id))}
                  programs={programs.map((row) => ({ id: row.id, title: programTitle(row) }))}
                  selectedProgramId={selectedId}
                  onProgram={(id) => setSelectedId(String(id))}
                />
              </div>
              <div id="training-notes">
                <WorkoutNotes notes={visibleNotes} emptyLabel={folded ? "یادداشتی با این عبارت پیدا نشد." : "یادداشتی از مربی برای این برنامه نیست."} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
