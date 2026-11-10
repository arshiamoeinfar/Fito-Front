import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";

const FEATURES = [
  ["workout_programs", "برنامه تمرین"],
  ["nutrition_programs", "تغذیه"],
  ["body_analysis", "آنالیز بدن"],
  ["ai_coach_assistant", "دستیار مربی"],
  ["ai_athlete_access", "دستیار ورزشکار"],
  ["progress_reports", "گزارش پیشرفت"],
];

const FEATURE_LABELS = Object.fromEntries(FEATURES);

const EMPTY_PLAN = {
  code: "",
  name: "",
  description: "",
  price_irr: "",
  billing_interval_unit: "month",
  billing_interval_count: "1",
  athlete_capacity: "",
  ai_request_quota: "",
  is_sellable: true,
  features: [],
};

function rial(value) {
  return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
}

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  const fieldError = caught.errors ? Object.values(caught.errors).flat().find((item) => typeof item === "string") : null;
  return fieldError || caught.message;
}

export default function AdminPlans() {
  const { status, account, refresh } = useSession();

  if (status === "loading") {
    return <Notice>در حال بررسی حساب</Notice>;
  }

  if (status === "error") {
    return (
      <Notice>
        <p>ارتباط با سرور برقرار نشد.</p>
        <button
          type="button"
          className="rounded-xl bg-[#007BFF] px-5 py-3 text-sm text-white"
          onClick={() => {
            refresh().catch(() => {});
          }}
        >
          تلاش دوباره
        </button>
      </Notice>
    );
  }

  if (status !== "authenticated" || !account) {
    return <Navigate to="/" replace />;
  }

  return <AdminDesk />;
}

