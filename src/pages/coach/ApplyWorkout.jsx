import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

const students = [
  {
    id: 1,
    name: "آرشیا معین‌فر",
    avatar: "👨🏻‍💻",
    workout: {
      name: "برنامه حجم عضلانی",
      status: "active",
      createdAt: "1405/06/01",
      expireAt: "1405/07/25",
    },
    nutrition: {
      name: "برنامه افزایش حجم",
      status: "active",
      createdAt: "1405/06/05",
      expireAt: "1405/07/10",
    },
  },
  {
    id: 2,
    name: "علی رضایی",
    avatar: "👨🏻",
    workout: {
      name: "برنامه قدرتی",
      status: "inProgress",
      createdAt: "1405/05/20",
      expireAt: "1405/07/20",
    },
    nutrition: {
      name: "برنامه کات",
      status: "inactive",
      createdAt: "1405/05/10",
      expireAt: "1405/06/10",
    },
  },
  {
    id: 3,
    name: "محمد احمدی",
    avatar: "👨🏼",
    workout: {
      name: "برنامه عضله‌سازی",
      status: "expired",
      createdAt: "1405/03/10",
      expireAt: "1405/05/10",
    },
    nutrition: {
      name: "برنامه افزایش وزن",
      status: "inProgress",
      createdAt: "1405/06/01",
      expireAt: "1405/07/02",
    },
  },
  {
    id: 4,
    name: "رضا کریمی",
    avatar: "👨🏻‍🦱",
    workout: {
      name: "برنامه قدرت و استقامت",
      status: "inactive",
      createdAt: "1405/04/01",
      expireAt: "1405/05/01",
    },
    nutrition: {
      name: "برنامه رژیم پایه",
      status: "expired",
      createdAt: "1405/03/01",
      expireAt: "1405/04/01",
    },
  },
  {
    id: 5,
    name: "امیرحسین محمدی",
    avatar: "👨🏻",
    workout: {
      name: "برنامه عضله‌سازی",
      status: "active",
      createdAt: "1405/06/10",
      expireAt: "1405/07/30",
    },
    nutrition: {
      name: "برنامه کات",
      status: "active",
      createdAt: "1405/06/08",
      expireAt: "1405/07/28",
    },
  },
];

// ================= STATUS CONFIG =================

const statusConfig = {
  active: {
    label: "فعال",
    className: "bg-emerald-50 text-emerald-600",
    action: "مشاهده کامل",
  },
  inactive: {
    label: "غیرفعال",
    className: "bg-gray-100 text-gray-500",
    action: "فعال کردن",
  },
  expired: {
    label: "منقضی شده",
    className: "bg-red-50 text-red-500",
    action: "حذف",
  },
  inProgress: {
    label: "درحال انجام",
    className: "bg-blue-50 text-blue-600",
    action: "ادامه فرایند",
  },
};

// ================= SHARED COMPONENTS =================

function Avatar({ emoji }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-xl sm:h-11 sm:w-11"
    >
      {emoji}
    </div>
  );
}

function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 font-primary text-[10px] sm:px-3 sm:text-xs ${status.className}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {status.label}
    </span>
  );
}

function ActionButton({ status, studentName, className = "" }) {
  return (
    <button
      type="button"
      aria-label={`${status.action} برای ${studentName}`}
      className={`flex min-h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 ${status.className} ${className}`}
    >
      {status.action}
    </button>
  );
}

// ================= MAIN COMPONENT =================

