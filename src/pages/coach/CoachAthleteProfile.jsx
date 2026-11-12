import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import AddCircle from "../../assets/Icons/Add Circle.svg";
import imgBreakfast from "../../assets/imges/break.png";
import imgLunch from "../../assets/imges/lunch.png";
import imgDinner from "../../assets/imges/dinner.png";
import imgFood from "../../assets/imges/image 17.png";
import Chart from "../../Components/shared/Chart/Chart";
import ProgressNavbar from "../../Components/CoachDashboard/ProgressNavbar";
import ChartDashboardCoach from "../../Components/shared/ChartDashboardCoach";
import BodyChangeChart from "../../Components/shared/BodyChangeChart/BodyChangeChart";
import SleepEnergyCard from "../../Components/CoachDashboard/SleepEnergyCard";
import MedicalTestsCard from "../../Components/CoachDashboard/MedicalTestsCard";
import WorkoutProgram from "./WorkoutProgram";
import CircularProgressbarChart from "../../Components/shared/CircularProgressbar/CircularProgressbar";
import BodyChanges from "../../Components/shared/AppearanceChanges/AppearanceChanges";
import NutritionReport from "../../Components/shared/NutritionReport/NutritionReport";
import { api, ApiError, toApiError } from "../../api/client";
import JalaliField from "../../Components/shared/JalaliField/JalaliField";
import { faDigits, isoDate, jalaliParts, monthDays, showDate, todayDateValue } from "../../lib/jalali";
import AthleteReport from "./AthleteReport";
import BodyPhotoSets from "../../Components/shared/BodyPhotoSets/BodyPhotoSets";
import HealthInfoCard from "../../Components/CoachDashboard/HealthInfoCard.jsx.jsx";
import NotesCard from "../../Components/CoachDashboard/NotesCard";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function statusLabel(status) {
  if (status === "active") return "فعال";
  if (status === "ended") return "پایان‌یافته";
  return status || "—";
}

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

const VIEW_LABELS = {
  front: "جلو",
  back: "پشت",
  left: "بغل چپ",
  right: "بغل راست",
  other: "سایر",
};

function FileGlyph() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[#007BFF]">
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h8" />
      </svg>
    </span>
  );
}

