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

// پیشنهادهای سریع برای اضافه کردن وعده (به ترتیب منطقی روز)
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
const DEFAULT_STYLE = { icon: "🍽️", head: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" };

// غذاهای رایج برای پیشنهاد (وقتی مربی هنوز چیزی ننوشته یا کتابخانه‌اش خالی است)
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

const field = "w-full rounded-2xl border border-[#F0F2F5] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-blue-100";

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
  if (caught instanceof ApiError) {
    return caught.message;
  }

  if (caught instanceof Error && caught.message) {
    return caught.message;
  }

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
  return { uid: uid(), type, title, rank: rankOf(title), items: [blankItem(autoFocus)] };
}

function blankDay(title) {
  // پیش‌فرض: سه وعده اصلی. مربی هر تعداد دلخواه می‌تواند اضافه یا کم کند.
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
      const type = MEALS.some(([value]) => value === meal.meal_type) ? meal.meal_type : "snack";
      const title = meal.title || mealLabel(type);
      const items = (meal.items || []).map((item) => ({
        uid: uid(),
        name: item.food?.name || "",
        grams: item.quantity_g == null ? "" : String(item.quantity_g),
      }));

      return { uid: uid(), type, title, rank: rankOf(title), items: items.length ? items : [blankItem()] };
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
      items: meal.items.map((item) => ({ ...item, uid: uid(), autoFocus: false })),
    })),
  };
}

