import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import JalaliField from "../../Components/shared/JalaliField/JalaliField";
import { showDate } from "../../lib/jalali";

const WEEK = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const MEALS = [
  ["breakfast", "صبحانه"],
  ["lunch", "ناهار"],
  ["dinner", "شام"],
  ["snack", "میان‌وعده"],
];
const field = "w-full rounded-2xl border border-[#F0F2F5] bg-white px-4 py-3 text-sm text-[#1F2937]";

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

function blankItem() {
  return { name: "", grams: "100" };
}

function blankDay(title) {
  return {
    title,
    meals: MEALS.filter(([type]) => type !== "snack").map(([type]) => ({ type, items: [blankItem()] })),
  };
}

function versionToDays(version) {
  if (!version?.days?.length) {
    return [blankDay("شنبه")];
  }

  return version.days.map((day) => ({
    title: day.title || "روز",
    meals: MEALS.map(([type]) => {
      const found = (day.meals || []).find((meal) => meal.meal_type === type);
      const items = (found?.items || []).map((item) => ({
        name: item.food?.name || "",
        grams: item.quantity_g == null ? "" : String(item.quantity_g),
      }));

      return { type, items: items.length ? items : [blankItem()] };
    }),
  }));
}

export default function CoachMeal() {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const forId = searchParams.get("for");
  const navigate = useNavigate();
  const isNew = planId === "new";
  const [forStudent, setForStudent] = useState(null);
  const [title, setTitle] = useState("برنامه غذا");
  const [days, setDays] = useState([blankDay("شنبه")]);
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

  function updateDay(dayIndex, patch) {
    setDays((current) => current.map((day, index) => (index === dayIndex ? { ...day, ...patch } : day)));
  }

  function updateItem(dayIndex, mealIndex, itemIndex, patch) {
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) {
        return day;
      }

      return {
        ...day,
        meals: day.meals.map((meal, mealPosition) => {
          if (mealPosition !== mealIndex) {
            return meal;
          }

          return {
            ...meal,
            items: meal.items.map((item, position) => (position === itemIndex ? { ...item, ...patch } : item)),
          };
        }),
      };
    }));
  }

  function addItem(dayIndex, mealIndex) {
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) {
        return day;
      }

      return {
        ...day,
        meals: day.meals.map((meal, position) => (
          position === mealIndex ? { ...meal, items: [...meal.items, blankItem()] } : meal
        )),
      };
    }));
  }

  async function foodFor(name, library) {
    const trimmed = name.trim();
    const found = library.find((food) => food.name.trim() === trimmed);

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
          title: mealLabel(meal.type),
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

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title={forStudent ? `برنامه غذا برای ${forStudent.athlete?.display_name || "این شاگرد"}` : (isNew ? "نوشتن برنامه غذا" : (title || "برنامه غذا"))} description={forStudent ? "این برنامه فقط برای همین شاگرد نوشته می‌شود. با تمام شدن، مستقیم در برنامه‌های او قرار می‌گیرد." : "روز، وعده، نام غذا و گرم. لازم نیست اول غذا را جدا بسازی."} />
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

         

{loaded && !editing && viewVersion && (
  <section dir="rtl" className="col-span-12 rounded-2xl border border-[#E9EDF4] bg-white p-5 text-right shadow-sm">

    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-[#263445]">{plan.title}</h2>
        <p className="mt-1 text-xs text-[#94A3B8]">
          مشاهده گزارش وعده‌های غذایی ورزشکار
        </p>
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
      {viewDays.map((day, dayIndex) => (
        <details
          key={day.title}
          open={dayIndex === 0}
          className="group overflow-hidden rounded-xl border border-[#E9EDF4] bg-white"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[#F8FAFD] px-4 py-3 hover:bg-[#F1F6FC]">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#007BFF]">
                {dayIndex + 1}
              </span>

              <span className="text-sm font-semibold text-[#334155]">
                {day.title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#94A3B8]">
                {day.meals.filter(meal => meal.items.some(item => item.name)).length} وعده
              </span>
              <span className="text-xs text-[#94A3B8] transition-transform group-open:rotate-180">
                ▼
              </span>
            </div>
          </summary>

          <div className="divide-y divide-[#F1F3F7] px-4">
            {day.meals.map((meal) => {
              const named = meal.items.filter(item => item.name);

              if (!named.length) return null;

              return (
                <div key={meal.type} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                  <div className="w-28 shrink-0 pt-1">
                    <span className="text-xs font-bold text-[#64748B]">
                      {mealLabel(meal.type)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-wrap gap-2">
                    {named.map((item) => (
                      <div
                        key={`${meal.type}-${item.name}`}
                        className="flex items-center gap-2 rounded-lg border border-[#E9EDF4] bg-[#FAFBFD] px-3 py-2"
                      >
                        <span className="text-xs font-medium text-[#334155]">
                          {item.name}
                        </span>

                        <span className="text-[11px] text-[#007BFF]">
                          {item.grams || "—"} گرم
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  </section>
)}



           


{loaded && editing && (
  <form
    dir="rtl"
    onSubmit={save}
    className="col-span-12 overflow-hidden rounded-2xl border border-[#E9EDF4] bg-white text-right shadow-sm"
  >
    {/* Header */}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF1F7] p-5">
      <div>
        <h2 className="text-lg font-bold text-[#263445]">
          ویرایش برنامه غذایی
        </h2>
        <p className="mt-1 text-xs text-[#94A3B8]">
          وعده‌ها و میزان مصرف مواد غذایی را تنظیم کن
        </p>
      </div>

      <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#007BFF]">
        🥗 تغذیه
      </span>
    </div>

    <div className="p-5">

      {/* Plan Title */}
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

      <p className="mt-3 text-xs text-[#94A3B8]">
        نام غذا را وارد کن و مقدار مصرف را بر حسب گرم مشخص کن.
        غذاهای قبلی نیز قابل انتخاب هستند.
      </p>

      <datalist id="food-names">
        {foods.map((food) => (
          <option key={food.id} value={food.name} />
        ))}
      </datalist>

      {/* Days Accordion */}
      <div className="mt-5 space-y-2">

        {days.map((day, dayIndex) => (
          <details
            key={dayIndex}
            open={dayIndex === 0}
            className="group overflow-hidden rounded-xl border border-[#E9EDF4] bg-white"
          >

            {/* Day Header */}
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[#F8FAFD] px-4 py-3 transition hover:bg-[#F1F6FC]">

              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#007BFF]">
                  {dayIndex + 1}
                </span>

                <span className="text-sm font-semibold text-[#334155]">
                  {day.title || `روز ${dayIndex + 1}`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#94A3B8]">
                  {day.meals.reduce(
                    (total, meal) =>
                      total + meal.items.filter(item => item.name).length,
                    0
                  )} غذا
                </span>

                <span className="text-xs text-[#94A3B8] transition-transform group-open:rotate-180">
                  ▼
                </span>
              </div>

            </summary>

            {/* Day Content */}
            <div className="space-y-4 border-t border-[#EDF1F7] p-4">

              {/* Day Name */}
              <label className="grid max-w-sm gap-1.5 text-xs font-medium text-[#64748B]">
                عنوان روز

                <input
                  className={field}
                  value={day.title}
                  onChange={(event) =>
                    updateDay(dayIndex, {
                      title: event.target.value
                    })
                  }
                  placeholder="نام روز"
                />
              </label>

              {/* Meals Cards */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

                {day.meals.map((meal, mealIndex) => {

                  const mealStyles = {
                    breakfast: {
                      icon: "🌅",
                      color: "bg-amber-50",
                      text: "text-amber-600",
                      border: "border-amber-100"
                    },
                    lunch: {
                      icon: "☀️",
                      color: "bg-orange-50",
                      text: "text-orange-600",
                      border: "border-orange-100"
                    },
                    dinner: {
                      icon: "🌙",
                      color: "bg-indigo-50",
                      text: "text-indigo-600",
                      border: "border-indigo-100"
                    },
                    snack: {
                      icon: "🍎",
                      color: "bg-emerald-50",
                      text: "text-emerald-600",
                      border: "border-emerald-100"
                    }
                  };

                  const style = mealStyles[meal.type] || {
                    icon: "🍽️",
                    color: "bg-blue-50",
                    text: "text-blue-600",
                    border: "border-blue-100"
                  };

                  return (
                    <div
                      key={meal.type}
                      className={`overflow-hidden rounded-2xl border ${style.border} bg-white`}
                    >

                      {/* Meal Header */}
                      <div className={`flex items-center justify-between px-4 py-3 ${style.color}`}>

                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {style.icon}
                          </span>

                          <span className={`text-sm font-bold ${style.text}`}>
                            {mealLabel(meal.type)}
                          </span>
                        </div>

                        <span className="text-[11px] text-[#94A3B8]">
                          {meal.items.filter(item => item.name).length} غذا
                        </span>

                      </div>

                      {/* Food Inputs */}
                      <div className="space-y-2 p-3">

                        {meal.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="grid grid-cols-[1fr_90px] gap-2"
                          >

                            <input
                              className={field}
                              list="food-names"
                              placeholder="نام غذا"
                              value={item.name}
                              onChange={(event) =>
                                updateItem(
                                  dayIndex,
                                  mealIndex,
                                  itemIndex,
                                  { name: event.target.value }
                                )
                              }
                            />

                            <div className="relative">
                              <input
                                className={`${field} pl-9`}
                                inputMode="numeric"
                                placeholder="مقدار"
                                value={item.grams}
                                onChange={(event) =>
                                  updateItem(
                                    dayIndex,
                                    mealIndex,
                                    itemIndex,
                                    { grams: event.target.value }
                                  )
                                }
                              />

                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8]">
                                گرم
                              </span>
                            </div>

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
            </div>
          </details>
        ))}

      </div>

      {/* Add Day */}
      <button
        type="button"
        onClick={() =>
          setDays((current) => [
            ...current,
            blankDay(WEEK[current.length] || `روز ${current.length + 1}`)
          ])
        }
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#B8D6FA] bg-blue-50/40 py-3 text-sm font-semibold text-[#007BFF] transition hover:bg-blue-50"
      >
        <span className="text-lg">+</span>
        افزودن روز جدید
      </button>

    </div>

    {/* Footer Actions */}
    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF1F7] bg-white/95 p-4 backdrop-blur">

      <div className="flex flex-wrap gap-2">

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#F1F5F9] px-5 py-2.5 text-sm font-semibold text-[#334155] transition hover:bg-[#E2E8F0] disabled:opacity-60"
        >
          ذخیره تغییرات
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
