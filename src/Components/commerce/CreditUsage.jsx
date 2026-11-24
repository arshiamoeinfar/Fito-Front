import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import { CreditGauge, KindBars } from "./UsageVisuals";

export default function CreditUsage({ role }) {
  const [body, setBody] = useState(null);
  const [packs, setPacks] = useState([]);
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");
  const [count, setCount] = useState("10");

  function refresh() {
    const base = role === "coach" ? "/api/v1/coach" : "/api/v1/athlete";
    return Promise.all([api(`${base}/usage`), api(`${base}/credit-packs`)]).then(([usage, listed]) => {
      setBody(usage);
      setPacks(listed.packs ?? []);
    });
  }

  useEffect(() => {
    refresh().catch((caught) => setProblem(caught instanceof ApiError ? caught.message : "مصرف خوانده نشد."));
  }, [role]);

  async function payOpened(opened) {
    const base = role === "coach" ? "/api/v1/coach" : "/api/v1/athlete";
    const started = await api(`${base}/orders/${opened.order.id}/attempts`, {
      method: "POST",
      body: { idempotency_key: `topup-${opened.order.id}-${Date.now()}` },
    });
    const attempt = started.attempt ?? started;
    await api("/api/v1/payments/test/callback", {
      method: "POST",
      body: {
        attempt_id: attempt.id,
        amount_irr: opened.order.price_irr,
        gateway_reference: `topup-${attempt.id}-${Date.now()}`,
      },
    });
    setNotice("کردیت اضافه به همین دوره افزوده شد.");
    await refresh();
  }

  async function buy(packId) {
    const base = role === "coach" ? "/api/v1/coach" : "/api/v1/athlete";
    setProblem("");
    try {
      const opened = await api(`${base}/credit-orders`, { method: "POST", body: { pack_id: packId } });
      await payOpened(opened);
    } catch (caught) {
      setProblem(caught instanceof ApiError ? caught.message : "خرید کردیت انجام نشد.");
    }
  }

  async function buyAmount(event) {
    event.preventDefault();
    const base = role === "coach" ? "/api/v1/coach" : "/api/v1/athlete";
    setProblem("");
    try {
      const opened = await api(`${base}/credit-orders`, { method: "POST", body: { credits: Number(count) } });
      await payOpened(opened);
    } catch (caught) {
      setProblem(caught instanceof ApiError ? caught.message : "خرید کردیت انجام نشد.");
    }
  }

  const access = body?.access?.access;
  const stock = body?.stock;
  const stockLeft = stock?.remaining_credits;
  const estimate = stock?.usdt_per_credit && stock?.rial_per_usdt
    ? Math.round(Number(count || 0) * Number(stock.usdt_per_credit) * Number(stock.rial_per_usdt))
    : null;
  const overStock = stockLeft != null && Number(count || 0) > stockLeft;
  const total = Number(access?.ai_request_quota || 0);
  const used = Number(access?.ai_requests_used || 0);
  const tokens = (Number(body?.tokens?.prompt) || 0) + (Number(body?.tokens?.completion) || 0);

  return (
    <section className="col-span-12 overflow-hidden rounded-[28px] border border-[#E8ECF4] bg-white text-right shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)]" dir="rtl">
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="bg-[radial-gradient(circle_at_top,_#EAF3FF,_#F7FAFE_55%)] px-6 py-6">
          <p className="text-sm text-[#4B5563]">کردیت این دوره</p>
          <CreditGauge used={access ? used : 0} total={access ? total : 0} />
          <p className="text-center text-sm text-[#6B7280]">
            {access ? `${used.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} مصرف شده` : "دوره فعالی نداری."}
          </p>
          {role === "coach" && access ? (
            <p className="mt-3 text-center text-xs text-[#6B7280]">ظرفیت {Number(access.athlete_capacity || 0).toLocaleString("fa-IR")} ورزشکار</p>
          ) : null}
        </div>
        <div className="grid gap-5 px-6 py-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg text-[#16324F]">مصرف دستیار</h2>
              <p className="mt-1 text-sm text-[#6B7280]">توکن واقعی این دوره {tokens.toLocaleString("fa-IR")} است. رنگ هر نوار نوع استفاده را جدا می‌کند.</p>
            </div>
          </div>
          {problem ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{problem}</p> : null}
          {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}
          <KindBars rows={body?.by_kind ?? []} />
          <form onSubmit={buyAmount} className="grid gap-3 rounded-2xl bg-[#F7FAFE] p-4">
            <p className="text-sm text-[#16324F]">خرید کردیت با نرخ تتر</p>
            {stockLeft == null || !stock?.usdt_per_credit || !stock?.rial_per_usdt ? (
              <p className="text-sm leading-7 text-[#6B7280]">مدیر هنوز موجودی پلتفرم یا قیمت تتری هر کردیت را نگذاشته. تا آن موقع خرید دستی باز نمی‌شود.</p>
            ) : (
              <>
                <p className="text-xs text-[#6B7280]">موجودی قابل فروش الان {Number(stockLeft).toLocaleString("fa-IR")} کردیت است. هر کردیت {Number(stock.usdt_per_credit)} تتر، و هر تتر {Number(stock.rial_per_usdt).toLocaleString("fa-IR")} ریال.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input className="w-28 rounded-2xl border border-[#D7E2F0] px-3 py-2 text-sm" inputMode="numeric" min="1" max={stockLeft} value={count} onChange={(event) => setCount(event.target.value)} />
                  <button type="submit" disabled={!access || overStock || Number(count) < 1} className="rounded-full bg-[#0B5FD0] px-4 py-2 text-sm text-white disabled:opacity-50">
                    پرداخت {estimate == null ? "" : `${estimate.toLocaleString("fa-IR")} ریال`}
                  </button>
                </div>
                {overStock ? <p className="text-xs text-red-700">این تعداد از موجودی پلتفرم بیشتر است.</p> : null}
              </>
            )}
          </form>
          {packs.length > 0 && access ? (
            <div className="flex flex-wrap gap-2">
              {packs.map((pack) => (
                <button key={pack.id} type="button" onClick={() => buy(pack.id)} className="rounded-full border border-[#D7E6FA] bg-[#F5F9FF] px-4 py-2 text-sm text-[#0B5FD0]">
                  {pack.name} · {Number(pack.credits).toLocaleString("fa-IR")} کردیت
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