function dayStats(day, kcalByName) {
  let meals = 0;
  let foods = 0;
  let kcal = 0;

  for (const meal of day.meals) {
    const named = meal.items.filter((item) => item.name.trim());

    if (!named.length) {
      continue;
    }

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

/* ───────────────────────── FoodInput (suggestions) ───────────────────────── */

function buildOptions(value, foods) {
  const query = norm(value);
  const mine = foods
    .filter((food) => food?.name)
    .map((food) => ({ name: food.name.trim(), kcal: Number(food.energy_kcal) || 0, source: "mine" }));
  const mineNames = new Set(mine.map((food) => norm(food.name)));
  const common = COMMON_FOODS.filter((food) => !mineNames.has(norm(food.name))).map((food) => ({
    ...food,
    source: "common",
  }));

  if (!query) {
    return [...mine.slice(0, 6), ...common.slice(0, 8)];
  }

  const match = (food) => norm(food.name).includes(query);
  const starts = (food) => (norm(food.name).startsWith(query) ? 0 : 1);
  const found = [...mine.filter(match), ...common.filter(match)].sort((a, b) => starts(a) - starts(b)).slice(0, 8);
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
  const options = useMemo(() => buildOptions(value, foods), [value, foods]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
    // فقط هنگام ساخته شدن ردیف
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function away(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", away);

    return () => document.removeEventListener("mousedown", away);
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
      setActive((current) => Math.min(current + 1, options.length - 1));
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
    ["mine", "غذاهای شما"],
    ["common", "پیشنهاد رایج"],
    ["create", "غذای جدید"],
  ];

  return (
    <div ref={boxRef} className="relative">
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
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-[#E3E9F2] bg-white p-1.5 shadow-xl shadow-slate-200/70">
          {sections.map(([source, label]) => {
            const rows = options.map((option, index) => ({ option, index })).filter(({ option }) => option.source === source);

            if (!rows.length) {
              return null;
            }

            return (
              <div key={source}>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold text-[#94A3B8]">{label}</p>

                {rows.map(({ option, index }) => (
                  <button
                    key={`${source}-${option.name}`}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(option);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-right text-sm transition ${
                      index === active ? "bg-blue-50 text-[#0B5ED7]" : "text-[#334155]"
                    }`}
                  >
                    {source === "create" ? (
                      <span>
                        افزودن «<b>{option.name}</b>» به‌عنوان غذای جدید
                      </span>
                    ) : (
                      <span>{option.name}</span>
                    )}

                    <span className="shrink-0 text-[11px] text-[#94A3B8]">
                      {source === "common" && `${toFa(option.grams)} گرم`}
                      {source === "mine" && option.kcal > 0 && `${toFa(option.kcal)} کالری / ۱۰۰ گرم`}
                      {source === "create" && "＋"}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
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
  // undefined = هنوز چیزی انتخاب نشده (روز اول باز می‌شود) | null = مربی همه را بسته | uid = روز باز
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
    const planRequest = isNew ? Promise.resolve(null) : api(`/api/v1/coach/meal-plans/${planId}`);

    Promise.all([planRequest, extras]).then(
      ([body, [foodBody, relationshipBody, assignmentBody]]) => {
        if (!active) {
          return;
        }

        const relationships = relationshipBody?.relationships || [];
        setFoods(Array.isArray(foodBody?.foods) ? foodBody.foods : []);
        setPeople(relationships);
        setStudents(relationships.filter((row) => row.status === "active"));
        const target = forId ? relationships.find((row) => String(row.id) === String(forId)) : null;
        setForStudent(target?.status === "active" ? target : null);

        if (!body && target?.status === "active") {
          const name = target.athlete?.display_name || "این شاگرد";
          setTitle(`برنامه غذا ${name}`);
        }

        if (forId && !target) {
          setError("این شاگرد پیدا نشد.");
        }

        if (target && target.status !== "active") {
          setError("رابطه این شاگرد فعال نیست. برنامه برای او ثبت نمی‌شود.");
        }

        if (body) {
          setPlan(body);
          setTitle(body.title || "برنامه غذا");
          setDays(versionToDays(body.draft || body.current_version));
          setEditing(!body.current_version);
          const assignments = Array.isArray(assignmentBody?.assignments) ? assignmentBody.assignments : [];
          setHolders(assignments.filter((row) => String(row.plan?.id) === String(body.id)));
        }

        setLoaded(true);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
          setLoaded(true);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [forId, isNew, planId]);

  const kcalByName = useMemo(() => {
    const map = new Map();

    for (const food of foods) {
      if (food?.name && Number(food.energy_kcal) > 0) {
        map.set(norm(food.name), Number(food.energy_kcal));
      }
    }

    return map;
  }, [foods]);

  const currentOpen = openDay === null
    ? null
    : (days.some((day) => day.uid === openDay) ? openDay : days[0]?.uid);

  /* ── state updaters ── */

  function patchDay(dayIndex, patch) {
    setDays((current) => current.map((day, index) => (index === dayIndex ? { ...day, ...patch } : day)));
  }

  function mapMeals(dayIndex, fn) {
    setDays((current) => current.map((day, index) => (index === dayIndex ? { ...day, meals: fn(day.meals) } : day)));
  }

  function patchMeal(dayIndex, mealIndex, patch) {
    mapMeals(dayIndex, (meals) => meals.map((meal, index) => (index === mealIndex ? { ...meal, ...patch } : meal)));
  }

  function patchItem(dayIndex, mealIndex, itemIndex, patch) {
    mapMeals(dayIndex, (meals) =>
      meals.map((meal, index) =>
        index === mealIndex
          ? { ...meal, items: meal.items.map((item, position) => (position === itemIndex ? { ...item, ...patch } : item)) }
          : meal,
      ),
    );
  }

  function addItem(dayIndex, mealIndex) {
    mapMeals(dayIndex, (meals) =>
      meals.map((meal, index) => (index === mealIndex ? { ...meal, items: [...meal.items, blankItem(true)] } : meal)),
    );
  }

  function removeItem(dayIndex, mealIndex, itemIndex) {
    mapMeals(dayIndex, (meals) =>
      meals.map((meal, index) => {
        if (index !== mealIndex) {
          return meal;
        }

        const items = meal.items.filter((_, position) => position !== itemIndex);

        return { ...meal, items: items.length ? items : [blankItem()] };
      }),
    );
  }

  function pickFood(dayIndex, mealIndex, itemIndex, option) {
    const item = days[dayIndex]?.meals[mealIndex]?.items[itemIndex];
    const patch = { name: option.name };

    // اگر گرم هنوز دست نخورده، مقدار رایج همان غذا را بگذار
    if (option.grams && item && (item.grams === "" || item.grams === "100")) {
      patch.grams = String(option.grams);
    }

    patchItem(dayIndex, mealIndex, itemIndex, patch);
  }

  function addMeal(dayIndex, preset) {
    mapMeals(dayIndex, (meals) => {
      if (!preset) {
        return [...meals, blankMeal("snack", `وعده ${meals.length + 1}`, true)];
      }

      const meal = blankMeal(preset.type, preset.title, true);
      const at = meals.findIndex((row) => row.rank !== undefined && row.rank > meal.rank);

      if (at === -1) {
        return [...meals, meal];
      }

      return [...meals.slice(0, at), meal, ...meals.slice(at)];
    });
  }

  function removeMeal(dayIndex, mealIndex) {
    const meal = days[dayIndex]?.meals[mealIndex];
    const hasFood = meal?.items.some((item) => item.name.trim());

    if (hasFood && !window.confirm(`«${meal.title || mealLabel(meal.type)}» پاک شود؟ غذاهای داخلش هم حذف می‌شوند.`)) {
      return;
    }

    mapMeals(dayIndex, (meals) => meals.filter((_, index) => index !== mealIndex));
  }

  function addDay() {
    const day = blankDay(WEEK[days.length] || `روز ${days.length + 1}`);
    setDays((current) => [...current, day]);
    setOpenDay(day.uid);
  }

  function duplicateDay(dayIndex) {
    const copy = cloneDay(days[dayIndex]);
    setDays((current) => [...current.slice(0, dayIndex + 1), copy, ...current.slice(dayIndex + 1)]);
    setOpenDay(copy.uid);
  }

  function removeDay(dayIndex) {
    const day = days[dayIndex];
    const hasFood = day.meals.some((meal) => meal.items.some((item) => item.name.trim()));

    if (hasFood && !window.confirm(`«${day.title || "این روز"}» با همهٔ وعده‌هایش پاک شود؟`)) {
      return;
    }

    setDays((current) => current.filter((_, index) => index !== dayIndex));
  }

  /* ── save logic ── */

  async function foodFor(name, library) {
    const trimmed = name.trim();
    const found = library.find((food) => norm(food.name) === norm(trimmed));

    if (found) {
      return found;
    }

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
        const named = meal.items.filter((item) => item.name.trim());

        if (!named.length) {
          continue;
        }

        const items = [];

        for (const item of named) {
          const food = await foodFor(item.name, library);
          const grams = Number(item.grams || "100");

          if (!Number.isInteger(grams) || grams < 1) {
            throw new Error(`گرم «${item.name}» باید عدد باشد.`);
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

      if (!meals.length) {
        continue;
      }

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
      saved = await api("/api/v1/coach/meal-plans", { method: "POST", body: payload });
    } else {
      let current = plan;

      if (!current) {
        throw new Error("برنامه پیدا نشد.");
      }

      if (current.current_version_id && !current.draft) {
        current = await api(`/api/v1/coach/meal-plans/${current.id}/draft`, { method: "POST" });
      }

      saved = await api(`/api/v1/coach/meal-plans/${current.id}`, { method: "PATCH", body: payload });
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
        navigate(`/coach/nutrition/${saved.id}${forId ? `?for=${forId}` : ""}`, { replace: true });
        return;
      }

      setNotice("ذخیره شد. تا وقتی برای شاگرد ثبتش نکنی، او این ویرایش را نمی‌بیند.");
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
      const published = await api(`/api/v1/coach/meal-plans/${saved.id}/publish`, { method: "POST" });
      setPlan(published);
      setDays(versionToDays(published.current_version));
      setEditing(false);

      if (forStudent) {
        const name = forStudent.athlete?.display_name || "این شاگرد";
        await api("/api/v1/coach/meal-assignments", {
          method: "POST",
          body: {
            coaching_relationship_id: forStudent.id,
            meal_plan_version_id: published.current_version_id,
            starts_on: today(),
          },
        });
        navigate(`/coach/athletes/${forStudent.id}`, { state: { programNotice: `برنامه غذا برای ${name} ثبت شد.` } });
        return;
      }

      if (isNew) {
        navigate(`/coach/nutrition/${published.id}`, { replace: true });
        return;
      }

      setNotice("برنامه غذا آماده شد. از پایین آن را به شاگرد بده.");
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
      const body = await api("/api/v1/coach/meal-assignments");
      const assignments = Array.isArray(body?.assignments) ? body.assignments : [];
      setHolders(assignments.filter((row) => String(row.plan?.id) === String(plan.id)));
      setNotice("از این تاریخ این برنامه غذا دست شاگرد است.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  const viewVersion = plan?.current_version || plan?.draft;
  const viewDays = versionToDays(viewVersion);
  const totalMeals = days.reduce((sum, day) => sum + dayStats(day, kcalByName).meals, 0);

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard
              title={forStudent ? `برنامه غذا برای ${forStudent.athlete?.display_name || "این شاگرد"}` : (isNew ? "نوشتن برنامه غذا" : (title || "برنامه غذا"))}
              description={forStudent ? "این برنامه فقط برای همین شاگرد نوشته می‌شود. با تمام شدن، مستقیم در برنامه‌های او قرار می‌گیرد." : "روز، وعده، نام غذا و گرم. تعداد وعده‌ها را خودت تعیین کن، لازم نیست اول غذا را جدا بسازی."}
            />
            <div dir="rtl" className="col-span-12">
              {forStudent ? (
                <Link to={`/coach/athletes/${forStudent.id}`} className="text-sm text-[#007BFF]">برگشت به صفحهٔ این شاگرد</Link>
              ) : (
                <Link to="/coach/nutrition" className="text-sm text-[#007BFF]">برگشت به برنامه‌های غذا</Link>
              )}
            </div>
            {error && <p dir="rtl" className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p>}
            {notice && <p dir="rtl" className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700">{notice}</p>}
            {!loaded && <p dir="rtl" className="col-span-12 text-sm text-[#6B7280]">در حال آوردن برنامه...</p>}

            {/* ───────── حالت مشاهده ───────── */}
            {loaded && !editing && viewVersion && (
              <section dir="rtl" className="col-span-12 rounded-2xl border border-[#E9EDF4] bg-white p-5 text-right shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#263445]">{plan.title}</h2>
                    <p className="mt-1 text-xs text-[#94A3B8]">برنامه‌ای که الان فعال است</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDays(versionToDays(plan.draft || plan.current_version));
                      setEditing(true);
                    }}
                    className="rounded-xl bg-[#007BFF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    ویرایش برنامه
                  </button>
                </div>

                <div className="space-y-2">
                  {viewDays.map((day, dayIndex) => {
                    const mealsWithFood = day.meals.filter((meal) => meal.items.some((item) => item.name));

                    return (
                      <details
                        key={day.uid}
                        open={dayIndex === 0}
                        className="group overflow-hidden rounded-xl border border-[#E9EDF4] bg-white"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[#F8FAFD] px-4 py-3 hover:bg-[#F1F6FC]">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#007BFF]">
                              {toFa(dayIndex + 1)}
                            </span>
                            <span className="text-sm font-semibold text-[#334155]">{day.title}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#94A3B8]">{toFa(mealsWithFood.length)} وعده</span>
                            <span className="text-xs text-[#94A3B8] transition-transform group-open:rotate-180">▼</span>
                          </div>
                        </summary>

                        <div className="divide-y divide-[#F1F3F7] px-4">
                          {mealsWithFood.map((meal) => {
                            const named = meal.items.filter((item) => item.name);
                            const style = MEAL_STYLES[meal.type] || DEFAULT_STYLE;

                            return (
                              <div key={meal.uid} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                                <div className="flex w-36 shrink-0 items-center gap-2 pt-1">
                                  <span>{style.icon}</span>
                                  <span className="text-xs font-bold text-[#64748B]">{meal.title}</span>
                                </div>

                                <div className="flex flex-1 flex-wrap gap-2">
                                  {named.map((item) => (
                                    <div
                                      key={item.uid}
                                      className="flex items-center gap-2 rounded-lg border border-[#E9EDF4] bg-[#FAFBFD] px-3 py-2"
                                    >
                                      <span className="text-xs font-medium text-[#334155]">{item.name}</span>
                                      <span className="text-[11px] text-[#007BFF]">{item.grams ? toFa(item.grams) : "—"} گرم</span>
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

            {/* ───────── حالت ویرایش ───────── */}
            {loaded && editing && (
              <form
                dir="rtl"
                onSubmit={save}
                className="col-span-12 rounded-2xl border border-[#E9EDF4] bg-white text-right shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF1F7] p-5">
                  <div>
                    <h2 className="text-lg font-bold text-[#263445]">
                      {isNew ? "برنامه غذایی جدید" : "ویرایش برنامه غذایی"}
                    </h2>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      ۱) اسم برنامه ۲) وعده‌های هر روز ۳) غذا و گرم هر وعده
                    </p>
                  </div>

                  <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#007BFF]">🥗 تغذیه</span>
                </div>

                <div className="p-5">
                  <label className="grid max-w-xl gap-2 text-xs font-semibold text-[#64748B]">
                    نام برنامه غذایی
                    <input
                      className={field}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="مثلاً برنامه افزایش حجم"
                      required
                    />
                  </label>

                  <div className="mt-6 space-y-3">
                    {days.map((day, dayIndex) => {
                      const stats = dayStats(day, kcalByName);
                      const isOpen = day.uid === currentOpen;
                      const usedTitles = new Set(day.meals.map((meal) => meal.title.trim()));
                      const freePresets = PRESETS.filter((preset) => !usedTitles.has(preset.title));

                      return (
                        <section key={day.uid} className="rounded-xl border border-[#E9EDF4] bg-white">
                          {/* هدر روز */}
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpenDay(isOpen ? null : day.uid)}
                            className={`flex w-full items-center justify-between gap-3 bg-[#F8FAFD] px-4 py-3 text-right transition hover:bg-[#F1F6FC] ${
                              isOpen ? "rounded-t-xl" : "rounded-xl"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#007BFF]">
                                {toFa(dayIndex + 1)}
                              </span>
                              <span className="text-sm font-semibold text-[#334155]">{day.title || `روز ${toFa(dayIndex + 1)}`}</span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                              <span>{toFa(stats.meals)} وعده · {toFa(stats.foods)} غذا</span>
                              {stats.kcal > 0 && <span className="hidden sm:inline">≈ {toFa(stats.kcal)} کالری</span>}
                              <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="space-y-4 border-t border-[#EDF1F7] p-4">
                              {/* نام روز + عملیات روز */}
                              <div className="flex flex-wrap items-end justify-between gap-3">
                                <label className="grid w-full max-w-xs gap-1.5 text-xs font-medium text-[#64748B]">
                                  عنوان روز
                                  <input
                                    className={field}
                                    value={day.title}
                                    onChange={(event) => patchDay(dayIndex, { title: event.target.value })}
                                    placeholder="مثلاً شنبه یا روز تمرین"
                                  />
                                </label>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => duplicateDay(dayIndex)}
                                    className="rounded-lg border border-[#E3E9F2] px-3 py-2 text-xs font-semibold text-[#475569] transition hover:bg-slate-50"
                                  >
                                    کپی این روز
                                  </button>

                                  {days.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDay(dayIndex)}
                                      className="rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                                    >
                                      حذف روز
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* وعده‌ها */}
                              {day.meals.length === 0 && (
                                <p className="rounded-xl bg-[#F8FAFD] px-4 py-6 text-center text-sm text-[#94A3B8]">
                                  هنوز وعده‌ای نداری. از پایین یک وعده اضافه کن.
                                </p>
                              )}

                              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                {day.meals.map((meal, mealIndex) => {
                                  const style = MEAL_STYLES[meal.type] || DEFAULT_STYLE;
                                  const filled = meal.items.filter((item) => item.name.trim()).length;

                                  return (
                                    <div key={meal.uid} className={`rounded-2xl border ${style.border} bg-white`}>
                                      {/* هدر وعده */}
                                      <div className={`flex items-center gap-2 rounded-t-2xl px-3 py-2.5 ${style.head}`}>
                                        <span className="text-lg">{style.icon}</span>

                                        <input
                                          value={meal.title}
                                          onChange={(event) => patchMeal(dayIndex, mealIndex, { title: event.target.value })}
                                          placeholder="نام وعده"
                                          aria-label="نام وعده"
                                          className={`min-w-0 flex-1 border-b border-dashed border-transparent bg-transparent px-1 py-1 text-sm font-bold outline-none transition hover:border-current focus:border-current ${style.text}`}
                                        />

                                        <select
                                          value={meal.type}
                                          onChange={(event) => patchMeal(dayIndex, mealIndex, { type: event.target.value })}
                                          aria-label="نوع وعده"
                                          title="نوع وعده"
                                          className="rounded-lg border border-white/70 bg-white/70 px-2 py-1 text-[11px] text-[#64748B] outline-none"
                                        >
                                          {MEALS.map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                          ))}
                                        </select>

                                        <span className="hidden text-[11px] text-[#94A3B8] sm:inline">{toFa(filled)} غذا</span>

                                        <button
                                          type="button"
                                          onClick={() => removeMeal(dayIndex, mealIndex)}
                                          aria-label="حذف وعده"
                                          title="حذف وعده"
                                          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-[#94A3B8] transition hover:bg-white hover:text-red-500"
                                        >
                                          ✕
                                        </button>
                                      </div>

                                      {/* غذاها */}
                                      <div className="space-y-2 p-3">
                                        {meal.items.map((item, itemIndex) => (
                                          <div key={item.uid} className="grid grid-cols-[1fr_96px_28px] items-start gap-2">
                                            <FoodInput
                                              value={item.name}
                                              foods={foods}
                                              autoFocus={item.autoFocus}
                                              onChange={(name) => patchItem(dayIndex, mealIndex, itemIndex, { name })}
                                              onPick={(option) => pickFood(dayIndex, mealIndex, itemIndex, option)}
                                            />

                                            <div className="relative">
                                              <input
                                                className={`${field} pl-9`}
                                                inputMode="numeric"
                                                placeholder="مقدار"
                                                aria-label="مقدار به گرم"
                                                value={item.grams}
                                                onChange={(event) =>
                                                  patchItem(dayIndex, mealIndex, itemIndex, {
                                                    grams: event.target.value.replace(/[^\d]/g, ""),
                                                  })
                                                }
                                              />
                                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8]">
                                                گرم
                                              </span>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => removeItem(dayIndex, mealIndex, itemIndex)}
                                              aria-label="حذف غذا"
                                              className="mt-2.5 flex h-6 w-6 items-center justify-center rounded-md text-xs text-[#CBD5E1] transition hover:bg-red-50 hover:text-red-500"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))}

                                        <button
                                          type="button"
                                          onClick={() => addItem(dayIndex, mealIndex)}
                                          className="w-full rounded-lg border border-dashed border-[#D9E8FA] py-2 text-xs font-semibold text-[#007BFF] transition hover:bg-blue-50"
                                        >
                                          + افزودن غذا
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* افزودن وعده */}
                              <div className="rounded-xl bg-[#F8FAFD] p-3">
                                <p className="mb-2 text-xs font-semibold text-[#64748B]">+ افزودن وعده به این روز</p>
                                <div className="flex flex-wrap gap-2">
                                  {freePresets.map((preset) => (
                                    <button
                                      key={preset.title}
                                      type="button"
                                      onClick={() => addMeal(dayIndex, preset)}
                                      className="rounded-full border border-[#D9E8FA] bg-white px-3 py-1.5 text-xs font-semibold text-[#007BFF] transition hover:bg-blue-50"
                                    >
                                      {(MEAL_STYLES[preset.type] || DEFAULT_STYLE).icon} {preset.title}
                                    </button>
                                  ))}

                                  <button
                                    type="button"
                                    onClick={() => addMeal(dayIndex, null)}
                                    className="rounded-full border border-dashed border-[#B8D6FA] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] transition hover:bg-blue-50"
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

                  <button
                    type="button"
                    onClick={addDay}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#B8D6FA] bg-blue-50/40 py-3 text-sm font-semibold text-[#007BFF] transition hover:bg-blue-50"
                  >
                    <span className="text-lg">+</span>
                    افزودن روز جدید
                  </button>
                </div>

                {/* نوار پایین */}
                <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-[#EDF1F7] bg-white/95 p-4 backdrop-blur">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-xl bg-[#F1F5F9] px-5 py-2.5 text-sm font-semibold text-[#334155] transition hover:bg-[#E2E8F0] disabled:opacity-60"
                    >
                      {pending ? "در حال ذخیره..." : "ذخیره پیش‌نویس"}
                    </button>

                    <button
                      type="button"
                      disabled={pending}
                      onClick={markReady}
                      className="rounded-xl bg-[#007BFF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {forStudent
                        ? `ثبت برای ${forStudent.athlete?.display_name || "این شاگرد"}`
                        : "آماده‌سازی برای شاگرد"}
                    </button>

                    <span className="text-xs text-[#94A3B8]">
                      {toFa(days.length)} روز · {toFa(totalMeals)} وعده
                    </span>
                  </div>

                  {plan?.current_version && (
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-xl px-4 py-2.5 text-sm text-[#94A3B8] transition hover:bg-gray-50 hover:text-[#475569]"
                    >
                      انصراف
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* ───────── دادن برنامه به شاگرد ───────── */}
            {plan?.current_version_id && (
              <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
                <h2 className="text-xl font-primary text-[#4B5563]">دادن همین برنامه غذا به شاگرد</h2>
                <form onSubmit={give} className="mt-4 grid gap-3 md:grid-cols-3">
                  <select required value={studentId} onChange={(event) => setStudentId(event.target.value)} className={field}>
                    <option value="">شاگرد</option>
                    {students.map((row) => <option key={row.id} value={row.id}>{row.athlete?.display_name || "شاگرد"}</option>)}
                  </select>
                  <label className="grid gap-2 text-xs text-[#6B6F77]">
                    شروع
                    <JalaliField required value={startsOn} onChange={setStartsOn} className={field} />
                  </label>
                  <button type="submit" disabled={pending || students.length === 0} className="rounded-2xl bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-60">بده به این شاگرد</button>
                </form>
                <ul className="mt-4 space-y-2">
                  {holders.map((row) => {
                    const person = people.find((item) => String(item.id) === String(row.coaching_relationship_id));

                    return (
                      <li key={row.id} className="text-sm text-[#4B5563]">
                        <Link to={`/coach/athletes/${row.coaching_relationship_id}`} className="text-[#007BFF]">{person?.athlete?.display_name || "شاگرد"}</Link>
                        {` از ${showDate(row.starts_on)} · ${row.status === "active" ? "الان دست اوست" : "تمام شده"}`}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}