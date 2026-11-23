import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";

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
              <p className="col-span-12 rounded-3xl bg-white px-6 py-5 text-right text-sm leading-7 text-[#16845A]">
                پلن تو فعال است. برنامه را از بخش ورزش یا تغذیه بساز.
                <Link to="/trainingpage" className="mr-3 text-[#007BFF]">رفتن به ورزش</Link>
              </p>
            ) : null}
            <div className="col-span-12 grid gap-4 md:grid-cols-2" dir="rtl">
              {plans.length === 0 ? (
                <p className="rounded-3xl bg-white px-6 py-8 text-sm leading-8 text-[#6B6F77]">
                  هنوز پلن ورزشکاری برای فروش تعریف نشده. مدیر پلتفرم باید یک پلن با مخاطب «ورزشکار» بسازد.
                </p>
              ) : plans.map((plan) => (
                <article key={plan.id} className="rounded-3xl bg-white px-6 py-6 text-right">
                  <h2 className="text-xl text-[#243142]">{plan.name}</h2>
                  <p className="mt-2 text-sm text-[#6B6F77]">{plan.description || "برنامه و دستیار برای خود ورزشکار."}</p>
                  <p className="mt-4 text-lg text-[#16845A]">{rial(plan.price_irr)}</p>
                  <p className="mt-1 text-sm text-[#6B6F77]">مدت {period(plan)} · سهمیه دستیار {Number(plan.ai_request_quota || 0).toLocaleString("fa-IR")}</p>
                  <ul className="mt-4 grid gap-1 text-sm text-[#4B5563]">
                    {(plan.features ?? []).map((key) => (
                      <li key={key}>{FEATURE_LABELS[key] || key}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => buy(plan)}
                    disabled={busyId === plan.id}
                    className="mt-5 rounded-full bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-60"
                  >
                    {busyId === plan.id ? "در حال پرداخت" : "پرداخت آزمایشی و فعال‌سازی"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
