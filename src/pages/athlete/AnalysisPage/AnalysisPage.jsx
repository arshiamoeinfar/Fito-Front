import { useEffect, useRef, useState } from "react";
import "react-circular-progressbar/dist/styles.css";
import Navbar from "../../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import AIAnalysisCard from "../../../Components/DashBoardAuth/AIAnalysisCard/AIAnalysisCard";
import BodyAnalysisModel from "../../../Components/DashBoardAuth/AnalysComponents/BodyAnalysisModel/BodyAnalysisModel";
import EvaluationHistory from "../../../Components/DashBoardAuth/AnalysComponents/EvaluationHistory/EvaluationHistory";
import Chart from "../../../Components/shared/Chart/Chart";
import BodyChangeChart from "../../../Components/shared/BodyChangeChart/BodyChangeChart";
import NutritionReport from "../../../Components/shared/NutritionReport/NutritionReport";
import StatCard from "../../../Components/shared/StatCard/StatCard";
import AppearanceChanges from "../../../Components/shared/AppearanceChanges/AppearanceChanges";
import CircularProgressbarChart from "../../../Components/shared/CircularProgressbar/CircularProgressbar";
import { api, ApiError, toApiError } from "../../../api/client";
import { useSession } from "../../../api/session";
import JalaliField from "../../../Components/shared/JalaliField/JalaliField";
import { isoDate, jalaliParts, monthDays, nowDateTimeValue } from "../../../lib/jalali";
import AthleteReport from "../../coach/AthleteReport";
import BodyPhotoSets from "../../../Components/shared/BodyPhotoSets/BodyPhotoSets";
import DocumentAdd from "../../../assets/Icons/Document Add.svg";
import imgWalk from "../../../assets/imges/walk.png";
import imgWater from "../../../assets/imges/water.png";
import imgFront from "../../../assets/imges/image 24 (1).png";
import imgBack from "../../../assets/imges/backMan.png";
import imgTrain from "../../../assets/imges/train (1).png";
import imgLunch from "../../../assets/imges/lunch.png";

const MAIN_FIELDS = [
  ["weight_kg", "وزن (کیلوگرم)"],
  ["height_cm", "قد (سانتی‌متر)"],
  ["waist_cm", "دور کمر (سانتی‌متر)"],
];

const EXTRA_FIELDS = [
  ["chest_cm", "دور سینه (سانتی‌متر)"],
  ["hip_cm", "دور باسن (سانتی‌متر)"],
  ["neck_cm", "دور گردن (سانتی‌متر)"],
  ["left_arm_cm", "دور بازوی چپ (سانتی‌متر)"],
  ["right_arm_cm", "دور بازوی راست (سانتی‌متر)"],
  ["left_thigh_cm", "دور ران چپ (سانتی‌متر)"],
  ["right_thigh_cm", "دور ران راست (سانتی‌متر)"],
  ["body_fat_percent", "چربی بدن (درصد)"],
];

const BODY_FIELDS = [...MAIN_FIELDS, ...EXTRA_FIELDS];

const METRIC_LABELS = {
  weight_kg: "وزن",
  height_cm: "قد",
  waist_cm: "دور کمر",
  chest_cm: "دور سینه",
  neck_cm: "دور گردن",
  hip_cm: "دور باسن",
  left_arm_cm: "دور بازوی چپ",
  right_arm_cm: "دور بازوی راست",
  left_thigh_cm: "دور ران چپ",
  right_thigh_cm: "دور ران راست",
  muscle_mass_kg: "توده عضله",
  body_fat_percent: "چربی بدن",
  body_water_percent: "آب بدن",
  bmi: "شاخص توده بدنی",
  bmi_calculated: "شاخص توده بدنی",
};

const METRIC_UNITS = {
  weight_kg: "کیلوگرم",
  height_cm: "سانتی‌متر",
  waist_cm: "سانتی‌متر",
  chest_cm: "سانتی‌متر",
  neck_cm: "سانتی‌متر",
  hip_cm: "سانتی‌متر",
  left_arm_cm: "سانتی‌متر",
  right_arm_cm: "سانتی‌متر",
  left_thigh_cm: "سانتی‌متر",
  right_thigh_cm: "سانتی‌متر",
  muscle_mass_kg: "کیلوگرم",
  body_fat_percent: "درصد",
  body_water_percent: "درصد",
};