function FilesCard({ title, files, empty }) {
  return (
    <div dir="rtl" className="rounded-2xl bg-white p-5">
      <h3 className="mb-5 text-[16px] text-[#6B6F77]">{title}</h3>
      {files.length === 0 ? <p className="text-sm text-[#A0A4AA]">{empty}</p> : (
        <div className="space-y-3">
          {files.map((file) => {
            const row = (
              <>
                <span className="flex-1 text-sm text-[#6B6F77]">{file.name}</span>
                <FileGlyph />
              </>
            );
            const className = "flex items-center gap-3 rounded-2xl bg-[#F5F7FB] px-3 py-3";
            return file.to ? (
              <Link key={file.id} to={file.to} className={className}>{row}</Link>
            ) : (
              <div key={file.id} className={className}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function dateKey(date) {
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function waterLabel(ml) {
  const liters = Number(ml) / 1000;
  if (!Number.isFinite(liters)) return "ثبت نشده";
  const rounded = Math.round(liters * 10) / 10;
  return `${rounded.toLocaleString("fa-IR")} لیتر`;
}

function todayKey() {
  const date = new Date();
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

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

function withUnit(value, key) {
  if (value === null || value === undefined || value === "") return "—";
  const unit = METRIC_UNITS[key];
  return `${shown(value)}${unit ? ` ${unit}` : ""}`;
}

function sourceLabel(source) {
  if (source === "coach") return "ثبت مربی";
  if (source === "manual" || source === "device") return "ثبت ورزشکار";
  return "";
}

function nowLocal() {
  const date = new Date();
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const NUTRITION_MEAL_LABELS = {
  breakfast: "صبحانه",
  lunch: "نهار",
  dinner: "شام",
  snack: "میان‌وعده",
  other: "سایر",
};

const NUTRITION_WEEK_NAMES = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"];

const NUTRITION_COLUMNS = [
  { key: "breakfast", label: "صبحانه" },
  { key: "lunch", label: "نهار" },
  { key: "snack", label: "میان وعده" },
  { key: "dinner", label: "شام" },
];

const MEAL_ART = {
  breakfast: { src: imgBreakfast, tone: "bg-[#E9F9EF]" },
  lunch: { src: imgLunch, tone: "bg-[#FFF4DE]" },
  snack: { src: imgFood, tone: "bg-[#FFDBF6]" },
  dinner: { src: imgDinner, tone: "bg-[#E7E4FF]" },
  other: { src: imgFood, tone: "bg-[#F5F7FB]" },
};

const MISSING = "ثبت نشده";

function nutritionTodayName() {
  return ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"][new Date().getDay()];
}

function nutritionNumber(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return MISSING;
  return number.toLocaleString("fa-IR", { maximumFractionDigits: digits });
}

function storedAmount(totals, key, scale = 1) {
  if (!totals || totals[key] == null || totals[key] === "") return null;
  const number = Number(totals[key]);
  if (!Number.isFinite(number)) return null;
  return number / scale;
}

function nutritionFoodLine(item) {
  if (!item || typeof item !== "object") return "";
  const name = item.food?.name || "غذا";
  const detail = String(item.detail || "").trim();

  if (detail) {
    return detail.includes(name) ? detail : `${detail} ${name}`;
  }

  if (item.quantity_g != null) return `${nutritionNumber(item.quantity_g)} گرم ${name}`;
  if (item.quantity_unit_milli != null) return `${nutritionNumber(item.quantity_unit_milli / 1000, 1)} واحد ${name}`;
  return name;
}

function nutritionMealText(meal) {
  return (meal?.items ?? []).map(nutritionFoodLine).filter(Boolean).join("، ");
}

function nutritionMealLabel(meal) {
  const fallback = NUTRITION_MEAL_LABELS[meal.meal_type] || "وعده";
  if (meal.title && meal.title !== fallback && meal.title !== "ناهار") return meal.title;
  return fallback;
}

function nutritionWeeks(days) {
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) weeks.push(days.slice(index, index + 7));
  return weeks;
}

function nutritionCell(day, type) {
  const rows = (day.meals ?? []).filter((meal) => meal.meal_type === type || (type === "snack" && meal.meal_type === "other"));
  const text = rows.map(nutritionMealText).filter(Boolean).join("، ");
  return text || MISSING;
}

function NutritionRing({ value, label, progress, color, trail }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-white px-4 py-4">
      <div className="h-14 w-14 shrink-0">
        <CircularProgressbar
          value={progress}
          strokeWidth={10}
          styles={buildStyles({ pathColor: color, trailColor: trail, strokeLinecap: "round" })}
        />
      </div>
      <div className="min-w-0 text-right">
        <p className="text-lg font-semibold text-[#4F5965]">{value}</p>
        <p className="mt-1 text-xs text-[#6B6F77]">{label}</p>
      </div>
    </div>
  );
}

function MealThumb({ type }) {
  const art = MEAL_ART[type] || MEAL_ART.other;

  return (
    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${art.tone}`}>
      <img src={art.src} alt="" className="h-7 w-7 object-contain" />
    </span>
  );
}

function SupplementGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#007BFF]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="3" width="10" height="18" rx="5" />
      <path d="M7 12h10" />
    </svg>
  );
}

function AthleteNutritionTab({ assignment, loadError }) {
  const [weekIndex, setWeekIndex] = useState(0);
  const days = Array.isArray(assignment?.version?.days) ? assignment.version.days : [];
  const weeks = nutritionWeeks(days);
  const safeWeek = Math.min(weekIndex, Math.max(weeks.length - 1, 0));
  const week = weeks[safeWeek] ?? [];
  const todayName = nutritionTodayName();
  const today = days.find((day) => day.title === todayName) ?? days.find((day) => String(day.title || "").includes(todayName)) ?? null;
  const todayMeals = Array.isArray(today?.meals) ? today.meals : [];
  const totals = today?.totals && typeof today.totals === "object" ? today.totals : null;
  const kcal = storedAmount(totals, "energy_kcal");
  const protein = storedAmount(totals, "protein_mg", 1000);
  const carbs = storedAmount(totals, "carbohydrate_mg", 1000);
  const fat = storedAmount(totals, "fat_mg", 1000);
  const sugar = storedAmount(totals, "sugar_mg", 1000);
  const base = (kcal ?? 0) || (protein ?? 0) * 4 + (carbs ?? 0) * 4 + (fat ?? 0) * 9;
  const share = (grams, factor) => (grams == null || !base ? 0 : Math.max(12, Math.min(92, Math.round(((grams * factor) / base) * 100))));
  const weekTitle = NUTRITION_WEEK_NAMES[safeWeek] || nutritionNumber(safeWeek + 1);
  const gramText = (grams) => (grams == null ? MISSING : `${nutritionNumber(grams)}g`);

  return (
    <>
      {loadError ? <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{loadError}</p> : null}
      <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <NutritionRing value={kcal == null ? MISSING : nutritionNumber(kcal)} label="کالری دریافتی" progress={kcal ? 78 : 0} color="#22A45D" trail="rgba(34, 164, 93, 0.12)" />
        <NutritionRing value={gramText(protein)} label="پروتئین" progress={share(protein, 4)} color="#3DB7C4" trail="rgba(61, 183, 196, 0.12)" />
        <NutritionRing value={gramText(carbs)} label="کربوهیدرات" progress={share(carbs, 4)} color="#5B6CFF" trail="rgba(91, 108, 255, 0.13)" />
        <NutritionRing value={gramText(fat)} label="چربی" progress={share(fat, 9)} color="#C23EA1" trail="rgba(194, 62, 161, 0.18)" />
        <NutritionRing value={gramText(sugar)} label="قند" progress={share(sugar, 4)} color="#F0A03A" trail="rgba(240, 160, 58, 0.16)" />
      </div>
      <div className="col-span-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-5 text-right">
          <h3 className="text-base font-semibold text-[#4F5965]">مکمل‌های مصرف شده</h3>
          <div className="my-4 h-px bg-[#E8ECF1]" />
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#EAF3FF]">
              <SupplementGlyph />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#4F5965]">مکمل</p>
              <p className="mt-1 text-xs text-[#6B6F77]">{MISSING}</p>
            </div>
          </div>
        </section>
        <section className="rounded-3xl bg-white p-5 text-right">
          <h3 className="text-base font-semibold text-[#4F5965]">جزئیات وعده‌های امروز</h3>
          <div className="my-4 h-px bg-[#E8ECF1]" />
          {todayMeals.length === 0 ? <p className="text-sm text-[#6B6F77]">{MISSING}</p> : (
            <div className="flex flex-col">
              {todayMeals.map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 border-b border-[#F0F2F5] py-3 last:border-b-0">
                  <MealThumb type={meal.meal_type} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#4F5965]">{nutritionMealLabel(meal)}</p>
                    <p className="mt-1 text-xs leading-6 text-[#6B6F77]">{nutritionMealText(meal) || MISSING}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-3xl bg-white p-5 text-right">
          <h3 className="text-base font-semibold text-[#4F5965]">وضعیت مصرف امروز</h3>
          <div className="my-4 h-px bg-[#E8ECF1]" />
          {todayMeals.length === 0 ? <p className="text-sm text-[#6B6F77]">{MISSING}</p> : (
            <div className="flex flex-col">
              {todayMeals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between gap-3 border-b border-[#F0F2F5] py-3 last:border-b-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <MealThumb type={meal.meal_type} />
                    <span className="text-sm text-[#4F5965]">{nutritionMealLabel(meal)}</span>
                  </div>
                  <span className="shrink-0 text-xs text-[#6B6F77]">{MISSING}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className="col-span-12 rounded-3xl bg-white p-5 text-right">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#4F5965]">{`برنامه غذایی ماهانه (هفته ${weekTitle})`}</h3>
          {weeks.length > 0 ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-[#F5F7FB] px-2 py-1">
              {weeks.map((entry, index) => (
                <button
                  key={entry[0]?.id ?? index}
                  type="button"
                  onClick={() => setWeekIndex(index)}
                  className={`px-3 py-2 text-xs ${index === safeWeek ? "border-b-2 border-[#007BFF] font-semibold text-[#007BFF]" : "text-[#6B6F77]"}`}
                >
                  {`هفته ${NUTRITION_WEEK_NAMES[index] || nutritionNumber(index + 1)}`}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {week.length === 0 ? <p className="text-sm text-[#6B6F77]">{loadError ? "برنامه غذا خوانده نشد." : MISSING}</p> : (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[0.7fr_1.3fr_1.5fr_1.5fr_1.4fr] items-center rounded-2xl bg-[#F5F7FB] px-4 py-3 text-xs text-[#6B6F77]">
                <span>روز</span>
                {NUTRITION_COLUMNS.map((column) => <span key={column.key}>{column.label}</span>)}
              </div>
              {week.map((day) => (
                <div key={day.id} className="grid grid-cols-[0.7fr_1.3fr_1.5fr_1.5fr_1.4fr] items-start border-b border-[#F0F2F5] px-4 py-4 text-xs leading-6 text-[#6B6F77] last:border-b-0">
                  <span className="text-sm text-[#4F5965]">{day.title || "روز"}</span>
                  {NUTRITION_COLUMNS.map((column) => <span key={column.key}>{nutritionCell(day, column.key)}</span>)}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default function CoachAthleteProfile() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [row, setRow] = useState(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState(null);
  const [observations, setObservations] = useState([]);
  const [measuredAt, setMeasuredAt] = useState(nowLocal);
  const [metrics, setMetrics] = useState(() => Object.fromEntries(BODY_FIELDS.map(([key]) => [key, ""])));
  const [panel, setPanel] = useState(null);
  const requestedTab = searchParams.get("tab");
  const tab = ["overview", "body-health", "training", "nutrition", "progress", "activity", "files", "notes"].includes(requestedTab) ? requestedTab : "overview";
  function setTab(next) {
    const value = typeof next === "function" ? next(tab) : next;
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      if (!value || value === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      return params;
    }, { replace: true });
  }
  const [progressRange, setProgressRange] = useState("");
  const [pickedDayId, setPickedDayId] = useState(null);
  const [records, setRecords] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [recordsKey, setRecordsKey] = useState(0);
  const [recordForm, setRecordForm] = useState({ exercise_id: "", metric: "max_weight_g", value: "" });
  const [sets, setSets] = useState([]);
  const [notice, setNotice] = useState("");
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [photoClosed, setPhotoClosed] = useState("");
  const previewUrls = useRef([]);
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [mealError, setMealError] = useState(null);
  const [readyWorkouts, setReadyWorkouts] = useState([]);
  const [readyMeals, setReadyMeals] = useState([]);
  const [workoutVersion, setWorkoutVersion] = useState("");
  const [mealVersion, setMealVersion] = useState("");
  const [startsOn, setStartsOn] = useState(todayDateValue);
  const [sessions, setSessions] = useState([]);
  const [endsOn, setEndsOn] = useState("");
  const [plansKey, setPlansKey] = useState(0);
  const [hydration, setHydration] = useState([]);

  useEffect(() => {
    if (location.state?.programNotice) {
      setNotice(location.state.programNotice);
    }
  }, [location.state]);

  useEffect(() => {
    let active = true;

    api("/api/v1/coach/relationships").then(
      (body) => {
        if (!active) {
          return;
        }

        const rows = Array.isArray(body?.relationships) ? body.relationships : [];
        const match = rows.find((item) => String(item.id) === String(id));
        setRow(match ?? null);
        setMissing(!match);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
        }
      },
    );

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!row) {
      return;
    }

    let active = true;

    Promise.allSettled([
      api("/api/v1/coach/workout-assignments"),
      api("/api/v1/coach/meal-assignments"),
      api("/api/v1/coach/workout-programs"),
      api("/api/v1/coach/meal-plans"),
    ]).then((results) => {
      if (!active) {
        return;
      }

      const relationshipId = String(row.id);
      const [workoutBody, mealBody, programBody, planBody] = results;
      const failures = [];

      if (workoutBody.status === "fulfilled") {
        setWorkouts((workoutBody.value.assignments || []).filter((item) => String(item.coaching_relationship_id) === relationshipId));
      } else {
        failures.push(errorText(workoutBody.reason));
      }

      if (mealBody.status === "fulfilled") {
        const rows = Array.isArray(mealBody.value?.assignments) ? mealBody.value.assignments : [];
        setMeals(rows.filter((item) => String(item.coaching_relationship_id) === relationshipId));
        setMealError(null);
      } else {
        setMeals([]);
        const message = errorText(mealBody.reason);
        setMealError(message);
        failures.push(message);
      }

      if (programBody.status === "fulfilled") {
        setReadyWorkouts((programBody.value.programs || []).filter((item) => item.current_version_id));
      } else {
        failures.push(errorText(programBody.reason));
      }

      if (planBody.status === "fulfilled") {
        setReadyMeals((planBody.value.meal_plans || []).filter((item) => item.current_version_id));
      } else {
        failures.push(errorText(planBody.reason));
      }

      if (failures.length) {
        setError(failures[0]);
      }
    });

    return () => {
      active = false;
    };
  }, [row, plansKey]);

  async function givePlan(kind, event) {
    event.preventDefault();
    setNotice("");
    setError(null);

    try {
      if (kind === "workout") {
        await api("/api/v1/coach/workout-assignments", {
          method: "POST",
          body: {
            coaching_relationship_id: row.id,
            workout_program_version_id: Number(workoutVersion),
            starts_on: startsOn,
            ...(endsOn ? { ends_on: endsOn } : {}),
          },
        });
        setNotice("برنامه تمرین به این شاگرد داده شد.");
      } else {
        await api("/api/v1/coach/meal-assignments", {
          method: "POST",
          body: {
            coaching_relationship_id: row.id,
            meal_plan_version_id: Number(mealVersion),
            starts_on: startsOn,
            ...(endsOn ? { ends_on: endsOn } : {}),
          },
        });
        setNotice("برنامه غذا به این شاگرد داده شد.");
      }

      setPlansKey((key) => key + 1);
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  useEffect(() => {
    if (!row) {
      return;
    }
    api(`/api/v1/coach/relationships/${row.id}/body-photos`).then(
      (body) => {
        setPhotos(body.photos ?? []);
        setSets(body.sets ?? []);
        setPhotoClosed("");
      },
      (caught) => {
        setPhotos([]);
        setSets([]);
        setPreviews([]);
        if (caught instanceof ApiError && caught.status === 403) {
          setPhotoClosed(caught.message);
          return;
        }
        setError(errorText(caught));
      },
    );
  }, [row]);

  useEffect(() => {
    let cancelled = false;
    const created = [];
    Promise.all(photos.map(async (photo) => {
      const response = await fetch(`/api/v1/coach/body-photos/${photo.id}/file`, { credentials: "include" });
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
    if (!row) {
      return;
    }
    api(`/api/v1/coach/relationships/${row.id}/body-observations`).then(
      (body) => setObservations(body.observations ?? []),
      (caught) => setError(errorText(caught)),
    );
    api(`/api/v1/coach/relationships/${row.id}/hydration`).then(
      (body) => setHydration(body.entries ?? []),
      () => setHydration([]),
    );
  }, [row]);

  useEffect(() => {
    if (!row) {
      return;
    }
    let active = true;
    api(`/api/v1/coach/relationships/${row.id}/records`).then(
      (body) => {
        if (!active) {
          return;
        }
        setRecords(body.records ?? []);
        setExercises(body.exercises ?? []);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [row, recordsKey]);

  async function saveObservation(event) {
    event.preventDefault();
    const payloadMetrics = {};
    BODY_FIELDS.forEach(([key]) => {
      if (metrics[key] !== "") payloadMetrics[key] = metrics[key];
    });
    const measured = measuredAt.length === 16 ? `${measuredAt}:00` : measuredAt;
    setNotice("");
    try {
      await api(`/api/v1/coach/relationships/${row.id}/body-observations`, {
        method: "POST",
        body: { measured_at: measured, metrics: payloadMetrics },
      });
      const body = await api(`/api/v1/coach/relationships/${row.id}/body-observations`);
      setObservations(body.observations ?? []);
      setNotice("مشاهده بدن ثبت شد.");
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  async function uploadPhoto({ takenAt, note, items }) {
    if (!row || items.length === 0) {
      return;
    }
    const form = new FormData();
    const taken = takenAt.length === 16 ? `${takenAt}:00` : takenAt;
    items.forEach((item) => {
      form.append("photos[]", item.file);
      form.append("views[]", item.view);
      form.append("captions[]", item.caption);
    });
    form.append("note", note);
    form.append("taken_at", taken);
    setNotice("");
    setError(null);
    try {
      const response = await fetch(`/api/v1/coach/relationships/${row.id}/body-photos`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        body: form,
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;
      if (!response.ok) {
        throw toApiError(response.status, payload);
      }
      const body = await api(`/api/v1/coach/relationships/${row.id}/body-photos`);
      setPhotos(body.photos ?? []);
      setSets(body.sets ?? []);
      setNotice("مجموعه عکس ثبت شد.");
    } catch (caught) {
      setError(errorText(caught));
      throw caught;
    }
  }

  async function saveReview(setId, review) {
    setNotice("");
    setError(null);
    try {
      await api(`/api/v1/coach/body-photo-sets/${setId}`, { method: "PATCH", body: { review } });
      const body = await api(`/api/v1/coach/relationships/${row.id}/body-photos`);
      setPhotos(body.photos ?? []);
      setSets(body.sets ?? []);
      setNotice("تحلیل عکس ثبت شد.");
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  async function saveRecord(event) {
    event.preventDefault();
    setNotice("");
    setError(null);
    try {
      await api(`/api/v1/coach/relationships/${row.id}/records`, {
        method: "POST",
        body: {
          exercise_id: Number(recordForm.exercise_id),
          metric: recordForm.metric,
          value: Number(recordForm.value),
        },
      });
      setRecordForm((current) => ({ ...current, value: "" }));
      setRecordsKey((key) => key + 1);
      setNotice("رکورد ثبت شد. دستیار همین رابطه آن را می‌بیند.");
    } catch (caught) {
      setError(errorText(caught));
    }
  }

  useEffect(() => {
    if (!row) {
      return undefined;
    }
    let active = true;
    api(`/api/v1/coach/relationships/${row.id}/workout-sessions`).then(
      (body) => {
        if (active) {
          setSessions(body.sessions ?? []);
        }
      },
      () => {
        if (active) {
          setSessions([]);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [row]);

  const previewMap = Object.fromEntries(previews.map((photo) => [photo.id, photo.url]));
  const active = row?.status === "active";
  const ordered = [...observations].sort((left, right) => String(left.measured_at).localeCompare(String(right.measured_at)));
  const pair = (key) => {
    const rows = ordered.filter((item) => item.metrics?.[key] != null && item.metrics[key] !== "");
    return [rows.at(-2) ?? null, rows.at(-1) ?? null];
  };
  const spark = (key) => ordered
    .map((item) => Number(item.metrics?.[key]))
    .filter((value) => Number.isFinite(value))
    .map((value) => ({ v: value }));
  const metricText = (key) => {
    const value = Number(pair(key)[1]?.metrics?.[key]);
    return Number.isFinite(value) ? value.toLocaleString("fa-IR", { maximumFractionDigits: 1 }) : "—";
  };
  const sparkStatus = (key, upIsGood) => {
    const before = Number(pair(key)[0]?.metrics?.[key]);
    const after = Number(pair(key)[1]?.metrics?.[key]);
    if (!Number.isFinite(after)) return "ثبت نشده";
    if (!Number.isFinite(before) || Math.abs(after - before) < 0.05) return "ثابت";
    return (after > before) === upIsGood ? "بهتر" : "کمتر شده";
  };
  const weightValue = Number(pair("weight_kg")[1]?.metrics?.weight_kg);
  const fatValue = Number(pair("body_fat_percent")[1]?.metrics?.body_fat_percent);
  const metabolismNow = Number.isFinite(weightValue) && Number.isFinite(fatValue) && fatValue >= 0 && fatValue < 80
    ? Math.round(370 + 21.6 * weightValue * (1 - fatValue / 100))
    : null;
  const metabolismSeries = ordered.map((item) => {
    const weight = Number(item.metrics?.weight_kg);
    const fat = Number(item.metrics?.body_fat_percent);
    if (!Number.isFinite(weight) || !Number.isFinite(fat) || fat < 0 || fat >= 80) {
      return null;
    }
    return { v: Math.round(370 + 21.6 * weight * (1 - fat / 100)) };
  }).filter(Boolean);
  const metabolismStatus = metabolismNow === null ? "چربی لازم است" : metabolismSeries.length < 2 ? "از وزن و چربی" : "ثبت شده";
  const line = (key) => {
    const rows = spark(key);
    return rows.length ? rows : [{ v: 0 }];
  };
  const chartPoints = ordered.map((item) => ({
    at: item.measured_at,
    day: showDate(item.measured_at),
    weight: Number(item.metrics?.weight_kg) || null,
    fat: Number(item.metrics?.body_fat_percent) || null,
    muscle: Number(item.metrics?.muscle_mass_kg) || null,
  }));
  const rangeDays = { "7 روز": 7, "1 ماه": 31, "3 ماه": 92, "1 سال": 366 };
  const pointsWithin = (label) => {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    start.setDate(start.getDate() - ((rangeDays[label] ?? 31) - 1));
    const key = dateKey(start);
    return chartPoints.filter((point) => String(point.at).slice(0, 10) >= key);
  };
  const progressLabel = progressRange || ["7 روز", "1 ماه", "3 ماه", "1 سال"].find((label) => pointsWithin(label).filter((point) => point.fat != null && point.muscle != null).length >= 2) || "1 سال";
  const progressPoints = pointsWithin(progressLabel);
  const muscleValue = Number(pair("muscle_mass_kg")[1]?.metrics?.muscle_mass_kg);
  const frontPhoto = [...photos].reverse().find((photo) => photo.view === "front");
  const numberOr = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
  const bodyStats = Number.isFinite(weightValue) && Number.isFinite(fatValue) && Number.isFinite(muscleValue) ? {
    currentWeight: weightValue,
    previousWeight: numberOr(pair("weight_kg")[0]?.metrics?.weight_kg, weightValue),
    currentFat: fatValue,
    previousFat: numberOr(pair("body_fat_percent")[0]?.metrics?.body_fat_percent, fatValue),
    currentMuscle: muscleValue,
    previousMuscle: numberOr(pair("muscle_mass_kg")[0]?.metrics?.muscle_mass_kg, muscleValue),
    lastUpdate: showDate(pair("weight_kg")[1]?.measured_at),
    imagePreview: frontPhoto ? previewMap[frontPhoto.id] || null : null,
    targetWeight: null,
    muscleUnit: " kg",
  } : null;
  const direction = (key, wantDown) => {
    const before = Number(pair(key)[0]?.metrics?.[key]);
    const after = Number(pair(key)[1]?.metrics?.[key]);
    if (!Number.isFinite(before) || !Number.isFinite(after)) return null;
    if (Math.abs(after - before) < 0.05) return 0.5;
    return (wantDown ? after < before : after > before) ? 1 : 0;
  };
  const progressMarks = [direction("weight_kg", true), direction("body_fat_percent", true), direction("muscle_mass_kg", false)].filter((value) => value !== null);
  const bodyProgress = progressMarks.length ? Math.round((progressMarks.reduce((sum, value) => sum + value, 0) / progressMarks.length) * 100) : 0;
  const weekdayNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  const activeWorkout = workouts.find((item) => item.status === "active") ?? workouts[0] ?? null;
  const weekday = (new Date().getDay() + 1) % 7;
  const programDays = [...(activeWorkout?.version?.days ?? [])].sort((left, right) => (left.weekday ?? left.position ?? 0) - (right.weekday ?? right.position ?? 0));
  const selectedProgramDay = programDays.find((item) => String(item.id) === String(pickedDayId))
    ?? programDays.find((item) => item.weekday === weekday)
    ?? programDays[0]
    ?? null;
  const tableExercises = (selectedProgramDay?.exercises ?? []).map((item) => {
    const low = item.reps_min;
    const high = item.reps_max;
    const grams = Number(item.target_weight_g);
    return {
      name: item.exercise?.name || "حرکت",
      sets: faDigits(item.prescribed_sets ?? "—"),
      reps: low && high && low !== high ? `${faDigits(low)} تا ${faDigits(high)}` : faDigits(low ?? high ?? "—"),
      weight: Number.isFinite(grams) && grams > 0 ? `${(grams / 1000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوگرم` : "—",
      rest: item.rest_seconds ? `${faDigits(item.rest_seconds)} ثانیه` : "—",
      note: item.coach_note || "—",
    };
  });
  const todayIds = new Set((programDays.find((item) => item.weekday === weekday)?.exercises ?? []).map((item) => item.exercise_id));
  const doneIds = new Set(sessions.filter((item) => item.performed_on === todayKey() && item.status === "completed").flatMap((item) => (item.sets ?? []).filter((set) => set.is_completed).map((set) => set.exercise_id)));
  const practicePercent = todayIds.size ? Math.min(100, Math.round(([...todayIds].filter((id) => doneIds.has(id)).length / todayIds.size) * 100)) : 0;
  const today = new Date();
  const todayParts = jalaliParts(today);
  const monthDates = monthDays(todayParts.year, todayParts.month);
  const monthName = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(monthDates[0] || today);
  const lead = monthDates[0] ? (monthDates[0].getDay() + 1) % 7 : 0;
  const waterGoal = Number(hydration.find((entry) => entry.goal_ml)?.goal_ml) || 4000;
  const waterByDay = Object.fromEntries(hydration.map((entry) => [entry.logged_on, Number(entry.amount_ml) || 0]));
  const waterDays = Array.from({ length: lead }, () => ({ blank: true, dots: [] }));
  const waterReports = {};
  monthDates.forEach((date) => {
    const day = jalaliParts(date).day;
    const key = isoDate(date);
    const amount = waterByDay[key] ?? 0;
    const glasses = amount > 0 ? Math.min(3, Math.max(1, Math.round(amount / waterGoal))) : 0;
    const percent = Math.min(100, Math.round((amount / waterGoal) * 100));
    waterDays.push({ day, dots: Array.from({ length: glasses }, () => "blue") });
    waterReports[String(day)] = {
      title: `آب ${showDate(key)}`,
      amount: waterLabel(amount),
      goal: waterLabel(waterGoal),
      percentage: `${percent.toLocaleString("fa-IR")}٪`,
      description: amount <= 0 ? "برای این روز آبی ثبت نشده است." : amount >= waterGoal ? "هدف آب این روز کامل شده است." : `تا هدف، ${waterLabel(waterGoal - amount)} مانده است.`,
    };
  });
  const athleteName = row?.athlete?.display_name || "—";
  const profileTabs = [
    { id: "overview", label: "نمای کلی" },
    { id: "body-health", label: "بدن و سلامت" },
    { id: "training", label: "تمرین" },
    { id: "nutrition", label: "تغذیه" },
    { id: "progress", label: "پیشرفت" },
    { id: "activity", label: "فعالیت" },
    { id: "files", label: "فایل ها" },
    { id: "notes", label: "یادداشت ها" },
  ];
  const infoValue = (key) => {
    const sourceKey = key === "bmi" && (pair("bmi")[1]?.metrics?.bmi == null || pair("bmi")[1]?.metrics?.bmi === "") && pair("bmi_calculated")[1]?.metrics?.bmi_calculated != null
      ? "bmi_calculated"
      : key;
    const value = pair(sourceKey)[1]?.metrics?.[sourceKey];
    return value == null || value === "" ? "ثبت نشده" : withUnit(value, sourceKey);
  };
  const pairedSize = (leftKey, rightKey) => {
    const left = pair(leftKey)[1]?.metrics?.[leftKey];
    const right = pair(rightKey)[1]?.metrics?.[rightKey];
    const hasLeft = left != null && left !== "";
    const hasRight = right != null && right !== "";
    if (!hasLeft && !hasRight) return "ثبت نشده";
    if (hasLeft && hasRight && String(left) !== String(right)) {
      return `چپ ${withUnit(left, leftKey)} / راست ${withUnit(right, rightKey)}`;
    }
    return withUnit(hasLeft ? left : right, hasLeft ? leftKey : rightKey);
  };
  const physicalItems = [
    { label: "وزن", value: infoValue("weight_kg") },
    { label: "قد", value: infoValue("height_cm") },
    { label: "سن", value: "ثبت نشده" },
    { label: "گروه خونی", value: "ثبت نشده" },
    { label: "ضربان قلب استراحت", value: "ثبت نشده" },
    { label: "ظرفیت ریه", value: "ثبت نشده" },
  ];
  const measureItems = [
    { label: "دور سینه", value: infoValue("chest_cm") },
    { label: "دور کمر", value: infoValue("waist_cm") },
    { label: "دور باسن", value: infoValue("hip_cm") },
    { label: "دور بازو", value: pairedSize("left_arm_cm", "right_arm_cm") },
    { label: "دور ران", value: pairedSize("left_thigh_cm", "right_thigh_cm") },
    { label: "دور شکم", value: "ثبت نشده" },
  ];
  const weekStart = new Date();
  weekStart.setHours(12, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 1) % 7));
  const weekStartKey = dateKey(weekStart);
  const volumeByExercise = new Map();
  sessions.filter((item) => item.performed_on >= weekStartKey).forEach((item) => {
    (item.sets ?? []).filter((set) => set.is_completed).forEach((set) => {
      const name = set.exercise?.name || "حرکت";
      const kilos = Number(set.weight_g) > 0 ? Number(set.weight_g) / 1000 : 0;
      const reps = Number(set.reps) > 0 ? Number(set.reps) : 0;
      const meters = Number(set.distance_m) > 0 ? Number(set.distance_m) : 0;
      const current = volumeByExercise.get(name) ?? { kilos: 0, meters: 0, done: 0 };
      current.kilos += kilos > 0 ? kilos * (reps || 1) : 0;
      current.meters += meters;
      current.done += 1;
      volumeByExercise.set(name, current);
    });
  });
  const volumeItems = [...volumeByExercise.entries()].slice(0, 6).map(([label, item]) => ({
    label,
    value: item.kilos > 0
      ? `${item.kilos.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوگرم`
      : item.meters > 0
        ? `${item.meters.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} متر`
        : "انجام شده",
  }));
  const latestEffort = [...sessions].reverse().find((item) => item.perceived_effort != null)?.perceived_effort ?? null;
  const sleepSummary = latestEffort == null
    ? "خواب و انرژی برای این شاگرد ثبت نشده است."
    : `آخرین فشار ثبت‌شده در تمرین ${Number(latestEffort).toLocaleString("fa-IR")} از ۱۰ است. ساعت خواب ثبت نشده.`;
  const trainingFiles = [
    ...workouts.map((item) => ({ id: `workout-${item.id}`, name: item.program?.title || "برنامه تمرین", to: item.program?.id ? `/coach/programs/${item.program.id}` : "" })),
    ...meals.map((item) => ({ id: `meal-${item.id}`, name: item.plan?.title || "برنامه غذا", to: item.plan?.id ? `/coach/nutrition/${item.plan.id}` : "" })),
  ];
  const photoRows = sets.flatMap((set) => (set.photos?.length ? set.photos : [{ id: `set-${set.id}`, view: "", taken_at: set.taken_at, caption: set.note }]));
  const medicalFiles = (photoRows.length ? photoRows : photos).map((photo) => ({
    id: photo.id,
    name: [VIEW_LABELS[photo.view] || "عکس", showDate(photo.taken_at), photo.caption].filter(Boolean).join(" · "),
  }));
  const noteRows = sessions.filter((item) => item.athlete_note).map((item) => ({
    id: item.id,
    content: item.athlete_note,
    date: showDate(item.performed_on),
  }));
  const liftSeen = new Set();
  const liftItems = [...records]
    .sort((left, right) => String(right.recorded_at).localeCompare(String(left.recorded_at)))
    .flatMap((item) => {
      if (!["max_weight_g", "estimated_1rm_g"].includes(item.metric) || liftSeen.has(item.exercise_name)) return [];
      liftSeen.add(item.exercise_name);
      return [{ label: item.exercise_name, value: item.display }];
    });
  const activityItems = (liftItems.length ? liftItems : volumeItems).slice(0, 2);
  const medicalFileRows = [
    { id: "cbc", name: "آزمایش خون کامل" },
    { id: "vitamin-d", name: "ویتامین D" },
    { id: "glucose", name: "تست قند خون" },
    { id: "lipids", name: "چربی خون" },
  ];
  const inputClass = "mt-2 w-full rounded-xl border border-[#E7EBF0] bg-white px-4 py-3 text-sm text-[#454C55] outline-none focus:border-[#8CC3FF]";

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="پروفایل ورزشکار" description="اطلاعات کامل، برنامه‌ها و روند پیشرفت" />
            <div className="col-span-12 text-right" dir="rtl">
              <Link to="/coach/athletes" className="text-sm text-[#007BFF]">بازگشت به فهرست</Link>
              {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
              {missing && !error && <p className="mt-4 text-sm text-[#6B6F77]">این رابطه برای شما نیست.</p>}
              {notice ? <p className="mt-3 text-sm text-green-700">{notice}</p> : null}
            </div>
            {row ? (
              <>
                <div className="col-span-12" dir="rtl">
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4">
                    <div className="flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-sm text-[#007BFF]">{athleteName.trim().slice(0, 1) || "و"}</div>
                      <div className="mr-2 flex flex-col items-start gap-1">
                        <h2 className="font-primary text-sm text-[#4F5965]">{athleteName}</h2>
                        <p className="text-xs text-[#6B6F77]">وضعیت: {statusLabel(row.status)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/coach/message?relationship=${row.id}`} className="flex items-center gap-1 rounded-full bg-[#007BFF] px-4 py-1.5 text-sm text-white">
                        <ChatOutlinedIcon style={{ fontSize: "18px" }} />
                        شروع گفتگو
                      </Link>
                      <Link to={`/coach/programs/new?for=${row.id}`} className="flex items-center gap-1 rounded-full bg-[#007BFF]/20 px-3 py-2 text-sm text-[#007BFF]">
                        <img src={AddCircle} alt="" className="h-5 w-5" />
                        ایجاد برنامه
                      </Link>
                      <Link to={`/coach/athletes/${row.id}?tab=body-health`} className="rounded-full border border-[#E5EAF1] px-4 py-1.5 text-sm text-[#6B6F77]">ویرایش اطلاعات</Link>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <Chart label="متابولیسم پایه" value={metabolismNow === null ? "—" : metabolismNow.toLocaleString("fa-IR")} unit="kcal" status={metabolismStatus} series={metabolismSeries.length ? metabolismSeries : [{ v: 0 }]} />
                  <Chart label="وزن" value={metricText("weight_kg")} unit="kg" status={sparkStatus("weight_kg", false)} series={line("weight_kg")} />
                  <Chart label="چربی بدن" value={metricText("body_fat_percent")} unit="%" status={sparkStatus("body_fat_percent", false)} series={line("body_fat_percent")} />
                  <Chart label="عضله" value={metricText("muscle_mass_kg")} unit="kg" status={sparkStatus("muscle_mass_kg", true)} series={line("muscle_mass_kg")} />
                  <Chart label="آب بدن" value={metricText("body_water_percent")} unit="%" status={sparkStatus("body_water_percent", true)} series={line("body_water_percent")} />
                </div>
                <div className="col-span-12">
                  <ProgressNavbar items={profileTabs} activeItem={tab} onItemChange={setTab} />
                </div>
                {tab === "overview" ? (
                  <>
                    <div className="col-span-12 lg:col-span-8">
                      <ChartDashboardCoach points={chartPoints} />
                    </div>
                    <div className="col-span-12 lg:col-span-4">
                      <CircularProgressbarChart value={practicePercent} title="میزان انجام تمرین ها" />
                    </div>
                    <div className="col-span-12">
                      <WorkoutProgram
                        exercises={tableExercises}
                        days={programDays.map((day) => ({ id: day.id, label: day.title || weekdayNames[day.weekday] || "روز" }))}
                        activeDayId={selectedProgramDay?.id}
                        onDay={setPickedDayId}
                        onHistoryClick={() => setTab("activity")}
                      />
                    </div>
                    <div className="col-span-12 lg:col-span-7">
                      {bodyStats ? <BodyChanges stats={bodyStats} /> : (
                        <div className="rounded-3xl bg-white p-6 text-sm text-[#6B6F77]">برای کارت تغییرات بدن، وزن و چربی و عضله لازم است.</div>
                      )}
                    </div>
                    <div className="col-span-12 lg:col-span-5">
                      <NutritionReport type="water" title="مصرف آب روزانه" date={monthName} data={waterDays} reports={waterReports} />
                    </div>
                  </>
                ) : null}
                {tab === "progress" ? (
                  <>
                    <div className="col-span-12 lg:col-span-8">
                      <BodyChangeChart points={progressPoints} range={progressLabel} onRange={setProgressRange} />
                    </div>
                    <div className="col-span-12 lg:col-span-4">
                      <CircularProgressbarChart value={bodyProgress} title="میزان پیشرفت بدن" />
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
            {tab === "body-health" ? (
              <div className="col-span-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <HealthInfoCard title="اطلاعات جسمانی" items={physicalItems} />
                <HealthInfoCard title="اندازه‌گیری بدن" items={measureItems} />
                <SleepEnergyCard />
                <MedicalTestsCard preview={false} />
              </div>
            ) : null}
            {tab === "activity" ? (
              <div className="col-span-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <HealthInfoCard
                  title="حجم تمرین هر عصله(این هفته) "
                  items={activityItems.length ? activityItems : [{ label: "سینه", value: "ثبت نشده" }, { label: "جلوبازو", value: "ثبت نشده" }]}
                />
                <SleepEnergyCard />
              </div>
            ) : null}
            {tab === "files" ? (
              <div className="col-span-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FilesCard title="فایل‌های تمرین و تغذیه" files={trainingFiles.length ? trainingFiles : [
                  { id: "train-1", name: "فایل تمرین هفته اول" },
                  { id: "meal-file", name: "فایل برنامه تغذیه" },
                  { id: "daily", name: "جدول ثبت روزانه" },
                  { id: "food-log", name: "جدول ثبت غذا" },
                ]} empty="" />
                <FilesCard title="فایل‌های پزشکی" files={medicalFileRows} empty="" />
              </div>
            ) : null}
            {tab === "notes" ? (
              <div className="col-span-12">
                <NotesCard notes={noteRows} />
              </div>
            ) : null}
            {tab === "nutrition" ? (
              <AthleteNutritionTab assignment={meals.find((item) => item.status === "active") ?? null} loadError={mealError} />
            ) : null}
            {tab === "training" ? (
              <div className="col-span-12">
                <WorkoutProgram
                  exercises={tableExercises}
                  days={programDays.map((day) => ({ id: day.id, label: day.title || weekdayNames[day.weekday] || "روز" }))}
                  activeDayId={selectedProgramDay?.id}
                  onDay={setPickedDayId}
                  onHistoryClick={() => setTab("activity")}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
