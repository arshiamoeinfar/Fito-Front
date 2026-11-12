import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SearchIcon from "@mui/icons-material/Search";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { faDigits, jalaliParts } from "../../lib/jalali";

const STATUS = {
  active: {
    label: "فعال",
    badge: "bg-[#E9F9EF] text-[#1F9D4E]",
  },
  inactive: {
    label: "غیرفعال",
    badge: "bg-[#F5F7FB] text-[#6B6F77]",
  },
  expired: {
    label: "منقضی شده",
    badge: "bg-[#FDECEC] text-[#E5484D]",
  },
  inProgress: {
    label: "درحال انجام",
    badge: "bg-[#EAF4FF] text-[#007BFF]",
  },
};

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

function shortDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const parts = jalaliParts(date);

  return faDigits(`${parts.year}/${String(parts.month).padStart(2, "0")}/${String(parts.day).padStart(2, "0")}`);
}

function endText(assignment) {
  if (assignment.ends_on) {
    return shortDate(assignment.ends_on);
  }

  return assignment.status === "active" ? "باز" : "ثبت نشده";
}

function assignmentStatus(assignment) {
  if (assignment.status === "active" && !(assignment.ends_on && assignment.ends_on < today())) {
    return "active";
  }

  return "expired";
}

function libraryStatus(item) {
  if (item.status === "archived") {
    return "inactive";
  }

  if (!item.current_version_id || item.status === "draft") {
    return "inProgress";
  }

  return "active";
}

function actionLabel(status) {
  if (status === "inProgress") {
    return "ادامه فرایند";
  }

  return "مشاهده کامل";
}

