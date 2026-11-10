import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import AddAuth from "./AddAuth";
import { api, ApiError } from "../../api/client";
import { faDigits, showDate } from "../../lib/jalali";

const FILTERS = [
  { id: "all", title: "همه" },
  { id: "active", title: "فعال" },
  { id: "ended", title: "پایان‌یافته" },
];

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function statusLabel(status) {
  if (status === "active") return "فعال";
  if (status === "ended") return "پایان‌یافته";
  return status || "—";
}

function measure(value, unit) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${faDigits(String(number))}${unit}`;
}

function activityLabel(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(date);
  then.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - then.getTime()) / 86400000);

  if (diff === 0) return "امروز";
  if (diff === 1) return "دیروز";
  if (diff === 2) return "دو روز پیش";
  return showDate(value);
}

function latestBody(observations) {
  const sorted = [...observations].sort((left, right) => String(left.measured_at).localeCompare(String(right.measured_at)));
  const summary = {};

  sorted.forEach((item) => {
    const metrics = item.metrics || {};
    if (metrics.weight_kg != null) summary.weight = metrics.weight_kg;
    if (metrics.height_cm != null) summary.height = metrics.height_cm;
    if (metrics.body_fat_percent != null) summary.fat = metrics.body_fat_percent;
    if (metrics.bmi != null || metrics.bmi_calculated != null) summary.bmi = metrics.bmi ?? metrics.bmi_calculated;
    summary.measured_at = item.measured_at;
  });

  return summary;
}

export default function CoachAthletes() {
  const [rows, setRows] = useState([]);
  const [bodies, setBodies] = useState({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    api("/api/v1/coach/relationships").then(
      async (body) => {
        if (!active) {
          return;
        }

        const list = Array.isArray(body?.relationships) ? body.relationships : [];
        setRows(list);
        setLoaded(true);

        const next = {};
        await Promise.all(list.map(async (row) => {
          try {
            const observations = await api(`/api/v1/coach/relationships/${row.id}/body-observations`);
            next[row.id] = latestBody(Array.isArray(observations?.observations) ? observations.observations : []);
          } catch {
            next[row.id] = {};
          }
        }));

        if (active) {
          setBodies(next);
        }
      },
      (caught) => {
        if (!active) {
          return;
        }

        setError(errorText(caught));
        setLoaded(true);
      },
    );

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const text = query.trim();
  const visible = rows.filter((row) => {
    const name = row.athlete?.display_name || "";
    const matchesName = !text || name.includes(text);
    const matchesFilter = filter === "all" || row.status === filter;
    return matchesName && matchesFilter;
  });
  const selectedFilter = FILTERS.find((item) => item.id === filter)?.title || "همه";

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard title="شاگردان" description="مدیریت و پیگیری وضعیت شاگردان" />
            <div className="col-span-12">
              <AddAuth count={rows.length} onRegistered={() => setReloadKey((key) => key + 1)} />
            </div>
            <div className="col-span-12">
              <div className="mb-5 flex flex-col items-stretch justify-start gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[300px]">
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-[#6B6F77]">⌕</span>
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="جستجو بر اساس نام، شماره موبایل و..."
                    className="h-11 w-full rounded-2xl border border-transparent bg-white pr-10 pl-4 text-xs text-[#4F5965] outline-none transition placeholder:text-[#6B6F77] focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/30"
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFilterOpen((current) => !current)}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-5 text-xs font-medium text-white shadow-sm transition hover:bg-[#0066D6] sm:w-auto"
                  >
                    <span>فیلتر پیشرفته</span>
                    <KeyboardArrowDownIcon className={`transition ${filterOpen ? "rotate-180" : ""}`} sx={{ fontSize: 18 }} />
                  </button>
                  {filterOpen && (
                    <div className="absolute top-14 right-0 z-30 w-52 rounded-2xl border border-[#E8ECF1] bg-white p-2 shadow-xl">
                      <p className="px-3 py-2 text-[11px] text-[#6B6F77]">وضعیت رابطه</p>
                      {FILTERS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFilter(item.id);
                            setFilterOpen(false);
                          }}
                          className={`w-full cursor-pointer rounded-xl px-3 py-2.5 text-right text-xs transition ${filter === item.id ? "bg-[#007BFF]/10 font-medium text-[#007BFF]" : "text-[#4F5965] hover:bg-[#F5F7FB]"}`}
                        >
                          <span className="flex items-center justify-between">
                            {item.title}
                            {filter === item.id && <span>✓</span>}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl bg-white">
                {error && <p className="px-5 pt-5 text-right text-sm text-red-700">{error}</p>}
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse">
                    <thead>
                      <tr className="text-[13px] font-normal text-[#6B6F77]">
                        <th className="px-5 py-5 text-right font-normal">شاگرد</th>
                        <th className="px-5 py-5 text-right font-normal">هدف</th>
                        <th className="px-5 py-5 text-right font-normal">وزن</th>
                        <th className="px-5 py-5 text-right font-normal">قد</th>
                        <th className="px-5 py-5 text-right font-normal">BMI</th>
                        <th className="px-5 py-5 text-right font-normal">درصد چربی</th>
                        <th className="px-5 py-5 text-right font-normal">آخرین فعالیت</th>
                        <th className="px-5 py-5 text-right font-normal">جزئیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loaded && visible.length === 0 && (
                        <tr>
                          <td colSpan="8" className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F7FB] text-2xl">🔍</div>
                              <p className="text-[13px] font-medium text-[#4F5965]">شاگردی پیدا نشد</p>
                              <p className="text-[11px] text-[#6B6F77]">عبارت جستجو یا فیلتر انتخابی را تغییر دهید</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {visible.map((row) => {
                        const body = bodies[row.id] || {};
                        const name = row.athlete?.display_name || "—";

                        return (
                          <tr key={row.id} className="border-t border-[#E8ECF1] transition hover:bg-[#F5F7FB]">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#007BFF]/30 bg-[#007BFF]/10 text-sm text-[#007BFF]">
                                  {name.slice(0, 1)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-[#4F5965]">{name}</span>
                                  <span className="mt-0.5 text-[11px] text-[#6B6F77]">{statusLabel(row.status)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[13px] text-[#4F5965]">—</td>
                            <td className="px-5 py-4 text-[13px] text-[#4F5965]">{measure(body.weight, "KG")}</td>
                            <td className="px-5 py-4 text-[13px] text-[#4F5965]">{measure(body.height, "CM")}</td>
                            <td className="px-5 py-4 text-[13px] text-[#4F5965]">{measure(body.bmi, "")}</td>
                            <td className="px-5 py-4 text-[13px] text-[#4F5965]">{measure(body.fat, "%")}</td>
                            <td className="px-5 py-4 text-[13px] text-[#4F5965]">{activityLabel(body.measured_at)}</td>
                            <td className="px-5 py-4">
                              <Link
                                to={`/coach/athletes/${row.id}`}
                                className="inline-flex min-w-[72px] items-center justify-center rounded-full bg-[#007BFF]/10 px-4 py-2 text-[12px] font-medium text-[#007BFF] transition hover:bg-[#007BFF] hover:text-white"
                              >
                                مشاهده
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-[#E8ECF1] px-5 py-4">
                  <span className="text-[10px] text-[#6B6F77]">
                    نمایش {faDigits(visible.length)} شاگرد از {faDigits(rows.length)} شاگرد
                    {filter !== "all" ? ` · ${selectedFilter}` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
