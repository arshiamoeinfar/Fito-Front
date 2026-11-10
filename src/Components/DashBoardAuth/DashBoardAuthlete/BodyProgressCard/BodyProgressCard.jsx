import React, { useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import ExerciseProgressModal from "../ExerciseProgressModal";

const SAMPLE = [
  { value: 45 },
  { value: 20 },
  { value: 50 },
  { value: 55 },
  { value: 50 },
  { value: 72 },
  { value: 28 },
  { value: 48 },
  { value: 60 },
  { value: 55 },
];

export default function BodyProgressCard({
  isShowMore = true,
  count = [],
  title = "",
  series,
  metric = "پرس دمبل",
  change = "20kg → 24kg",
  items,
  movements,
  loadError = "",
  ready = true,
}) {
  const charts = Array.isArray(items)
    ? items
    : count.map(() => ({
        metric,
        change,
        series: series?.length ? series : SAMPLE,
      }));
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const hasModal = Array.isArray(movements);

  return (
    <div className="flex flex-col rounded-3xl bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg text-[#6B6F77]">{title}</h1>
        {isShowMore ? (
          <span
            onClick={() => {
              if (hasModal) setOpen(true);
              else navigate("/trainingpage");
            }}
            className="font-primary-light flex cursor-pointer items-center justify-center text-sm text-[#6B6F77]"
          >
            مشاهده همه
          </span>
        ) : null}
      </div>
      {charts.length === 0 ? (
        <p className="py-6 text-sm text-[#A0A4AA]">برای حرکت‌ها هنوز روندی ثبت نشده.</p>
      ) : (
        <div className={`grid min-w-0 gap-4 ${charts.length >= 4 ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" : charts.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : charts.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
          {charts.map((chart, index) => (
            <div key={`${chart.metric}-${index}`} className="flex min-w-0 flex-col gap-2 overflow-hidden">
              <div className="flex flex-col gap-1">
                <h2 className="line-clamp-2 text-sm text-[#6B6F77]">{chart.metric}</h2>
                <p className="font-primary-light text-sm text-[#6B6F77]">{chart.change}</p>
              </div>
              <div className="h-[90px] w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart.series?.length ? chart.series : SAMPLE}>
                    <defs>
                      <linearGradient id={`progress-fill-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6BAF41" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6BAF41" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="linear"
                      dataKey="value"
                      stroke="#6BAF41"
                      strokeWidth={3}
                      fill={`url(#progress-fill-${index})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
      {hasModal ? (
        <ExerciseProgressModal
          isOpen={open}
          onClose={() => setOpen(false)}
          exercises={movements}
          loadError={loadError}
          ready={ready}
        />
      ) : null}
    </div>
  );
}
