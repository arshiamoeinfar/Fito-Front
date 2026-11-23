import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";

function isoToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
}

function fa(value, digits = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString("fa-IR", { maximumFractionDigits: digits });
}

function grams(mg) {
  if (mg == null) {
    return "—";
  }

  return `${fa(mg / 1000, 1)} گرم`;
}

function amountText(entry) {
  if (entry.quantity_g != null) {
    return `${fa(entry.quantity_g)} گرم`;
  }

  if (entry.quantity_unit_milli != null) {
    return `${fa(entry.quantity_unit_milli / 1000, 1)} واحد`;
  }

  return "";
}

const STATS = [
  { key: "kcal", label: "کالری", tint: "bg-[#EAF6EF]", ink: "text-[#16845A]" },
  { key: "protein", label: "پروتئین", tint: "bg-[#FFDBF6]", ink: "text-[#C23EA1]" },
  { key: "carbs", label: "کربوهیدرات", tint: "bg-[#DBE3FF]", ink: "text-[#6578BC]" },
  { key: "fat", label: "چربی", tint: "bg-[#DBFDFF]", ink: "text-[#0E8A91]" },
];

function statValue(totals, key) {
  if (key === "kcal") return fa(totals?.energy_kcal);
  if (key === "protein") return grams(totals?.protein_mg);
  if (key === "carbs") return grams(totals?.carbohydrate_mg);
  return grams(totals?.fat_mg);
}

