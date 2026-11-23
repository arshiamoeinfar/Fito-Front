import { useEffect, useMemo, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import "react-circular-progressbar/dist/styles.css";
import Navbar from "../../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import StatCard from "../../../Components/shared/StatCard/StatCard";
import AIChat from "../../../Components/DashBoardAuth/DashBoardAuthlete/Aichat/Aichat";
import { api } from "../../../api/client";
import { printMealPlan } from "../../../lib/printDocument";
import AddFoodModal from "../../../Components/DashBoardAuth/NutrationPage/AddFoodModal/AddFoodModal";
import AthleteFoodIntake from "../../../Components/nutrition/FoodIntakeLog";
import SelfProgramBanner from "../../../Components/athlete/SelfProgramBanner";
import imgLunch from "../../../assets/imges/lunch.png";
import ImgFood from "../../../assets/imges/image 17.png";

const MEAL_LABELS = {
  breakfast: "صبحانه",
  lunch: "ناهار",
  dinner: "شام",
  snack: "میان‌وعده",
  other: "سایر",
};

const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

function todayWeekday() {
  return WEEKDAYS[new Date().getDay()];
}

function faNumber(value, digits = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString("fa-IR", { maximumFractionDigits: digits });
}

function gramsFromMg(mg) {
  if (mg == null) {
    return "—";
  }

  return `${faNumber(mg / 1000, 1)} گرم`;
}

function kcalText(value) {
  if (value == null) {
    return "—";
  }

  return `${faNumber(value)} کیلوکالری`;
}

function portion(item) {
  if (item.quantity_g != null) {
    return `${faNumber(item.quantity_g)} گرم`;
  }

  if (item.quantity_unit_milli != null) {
    return `${faNumber(item.quantity_unit_milli / 1000, 1)} واحد`;
  }

  return "به اندازهٔ برنامه";
}

function mealName(meal) {
  const label = MEAL_LABELS[meal.meal_type] ?? "وعده";

  if (meal.title && meal.title !== label) {
    return `${label} · ${meal.title}`;
  }

  return meal.title || label;
}

function printableDays(assignment) {
  return (assignment?.version?.days ?? []).map((item) => ({
    title: item.title,
    total: kcalText(item.totals?.energy_kcal),
    meta: `پروتئین ${gramsFromMg(item.totals?.protein_mg)} · کربوهیدرات ${gramsFromMg(item.totals?.carbohydrate_mg)} · چربی ${gramsFromMg(item.totals?.fat_mg)}`,
    meals: (item.meals ?? []).map((meal) => ({
      name: mealName(meal),
      items: (meal.items ?? []).map((food) => ({
        food: food.food?.name ?? "غذا",
        amount: food.detail || portion(food),
        energy: kcalText(food.totals?.energy_kcal),
      })),
    })),
  }));
}

function pickDay(days) {
  const today = todayWeekday();

  return days.find((day) => day.title === today) ?? days[0] ?? null;
}

function ringShare(part, total) {
  if (!total) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function macroRings(totals) {
  const kcal = Number(totals?.energy_kcal) || 0;
  const protein = (Number(totals?.protein_mg) || 0) / 1000;
  const carbs = (Number(totals?.carbohydrate_mg) || 0) / 1000;
  const fat = (Number(totals?.fat_mg) || 0) / 1000;
  const fromProtein = protein * 4;
  const fromCarbs = carbs * 4;
  const fromFat = fat * 9;
  const base = kcal || fromProtein + fromCarbs + fromFat;

  return {
    calories: kcal ? 100 : 0,
    carbs: ringShare(fromCarbs, base),
    protein: ringShare(fromProtein, base),
    fat: ringShare(fromFat, base),
    kcal,
    protein,
    carbs,
    fat,
  };
}

function per100FromRevision(revision) {
  if (!revision) {
    return null;
  }

  const base = {
    calories: Number(revision.energy_kcal) || 0,
    protein: (Number(revision.protein_mg) || 0) / 1000,
    carbs: (Number(revision.carbohydrate_mg) || 0) / 1000,
    fat: (Number(revision.fat_mg) || 0) / 1000,
  };

  if (revision.basis !== "per_unit") {
    return base;
  }

  const grams = Number(revision.grams_per_unit) || 100;
  const factor = grams > 0 ? 100 / grams : 1;

  return {
    calories: Math.round(base.calories * factor * 10) / 10,
    protein: Math.round(base.protein * factor * 10) / 10,
    carbs: Math.round(base.carbs * factor * 10) / 10,
    fat: Math.round(base.fat * factor * 10) / 10,
  };
}

function foodCatalog(assignment) {
  const foods = new Map();

  for (const day of assignment?.version?.days ?? []) {
    for (const meal of day.meals ?? []) {
      for (const item of meal.items ?? []) {
        const id = item.food?.id ?? item.food_id;

        if (id == null || foods.has(String(id))) {
          continue;
        }

        const per100g = per100FromRevision(item.revision);

        if (!per100g) {
          continue;
        }

        foods.set(String(id), {
          id: String(id),
          name: item.food?.name || "غذا",
          desc: item.detail || portion(item),
          per100g,
        });
      }
    }
  }

  return [...foods.values()];
}

function addTotals(totals, extra) {
  return {
    energy_kcal: (Number(totals?.energy_kcal) || 0) + extra.energy_kcal,
    protein_mg: (Number(totals?.protein_mg) || 0) + extra.protein_mg,
    carbohydrate_mg: (Number(totals?.carbohydrate_mg) || 0) + extra.carbohydrate_mg,
    fat_mg: (Number(totals?.fat_mg) || 0) + extra.fat_mg,
  };
}

function MealCard({ meal, isOpen, onToggle, onAddFood }) {
  const label = MEAL_LABELS[meal.meal_type] ?? "وعده";
  const title = meal.title && meal.title !== label ? meal.title : label;

  return (
    <div className="mt-4 rounded-3xl bg-white p-4 sm:mt-5 sm:p-6">
      <div onClick={onToggle} className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <img src={imgLunch} className="h-12 w-12 shrink-0 rounded-2xl bg-[#E9FFD9] object-cover sm:h-14 sm:w-14" alt="" />
          <div className="min-w-0 text-right">
            <span className="block break-words text-lg text-[#6B6F77] sm:text-xl">{title}</span>
            <p className="text-sm text-[#6B6F77]">{kcalText(meal.totals?.energy_kcal)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddFood();
            }}
            className="cursor-pointer rounded-full bg-[#007BFF]/10 px-4 py-2 text-sm text-[#007BFF] sm:px-5"
          >
            افزودن +
          </button>
          <button type="button" className="text-[#6B6F77]" aria-label={isOpen ? "بستن وعده" : "باز کردن وعده"}>
            {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </button>
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "mt-6 max-h-[40rem] opacity-100" : "mt-0 max-h-0 opacity-0"}`}>
        <div className="mb-6 h-px bg-[#E6EAF0]" />
        <div className="flex flex-col gap-6">
          {(meal.items ?? []).length === 0 ? <p className="text-sm text-[#A0A4AA]">برای این وعده غذایی ثبت نشده.</p> : null}
          {(meal.items ?? []).map((food) => (
            <div key={food.id} className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0065B8] sm:h-14 sm:w-14">
                <img className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" src={ImgFood} alt="" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="break-words font-medium text-[#6B6F77]">{food.food?.name ?? "غذا"}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm whitespace-nowrap text-[#6B6F77]">{food.totals?.energy_kcal == null ? "—" : `${faNumber(food.totals.energy_kcal)} کیلوکالری`}</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl border-2 border-[#007BFF]">
                      <div className="flex h-4 w-4 items-center justify-center rounded-md bg-[#007BFF]">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-1 break-words text-sm leading-6 text-[#6B6F77]">{food.detail || portion(food)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashBoardNutrition() {
  const [plans, setPlans] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [dayId, setDayId] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [openMealId, setOpenMealId] = useState("");
  const [activeMealId, setActiveMealId] = useState("");
  const today = todayWeekday();

  useEffect(() => {
    api("/api/v1/athlete/meal-assignments").then((body) => {
      const rows = (body.assignments ?? []).filter((row) => row.status === "active");
      setPlans(rows);
      choosePlan(rows[0] ?? null);
    }).catch((caught) => setError(caught.message)).finally(() => setLoaded(true));
  }, []);

  const days = assignment?.version?.days ?? [];
  const day = days.find((item) => String(item.id) === dayId) ?? days[0] ?? null;
  const meals = day?.meals ?? [];
  const foods = useMemo(() => foodCatalog(assignment), [assignment]);
  const activeMeal = meals.find((meal) => String(meal.id) === activeMealId) ?? null;
  const totals = day?.totals;
  const rings = macroRings(totals);
  function choosePlan(row) {
    const nextDays = row?.version?.days ?? [];
    const first = pickDay(nextDays);
    setAssignment(row);
    setDayId(first ? String(first.id) : "");
  }

  function planLabel(row) {
    const title = row?.plan?.title || "برنامه غذا";
    return row?.coaching_relationship_id == null ? `${title} (هوش مصنوعی)` : title;
  }

  const planTitle = assignment ? planLabel(assignment) : "برنامه غذا";

  useEffect(() => {
    setOpenMealId(meals[0] ? String(meals[0].id) : "");
  }, [day?.id]);

  function handleAddFood(food) {
    if (!activeMeal) {
      return;
    }

    const nutrition = food.nutrition || {};
    const extra = {
      energy_kcal: Math.round(Number(nutrition.calories) || 0),
      protein_mg: Math.round((Number(nutrition.protein) || 0) * 1000),
      carbohydrate_mg: Math.round((Number(nutrition.carbs) || 0) * 1000),
      fat_mg: Math.round((Number(nutrition.fat) || 0) * 1000),
    };
    const mealId = String(activeMeal.id);
    const item = {
      id: `local-${mealId}-${Date.now()}`,
      food: { name: food.title },
      detail: food.desc,
      quantity_g: food.grams ?? null,
      totals: extra,
    };

    setAssignment((current) => {
      if (!current?.version?.days) {
        return current;
      }

      return {
        ...current,
        version: {
          ...current.version,
          days: current.version.days.map((entry) => {
            const includesMeal = (entry.meals ?? []).some((meal) => String(meal.id) === mealId);

            return {
              ...entry,
              totals: includesMeal ? addTotals(entry.totals, extra) : entry.totals,
              meals: (entry.meals ?? []).map((meal) => (
                String(meal.id) === mealId
                  ? { ...meal, totals: addTotals(meal.totals, extra), items: [...(meal.items ?? []), item] }
                  : meal
              )),
            };
          }),
        },
      };
    });
    setOpenMealId(mealId);
    setActiveMealId("");
  }

  function openPlan(asPdf) {
    printMealPlan({
      title: planTitle,
      documentTitle: asPdf ? `${planTitle}.pdf` : planTitle,
      intro: "همهٔ روزهای برنامه، به ترتیب.",
      days: printableDays(assignment),
    });
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-1 lg:py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard title="تغذیه من" description="برنامه تغذیه و موارد دریافتی بدن رو از این قسمت برسی کن" />
            {error ? <p className="col-span-12 rounded-3xl bg-white px-6 py-4 text-sm text-red-700">{error}</p> : null}
            <SelfProgramBanner onDone={() => window.location.reload()} />
            <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
              <StatCard title="کالری" value={rings.kcal ? faNumber(rings.kcal) : "—"} type="circle" progress={rings.calories} />
              <StatCard title="کربوهیدرات" value={totals ? `${faNumber(rings.carbs, 0)}g` : "—"} type="circle" progress={rings.carbs} color="#6578BC" colorBg="#DBE3FF" />
              <StatCard title="پروتئین" value={totals ? `${faNumber(rings.protein, 0)}g` : "—"} type="circle" progress={rings.protein} color="#C23EA1" colorBg="#FFDBF6" />
              <StatCard title="چربی" value={totals ? `${faNumber(rings.fat, 0)}g` : "—"} type="circle" progress={rings.fat} color="#41CCD4" colorBg="#DBFDFF" />
            </div>
            <div className="col-span-12 min-w-0 lg:col-span-8">
              <AthleteFoodIntake />
              {plans.length > 1 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {plans.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => choosePlan(row)}
                      className={`rounded-full px-4 py-2 text-sm ${row.id === assignment?.id ? "bg-[#16845A] text-white" : "bg-white text-[#4B5563]"}`}
                    >
                      {planLabel(row)}
                    </button>
                  ))}
                </div>
              ) : null}
              {!loaded ? <p className="mt-5 rounded-3xl bg-white px-6 py-5 text-sm text-[#6B6F77]">در حال آوردن برنامه.</p> : null}
              {loaded && !assignment ? (
                <p className="mt-5 rounded-3xl bg-white px-6 py-8 text-sm leading-8 text-[#6B6F77]">الان برنامهٔ غذایی فعالی نداری. وقتی مربی برنامه بدهد همین‌جا دیده می‌شود. با پلن خودت هم هوش مصنوعی می‌تواند برنامه بسازد.</p>
              ) : null}
              {day ? (
                <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  {days.length > 1 ? (
                    <div className="flex min-w-0 max-w-full flex-wrap gap-2">
                      {days.map((item) => {
                        const selected = item.id === day.id;
                        const isToday = item.title === today;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setDayId(String(item.id))}
                            className={selected
                              ? "shrink-0 rounded-full bg-[#007BFF] px-4 py-2 text-sm text-white"
                              : "shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#6B6F77]"}
                          >
                            {item.title}
                            {isToday ? " · امروز" : ""}
                          </button>
                        );
                      })}
                    </div>
                  ) : <span className="text-sm text-[#6B6F77]">{day.title === today ? "امروز" : day.title}</span>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openPlan(false)} className="rounded-full bg-white px-4 py-2 text-sm text-[#6B6F77]">چاپ برنامه</button>
                    <button type="button" onClick={() => openPlan(true)} className="rounded-full bg-[#007BFF] px-4 py-2 text-sm text-white">ذخیره پی‌دی‌اف</button>
                  </div>
                </div>
              ) : null}
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  isOpen={String(meal.id) === openMealId}
                  onToggle={() => setOpenMealId((current) => (current === String(meal.id) ? "" : String(meal.id)))}
                  onAddFood={() => setActiveMealId(String(meal.id))}
                />
              ))}
            </div>
            <div className="col-span-12 min-w-0 lg:col-span-4">
              <AIChat />
              <div className="mt-5 rounded-4xl bg-white p-5 sm:p-7">
                <h2 className="text-right text-2xl font-medium text-[#6B6F77]">مکمل‌ها</h2>
                <div className="my-5 h-px bg-[#E6EAF0]" />
                <p className="text-sm leading-7 text-[#6B6F77]">در این برنامه مکملی ثبت نشده.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {activeMeal ? (
        <AddFoodModal
          isOpen
          onClose={() => setActiveMealId("")}
          mealName={mealName(activeMeal)}
          foods={foods}
          onAddFood={handleAddFood}
        />
      ) : null}
    </div>
  );
}
