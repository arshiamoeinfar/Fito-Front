
import { useEffect, useRef, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";

/* ───────────────────────── داده‌ها ───────────────────────── */

const FEATURE_LABELS = {
  workout_programs: "برنامه تمرین",
  nutrition_programs: "تغذیه",
  body_analysis: "آنالیز بدن",
  ai_coach_assistant: "دستیار مربی",
  ai_athlete_access: "دستیار ورزشکار",
  progress_reports: "گزارش پیشرفت",
};

const FEATURE_ORDER = Object.keys(FEATURE_LABELS);

const STATUS_LABELS = {
  active: "فعال",
  expired: "منقضی",
  pending: "در انتظار",
  canceled: "لغو شده",
};

const TEST_PLANS = [
  {
    id: 4,
    name: "شروع",
    description: "برای مربی که تازه شاگرد می‌گیرد و فقط برنامه تمرین می‌سازد.",
    price_irr: 1500000,
    athlete_capacity: 15,
    features: ["workout_programs"],
  },
  {
    id: 5,
    name: "رشد",
    description: "تمرین، تغذیه و گزارش پیشرفت برای یک گروه متوسط.",
    price_irr: 3900000,
    athlete_capacity: 40,
    features: ["workout_programs", "nutrition_programs", "progress_reports"],
    recommended: true,
  },
  {
    id: 6,
    name: "استودیو",
    description: "همه قابلیت‌ها، همراه سهمیه دستیار، برای مجموعه بزرگ‌تر.",
    price_irr: 8900000,
    athlete_capacity: 120,
    features: [
      "workout_programs",
      "nutrition_programs",
      "body_analysis",
      "ai_coach_assistant",
      "ai_athlete_access",
      "progress_reports",
    ],
  },
];

/* ───────────────────────── کمکی‌ها ───────────────────────── */

function rial(value) {
  return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
}

function when(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
  }).format(date);
}

function digitsOnly(text) {
  return String(text)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/\D/g, "");
}

function periodProgress(start, end) {
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();

  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) {
    return null;
  }

  const now = Date.now();

  const percent = Math.min(
    100,
    Math.max(0, ((now - from) / (to - from)) * 100)
  );

  const daysLeft = Math.max(
    0,
    Math.ceil((to - now) / 86400000)
  );

  return { percent, daysLeft };
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/* ───────────────────────── آیکون‌ها ───────────────────────── */

