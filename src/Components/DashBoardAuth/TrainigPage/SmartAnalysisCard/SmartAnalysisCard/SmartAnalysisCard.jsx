import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkoutAIReport from "./WorkoutAIReport";

const DEFAULT_STATS = [
  { label: "نقطه قوت:", value: "بالا تنه +21%" },
  { label: "نیاز به توجه:", value: "بالا تنه +21%" },
  { label: "پیشنهاد:", value: "۹۰ ثانیه استراحت بین ست ها" },
];



export default function SmartAnalysisCard({
  title = "تحلیل هوشمند",
  description = "این هفته عملکردت در تمرینات بالاتنه بهتر شده. قدرت پرس دمبل نسبت به شروع برنامه ۲۰٪ افزایش داشته، اما پیشرفت حرکات پشت بازو کمتر بوده است.",
  stats = DEFAULT_STATS,
  reportTo,
})
{
  const navigate = useNavigate();
  const [isReportVisible, setIsReportVisible] = useState(false);
  return (
    <div
      dir="rtl"
      className="flex w-full flex-col gap-6 rounded-3xl bg-linear-to-b from-blue-600 to-blue-600 p-5 text-right shadow-lg sm:p-8"
    >
      <h3 className="text-2xl text-white sm:text-3xl">{title}</h3>

      <p className="text-blue-50 text-base leading-8 Modam-Medium">
        {description}
      </p>

      <div className="flex flex-col gap-4">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#006CDF] px-4 py-4 sm:px-6"
          >
            <span className="text-white/90 text-sm">{item.label}</span>
            <span className="text-sm text-white sm:text-lg">{item.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
        
          setIsReportVisible(true);
        }}
        className=" bg-blue-700 cursor-pointer text-base rounded-2xl py-4  transition-colors text-white hover:bg-blue-800 sm:text-lg"
      >
        مشاهده گزارش کامل
      </button>

      {isReportVisible && (
        <WorkoutAIReport onClose={() => setIsReportVisible(false)} />
      )}
    </div>
  );
}
