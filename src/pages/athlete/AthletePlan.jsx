// ============================================================
// AthletePlan — صفحه پلن ورزشکار (بازطراحی کامل UI)
// ============================================================
// فقط UI عوض شده است؛ منطق، APIها و متن‌های بک‌اند دست نخورده‌اند:
//   - load(): GET /api/v1/athlete/plans + GET /api/v1/athlete/access
//   - buy(): ساخت سفارش، ثبت attempt، کال‌بک تستی پرداخت، ریلود
//   - قیمت، سهمیه کردیت و فیچرها فقط از فیلدهای واقعی پلن می‌آیند
//     (name, description, price_irr, billing_interval_*,
//     ai_request_quota, features) — هیچ عدد و فیچری ساخته نشده است.
//   - Navbar همان نوبار داشبورد است و اینجا درست است؛ با BlogNavbar
//     عوض نشده است.
// نصب: کپی در جای AthletePlan در فرانت (مثلاً src/pages/athlete/).
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import CreditUsage from "../../Components/commerce/CreditUsage";

const FEATURE_LABELS = {
  workout_programs: "برنامه تمرین",
  nutrition_programs: "برنامه غذا",
  body_analysis: "تحلیل بدن",
  ai_athlete_access: "چت با هوش مصنوعی",
  progress_reports: "گزارش پیشرفت",
};

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function rial(value) {
  return `${Number(value || 0).toLocaleString("fa-IR")} ریال`;
}

function period(plan) {
  const count = Number(plan.billing_interval_count || 1).toLocaleString("fa-IR");
  return plan.billing_interval_unit === "day" ? `${count} روز` : `${count} ماه`;
}

export default function AthletePlan() {
  const [plans, setPlans] = useState([]);
  const [access, setAccess] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  function load() {
    return Promise.all([
      api("/api/v1/athlete/plans"),
      api("/api/v1/athlete/access"),
    ]).then(([planBody, accessBody]) => {
      setPlans(planBody.plans ?? []);
      setAccess(accessBody);
    });
  }

  useEffect(() => {
    load().catch((caught) => setError(errorText(caught)));
  }, []);

  async function buy(plan) {
    setBusyId(plan.id);
    setError("");
    setNotice("");

    try {
      const opened = await api("/api/v1/athlete/orders", {
        method: "POST",
        body: { plan_id: plan.id },
      });
      const started = await api(`/api/v1/athlete/orders/${opened.order.id}/attempts`, {
        method: "POST",
        body: { idempotency_key: `self-${plan.id}-${Date.now()}` },
      });
      await api("/api/v1/payments/test/callback", {
        method: "POST",
        body: {
          attempt_id: started.attempt.id,
          amount_irr: opened.order.price_irr,
          gateway_reference: `self-${started.attempt.id}-${Date.now()}`,
        },
      });
      await load();
      setNotice("پلن فعال شد. از ورزش یا تغذیه می‌توانی برنامه هوش مصنوعی بسازی.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusyId(null);
    }
  }

  const active = access?.access?.status === "active";

  return (
    <div dir="rtl" className="flex min-h-screen justify-center bg-background text-foreground">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>

        <div className="min-w-0 py-1 lg:py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard title="پلن ورزشکار" description="بدون مربی هم می‌توانی برنامه تمرین، غذا، تحلیل بدن و چت با هوش مصنوعی بگیری." />

            {error ? (
              <div
                role="alert"
                className="col-span-12 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-7 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              >
                <AlertCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            ) : null}

            {notice ? (
              <div
                role="status"
                className="col-span-12 flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>{notice}</p>
              </div>
            ) : null}

            {active ? (
              <div className="col-span-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">پلن تو فعال است</p>
                    <p className="mt-1 text-sm leading-7 text-emerald-700/80 dark:text-emerald-300/80">
                      برنامه را از بخش ورزش یا تغذیه بساز.
                    </p>
                  </div>
                </div>
                <Link
                  to="/trainingpage"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  رفتن به ورزش
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : null}

            <div className="col-span-12">
              <CreditUsage role="athlete" />
            </div>

            <div className="col-span-12 mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">پلن‌های ورزشکار</h2>
                <p className="mt-1 text-sm text-muted">
                  پلن مناسب خودت را انتخاب کن؛ فعال‌سازی فوری است.
                </p>
              </div>
              {plans.length > 0 ? (
                <span className="rounded-full bg-surface px-4 py-1.5 text-xs font-bold text-muted ring-1 ring-border">
                  {plans.length.toLocaleString("fa-IR")} پلن
                </span>
              ) : null}
            </div>

            <div className="col-span-12">
              {plans.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-12 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <CreditCard className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-lg font-bold">هنوز پلنی تعریف نشده</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-8 text-muted">
                    هنوز پلن ورزشکاری برای فروش تعریف نشده. مدیر پلتفرم باید یک پلن با مخاطب «ورزشکار» بسازد.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {plans.map((plan, index) => {
                    const featured = index === 0;
                    const features = plan.features ?? [];
                    return (
                      <article
                        key={plan.id}
                        className={`relative flex flex-col overflow-hidden rounded-3xl border p-6 ${
                          featured
                            ? "border-primary bg-primary text-white shadow-[0_24px_50px_-24px_rgba(0,123,255,0.7)]"
                            : "border-border bg-surface"
                        }`}
                      >
                        {featured ? (
                          <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            پیشنهادی
                          </span>
                        ) : null}

                        <p className={`text-xs font-semibold ${featured ? "text-white/70" : "text-muted"}`}>
                          {period(plan)}
                        </p>
                        <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                        <p className={`mt-2 min-h-12 text-sm leading-7 ${featured ? "text-white/80" : "text-muted"}`}>
                          {plan.description || "برنامه و دستیار برای خود ورزشکار."}
                        </p>

                        <div
                          className={`mt-5 flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 ${
                            featured ? "bg-white/15" : "bg-surface-secondary"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-bold">
                            <Zap className={`h-5 w-5 ${featured ? "text-white" : "text-primary"}`} aria-hidden="true" />
                            کردیت هوش مصنوعی
                          </span>
                          <span className="text-xl font-black">
                            {Number(plan.ai_request_quota || 0).toLocaleString("fa-IR")}
                            <span className={`mr-1 text-xs font-semibold ${featured ? "text-white/70" : "text-muted"}`}>
                              کردیت
                            </span>
                          </span>
                        </div>

                        <div className="mt-5">
                          <p className={`text-lg font-black ${featured ? "text-white" : "text-foreground"}`}>
                            {rial(plan.price_irr)}
                          </p>
                          <p className={`mt-0.5 text-xs ${featured ? "text-white/70" : "text-muted"}`}>
                            برای هر {period(plan)}
                          </p>
                        </div>

                        {features.length > 0 ? (
                          <ul className="mt-5 flex-1 space-y-2.5">
                            {features.map((key) => (
                              <li key={key} className="flex items-center gap-2.5 text-sm font-medium">
                                <span
                                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                                    featured ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                </span>
                                {FEATURE_LABELS[key] || key}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => buy(plan)}
                          disabled={busyId === plan.id}
                          className={`mt-6 w-full rounded-2xl px-5 py-3.5 text-sm font-bold transition disabled:opacity-60 ${
                            featured
                              ? "bg-white text-primary hover:bg-white/90"
                              : "bg-primary text-white hover:bg-primary/90"
                          }`}
                        >
                          {busyId === plan.id ? "در حال پرداخت" : "پرداخت آزمایشی و فعال‌سازی"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
