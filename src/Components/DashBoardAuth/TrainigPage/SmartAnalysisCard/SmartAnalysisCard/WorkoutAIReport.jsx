
import React, { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Printer,
  Share2,
  X,
  TrendingUp,
  Activity,
  Dumbbell,
  CalendarDays,
  Target,
  Trophy,
  Clock3,
  Flame,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Brain,
} from "lucide-react";

import ReportHeader from "./ModalReport/ReportHeader";
import { reportData } from "./ModalReport/reportData";

const formatNumber = (value) =>
  typeof value === "number" ? value.toLocaleString("fa-IR") : value ?? "—";

const percent = (value) =>
  typeof value === "number" ? `${formatNumber(value)}٪` : "—";

function getValue(value, fallback = "—") {
  return value !== undefined && value !== null && value !== ""
    ? value
    : fallback;
}

function MetricCard({ icon: Icon, label, value, caption, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-[#EDF1F6] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-xs text-[#8993A1]">{label}</p>

      <p className="mt-2 truncate text-xl font-bold text-[#253247] sm:text-2xl">
        {getValue(value)}
      </p>

      {caption && (
        <p className="mt-2 text-[11px] text-[#9AA3AF]">{caption}</p>
      )}
    </div>
  );
}

function SectionTitle({ title, description, icon: Icon }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF]">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h3 className="font-bold text-[#253247]">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-[#929BA8]">{description}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message = "اطلاعات کافی برای تحلیل این بخش وجود ندارد." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-[#FAFBFD] px-4 py-8 text-center">
      <AlertCircle className="mb-3 text-[#AAB3C0]" size={25} />
      <p className="text-xs text-[#929BA8]">{message}</p>
    </div>
  );
}