export default function ApplyWorkout() {
  const [programType, setProgramType] = useState("workout");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const navigate = useNavigate();

  const currentProgramKey =
    programType === "workout" ? "workout" : "nutrition";

  // ================= FILTER STUDENTS =================

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const program = student[currentProgramKey];

      const matchesSearch = student.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "all") return true;

      return program.status === activeFilter;
    });
  }, [search, activeFilter, currentProgramKey]);

  // ================= COUNTS =================

  const getCount = (filter) => {
    return students.filter((student) => {
      const program = student[currentProgramKey];

      if (filter === "all") return true;

      return program.status === filter;
    }).length;
  };

  // ================= FILTERS =================

  const filters = [
    {
      id: "all",
      title: "شاگردان",
    },
    {
      id: "active",
      title:
        programType === "workout"
          ? "برنامه‌های فعال تمرین"
          : "برنامه‌های فعال تغذیه",
    },
    {
      id: "inactive",
      title: "برنامه‌های غیرفعال",
    },
    {
      id: "expired",
      title: "منقضی شده",
    },
    {
      id: "inProgress",
      title: "درحال انجام",
    },
  ];

  // ================= ACTIONS =================

  const createProgram = () => {
    navigate("/coach/builder");
  };

  const hasActiveFilters =
    search.trim() !== "" || activeFilter !== "all";

  function resetFilters() {
    setSearch("");
    setActiveFilter("all");
  }

  function switchType(type) {
    setProgramType(type);
    setActiveFilter("all");
  }

  // ================= PROGRAM TYPE BUTTON =================

  const typeButton = (type, label, Icon) => {
    const active = programType === type;

    return (
      <button
        type="button"
        onClick={() => switchType(type)}
        aria-pressed={active}
        className={`flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 font-primary text-xs transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] sm:flex-none sm:px-5 sm:text-sm ${
          active
            ? "bg-[#007BFF] text-white shadow-[0_5px_14px_rgba(0,123,255,0.18)]"
            : "text-[#7A8494] hover:bg-[#F8FAFC] hover:text-[#007BFF]"
        }`}
      >
        <Icon fontSize="small" />
        <span>{label}</span>
      </button>
    );
  };

  // ================= STUDENT CARD =================

  const renderStudentCard = (student) => {
    const program = student[currentProgramKey];
    const status = statusConfig[program.status];

    return (
      <li
        key={student.id}
        className="flex min-w-0 flex-col rounded-2xl border border-[#EEF1F6] bg-white p-3.5 transition duration-200 hover:border-[#D7E6FF] hover:shadow-sm sm:p-4"
      >
        {/* Student Info */}

        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar emoji={student.avatar} />

            <div className="min-w-0">
              <p className="truncate font-primary text-sm font-medium text-[#374151]">
                {student.name}
              </p>

              <p className="mt-1 text-[11px] text-gray-400">
                شاگرد {student.id}
              </p>
            </div>
          </div>

          <StatusChip status={status} />
        </div>

        {/* Program Name */}

        <div className="mt-4 min-w-0">
          <p className="mb-1 text-[11px] text-gray-400">
            نام برنامه
          </p>

          <p className="break-words font-primary text-sm font-medium text-[#4B5563]">
            {program.name}
          </p>
        </div>

        {/* Dates */}

        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#F8FAFC] p-3">
          <div className="min-w-0">
            <dt className="text-[10px] text-gray-400">
              تاریخ ایجاد
            </dt>

            <dd className="mt-1 truncate text-xs font-medium text-gray-600">
              {program.createdAt}
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="text-[10px] text-gray-400">
              تاریخ انقضا
            </dt>

            <dd className="mt-1 truncate text-xs font-medium text-gray-600">
              {program.expireAt}
            </dd>
          </div>
        </dl>

        {/* Action */}

        <div className="mt-4">
          <ActionButton
            status={status}
            studentName={student.name}
            className="w-full"
          />
        </div>
      </li>
    );
  };

  // ================= TABLE ROW =================

  const renderTableRow = (student) => {
    const program = student[currentProgramKey];
    const status = statusConfig[program.status];

    return (
      <div
        key={student.id}
        role="row"
        className="grid min-h-[76px] grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(100px,0.8fr)_110px] items-center gap-2 border-t border-gray-100 px-4 transition hover:bg-[#FAFCFF] xl:grid-cols-[1.4fr_1.5fr_0.9fr_1fr_1fr_120px] xl:gap-0 xl:px-5 2xl:px-6"
      >
        {/* Student */}

        <div
          role="cell"
          className="flex min-w-0 items-center gap-2 xl:gap-3"
        >
          <Avatar emoji={student.avatar} />

          <div className="min-w-0">
            <p className="truncate font-primary text-xs text-[#6B6F77] xl:text-sm">
              {student.name}
            </p>

            <p className="mt-1 text-[10px] text-gray-400">
              شاگرد {student.id}
            </p>
          </div>
        </div>

        {/* Program */}

        <div role="cell" className="min-w-0">
          <p className="truncate font-primary text-xs text-[#6B6F77] xl:text-sm">
            {program.name}
          </p>
        </div>

        {/* Status */}

        <div role="cell" className="min-w-0">
          <StatusChip status={status} />
        </div>

        {/* Created Date */}

        <div
          role="cell"
          className="hidden text-xs text-gray-500 xl:block"
        >
          {program.createdAt}
        </div>

        {/* Expire Date */}

        <div
          role="cell"
          className="hidden text-xs text-gray-500 xl:block"
        >
          {program.expireAt}
        </div>

        {/* Action */}

        <div role="cell" className="flex min-w-0 justify-center">
          <ActionButton
            status={status}
            studentName={student.name}
            className="max-w-full px-2 text-[10px] xl:px-3 xl:text-xs"
          />
        </div>
      </div>
    );
  };

  // ================= RENDER =================

  return (
    <div className="flex min-h-screen w-full justify-center overflow-x-hidden bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] min-w-0 grid-cols-1 gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-5 xl:gap-6 xl:px-8 xl:py-6">

        {/* Navbar */}

        <div className="min-w-0">
          <Navbar />
        </div>

        {/* Main Content */}

        <main className="min-w-0 w-full py-1 lg:py-3">

          {/* Header */}

          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard
              title="برنامه ها"
              description="برای شاگردانت برنامه رو بساز"
            />
          </div>

          {/* Program Management */}

          <section className="mt-5 min-w-0 lg:mt-7">

            {/* ================= TOP CONTROLS ================= */}

            <div className="mb-4 flex min-w-0 flex-col gap-3 xl:mb-6 xl:flex-row xl:items-center xl:justify-between xl:gap-5">

              {/* Program Type */}

              <div
                role="group"
                aria-label="نوع برنامه"
                className="flex w-full items-center gap-2 rounded-2xl border border-[#E8EDF5] bg-white p-1 sm:w-fit"
              >
                {typeButton(
                  "workout",
                  "تمرین",
                  FitnessCenterIcon
                )}

                {typeButton(
                  "nutrition",
                  "تغذیه",
                  FastfoodIcon
                )}
              </div>

              {/* Actions */}

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">

                {/* Search */}

                <div className="relative min-w-0 w-full sm:flex-1 xl:w-[260px] xl:flex-none">
                  <label
                    htmlFor="student-search"
                    className="sr-only"
                  >
                    جستجوی شاگرد
                  </label>

                  <input
                    id="student-search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجوی شاگرد..."
                    className="h-12 w-full rounded-2xl border border-[#E8EDF5] bg-white pl-4 pr-11 text-sm text-[#1F2937] shadow-[0_4px_20px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-[#A5ADBA] focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10"
                  />

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
                  >
                    <SearchIcon />
                  </span>
                </div>

                {/* Create Program */}

                <button
                  onClick={createProgram}
                  type="button"
                  className="flex h-12 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#007BFF] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,123,255,0.18)] transition-all hover:bg-[#006FE6] hover:shadow-[0_10px_24px_rgba(0,123,255,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 active:scale-[0.98] sm:w-auto"
                >
                  <AddIcon />

                  <span>
                    {programType === "workout"
                      ? "ساخت برنامه تمرینی"
                      : "ساخت برنامه تغذیه"}
                  </span>
                </button>

              </div>
            </div>

            {/* ================= LIST CARD ================= */}

            <div className="min-w-0 overflow-hidden rounded-[20px] border border-[#E8EDF5] bg-white sm:rounded-[24px]">

              {/* ================= FILTERS ================= */}

              <div className="border-b border-gray-100">
                <div
                  role="group"
                  aria-label="فیلتر وضعیت"
                  className="flex min-w-0 items-center gap-5 overflow-x-auto px-4 pt-4 sm:gap-8 sm:px-6 sm:pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {filters.map((filter) => {
                    const active = activeFilter === filter.id;
                    const count = getCount(filter.id);

                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        aria-pressed={active}
                        className={`relative flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap pb-3.5 text-xs font-medium transition sm:text-sm focus:outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[#007BFF] ${
                          active
                            ? "text-[#007BFF]"
                            : "text-[#6B6F77] hover:text-gray-800"
                        }`}
                      >
                        {filter.title}

                        {count > 0 && (
                          <span
                            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                              active
                                ? "bg-[#007BFF] text-white"
                                : "bg-[#EEF5FF] text-[#007BFF]"
                            }`}
                          >
                            {count}
                          </span>
                        )}

                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#007BFF]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================= DESKTOP / TABLET TABLE ================= */}

              <div
                role="table"
                aria-label="فهرست برنامه شاگردان"
                className="hidden lg:block"
              >

                {/* Full Header - XL */}

                <div
                  role="row"
                  className="hidden h-14 grid-cols-[1.4fr_1.5fr_0.9fr_1fr_1fr_120px] items-center bg-[#FAFBFD] px-5 font-primary text-xs text-gray-400 xl:grid 2xl:px-6 2xl:text-sm"
                >
                  <div role="columnheader">شاگرد</div>
                  <div role="columnheader">اسم برنامه</div>
                  <div role="columnheader">وضعیت</div>
                  <div role="columnheader">تاریخ ایجاد</div>
                  <div role="columnheader">تاریخ انقضا</div>
                  <div role="columnheader" className="text-center">
                    عملیات
                  </div>
                </div>

                {/* Compact Header - LG */}

                <div
                  role="row"
                  className="grid h-14 grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(100px,0.8fr)_110px] items-center bg-[#FAFBFD] px-4 font-primary text-xs text-gray-400 xl:hidden"
                >
                  <div role="columnheader">شاگرد</div>
                  <div role="columnheader">اسم برنامه</div>
                  <div role="columnheader">وضعیت</div>
                  <div role="columnheader" className="text-center">
                    عملیات
                  </div>
                </div>

                {/* Table Rows */}

                <div role="rowgroup">
                  {filteredStudents.map(renderTableRow)}
                </div>
              </div>

              {/* ================= MOBILE / TABLET CARDS ================= */}

              {filteredStudents.length > 0 && (
                <ul className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:hidden">
                  {filteredStudents.map(renderStudentCard)}
                </ul>
              )}

              {/* ================= EMPTY STATE ================= */}

              {filteredStudents.length === 0 && (
                <div
                  className="px-4 py-14 text-center sm:py-20"
                  role="status"
                >
                  <div
                    className="mb-4 text-4xl"
                    aria-hidden="true"
                  >
                    🔍
                  </div>

                  <p className="text-sm font-bold text-gray-700">
                    شاگردی پیدا نشد
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    جستجو یا فیلتر انتخاب‌شده را تغییر دهید
                  </p>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-5 min-h-10 rounded-xl bg-[#EEF5FF] px-5 text-sm font-medium text-[#007BFF] transition hover:bg-[#DCEBFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
                    >
                      پاک کردن جستجو و فیلتر
                    </button>
                  )}
                </div>
              )}

            </div>
          </section>
        </main>
      </div>
    </div>
  );
}