const PANELS = [
  ["sizes", "اندازه‌ها"],
  ["photos", "عکس‌ها"],
  ["records", "رکوردها"],
  ["compare", "مقایسه"],
  ["report", "گزارش کلی"],
];

function shown(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return number.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function when(value) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 16);
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function metricEntries(metrics) {
  return Object.entries(metrics ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== "");
}

function observationChoice(item) {
  const weight = item.metrics?.weight_kg;
  const date = when(item.measured_at);
  if (weight === null || weight === undefined || weight === "") return date;
  return `${date}، وزن ${shown(weight)} کیلوگرم`;
}

function withUnit(value, key) {
  if (value === null || value === undefined || value === "") return "—";
  const unit = METRIC_UNITS[key];
  return `${shown(value)}${unit ? ` ${unit}` : ""}`;
}

function changeText(delta, key) {
  if (delta === null || delta === undefined || delta === "") return "در یکی از دو ثبت نیست";
  const number = Number(delta);
  if (Number.isNaN(number) || number === 0) return "بدون تغییر";
  const unit = METRIC_UNITS[key] || "";
  return `${shown(Math.abs(number))}${unit ? ` ${unit}` : ""} ${number > 0 ? "بیشتر" : "کمتر"}`;
}

function sourceLabel(source) {
  if (source === "coach") return "ثبت مربی";
  if (source === "manual" || source === "device") return "ثبت ورزشکار";
  return "";
}

function emptyMetrics() {
  return Object.fromEntries(BODY_FIELDS.map(([key]) => [key, ""]));
}

const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const RANGE_DAYS = { "7 روز": 7, "1 ماه": 30, "3 ماه": 90, "1 سال": 365 };