function AdminDesk() {
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [draft, setDraft] = useState(EMPTY_PLAN);
  const [payOrderId, setPayOrderId] = useState(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [notice, setNotice] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([api("/api/v1/admin/plans"), api("/api/v1/admin/orders")]).then(
      ([planBody, orderBody]) => {
        if (!active) {
          return;
        }

        setPlans(Array.isArray(planBody?.plans) ? planBody.plans : []);
        setOrders(Array.isArray(orderBody?.orders) ? orderBody.orders : []);
        setForbidden(false);
      },
      (caught) => {
        if (!active) {
          return;
        }

        setForbidden(caught instanceof ApiError && caught.status === 403);
        setError(errorText(caught));
      },
    );

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const paying = orders.find((order) => order.id === payOrderId) ?? null;

  async function run(action) {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await action();
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function toggleFeature(key) {
    setDraft((current) => ({
      ...current,
      features: current.features.includes(key)
        ? current.features.filter((item) => item !== key)
        : [...current.features, key],
    }));
  }

  function createPlan(event) {
    event.preventDefault();
    const quota = draft.ai_request_quota.trim();

    run(async () => {
      await api("/api/v1/admin/plans", {
        method: "POST",
        body: {
          code: draft.code.trim(),
          name: draft.name.trim(),
          description: draft.description.trim() === "" ? null : draft.description.trim(),
          price_irr: Number(draft.price_irr),
          billing_interval_unit: draft.billing_interval_unit,
          billing_interval_count: Number(draft.billing_interval_count),
          athlete_capacity: Number(draft.athlete_capacity),
          ai_request_quota: quota === "" ? null : Number(quota),
          is_sellable: draft.is_sellable,
          features: draft.features,
        },
      });
      setDraft(EMPTY_PLAN);
      setNotice("پلن ساخته شد.");
    });
  }

  function removePlan(plan) {
    run(async () => {
      await api(`/api/v1/admin/plans/${plan.id}`, { method: "DELETE" });
      setNotice("پلن حذف شد.");
    });
  }

  function choosePayment(order) {
    setPayOrderId(order.id);
    setAmount(String(order.price_irr));
    setReference("");
    setError(null);
    setNotice(null);
  }

  function recordPayment(event) {
    event.preventDefault();

    run(async () => {
      const result = await api(`/api/v1/admin/orders/${paying.id}/manual-payments`, {
        method: "POST",
        body: {
          amount_irr: Number(amount),
          gateway_reference: reference.trim(),
        },
      });
      setPayOrderId(null);
      setNotice(`پرداخت ثبت شد. دوره ${result?.access_period_id ?? ""}`.trim());
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-1 gap-6 bg-[#F5F7FB] px-4 pb-6 pt-24 lg:grid-cols-[90px_1fr] lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="مدیریت پلن" description="ساخت پلن و پرداخت دستی. مبلغ‌ها به ریال است." />
            <div className="col-span-12 flex gap-4" dir="rtl">
              <Link to="/admin/users" className="text-sm text-[#007BFF]">حساب کاربران</Link>
              <Link to="/admin/settings" className="text-sm text-[#007BFF]">تنظیمات دستیار</Link>
              <Link to="/admin/homepage" className="text-sm text-[#007BFF]">صفحه اصلی</Link>
            </div>

            {error && (
              <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700" dir="rtl">
                {error}
              </p>
            )}
            {notice && (
              <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700" dir="rtl">
                {notice}
              </p>
            )}

            {forbidden ? null : (
              <>
                <form onSubmit={createPlan} dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
                  <h2 className="text-xl font-primary text-[#6B6F77]">پلن جدید</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <Field label="کد" value={draft.code} onChange={(value) => updateDraft("code", value)} />
                    <Field label="نام" value={draft.name} onChange={(value) => updateDraft("name", value)} />
                    <Field label="مبلغ به ریال" value={draft.price_irr} onChange={(value) => updateDraft("price_irr", value)} numeric />
                    <Field label="ظرفیت ورزشکار" value={draft.athlete_capacity} onChange={(value) => updateDraft("athlete_capacity", value)} numeric />
                    <Field label="طول دوره" value={draft.billing_interval_count} onChange={(value) => updateDraft("billing_interval_count", value)} numeric />
                    <label className="grid gap-2 text-xs text-[#6B6F77]">
                      واحد دوره
                      <select
                        value={draft.billing_interval_unit}
                        onChange={(event) => updateDraft("billing_interval_unit", event.target.value)}
                        className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm text-[#4B5563]"
                      >
                        <option value="month">ماه</option>
                        <option value="day">روز</option>
                      </select>
                    </label>
                    <Field label="سهمیه دستیار" value={draft.ai_request_quota} onChange={(value) => updateDraft("ai_request_quota", value)} numeric />
                    <Field label="توضیح" value={draft.description} onChange={(value) => updateDraft("description", value)} />
                  </div>
                  <fieldset className="mt-4 grid gap-2 md:grid-cols-3">
                    <legend className="mb-2 text-xs text-[#6B6F77]">قابلیت‌ها</legend>
                    {FEATURES.map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-[#4B5563]">
                        <input
                          type="checkbox"
                          checked={draft.features.includes(key)}
                          onChange={() => toggleFeature(key)}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  <label className="mt-4 flex items-center gap-2 text-sm text-[#4B5563]">
                    <input
                      type="checkbox"
                      checked={draft.is_sellable}
                      onChange={(event) => updateDraft("is_sellable", event.target.checked)}
                    />
                    قابل فروش
                  </label>
                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-5 rounded-2xl bg-[#007BFF] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    ساخت پلن
                  </button>
                </form>

                <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
                  <h2 className="text-xl font-primary text-[#6B6F77]">پلن‌ها</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-right text-sm text-[#4B5563]">
                      <thead className="text-xs text-[#A0A4AA]">
                        <tr>
                          <th className="py-2 font-medium">نام</th>
                          <th className="py-2 font-medium">مبلغ</th>
                          <th className="py-2 font-medium">ظرفیت</th>
                          <th className="py-2 font-medium">قابلیت‌ها</th>
                          <th className="py-2 font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {plans.map((plan) => (
                          <tr key={plan.id} className="border-t border-[#F0F2F5]">
                            <td className="py-3">{plan.name}</td>
                            <td className="py-3">{rial(plan.price_irr)} ریال</td>
                            <td className="py-3">{rial(plan.athlete_capacity)}</td>
                            <td className="py-3">{(plan.features ?? []).map((key) => FEATURE_LABELS[key] ?? key).join("، ") || "—"}</td>
                            <td className="py-3">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => removePlan(plan)}
                                className="text-[#007BFF] disabled:opacity-60"
                              >
                                حذف
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
                  <h2 className="text-xl font-primary text-[#6B6F77]">سفارش‌ها</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-right text-sm text-[#4B5563]">
                      <thead className="text-xs text-[#A0A4AA]">
                        <tr>
                          <th className="py-2 font-medium">سفارش</th>
                          <th className="py-2 font-medium">پلن</th>
                          <th className="py-2 font-medium">مبلغ</th>
                          <th className="py-2 font-medium">وضعیت</th>
                          <th className="py-2 font-medium">پرداخت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const plan = plans.find((item) => item.id === order.plan_id);
                          return (
                            <tr key={order.id} className="border-t border-[#F0F2F5]">
                              <td className="py-3">{order.id}</td>
                              <td className="py-3">{plan?.name ?? order.plan_id}</td>
                              <td className="py-3">{rial(order.price_irr)} ریال</td>
                              <td className="py-3">{orderLabel(order.status)}</td>
                              <td className="py-3">
                                {order.payment ? (
                                  <span>{order.payment.gateway === "manual" ? "دستی" : order.payment.gateway}</span>
                                ) : order.status === "pending" ? (
                                  <button type="button" className="text-[#007BFF]" onClick={() => choosePayment(order)}>
                                    پرداخت دستی
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {paying && (
                  <form onSubmit={recordPayment} dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
                    <h2 className="text-xl font-primary text-[#6B6F77]">پرداخت دستی سفارش {paying.id}</h2>
                    <p className="mt-2 text-sm text-[#A0A4AA]">مبلغ سفارش {rial(paying.price_irr)} ریال است. اختلاف مبلغ دوره نمی‌سازد.</p>
                    <div className="mt-4 grid max-w-xl gap-4 md:grid-cols-2">
                      <Field label="مبلغ به ریال" value={amount} onChange={setAmount} numeric />
                      <Field label="مرجع پرداخت" value={reference} onChange={setReference} />
                    </div>
                    <button
                      type="submit"
                      disabled={pending}
                      className="mt-5 rounded-2xl bg-[#007BFF] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      ثبت پرداخت دستی
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function orderLabel(status) {
  if (status === "pending") return "در انتظار";
  if (status === "paid") return "پرداخت‌شده";
  if (status === "expired") return "منقضی";
  if (status === "cancelled") return "لغو";
  return status || "—";
}

function Field({ label, value, onChange, numeric = false }) {
  return (
    <label className="grid gap-2 text-xs text-[#6B6F77]">
      {label}
      <input
        dir={numeric ? "ltr" : undefined}
        inputMode={numeric ? "numeric" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm text-[#4B5563]"
      />
    </label>
  );
}

function Notice({ children }) {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-white px-6 font-primary text-[#1a1a1a]">
      <div className="flex flex-col items-center gap-4 text-center">{children}</div>
    </div>
  );
}
