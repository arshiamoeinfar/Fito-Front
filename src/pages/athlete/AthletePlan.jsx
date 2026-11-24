import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-1 lg:py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard title="پلن ورزشکار" description="بدون مربی هم می‌توانی برنامه تمرین، غذا، تحلیل بدن و چت با هوش مصنوعی بگیری." />
            {error ? <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p> : null}
            {notice ? <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700">{notice}</p> : null}
            {active ? (
              <p className="col-span-12 rounded-[28px] bg-[#EAF8F1] px-6 py-5 text-right text-sm leading-7 text-[#16845A]">
                پلن تو فعال است. برنامه را از بخش ورزش یا تغذیه بساز.
                <Link to="/trainingpage" className="mr-3 font-medium text-[#0B5FD0]">رفتن به ورزش</Link>
              </p>
            ) : null}
            <CreditUsage role="athlete" />
            <div className="col-span-12 grid gap-4 md:grid-cols-2" dir="rtl">
              {plans.length === 0 ? (
                <p className="rounded-[28px] bg-white px-6 py-8 text-sm leading-8 text-[#6B6F77]">
                  هنوز پلن ورزشکاری برای فروش تعریف نشده. مدیر پلتفرم باید یک پلن با مخاطب «ورزشکار» بسازد.
                </p>
              ) : plans.map((plan, index) => {
                const featured = index === 0;
                return (
                  <article key={plan.id} className={`relative overflow-hidden rounded-[28px] px-6 py-6 text-right ${featured ? "bg-[#0B5FD0] text-white shadow-[0_18px_40px_-22px_rgba(11,95,208,0.7)]" : "border border-[#E8ECF4] bg-white text-[#16324F]"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-xs ${featured ? "text-white/70" : "text-[#6B7280]"}`}>{period(plan)}</p>
                        <h2 className="mt-2 text-2xl">{plan.name}</h2>
                      </div>
                      <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full ${featured ? "bg-white/15" : "bg-[#EAF3FF]"}`}>
                        <span className="text-sm font-semibold">{Number(plan.ai_request_quota || 0).toLocaleString("fa-IR")}</span>
                        <span className={`text-[10px] ${featured ? "text-white/70" : "text-[#0B5FD0]"}`}>کردیت</span>
                      </div>
                    </div>
                    <p className={`mt-3 min-h-12 text-sm leading-7 ${featured ? "text-white/80" : "text-[#6B7280]"}`}>{plan.description || "برنامه و دستیار برای خود ورزشکار."}</p>
                    <p className="mt-4 text-2xl font-semibold">{rial(plan.price_irr)}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {(plan.features ?? []).map((key) => (
                        <li key={key} className={`rounded-full px-3 py-1 text-xs ${featured ? "bg-white/15" : "bg-[#F5F7FB] text-[#374151]"}`}>{FEATURE_LABELS[key] || key}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => buy(plan)}
                      disabled={busyId === plan.id}
                      className={`mt-6 rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-60 ${featured ? "bg-white text-[#0B5FD0]" : "bg-[#007BFF] text-white"}`}
                    >
                      {busyId === plan.id ? "در حال پرداخت" : "پرداخت آزمایشی و فعال‌سازی"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
