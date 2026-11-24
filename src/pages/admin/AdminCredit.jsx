import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { KindBars, TokenSplit } from "../../Components/commerce/UsageVisuals";

const KINDS = [
  ["chat", "گفتگو"],
  ["workout_program", "برنامه تمرین"],
  ["meal_plan", "برنامه غذا"],
  ["body_analysis", "تحلیل بدن"],
  ["progress_review", "مرور پیشرفت"],
];

const EMPTY = Object.fromEntries(KINDS.map(([kind]) => [kind, { credits: "", max_output_tokens: "" }]));

export default function AdminCredit() {
  const [bundle, setBundle] = useState("");
  const [ceiling, setCeiling] = useState("");
  const [usdt, setUsdt] = useState("");
  const [tetherRate, setTetherRate] = useState("");
  const [stockLeft, setStockLeft] = useState(null);
  const [weights, setWeights] = useState(EMPTY);
  const [usage, setUsage] = useState(null);
  const [pack, setPack] = useState({ audience: "coach", name: "", credits: "", price_irr: "", is_sellable: true });
  const [notice, setNotice] = useState("");

  function load() {
    api("/api/v1/admin/credits").then((body) => {
      setBundle(body.policy?.tokens_per_credit ?? "");
      setCeiling(body.policy?.platform_token_ceiling ?? "");
      setUsdt(body.policy?.usdt_per_credit ?? "");
      setTetherRate(body.policy?.rial_per_usdt ?? "");
      setStockLeft(body.policy?.remaining_credits ?? null);
      const next = { ...EMPTY };
      (body.weights ?? []).forEach((row) => {
        next[row.kind] = { credits: row.credits, max_output_tokens: row.max_output_tokens };
      });
      setWeights(next);
      setUsage(body.usage ?? null);
    }).catch((caught) => setNotice(caught instanceof ApiError ? caught.message : "خواندن تنظیم کردیت ناموفق بود."));
  }

  useEffect(() => {
    load();
  }, []);

  async function savePolicy(event) {
    event.preventDefault();
    const rows = KINDS
      .map(([kind]) => weights[kind])
      .map((row, index) => ({ kind: KINDS[index][0], credits: Number(row.credits), max_output_tokens: Number(row.max_output_tokens) }))
      .filter((row) => row.credits > 0 && row.max_output_tokens > 0);
    await api("/api/v1/admin/credits", {
      method: "PUT",
      body: {
        tokens_per_credit: bundle === "" ? null : Number(bundle),
        platform_token_ceiling: ceiling === "" ? null : Number(ceiling),
        usdt_per_credit: usdt === "" ? null : Number(usdt),
        rial_per_usdt: tetherRate === "" ? null : Number(tetherRate),
        weights: rows,
      },
    });
    setNotice("سیاست کردیت ذخیره شد.");
    load();
  }

  async function savePack(event) {
    event.preventDefault();
    await api("/api/v1/admin/credit-packs", {
      method: "POST",
      body: { ...pack, credits: Number(pack.credits), price_irr: Number(pack.price_irr) },
    });
    setNotice("بسته کردیت اضافه ذخیره شد.");
    setPack({ audience: "coach", name: "", credits: "", price_irr: "", is_sellable: true });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]" dir="rtl">
      <Navbar />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        <HeaderDashBoard title="کردیت و مصرف" description="یک کردیت یعنی یک استفاده عادی، نه یک توکن خام. سقف قرارداد را خودت از پنل شرکت هوش مصنوعی وارد می‌کنی." />
        <Link to="/admin/plans" className="text-sm text-[#007BFF]">بازگشت به پلن‌ها</Link>
        {notice ? <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#243142]">{notice}</p> : null}
        {ceiling === "" || ceiling === null ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">سقف توکن قرارداد خالی است. تا وقتی عددی نگذاری، فروش پلن مسدود نمی‌شود.</p>
        ) : null}
        <form onSubmit={savePolicy} className="grid gap-4 rounded-3xl bg-white p-6">
          <label className="grid gap-2 text-sm">توکن داخل هر کردیت
            <input className="rounded-2xl border px-4 py-3" value={bundle} onChange={(event) => setBundle(event.target.value)} inputMode="numeric" />
          </label>
          <label className="grid gap-2 text-sm">سقف توکن قرارداد
            <input className="rounded-2xl border px-4 py-3" value={ceiling} onChange={(event) => setCeiling(event.target.value)} inputMode="numeric" />
          </label>
          <label className="grid gap-2 text-sm">قیمت هر کردیت به تتر
            <input className="rounded-2xl border px-4 py-3" value={usdt} onChange={(event) => setUsdt(event.target.value)} inputMode="decimal" />
          </label>
          <label className="grid gap-2 text-sm">نرخ هر تتر به ریال
            <input className="rounded-2xl border px-4 py-3" value={tetherRate} onChange={(event) => setTetherRate(event.target.value)} inputMode="numeric" />
          </label>
          <p className="text-sm text-[#4B5563]">
            صد کردیت با این نرخ {usdt && tetherRate ? Math.round(100 * Number(usdt) * Number(tetherRate)).toLocaleString("fa-IR") : "—"} ریال می‌شود. اگر تتر گران شود، همین‌جا نرخ را عوض کن. خریدهای قبلی همان مبلغ پرداخت‌شده را نگه می‌دارند.
            موجودی قابل فروش: {stockLeft == null ? "سقف توکن خالی است" : `${Number(stockLeft).toLocaleString("fa-IR")} کردیت`}
          </p>
          {KINDS.map(([kind, label]) => (
            <div key={kind} className="grid gap-2 md:grid-cols-[1fr_140px_180px] md:items-center">
              <span className="text-sm">{label}</span>
              <input className="rounded-2xl border px-3 py-2" placeholder="کردیت" value={weights[kind].credits} onChange={(event) => setWeights({ ...weights, [kind]: { ...weights[kind], credits: event.target.value } })} />
              <input className="rounded-2xl border px-3 py-2" placeholder="حداکثر توکن خروجی" value={weights[kind].max_output_tokens} onChange={(event) => setWeights({ ...weights, [kind]: { ...weights[kind], max_output_tokens: event.target.value } })} />
            </div>
          ))}
          <button className="w-fit rounded-full bg-[#007BFF] px-5 py-3 text-sm text-white" type="submit">ذخیره سیاست</button>
        </form>
        <form onSubmit={savePack} className="grid gap-3 rounded-3xl bg-white p-6 md:grid-cols-2">
          <input className="rounded-2xl border px-4 py-3" placeholder="نام بسته" value={pack.name} onChange={(event) => setPack({ ...pack, name: event.target.value })} required />
          <select className="rounded-2xl border px-4 py-3" value={pack.audience} onChange={(event) => setPack({ ...pack, audience: event.target.value })}>
            <option value="coach">مربی</option>
            <option value="athlete">ورزشکار</option>
          </select>
          <input className="rounded-2xl border px-4 py-3" placeholder="تعداد کردیت" value={pack.credits} onChange={(event) => setPack({ ...pack, credits: event.target.value })} required />
          <input className="rounded-2xl border px-4 py-3" placeholder="قیمت ریال" value={pack.price_irr} onChange={(event) => setPack({ ...pack, price_irr: event.target.value })} required />
          <button className="w-fit rounded-full bg-[#16845A] px-5 py-3 text-sm text-white" type="submit">ثبت بسته اضافه</button>
        </form>
        <section className="grid gap-4 rounded-[28px] bg-white p-6 md:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <p className="mb-3 text-sm text-[#6B7280]">توکن واقعی سامانه</p>
            <TokenSplit prompt={usage?.tokens?.prompt} completion={usage?.tokens?.completion} />
          </div>
          <div>
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-2xl bg-[#F5F7FB] px-4 py-3">کردیت مصرف‌شده {Number(usage?.credits_used || 0).toLocaleString("fa-IR")}</span>
              <span className="rounded-2xl bg-[#F5F7FB] px-4 py-3">فروش {Number(usage?.paid_irr || 0).toLocaleString("fa-IR")} ریال</span>
            </div>
            <KindBars rows={usage?.by_kind ?? []} />
          </div>
        </section>
      </main>
    </div>
  );
}