function numberOf(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function dayLabel(value) {
  if (!value) return "ثبت نشده";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "ثبت نشده";
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function shortDay(value) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(date);
}

function metricDelta(before, after, key) {
  const left = numberOf(before?.metrics?.[key]);
  const right = numberOf(after?.metrics?.[key]);
  if (left === null || right === null) return null;
  return Math.round((right - left) * 10) / 10;
}

function signedChange(delta, unit) {
  if (delta === null) {
    return { value: "ثبت نشده", arrow: "•", tone: "text-[#A0A4AA]" };
  }
  if (Math.abs(delta) < 0.05) {
    return { value: "بدون تغییر", arrow: "•", tone: "text-[#6B6F77]" };
  }
  const up = delta > 0;
  return {
    value: `${up ? "+" : "−"}${shown(Math.abs(delta))} ${unit}`,
    arrow: up ? "↑" : "↓",
    tone: up ? "text-[#3BCB6A]" : "text-[#E5484D]",
  };
}

function bodyScore(item, previous) {
  if (!item) return 0;
  let score = 35;
  ["weight_kg", "body_fat_percent", "muscle_mass_kg", "body_water_percent", "waist_cm"].forEach((key) => {
    if (numberOf(item.metrics?.[key]) !== null) score += 8;
  });
  const fat = metricDelta(previous, item, "body_fat_percent");
  const muscle = metricDelta(previous, item, "muscle_mass_kg");
  if (fat !== null && fat < 0) score += 10;
  if (muscle !== null && muscle > 0) score += 10;
  if (fat !== null && fat > 1) score -= 8;
  return Math.max(0, Math.min(100, score));
}

function basalKcal(weight, fat) {
  if (weight === null || fat === null || fat < 0 || fat >= 80) return null;
  return Math.round(370 + 21.6 * weight * (1 - fat / 100));
}

function movementText(delta, name, unit) {
  if (delta === null) return "";
  if (Math.abs(delta) < 0.05) return `${name} ثابت مانده است`;
  return `${name} ${shown(Math.abs(delta))} ${unit} ${delta > 0 ? "بیشتر" : "کمتر"} شده است`;
}

export default function AnalysisPage() {
  const { account } = useSession();
  const name = account?.profiles?.athlete?.display_name || "ورزشکار";
  const [observations, setObservations] = useState([]);
  const [hydration, setHydration] = useState([]);
  const [relationshipId, setRelationshipId] = useState("");
  const [panel, setPanel] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chartRange, setChartRange] = useState("1 ماه");
  const [measuredAt, setMeasuredAt] = useState(nowDateTimeValue);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [share, setShare] = useState(false);
  const shareTouched = useRef(false);
  const [records, setRecords] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [recordsKey, setRecordsKey] = useState(0);
  const [recordForm, setRecordForm] = useState({ exercise_id: "", metric: "max_weight_g", value: "" });
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [compare, setCompare] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [sets, setSets] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [photoClosed, setPhotoClosed] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [sessions, setSessions] = useState([]);
  const previewUrls = useRef([]);

  useEffect(() => {
    api("/api/v1/athlete/body-observations").then(
      (body) => setObservations(body.observations ?? []),
      (caught) => setError(caught.message),
    );
    api("/api/v1/athlete/relationships").then(
      (body) => {
        const active = (body.relationships ?? []).find((row) => row.status === "active");
        setRelationshipId(active ? String(active.id) : "");
        if (active && !shareTouched.current) {
          setShare(true);
        }
      },
      () => setRelationshipId(""),
    );
    api("/api/v1/athlete/body-photos").then(
      (body) => {
        setPhotos(body.photos ?? []);
        setSets(body.sets ?? []);
        setPhotoClosed("");
      },
      (caught) => {
        setPhotos([]);
        setSets([]);
        if (caught instanceof ApiError && caught.status === 403) {
          setPhotoClosed(caught.message);
          return;
        }
        setError(caught.message);
      },
    );
    api("/api/v1/athlete/workout-assignments").then(
      (body) => setWorkouts(body.assignments ?? []),
      () => setWorkouts([]),
    );
    api("/api/v1/athlete/meal-assignments").then(
      (body) => setMeals(body.assignments ?? []),
      () => setMeals([]),
    );
    api("/api/v1/athlete/hydration?span=30").then(
      (body) => setHydration(body.entries ?? []),
      () => setHydration([]),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const created = [];
    Promise.all(photos.map(async (photo) => {
      const response = await fetch(`/api/v1/athlete/body-photos/${photo.id}/file`, { credentials: "include" });
      if (!response.ok) return null;
      const url = URL.createObjectURL(await response.blob());
      created.push(url);
      return { id: photo.id, url };
    })).then((rows) => {
      if (cancelled) {
        created.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current = created;
      setPreviews(rows.filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
  }, [photos]);

  useEffect(() => {
    if (!relationshipId) {
      return undefined;
    }
    let active = true;
    api(`/api/v1/athlete/records?coaching_relationship_id=${relationshipId}`).then(
      (body) => {
        if (!active) return;
        setRecords(body.records ?? []);
        setExercises(body.exercises ?? []);
      },
      (caught) => {
        if (active) setError(caught.message);
      },
    );
    return () => {
      active = false;
    };
  }, [relationshipId, recordsKey]);

  useEffect(() => {
    if (!beforeId || !afterId || beforeId === afterId) {
      setCompare(null);
      return undefined;
    }
    api(`/api/v1/athlete/body-observations/compare?before_id=${beforeId}&after_id=${afterId}`).then(
      (body) => setCompare(body),
      (caught) => setError(caught.message),
    );
    return undefined;
  }, [beforeId, afterId]);

  useEffect(() => {
    if (panel !== "report") {
      return undefined;
    }
    let active = true;
    api("/api/v1/athlete/workout-sessions").then(
      (body) => {
        if (active) setSessions(body.sessions ?? []);
      },
      () => {
        if (active) setSessions([]);
      },
    );
    return () => {
      active = false;
    };
  }, [panel]);

  function latestOf(key) {
    const found = observations.find((item) => {
      const value = item.metrics?.[key];
      return value !== null && value !== undefined && value !== "";
    });
    return found?.metrics?.[key];
  }

  async function saveObservation(event) {
    event.preventDefault();
    const payloadMetrics = {};
    BODY_FIELDS.forEach(([key]) => {
      if (metrics[key] !== "") payloadMetrics[key] = metrics[key];
    });
    const measured = measuredAt.length === 16 ? `${measuredAt}:00` : measuredAt;
    const payload = { measured_at: measured, source: "manual", metrics: payloadMetrics };
    if (share && relationshipId) {
      payload.visibility = "relationship";
      payload.coaching_relationship_id = Number(relationshipId);
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      await api("/api/v1/athlete/body-observations", { method: "POST", body: payload });
      const body = await api("/api/v1/athlete/body-observations");
      setObservations(body.observations ?? []);
      setMetrics(emptyMetrics());
      setNotice("مشاهده بدن ثبت شد.");
    } catch (caught) {
      setError(caught.message);
    } finally {
      setPending(false);
    }
  }

  async function uploadPhoto({ takenAt, note, items }) {
    if (!relationshipId || items.length === 0) return;
    const form = new FormData();
    const taken = takenAt.length === 16 ? `${takenAt}:00` : takenAt;
    items.forEach((item) => {
      form.append("photos[]", item.file);
      form.append("views[]", item.view);
      form.append("captions[]", item.caption);
    });
    form.append("note", note);
    form.append("taken_at", taken);
    form.append("coaching_relationship_id", relationshipId);
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/athlete/body-photos", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        body: form,
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;
      if (!response.ok) throw toApiError(response.status, payload);
      const body = await api("/api/v1/athlete/body-photos");
      setPhotos(body.photos ?? []);
      setSets(body.sets ?? []);
      setNotice("مجموعه عکس ثبت شد.");
    } catch (caught) {
      setError(caught.message);
      throw caught;
    } finally {
      setPending(false);
    }
  }

  async function saveRecord(event) {
    event.preventDefault();
    if (!relationshipId) return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      await api("/api/v1/athlete/records", {
        method: "POST",
        body: {
          coaching_relationship_id: Number(relationshipId),
          exercise_id: Number(recordForm.exercise_id),
          metric: recordForm.metric,
          value: Number(recordForm.value),
        },
      });
      setRecordForm((current) => ({ ...current, value: "" }));
      setRecordsKey((key) => key + 1);
      setNotice("رکورد ثبت شد. مربی و دستیارش آن را می‌بینند.");
    } catch (caught) {
      setError(caught.message);
    } finally {
      setPending(false);
    }
  }

  const weightNow = latestOf("weight_kg");
  const waistNow = latestOf("waist_cm");
  const previewMap = Object.fromEntries(previews.map((photo) => [photo.id, photo.url]));
  const active = Boolean(relationshipId);
  const ordered = [...observations].sort((left, right) => new Date(left.measured_at) - new Date(right.measured_at));
  const latestObs = ordered.at(-1) ?? null;
  const latestTime = latestObs ? new Date(latestObs.measured_at).getTime() : 0;
  const pair = (key) => {
    const rows = ordered.filter((item) => numberOf(item.metrics?.[key]) !== null);
    const last = rows.at(-1) ?? null;
    if (!last) return [null, null];
    const lastTime = new Date(last.measured_at).getTime();
    const earlier = [...rows].reverse().find((item) => item !== last && lastTime - new Date(item.measured_at).getTime() >= 12 * 86400000)
      ?? rows.at(-2)
      ?? null;
    return [earlier, last];
  };
  const [weightBefore, weightAfter] = pair("weight_kg");
  const [fatBefore, fatAfter] = pair("body_fat_percent");
  const [muscleBefore, muscleAfter] = pair("muscle_mass_kg");
  const [waterBefore, waterAfter] = pair("body_water_percent");
  const [heightBefore, heightAfter] = pair("height_cm");
  const weightChange = signedChange(metricDelta(weightBefore, weightAfter, "weight_kg"), "KG");
  const fatChange = signedChange(metricDelta(fatBefore, fatAfter, "body_fat_percent"), "%");
  const muscleChange = signedChange(metricDelta(muscleBefore, muscleAfter, "muscle_mass_kg"), "KG");
  const waterChange = signedChange(metricDelta(waterBefore, waterAfter, "body_water_percent"), "%");
  const heightChange = signedChange(metricDelta(heightBefore, heightAfter, "height_cm"), "cm");
  const changes = [
    ["وزن", weightChange],
    ["چربی بدن", fatChange],
    ["عضله", muscleChange],
    ["آب بدن", waterChange],
    ["قد", heightChange],
  ];
  const score = bodyScore(
    { metrics: { weight_kg: weightAfter?.metrics?.weight_kg, body_fat_percent: fatAfter?.metrics?.body_fat_percent, muscle_mass_kg: muscleAfter?.metrics?.muscle_mass_kg, body_water_percent: waterAfter?.metrics?.body_water_percent, waist_cm: pair("waist_cm")[1]?.metrics?.waist_cm } },
    { metrics: { weight_kg: weightBefore?.metrics?.weight_kg, body_fat_percent: fatBefore?.metrics?.body_fat_percent, muscle_mass_kg: muscleBefore?.metrics?.muscle_mass_kg, body_water_percent: waterBefore?.metrics?.body_water_percent } },
  );
  const analysisParts = [
    movementText(metricDelta(weightBefore, weightAfter, "weight_kg"), "وزن", "کیلوگرم"),
    movementText(metricDelta(fatBefore, fatAfter, "body_fat_percent"), "چربی", "درصد"),
    movementText(metricDelta(muscleBefore, muscleAfter, "muscle_mass_kg"), "عضله", "کیلوگرم"),
  ].filter(Boolean);
  const analysisFrom = weightBefore?.measured_at || fatBefore?.measured_at || latestObs?.measured_at;
  const analysisTo = weightAfter?.measured_at || fatAfter?.measured_at || latestObs?.measured_at;
  const analysisText = latestObs
    ? (analysisParts.length ? `از ${dayLabel(analysisFrom)} تا ${dayLabel(analysisTo)}، ${analysisParts.join("، ")}.` : "آخرین اندازه‌ها ثبت شده‌اند. با ثبت بعدی، روند تغییر اینجا دیده می‌شود.")
    : "هنوز اندازه بدنی ثبت نشده است. از دکمه ثبت و گزارش، وزن و چربی را وارد کن.";
  const rangeDays = RANGE_DAYS[chartRange] ?? 30;
  const ranged = ordered.filter((item) => latestTime - new Date(item.measured_at).getTime() <= rangeDays * 86400000);
  const chartSource = ranged.length ? ranged : ordered;
  const chartPoints = [...chartSource.reduce((days, item) => {
    const day = shortDay(item.measured_at);
    const point = {
      day,
      weight: numberOf(item.metrics?.weight_kg),
      fat: numberOf(item.metrics?.body_fat_percent),
      muscle: numberOf(item.metrics?.muscle_mass_kg),
    };
    const previous = days.get(day);
    days.set(day, previous ? {
      day,
      weight: point.weight ?? previous.weight,
      fat: point.fat ?? previous.fat,
      muscle: point.muscle ?? previous.muscle,
    } : point);
    return days;
  }, new Map()).values()];
  const spark = (key) => ordered.map((item) => numberOf(item.metrics?.[key])).filter((value) => value !== null).map((value) => ({ v: value }));
  const sparkStatus = (key, upIsGood) => {
    const rows = spark(key);
    if (rows.length < 2) return rows.length ? "یک ثبت" : "بدون ثبت";
    const delta = rows.at(-1).v - rows[0].v;
    if (Math.abs(delta) < 0.05) return "ثابت";
    const up = delta > 0;
    if (up === upIsGood) return "رو به بهبود";
    return "نیاز به توجه";
  };
  const metabolismSeries = ordered
    .map((item) => basalKcal(numberOf(item.metrics?.weight_kg), numberOf(item.metrics?.body_fat_percent)))
    .filter((value) => value !== null)
    .map((value) => ({ v: value }));
  const metabolismNow = metabolismSeries.at(-1)?.v ?? null;
  const metabolismDelta = metabolismSeries.length > 1 ? metabolismSeries.at(-1).v - metabolismSeries[0].v : null;
  const metabolismStatus = metabolismNow === null
    ? "چربی لازم است"
    : metabolismDelta === null
      ? "از وزن و چربی"
      : Math.abs(metabolismDelta) < 15
        ? "ثابت"
        : metabolismDelta > 0 ? "بیشتر شده" : "کمتر شده";
  const metricValue = (key, digits = 1) => {
    const value = numberOf(pair(key)[1]?.metrics?.[key]);
    return value === null ? "—" : value.toLocaleString("fa-IR", { maximumFractionDigits: digits });
  };
  const composed = ordered.filter((item) => ["weight_kg", "body_fat_percent", "muscle_mass_kg"].every((key) => numberOf(item.metrics?.[key]) !== null));
  const currentBody = composed.at(-1) ?? latestObs;
  const previousBody = composed.length > 1 ? composed.at(-2) : currentBody;
  const frontPhoto = [...photos].reverse().find((photo) => photo.view === "front");
  const backPhoto = [...photos].reverse().find((photo) => photo.view === "back");
  const today = new Date();
  const todayParts = jalaliParts(today);
  const monthDates = monthDays(todayParts.year, todayParts.month);
  const monthName = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(monthDates[0] || today);
  const lead = monthDates[0] ? (monthDates[0].getDay() + 1) % 7 : 0;
  const waterByDay = Object.fromEntries(hydration.map((entry) => [entry.logged_on, Number(entry.amount_ml) || 0]));
  const mealDays = meals.flatMap((assignment) => assignment.version?.days ?? []);
  const blanks = Array.from({ length: lead }, () => ({ blank: true, dots: [] }));
  const waterDays = [...blanks];
  const nutritionDays = [...blanks];
  const waterReports = {};
  const nutritionReports = {};
  monthDates.forEach((date) => {
    const day = jalaliParts(date).day;
    const key = isoDate(date);
    const amount = waterByDay[key] ?? 0;
    const glasses = amount > 0 ? Math.min(3, Math.max(1, Math.round(amount / 1000))) : 0;
    waterDays.push({ day, dots: Array.from({ length: glasses }, () => "blue") });
    if (amount > 0) {
      const percent = Math.round((amount / 4000) * 100);
      waterReports[String(day)] = {
        title: `آب ${dayLabel(date)}`,
        amount: `${(amount / 1000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} لیتر`,
        goal: "۴ لیتر",
        percentage: `${percent.toLocaleString("fa-IR")}٪`,
        description: amount >= 4000 ? "هدف چهار لیتر این روز کامل شده است." : `تا هدف چهار لیتر، ${((4000 - amount) / 1000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} لیتر مانده است.`,
      };
    }
    const plan = mealDays.find((item) => item.title === WEEKDAYS[date.getDay()]);
    const kcal = numberOf(plan?.totals?.energy_kcal);
    nutritionDays.push({ day, dots: kcal ? ["green", "blue", "yellow"] : [] });
    if (plan && kcal) {
      const protein = (Number(plan.totals?.protein_mg) || 0) / 1000;
      const carbs = (Number(plan.totals?.carbohydrate_mg) || 0) / 1000;
      const fat = (Number(plan.totals?.fat_mg) || 0) / 1000;
      nutritionReports[String(day)] = {
        title: plan.title || "برنامه تغذیه",
        calories: `${Math.round(kcal).toLocaleString("fa-IR")} کیلوکالری`,
        protein: `${protein.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} گرم`,
        carbs: `${carbs.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} گرم`,
        fat: `${fat.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} گرم`,
        description: "این عددها از برنامه غذایی همان روز هفته است، نه از مصرف ثبت‌شده.",
      };
    }
  });
  const assessments = [...ordered].reverse().slice(0, 8).map((item, index, list) => {
    const previous = list[index + 1] ?? null;
    return {
      date: dayLabel(item.measured_at),
      score: bodyScore(item, previous),
      weight: withUnit(item.metrics?.weight_kg, "weight_kg"),
      bodyFat: withUnit(item.metrics?.body_fat_percent, "body_fat_percent"),
      muscle: withUnit(item.metrics?.muscle_mass_kg, "muscle_mass_kg"),
      water: withUnit(item.metrics?.body_water_percent, "body_water_percent"),
    };
  });
  const fresh = latestObs && Date.now() - latestTime < 7 * 86400000;

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard
              title="تغییر نسبت به قبل"
              description="آخرین بروزرسانی"
              date={dayLabel(latestObs?.measured_at)}
              newStatus={fresh ? "جدید" : ""}
              btnTrue
              imgBtn={DocumentAdd}
              actionLabel={toolsOpen ? "بستن ثبت‌ها" : "ثبت و گزارش"}
              onAction={() => setToolsOpen((open) => !open)}
            />
            <div className="col-span-12 lg:col-span-6">
              <AIAnalysisCard text={analysisText} />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="flex h-full flex-col rounded-4xl bg-white p-6">
                <h2 className="mb-5 text-start text-2xl text-[#6B6F77]">تغییر نسبت به قبل</h2>
                <div className="flex flex-1 flex-col justify-between">
                  {changes.map(([title, item], index) => (
                    <div key={title}>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-[#6B6F77]">{title}</span>
                        <div className={`flex items-center gap-2 ${item.tone}`}>
                          <span className="text-2xl leading-none">{item.arrow}</span>
                          <span className="text-sm">{item.value}</span>
                        </div>
                      </div>
                      {index !== changes.length - 1 ? <div className="mt-2 h-px bg-[#EEF2F6]" /> : null}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-center text-sm text-[#A0A4AA]">
                  {weightBefore || fatBefore ? "در مقایسه با ثبت قبلیِ همین بازه" : "برای مقایسه، ثبت قبلی لازم است"}
                </p>
              </div>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <CircularProgressbarChart value={score} title="نمره کلی بدن" />
            </div>
            <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Chart label="متابولیسم پایه" value={metabolismNow === null ? "—" : metabolismNow.toLocaleString("fa-IR")} unit="kcal" status={metabolismStatus} series={metabolismSeries} />
              <Chart label="وزن" value={metricValue("weight_kg")} unit="kg" status={sparkStatus("weight_kg", false)} series={spark("weight_kg")} />
              <Chart label="چربی بدن" value={metricValue("body_fat_percent")} unit="%" status={sparkStatus("body_fat_percent", false)} series={spark("body_fat_percent")} />
              <Chart label="عضله" value={metricValue("muscle_mass_kg")} unit="kg" status={sparkStatus("muscle_mass_kg", true)} series={spark("muscle_mass_kg")} />
              <Chart label="آب بدن" value={metricValue("body_water_percent")} unit="%" status={sparkStatus("body_water_percent", true)} series={spark("body_water_percent")} />
            </div>
            <div className="col-span-12 lg:col-span-4 lg:row-span-2">
              <BodyAnalysisModel
                frontImage={frontPhoto ? previewMap[frontPhoto.id] || imgFront : imgFront}
                backImage={backPhoto ? previewMap[backPhoto.id] || imgBack : imgBack}
                title="مدل تعاملی بدن"
              />
            </div>
            <div className="col-span-12 min-w-0 lg:col-span-8">
              <BodyChangeChart points={chartPoints} onRange={setChartRange} />
            </div>
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <NutritionReport type="water" title="مصرف آب روزانه" date={monthName} data={waterDays} reports={waterReports} />
            </div>
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <NutritionReport title="گزارش تغذیه" date={monthName} data={nutritionDays} reports={nutritionReports} />
            </div>
            <div className="col-span-12 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <StatCard title="وزن" value={metricValue("weight_kg")} img={imgWalk} />
              <StatCard title="چربی" value={metricValue("body_fat_percent", 1)} img={imgLunch} />
              <StatCard title="عضله" value={metricValue("muscle_mass_kg")} img={imgTrain} />
              <StatCard title="آب بدن" value={metricValue("body_water_percent")} img={imgWater} />
              <StatCard title="دور کمر" value={metricValue("waist_cm", 0)} img={imgWalk} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              {latestObs ? (
                <AppearanceChanges
                  stats={{
                    currentWeight: numberOf(currentBody?.metrics?.weight_kg) ?? 0,
                    previousWeight: numberOf(previousBody?.metrics?.weight_kg) ?? 0,
                    currentFat: numberOf(currentBody?.metrics?.body_fat_percent) ?? 0,
                    previousFat: numberOf(previousBody?.metrics?.body_fat_percent) ?? 0,
                    currentMuscle: numberOf(currentBody?.metrics?.muscle_mass_kg) ?? 0,
                    previousMuscle: numberOf(previousBody?.metrics?.muscle_mass_kg) ?? 0,
                    muscleUnit: " kg",
                    lastUpdate: dayLabel(currentBody?.measured_at),
                    imagePreview: frontPhoto ? previewMap[frontPhoto.id] : null,
                    targetWeight: null,
                  }}
                />
              ) : (
                <div className="rounded-3xl bg-white p-6 text-sm text-[#A0A4AA]">هنوز اندازه‌ای برای نمایش تغییرات بدن نیست.</div>
              )}
            </div>
            <div className="col-span-12 lg:col-span-6">
              <EvaluationHistory assessments={assessments} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
