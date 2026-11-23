import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import JalaliField from "../../Components/shared/JalaliField/JalaliField";
import { showDate } from "../../lib/jalali";

// ارتفاع حداقل ۴۴ پیکسل برای لمس راحت؛ text-base روی موبایل تا iOS هنگام فوکوس زوم نکند
const field =
  "min-h-11 w-full rounded-2xl border border-[#E3E8F0] bg-white px-4 py-3 text-base text-[#1F2937] outline-none transition focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/15 sm:text-sm";

const card = "col-span-12 rounded-2xl bg-white p-4 text-right sm:rounded-3xl sm:p-6 lg:p-7";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function planState(plan) {
  if (plan.current_version_id) {
    return "آماده است. برای دیدن یا ویرایش روی آن بزن.";
  }

  return "هنوز تمام نشده. برای ادامه روی آن بزن.";
}

function Chip({ tone, children }) {
  const tones = {
    green: "bg-[#E9F9EF] text-[#1F9D4E]",
    blue: "bg-[#EAF4FF] text-[#007BFF]",
    gray: "bg-[#F1F4F9] text-[#6B6F77]",
  };

  return (
    <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs ${tones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

function Banner({ tone, onClose, children }) {
  const error = tone === "error";

  return (
    <div
      dir="rtl"
      role={error ? "alert" : "status"}
      className={`col-span-12 flex items-start justify-between gap-3 rounded-2xl px-4 py-3.5 text-right text-sm leading-7 sm:rounded-3xl sm:px-6 sm:py-4 ${
        error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
      }`}
    >
      <p className="min-w-0 break-words">{children}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن پیام"
        className="-m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

function ListSkeleton({ rows = 2 }) {
  return (
    <div className="mt-4 grid animate-pulse gap-3 md:grid-cols-2" role="status" aria-label="در حال آوردن اطلاعات">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-[76px] rounded-2xl bg-[#F5F7FB]" />
      ))}
    </div>
  );
}

export default function CoachNutrition() {
  const [relationships, setRelationships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [relationshipId, setRelationshipId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [startsOn, setStartsOn] = useState(today);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/coach/relationships"),
      api("/api/v1/coach/meal-plans"),
      api("/api/v1/coach/meal-assignments"),
    ]).then(
      ([relationshipBody, planBody, assignmentBody]) => {
        if (!active) {
          return;
        }

        setRelationships(Array.isArray(relationshipBody?.relationships) ? relationshipBody.relationships : []);
        setPlans(Array.isArray(planBody?.meal_plans) ? planBody.meal_plans : []);
        setAssignments(Array.isArray(assignmentBody?.assignments) ? assignmentBody.assignments : []);
        setLoaded(true);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
          setLoaded(true);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const activeStudents = relationships.filter((row) => row.status === "active");
  const readyPlans = plans.filter((plan) => plan.current_version_id);

  function athleteName(relationshipIdValue) {
    const row = relationships.find((item) => String(item.id) === String(relationshipIdValue));

    return row?.athlete?.display_name || "شاگرد";
  }

  async function givePlan(event) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await api("/api/v1/coach/meal-assignments", {
        method: "POST",
        body: {
          coaching_relationship_id: Number(relationshipId),
          meal_plan_version_id: Number(versionId),
          starts_on: startsOn,
        },
      });
      setNotice("برنامه غذا از این تاریخ برای شاگرد فعال شد.");
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  // دلیل غیرفعال بودن دکمه را به کاربر می‌گوییم تا با یک دکمه‌ی خاموش بی‌پاسخ نماند
  const blocker =
    loaded && activeStudents.length === 0
      ? "هنوز شاگرد فعالی نداری."
      : loaded && readyPlans.length === 0
        ? "هنوز برنامه‌ی آماده‌ای نداری. اول یک برنامه را تمام کن."
        : null;

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-3 bg-[#F5F7FB] px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-1 lg:py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard title="برنامه‌های غذا" description="روی هر برنامه بزن تا باز شود. می‌توانی ببینی، ویرایش کنی، یا به شاگرد بدهی." />
            {error && <Banner tone="error" onClose={() => setError(null)}>{error}</Banner>}
            {notice && <Banner tone="success" onClose={() => setNotice(null)}>{notice}</Banner>}

            {/* ───────── برنامه‌هایی که نوشتی ───────── */}
            <section dir="rtl" aria-labelledby="plans-title" className={card}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="plans-title" className="text-lg font-primary text-[#4B5563] sm:text-xl">برنامه‌های غذا که نوشتی</h2>
                  <p className="mt-1 text-sm leading-6 text-[#6B6F77]">روز، وعده و نام غذا داخل خود برنامه نوشته می‌شود.</p>
                </div>
                <Link
                  to="/coach/nutrition/new"
                  className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white transition hover:bg-[#0069D9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 sm:w-auto"
                >
                  نوشتن برنامه غذا
                </Link>
              </div>

              {!loaded && <ListSkeleton />}
              {loaded && plans.length === 0 && (
                <p className="mt-4 rounded-2xl bg-[#F5F7FB] px-4 py-4 text-sm text-[#6B6F77]">هنوز برنامه غذایی ننوشتی.</p>
              )}
              {loaded && plans.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {plans.map((plan) => (
                    <Link
                      key={plan.id}
                      to={`/coach/nutrition/${plan.id}`}
                      className="block min-w-0 rounded-2xl bg-[#F5F7FB] px-4 py-4 transition hover:bg-[#EEF4FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] sm:px-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words text-sm font-medium text-[#1F2937]">{plan.title}</p>
                        {plan.current_version_id ? <Chip tone="green">آماده</Chip> : <Chip tone="blue">در حال نوشتن</Chip>}
                      </div>
                      <p className="mt-2 text-xs leading-6 text-[#6B7280]">{planState(plan)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* ───────── دادن برنامه به شاگرد ───────── */}
            <section dir="rtl" aria-labelledby="give-title" className={card}>
              <h2 id="give-title" className="text-lg font-primary text-[#4B5563] sm:text-xl">دادن برنامه غذا به شاگرد</h2>
              <form onSubmit={givePlan} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid min-w-0 gap-2 text-xs text-[#6B6F77]">
                  شاگرد
                  <select required value={relationshipId} onChange={(event) => setRelationshipId(event.target.value)} className={field}>
                    <option value="">انتخاب شاگرد</option>
                    {activeStudents.map((row) => (
                      <option key={row.id} value={row.id}>{row.athlete?.display_name || "شاگرد"}</option>
                    ))}
                  </select>
                </label>
                <label className="grid min-w-0 gap-2 text-xs text-[#6B6F77]">
                  برنامه آماده
                  <select required value={versionId} onChange={(event) => setVersionId(event.target.value)} className={field}>
                    <option value="">انتخاب برنامه</option>
                    {readyPlans.map((plan) => (
                      <option key={plan.current_version_id} value={plan.current_version_id}>{plan.title}</option>
                    ))}
                  </select>
                </label>
                <label className="grid min-w-0 gap-2 text-xs text-[#6B6F77] sm:col-span-2 lg:col-span-1">
                  از چه تاریخی
                  <JalaliField required value={startsOn} onChange={setStartsOn} className={field} />
                </label>
                <button
                  type="submit"
                  disabled={pending || readyPlans.length === 0 || activeStudents.length === 0}
                  aria-busy={pending}
                  className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-2xl bg-[#007BFF] px-5 py-3 text-sm text-white transition hover:bg-[#0069D9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 lg:col-span-1"
                >
                  {pending && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 motion-safe:animate-spin" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                  بده به این شاگرد
                </button>
              </form>
              {blocker && <p className="mt-3 rounded-xl bg-[#F5F7FB] px-4 py-3 text-xs leading-6 text-[#6B6F77]">{blocker}</p>}
            </section>

            {/* ───────── غذای فعلی شاگردها ───────── */}
            <section dir="rtl" aria-labelledby="current-title" className={card}>
              <h2 id="current-title" className="text-lg font-primary text-[#4B5563] sm:text-xl">غذای فعلی شاگردها</h2>

              {!loaded && <ListSkeleton />}
              {loaded && assignments.length === 0 && (
                <p className="mt-4 rounded-2xl bg-[#F5F7FB] px-4 py-4 text-sm text-[#6B6F77]">هنوز برنامه غذایی به شاگردی ندادی.</p>
              )}
              {loaded && assignments.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {assignments.map((assignment) => (
                    <article key={assignment.id} className="min-w-0 rounded-2xl bg-[#F5F7FB] px-4 py-4 text-sm text-[#1F2937] sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/coach/athletes/${assignment.coaching_relationship_id}`}
                          className="min-w-0 break-words font-medium text-[#007BFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
                        >
                          {athleteName(assignment.coaching_relationship_id)}
                        </Link>
                        {assignment.status === "active" ? <Chip tone="green">فعال</Chip> : <Chip tone="blue">تمام شده</Chip>}
                      </div>

                      <p className="mt-2 break-words">
                        {assignment.plan?.id ? (
                          <Link
                            to={`/coach/nutrition/${assignment.plan.id}`}
                            className="text-[#007BFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
                          >
                            {assignment.plan?.title || "برنامه غذا"}
                          </Link>
                        ) : (
                          <span>{assignment.plan?.title || "برنامه غذا"}</span>
                        )}
                      </p>

                      <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-white px-3 py-2.5 text-xs">
                        <div>
                          <dt className="text-[#6B6F77]">شروع</dt>
                          <dd className="mt-1 text-sm text-[#1F2937]">{showDate(assignment.starts_on)}</dd>
                        </div>
                        <div>
                          <dt className="text-[#6B6F77]">اتمام</dt>
                          <dd className="mt-1 text-sm text-[#1F2937]">
                            {assignment.ends_on ? showDate(assignment.ends_on) : (assignment.status === "active" ? "باز" : "ثبت نشده")}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}