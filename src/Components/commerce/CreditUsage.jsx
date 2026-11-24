
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpLeft,
  Bot,
  CheckCircle2,
  Coins,
  CreditCard,
  Gauge,
  Layers3,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
  XCircle,
} from "lucide-react";

import { api, ApiError } from "../../api/client";
import { CreditGauge, KindBars } from "./UsageVisuals";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function formatRial(value) {
  return `${formatNumber(value)} ریال`;
}

function getError(caught, fallback) {
  return caught instanceof ApiError ? caught.message : fallback;
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-[#E8EDF5] bg-white p-4 dark:border-white/10 dark:bg-[#202B3B]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF5FF] text-[#007BFF] dark:bg-blue-500/10 dark:text-blue-400">
          <Icon size={19} />
        </div>

        <span className="text-xs text-[#96A0AE] dark:text-gray-400">
          {label}
        </span>
      </div>

      <p className="mt-4 text-xl font-black text-[#183153] dark:text-white">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-[#98A3B2] dark:text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}

function Message({ type, children }) {
  const styles = {
    error:
      "border-red-100 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
    success:
      "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  const Icon = type === "error" ? XCircle : CheckCircle2;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-7 ${styles[type]}`}
      dir="rtl"
    >
      <Icon size={18} className="mt-1 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3" dir="rtl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF5FF] text-[#007BFF] dark:bg-blue-500/10 dark:text-blue-400">
        <Icon size={20} />
      </div>

      <div>
        <h3 className="font-bold text-[#183153] dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs leading-6 text-[#929EAE] dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CreditUsage({ role }) {
  const [body, setBody] = useState(null);
  const [packs, setPacks] = useState([]);
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");
  const [count, setCount] = useState("10");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const base =
    role === "coach" ? "/api/v1/coach" : "/api/v1/athlete";

  async function refresh() {
    const [usage, listed] = await Promise.all([
      api(`${base}/usage`),
      api(`${base}/credit-packs`),
    ]);

    setBody(usage);
    setPacks(listed.packs ?? []);
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);
      setProblem("");

      try {
        await refresh();
      } catch (caught) {
        if (mounted) {
          setProblem(
            getError(caught, "اطلاعات مصرف دریافت نشد.")
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [role]);

  async function payOpened(opened) {
    const started = await api(
      `${base}/orders/${opened.order.id}/attempts`,
      {
        method: "POST",
        body: {
          idempotency_key: `topup-${opened.order.id}-${Date.now()}`,
        },
      }
    );

    const attempt = started.attempt ?? started;

    await api("/api/v1/payments/test/callback", {
      method: "POST",
      body: {
        attempt_id: attempt.id,
        amount_irr: opened.order.price_irr,
        gateway_reference: `topup-${attempt.id}-${Date.now()}`,
      },
    });

    await refresh();
    setNotice("کردیت خریداری‌شده با موفقیت به دوره فعلی اضافه شد.");
  }

  async function buy(packId) {
    if (busy) return;

    setBusy(true);
    setProblem("");
    setNotice("");

    try {
      const opened = await api(`${base}/credit-orders`, {
        method: "POST",
        body: { pack_id: packId },
      });

      await payOpened(opened);
    } catch (caught) {
      setProblem(
        getError(caught, "خرید کردیت انجام نشد. دوباره تلاش کن.")
      );
    } finally {
      setBusy(false);
    }
  }

  async function buyAmount(event) {
    event.preventDefault();

    if (busy) return;

    const credits = Number(count);

    if (!Number.isInteger(credits) || credits < 1) {
      setProblem("تعداد کردیت باید یک عدد صحیح و بزرگ‌تر از صفر باشد.");
      return;
    }

    if (stockLeft != null && credits > Number(stockLeft)) {
      setProblem("تعداد درخواستی بیشتر از موجودی قابل فروش است.");
      return;
    }

    setBusy(true);
    setProblem("");
    setNotice("");

    try {
      const opened = await api(`${base}/credit-orders`, {
        method: "POST",
        body: { credits },
      });

      await payOpened(opened);
    } catch (caught) {
      setProblem(
        getError(caught, "خرید کردیت انجام نشد. دوباره تلاش کن.")
      );
    } finally {
      setBusy(false);
    }
  }

  const access = body?.access?.access;
  const stock = body?.stock;
  const stockLeft = stock?.remaining_credits;

  const total = Number(access?.ai_request_quota || 0);
  const used = Number(access?.ai_requests_used || 0);
  const remaining = Math.max(0, total - used);

  const tokens =
    (Number(body?.tokens?.prompt) || 0) +
    (Number(body?.tokens?.completion) || 0);

  const validCount = Number(count) > 0 && Number.isFinite(Number(count));

  const estimate =
    stock?.usdt_per_credit && stock?.rial_per_usdt && validCount
      ? Math.round(
          Number(count) *
            Number(stock.usdt_per_credit) *
            Number(stock.rial_per_usdt)
        )
      : null;

  const overStock =
    stockLeft != null &&
    validCount &&
    Number(count) > Number(stockLeft);

  const canBuyManual =
    Boolean(access) &&
    stockLeft != null &&
    Number(stock?.usdt_per_credit) > 0 &&
    Number(stock?.rial_per_usdt) > 0;

  return (
    <section
      className="col-span-12 overflow-hidden rounded-[30px] border border-[#E8EDF5] bg-white shadow-[0_18px_55px_-35px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#171F2D]"
      dir="rtl"
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-[#10233D] px-6 py-7 text-white sm:px-8">
        <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-52 w-52 rounded-full bg-cyan-400/10 blur-[70px]" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-blue-200">
              <Sparkles size={15} />
              FITO AI CREDITS
            </div>

            <h2 className="text-2xl font-black sm:text-3xl">
              مدیریت اعتبار هوش مصنوعی
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              مصرف، موجودی و خرید اعتبار دستیار هوشمند فیتو را از یک بخش مدیریت کن.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-200">
            <Bot size={34} />
          </div>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        {problem && <Message type="error">{problem}</Message>}
        {notice && <Message type="success">{notice}</Message>}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="h-72 animate-pulse rounded-3xl bg-[#F0F4F9] dark:bg-[#202B3B]" />
            <div className="h-72 animate-pulse rounded-3xl bg-[#F0F4F9] dark:bg-[#202B3B]" />
          </div>
        ) : (
          <>
            {/* Usage Overview */}
            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-[26px] border border-[#E8EDF5] bg-gradient-to-b from-[#F0F6FF] to-white p-5 dark:border-white/10 dark:from-[#1C2D45] dark:to-[#202B3B]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#253B59] dark:text-white">
                    اعتبار این دوره
                  </span>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#007BFF] shadow-sm dark:bg-[#171F2D]">
                    <Gauge size={19} />
                  </div>
                </div>

                <CreditGauge
                  used={access ? used : 0}
                  total={access ? total : 0}
                />

                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-[#253B59] dark:text-white">
                    {access
                      ? `${formatNumber(used)} از ${formatNumber(total)} مصرف شده`
                      : "دوره فعالی نداری."}
                  </p>

                  <p className="mt-2 text-xs text-[#8794A7] dark:text-gray-400">
                    {access
                      ? `${formatNumber(remaining)} کردیت باقی‌مانده`
                      : "برای استفاده از دستیار، ابتدا اشتراک تهیه کن."}
                  </p>
                </div>

                {role === "coach" && access && (
                  <div className="mt-5 rounded-xl border border-blue-100 bg-white/80 px-4 py-3 text-center dark:border-white/10 dark:bg-[#171F2D]/60">
                    <p className="text-xs text-[#8B97A8] dark:text-gray-400">
                      ظرفیت ورزشکاران
                    </p>
                    <p className="mt-1 text-lg font-black text-[#007BFF]">
                      {formatNumber(access.athlete_capacity)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <SectionHeading
                    icon={Activity}
                    title="گزارش مصرف دستیار"
                    description="میزان استفاده از منابع هوش مصنوعی در دوره فعلی"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setProblem("");
                      setLoading(true);
                      refresh()
                        .catch((caught) =>
                          setProblem(
                            getError(caught, "بروزرسانی اطلاعات ناموفق بود.")
                          )
                        )
                        .finally(() => setLoading(false));
                    }}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E8EDF5] px-4 py-2.5 text-xs font-semibold text-[#53657D] transition hover:bg-[#F5F8FC] dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 sm:self-auto"
                  >
                    <RefreshCw size={14} />
                    بروزرسانی
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatCard
                    icon={Zap}
                    label="کل کردیت مصرفی"
                    value={formatNumber(used)}
                    description="در دوره جاری"
                  />

                  <StatCard
                    icon={Layers3}
                    label="کردیت باقی‌مانده"
                    value={formatNumber(remaining)}
                    description="از سهمیه فعلی"
                  />

                  <StatCard
                    icon={Activity}
                    label="کل توکن مصرفی"
                    value={formatNumber(tokens)}
                    description="ورودی و خروجی هوش مصنوعی"
                  />

                  <StatCard
                    icon={TrendingUp}
                    label="سهمیه کل"
                    value={formatNumber(total)}
                    description="اعتبار اختصاص‌یافته به دوره"
                  />
                </div>

                <div className="rounded-2xl border border-[#E8EDF5] bg-[#FAFBFD] p-4 dark:border-white/10 dark:bg-[#202B3B]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-[#253B59] dark:text-white">
                      تفکیک نوع مصرف
                    </p>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-[#007BFF] dark:bg-blue-500/10">
                      Usage Analytics
                    </span>
                  </div>

                  <KindBars rows={body?.by_kind ?? []} />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#EDF0F5] dark:bg-white/10" />

            {/* Buy Credits */}
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <div className="space-y-5">
                <SectionHeading
                  icon={Coins}
                  title="افزایش اعتبار"
                  description="به میزان دلخواه کردیت تهیه کن و از امکانات هوش مصنوعی استفاده کن."
                />

                <form
                  onSubmit={buyAmount}
                  className="rounded-[26px] border border-[#E6EDF6] bg-[#F8FAFD] p-5 dark:border-white/10 dark:bg-[#202B3B] sm:p-6"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#253B59] dark:text-white">
                        خرید با نرخ روز تتر
                      </p>

                      <p className="mt-1 text-xs text-[#929EAE] dark:text-gray-400">
                        مبلغ نهایی به‌صورت خودکار محاسبه می‌شود.
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#007BFF] shadow-sm dark:bg-[#171F2D]">
                      <Wallet size={21} />
                    </div>
                  </div>

                  {!canBuyManual ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-7 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                      مدیر هنوز موجودی پلتفرم یا قیمت هر کردیت را تنظیم نکرده است.
                      خرید دستی در حال حاضر غیرفعال است.
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="credit-count"
                            className="mb-2 block text-xs font-bold text-[#64748B] dark:text-gray-300"
                          >
                            تعداد کردیت موردنیاز
                          </label>

                          <input
                            id="credit-count"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max={stockLeft}
                            step="1"
                            value={count}
                            onChange={(event) =>
                              setCount(event.target.value)
                            }
                            className="w-full rounded-2xl border border-[#DCE5F0] bg-white px-4 py-3.5 text-sm font-bold text-[#183153] outline-none transition focus:border-[#007BFF] focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#171F2D] dark:text-white"
                            placeholder="مثلاً 10"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold text-[#64748B] dark:text-gray-300">
                            مبلغ قابل پرداخت
                          </label>

                          <div className="flex min-h-[50px] items-center rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3.5 text-sm font-black text-[#0069D9] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                            {estimate === null
                              ? "قیمت نامشخص"
                              : formatRial(estimate)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 dark:bg-[#171F2D]">
                        <div className="flex items-center gap-2 text-xs text-[#7E8A9A] dark:text-gray-400">
                          <Package size={15} />
                          موجودی قابل فروش
                        </div>

                        <p className="text-sm font-bold text-[#183153] dark:text-white">
                          {formatNumber(stockLeft)} کردیت
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#8B97A8] dark:text-gray-400">
                        <span>
                          هر کردیت: {Number(stock.usdt_per_credit)} تتر
                        </span>
                        <span className="text-[#CBD5E1]">|</span>
                        <span>
                          نرخ تتر: {formatRial(stock.rial_per_usdt)}
                        </span>
                      </div>

                      {overStock && (
                        <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">
                          تعداد درخواستی از موجودی پلتفرم بیشتر است.
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={
                          busy ||
                          !access ||
                          overStock ||
                          !validCount ||
                          Number(count) < 1
                        }
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/15 transition hover:bg-[#0069DC] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy ? (
                          <>
                            <RefreshCw size={17} className="animate-spin" />
                            در حال پردازش خرید...
                          </>
                        ) : (
                          <>
                            <CreditCard size={18} />
                            پرداخت و افزایش اعتبار
                            <ArrowLeft size={17} />
                          </>
                        )}
                      </button>
                    </>
                  )}
                </form>
              </div>

              {/* Side information */}
              <aside className="flex flex-col gap-4">
                <div className="rounded-[26px] bg-[#10233D] p-5 text-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-300">
                    <ShieldCheck size={23} />
                  </div>

                  <h3 className="mt-5 font-bold">
                    اعتبار هوشمند فیتو
                  </h3>

                  <p className="mt-2 text-xs leading-7 text-slate-300">
                    با افزایش اعتبار، امکان استفاده بیشتر از ابزارهای هوش مصنوعی
                    را در دوره فعلی خواهی داشت.
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-blue-200">
                    <Sparkles size={15} />
                    مدیریت ساده و شفاف مصرف
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#E8EDF5] bg-white p-5 dark:border-white/10 dark:bg-[#202B3B]">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-[#253B59] dark:text-white">
                      نکته مهم
                    </h3>
                  </div>

                  <p className="mt-3 text-xs leading-7 text-[#8B97A8] dark:text-gray-400">
                    اعتبار خریداری‌شده طبق قوانین سیستم به دوره فعلی اضافه
                    می‌شود. قبل از خرید، تعداد موردنیاز و مبلغ نهایی را بررسی کن.
                  </p>
                </div>
              </aside>
            </div>

            {/* Credit Packs */}
            {packs.length > 0 && access && (
              <>
                <div className="h-px bg-[#EDF0F5] dark:bg-white/10" />

                <div>
                  <div className="mb-5">
                    <SectionHeading
                      icon={Package}
                      title="بسته‌های آماده کردیت"
                      description="یکی از بسته‌های تعریف‌شده را سریع‌تر انتخاب کن."
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {packs.map((pack, index) => (
                      <div
                        key={pack.id}
                        className="group flex flex-col rounded-[22px] border border-[#E8EDF5] bg-white p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-white/10 dark:bg-[#202B3B]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF5FF] text-[#007BFF] dark:bg-blue-500/10 dark:text-blue-400">
                            <Coins size={20} />
                          </div>

                          {index === 0 && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-[#007BFF] dark:bg-blue-500/10">
                              بسته پیشنهادی
                            </span>
                          )}
                        </div>

                        <h4 className="mt-4 font-bold text-[#253B59] dark:text-white">
                          {pack.name}
                        </h4>

                        <p className="mt-2 text-2xl font-black text-[#007BFF]">
                          {formatNumber(pack.credits)}
                          <span className="mr-1 text-xs font-medium text-[#8B97A8]">
                            کردیت
                          </span>
                        </p>

                        <button
                          type="button"
                          onClick={() => buy(pack.id)}
                          disabled={busy}
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-[#F3F8FF] px-4 py-3 text-xs font-bold text-[#0069D9] transition hover:bg-[#007BFF] hover:text-white disabled:opacity-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                        >
                          {busy ? (
                            <RefreshCw size={15} className="animate-spin" />
                          ) : (
                            <>
                              خرید این بسته
                              <ArrowUpLeft size={15} />
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
