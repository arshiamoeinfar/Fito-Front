import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Droplet,
  Drumstick,
  Eye,
  Flame,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  Users,
  UtensilsCrossed,
  Wheat,
  X,
} from "lucide-react";

/* ───────────── helpers ───────────── */

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

/* هر ماکرو یک رنگ ثابت دارد و در همهٔ بخش‌ها (حلقه، لیست، پیش‌نمایش) همان است. */
const MACROS = {
  protein: {
    label: "پروتئین",
    Icon: Drumstick,
    color: "#C23EA1",
    tile: "bg-[#FFEDF8] text-[#C23EA1] dark:bg-[#2A1424] dark:text-[#F08ED1]",
    kcalPerGram: 4,
    field: "protein_mg",
  },
  carbs: {
    label: "کربوهیدرات",
    Icon: Wheat,
    color: "#6578BC",
    tile: "bg-[#EAF0FF] text-[#4A63B8] dark:bg-[#141B33] dark:text-[#8FA6F0]",
    kcalPerGram: 4,
    field: "carbohydrate_mg",
  },
  fat: {
    label: "چربی",
    Icon: Droplet,
    color: "#0E8A91",
    tile: "bg-[#E6FAFB] text-[#0E8A91] dark:bg-[#0F2226] dark:text-[#5ED3DA]",
    kcalPerGram: 9,
    field: "fat_mg",
  },
};

const MACRO_KEYS = ["protein", "carbs", "fat"];

function macroBreakdown(totals) {
  const rows = MACRO_KEYS.map((key) => {
    const meta = MACROS[key];
    const mg = Number(totals?.[meta.field]) || 0;
    const kcal = (mg / 1000) * meta.kcalPerGram;

    return { key, mg, kcal, ...meta };
  });
  const sum = rows.reduce((acc, row) => acc + row.kcal, 0);

  return rows.map((row) => ({ ...row, pct: sum ? (row.kcal / sum) * 100 : 0 }));
}

const inputBase =
  "w-full rounded-[14px] border border-[#E3E8F0] bg-white text-sm text-[#1F2937] outline-none transition placeholder:text-[#A0A4AA] focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 dark:border-[#2A3550] dark:bg-[#0B1220] dark:text-[#F3F4F6] dark:placeholder:text-[#6B7690]";

/* ───────────── date field ───────────── */

