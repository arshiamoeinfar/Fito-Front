import React, { useEffect, useMemo, useRef, useState } from "react";
import CaretDown from "@mui/icons-material/KeyboardArrowDown";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* Static data (outside the component so it isn't re-created on render) */
/* ------------------------------------------------------------------ */

const ALL = "همه";

const students = [
  {
    id: 1,
    name: "علی رضایی",
    goal: "کاهش وزن",
    weight: 68,
    height: 168,
    bmi: 24.2,
    bodyFat: 24,
    activity: "دو روز پیش",
    avatar: "👨🏻",
    level: "متوسط",
    sessions: 4,
    trainingHistory: "1 سال",
    phone: "09123456789",
    email: "ali@example.com",
    age: 24,
    gender: "مرد",
  },
  {
    id: 2,
    name: "محمد احمدی",
    goal: "عضله‌سازی",
    weight: 82,
    height: 178,
    bmi: 25.9,
    bodyFat: 17,
    activity: "امروز",
    avatar: "👨🏻",
    level: "پیشرفته",
    sessions: 5,
    trainingHistory: "3 سال",
    phone: "09123456788",
    email: "mohammad@example.com",
    age: 27,
    gender: "مرد",
  },
  {
    id: 3,
    name: "سارا کریمی",
    goal: "تناسب اندام",
    weight: 61,
    height: 165,
    bmi: 22.4,
    bodyFat: 21,
    activity: "دیروز",
    avatar: "👩🏻",
    level: "متوسط",
    sessions: 3,
    trainingHistory: "2 سال",
    phone: "09123456787",
    email: "sara@example.com",
    age: 23,
    gender: "زن",
  },
  {
    id: 4,
    name: "رضا محمدی",
    goal: "افزایش قدرت",
    weight: 91,
    height: 182,
    bmi: 27.5,
    bodyFat: 19,
    activity: "دو روز پیش",
    avatar: "👨🏻",
    level: "حرفه‌ای",
    sessions: 6,
    trainingHistory: "5 سال",
    phone: "09123456786",
    email: "reza@example.com",
    age: 29,
    gender: "مرد",
  },
  {
    id: 5,
    name: "امیر حسینی",
    goal: "کاهش وزن",
    weight: 76,
    height: 175,
    bmi: 24.8,
    bodyFat: 23,
    activity: "امروز",
    avatar: "👨🏻",
    level: "مبتدی",
    sessions: 3,
    trainingHistory: "6 ماه",
    phone: "09123456785",
    email: "amir@example.com",
    age: 21,
    gender: "مرد",
  },
  {
    id: 6,
    name: "نیما رحیمی",
    goal: "عضله‌سازی",
    weight: 84,
    height: 180,
    bmi: 25.9,
    bodyFat: 16,
    activity: "دو روز پیش",
    avatar: "👨🏻",
    level: "پیشرفته",
    sessions: 5,
    trainingHistory: "4 سال",
    phone: "09123456784",
    email: "nima@example.com",
    age: 26,
    gender: "مرد",
  },
];

const filters = [ALL, "کاهش وزن", "عضله‌سازی", "تناسب اندام", "افزایش قدرت"];

/* Normalizes Persian/Arabic digits and letters so search works
   no matter which keyboard the coach is typing with. */
const normalize = (value = "") =>
  String(value)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ") // ZWNJ -> space
    .trim()
    .toLowerCase();

/* Keeps numbers + units readable inside an RTL layout (e.g. "68 kg", "24%") */
function Num({ children, className = "" }) {
  return (
    <span dir="ltr" className={`inline-block tabular-nums ${className}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */

export default function CoachAthletes() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(ALL);

  const filterRef = useRef(null);

  /* Close the filter dropdown on outside click / Escape */
  useEffect(() => {
    if (!filterOpen) return;

    const handlePointerDown = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setFilterOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterOpen]);

  const filteredStudents = useMemo(() => {
    const query = normalize(search);

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        normalize(student.name).includes(query) ||
        normalize(student.goal).includes(query) ||
        normalize(student.level).includes(query) ||
        student.phone.includes(query) ||
        normalize(student.email).includes(query);

      const matchesFilter =
        selectedFilter === ALL || student.goal === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [search, selectedFilter]);

  const goToDetails = (id) => navigate(`/coach/athletes/${id}`);

  const isFilterActive = selectedFilter !== ALL;

  const detailsButtonClass = `
    px-4
    rounded-full
    bg-blue-100
    text-[#007BFF]
    text-[12px]
    font-medium
    hover:bg-blue-600
    hover:text-white
    focus-visible:outline-none
    focus-visible:ring-4
    focus-visible:ring-blue-200
    active:scale-95
    cursor-pointer
    transition-all duration-200
  `;

  return (
    <div dir="rtl" className="w-full min-h-screen">
      {/* keyframes for the dropdown (kept local so no tailwind.config change is needed) */}
      <style>{`
        @keyframes filterIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .filter-pop { animation: none !important; }
        }
      `}</style>

      <div className="w-full max-w-[1600px] grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 bg-[#F5F7FB]">
        {/* ============================ Header ============================ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 sm:mb-1">
          {/* Search */}
          <div className="relative w-full sm:w-[300px]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              ⌕
            </span>

            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام، شماره موبایل و..."
              aria-label="جستجوی شاگردان"
              className="
                w-full
                h-11
                bg-white
                rounded-2xl
                border border-transparent
                pr-10
                pl-4
                text-[16px] sm:text-xs
                text-gray-600
                placeholder:text-gray-400
                placeholder:text-xs
                outline-none
                transition-all duration-200
                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-100
                [&::-webkit-search-cancel-button]:appearance-none
              "
            />
          </div>

          {/* Filter */}
          <div ref={filterRef} className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={filterOpen}
              className="
                h-11
                px-5
                rounded-2xl
                bg-blue-600
                text-white
                text-xs
                font-medium
                flex
                items-center
                justify-center
                gap-2
                shadow-sm
                hover:bg-blue-700
                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-blue-200
                active:scale-95
                transition-all duration-200
                w-full sm:w-auto
                whitespace-nowrap
              "
            >
              <span>{isFilterActive ? selectedFilter : "فیلتر پیشرفته"}</span>

              <span
                aria-hidden="true"
                className={`text-sm w-4 h-4 flex items-center justify-center transition-transform duration-300 ${
                  filterOpen ? "rotate-180" : ""
                }`}
              >
                <CaretDown fontSize="inherit" />
              </span>
            </button>

            {filterOpen && (
              <div
                role="listbox"
                aria-label="فیلتر بر اساس هدف شاگرد"
                className="
                  filter-pop
                  absolute
                  z-30
                  top-[calc(100%+8px)]
                  right-0
                  left-0
                  sm:left-auto
                  sm:w-52
                  bg-white
                  rounded-2xl
                  border border-gray-100
                  shadow-xl
                  p-2
                  animate-[filterIn_.2s_ease-out]
                "
              >
                <p className="px-3 py-2 text-[11px] text-gray-400">
                  هدف شاگرد
                </p>

                {filters.map((filter) => {
                  const active = selectedFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setSelectedFilter(filter);
                        setFilterOpen(false);
                      }}
                      className={`
                        w-full
                        text-right
                        px-3
                        py-3 sm:py-2.5
                        rounded-xl
                        text-xs
                        transition-all duration-200
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-blue-200
                        ${
                          active
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className="flex items-center justify-between">
                        {filter}
                        {active && <span className="text-blue-600">✓</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================ Content ============================ */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden">
          {/* ---------- Desktop table (lg and up) ---------- */}
          <div className="hidden lg:block overflow-x-auto w-full">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="text-gray-500 text-[13px] font-normal">
                  {[
                    "شاگرد",
                    "هدف",
                    "وزن",
                    "قد",
                    "BMI",
                    "درصد چربی",
                    "آخرین فعالیت",
                    "جزئیات",
                  ].map((title) => (
                    <th
                      key={title}
                      scope="col"
                      className="text-right font-normal px-5 py-5 whitespace-nowrap"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="
                        border-t border-gray-100
                        hover:bg-blue-50/30
                        transition-colors duration-200
                      "
                    >
                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <div
                            className="
                              w-9 h-9
                              rounded-full
                              bg-blue-50
                              border
                              border-blue-100
                              flex
                              items-center
                              justify-center
                              text-lg
                              shrink-0
                            "
                          >
                            {student.avatar}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {student.name}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 truncate">
                              {student.level}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Goal */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-gray-600">
                          {student.goal}
                        </span>
                      </td>

                      {/* Weight */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-gray-600">
                          <Num>{student.weight} KG</Num>
                        </span>
                      </td>

                      {/* Height */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-gray-600">
                          <Num>{student.height} CM</Num>
                        </span>
                      </td>

                      {/* BMI */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-gray-600">
                          <Num>{student.bmi}</Num>
                        </span>
                      </td>

                      {/* Body Fat */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-gray-600">
                          <Num>{student.bodyFat}%</Num>
                        </span>
                      </td>

                      {/* Activity */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-gray-600">
                          {student.activity}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => goToDetails(student.id)}
                          aria-label={`مشاهده جزئیات ${student.name}`}
                          className={`min-w-[72px] py-2 ${detailsButtonClass}`}
                        >
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ---------- Cards (below lg) ---------- */}
          <div className="lg:hidden">
            {filteredStudents.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
                {filteredStudents.map((student) => (
                  <li
                    key={student.id}
                    className="
                      rounded-2xl
                      border border-gray-100
                      p-4
                      flex flex-col gap-4
                      hover:bg-blue-50/30
                      transition-colors duration-200
                    "
                  >
                    {/* Top: avatar + name + goal badge */}
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          w-11 h-11
                          rounded-full
                          bg-blue-50
                          border
                          border-blue-100
                          flex
                          items-center
                          justify-center
                          text-xl
                          shrink-0
                        "
                      >
                        {student.avatar}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-medium text-gray-700 truncate">
                          {student.name}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {student.level}
                        </span>
                      </div>

                      <span
                        className="
                          shrink-0
                          px-3 py-1
                          rounded-full
                          bg-blue-50
                          text-blue-600
                          text-[11px]
                          font-medium
                          whitespace-nowrap
                        "
                      >
                        {student.goal}
                      </span>
                    </div>

                    {/* Stats */}
                    <dl className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-2">
                      <Stat label="وزن">
                        <Num>{student.weight} KG</Num>
                      </Stat>
                      <Stat label="قد">
                        <Num>{student.height} CM</Num>
                      </Stat>
                      <Stat label="BMI">
                        <Num>{student.bmi}</Num>
                      </Stat>
                      <Stat label="درصد چربی">
                        <Num>{student.bodyFat}%</Num>
                      </Stat>
                    </dl>

                    {/* Footer: activity + action */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-gray-400">
                          آخرین فعالیت
                        </span>
                        <span className="text-[13px] text-gray-600 truncate">
                          {student.activity}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => goToDetails(student.id)}
                        aria-label={`مشاهده جزئیات ${student.name}`}
                        className={`min-w-[96px] h-10 ${detailsButtonClass}`}
                      >
                        مشاهده
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-14 px-4 text-center">
                <EmptyState />
              </div>
            )}
          </div>

          {/* ---------- Result footer ---------- */}
          <div className="border-t border-gray-100 px-4 sm:px-5 py-4">
            <span
              className="text-[11px] sm:text-[10px] text-gray-400"
              aria-live="polite"
            >
              نمایش {filteredStudents.length} شاگرد از {students.length} شاگرد
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function Stat({ label, children }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-[#F5F7FB] px-3 py-2 min-w-0">
      <dt className="text-[11px] text-gray-400 truncate">{label}</dt>
      <dd className="text-[13px] text-gray-600 font-medium truncate">
        {children}
      </dd>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-2xl">
        🔍
      </div>

      <p className="text-[13px] font-medium text-gray-600">شاگردی پیدا نشد</p>

      <p className="text-[11px] text-gray-400">
        عبارت جستجو یا فیلتر انتخابی را تغییر دهید
      </p>
    </div>
  );
}