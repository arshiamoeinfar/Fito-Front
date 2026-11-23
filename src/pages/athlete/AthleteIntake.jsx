import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";

const FIELDS = [
  ["goal", "هدفت چیست؟"],
  ["training_background", "سابقه تمرین: چند سال، سطح، چند روز در هفته، وسیله و آسیب"],
  ["sports_history", "سابقه ورزشی"],
  ["conditions", "بیماری"],
  ["medications", "دارو"],
  ["food_limits", "حساسیت یا پرهیز غذایی"],
  ["other_factors", "عامل مهم دیگر، اگر هست"],
];

const EMPTY = {
  goal: "",
  training_background: "",
  sports_history: "",
  conditions: "",
  medications: "",
  food_limits: "",
  other_factors: "",
};

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

export default function AthleteIntake() {
  const [draft, setDraft] = useState(EMPTY);
  const [missing, setMissing] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkin, setCheckin] = useState({ sleep_score: "3", soreness: "2", adherence: "full", note: "" });
  const [review, setReview] = useState("");

  useEffect(() => {
    api("/api/v1/athlete/intake").then((body) => {
      setDraft({ ...EMPTY, ...(body.dossier ?? {}) });
      setMissing(body.missing ?? []);
    }).catch((caught) => setError(errorText(caught)));
  }, []);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const body = await api("/api/v1/athlete/intake", { method: "PUT", body: draft });
      setMissing(body.missing ?? []);
      setNotice(body.missing?.length ? "پرونده ذخیره شد. موردهای باقی‌مانده هنوز لازم است." : "پرونده کامل شد. حالا می‌توانی برنامه بسازی.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  async function sendCheckin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const today = new Date();
      const checkedOn = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      await api("/api/v1/athlete/checkins", {
        method: "POST",
        body: {
          checked_on: checkedOn,
          sleep_score: Number(checkin.sleep_score),
          soreness: Number(checkin.soreness),
          adherence: checkin.adherence,
          note: checkin.note,
        },
      });
      setNotice("بازخورد امروز ثبت شد.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  async function askReview() {
    setBusy(true);
    setError("");
    setReview("");

    try {
      const body = await api("/api/v1/athlete/progress-reviews", { method: "POST" });
      setReview(body.summary || "");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-1 lg:py-3">
          <div className="grid grid-cols-12 gap-4">
            <HeaderDashBoard title="پرونده ورزشکار" description="برنامه فقط بعد از همین پرونده، وزن فعلی و عکس جلو، بغل و پشت ساخته می‌شود." />
            {error ? <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p> : null}
            {notice ? <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700">{notice}</p> : null}
            <form onSubmit={save} dir="rtl" className="col-span-12 rounded-3xl bg-white p-6 text-right">
              <p className="text-sm leading-7 text-[#6B6F77]">اگر موردی نداری یا نمی‌دانی، همان را بنویس. خالی ماندن فیلد پذیرفته نمی‌شود.</p>
              {missing.length ? (
                <p className="mt-3 text-sm leading-7 text-[#9A5B00]">مانده: {missing.join("، ")}</p>
              ) : (
                <p className="mt-3 text-sm text-[#16845A]">پرونده برای ساخت برنامه کامل است.</p>
              )}
              <div className="mt-5 grid gap-4">
                {FIELDS.map(([key, label]) => (
                  <label key={key} className="grid gap-2 text-xs text-[#6B6F77]">
                    {label}
                    {key === "goal" ? (
                      <input
                        value={draft[key]}
                        onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                        className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm text-[#243142]"
                      />
                    ) : (
                      <textarea
                        value={draft[key] || ""}
                        onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                        rows={3}
                        className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm text-[#243142]"
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="submit" disabled={busy} className="rounded-full bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-60">ذخیره پرونده</button>
                <Link to="/AnalysisPage/tools?panel=sizes" className="rounded-full bg-[#F5F7FB] px-5 py-3 text-sm text-[#243142]">ثبت وزن و عکس بدن</Link>
              </div>
            </form>

            <form onSubmit={sendCheckin} dir="rtl" className="col-span-12 rounded-3xl bg-white p-6 text-right lg:col-span-6">
              <h2 className="text-lg text-[#243142]">بازخورد امروز</h2>
              <p className="mt-2 text-sm leading-7 text-[#6B6F77]">این‌جا تمرین یا غذا ثبت نمی‌شود. هر روز به دستیار می‌گویی خوابت چطور بوده، بدن چقدر خسته است و برنامه را انجام داده‌ای یا نه.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="grid gap-2 text-xs text-[#6B6F77]">
                  خواب از ۱ تا ۵
                  <input value={checkin.sleep_score} onChange={(event) => setCheckin((current) => ({ ...current, sleep_score: event.target.value }))} className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                </label>
                <label className="grid gap-2 text-xs text-[#6B6F77]">
                  کوفتگی از ۱ تا ۵
                  <input value={checkin.soreness} onChange={(event) => setCheckin((current) => ({ ...current, soreness: event.target.value }))} className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                </label>
                <label className="grid gap-2 text-xs text-[#6B6F77]">
                  رعایت برنامه
                  <select value={checkin.adherence} onChange={(event) => setCheckin((current) => ({ ...current, adherence: event.target.value }))} className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm">
                    <option value="full">کامل</option>
                    <option value="partial">نسبی</option>
                    <option value="missed">انجام نشد</option>
                  </select>
                </label>
              </div>
              <textarea value={checkin.note} onChange={(event) => setCheckin((current) => ({ ...current, note: event.target.value }))} rows={3} placeholder="اگر نکته‌ای از تمرین یا غذا هست" className="mt-3 w-full rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
              <button type="submit" disabled={busy} className="mt-4 rounded-full bg-[#16845A] px-5 py-3 text-sm text-white disabled:opacity-60">ثبت بازخورد</button>
            </form>

            <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-6 text-right lg:col-span-6">
              <h2 className="text-lg text-[#243142]">مرور پیشرفت</h2>
              <p className="mt-2 text-sm leading-7 text-[#6B6F77]">دستیار با پرونده، تمرین‌های انجام‌شده، غذاهای ثبت‌شده و بازخوردهای روزانه یک جمع‌بندی می‌نویسد. تا وقتی این‌ها ثبت نشده باشند، مرور کلی می‌ماند.</p>
              <button type="button" onClick={askReview} disabled={busy} className="mt-4 rounded-full bg-[#243142] px-5 py-3 text-sm text-white disabled:opacity-60">ساختن مرور</button>
              {review ? <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-[#243142]">{review}</p> : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