function DateField({ value, onChange, max }) {
  return (
    <label className="shrink-0 text-xs font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
      تاریخ
      <span className="relative mt-1.5 block">
        <input
          type="date"
          value={value}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputBase} min-h-11 py-2.5 pl-3 pr-9 dark:[color-scheme:dark]`}
        />
      </span>
    </label>
  );
}

function SectionHeader({ Icon, eyebrow, title, hint, as: Heading = "h2", titleClass = "text-xl", children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#007BFF] dark:bg-[#12294A] dark:text-[#6CB0FF]">
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#007BFF] dark:text-[#6CB0FF]">{eyebrow}</p>
          <Heading className={`mt-0.5 font-bold text-[#1F2937] dark:text-[#F3F4F6] ${titleClass}`}>{title}</Heading>
          <p className="mt-1 max-w-[46ch] text-sm leading-7 text-[#6B6F77] dark:text-[#9AA3B2]">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ───────────── totals: حلقهٔ کالری + ردیف ماکروها ───────────── */

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

function Totals({ totals, loading }) {
  const rows = macroBreakdown(totals);
  const hasData = rows.some((row) => row.kcal > 0);
  const gap = hasData && rows.filter((row) => row.pct > 0).length > 1 ? 4 : 0;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 rounded-[24px] border border-[#EEF1F6] bg-[#FAFBFD] p-4 sm:flex-row sm:gap-7 sm:p-5 dark:border-[#232D42] dark:bg-[#0F1626]">
      {/* حلقه */}
      <div className="relative h-[148px] w-[148px] shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="توزیع کالری ماکروها">
          <circle cx="70" cy="70" r={RING_R} fill="none" strokeWidth="12" className="stroke-[#E8ECF4] dark:stroke-[#1E293B]" />
          {hasData
            ? rows.map((row) => {
                const len = Math.max((row.pct / 100) * RING_C - gap, 0);
                const circle = (
                  <circle
                    key={row.key}
                    cx="70"
                    cy="70"
                    r={RING_R}
                    fill="none"
                    stroke={row.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${len} ${RING_C - len}`}
                    strokeDashoffset={-offset}
                    className="transition-all duration-500 motion-reduce:transition-none"
                  />
                );
                offset += (row.pct / 100) * RING_C;
                return row.pct > 0 ? circle : null;
              })
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <span className="h-7 w-14 animate-pulse rounded-lg bg-[#E8ECF4] dark:bg-[#1E293B]" />
          ) : (
            <span className="flex items-center gap-1 text-[28px] font-bold leading-none text-[#1F2937] dark:text-[#F3F4F6]">
              {fa(totals?.energy_kcal)}
            </span>
          )}
          <span className="mt-1.5 flex items-center gap-1 text-[11px] text-[#8A93A3] dark:text-[#8B97AD]">
            <Flame className="h-3.5 w-3.5 text-[#EA7A1F]" aria-hidden="true" />
            کیلوکالری
          </span>
        </div>
      </div>

      {/* ماکروها */}
      <ul className="grid w-full flex-1 gap-3.5">
        {rows.map((row) => {
          const Icon = row.Icon;
          return (
            <li key={row.key} className="flex items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${row.tile}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-[#4B5563] dark:text-[#B6C2D6]">{row.label}</span>
                  <span className="text-sm font-bold text-[#1F2937] dark:text-[#F3F4F6]">
                    {totals ? grams(totals[row.field]) : "—"}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8ECF4] dark:bg-[#1E293B]">
                    <span
                      className="block h-full rounded-full transition-all duration-500 motion-reduce:transition-none"
                      style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                    />
                  </span>
                  <span className="w-9 text-left text-[11px] text-[#8A93A3] dark:text-[#8B97AD]">
                    {hasData ? `${fa(row.pct)}٪` : "—"}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───────────── preview / basis ───────────── */

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

/* ───────────── entry list ───────────── */

function MacroDots({ totals }) {
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      {MACRO_KEYS.map((key) => {
        const meta = MACROS[key];
        return (
          <span key={key} className="flex items-center gap-1.5 text-xs text-[#6B6F77] dark:text-[#9AA3B2]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden="true" />
            <span className="sr-only">{meta.label}</span>
            {grams(totals?.[meta.field])}
          </span>
        );
      })}
    </span>
  );
}

function EntryList({ entries, onRemove, pending }) {
  if (!entries.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-[#DDE3EE] bg-[#FAFBFD] px-4 py-10 text-center dark:border-[#2A3550] dark:bg-[#0F1626]">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8A93A3] ring-1 ring-[#E8ECF4] dark:bg-[#121A2B] dark:text-[#9AA3B2] dark:ring-[#232D42]">
          <UtensilsCrossed className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-[#4B5563] dark:text-[#B6C2D6]">هنوز چیزی برای این روز ثبت نشده</p>
        <p className="max-w-[300px] text-xs leading-6 text-[#8A93A3] dark:text-[#8B97AD]">
          {onRemove
            ? "غذا را جست‌وجو کن، مقدار را انتخاب کن و به امروز اضافه کن."
            : "شاگرد برای این روز غذایی ثبت نکرده است."}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {entries.map((entry) => {
        const amount = amountText(entry);
        return (
          <li
            key={entry.id}
            className="group flex items-center gap-3 rounded-[20px] border border-[#E8ECF4] bg-white p-3 transition hover:border-[#CFE3FF] sm:p-3.5 dark:border-[#232D42] dark:bg-[#121A2B] dark:hover:border-[#35517F]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#007BFF] dark:bg-[#12294A] dark:text-[#6CB0FF]">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">
                  {entry.food?.name || "غذا"}
                </span>
                {amount ? (
                  <span className="shrink-0 rounded-full bg-[#F1F4F9] px-2 py-0.5 text-[11px] font-medium text-[#6B6F77] dark:bg-[#1E293B] dark:text-[#9AA3B2]">
                    {amount}
                  </span>
                ) : null}
              </p>
              <MacroDots totals={entry.totals} />
            </div>

            <div className="shrink-0 text-left">
              <p className="text-base font-bold leading-none text-[#1F2937] dark:text-[#F3F4F6]">
                {fa(entry.totals?.energy_kcal)}
              </p>
              <p className="mt-1 text-[11px] text-[#8A93A3] dark:text-[#8B97AD]">کیلوکالری</p>
            </div>

            {onRemove ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onRemove(entry.id)}
                aria-label={`حذف ${entry.food?.name || "غذا"}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#8A93A3] transition hover:bg-[#FEF2F2] hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:text-[#8B97AD] dark:hover:bg-[#2A1215] dark:hover:text-[#FCA5A5]"
              >
                <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ListHeader({ count }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">خورده‌های این روز</h3>
      {count > 0 ? (
        <span className="rounded-full bg-[#EEF1F6] px-2.5 py-0.5 text-xs font-medium text-[#6B6F77] dark:bg-[#1E293B] dark:text-[#9AA3B2]">
          {fa(count)} مورد
        </span>
      ) : null}
    </div>
  );
}

function Banner({ tone, children }) {
  const isError = tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <p
      role={isError ? "alert" : "status"}
      className={`mt-4 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm leading-7 ring-1 ${
        isError
          ? "bg-[#FEF2F2] text-red-700 ring-[#FECACA] dark:bg-[#2A1215] dark:text-[#FCA5A5] dark:ring-[#7F1D1D]"
          : "bg-[#F0FDF4] text-green-700 ring-[#BBF7D0] dark:bg-[#0F2A1A] dark:text-[#86EFAC] dark:ring-[#14532D]"
      }`}
    >
      <Icon className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

const sectionClass =
  "rounded-[28px] border border-[#E8ECF4] bg-white p-5 text-right shadow-[0_2px_16px_rgba(16,24,40,0.04)] sm:p-7 dark:border-[#232D42] dark:bg-[#121A2B] dark:shadow-none";

/* ───────────── coach view ───────────── */

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

  const count = log?.entries?.length ?? 0;

  return (
    <section dir="rtl" className={`col-span-12 ${sectionClass}`}>
      <SectionHeader
        Icon={Eye}
        eyebrow="مشاهده‌ی مربی"
        title="آنچه شاگرد خورده"
        titleClass="text-lg"
        as="h3"
        hint="این‌ها را خود شاگرد ثبت کرده و با برنامهٔ تجویزی فرق دارد."
      >
        <DateField value={day} onChange={setDay} />
      </SectionHeader>

      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="mt-5">
        <Totals totals={log?.totals} loading={!log && !error} />
      </div>

      <div className="mt-6">
        <ListHeader count={count} />
        <EntryList entries={log?.entries ?? []} />
      </div>
    </section>
  );
}

/* ───────────── athlete view ───────────── */

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

  function nudge(direction) {
    const step = perUnit ? 0.5 : 10;
    const current = Number(String(quantity).replace(",", ".")) || 0;
    const next = Math.max(step, current + direction * step);

    setQuantity(String(next));
  }

  const preview = previewOf(selected, quantity);
  const portions = perUnit ? ["1", "2", "3"] : ["50", "100", "150", "200"];
  const count = log?.entries?.length ?? 0;

  return (
    <section dir="rtl" className={sectionClass}>
      <SectionHeader
        Icon={UtensilsCrossed}
        eyebrow="تغذیه روزانه"
        title="امروز چه خوردی"
        hint="غذا را پیدا کن، مقدار را انتخاب کن و قبل از ثبت، کالری‌اش را ببین."
      >
        <DateField value={day} max={isoToday()} onChange={setDay} />
      </SectionHeader>

      <div className="mt-5">
        <Totals totals={log?.totals} loading={!log && !error} />
      </div>

      {relationships.length > 1 ? (
        <label className="mt-4 block text-sm font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
          این ثبت برای کدام مربی دیده شود
          <span className="relative mt-2 block">
            <Users className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A93A3]" aria-hidden="true" />
            <select
              value={relationshipId}
              onChange={(event) => setRelationshipId(event.target.value)}
              className={`${inputBase} min-h-12 appearance-none bg-[#F5F7FB] py-3 pl-4 pr-10`}
            >
              {relationships.map((row) => (
                <option key={row.id} value={row.id}>{row.coach?.display_name || "مربی"}</option>
              ))}
            </select>
          </span>
        </label>
      ) : null}

      {!ready ? (
        <div className="mt-5 flex items-center gap-2.5 rounded-[24px] bg-[#F5F7FB] px-4 py-4 text-sm text-[#6B6F77] dark:bg-[#0F1626] dark:text-[#9AA3B2]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          در حال خواندن بانک غذا…
        </div>
      ) : (
        <form onSubmit={addFood} className="mt-5 rounded-[24px] bg-[#F5F7FB] p-3.5 ring-1 ring-[#EEF1F6] sm:p-5 dark:bg-[#0F1626] dark:ring-[#232D42]">
          {/* جست‌وجو */}
          <label className="block text-xs font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
            جست‌وجو در بانک غذا
            <span className="relative mt-2 block">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A93A3]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setFoodId("");
                  setResultsOpen(true);
                }}
                onFocus={() => setResultsOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setResultsOpen(false);
                }}
                placeholder="مثلاً برنج، مرغ، ماست"
                className={`${inputBase} min-h-12 rounded-2xl py-3 pl-11 pr-10`}
              />
              {query ? (
                <button
                  type="button"
                  aria-label="پاک کردن جست‌وجو"
                  onClick={() => {
                    setQuery("");
                    setFoodId("");
                    setResultsOpen(false);
                  }}
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#8A93A3] transition hover:bg-[#F1F4F9] hover:text-[#1F2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] dark:hover:bg-[#1E293B] dark:hover:text-[#F3F4F6]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </span>
          </label>

          {!query ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#8A93A3] dark:text-[#8B97AD]">پیشنهاد:</span>
              {["برنج", "مرغ", "تخم‌مرغ", "نان", "ماست"].map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => {
                    setQuery(hint);
                    setFoodId("");
                    setResultsOpen(true);
                  }}
                  className="min-h-9 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-[#087BEE] ring-1 ring-[#E8ECF4] transition hover:bg-[#EAF4FF] hover:ring-[#BFDBFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] dark:bg-[#121A2B] dark:text-[#6CB0FF] dark:ring-[#232D42] dark:hover:bg-[#12294A]"
                >
                  {hint}
                </button>
              ))}
            </div>
          ) : null}

          {/* نتایج */}
          {resultsOpen && query && !selected && matches.length ? (
            <ul
              role="listbox"
              aria-label="نتایج غذا"
              className="mt-3 divide-y divide-[#F1F4F9] overflow-hidden rounded-2xl bg-white ring-1 ring-[#E8ECF4] dark:divide-[#1E293B] dark:bg-[#121A2B] dark:ring-[#232D42]"
            >
              {matches.map((food) => (
                <li key={food.id} role="option" aria-selected={String(food.id) === foodId}>
                  <button
                    type="button"
                    onClick={() => {
                      setFoodId(String(food.id));
                      setQuery(food.name);
                      setResultsOpen(false);
                    }}
                    className="group flex w-full items-center gap-3 px-4 py-3 text-right transition hover:bg-[#F5F9FF] focus:outline-none focus-visible:bg-[#F5F9FF] dark:hover:bg-[#12294A] dark:focus-visible:bg-[#12294A]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">{food.name}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-[#6B6F77] dark:text-[#9AA3B2]">
                        <Flame className="h-3.5 w-3.5 text-[#EA7A1F]" aria-hidden="true" />
                        {basisLine(food.current_revision)}
                      </span>
                    </span>
                    <ChevronLeft className="h-4 w-4 shrink-0 text-[#A0A4AA] transition group-hover:-translate-x-0.5 group-hover:text-[#007BFF]" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {resultsOpen && query && !selected && !matches.length ? (
            <p className="mt-3 rounded-2xl bg-white px-4 py-3.5 text-sm leading-7 text-[#6B6F77] ring-1 ring-[#E8ECF4] dark:bg-[#121A2B] dark:text-[#9AA3B2] dark:ring-[#232D42]">
              این نام در بانک نیست. یک کلمهٔ کوتاه‌تر بنویس، مثل برنج.
            </p>
          ) : null}

          {/* غذای انتخاب‌شده + پیش‌نمایش */}
          {selected ? (
            <div className="mt-4 rounded-[20px] border border-[#D6E8FF] bg-white p-4 sm:p-5 dark:border-[#1E3A5F] dark:bg-[#121A2B]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#007BFF] dark:bg-[#12294A] dark:text-[#6CB0FF]">
                    <UtensilsCrossed className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1F2937] dark:text-[#F3F4F6]">{selected.name}</p>
                    <p className="mt-1 text-xs text-[#6B6F77] dark:text-[#9AA3B2]">{basisLine(selected.current_revision)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFoodId("");
                    setQuery("");
                    setResultsOpen(true);
                  }}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-[#6B6F77] ring-1 ring-[#E8ECF4] transition hover:bg-[#F5F7FB] hover:text-[#1F2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] dark:text-[#9AA3B2] dark:ring-[#232D42] dark:hover:bg-[#1E293B] dark:hover:text-[#F3F4F6]"
                >
                  عوض کردن
                </button>
              </div>

              {/* مقدار */}
              <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="مقدارهای آماده">
                {portions.map((portion) => (
                  <button
                    key={portion}
                    type="button"
                    aria-pressed={quantity === portion}
                    onClick={() => setQuantity(portion)}
                    className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] ${quantity === portion
                      ? "bg-[#007BFF] text-white shadow-[0_6px_16px_-6px_rgba(0,123,255,0.6)]"
                      : "bg-[#F5F7FB] text-[#4F5965] hover:bg-[#EAF4FF] hover:text-[#007BFF] dark:bg-[#0F1626] dark:text-[#9AA3B2] dark:hover:bg-[#12294A] dark:hover:text-[#6CB0FF]"
                      }`}
                  >
                    {perUnit ? `${fa(portion)} واحد` : `${fa(portion)} گرم`}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <label className="text-xs font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
                  {perUnit ? "تعداد" : "مقدار دقیق (گرم)"}
                  <span className="mt-1.5 flex min-h-12 w-44 items-stretch overflow-hidden rounded-[14px] border border-[#E3E8F0] bg-white transition focus-within:border-[#007BFF] focus-within:ring-4 focus-within:ring-[#007BFF]/10 dark:border-[#2A3550] dark:bg-[#0B1220]">
                    <button
                      type="button"
                      aria-label="افزایش مقدار"
                      onClick={() => nudge(1)}
                      className="flex w-11 shrink-0 items-center justify-center text-[#6B6F77] transition hover:bg-[#F5F7FB] hover:text-[#007BFF] focus:outline-none focus-visible:bg-[#EAF4FF] dark:text-[#9AA3B2] dark:hover:bg-[#12294A]"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      step={perUnit ? "0.5" : "1"}
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      className="w-full min-w-0 flex-1 bg-transparent px-1 text-center text-sm font-semibold text-[#1F2937] outline-none [appearance:textfield] dark:text-[#F3F4F6] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label="کاهش مقدار"
                      onClick={() => nudge(-1)}
                      className="flex w-11 shrink-0 items-center justify-center text-[#6B6F77] transition hover:bg-[#F5F7FB] hover:text-[#007BFF] focus:outline-none focus-visible:bg-[#EAF4FF] dark:text-[#9AA3B2] dark:hover:bg-[#12294A]"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                </label>

                <div className="text-left" aria-live="polite">
                  <p className="flex items-center justify-end gap-1.5 text-4xl font-bold leading-none text-[#1F2937] dark:text-[#F3F4F6]">
                    <Flame className="h-6 w-6 text-[#EA7A1F]" aria-hidden="true" />
                    {preview ? fa(preview.kcal) : "—"}
                  </p>
                  <p className="mt-1.5 text-[11px] text-[#8A93A3] dark:text-[#8B97AD]">کیلوکالری این مقدار</p>
                </div>
              </div>

              {preview ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {MACRO_KEYS.map((key) => {
                    const meta = MACROS[key];
                    const Icon = meta.Icon;
                    return (
                      <div key={key} className="rounded-2xl bg-[#F8FAFC] px-3 py-3 text-center ring-1 ring-[#EEF1F6] dark:bg-[#0F1626] dark:ring-[#232D42]">
                        <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg ${meta.tile}`}>
                          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        </span>
                        <p className="mt-2 truncate text-sm font-bold text-[#1F2937] dark:text-[#F3F4F6]">
                          {fa(preview[key], 1)} <span className="text-[11px] font-medium text-[#8A93A3]">گرم</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#8A93A3] dark:text-[#8B97AD]">{meta.label}</p>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#007BFF] py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(0,123,255,0.5)] transition hover:bg-[#0069D9] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:active:scale-100 dark:shadow-none dark:focus-visible:ring-offset-[#121A2B]"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                )}
                {pending ? "در حال ثبت" : "افزودن به امروز"}
              </button>
            </div>
          ) : null}
        </form>
      )}

      {error ? <Banner tone="error">{error}</Banner> : null}
      {notice ? <Banner tone="success">{notice}</Banner> : null}

      <div className="mt-6">
        <ListHeader count={count} />
        <EntryList entries={log?.entries ?? []} onRemove={remove} pending={pending} />
      </div>
    </section>
  );
}