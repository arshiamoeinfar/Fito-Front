
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import JalaliField from "../../Components/shared/JalaliField/JalaliField";
import { showDate } from "../../lib/jalali";

/* ───────────────────────── constants ───────────────────────── */

const WEEK = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const MEALS = [
  ["breakfast", "صبحانه"],
  ["lunch", "ناهار"],
  ["dinner", "شام"],
  ["snack", "میان‌وعده"],
];

const PRESETS = [
  { type: "breakfast", title: "صبحانه" },
  { type: "snack", title: "میان‌وعده صبح" },
  { type: "lunch", title: "ناهار" },
  { type: "snack", title: "عصرانه" },
  { type: "dinner", title: "شام" },
  { type: "snack", title: "میان‌وعده شب" },
];

const MEAL_STYLES = {
  breakfast: { icon: "🌅", head: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
  lunch: { icon: "☀️", head: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
  dinner: { icon: "🌙", head: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" },
  snack: { icon: "🍎", head: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
};

const DEFAULT_STYLE = {
  icon: "🍽️",
  head: "bg-blue-50",
  text: "text-blue-700",
  border: "border-blue-100",
};

const COMMON_FOODS = [
  { name: "تخم‌مرغ آب‌پز", grams: 50 },
  { name: "املت", grams: 150 },
  { name: "نان سنگک", grams: 80 },
  { name: "نان بربری", grams: 80 },
  { name: "نان لواش", grams: 40 },
  { name: "پنیر", grams: 30 },
  { name: "شیر کم‌چرب", grams: 250 },
  { name: "ماست کم‌چرب", grams: 150 },
  { name: "ماست یونانی", grams: 150 },
  { name: "دوغ", grams: 250 },
  { name: "جو دوسر", grams: 50 },
  { name: "عسل", grams: 15 },
  { name: "کره بادام‌زمینی", grams: 20 },
  { name: "گردو", grams: 30 },
  { name: "بادام", grams: 25 },
  { name: "خرما", grams: 30 },
  { name: "موز", grams: 120 },
  { name: "سیب", grams: 150 },
  { name: "پرتقال", grams: 150 },
  { name: "خیار", grams: 100 },
  { name: "گوجه‌فرنگی", grams: 100 },
  { name: "سالاد کاهو", grams: 100 },
  { name: "کلم بروکلی", grams: 100 },
  { name: "اسفناج", grams: 100 },
  { name: "برنج سفید پخته", grams: 200 },
  { name: "ماکارونی پخته", grams: 200 },
  { name: "سیب‌زمینی پخته", grams: 200 },
  { name: "عدس پخته", grams: 150 },
  { name: "لوبیا پخته", grams: 150 },
  { name: "نخود پخته", grams: 150 },
  { name: "سینه مرغ گریل‌شده", grams: 150 },
  { name: "ران مرغ بدون پوست", grams: 150 },
  { name: "گوشت گوساله", grams: 120 },
  { name: "ماهی سالمون", grams: 150 },
  { name: "ماهی قزل‌آلا", grams: 150 },
  { name: "تن ماهی", grams: 100 },
  { name: "پودر پروتئین وی", grams: 30 },
  { name: "روغن زیتون", grams: 10 },
];

const field =
  "w-full min-w-0 rounded-xl sm:rounded-2xl border border-[#E8EDF4] bg-white px-3.5 py-3 text-sm text-[#1F2937] outline-none transition placeholder:text-[#A0AABB] focus:border-[#007BFF] focus:ring-2 focus:ring-blue-100";

/* ───────────────────────── helpers ───────────────────────── */

let seq = 0;
const uid = () => `k${++seq}`;

const toFa = (n) => Number(n || 0).toLocaleString("fa-IR");

function norm(text) {
  return String(text || "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .trim()
    .toLowerCase();
}

function errorText(caught) {
  if (caught instanceof ApiError) return caught.message;
  if (caught instanceof Error && caught.message) return caught.message;
  return "درخواست ناموفق بود.";
}

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function mealLabel(type) {
  return MEALS.find(([value]) => value === type)?.[1] || "وعده";
}

function rankOf(title) {
  const index = PRESETS.findIndex((preset) => preset.title === title);
  return index === -1 ? undefined : index;
}

function blankItem(autoFocus = false) {
  return { uid: uid(), name: "", grams: "100", autoFocus };
}

function blankMeal(type, title, autoFocus = false) {
  return {
    uid: uid(),
    type,
    title,
    rank: rankOf(title),
    items: [blankItem(autoFocus)],
  };
}

function blankDay(title) {
  const base = [PRESETS[0], PRESETS[2], PRESETS[4]];

  return {
    uid: uid(),
    title,
    meals: base.map((preset) => blankMeal(preset.type, preset.title)),
  };
}

function versionToDays(version) {
  if (!version?.days?.length) {
    return [blankDay("شنبه")];
  }

  return version.days.map((day) => ({
    uid: uid(),
    title: day.title || "روز",
    meals: (day.meals || []).map((meal) => {
      const type = MEALS.some(([value]) => value === meal.meal_type)
        ? meal.meal_type
        : "snack";

      const title = meal.title || mealLabel(type);

      const items = (meal.items || []).map((item) => ({
        uid: uid(),
        name: item.food?.name || "",
        grams: item.quantity_g == null ? "" : String(item.quantity_g),
      }));

      return {
        uid: uid(),
        type,
        title,
        rank: rankOf(title),
        items: items.length ? items : [blankItem()],
      };
    }),
  }));
}

function cloneDay(day) {
  return {
    ...day,
    uid: uid(),
    title: `${day.title || "روز"} (کپی)`,
    meals: day.meals.map((meal) => ({
      ...meal,
      uid: uid(),
      items: meal.items.map((item) => ({
        ...item,
        uid: uid(),
        autoFocus: false,
      })),
    })),
  };
}

function dayStats(day, kcalByName) {
  let meals = 0;
  let foods = 0;
  let kcal = 0;

  for (const meal of day.meals) {
    const named = meal.items.filter((item) => item.name.trim());

    if (!named.length) continue;

    meals += 1;
    foods += named.length;

    for (const item of named) {
      const per100 = kcalByName.get(norm(item.name));
      const grams = Number(item.grams);

      if (per100 > 0 && grams > 0) {
        kcal += (per100 * grams) / 100;
      }
    }
  }

  return { meals, foods, kcal: Math.round(kcal) };
}

/* ───────────────────────── skeleton ───────────────────────── */

function SkeletonLine({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-slate-100 ${className}`}
    />
  );
}

function MealPlanSkeleton() {
  return (
    <div
      dir="rtl"
      className="col-span-12 min-w-0 space-y-4"
      aria-label="در حال بارگذاری برنامه غذایی"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonLine className="h-5 w-36 sm:w-48" />
            <SkeletonLine className="h-3 w-52 max-w-full" />
          </div>
          <SkeletonLine className="h-10 w-10 shrink-0 rounded-xl" />
        </div>
      </div>

      {/* Form skeleton */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="space-y-5">
          <div className="space-y-3">
            <SkeletonLine className="h-3 w-28" />
            <SkeletonLine className="h-11 w-full max-w-xl rounded-xl" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="h-7 w-20 rounded-lg" />
          </div>

          {/* Day cards */}
          {[0, 1].map((day) => (
            <div
              key={day}
              className="overflow-hidden rounded-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between gap-3 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <SkeletonLine className="h-9 w-9 rounded-xl" />
                  <SkeletonLine className="h-4 w-24" />
                </div>
                <SkeletonLine className="h-3 w-20" />
              </div>

              <div className="grid grid-cols-1 gap-3 p-3 xl:grid-cols-2 sm:p-4">
                {[0, 1, 2].map((meal) => (
                  <div
                    key={meal}
                    className="space-y-4 rounded-2xl border border-slate-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <SkeletonLine className="h-8 w-8 rounded-lg" />
                      <SkeletonLine className="h-4 w-20" />
                    </div>

                    <div className="flex gap-2">
                      <SkeletonLine className="h-11 flex-1 rounded-xl" />
                      <SkeletonLine className="h-11 w-20 rounded-xl" />
                    </div>

                    <SkeletonLine className="h-8 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom action skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex gap-2">
          <SkeletonLine className="h-10 w-28 rounded-xl" />
          <SkeletonLine className="h-10 w-32 rounded-xl" />
        </div>
        <SkeletonLine className="h-3 w-20" />
      </div>

      <p className="text-center text-xs text-slate-400">
        در حال آماده‌سازی محیط برنامه غذایی...
      </p>
    </div>
  );
}

/* ───────────────────────── FoodInput ───────────────────────── */

function foodKcal(food) {
  return Number(food?.energy_kcal || food?.current_revision?.energy_kcal) || 0;
}

function buildOptions(value, foods) {
  const query = norm(value);
  const named = foods.filter((food) => food?.name);
  const bank = named
    .filter((food) => food.coach_profile_id == null)
    .map((food) => ({
      name: food.name.trim(),
      kcal: foodKcal(food),
      source: "bank",
    }));
  const mine = named
    .filter((food) => food.coach_profile_id != null)
    .map((food) => ({
      name: food.name.trim(),
      kcal: foodKcal(food),
      source: "mine",
    }));

  const known = new Set([...bank, ...mine].map((food) => norm(food.name)));

  const common = COMMON_FOODS
    .filter((food) => !known.has(norm(food.name)))
    .map((food) => ({ ...food, source: "common" }));

  if (!query) {
    return [...bank.slice(0, 8), ...mine.slice(0, 4), ...common.slice(0, 4)];
  }

  const match = (food) => norm(food.name).includes(query);
  const starts = (food) => (norm(food.name).startsWith(query) ? 0 : 1);

  const found = [
    ...bank.filter(match),
    ...mine.filter(match),
    ...common.filter(match),
  ]
    .sort((a, b) => starts(a) - starts(b))
    .slice(0, 8);

  const exact = found.some((food) => norm(food.name) === query);

  if (!exact) {
    found.push({ name: value.trim(), source: "create" });
  }

  return found;
}

function FoodInput({ value, foods, autoFocus, onChange, onPick }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [navigated, setNavigated] = useState(false);

  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const options = useMemo(
    () => buildOptions(value, foods),
    [value, foods]
  );

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    function away(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);

    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("touchstart", away);
    };
  }, []);

  function choose(option) {
    onPick(option);
    setOpen(false);
    setNavigated(false);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setNavigated(true);
      setActive((current) =>
        Math.min(current + 1, options.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setNavigated(true);
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();

      if (open && navigated && options[active]) {
        choose(options[active]);
      } else {
        setOpen(false);
      }
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
    }
  }

  const sections = [
    ["bank", "بانک غذا"],
    ["mine", "غذاهای شما"],
    ["common", "پیشنهاد رایج"],
    ["create", "غذای جدید"],
  ];

  return (
    <div ref={boxRef} className="relative min-w-0">
      <input
        ref={inputRef}
        className={field}
        placeholder="نام غذا را بنویس یا انتخاب کن"
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(0);
          setNavigated(false);
        }}
        onKeyDown={onKeyDown}
      />

      {open && options.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-[#E3E9F2] bg-white p-1.5 shadow-xl shadow-slate-200/70 sm:max-h-72">
          {sections.map(([source, label]) => {
            const rows = options
              .map((option, index) => ({ option, index }))
              .filter(({ option }) => option.source === source);

            if (!rows.length) return null;

            return (
              <div key={source}>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold text-[#94A3B8]">
                  {label}
                </p>

                {rows.map(({ option, index }) => (
                  <button
                    key={`${source}-${option.name}`}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(option);
                    }}
                    onTouchEnd={(event) => {
                      event.preventDefault();
                      choose(option);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-right text-xs transition sm:text-sm ${
                      index === active
                        ? "bg-blue-50 text-[#0B5ED7]"
                        : "text-[#334155] hover:bg-slate-50"
                    }`}
                  >
                    {source === "create" ? (
                      <span className="min-w-0">
                        افزودن «<b>{option.name}</b>» به‌عنوان غذای جدید
                      </span>
                    ) : (
                      <span className="min-w-0">{option.name}</span>
                    )}

                    <span className="shrink-0 text-[10px] text-[#94A3B8] sm:text-[11px]">
                      {source === "common" && `${toFa(option.grams)} گرم`}
                      {(source === "mine" || source === "bank") &&
                        option.kcal > 0 &&
                        `${toFa(option.kcal)} کالری / ۱۰۰ گرم`}
                      {source === "create" && "＋"}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
          <p className="px-3 py-2 text-[10px] leading-5 text-[#94A3B8]">
            ارزش غذایی بانک:{" "}
            <a href="https://sorenfit.ir/calories" rel="nofollow" className="underline">
              سورن‌فیت
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function CoachMeal() {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();

  const forId = searchParams.get("for");
  const navigate = useNavigate();
  const isNew = planId === "new";

  const [forStudent, setForStudent] = useState(null);
  const [title, setTitle] = useState("برنامه غذا");
  const [days, setDays] = useState(() => [blankDay("شنبه")]);
  const [openDay, setOpenDay] = useState(undefined);
  const [plan, setPlan] = useState(null);
  const [foods, setFoods] = useState([]);
  const [students, setStudents] = useState([]);
  const [people, setPeople] = useState([]);
  const [holders, setHolders] = useState([]);
  const [editing, setEditing] = useState(isNew);
  const [studentId, setStudentId] = useState("");
  const [startsOn, setStartsOn] = useState(today);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    let active = true;

    const extras = Promise.all([
      api("/api/v1/coach/foods"),
      api("/api/v1/coach/relationships"),
      api("/api/v1/coach/meal-assignments"),
    ]);

    const planRequest = isNew
      ? Promise.resolve(null)
      : api(`/api/v1/coach/meal-plans/${planId}`);

    Promise.all([planRequest, extras]).then(
      ([body, [foodBody, relationshipBody, assignmentBody]]) => {
        if (!active) return;

        const relationships = relationshipBody?.relationships || [];

        setFoods(
          Array.isArray(foodBody?.foods) ? foodBody.foods : []
        );

        setPeople(relationships);

        setStudents(
          relationships.filter((row) => row.status === "active")
        );

        const target = forId
          ? relationships.find(
              (row) => String(row.id) === String(forId)
            )
          : null;

        setForStudent(
          target?.status === "active" ? target : null
        );

        if (!body && target?.status === "active") {
          const name = target.athlete?.display_name || "این شاگرد";
          setTitle(`برنامه غذا ${name}`);
        }

        if (forId && !target) {
          setError("این شاگرد پیدا نشد.");
        }

        if (target && target.status !== "active") {
          setError(
            "رابطه این شاگرد فعال نیست. برنامه برای او ثبت نمی‌شود."
          );
        }

        if (body) {
          setPlan(body);
          setTitle(body.title || "برنامه غذا");
          setDays(versionToDays(body.draft || body.current_version));
          setEditing(!body.current_version);

          const assignments = Array.isArray(
            assignmentBody?.assignments
          )
            ? assignmentBody.assignments
            : [];

          setHolders(
            assignments.filter(
              (row) => String(row.plan?.id) === String(body.id)
            )
          );
        }

        setLoaded(true);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
          setLoaded(true);
        }
      }
    );

    return () => {
      active = false;
    };
  }, [forId, isNew, planId]);

  const kcalByName = useMemo(() => {
    const map = new Map();

    for (const food of foods) {
      if (food?.name && foodKcal(food) > 0) {
        map.set(norm(food.name), foodKcal(food));
      }
    }

    return map;
  }, [foods]);

  const currentOpen =
    openDay === null
      ? null
      : days.some((day) => day.uid === openDay)
        ? openDay
        : days[0]?.uid;

  /* ── state updaters ── */

  function patchDay(dayIndex, patch) {
    setDays((current) =>
      current.map((day, index) =>
        index === dayIndex ? { ...day, ...patch } : day
      )
    );
  }

  function mapMeals(dayIndex, fn) {
    setDays((current) =>
      current.map((day, index) =>
        index === dayIndex
          ? { ...day, meals: fn(day.meals) }
          : day
      )
    );
  }

  function patchMeal(dayIndex, mealIndex, patch) {
    mapMeals(dayIndex, (meals) =>
      meals.map((meal, index) =>
        index === mealIndex ? { ...meal, ...patch } : meal
      )
    );
  }

  function patchItem(dayIndex, mealIndex, itemIndex, patch) {
    mapMeals(dayIndex, (meals) =>
      meals.map((meal, index) =>
        index === mealIndex
          ? {
              ...meal,
              items: meal.items.map((item, position) =>
                position === itemIndex
                  ? { ...item, ...patch }
                  : item
              ),
            }
          : meal
      )
    );
  }

  function addItem(dayIndex, mealIndex) {
    mapMeals(dayIndex, (meals) =>
      meals.map((meal, index) =>
        index === mealIndex
          ? { ...meal, items: [...meal.items, blankItem(true)] }
          : meal
      )
    );
  }

  function removeItem(dayIndex, mealIndex, itemIndex) {
    mapMeals(dayIndex, (meals) =>
      meals.map((meal, index) => {
        if (index !== mealIndex) return meal;

        const items = meal.items.filter(
          (_, position) => position !== itemIndex
        );

        return {
          ...meal,
          items: items.length ? items : [blankItem()],
        };
      })
    );
  }

  function pickFood(dayIndex, mealIndex, itemIndex, option) {
    const item = days[dayIndex]?.meals[mealIndex]?.items[itemIndex];
    const patch = { name: option.name };

    if (
      option.grams &&
      item &&
      (item.grams === "" || item.grams === "100")
    ) {
      patch.grams = String(option.grams);
    }

    patchItem(dayIndex, mealIndex, itemIndex, patch);
  }

  function addMeal(dayIndex, preset) {
    mapMeals(dayIndex, (meals) => {
      if (!preset) {
        return [
          ...meals,
          blankMeal("snack", `وعده ${meals.length + 1}`, true),
        ];
      }

      const meal = blankMeal(preset.type, preset.title, true);

      const at = meals.findIndex(
        (row) => row.rank !== undefined && row.rank > meal.rank
      );

      if (at === -1) return [...meals, meal];

      return [
        ...meals.slice(0, at),
        meal,
        ...meals.slice(at),
      ];
    });
  }

  function removeMeal(dayIndex, mealIndex) {
    const meal = days[dayIndex]?.meals[mealIndex];
    const hasFood = meal?.items.some((item) => item.name.trim());

    if (
      hasFood &&
      !window.confirm(
        `«${meal.title || mealLabel(meal.type)}» پاک شود؟ غذاهای داخلش هم حذف می‌شوند.`
      )
    ) {
      return;
    }

    mapMeals(dayIndex, (meals) =>
      meals.filter((_, index) => index !== mealIndex)
    );
  }

  function addDay() {
    const day = blankDay(
      WEEK[days.length] || `روز ${days.length + 1}`
    );

    setDays((current) => [...current, day]);
    setOpenDay(day.uid);
  }

  function duplicateDay(dayIndex) {
    const copy = cloneDay(days[dayIndex]);

    setDays((current) => [
      ...current.slice(0, dayIndex + 1),
      copy,
      ...current.slice(dayIndex + 1),
    ]);

    setOpenDay(copy.uid);
  }

  function removeDay(dayIndex) {
    const day = days[dayIndex];

    const hasFood = day.meals.some((meal) =>
      meal.items.some((item) => item.name.trim())
    );

    if (
      hasFood &&
      !window.confirm(
        `«${day.title || "این روز"}» با همهٔ وعده‌هایش پاک شود؟`
      )
    ) {
      return;
    }

    setDays((current) =>
      current.filter((_, index) => index !== dayIndex)
    );
  }

  /* ── save logic ── */

  async function foodFor(name, library) {
    const trimmed = name.trim();

    const found = library.find(
      (food) => norm(food.name) === norm(trimmed)
    );

    if (found) return found;

    const created = await api("/api/v1/coach/foods", {
      method: "POST",
      body: {
        name: trimmed,
        basis: "per_100g",
        unit_code: "g",
        unit_label: "گرم",
        energy_kcal: 0,
        protein_mg: 0,
        carbohydrate_mg: 0,
        fat_mg: 0,
      },
    });

    library.push(created);
    return created;
  }

  async function daysPayload(library) {
    const prepared = [];

    for (const day of days) {
      const meals = [];

      for (const meal of day.meals) {
        const named = meal.items.filter((item) =>
          item.name.trim()
        );

        if (!named.length) continue;

        const items = [];

        for (const item of named) {
          const food = await foodFor(item.name, library);
          const grams = Number(item.grams || "100");

          if (!Number.isInteger(grams) || grams < 1) {
            throw new Error(
              `گرم «${item.name}» باید عدد باشد.`
            );
          }

          items.push({
            position: items.length,
            food_id: food.id,
            quantity_g: grams,
          });
        }

        meals.push({
          position: meals.length,
          meal_type: meal.type,
          title: meal.title.trim() || mealLabel(meal.type),
          items,
        });
      }

      if (!meals.length) continue;

      prepared.push({
        position: prepared.length,
        title: day.title.trim() || `روز ${prepared.length + 1}`,
        meals,
      });
    }

    if (!prepared.length) {
      throw new Error("حداقل یک وعده با نام غذا بنویس.");
    }

    return prepared;
  }

  async function persist() {
    const library = foods.slice();

    const payload = {
      title: title.trim() || "برنامه غذا",
      days: await daysPayload(library),
    };

    let saved;

    if (isNew) {
      saved = await api("/api/v1/coach/meal-plans", {
        method: "POST",
        body: payload,
      });
    } else {
      let current = plan;

      if (!current) {
        throw new Error("برنامه پیدا نشد.");
      }

      if (current.current_version_id && !current.draft) {
        current = await api(
          `/api/v1/coach/meal-plans/${current.id}/draft`,
          { method: "POST" }
        );
      }

      saved = await api(
        `/api/v1/coach/meal-plans/${current.id}`,
        { method: "PATCH", body: payload }
      );
    }

    setFoods(library);
    setPlan(saved);
    setTitle(saved.title || payload.title);
    setDays(versionToDays(saved.draft || saved.current_version));

    return saved;
  }

  async function save(event) {
    event?.preventDefault();

    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const saved = await persist();

      if (isNew) {
        navigate(
          `/coach/nutrition/${saved.id}${forId ? `?for=${forId}` : ""}`,
          { replace: true }
        );
        return;
      }

      setNotice(
        "ذخیره شد. تا وقتی برای شاگرد ثبتش نکنی، او این ویرایش را نمی‌بیند."
      );
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function markReady() {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const saved = await persist();

      const published = await api(
        `/api/v1/coach/meal-plans/${saved.id}/publish`,
        { method: "POST" }
      );

      setPlan(published);
      setDays(versionToDays(published.current_version));
      setEditing(false);

      if (forStudent) {
        const name =
          forStudent.athlete?.display_name || "این شاگرد";

        await api("/api/v1/coach/meal-assignments", {
          method: "POST",
          body: {
            coaching_relationship_id: forStudent.id,
            meal_plan_version_id: published.current_version_id,
            starts_on: today(),
          },
        });

        navigate(`/coach/athletes/${forStudent.id}`, {
          state: {
            programNotice: `برنامه غذا برای ${name} ثبت شد.`,
          },
        });

        return;
      }

      if (isNew) {
        navigate(`/coach/nutrition/${published.id}`, {
          replace: true,
        });
        return;
      }

      setNotice(
        "برنامه غذا آماده شد. از پایین آن را به شاگرد بده."
      );
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function give(event) {
    event.preventDefault();

    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await api("/api/v1/coach/meal-assignments", {
        method: "POST",
        body: {
          coaching_relationship_id: Number(studentId),
          meal_plan_version_id: plan.current_version_id,
          starts_on: startsOn,
        },
      });

      const body = await api(
        "/api/v1/coach/meal-assignments"
      );

      const assignments = Array.isArray(body?.assignments)
        ? body.assignments
        : [];

      setHolders(
        assignments.filter(
          (row) => String(row.plan?.id) === String(plan.id)
        )
      );

      setNotice("از این تاریخ این برنامه غذا دست شاگرد است.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  const viewVersion = plan?.current_version || plan?.draft;
  const viewDays = versionToDays(viewVersion);

  const totalMeals = days.reduce(
    (sum, day) => sum + dayStats(day, kcalByName).meals,
    0
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full overflow-x-hidden bg-[#F5F7FB]"
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 gap-3 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <Navbar />
        </aside>

        {/* Main */}
        <main className="min-w-0 py-1 sm:py-2 lg:py-3">
          <div className="grid min-w-0 grid-cols-12 gap-3 sm:gap-5 lg:gap-6">
            {/* Header */}
            <div className="col-span-12 min-w-0">
              <HeaderDashBoard
                title={
                  forStudent
                    ? `برنامه غذا برای ${
                        forStudent.athlete?.display_name || "این شاگرد"
                      }`
                    : isNew
                      ? "نوشتن برنامه غذا"
                      : title || "برنامه غذا"
                }
                description={
                  forStudent
                    ? "این برنامه فقط برای همین شاگرد نوشته می‌شود. با تمام شدن، مستقیم در برنامه‌های او قرار می‌گیرد."
                    : "روز، وعده، نام غذا و گرم. تعداد وعده‌ها را خودت تعیین کن."
                }
              />
            </div>

            {/* Back link */}
            <div className="col-span-12 min-w-0">
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 sm:inline-flex sm:items-center">
                {forStudent ? (
                  <Link
                    to={`/coach/athletes/${forStudent.id}`}
                    className="inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-[#007BFF] transition hover:text-blue-700 sm:text-sm"
                  >
                    <span>→</span>
                    برگشت به صفحهٔ این شاگرد
                  </Link>
                ) : (
                  <Link
                    to="/coach/nutrition"
                    className="inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-[#007BFF] transition hover:text-blue-700 sm:text-sm"
                  >
                    <span>→</span>
                    برگشت به برنامه‌های غذا
                  </Link>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="col-span-12 min-w-0">
                <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-right text-xs leading-7 text-red-700 sm:rounded-3xl sm:px-6 sm:py-4 sm:text-sm">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                    !
                  </span>
                  <p className="min-w-0">{error}</p>
                </div>
              </div>
            )}

            {/* Notice */}
            {notice && (
              <div className="col-span-12 min-w-0">
                <div className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-right text-xs leading-7 text-green-700 sm:rounded-3xl sm:px-6 sm:py-4 sm:text-sm">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                    ✓
                  </span>
                  <p className="min-w-0">{notice}</p>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {!loaded && <MealPlanSkeleton />}

            {/* ───────── View mode ───────── */}
            {loaded && !editing && viewVersion && (
              <section className="col-span-12 min-w-0 overflow-hidden rounded-2xl border border-[#E9EDF4] bg-white p-3 text-right shadow-sm sm:rounded-3xl sm:p-5 lg:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-bold text-[#263445] sm:text-lg">
                      {plan.title}
                    </h2>
                    <p className="mt-1 text-[11px] text-[#94A3B8] sm:text-xs">
                      برنامه‌ای که الان فعال است
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDays(
                        versionToDays(plan.draft || plan.current_version)
                      );
                      setEditing(true);
                    }}
                    className="min-h-11 w-full rounded-xl bg-[#007BFF] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 sm:w-auto sm:text-sm"
                  >
                    ویرایش برنامه
                  </button>
                </div>

                <div className="space-y-3">
                  {viewDays.map((day, dayIndex) => {
                    const mealsWithFood = day.meals.filter((meal) =>
                      meal.items.some((item) => item.name)
                    );

                    return (
                      <details
                        key={day.uid}
                        open={dayIndex === 0}
                        className="group overflow-hidden rounded-2xl border border-[#E9EDF4] bg-white"
                      >
                        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 bg-[#F8FAFD] px-3 py-3 transition hover:bg-[#F1F6FC] sm:px-4">
                          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#007BFF]">
                              {toFa(dayIndex + 1)}
                            </span>
                            <span className="truncate text-xs font-semibold text-[#334155] sm:text-sm">
                              {day.title}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                            <span className="text-[10px] text-[#94A3B8] sm:text-xs">
                              {toFa(mealsWithFood.length)} وعده
                            </span>
                            <span className="text-xs text-[#94A3B8] transition-transform group-open:rotate-180">
                              ▼
                            </span>
                          </div>
                        </summary>

                        <div className="divide-y divide-[#F1F3F7] px-3 sm:px-4">
                          {mealsWithFood.map((meal) => {
                            const named = meal.items.filter(
                              (item) => item.name
                            );

                            const style =
                              MEAL_STYLES[meal.type] || DEFAULT_STYLE;

                            return (
                              <div
                                key={meal.uid}
                                className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-start"
                              >
                                <div className="flex w-full shrink-0 items-center gap-2 sm:w-36 sm:pt-1">
                                  <span>{style.icon}</span>
                                  <span className="text-xs font-bold text-[#64748B]">
                                    {meal.title}
                                  </span>
                                </div>

                                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                                  {named.map((item) => (
                                    <div
                                      key={item.uid}
                                      className="flex max-w-full items-center gap-2 rounded-xl border border-[#E9EDF4] bg-[#FAFBFD] px-3 py-2"
                                    >
                                      <span className="break-words text-xs font-medium text-[#334155]">
                                        {item.name}
                                      </span>
                                      <span className="shrink-0 text-[10px] text-[#007BFF] sm:text-[11px]">
                                        {item.grams
                                          ? toFa(item.grams)
                                          : "—"}{" "}
                                        گرم
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ───────── Edit mode ───────── */}
            {loaded && editing && (
              <form
                onSubmit={save}
                className="col-span-12 min-w-0 overflow-visible rounded-2xl border border-[#E9EDF4] bg-white text-right shadow-sm sm:rounded-3xl"
              >
                {/* Form header */}
                <div className="flex flex-col gap-3 border-b border-[#EDF1F7] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:p-6">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#263445] sm:text-lg">
                      {isNew
                        ? "برنامه غذایی جدید"
                        : "ویرایش برنامه غذایی"}
                    </h2>
                    <p className="mt-1 text-[11px] leading-6 text-[#94A3B8] sm:text-xs">
                      ۱) اسم برنامه ۲) وعده‌های هر روز ۳) غذا و گرم هر وعده
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-[#007BFF]">
                    🥗 تغذیه
                  </span>
                </div>

                <div className="min-w-0 p-3 sm:p-5 lg:p-6">
                  {/* Plan title */}
                  <label className="grid w-full max-w-xl gap-2 text-xs font-semibold text-[#64748B]">
                    نام برنامه غذایی
                    <input
                      className={field}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="مثلاً برنامه افزایش حجم"
                      required
                    />
                  </label>

                  {/* Days */}
                  <div className="mt-5 space-y-3 sm:mt-6">
                    {days.map((day, dayIndex) => {
                      const stats = dayStats(day, kcalByName);
                      const isOpen = day.uid === currentOpen;

                      const usedTitles = new Set(
                        day.meals.map((meal) => meal.title.trim())
                      );

                      const freePresets = PRESETS.filter(
                        (preset) => !usedTitles.has(preset.title)
                      );

                      return (
                        <section
                          key={day.uid}
                          className="min-w-0 overflow-visible rounded-2xl border border-[#E9EDF4] bg-white"
                        >
                          {/* Day header */}
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() =>
                              setOpenDay(isOpen ? null : day.uid)
                            }
                            className={`flex min-h-14 w-full items-center justify-between gap-2 bg-[#F8FAFD] px-3 py-3 text-right transition hover:bg-[#F1F6FC] sm:gap-3 sm:px-4 ${
                              isOpen ? "rounded-t-2xl" : "rounded-2xl"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#007BFF]">
                                {toFa(dayIndex + 1)}
                              </span>

                              <span className="truncate text-xs font-semibold text-[#334155] sm:text-sm">
                                {day.title ||
                                  `روز ${toFa(dayIndex + 1)}`}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 text-[10px] text-[#94A3B8] sm:gap-3 sm:text-xs">
                              <span>
                                {toFa(stats.meals)} وعده ·{" "}
                                {toFa(stats.foods)} غذا
                              </span>

                              {stats.kcal > 0 && (
                                <span className="hidden sm:inline">
                                  ≈ {toFa(stats.kcal)} کالری
                                </span>
                              )}

                              <span
                                className={`transition-transform ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              >
                                ▼
                              </span>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="min-w-0 space-y-4 border-t border-[#EDF1F7] p-3 sm:p-4">
                              {/* Day title and actions */}
                              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <label className="grid w-full min-w-0 gap-1.5 text-xs font-medium text-[#64748B] sm:max-w-xs">
                                  عنوان روز
                                  <input
                                    className={field}
                                    value={day.title}
                                    onChange={(event) =>
                                      patchDay(dayIndex, {
                                        title: event.target.value,
                                      })
                                    }
                                    placeholder="مثلاً شنبه یا روز تمرین"
                                  />
                                </label>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      duplicateDay(dayIndex)
                                    }
                                    className="min-h-10 flex-1 rounded-xl border border-[#E3E9F2] px-3 py-2 text-[11px] font-semibold text-[#475569] transition hover:bg-slate-50 sm:flex-none sm:text-xs"
                                  >
                                    کپی این روز
                                  </button>

                                  {days.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeDay(dayIndex)
                                      }
                                      className="min-h-10 flex-1 rounded-xl px-3 py-2 text-[11px] font-semibold text-red-500 transition hover:bg-red-50 sm:flex-none sm:text-xs"
                                    >
                                      حذف روز
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Empty meals */}
                              {day.meals.length === 0 && (
                                <p className="rounded-xl bg-[#F8FAFD] px-4 py-6 text-center text-xs leading-6 text-[#94A3B8] sm:text-sm">
                                  هنوز وعده‌ای نداری. از پایین یک وعده اضافه کن.
                                </p>
                              )}

                              {/* Meal cards */}
                              <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
                                {day.meals.map((meal, mealIndex) => {
                                  const style =
                                    MEAL_STYLES[meal.type] ||
                                    DEFAULT_STYLE;

                                  const filled = meal.items.filter(
                                    (item) => item.name.trim()
                                  ).length;

                                  return (
                                    <div
                                      key={meal.uid}
                                      className={`min-w-0 rounded-2xl border ${style.border} bg-white`}
                                    >
                                      {/* Meal header */}
                                      <div
                                        className={`flex min-w-0 items-center gap-2 rounded-t-2xl px-2.5 py-2.5 sm:px-3 ${style.head}`}
                                      >
                                        <span className="shrink-0 text-base sm:text-lg">
                                          {style.icon}
                                        </span>

                                        <input
                                          value={meal.title}
                                          onChange={(event) =>
                                            patchMeal(
                                              dayIndex,
                                              mealIndex,
                                              {
                                                title: event.target.value,
                                              }
                                            )
                                          }
                                          placeholder="نام وعده"
                                          aria-label="نام وعده"
                                          className={`min-w-0 flex-1 border-b border-dashed border-transparent bg-transparent px-1 py-1 text-xs font-bold outline-none transition hover:border-current focus:border-current sm:text-sm ${style.text}`}
                                        />

                                        <select
                                          value={meal.type}
                                          onChange={(event) =>
                                            patchMeal(
                                              dayIndex,
                                              mealIndex,
                                              {
                                                type: event.target.value,
                                              }
                                            )
                                          }
                                          aria-label="نوع وعده"
                                          title="نوع وعده"
                                          className="max-w-[88px] shrink-0 rounded-lg border border-white/70 bg-white/70 px-1.5 py-2 text-[10px] text-[#64748B] outline-none sm:max-w-none sm:px-2 sm:text-[11px]"
                                        >
                                          {MEALS.map(([value, label]) => (
                                            <option
                                              key={value}
                                              value={value}
                                            >
                                              {label}
                                            </option>
                                          ))}
                                        </select>

                                        <span className="hidden shrink-0 text-[11px] text-[#94A3B8] sm:inline">
                                          {toFa(filled)} غذا
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeMeal(
                                              dayIndex,
                                              mealIndex
                                            )
                                          }
                                          aria-label="حذف وعده"
                                          title="حذف وعده"
                                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-[#94A3B8] transition hover:bg-white hover:text-red-500"
                                        >
                                          ✕
                                        </button>
                                      </div>

                                      {/* Food rows */}
                                      <div className="min-w-0 space-y-3 p-2.5 sm:p-3">
                                        {meal.items.map(
                                          (item, itemIndex) => (
                                            <div
                                              key={item.uid}
                                              className="grid min-w-0 grid-cols-[minmax(0,1fr)_82px_26px] items-start gap-1.5 sm:grid-cols-[minmax(0,1fr)_100px_30px] sm:gap-2"
                                            >
                                              <FoodInput
                                                value={item.name}
                                                foods={foods}
                                                autoFocus={item.autoFocus}
                                                onChange={(name) =>
                                                  patchItem(
                                                    dayIndex,
                                                    mealIndex,
                                                    itemIndex,
                                                    { name }
                                                  )
                                                }
                                                onPick={(option) =>
                                                  pickFood(
                                                    dayIndex,
                                                    mealIndex,
                                                    itemIndex,
                                                    option
                                                  )
                                                }
                                              />

                                              <div className="relative min-w-0">
                                                <input
                                                  className={`${field} px-2 pl-7 text-center`}
                                                  inputMode="numeric"
                                                  placeholder="مقدار"
                                                  aria-label="مقدار به گرم"
                                                  value={item.grams}
                                                  onChange={(event) =>
                                                    patchItem(
                                                      dayIndex,
                                                      mealIndex,
                                                      itemIndex,
                                                      {
                                                        grams:
                                                          event.target.value.replace(
                                                            /[^\d]/g,
                                                            ""
                                                          ),
                                                      }
                                                    )
                                                  }
                                                />

                                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#94A3B8] sm:text-[10px]">
                                                  گرم
                                                </span>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeItem(
                                                    dayIndex,
                                                    mealIndex,
                                                    itemIndex
                                                  )
                                                }
                                                aria-label="حذف غذا"
                                                className="mt-2 flex h-7 w-7 items-center justify-center rounded-lg text-xs text-[#CBD5E1] transition hover:bg-red-50 hover:text-red-500 sm:mt-2.5"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          )
                                        )}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            addItem(dayIndex, mealIndex)
                                          }
                                          className="min-h-10 w-full rounded-xl border border-dashed border-[#D9E8FA] py-2 text-xs font-semibold text-[#007BFF] transition hover:bg-blue-50"
                                        >
                                          + افزودن غذا
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Add meal */}
                              <div className="rounded-2xl bg-[#F8FAFD] p-3 sm:p-4">
                                <p className="mb-3 text-xs font-semibold text-[#64748B]">
                                  + افزودن وعده به این روز
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  {freePresets.map((preset) => (
                                    <button
                                      key={preset.title}
                                      type="button"
                                      onClick={() =>
                                        addMeal(dayIndex, preset)
                                      }
                                      className="min-h-9 rounded-full border border-[#D9E8FA] bg-white px-3 py-2 text-[11px] font-semibold text-[#007BFF] transition hover:bg-blue-50 sm:text-xs"
                                    >
                                      {
                                        (
                                          MEAL_STYLES[preset.type] ||
                                          DEFAULT_STYLE
                                        ).icon
                                      }{" "}
                                      {preset.title}
                                    </button>
                                  ))}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      addMeal(dayIndex, null)
                                    }
                                    className="min-h-9 rounded-full border border-dashed border-[#B8D6FA] bg-white px-3 py-2 text-[11px] font-semibold text-[#475569] transition hover:bg-blue-50 sm:text-xs"
                                  >
                                    وعدهٔ دلخواه
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>

                  {/* Add day */}
                  <button
                    type="button"
                    onClick={addDay}
                    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#B8D6FA] bg-blue-50/40 py-3 text-xs font-semibold text-[#007BFF] transition hover:bg-blue-50 sm:text-sm"
                  >
                    <span className="text-lg">+</span>
                    افزودن روز جدید
                  </button>
                </div>

                {/* Bottom actions */}
                <div className="sticky bottom-0 z-20 flex flex-col gap-3 rounded-b-2xl border-t border-[#EDF1F7] bg-white/95 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      <button
                        type="submit"
                        disabled={pending}
                        className="min-h-11 rounded-xl bg-[#F1F5F9] px-3 py-2.5 text-xs font-semibold text-[#334155] transition hover:bg-[#E2E8F0] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:text-sm"
                      >
                        {pending ? "در حال ذخیره..." : "ذخیره پیش‌نویس"}
                      </button>

                      <button
                        type="button"
                        disabled={pending}
                        onClick={markReady}
                        className="min-h-11 rounded-xl bg-[#007BFF] px-3 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:text-sm"
                      >
                        {forStudent
                          ? `ثبت برای ${
                              forStudent.athlete?.display_name ||
                              "این شاگرد"
                            }`
                          : "آماده‌سازی برای شاگرد"}
                      </button>
                    </div>

                    <span className="text-center text-[11px] text-[#94A3B8] sm:text-right sm:text-xs">
                      {toFa(days.length)} روز · {toFa(totalMeals)} وعده
                    </span>
                  </div>

                  {plan?.current_version && (
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="min-h-10 rounded-xl px-4 py-2 text-xs text-[#94A3B8] transition hover:bg-gray-50 hover:text-[#475569] sm:text-sm"
                    >
                      انصراف از ویرایش
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* ───────── Assign plan ───────── */}
            {plan?.current_version_id && (
              <section className="col-span-12 min-w-0 overflow-hidden rounded-2xl border border-[#E9EDF4] bg-white p-4 text-right shadow-sm sm:rounded-3xl sm:p-6 lg:p-7">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-[#4B5563] sm:text-xl">
                    دادن همین برنامه غذا به شاگرد
                  </h2>
                  <p className="mt-1 text-[11px] leading-6 text-[#94A3B8] sm:text-xs">
                    برنامه منتشرشده را برای یکی از شاگردان فعال ثبت کن.
                  </p>
                </div>

                <form
                  onSubmit={give}
                  className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3 md:items-end"
                >
                  <label className="grid min-w-0 gap-2 text-xs font-medium text-[#64748B]">
                    انتخاب شاگرد
                    <select
                      required
                      value={studentId}
                      onChange={(event) =>
                        setStudentId(event.target.value)
                      }
                      className={field}
                    >
                      <option value="">شاگرد را انتخاب کن</option>
                      {students.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.athlete?.display_name || "شاگرد"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid min-w-0 gap-2 text-xs font-medium text-[#64748B]">
                    تاریخ شروع
                    <JalaliField
                      required
                      value={startsOn}
                      onChange={setStartsOn}
                      className={field}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={pending || students.length === 0}
                    className="min-h-11 rounded-xl bg-[#007BFF] px-5 py-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                  >
                    {pending ? "در حال ثبت..." : "بده به این شاگرد"}
                  </button>
                </form>

                {/* Assignment history */}
                {holders.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <h3 className="mb-3 text-xs font-bold text-[#64748B] sm:text-sm">
                      تاریخچه تخصیص برنامه
                    </h3>

                    <ul className="space-y-2">
                      {holders.map((row) => {
                        const person = people.find(
                          (item) =>
                            String(item.id) ===
                            String(row.coaching_relationship_id)
                        );

                        return (
                          <li
                            key={row.id}
                            className="flex min-w-0 flex-col gap-2 rounded-xl bg-[#F8FAFD] p-3 text-xs text-[#4B5563] sm:flex-row sm:items-center sm:justify-between"
                          >
                            <Link
                              to={`/coach/athletes/${row.coaching_relationship_id}`}
                              className="font-semibold text-[#007BFF] hover:text-blue-700"
                            >
                              {person?.athlete?.display_name || "شاگرد"}
                            </Link>

                            <span className="text-[11px] text-[#64748B] sm:text-xs">
                              از {showDate(row.starts_on)} ·{" "}
                              {row.status === "active"
                                ? "الان دست اوست"
                                : "تمام شده"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