function Totals({ totals }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STATS.map((stat) => (
        <div key={stat.key} className={`rounded-2xl px-3 py-3 ${stat.tint}`}>
          <p className={`text-lg font-semibold leading-none ${stat.ink}`}>{statValue(totals, stat.key)}</p>
          <p className="mt-2 text-[11px] text-[#6B6F77]">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function previewOf(food, quantity) {
  const revision = food?.current_revision;
  const amount = Number(String(quantity).replace(",", "."));

  if (!revision || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const factor = revision.basis === "per_unit" ? amount : amount / 100;

  return {
    kcal: Math.round((Number(revision.energy_kcal) || 0) * factor),
    protein: ((Number(revision.protein_mg) || 0) / 1000) * factor,
    carbs: ((Number(revision.carbohydrate_mg) || 0) / 1000) * factor,
    fat: ((Number(revision.fat_mg) || 0) / 1000) * factor,
  };
}

function basisLine(revision) {
  if (!revision || revision.energy_kcal == null) {
    return "";
  }

  const unit = revision.basis === "per_unit" ? (revision.unit_label || "واحد") : "۱۰۰ گرم";

  return `${fa(revision.energy_kcal)} کالری در ${unit}`;
}

function EntryList({ entries, onRemove }) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D5DEEA] bg-[#F8FAFD] px-4 py-8 text-center">
        <p className="text-sm font-medium text-[#4F5965]">هنوز چیزی برای این روز ثبت نشده</p>
        <p className="mt-1 text-xs leading-6 text-[#8A8F98]">غذا را جست‌وجو کن، مقدار را انتخاب کن و به امروز اضافه کن.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center gap-3 rounded-2xl border border-[#E6EAF0] bg-white px-3 py-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#EAF3FF] text-[11px] font-semibold text-[#087BEE]">
            {fa(entry.totals?.energy_kcal)}
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-sm font-medium text-[#2F3640]">{entry.food?.name || "غذا"}</p>
            <p className="mt-0.5 text-xs text-[#6B6F77]">
              {`${amountText(entry)} · پروتئین ${grams(entry.totals?.protein_mg)}`}
            </p>
          </div>
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              className="shrink-0 rounded-full px-3 py-2 text-xs text-[#C23EA1] hover:bg-[#FFF1FA]"
            >
              حذف
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function CoachFoodIntake({ relationshipId }) {
  const [day, setDay] = useState(isoToday);
  const [log, setLog] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!relationshipId) {
      return undefined;
    }

    let active = true;
    setError("");
    api(`/api/v1/coach/relationships/${relationshipId}/food-intakes?eaten_on=${day}`)
      .then((body) => {
        if (active) setLog(body);
      })
      .catch((caught) => {
        if (active) setError(caught.message || "ثبت غذا خوانده نشد.");
      });

    return () => {
      active = false;
    };
  }, [relationshipId, day]);

  return (
    <section className="col-span-12 rounded-3xl bg-white p-4 text-right sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#4F5965]">آنچه امروز خورده</h3>
        <input
          type="date"
          value={day}
          onChange={(event) => setDay(event.target.value)}
          className="rounded-2xl border border-[#E3E8F0] px-3 py-2 text-sm text-[#1F2937]"
        />
      </div>
      <p className="mt-2 text-xs leading-6 text-[#8A8F98]">این‌ها را خود شاگرد ثبت کرده و با برنامهٔ تجویزی فرق دارد.</p>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4">
        <Totals totals={log?.totals} />
      </div>
      <div className="mt-4">
        <EntryList entries={log?.entries ?? []} />
      </div>
    </section>
  );
}

export default function AthleteFoodIntake() {
  const [relationships, setRelationships] = useState([]);
  const [relationshipId, setRelationshipId] = useState("");
  const [foods, setFoods] = useState([]);
  const [query, setQuery] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [foodId, setFoodId] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [day, setDay] = useState(isoToday);
  const [log, setLog] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/athlete/relationships"),
      api("/api/v1/athlete/foods"),
    ]).then(([relations, catalog]) => {
      if (!active) return;
      const rows = (relations.relationships ?? []).filter((row) => row.status === "active");
      setRelationships(rows);
      setRelationshipId(rows[0] ? String(rows[0].id) : "");
      setFoods(catalog.foods ?? []);
      setReady(true);
    }).catch((caught) => {
      if (active) setError(caught.message || "بانک غذا خوانده نشد.");
      if (active) setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || (!relationshipId && relationships.length > 0)) {
      return undefined;
    }

    let active = true;
    const path = relationshipId
      ? `/api/v1/athlete/food-intakes?eaten_on=${day}&coaching_relationship_id=${relationshipId}`
      : `/api/v1/athlete/food-intakes?eaten_on=${day}`;
    api(path).then((body) => {
      if (active) setLog(body);
    }).catch((caught) => {
      if (active) setError(caught.message || "ثبت‌ها خوانده نشد.");
    });

    return () => {
      active = false;
    };
  }, [day, ready, relationshipId, relationships.length]);

  const matches = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("fa");
    const rows = text
      ? foods.filter((food) => String(food.name || "").toLocaleLowerCase("fa").includes(text))
      : foods;

    return rows.slice(0, 8);
  }, [foods, query]);

  const selected = foods.find((food) => String(food.id) === foodId) ?? null;
  const perUnit = selected?.current_revision?.basis === "per_unit";

  async function reload() {
    const path = relationshipId
      ? `/api/v1/athlete/food-intakes?eaten_on=${day}&coaching_relationship_id=${relationshipId}`
      : `/api/v1/athlete/food-intakes?eaten_on=${day}`;
    const body = await api(path);
    setLog(body);
  }

  async function addFood(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if ((!relationshipId && relationships.length > 0) || !selected) {
      setError(relationships.length ? "غذا و مربی را انتخاب کن." : "غذا را انتخاب کن.");
      return;
    }

    const amount = Number(String(quantity).replace(",", "."));

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(perUnit ? "تعداد را بنویس." : "مقدار را به گرم بنویس.");
      return;
    }

    setPending(true);

    try {
      await api("/api/v1/athlete/food-intakes", {
        method: "POST",
        body: {
          eaten_on: day,
          food_id: selected.id,
          ...(relationshipId ? { coaching_relationship_id: Number(relationshipId) } : {}),
          ...(perUnit
            ? { quantity_unit_milli: Math.round(amount * 1000) }
            : { quantity_g: Math.round(amount) }),
        },
      });
      await reload();
      setNotice(relationshipId ? "به امروز اضافه شد. مربی‌ات همین فهرست را می‌بیند." : "به امروز اضافه شد. دستیار خودت همین فهرست را می‌بیند.");
      setQuery("");
      setFoodId("");
      setResultsOpen(false);
    } catch (caught) {
      setError(caught.message || "ثبت نشد.");
    } finally {
      setPending(false);
    }
  }

  async function remove(id) {
    setError("");
    setPending(true);

    try {
      await api(`/api/v1/athlete/food-intakes/${id}`, { method: "DELETE" });
      await reload();
    } catch (caught) {
      setError(caught.message || "حذف نشد.");
    } finally {
      setPending(false);
    }
  }

  const preview = previewOf(selected, quantity);
  const portions = perUnit ? ["1", "2", "3"] : ["50", "100", "150", "200"];

  return (
    <section className="rounded-3xl bg-white p-4 text-right shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#2F3640]">امروز چه خوردی</h2>
          <p className="mt-1 text-sm leading-7 text-[#6B6F77]">غذا را پیدا کن، مقدار را انتخاب کن و قبل از ثبت کالری‌اش را ببین.</p>
        </div>
        <label className="text-[11px] text-[#8A8F98]">
          تاریخ
          <input
            type="date"
            value={day}
            max={isoToday()}
            onChange={(event) => setDay(event.target.value)}
            className="mt-1 block rounded-2xl border border-[#E3E8F0] bg-[#F5F7FB] px-3 py-2 text-sm text-[#1F2937]"
          />
        </label>
      </div>

      <div className="mt-4">
        <Totals totals={log?.totals} />
      </div>

      {relationships.length > 1 ? (
        <label className="mt-4 block text-sm text-[#6B6F77]">
          این ثبت برای کدام مربی دیده شود
          <select
            value={relationshipId}
            onChange={(event) => setRelationshipId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#E3E8F0] bg-[#F5F7FB] px-3 py-3 text-sm"
          >
            {relationships.map((row) => (
              <option key={row.id} value={row.id}>{row.coach?.display_name || "مربی"}</option>
            ))}
          </select>
        </label>
      ) : null}

      {!ready ? (
        <p className="mt-4 text-sm text-[#6B6F77]">در حال خواندن بانک غذا.</p>
      ) : (
        <form onSubmit={addFood} className="mt-5 rounded-[24px] bg-[#F5F7FB] p-3 sm:p-4">
          <label className="block text-xs font-medium text-[#6B6F77]">
            جست‌وجو در بانک غذا
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setFoodId("");
                setResultsOpen(true);
              }}
              onFocus={() => setResultsOpen(true)}
              placeholder="مثلاً برنج، مرغ، ماست"
              className="mt-2 w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm text-[#1F2937] outline-none ring-[#007BFF]/15 focus:ring-4"
            />
          </label>

          {!query ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {["برنج", "مرغ", "تخم‌مرغ", "نان", "ماست"].map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => {
                    setQuery(hint);
                    setFoodId("");
                    setResultsOpen(true);
                  }}
                  className="rounded-full bg-white px-3 py-1.5 text-xs text-[#087BEE]"
                >
                  {hint}
                </button>
              ))}
            </div>
          ) : null}

          {resultsOpen && query && matches.length ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {matches.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => {
                    setFoodId(String(food.id));
                    setQuery(food.name);
                    setResultsOpen(false);
                  }}
                  className="rounded-2xl border border-white bg-white px-3 py-3 text-right transition hover:border-[#087FF5]"
                >
                  <span className="block truncate text-sm font-medium text-[#2F3640]">{food.name}</span>
                  <span className="mt-1 block text-xs text-[#087BEE]">{basisLine(food.current_revision)}</span>
                </button>
              ))}
            </div>
          ) : null}

          {resultsOpen && query && !matches.length ? (
            <p className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm text-[#6B6F77]">این نام در بانک نیست. یک کلمهٔ کوتاه‌تر بنویس، مثل برنج.</p>
          ) : null}

          {selected ? (
            <div className="mt-3 rounded-2xl border border-[#D6E8FF] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2F3640]">{selected.name}</p>
                  <p className="mt-1 text-xs text-[#6B6F77]">{basisLine(selected.current_revision)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFoodId("");
                    setQuery("");
                    setResultsOpen(true);
                  }}
                  className="shrink-0 text-xs text-[#8A8F98]"
                >
                  عوض کردن
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {portions.map((portion) => (
                  <button
                    key={portion}
                    type="button"
                    onClick={() => setQuantity(portion)}
                    className={`rounded-full px-3 py-1.5 text-xs ${quantity === portion ? "bg-[#007BFF] text-white" : "bg-[#F5F7FB] text-[#4F5965]"}`}
                  >
                    {perUnit ? `${fa(portion)} واحد` : `${fa(portion)} گرم`}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <label className="text-xs text-[#6B6F77]">
                  {perUnit ? "تعداد" : "گرم"}
                  <input
                    type="number"
                    min="1"
                    step={perUnit ? "0.5" : "1"}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    className="mt-1 block w-28 rounded-2xl border border-[#E3E8F0] px-3 py-2 text-sm text-[#1F2937]"
                  />
                </label>
                <div className="text-left">
                  <p className="text-2xl font-semibold text-[#087BEE]">{preview ? fa(preview.kcal) : "—"}</p>
                  <p className="text-[11px] text-[#8A8F98]">کیلوکالری این مقدار</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-[#007BFF] py-3 text-sm font-medium text-white transition hover:bg-[#066FE0] disabled:opacity-60"
              >
                {pending ? "در حال ثبت" : "افزودن به امروز"}
              </button>
            </div>
          ) : null}
        </form>
      )}

      {error ? <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-3 rounded-2xl bg-[#EAF6EF] px-3 py-2 text-sm text-[#16845A]">{notice}</p> : null}

      <div className="mt-5">
        <h3 className="mb-3 text-sm font-semibold text-[#4F5965]">خورده‌های این روز</h3>
        <EntryList entries={log?.entries ?? []} onRemove={remove} />
      </div>
    </section>
  );
}