function Icon({ name, className = "h-4 w-4" }) {
  const paths = {
    check: "M5 12.5l4.5 4.5L19 7.5",
    minus: "M6 12h12",
    lock: "M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z",
    users:
      "M16 19v-1.5a3.5 3.5 0 00-3.5-3.5h-4A3.5 3.5 0 005 17.5V19M10.5 11a3 3 0 100-6 3 3 0 000 6zM19 19v-1.2a3 3 0 00-2.2-2.9M15.5 5.2a3 3 0 010 5.6",
    calendar:
      "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
    close: "M6 6l12 12M18 6L6 18",
    info: "M12 11v5M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
    alert:
      "M12 9v4M12 17h.01M10.3 4.2L2.6 18a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z",
    refresh:
      "M4 12a8 8 0 0113.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 01-13.7 5.6L4 15.5M4 20v-4.5h4.5",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} motion-safe:animate-spin`}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ───────────────────────── صفحه ───────────────────────── */

export default function CoachPlans() {
  const [navKey, setNavKey] = useState(0);
  const [access, setAccess] = useState(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [order, setOrder] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [requestedId, setRequestedId] = useState(null);

  const statusRef = useRef(null);
  const checkoutRef = useRef(null);
  const amountRef = useRef(null);

  const pending = busy !== null;

  function rememberAccess(body) {
    setAccess(body);
    setReady(true);
    setLoadError(null);
    setNavKey((key) => key + 1);
  }

  function loadAccess() {
    setReady(false);
    setLoadError(null);

    return api("/api/v1/coach/access").then(
      (body) => {
        setAccess(body);
        setReady(true);
      },
      (caught) => {
        setReady(true);

        setLoadError(
          caught instanceof ApiError
            ? caught.message
            : "ارتباط با سرور برقرار نشد."
        );
      }
    );
  }

  useEffect(() => {
    let active = true;

    api("/api/v1/coach/access").then(
      (body) => {
        if (active) {
          setAccess(body);
          setReady(true);
        }
      },
      (caught) => {
        if (active) {
          setReady(true);

          setLoadError(
            caught instanceof ApiError
              ? caught.message
              : "ارتباط با سرور برقرار نشد."
          );
        }
      }
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!order?.id) return;

    const behavior = prefersReducedMotion() ? "auto" : "smooth";

    checkoutRef.current?.scrollIntoView({
      behavior,
      block: "center",
    });

    const timer = setTimeout(() => {
      amountRef.current?.focus({ preventScroll: true });
    }, 250);

    return () => clearTimeout(timer);
  }, [order?.id]);

  useEffect(() => {
    if (!saved) return;

    statusRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [saved]);

  const features = access?.features ?? [];
  const programLocked = !features.includes("workout_programs");

  const chosen =
    TEST_PLANS.find((plan) => plan.id === order?.plan_id) ?? null;

  const currentPlanId = access?.access?.plan_id ?? null;

  const progress = access?.access
    ? periodProgress(
        access.access.starts_at,
        access.access.ends_at
      )
    : null;

  const amountMatches = order
    ? Number(amount) === Number(order.price_irr)
    : true;

  async function run(key, action) {
    setError(null);
    setSaved(false);
    setBusy(key);

    try {
      await action();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "درخواست ناموفق بود. دوباره تلاش کنید."
      );
    } finally {
      setBusy(null);
    }
  }

  function choose(plan) {
    setRequestedId(plan.id);

    run(`choose:${plan.id}`, async () => {
      const opened = await api("/api/v1/coach/orders", {
        method: "POST",
        body: { plan_id: plan.id },
      });

      setOrder(opened);
      setAttempt(null);
      setAmount(String(opened.price_irr));
    });
  }

  function closeCheckout() {
    setOrder(null);
    setAttempt(null);
    setError(null);
  }

  function pay(event) {
    event.preventDefault();

    if (pending) return;

    run("pay", async () => {
      const started =
        attempt ??
        (await api(`/api/v1/coach/orders/${order.id}/attempts`, {
          method: "POST",
          body: {
            idempotency_key: `pay-${Date.now()}`,
          },
        }));

      setAttempt(started);

      await api("/api/v1/payments/test/callback", {
        method: "POST",
        body: {
          attempt_id: started.id,
          amount_irr: Number(amount),
          gateway_reference: `test-${Date.now()}`,
        },
      });

      setOrder(null);
      setAttempt(null);
      setSaved(true);

      const body = await api("/api/v1/coach/access");

      rememberAccess(body);
    });
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F5F7FB] dark:bg-slate-950">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div className="min-w-0 w-full">
          <Navbar key={navKey} />
        </div>

        <div className="min-w-0 w-full py-1 md:py-3">
          <div className="grid min-w-0 grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
            <HeaderDashBoard
              title="پلن‌ها"
              description="سه پلن آزمایشی برای خرید. مبلغ‌ها به ریال است."
            />

            {/* ───────── وضعیت دوره ───────── */}

            <section
              ref={statusRef}
              dir="rtl"
              aria-labelledby="status-title"
              className="col-span-12 min-w-0 scroll-mt-6 overflow-hidden rounded-3xl border border-[#E8ECF4] bg-white text-right dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6 sm:pt-7 lg:px-7">
                <h2
                  id="status-title"
                  className="text-lg font-primary text-[#1F2937] dark:text-slate-100 sm:text-xl"
                >
                  دوره فعلی
                </h2>

                {ready && access?.access && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      access.access.status === "active"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        access.access.status === "active"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {STATUS_LABELS[access.access.status] ??
                      access.access.status}
                  </span>
                )}
              </div>

              <div
                className="px-4 pb-5 pt-4 sm:px-6 sm:pb-7 lg:px-7"
                aria-live="polite"
              >
                {!ready && (
                  <div
                    className="animate-pulse"
                    role="status"
                    aria-label="در حال بررسی دوره"
                  >
                    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-[68px] rounded-2xl bg-[#F1F4F9] dark:bg-slate-800"
                        />
                      ))}
                    </div>

                    <div className="mt-5 h-2 rounded-full bg-[#F1F4F9] dark:bg-slate-800" />
                  </div>
                )}

                {ready && loadError && (
                  <div className="flex flex-col items-start gap-3 rounded-2xl bg-red-50 px-4 py-4 dark:bg-red-500/10 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-start gap-2 text-sm leading-7 text-red-700 dark:text-red-400">
                      <Icon
                        name="alert"
                        className="mt-1.5 h-4 w-4 shrink-0"
                      />
                      <span>{loadError}</span>
                    </p>

                    <button
                      type="button"
                      onClick={loadAccess}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Icon name="refresh" />
                      تلاش دوباره
                    </button>
                  </div>
                )}

                {ready && !loadError && !access?.access && (
                  <div className="flex items-start gap-3 rounded-2xl bg-[#F5F7FB] px-4 py-4 dark:bg-slate-800 sm:items-center sm:px-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6B7280] shadow-sm dark:bg-slate-700 dark:text-slate-300">
                      <Icon name="lock" className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F2937] dark:text-slate-100">
                        هنوز دوره فعالی ندارید
                      </p>

                      <p className="mt-1 text-sm leading-7 text-[#6B7280] dark:text-slate-400">
                        داشبورد باز است، ولی ساخت برنامه تمرین قفل
                        می‌ماند. یکی از پلن‌های پایین را انتخاب کنید.
                      </p>
                    </div>
                  </div>
                )}

                {ready && access?.access && (
                  <>
                    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
                      <Fact
                        icon="calendar"
                        label="شروع"
                        value={when(access.access.starts_at)}
                      />

                      <Fact
                        icon="calendar"
                        label="پایان"
                        value={when(access.access.ends_at)}
                      />

                      <Fact
                        icon="users"
                        label="ظرفیت ورزشکار"
                        value={`${rial(access.access.athlete_capacity)} نفر`}
                      />
                    </div>

                    {progress && (
                      <div className="mt-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280] dark:text-slate-400">
                          <span>
                            {progress.daysLeft > 0
                              ? `${rial(progress.daysLeft)} روز تا پایان`
                              : "دوره تمام شده"}
                          </span>

                          <span>
                            {rial(Math.round(progress.percent))}٪ گذشته
                          </span>
                        </div>

                        <div
                          className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF2F8] dark:bg-slate-700"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(progress.percent)}
                          aria-label="پیشرفت دوره"
                        >
                          <div
                            className="h-full rounded-full bg-[#007BFF] transition-[width] duration-700"
                            style={{
                              width: `${progress.percent}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {ready && !loadError && (
                  <div className="mt-5 border-t border-[#F0F2F5] pt-4 dark:border-slate-700">
                    {programLocked ? (
                      <p className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-slate-400">
                        <Icon
                          name="lock"
                          className="h-4 w-4 text-[#A0A4AA]"
                        />
                        نوشتن برنامه تمرین قفل است.
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="ml-1 text-xs text-[#A0A4AA] dark:text-slate-400">
                          قابلیت‌های فعال
                        </span>

                        {features.map((key) => (
                          <span
                            key={key}
                            className="rounded-full bg-[#EEF6FF] px-3 py-1 text-xs font-medium text-[#0B63CE] dark:bg-blue-500/10 dark:text-blue-400"
                          >
                            {FEATURE_LABELS[key] ?? key}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ───────── پیام موفقیت ───────── */}

            {saved && (
              <div
                role="status"
                dir="rtl"
                className="col-span-12 flex items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-right text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 sm:px-5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Icon name="check" />
                  </span>
                  <span>پرداخت ثبت شد و دوره به‌روز شد.</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSaved(false)}
                  aria-label="بستن پیام"
                  className="shrink-0 rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                >
                  <Icon name="close" />
                </button>
              </div>
            )}

            {/* ───────── کارت پلن‌ها ───────── */}

            {TEST_PLANS.map((plan) => {
              const featured = Boolean(plan.recommended);
              const selected = order?.plan_id === plan.id;
              const isCurrent = currentPlanId === plan.id;
              const loadingThis = busy === `choose:${plan.id}`;
              const perAthlete = Math.round(
                plan.price_irr / plan.athlete_capacity
              );

              return (
                <article
                  key={plan.id}
                  dir="rtl"
                  aria-labelledby={`plan-${plan.id}`}
                  className={`relative col-span-12 flex min-w-0 flex-col rounded-3xl p-4 text-right transition-shadow sm:p-6 md:col-span-6 lg:col-span-4 lg:p-7 ${
                    featured
                      ? "bg-[#0B5FD0] text-white shadow-[0_18px_40px_-18px_rgba(0,92,214,0.65)]"
                      : "border border-[#E8ECF4] bg-white text-[#1F2937] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  } ${
                    selected
                      ? "ring-2 ring-offset-2 ring-offset-[#F5F7FB] ring-[#007BFF] dark:ring-offset-slate-950"
                      : ""
                  }`}
                >
                  <div className="flex min-h-7 flex-wrap items-center gap-2">
                    {featured && (
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#0B5FD0]">
                        پیشنهادی
                      </span>
                    )}

                    {isCurrent && (
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          featured
                            ? "bg-white/20 text-white"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        }`}
                      >
                        پلن فعلی شما
                      </span>
                    )}

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] ${
                        featured
                          ? "bg-white/15 text-white/90"
                          : "bg-[#EEF6FF] text-[#007BFF] dark:bg-blue-500/10 dark:text-blue-400"
                      }`}
                    >
                      آزمایشی
                    </span>
                  </div>

                  <h2
                    id={`plan-${plan.id}`}
                    className="mt-4 text-2xl font-primary"
                  >
                    {plan.name}
                  </h2>

                  <p
                    className={`mt-2 text-sm leading-7 sm:min-h-14 ${
                      featured
                        ? "text-white/80"
                        : "text-[#6B7280] dark:text-slate-400"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mt-5 min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      {rial(plan.price_irr)}

                      <span
                        className={`text-xs font-medium sm:text-sm ${
                          featured
                            ? "text-white/70"
                            : "text-[#A0A4AA] dark:text-slate-400"
                        }`}
                      >
                        ریال / ماه
                      </span>
                    </p>

                    <p
                      className={`mt-1.5 text-xs ${
                        featured
                          ? "text-white/70"
                          : "text-[#A0A4AA] dark:text-slate-400"
                      }`}
                    >
                      حدود {rial(perAthlete)} ریال برای هر ورزشکار
                    </p>
                  </div>

                  <div
                    className={`mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
                      featured
                        ? "bg-white/10 text-white"
                        : "bg-[#F5F7FB] text-[#374151] dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <Icon name="users" className="h-4 w-4 shrink-0" />
                    <span>
                      ظرفیت {rial(plan.athlete_capacity)} ورزشکار
                    </span>
                  </div>

                  <ul
                    className="mt-5 grid gap-2.5 text-sm"
                    aria-label={`قابلیت‌های پلن ${plan.name}`}
                  >
                    {FEATURE_ORDER.map((key) => {
                      const included = plan.features.includes(key);

                      return (
                        <li
                          key={key}
                          className={`flex items-center gap-2.5 ${
                            included
                              ? featured
                                ? "text-white"
                                : "text-[#374151] dark:text-slate-200"
                              : featured
                                ? "text-white/45"
                                : "text-[#B7BCC4] dark:text-slate-600"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              included
                                ? featured
                                  ? "bg-white text-[#0B5FD0]"
                                  : "bg-[#EEF6FF] text-[#007BFF] dark:bg-blue-500/10 dark:text-blue-400"
                                : featured
                                  ? "bg-white/10"
                                  : "bg-[#F3F4F6] dark:bg-slate-800"
                            }`}
                          >
                            <Icon
                              name={included ? "check" : "minus"}
                              className="h-3 w-3"
                            />
                          </span>

                          <span
                            className={
                              included ? "" : "line-through decoration-1"
                            }
                          >
                            {FEATURE_LABELS[key]}
                          </span>

                          <span className="sr-only">
                            {included ? "(شامل)" : "(شامل نیست)"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => choose(plan)}
                    aria-busy={loadingThis}
                    className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-auto ${
                      featured
                        ? "bg-white text-[#0B5FD0] hover:bg-[#EEF6FF] focus-visible:ring-white focus-visible:ring-offset-[#0B5FD0]"
                        : "bg-[#007BFF] text-white hover:bg-blue-600 focus-visible:ring-[#007BFF] focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                    }`}
                  >
                    {loadingThis ? (
                      <>
                        <Spinner />
                        در حال ساخت سفارش
                      </>
                    ) : selected ? (
                      "ادامه پرداخت این پلن"
                    ) : isCurrent ? (
                      "تمدید این پلن"
                    ) : (
                      "انتخاب این پلن"
                    )}
                  </button>
                </article>
              );
            })}

            {/* ───────── خطا ───────── */}

            {error && (
              <div
                role="alert"
                dir="rtl"
                className="col-span-12 flex items-start justify-between gap-3 rounded-3xl border border-red-100 bg-red-50 px-4 py-4 text-right text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:px-5"
              >
                <span className="flex min-w-0 items-start gap-3 leading-7">
                  <Icon
                    name="alert"
                    className="mt-1.5 h-4 w-4 shrink-0"
                  />
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="بستن خطا"
                  className="shrink-0 rounded-lg p-1.5 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-500/10"
                >
                  <Icon name="close" />
                </button>
              </div>
            )}

            {/* ───────── پرداخت ───────── */}

            {order && (
              <form
                ref={checkoutRef}
                onSubmit={pay}
                dir="rtl"
                aria-labelledby="checkout-title"
                className="col-span-12 min-w-0 scroll-mt-6 overflow-hidden rounded-3xl border border-[#D6E6FB] bg-white text-right dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3 border-b border-[#F0F2F5] px-4 py-5 dark:border-slate-700 sm:px-6 lg:px-7">
                  <div className="min-w-0">
                    <h2
                      id="checkout-title"
                      className="text-lg font-primary text-[#1F2937] dark:text-slate-100 sm:text-xl"
                    >
                      پرداخت {chosen ? `پلن ${chosen.name}` : "سفارش باز"}
                    </h2>

                    <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
                      یک قدم تا فعال‌شدن دوره.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeCheckout}
                    disabled={pending}
                    aria-label="بستن فرم پرداخت"
                    className="shrink-0 rounded-xl p-2 text-[#6B7280] transition hover:bg-[#F5F7FB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <Icon name="close" className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid min-w-0 gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-2 lg:gap-10 lg:px-7">
                  {/* خلاصه سفارش */}

                  <div className="min-w-0">
                    <div className="rounded-2xl bg-[#F5F7FB] p-4 dark:bg-slate-800 sm:p-5">
                      <dl className="grid gap-3 text-sm">
                        {chosen && (
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-[#6B7280] dark:text-slate-400">
                              پلن
                            </dt>

                            <dd className="font-semibold text-[#1F2937] dark:text-slate-100">
                              {chosen.name}
                            </dd>
                          </div>
                        )}

                        {chosen && (
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-[#6B7280] dark:text-slate-400">
                              ظرفیت
                            </dt>

                            <dd className="text-[#1F2937] dark:text-slate-200">
                              {rial(chosen.athlete_capacity)} ورزشکار
                            </dd>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E3E8F0] pt-3 dark:border-slate-700">
                          <dt className="text-[#6B7280] dark:text-slate-400">
                            مبلغ قابل پرداخت
                          </dt>

                          <dd className="text-lg font-bold text-[#1F2937] dark:text-slate-100">
                            {rial(order.price_irr)}
                            <span className="mr-1 text-xs font-medium text-[#A0A4AA] dark:text-slate-400">
                              ریال
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {requestedId && order.plan_id !== requestedId && (
                      <p
                        role="status"
                        className="mt-3 flex items-start gap-2 rounded-2xl bg-[#EEF6FF] px-4 py-3 text-sm leading-7 text-[#0B63CE] dark:bg-blue-500/10 dark:text-blue-400"
                      >
                        <Icon
                          name="info"
                          className="mt-1.5 h-4 w-4 shrink-0"
                        />

                        سفارش باز فعلی برای پلن دیگری است و تا پرداخت همان ادامه دارد.
                      </p>
                    )}
                  </div>

                  {/* مبلغ و دکمه */}

                  <div className="flex min-w-0 flex-col">
                    <label
                      htmlFor="test-amount"
                      className="text-sm font-medium text-[#374151] dark:text-slate-200"
                    >
                      مبلغ آزمایشی (ریال)
                    </label>

                    <input
                      id="test-amount"
                      ref={amountRef}
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="off"
                      value={amount}
                      onChange={(event) =>
                        setAmount(digitsOnly(event.target.value))
                      }
                      aria-describedby="amount-hint"
                      aria-invalid={!amountMatches}
                      className={`mt-2 w-full min-w-0 rounded-2xl border bg-white px-4 py-3.5 text-left text-base tabular-nums text-[#1F2937] outline-none transition focus:ring-4 dark:bg-slate-800 dark:text-slate-100 ${
                        amountMatches
                          ? "border-[#E3E8F0] focus:border-[#007BFF] focus:ring-[#007BFF]/15 dark:border-slate-700"
                          : "border-amber-300 focus:border-amber-400 focus:ring-amber-200/60"
                      }`}
                    />

                    <div
                      id="amount-hint"
                      className="mt-2 min-h-10 text-xs leading-6"
                      aria-live="polite"
                    >
                      {amountMatches ? (
                        <p className="text-[#A0A4AA] dark:text-slate-400">
                          مبلغ با سفارش یکی است.
                        </p>
                      ) : (
                        <p className="flex flex-wrap items-center gap-x-2 text-amber-700 dark:text-amber-400">
                          مبلغ با سفارش ({rial(order.price_irr)} ریال) فرق دارد و سرور پرداخت را رد می‌کند.

                          <button
                            type="button"
                            onClick={() =>
                              setAmount(String(order.price_irr))
                            }
                            className="font-semibold underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                          >
                            برگرداندن مبلغ سفارش
                          </button>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-start lg:mt-auto">
                      <button
                        type="button"
                        onClick={closeCheckout}
                        disabled={pending}
                        className="w-full rounded-2xl border border-[#E3E8F0] px-6 py-3.5 text-sm font-medium text-[#4B5563] transition hover:bg-[#F5F7FB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
                      >
                        بعداً
                      </button>

                      <button
                        type="submit"
                        disabled={pending || !amount}
                        aria-busy={busy === "pay"}
                        className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {busy === "pay" ? (
                          <>
                            <Spinner />
                            در حال ثبت پرداخت
                          </>
                        ) : (
                          "ثبت پرداخت آزمایشی"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── کارت اطلاعات ───────────────────────── */

function Fact({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#F5F7FB] px-3 py-3 dark:bg-slate-800 sm:gap-3 sm:px-4 sm:py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF] shadow-sm dark:bg-slate-700 dark:text-blue-400">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0">
        <p className="text-xs text-[#A0A4AA] dark:text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-semibold text-[#1F2937] dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
}