export default function CoachAssignments() {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [mealAssignments, setMealAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [programType, setProgramType] = useState("workout");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/coach/relationships"),
      api("/api/v1/coach/workout-programs"),
      api("/api/v1/coach/workout-assignments"),
      api("/api/v1/coach/meal-plans").catch(() => ({ meal_plans: [] })),
      api("/api/v1/coach/meal-assignments").catch(() => ({ assignments: [] })),
    ]).then(
      ([relationshipBody, programBody, assignmentBody, mealPlanBody, mealAssignmentBody]) => {
        if (!active) {
          return;
        }

        setRelationships(Array.isArray(relationshipBody?.relationships) ? relationshipBody.relationships : []);
        setPrograms(Array.isArray(programBody?.programs) ? programBody.programs : []);
        setAssignments(Array.isArray(assignmentBody?.assignments) ? assignmentBody.assignments : []);
        setMealPlans(Array.isArray(mealPlanBody?.meal_plans) ? mealPlanBody.meal_plans : []);
        setMealAssignments(Array.isArray(mealAssignmentBody?.assignments) ? mealAssignmentBody.assignments : []);
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

  function athleteName(relationshipIdValue) {
    const row = relationships.find((item) => String(item.id) === String(relationshipIdValue));

    return row?.athlete?.display_name || "شاگرد";
  }

  const rows = useMemo(() => {
    const nameOf = (id) => relationships.find((item) => String(item.id) === String(id))?.athlete?.display_name || "شاگرد";
    const sourceAssignments = programType === "workout" ? assignments : mealAssignments;
    const library = programType === "workout" ? programs : mealPlans;
    const assignedIds = new Set(sourceAssignments.map((item) => (programType === "workout" ? item.program?.id : item.plan?.id)).filter(Boolean));

    const given = sourceAssignments.map((assignment) => {
      const program = programType === "workout" ? assignment.program : assignment.plan;
      const status = assignmentStatus(assignment);

      return {
        key: `assignment-${assignment.id}`,
        name: nameOf(assignment.coaching_relationship_id),
        sub: `شاگرد ${faDigits(assignment.coaching_relationship_id)}`,
        program: program?.title || "برنامه",
        status,
        createdAt: shortDate(assignment.starts_on),
        expireAt: endText(assignment),
        href: program?.id
          ? (programType === "workout" ? `/coach/programs/${program.id}` : `/coach/nutrition/${program.id}`)
          : `/coach/athletes/${assignment.coaching_relationship_id}`,
        assignment: programType === "workout" ? assignment : null,
      };
    });

    const waiting = library
      .filter((item) => !assignedIds.has(item.id))
      .map((item) => ({
        key: `library-${item.id}`,
        name: "بدون شاگرد",
        sub: "برنامه",
        program: item.title || "برنامه",
        status: libraryStatus(item),
        createdAt: "—",
        expireAt: "—",
        href: programType === "workout" ? `/coach/programs/${item.id}` : `/coach/nutrition/${item.id}`,
        assignment: null,
      }));

    return [...given, ...waiting];
  }, [assignments, mealAssignments, mealPlans, programType, programs, relationships]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = !query || `${row.name} ${row.program}`.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

      return activeFilter === "all" || row.status === activeFilter;
    });
  }, [activeFilter, rows, search]);

  const filters = [
    { id: "all", title: "شاگردان" },
    { id: "active", title: programType === "workout" ? "برنامه‌های فعال تمرین" : "برنامه‌های فعال تغذیه" },
    { id: "inactive", title: "برنامه‌های غیرفعال" },
    { id: "expired", title: "منقضی شده" },
    { id: "inProgress", title: "درحال انجام" },
  ];

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

  function endAssignment(assignment) {
    run(async () => {
      await api(`/api/v1/coach/workout-assignments/${assignment.id}/end`, { method: "POST" });
      setNotice("این برنامه برای شاگرد تمام شد.");
    });
  }

  function chooseType(type) {
    setProgramType(type);
    setActiveFilter("all");
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="برنامه ها" description="برای شاگردانت برنامه رو بساز" />
            {error && <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p>}
            {notice && <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700">{notice}</p>}
          </div>

          <section className="mt-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[#E8ECF1] bg-white p-1">
                <button
                  type="button"
                  onClick={() => chooseType("workout")}
                  className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm transition ${programType === "workout" ? "bg-[#007BFF] text-white shadow-[0_5px_14px_rgba(0,123,255,0.18)]" : "text-[#6B6F77] hover:bg-[#F5F7FB] hover:text-[#007BFF]"}`}
                >
                  <FitnessCenterIcon fontSize="small" />
                  <span>تمرین</span>
                </button>
                <button
                  type="button"
                  onClick={() => chooseType("nutrition")}
                  className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm transition ${programType === "nutrition" ? "bg-[#007BFF] text-white shadow-[0_5px_14px_rgba(0,123,255,0.18)]" : "text-[#6B6F77] hover:bg-[#F5F7FB] hover:text-[#007BFF]"}`}
                >
                  <FastfoodIcon fontSize="small" />
                  <span>تغذیه</span>
                </button>
              </div>

              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <div className="relative w-full sm:w-[280px]">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="جستجوی شاگرد..."
                    className="h-12 w-full rounded-2xl border border-[#E8ECF1] bg-white pr-11 pl-4 text-sm text-[#1F2937] outline-none transition placeholder:text-[#6B6F77] focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/5"
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-[#6B6F77]">
                    <SearchIcon fontSize="small" />
                  </span>
                </div>
                {programType === "workout" && (
                  <Link to="/coach/exercises" className="flex h-12 items-center rounded-2xl border border-[#E8ECF1] bg-white px-4 text-sm text-[#007BFF]">
                    بانک حرکات
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => navigate(programType === "workout" ? "/coach/programs/new" : "/coach/nutrition/new")}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-6 text-sm text-white shadow-[0_8px_20px_rgba(0,123,255,0.18)] transition hover:bg-[#0069D9]"
                >
                  <AddIcon fontSize="small" />
                  <span>{programType === "workout" ? "ساخت برنامه تمرینی" : "ساخت برنامه تغذیه"}</span>
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#E8ECF1] bg-white">
              <div className="overflow-x-auto border-b border-[#E8ECF1] px-6 pt-5">
                <div className="flex min-w-max items-center gap-8">
                  {filters.map((filter) => {
                    const active = activeFilter === filter.id;
                    const count = filter.id === "all" ? rows.length : rows.filter((row) => row.status === filter.id).length;

                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`relative cursor-pointer pb-4 text-sm font-medium transition ${active ? "text-[#007BFF]" : "text-[#6B6F77] hover:text-[#1F2937]"}`}
                      >
                        <span className="relative inline-flex">
                          {filter.title}
                          {count > 0 && (
                            <span className={`absolute -top-3.5 -left-4 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] ${active ? "bg-[#007BFF] text-white" : "bg-[#007BFF]/10 text-[#007BFF]"}`}>
                              {faDigits(count)}
                            </span>
                          )}
                        </span>
                        {active && <span className="absolute right-0 bottom-0 left-0 h-[2px] rounded-full bg-[#007BFF]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[860px]">
                  <div className="grid h-14 grid-cols-[1.5fr_1.7fr_1fr_1fr_1fr_140px] items-center bg-[#F5F7FB] px-6 text-sm text-[#6B6F77]">
                    <div>شاگرد</div>
                    <div>اسم برنامه</div>
                    <div>وضعیت</div>
                    <div>تاریخ ایجاد</div>
                    <div>تاریخ انقضا</div>
                    <div className="text-center">مشاهده کامل</div>
                  </div>

                  {filteredRows.map((row) => {
                    const status = STATUS[row.status];

                    return (
                      <div key={row.key} className="grid min-h-[82px] grid-cols-[1.5fr_1.7fr_1fr_1fr_1fr_140px] items-center border-t border-[#E8ECF1] px-6 transition hover:bg-[#F5F7FB]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F7FB] text-sm text-[#4B5563]">
                            {row.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm text-[#1F2937]">{row.name}</p>
                            <p className="mt-1 text-[10px] text-[#6B6F77]">{row.sub}</p>
                          </div>
                        </div>
                        <p className="text-sm text-[#1F2937]">{row.program}</p>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${status.badge}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {status.label}
                          </span>
                        </div>
                        <div className="text-sm text-[#6B6F77]">{row.createdAt}</div>
                        <div className="text-sm text-[#6B6F77]">{row.expireAt}</div>
                        <div className="flex flex-col items-center gap-2">
                          <Link to={row.href} className={`rounded-xl px-4 py-2 text-xs font-bold transition hover:shadow-md ${status.badge}`}>
                            {actionLabel(row.status)}
                          </Link>
                          {row.assignment?.status === "active" && (
                            <button type="button" disabled={pending} onClick={() => endAssignment(row.assignment)} className="text-[11px] text-[#6B6F77] disabled:opacity-60">
                              تمام کردن
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filteredRows.length === 0 && (
                <div className="py-20 text-center">
                  <div className="mb-4 text-4xl">🔍</div>
                  <p className="text-sm font-bold text-[#1F2937]">شاگردی پیدا نشد</p>
                  <p className="mt-2 text-xs text-[#6B6F77]">جستجو یا فیلتر انتخاب‌شده را تغییر دهید</p>
                </div>
              )}

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
