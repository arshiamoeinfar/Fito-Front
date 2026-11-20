import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SearchIcon from "@mui/icons-material/Search";
import Navbar from "../../Components/shared/Navbar/Navbar";
// import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
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

/* ───────────── اجزای مشترک کارت موبایل و جدول دسکتاپ ───────────── */

function Avatar({ name }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5F7FB] text-sm text-[#4B5563]"
    >
      {name.slice(0, 1)}
    </div>
  );
}

function StatusChip({ status }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${status.badge}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status.label}
    </span>
  );
}

function RowActions({ row, status, pending, onEnd, stacked }) {
  return (
    <div className={stacked ? "mt-4 flex flex-col gap-2" : "flex flex-col items-center gap-2"}>
      <Link
        to={row.href}
        aria-label={`${actionLabel(row.status)}: ${row.program}`}
        className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 ${status.badge} ${stacked ? "w-full" : ""}`}
      >
        {actionLabel(row.status)}
      </Link>
      {row.assignment?.status === "active" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onEnd(row.assignment)}
          className={`rounded-xl text-[11px] text-[#6B6F77] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] disabled:opacity-60 ${
            stacked ? "min-h-10 w-full border border-[#E8ECF1] text-xs hover:bg-[#F5F7FB]" : "px-2 py-1 hover:text-[#1F2937]"
          }`}
        >
          تمام کردن
        </button>
      )}
    </div>
  );
}

function Banner({ tone, onClose, children }) {
  const error = tone === "error";

  return (
    <div
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
        <CloseIcon fontSize="small" />
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-3 sm:p-4" role="status" aria-label="در حال آوردن برنامه‌ها">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-[#F5F7FB] xl:h-[82px]" />
      ))}
    </div>
  );
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
  const [loaded, setLoaded] = useState(false);
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

  function createProgram() {
    navigate(programType === "workout" ? "/coach/programs/new" : "/coach/nutrition/new");
  }

  function resetFilters() {
    setSearch("");
    setActiveFilter("all");
  }

  const hasActiveFilters = search.trim() !== "" || activeFilter !== "all";

  const typeButton = (type, label, Icon) => {
    const active = programType === type;

    return (
      <button
        type="button"
        onClick={() => chooseType(type)}
        aria-pressed={active}
        className={`flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] sm:flex-none ${
          active
            ? "bg-[#007BFF] text-white shadow-[0_5px_14px_rgba(0,123,255,0.18)]"
            : "text-[#6B6F77] hover:bg-[#F5F7FB] hover:text-[#007BFF]"
        }`}
      >
        <Icon fontSize="small" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-3 bg-[#F5F7FB] px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-1 lg:py-3">
          {(error || notice) && (
            <div className="grid grid-cols-12 gap-3 lg:gap-6">
              {/* <HeaderDashBoard title="برنامه ها" description="برای شاگردانت برنامه رو بساز" /> */}
              {error && <Banner tone="error" onClose={() => setError(null)}>{error}</Banner>}
              {notice && <Banner tone="success" onClose={() => setNotice(null)}>{notice}</Banner>}
            </div>
          )}

          <section className={error || notice ? "mt-4 lg:mt-7" : "lg:mt-1"}>
            {/* ================= TOP CONTROLS ================= */}
            <div className="mb-4 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div
                role="group"
                aria-label="نوع برنامه"
                className="flex w-full items-center gap-2 rounded-2xl border border-[#E8ECF1] bg-white p-1 sm:w-fit"
              >
                {typeButton("workout", "تمرین", FitnessCenterIcon)}
                {typeButton("nutrition", "تغذیه", FastfoodIcon)}
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:flex-nowrap">
                <div className="relative w-full sm:min-w-[220px] sm:flex-1 lg:w-[280px] lg:flex-none">
                  <label htmlFor="assignment-search" className="sr-only">
                    جستجوی شاگرد یا برنامه
                  </label>
                  <input
                    id="assignment-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="جستجوی شاگرد..."
                    className="h-12 w-full rounded-2xl border border-[#E8ECF1] bg-white pl-4 pr-11 text-base text-[#1F2937] outline-none transition placeholder:text-[#6B6F77] focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 sm:text-sm"
                  />
                  <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6F77]">
                    <SearchIcon fontSize="small" />
                  </span>
                </div>

                <div className="flex gap-3">
                  {programType === "workout" && (
                    <Link
                      to="/coach/exercises"
                      className="flex h-12 flex-1 items-center justify-center whitespace-nowrap rounded-2xl border border-[#E8ECF1] bg-white px-4 text-sm text-[#007BFF] transition hover:bg-[#F5F7FB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] sm:flex-none"
                    >
                      بانک حرکات
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={createProgram}
                    className="flex h-12 flex-[2] items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#007BFF] px-6 text-sm text-white shadow-[0_8px_20px_rgba(0,123,255,0.18)] transition hover:bg-[#0069D9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 sm:flex-none"
                  >
                    <AddIcon fontSize="small" />
                    <span>{programType === "workout" ? "ساخت برنامه تمرینی" : "ساخت برنامه تغذیه"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-[#E8ECF1] bg-white sm:rounded-[24px]">
              {/* ================= FILTERS ================= */}
              <div className="border-b border-[#E8ECF1]">
                <div
                  role="group"
                  aria-label="فیلتر وضعیت"
                  className="flex items-center gap-6 overflow-x-auto px-4 pt-4 sm:gap-8 sm:px-6 sm:pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {filters.map((filter) => {
                    const active = activeFilter === filter.id;
                    const count = filter.id === "all" ? rows.length : rows.filter((row) => row.status === filter.id).length;

                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        aria-pressed={active}
                        className={`relative flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap pb-3.5 text-sm font-medium transition focus:outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[#007BFF] ${
                          active ? "text-[#007BFF]" : "text-[#6B6F77] hover:text-[#1F2937]"
                        }`}
                      >
                        {filter.title}
                        {count > 0 && (
                          <span
                            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                              active ? "bg-[#007BFF] text-white" : "bg-[#007BFF]/10 text-[#007BFF]"
                            }`}
                          >
                            {faDigits(count)}
                          </span>
                        )}
                        {active && <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#007BFF]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!loaded && <ListSkeleton />}

              {/* ================= DESKTOP TABLE (xl به بالا) ================= */}
              {loaded && filteredRows.length > 0 && (
                <div role="table" aria-label="فهرست برنامه‌ها" className="hidden xl:block">
                  <div
                    role="row"
                    className="grid h-14 grid-cols-[1.5fr_1.7fr_1fr_1fr_1fr_140px] items-center bg-[#F5F7FB] px-6 text-sm text-[#6B6F77]"
                  >
                    <div role="columnheader">شاگرد</div>
                    <div role="columnheader">اسم برنامه</div>
                    <div role="columnheader">وضعیت</div>
                    <div role="columnheader">تاریخ ایجاد</div>
                    <div role="columnheader">تاریخ انقضا</div>
                    <div role="columnheader" className="text-center">عملیات</div>
                  </div>

                  <div role="rowgroup">
                    {filteredRows.map((row) => {
                      const status = STATUS[row.status];

                      return (
                        <div
                          key={row.key}
                          role="row"
                          className="grid min-h-[82px] grid-cols-[1.5fr_1.7fr_1fr_1fr_1fr_140px] items-center border-t border-[#E8ECF1] px-6 transition hover:bg-[#F5F7FB]"
                        >
                          <div role="cell" className="flex min-w-0 items-center gap-3">
                            <Avatar name={row.name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm text-[#1F2937]">{row.name}</p>
                              <p className="mt-1 text-[10px] text-[#6B6F77]">{row.sub}</p>
                            </div>
                          </div>
                          <p role="cell" className="min-w-0 truncate pl-3 text-sm text-[#1F2937]">{row.program}</p>
                          <div role="cell">
                            <StatusChip status={status} />
                          </div>
                          <div role="cell" className="text-sm text-[#6B6F77]">{row.createdAt}</div>
                          <div role="cell" className="text-sm text-[#6B6F77]">{row.expireAt}</div>
                          <div role="cell">
                            <RowActions row={row} status={status} pending={pending} onEnd={endAssignment} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= MOBILE / TABLET CARDS (زیر xl) ================= */}
              {loaded && filteredRows.length > 0 && (
                <ul className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 xl:hidden">
                  {filteredRows.map((row) => {
                    const status = STATUS[row.status];

                    return (
                      <li key={row.key} className="flex flex-col rounded-2xl border border-[#E8ECF1] bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={row.name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#1F2937]">{row.name}</p>
                              <p className="mt-0.5 text-[11px] text-[#6B6F77]">{row.sub}</p>
                            </div>
                          </div>
                          <StatusChip status={status} />
                        </div>

                        <p className="mt-4 break-words text-sm text-[#1F2937]">{row.program}</p>

                        <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#F5F7FB] px-3 py-2.5 text-xs">
                          <div>
                            <dt className="text-[#6B6F77]">تاریخ ایجاد</dt>
                            <dd className="mt-1 text-sm text-[#1F2937]">{row.createdAt}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6B6F77]">تاریخ انقضا</dt>
                            <dd className="mt-1 text-sm text-[#1F2937]">{row.expireAt}</dd>
                          </div>
                        </dl>

                        <RowActions row={row} status={status} pending={pending} onEnd={endAssignment} stacked />
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* ================= EMPTY STATES ================= */}
              {loaded && filteredRows.length === 0 && (
                <div className="px-4 py-14 text-center sm:py-20" role="status">
                  <div className="mb-4 text-4xl" aria-hidden="true">{rows.length === 0 ? "📋" : "🔍"}</div>

                  {rows.length === 0 ? (
                    <>
                      <p className="text-sm font-bold text-[#1F2937]">
                        {programType === "workout" ? "هنوز برنامه تمرینی نساخته‌ای" : "هنوز برنامه تغذیه‌ای نساخته‌ای"}
                      </p>
                      <p className="mt-2 text-xs text-[#6B6F77]">اولین برنامه را بساز و به شاگردت بده.</p>
                      <button
                        type="button"
                        onClick={createProgram}
                        className="mt-5 min-h-10 rounded-xl bg-[#007BFF] px-5 text-sm font-medium text-white transition hover:bg-[#0069D9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2"
                      >
                        {programType === "workout" ? "ساخت برنامه تمرینی" : "ساخت برنامه تغذیه"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-[#1F2937]">شاگردی پیدا نشد</p>
                      <p className="mt-2 text-xs text-[#6B6F77]">جستجو یا فیلتر انتخاب‌شده را تغییر دهید</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-5 min-h-10 rounded-xl bg-[#007BFF]/10 px-5 text-sm font-medium text-[#007BFF] transition hover:bg-[#007BFF]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
                        >
                          پاک کردن جستجو و فیلتر
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}