function ProgressBar({ value, color = "bg-[#007BFF]" }) {
  const safeValue =
    typeof value === "number"
      ? Math.max(0, Math.min(100, value))
      : 0;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#EDF1F6]">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function ChartSection({ exercises = [] }) {
  const validExercises = exercises.filter(
    (item) =>
      typeof item.progress === "number" &&
      Number.isFinite(item.progress)
  );

  if (!validExercises.length) {
    return <EmptyState />;
  }

  const maxValue = Math.max(
    ...validExercises.map((item) => Math.abs(item.progress)),
    1
  );

  return (
    <div className="space-y-5">
      {validExercises.map((exercise, index) => {
        const positive = exercise.progress >= 0;
        const width = (Math.abs(exercise.progress) / maxValue) * 100;

        return (
          <div key={`${exercise.name}-${index}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium text-[#465367]">
                {exercise.name}
              </span>

              <span
                className={`shrink-0 text-xs font-bold ${
                  positive ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {positive ? "+" : ""}
                {formatNumber(exercise.progress)}٪
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-[#EDF1F6]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  positive ? "bg-[#007BFF]" : "bg-red-400"
                }`}
                style={{ width: `${width}%` }}
              />
            </div>

            {exercise.description && (
              <p className="mt-1 text-[11px] text-[#9AA3AF]">
                {exercise.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MuscleAnalysis({ muscles = [] }) {
  if (!muscles.length) {
    return <EmptyState />;
  }

  const getColor = (status) => {
    if (status === "strong") return "bg-emerald-500";
    if (status === "weak") return "bg-orange-400";
    return "bg-[#007BFF]";
  };

  const getStatus = (status) => {
    if (status === "strong") return "عملکرد خوب";
    if (status === "weak") return "نیاز به توجه";
    return "متعادل";
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {muscles.map((muscle, index) => (
        <div
          key={`${muscle.name}-${index}`}
          className="rounded-2xl border border-[#EDF1F6] bg-[#FAFBFD] p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-semibold text-[#39465A]">
              {muscle.name}
            </span>

            <span className="text-[10px] text-[#929BA8]">
              {getStatus(muscle.status)}
            </span>
          </div>

          {typeof muscle.percentage === "number" ? (
            <>
              <div className="mb-2 flex justify-between text-xs text-[#929BA8]">
                <span>حجم تمرین</span>
                <span>{percent(muscle.percentage)}</span>
              </div>

              <ProgressBar
                value={muscle.percentage}
                color={getColor(muscle.status)}
              />
            </>
          ) : (
            <p className="text-xs text-[#929BA8]">
              داده حجم تمرین موجود نیست.
            </p>
          )}

          {muscle.description && (
            <p className="mt-3 text-xs leading-6 text-[#7E8998]">
              {muscle.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ExerciseTable({ exercises = [] }) {
  const [expanded, setExpanded] = useState(null);

  if (!exercises.length) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {exercises.map((exercise, index) => {
        const isExpanded = expanded === index;

        return (
          <div
            key={`${exercise.name}-${index}`}
            className="overflow-hidden rounded-2xl border border-[#EDF1F6] bg-white"
          >
            <button
              type="button"
              onClick={() =>
                setExpanded(isExpanded ? null : index)
              }
              className="flex w-full items-center justify-between gap-3 p-4 text-right transition hover:bg-[#FAFBFD]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF]">
                  <Dumbbell size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#39465A]">
                    {exercise.name}
                  </p>

                  <p className="mt-1 text-[11px] text-[#929BA8]">
                    {getValue(exercise.muscle, "گروه عضلانی نامشخص")}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-xs text-[#007BFF] sm:block">
                  {getValue(exercise.sets, "—")} ست
                </span>

                {isExpanded ? (
                  <ChevronUp size={18} className="text-[#929BA8]" />
                ) : (
                  <ChevronDown size={18} className="text-[#929BA8]" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="grid grid-cols-2 gap-3 border-t border-[#EDF1F6] bg-[#FAFBFD] p-4 sm:grid-cols-4">
                <Detail label="ست" value={exercise.sets} />
                <Detail label="تکرار" value={exercise.reps} />
                <Detail
                  label="وزنه"
                  value={
                    exercise.weight != null
                      ? `${exercise.weight} کیلوگرم`
                      : null
                  }
                />
                <Detail
                  label="پیشرفت"
                  value={
                    typeof exercise.progress === "number"
                      ? `${exercise.progress > 0 ? "+" : ""}${exercise.progress}٪`
                      : null
                  }
                />

                {exercise.description && (
                  <p className="col-span-2 text-xs leading-6 text-[#7E8998] sm:col-span-4">
                    {exercise.description}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[10px] text-[#929BA8]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[#39465A]">
        {getValue(value)}
      </p>
    </div>
  );
}

function InsightList({ items = [], type = "success" }) {
  if (!items.length) {
    return <EmptyState />;
  }

  const isSuccess = type === "success";

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 rounded-2xl p-4 ${
            isSuccess ? "bg-emerald-50" : "bg-orange-50"
          }`}
        >
          <div
            className={`mt-0.5 shrink-0 ${
              isSuccess ? "text-emerald-600" : "text-orange-500"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-[#39465A]">
              {typeof item === "string" ? item : item.title}
            </p>

            {typeof item !== "string" && item.description && (
              <p className="mt-1 text-xs leading-6 text-[#7E8998]">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationList({ recommendations = [] }) {
  if (!recommendations.length) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {recommendations.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF]">
            <Brain size={17} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-[#39465A]">
              {typeof item === "string" ? item : item.title}
            </p>

            {typeof item !== "string" && item.description && (
              <p className="mt-1 text-xs leading-6 text-[#7E8998]">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WorkoutAIReport({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const data = reportData;

  const stats = data.stats ?? {};
  const exercises = data.exercises ?? [];
  const strengths = data.strengths ?? [];
  const weaknesses = data.weaknesses ?? [];
  const recommendations = data.recommendations ?? [];
  const muscles = data.muscles ?? [];

  const hasReportData = Boolean(data.athlete);

  const calculated = useMemo(() => {
    const totalSets = exercises.reduce(
      (sum, exercise) =>
        sum + (Number(exercise.sets) || 0),
      0
    );

    const totalReps = exercises.reduce(
      (sum, exercise) =>
        sum + (Number(exercise.reps) || 0),
      0
    );

    const progressValues = exercises
      .map((exercise) => exercise.progress)
      .filter(
        (value) =>
          typeof value === "number" && Number.isFinite(value)
      );

    const averageProgress =
      progressValues.length > 0
        ? progressValues.reduce((sum, value) => sum + value, 0) /
          progressValues.length
        : null;

    const adherence =
      typeof stats.adherence === "number"
        ? stats.adherence
        : null;

    return {
      totalSets,
      totalReps,
      exerciseCount: exercises.length,
      averageProgress,
      adherence,
    };
  }, [exercises, stats.adherence]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const reportText = useMemo(() => {
    return [
      `گزارش عملکرد تمرینی ${getValue(data.athlete)}`,
      `بازه گزارش: ${getValue(data.period)}`,
      `امتیاز عملکرد: ${getValue(data.score)}/100`,
      `جلسات: ${getValue(stats.completed)} از ${getValue(stats.planned)}`,
      `پایبندی: ${percent(stats.adherence)}`,
      `تعداد حرکات: ${calculated.exerciseCount}`,
      `مجموع ست‌ها: ${calculated.totalSets}`,
      `مجموع تکرارهای ثبت‌شده: ${calculated.totalReps}`,
      `میانگین پیشرفت حرکات: ${
        calculated.averageProgress === null
          ? "داده موجود نیست"
          : `${calculated.averageProgress.toFixed(1)}٪`
      }`,
      "",
      getValue(data.summary, ""),
      "",
      "نقاط قوت:",
      ...strengths.map((item) =>
        typeof item === "string" ? item : item.title
      ),
      "",
      "موارد قابل بهبود:",
      ...weaknesses.map((item) =>
        typeof item === "string" ? item : item.title
      ),
      "",
      "پیشنهادها:",
      ...recommendations.map((item) =>
        typeof item === "string" ? item : item.title
      ),
    ].join("\n");
  }, [data, stats, calculated, strengths, weaknesses, recommendations]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "گزارش تمرینی Fito",
          text: reportText,
        });
      } else {
        await copyReport();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        await copyReport();
      }
    }
  };

  const tabs = [
    { id: "overview", label: "خلاصه عملکرد" },
    { id: "exercises", label: "حرکات و قدرت" },
    { id: "muscles", label: "تحلیل عضلات" },
    { id: "insights", label: "نتایج تحلیل" },
  ];

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#08111F]/65 p-0 backdrop-blur-md sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="flex h-full max-h-[96vh] w-full max-w-[1100px] flex-col overflow-hidden bg-[#F5F8FC] shadow-2xl sm:rounded-[28px]">
        <ReportHeader
          athlete={data.athlete}
          period={data.period}
          onClose={onClose}
        />

        {!hasReportData ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState message="اطلاعات گزارش در دسترس نیست." />
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-[#E9EEF4] bg-white px-3 py-3 sm:px-6">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                      activeTab === tab.id
                        ? "bg-[#007BFF] text-white shadow-md shadow-blue-500/15"
                        : "bg-[#F5F7FB] text-[#758092] hover:bg-blue-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <section className="rounded-3xl bg-gradient-to-l from-[#0065D8] to-[#1687FF] p-5 text-white sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-blue-100">
                          <Activity size={17} />
                          <span className="text-xs">گزارش عملکرد ورزشی</span>
                        </div>

                        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                          تحلیل عملکرد {data.athlete}
                        </h2>

                        <p className="mt-3 max-w-2xl text-xs leading-7 text-blue-100 sm:text-sm">
                          {getValue(data.summary, "خلاصه‌ای برای این گزارش ثبت نشده است.")}
                        </p>

                        <p className="mt-4 text-xs text-blue-100">
                          بازه گزارش: {getValue(data.period)}
                        </p>
                      </div>

                      <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-4 border-white/30 bg-white/10">
                        <span className="text-3xl font-bold">
                          {getValue(data.score, "—")}
                        </span>
                        <span className="mt-1 text-[10px] text-blue-100">
                          امتیاز از ۱۰۰
                        </span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle
                      title="شاخص‌های اصلی"
                      description="خلاصه اطلاعات ثبت‌شده در بازه گزارش"
                      icon={Target}
                    />

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <MetricCard
                        icon={CalendarDays}
                        label="جلسات تکمیل‌شده"
                        value={
                          stats.completed != null
                            ? `${formatNumber(stats.completed)} از ${formatNumber(stats.planned)}`
                            : "—"
                        }
                        caption="جلسات برنامه‌ریزی‌شده"
                        color="blue"
                      />

                      <MetricCard
                        icon={Activity}
                        label="پایبندی به برنامه"
                        value={percent(stats.adherence)}
                        caption="بر اساس جلسات ثبت‌شده"
                        color="green"
                      />

                      <MetricCard
                        icon={Trophy}
                        label="رکوردهای جدید"
                        value={formatNumber(stats.records)}
                        caption="رکورد ثبت‌شده در این بازه"
                        color="orange"
                      />

                      <MetricCard
                        icon={Dumbbell}
                        label="تعداد حرکات"
                        value={formatNumber(calculated.exerciseCount)}
                        caption="حرکات موجود در داده گزارش"
                        color="purple"
                      />

                      <MetricCard
                        icon={Target}
                        label="مجموع ست‌ها"
                        value={formatNumber(calculated.totalSets)}
                        caption="بر اساس ست‌های ثبت‌شده در گزارش"
                        color="blue"
                      />

                      <MetricCard
                        icon={Flame}
                        label="مجموع تکرارها"
                        value={formatNumber(calculated.totalReps)}
                        caption="بر اساس اطلاعات موجود حرکات"
                        color="orange"
                      />

                      <MetricCard
                        icon={TrendingUp}
                        label="میانگین پیشرفت حرکات"
                        value={
                          calculated.averageProgress === null
                            ? "—"
                            : `${calculated.averageProgress.toFixed(1)}٪`
                        }
                        caption="میانگین درصد پیشرفت ثبت‌شده"
                        color="green"
                      />

                      <MetricCard
                        icon={Clock3}
                        label="مدت تمرین"
                        value={
                          stats.duration != null
                            ? `${formatNumber(stats.duration)} دقیقه`
                            : "—"
                        }
                        caption="مجموع زمان تمرین"
                        color="purple"
                      />
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#EDF1F6] bg-white p-5 sm:p-6">
                    <SectionTitle
                      title="روند پیشرفت حرکات"
                      description="مقایسه درصد پیشرفت حرکات ثبت‌شده"
                      icon={TrendingUp}
                    />

                    <ChartSection exercises={exercises} />
                  </section>
                </div>
              )}

              {activeTab === "exercises" && (
                <div className="space-y-5">
                  <section className="rounded-3xl border border-[#EDF1F6] bg-white p-5 sm:p-6">
                    <SectionTitle
                      title="تحلیل قدرت و عملکرد"
                      description="بررسی تغییرات عملکرد در حرکات تمرینی"
                      icon={TrendingUp}
                    />

                    <ChartSection exercises={exercises} />
                  </section>

                  <section className="rounded-3xl border border-[#EDF1F6] bg-white p-5 sm:p-6">
                    <SectionTitle
                      title="جزئیات حرکات"
                      description="مشاهده ست، تکرار، وزنه و میزان پیشرفت هر حرکت"
                      icon={Dumbbell}
                    />

                    <ExerciseTable exercises={exercises} />
                  </section>
                </div>
              )}

              {activeTab === "muscles" && (
                <section className="rounded-3xl border border-[#EDF1F6] bg-white p-5 sm:p-6">
                  <SectionTitle
                    title="تحلیل گروه‌های عضلانی"
                    description="مقایسه وضعیت گروه‌های عضلانی بر اساس داده‌های تمرینی"
                    icon={Activity}
                  />

                  <MuscleAnalysis muscles={muscles} />

                  <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-xs leading-7 text-blue-700">
                    توجه: میزان تمرین هر عضله فقط در صورتی قابل تحلیل است که
                    حرکات به گروه عضلانی مرتبط شده باشند و حجم تمرین آن‌ها
                    در داده گزارش وجود داشته باشد.
                  </div>
                </section>
              )}

              {activeTab === "insights" && (
                <div className="space-y-5">
                  <section className="rounded-3xl border border-[#EDF1F6] bg-white p-5 sm:p-6">
                    <SectionTitle
                      title="نقاط قوت ورزشکار"
                      description="عملکردهای مثبت ثبت‌شده در گزارش"
                      icon={CheckCircle2}
                    />

                    <InsightList items={strengths} type="success" />
                  </section>

                  <section className="rounded-3xl border border-[#EDF1F6] bg-white p-5 sm:p-6">
                    <SectionTitle
                      title="موارد قابل بهبود"
                      description="بخش‌هایی که نیاز به توجه بیشتری دارند"
                      icon={AlertCircle}
                    />

                    <InsightList items={weaknesses} type="warning" />
                  </section>

                  <section className="rounded-3xl border border-[#EDF1F6] bg-white p-5 sm:p-6">
                    <SectionTitle
                      title="پیشنهادهای هوشمند"
                      description="پیشنهادهایی برای بهبود عملکرد تمرینی"
                      icon={Brain}
                    />

                    <RecommendationList recommendations={recommendations} />
                  </section>
                </div>
              )}
            </main>
          </>
        )}

        <footer className="shrink-0 border-t border-[#E9EEF4] bg-white px-3 py-3 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E3E8EE] px-3 py-3 text-xs text-[#62666D] transition hover:bg-[#F7FAFD] sm:flex-none"
              >
                <Printer size={16} />
                چاپ گزارش
              </button>

              <button
                type="button"
                onClick={copyReport}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E3E8EE] px-3 py-3 text-xs text-[#62666D] transition hover:bg-[#F7FAFD] sm:flex-none"
              >
                <Copy size={16} />
                {copied ? "کپی شد" : "کپی گزارش"}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#006FE6] sm:flex-none"
              >
                <Share2 size={16} />
                اشتراک‌گذاری
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#F1F4F8] px-4 py-3 text-xs font-semibold text-[#62666D] transition hover:bg-[#E7ECF2]"
              >
                <X size={16} />
                بستن
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
