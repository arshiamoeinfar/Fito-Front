import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import JalaliField from "../../Components/shared/JalaliField/JalaliField";
import { showDate } from "../../lib/jalali";

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
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
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

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="برنامه‌های غذا" description="روی هر برنامه بزن تا باز شود. می‌توانی ببینی، ویرایش کنی، یا به شاگرد بدهی." />
            {error && <p dir="rtl" className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p>}
            {notice && <p dir="rtl" className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700">{notice}</p>}

            <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-primary text-[#4B5563]">برنامه‌های غذا که نوشتی</h2>
                  <p className="mt-1 text-sm text-[#A0A4AA]">روز، وعده و نام غذا داخل خود برنامه نوشته می‌شود.</p>
                </div>
                <Link to="/coach/nutrition/new" className="rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white">نوشتن برنامه غذا</Link>
              </div>
              {plans.length === 0 && <p className="mt-4 text-sm text-[#A0A4AA]">هنوز برنامه غذایی ننوشتی.</p>}
              <div className="mt-4 grid gap-3">
                {plans.map((plan) => (
                  <Link key={plan.id} to={`/coach/nutrition/${plan.id}`} className="block rounded-2xl bg-[#F5F7FB] px-5 py-4 transition hover:bg-[#EEF4FF]">
                    <p className="text-sm text-[#1F2937]">{plan.title}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{planState(plan)}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
              <h2 className="text-xl font-primary text-[#4B5563]">دادن برنامه غذا به شاگرد</h2>
              <form onSubmit={givePlan} className="mt-4 grid gap-3 md:grid-cols-4">
                <label className="grid gap-2 text-xs text-[#6B6F77]">
                  شاگرد
                  <select required value={relationshipId} onChange={(event) => setRelationshipId(event.target.value)} className="rounded-2xl border border-[#F0F2F5] bg-white px-4 py-3 text-sm text-[#1F2937]">
                    <option value="">انتخاب شاگرد</option>
                    {activeStudents.map((row) => (
                      <option key={row.id} value={row.id}>{row.athlete?.display_name || "شاگرد"}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-xs text-[#6B6F77]">
                  برنامه آماده
                  <select required value={versionId} onChange={(event) => setVersionId(event.target.value)} className="rounded-2xl border border-[#F0F2F5] bg-white px-4 py-3 text-sm text-[#1F2937]">
                    <option value="">انتخاب برنامه</option>
                    {readyPlans.map((plan) => (
                      <option key={plan.current_version_id} value={plan.current_version_id}>{plan.title}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-xs text-[#6B6F77]">
                  از چه تاریخی
                  <JalaliField required value={startsOn} onChange={setStartsOn} className="rounded-2xl border border-[#F0F2F5] bg-white px-4 py-3 text-sm text-[#1F2937]" />
                </label>
                <button type="submit" disabled={pending || readyPlans.length === 0 || activeStudents.length === 0} className="self-end rounded-2xl bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-60">
                  بده به این شاگرد
                </button>
              </form>
            </section>

            <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
              <h2 className="text-xl font-primary text-[#4B5563]">غذای فعلی شاگردها</h2>
              {assignments.length === 0 && <p className="mt-4 text-sm text-[#A0A4AA]">هنوز برنامه غذایی به شاگردی ندادی.</p>}
              <div className="mt-4 grid gap-3">
                {assignments.map((assignment) => (
                  <article key={assignment.id} className="rounded-2xl bg-[#F5F7FB] px-5 py-4 text-sm text-[#1F2937]">
                    <Link to={`/coach/athletes/${assignment.coaching_relationship_id}`} className="text-[#007BFF]">{athleteName(assignment.coaching_relationship_id)}</Link>
                    {"، "}
                    <Link to={`/coach/nutrition/${assignment.plan?.id}`} className="text-[#007BFF]">{assignment.plan?.title || "برنامه غذا"}</Link>
                    {`، شروع ${showDate(assignment.starts_on)} · اتمام ${assignment.ends_on ? showDate(assignment.ends_on) : (assignment.status === "active" ? "باز" : "ثبت نشده")}`}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
