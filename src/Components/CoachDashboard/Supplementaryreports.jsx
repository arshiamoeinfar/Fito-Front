import { useEffect, useState } from "react";

function ProgressRow({ report, delay }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(report.percent), delay);
    return () => clearTimeout(timer);
  }, [report.percent, delay]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-primary text-[#4F5965]">{report.label}</p>
        <span
          className="text-sm  tabular-nums"
          style={{ color: report.color }}
        >
          {report.percent}%
        </span>
      </div>

      <div
        className="w-full h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: report.track }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${animatedPercent}%`,
            background: `linear-gradient(90deg, ${report.colorLight}, ${report.color})`,
          }}
        />
      </div>
    </div>
  );
}

export default function SupplementaryReports({ reports = [] }) {
  return (
    <div dir="rtl" className="bg-white rounded-3xl p-8 w-full">
      <h2 className="text-2xl text-[#6B6F77] font-primary text-right mb-10">
        گزارشات تکمیلی
      </h2>

      {reports.length === 0 ? (
        <p className="text-sm text-[#A0A4AA]">داده‌ای برای این گزارش نیست.</p>
      ) : (
        <div className="flex flex-col gap-9">
          {reports.map((report, index) => (
            <ProgressRow key={report.id} report={report} delay={index * 120} />
          ))}
        </div>
      )}
    </div>
  );
}