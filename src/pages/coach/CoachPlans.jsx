import { useEffect, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";

const FEATURE_LABELS = {
  workout_programs: "برنامه تمرین",
  nutrition_programs: "تغذیه",
  body_analysis: "آنالیز بدن",
  ai_coach_assistant: "دستیار مربی",
  ai_athlete_access: "دستیار ورزشکار",
  progress_reports: "گزارش پیشرفت",
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

function rial(value) {
  return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
}

function when(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

export default function CoachPlans() {
  const [navKey, setNavKey] = useState(0);
  const [access, setAccess] = useState(null);
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [requestedId, setRequestedId] = useState(null);

  function rememberAccess(body) {
    setAccess(body);
    setReady(true);
    setNavKey((key) => key + 1);
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
          setError(caught instanceof ApiError ? caught.message : "ارتباط با سرور برقرار نشد.");
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const features = access?.features ?? [];
  const programLocked = !features.includes("workout_programs");
  const chosen = TEST_PLANS.find((plan) => plan.id === order?.plan_id) ?? null;

  async function run(action) {
    setError(null);
    setSaved(false);
    setPending(true);

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "درخواست ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  function choose(plan) {
    setRequestedId(plan.id);
    run(async () => {
      const opened = await api("/api/v1/coach/orders", {
        method: "POST",
        body: { plan_id: plan.id },
      });
      setOrder(opened);
      setAttempt(null);
      setAmount(String(opened.price_irr));
    });
  }

  function pay(event) {
    event.preventDefault();

    run(async () => {
      const started = attempt ?? await api(`/api/v1/coach/orders/${order.id}/attempts`, {
        method: "POST",
        body: { idempotency_key: `pay-${Date.now()}` },
      });
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
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar key={navKey} />
        </div>
        <div className="py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard
              title="پلن‌ها"
              description="سه پلن آزمایشی برای خرید. مبلغ‌ها به ریال است."
            />

            <section className="col-span-12 bg-white rounded-3xl p-7 text-right" dir="rtl">
              <h2 className="text-xl font-primary text-[#6B6F77]">دوره فعلی</h2>
              {!ready && <p className="mt-4 text-sm text-[#A0A4AA]">در حال بررسی دوره</p>}
              {ready && !access?.access && (
                <p className="mt-4 text-sm leading-7 text-[#6B6F77]">
                  دوره فعالی نیست. داشبورد باز است و ساخت برنامه تمرین قفل می‌ماند.
                </p>
              )}
              {access?.access && (
                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Fact label="وضعیت" value={access.access.status === "active" ? "فعال" : access.access.status} />
                  <Fact label="شروع" value={when(access.access.starts_at)} />
                  <Fact label="پایان" value={when(access.access.ends_at)} />
                  <Fact label="ظرفیت ورزشکار" value={rial(access.access.athlete_capacity)} />
                </div>
              )}
              {ready && (
                <p className="mt-4 text-sm text-[#6B6F77]">
                  {programLocked
                    ? "نوشتن برنامه تمرین قفل است."
                    : `قابلیت‌ها: ${features.map((key) => FEATURE_LABELS[key] ?? key).join("، ")}`}
                </p>
              )}
            </section>

            {TEST_PLANS.map((plan) => (
              <article
                key={plan.id}
                dir="rtl"
                className={`col-span-12 lg:col-span-4 flex flex-col rounded-3xl bg-white p-7 text-right ${
                  order?.plan_id === plan.id ? "ring-2 ring-[#007BFF]" : ""
                }`}
              >
                <span className="w-fit rounded-full bg-[#EEF6FF] px-3 py-1 text-[11px] text-[#007BFF]">آزمایشی</span>
                <h2 className="mt-4 text-xl font-primary text-[#6B6F77]">{plan.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#A0A4AA]">{plan.description}</p>
                <p className="mt-5 text-2xl font-bold text-[#4B5563]">
                  {rial(plan.price_irr)}
                  <span className="mr-2 text-sm font-medium text-[#A0A4AA]">ریال / ماه</span>
                </p>
                <p className="mt-2 text-sm text-[#6B6F77]">ظرفیت {rial(plan.athlete_capacity)} ورزشکار</p>
                <ul className="mt-4 grid gap-2 text-sm text-[#6B6F77]">
                  {plan.features.map((key) => (
                    <li key={key}>{FEATURE_LABELS[key] ?? key}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => choose(plan)}
                  className="mt-6 rounded-2xl bg-[#007BFF] py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
                >
                  انتخاب این پلن
                </button>
              </article>
            ))}

            {error && (
              <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700" dir="rtl">
                {error}
              </p>
            )}
            {saved && (
              <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700" dir="rtl">
                پرداخت ثبت شد و دوره دوباره خوانده شد.
              </p>
            )}

            {order && (
              <form onSubmit={pay} dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
                <h2 className="text-xl font-primary text-[#6B6F77]">
                  پرداخت {chosen ? chosen.name : "سفارش باز"}
                </h2>
                <p className="mt-2 text-sm text-[#A0A4AA]">
                  مبلغ سفارش {rial(order.price_irr)} ریال است. اگر عدد را عوض کنید، سرور پرداخت را رد می‌کند.
                </p>
                {requestedId && order.plan_id !== requestedId && (
                  <p className="mt-3 text-sm text-[#007BFF]">سفارش باز فعلی برای پلن دیگری است و تا پرداخت همان ادامه دارد.</p>
                )}
                <label className="mt-5 grid max-w-xs gap-2 text-xs text-[#6B6F77]">
                  مبلغ آزمایشی به ریال
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-left text-sm text-[#4B5563]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="mt-5 rounded-2xl bg-[#007BFF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
                >
                  ثبت پرداخت آزمایشی
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F5F7FB] px-4 py-3">
      <p className="text-xs text-[#A0A4AA]">{label}</p>
      <p className="mt-1 text-sm text-[#4B5563]">{value}</p>
    </div>
  );
}
