
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Dumbbell,
  FileCheck2,
  HeartPulse,
  Loader2,
  MoonStar,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";

import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";

const FIELDS = [
  ["goal", "هدفت چیست؟"],
  [
    "training_background",
    "سابقه تمرین: چند سال، سطح، چند روز در هفته، وسیله و آسیب",
  ],
  ["sports_history", "سابقه ورزشی"],
  ["conditions", "بیماری"],
  ["medications", "دارو"],
  ["food_limits", "حساسیت یا پرهیز غذایی"],
  ["other_factors", "عامل مهم دیگر، اگر هست"],
];

const EMPTY = {
  goal: "",
  training_background: "",
  sports_history: "",
  conditions: "",
  medications: "",
  food_limits: "",
  other_factors: "",
};

const GROUPS = [
  {
    id: "goal",
    number: "01",
    title: "هدف و مسیر",
    subtitle: "مشخص کن دقیقاً می‌خواهی به چه نتیجه‌ای برسی.",
    description: "هدف تو مسیر طراحی برنامه را مشخص می‌کند.",
    Icon: Target,
    keys: ["goal"],
    tone: "blue",
  },
  {
    id: "training",
    number: "02",
    title: "سوابق ورزشی و تمرین",
    subtitle: "درباره تجربه و شرایط تمرینی خودت بگو.",
    description: "برنامه باید با سطح آمادگی و امکانات تو هماهنگ باشد.",
    Icon: Dumbbell,
    keys: ["training_background", "sports_history"],
    tone: "violet",
  },
  {
    id: "health",
    number: "03",
    title: "سلامت و وضعیت جسمانی",
    subtitle: "اطلاعات ضروری برای درنظرگرفتن محدودیت‌ها.",
    description: "این اطلاعات به طراحی ایمن‌تر برنامه کمک می‌کند.",
    Icon: HeartPulse,
    keys: ["conditions", "medications"],
    tone: "rose",
  },
  {
    id: "food",
    number: "04",
    title: "تغذیه و شرایط زندگی",
    subtitle: "مواردی که باید در برنامه غذایی و تمرینی رعایت شوند.",
    description: "شرایط روزمره و محدودیت‌ها را فراموش نکن.",
    Icon: UtensilsCrossed,
    keys: ["food_limits", "other_factors"],
    tone: "emerald",
  },
];

const META = {
  goal: {
    placeholder: "مثلاً کاهش ۸ کیلو چربی تا ۳ ماه دیگر",
    single: true,
    hint: "هدفت را تا جای ممکن دقیق و قابل اندازه‌گیری بنویس.",
    example: "کاهش چربی، افزایش حجم عضلانی یا بهبود آمادگی جسمانی",
  },
  training_background: {
    placeholder:
      "مثلاً ۲ سال باشگاه، سطح متوسط، ۴ روز در هفته، دمبل و دستگاه، درد زانوی راست",
    hint: "سابقه تمرین، تعداد روزها، سطح و امکاناتت را بنویس.",
    example: "مدت تمرین، سطح آمادگی، تجهیزات و آسیب‌های احتمالی",
  },
  sports_history: {
    placeholder: "مثلاً ۵ سال فوتسال در دوران مدرسه",
    hint: "فعالیت‌های ورزشی قبلی خودت را توضیح بده.",
    example: "ورزش‌های تیمی، رزمی، دویدن یا فعالیت حرفه‌ای",
    none: true,
  },
  conditions: {
    placeholder: "مثلاً دیابت نوع ۲، فشار خون، یا هیچ",
    hint: "شرایط پزشکی مهم را دقیق وارد کن.",
    example: "اگر بیماری یا محدودیت پزشکی نداری، گزینه ندارم را انتخاب کن.",
    none: true,
  },
  medications: {
    placeholder: "نام دارو و مقدار مصرف",
    hint: "داروهای مصرفی را در صورت وجود بنویس.",
    example: "نام دارو و مقدار مصرف، در صورت اطلاع",
    none: true,
  },
  food_limits: {
    placeholder: "مثلاً حساسیت به لاکتوز، گیاه‌خوار",
    hint: "حساسیت‌ها و محدودیت‌های غذایی را مشخص کن.",
    example: "حساسیت غذایی، رژیم خاص یا مواد غذایی غیرقابل مصرف",
    none: true,
  },
  other_factors: {
    placeholder: "مثلاً شیفت شب، سفر زیاد، ساعت کم برای تمرین",
    hint: "هر چیزی که روی برنامه روزانه‌ات اثر می‌گذارد.",
    example: "ساعت کاری، خواب، سفر یا محدودیت زمانی",
    none: true,
  },
};

const ADHERENCE = [
  {
    value: "full",
    label: "کامل",
    hint: "همه برنامه را انجام دادم",
    icon: CheckCircle2,
  },
  {
    value: "partial",
    label: "نسبی",
    hint: "بخشی از برنامه را انجام دادم",
    icon: Activity,
  },
  {
    value: "missed",
    label: "انجام نشد",
    hint: "امروز فرصت نشد",
    icon: X,
  },
];

const fa = (value) => Number(value || 0).toLocaleString("fa-IR");

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود. لطفاً دوباره تلاش کن.";
  }

  return caught.message;
}

function IconTile({ Icon, tone = "blue", size = "normal" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    green:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    slate:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  };

  const sizes = {
    small: "h-9 w-9 rounded-xl",
    normal: "h-11 w-11 rounded-2xl",
    large: "h-14 w-14 rounded-2xl",
  };

  return (
    <span
      className={`flex shrink-0 items-center justify-center ${sizes[size]} ${tones[tone]}`}
    >
      <Icon
        className={size === "small" ? "h-4 w-4" : "h-5 w-5"}
        strokeWidth={2}
        aria-hidden="true"
      />
    </span>
  );
}

function Banner({ tone, children, onClose }) {
  const isError = tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`col-span-12 flex items-start gap-3 rounded-2xl border px-4 py-4 text-right text-sm leading-7 ${
        isError
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
      }`}
    >
      <Icon className="mt-1 h-5 w-5 shrink-0" />

      <div className="min-w-0 flex-1">{children}</div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن پیام"
          className="rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function SectionHeading({ Icon, eyebrow, title, description, tone = "blue" }) {
  return (
    <div className="flex items-start gap-3.5" dir="rtl">
      <IconTile Icon={Icon} tone={tone} />

      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-[#007BFF] dark:text-blue-400">
            {eyebrow}
          </p>
        )}

        <h2 className="text-base font-black text-[#1C2B40] dark:text-white sm:text-lg">
          {title}
        </h2>

        {description && (
          <p className="mt-1.5 text-xs leading-7 text-[#7D899A] dark:text-gray-400 sm:text-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressOverview({ filled, total, percent, complete }) {
  return (
    <div
      className="rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] p-4 dark:border-white/10 dark:bg-[#1C2736]"
      dir="rtl"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#7B8797] dark:text-gray-400">
            میزان تکمیل پرونده
          </p>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#1C2B40] dark:text-white">
              {fa(percent)}٪
            </span>

            <span className="text-[11px] text-[#8D99A9] dark:text-gray-500">
              تکمیل شده
            </span>
          </div>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            complete
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          }`}
        >
          {complete ? <Check size={21} /> : <ClipboardCheck size={21} />}
        </div>
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#E8EDF5] dark:bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="پیشرفت تکمیل پرونده"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 motion-reduce:transition-none ${
            complete
              ? "bg-emerald-500"
              : "bg-gradient-to-l from-[#007BFF] to-[#51A5FF]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-[#7E8A9A] dark:text-gray-400">
          {fa(filled)} از {fa(total)} بخش تکمیل شده
        </span>

        <span
          className={`font-bold ${
            complete
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-[#007BFF] dark:text-blue-400"
          }`}
        >
          {complete ? "پرونده کامل است" : "در حال تکمیل"}
        </span>
      </div>
    </div>
  );
}

function FieldCard({
  field,
  label,
  value,
  onChange,
  index,
}) {
  const meta = META[field];
  const inputId = `athlete-intake-${field}`;
  const filled = Boolean(String(value || "").trim());

  return (
    <div className="rounded-2xl border border-[#E9EEF5] bg-white p-4 transition duration-200 hover:border-[#D3E5FF] hover:shadow-[0_8px_24px_-20px_rgba(0,123,255,0.35)] dark:border-white/10 dark:bg-[#1C2736] dark:hover:border-blue-500/30 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F1F5FA] text-[10px] font-bold text-[#8290A2] dark:bg-white/5 dark:text-gray-400">
              {fa(index)}
            </span>

            <label
              htmlFor={inputId}
              className="text-xs font-bold leading-6 text-[#34445A] dark:text-gray-200"
            >
              {label}
            </label>
          </div>

          <p className="mt-2 text-[11px] leading-6 text-[#94A0AF] dark:text-gray-500">
            {meta.hint}
          </p>
        </div>

        {filled && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Check size={14} />
          </span>
        )}
      </div>

      <div className="mt-4">
        {meta.single ? (
          <input
            id={inputId}
            type="text"
            value={value}
            placeholder={meta.placeholder}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] px-4 py-3.5 text-sm leading-7 text-[#25364C] outline-none transition placeholder:text-[#A5AFBC] hover:border-[#CAD7E7] focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/10 dark:border-white/10 dark:bg-[#172130] dark:text-white dark:placeholder:text-gray-600 dark:focus:border-blue-500 dark:focus:bg-[#172130]"
          />
        ) : (
          <textarea
            id={inputId}
            value={value}
            placeholder={meta.placeholder}
            onChange={(event) => onChange(event.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] px-4 py-3 text-sm leading-7 text-[#25364C] outline-none transition placeholder:text-[#A5AFBC] hover:border-[#CAD7E7] focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/10 dark:border-white/10 dark:bg-[#172130] dark:text-white dark:placeholder:text-gray-600 dark:focus:border-blue-500 dark:focus:bg-[#172130]"
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] leading-5 text-[#A0AAB8] dark:text-gray-500">
          مثال: {meta.example}
        </p>

        {meta.none && !filled && (
          <button
            type="button"
            onClick={() => onChange("ندارم")}
            className="shrink-0 rounded-lg border border-[#DCEAFF] bg-[#F3F8FF] px-3 py-1.5 text-[11px] font-bold text-[#007BFF] transition hover:bg-[#E7F1FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
          >
            ندارم
          </button>
        )}
      </div>
    </div>
  );
}

function Scale({ legend, low, high, value, onChange, disabled }) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-xs font-bold text-[#405168] dark:text-gray-200">
        {legend}
      </legend>

      <div
        className="mt-3 grid grid-cols-5 gap-2"
        role="radiogroup"
        aria-label={legend}
      >
        {["1", "2", "3", "4", "5"].map((option) => {
          const active = value === option;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option)}
              className={`flex min-h-[54px] flex-col items-center justify-center rounded-xl border text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-[#007BFF] bg-[#007BFF] text-white shadow-[0_8px_18px_-8px_rgba(0,123,255,0.65)]"
                  : "border-[#E8EDF4] bg-[#F9FBFD] text-[#53647A] hover:border-[#B9D8FF] hover:bg-[#F0F7FF] dark:border-white/10 dark:bg-[#172130] dark:text-gray-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
              }`}
            >
              {fa(option)}
              <span
                className={`mt-1 text-[9px] font-medium ${
                  active ? "text-white/75" : "text-[#A0AAB8] dark:text-gray-500"
                }`}
              >
                {option === "1"
                  ? "کمترین"
                  : option === "5"
                    ? "بیشترین"
                    : " "}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-[#929EAE] dark:text-gray-500">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}

function AdherenceSelector({ value, onChange, disabled }) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-xs font-bold text-[#405168] dark:text-gray-200">
        برنامه را چقدر رعایت کردی؟
      </legend>

      <div
        className="mt-3 grid gap-2 sm:grid-cols-3"
        role="radiogroup"
        aria-label="رعایت برنامه"
      >
        {ADHERENCE.map((option) => {
          const active = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border p-3 text-right transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:opacity-50 ${
                active
                  ? "border-[#007BFF] bg-[#F2F8FF] ring-4 ring-[#007BFF]/10 dark:border-blue-500 dark:bg-blue-500/10"
                  : "border-[#E8EDF4] bg-white hover:border-[#C8DFFF] hover:bg-[#FAFCFF] dark:border-white/10 dark:bg-[#172130] dark:hover:bg-white/5"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-bold ${
                    active
                      ? "text-[#007BFF] dark:text-blue-400"
                      : "text-[#34445A] dark:text-gray-200"
                  }`}
                >
                  {option.label}
                </span>

                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    active
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                      : "bg-[#F3F5F8] text-[#8C98A8] dark:bg-white/5 dark:text-gray-400"
                  }`}
                >
                  <Icon size={16} />
                </span>
              </span>

              <span className="mt-2 block text-[10px] leading-5 text-[#8B97A7] dark:text-gray-400">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ReviewPanel({ review, busy, onGenerate }) {
  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-[26px] border border-[#E8EDF5] bg-white shadow-[0_8px_30px_-25px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-[#202B3B]"
    >
      <div className="border-b border-[#EEF1F6] p-5 dark:border-white/10 sm:p-6">
        <SectionHeading
          Icon={Sparkles}
          eyebrow="AI PROGRESS REVIEW"
          title="مرور هوشمند پیشرفت"
          description="از اطلاعات ثبت‌شده برای دریافت یک جمع‌بندی از روند پیشرفتت استفاده کن."
          tone="violet"
        />
      </div>

      <div className="p-5 sm:p-6">
        <div className="rounded-2xl bg-gradient-to-l from-[#F0F6FF] to-[#F9F7FF] p-4 dark:from-[#1D3049] dark:to-[#29253D] sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF] shadow-sm dark:bg-white/10 dark:text-blue-300">
              <Zap size={18} />
            </div>

            <div>
              <p className="text-xs font-bold text-[#34445A] dark:text-white">
                تحلیل پیشرفت با دستیار فیتو
              </p>

              <p className="mt-1 text-[11px] leading-6 text-[#7C899A] dark:text-gray-400">
                دستیار از پرونده، تمرین‌های انجام‌شده، غذاهای ثبت‌شده و
                بازخوردهای روزانه برای تهیه جمع‌بندی استفاده می‌کند.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={busy}
          aria-busy={busy}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#183153] px-5 text-sm font-bold text-white transition hover:bg-[#10243E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 sm:w-auto"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {busy ? "در حال آماده‌سازی..." : "ساختن مرور پیشرفت"}
          {!busy && <ArrowLeft size={16} />}
        </button>

        {review ? (
          <div
            className="mt-5 overflow-hidden rounded-2xl border border-[#DDEAFF] bg-[#F8FBFF] dark:border-blue-500/20 dark:bg-[#17283D]"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 border-b border-[#E5EFFB] px-4 py-3 dark:border-white/10">
              <Sparkles size={16} className="text-[#007BFF]" />
              <p className="text-xs font-bold text-[#007BFF] dark:text-blue-400">
                جمع‌بندی دستیار
              </p>
            </div>

            <p className="whitespace-pre-wrap px-4 py-5 text-sm leading-8 text-[#34445A] dark:text-gray-200">
              {review}
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-[#DCE4EF] bg-[#FAFBFD] px-4 py-8 text-center dark:border-white/10 dark:bg-[#172130]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF5FF] text-[#007BFF] dark:bg-blue-500/10 dark:text-blue-400">
              <TrendingUp size={23} />
            </div>

            <p className="mt-3 text-sm font-bold text-[#46566B] dark:text-gray-200">
              هنوز گزارشی ساخته نشده
            </p>

            <p className="mt-1 max-w-sm text-xs leading-6 text-[#929EAE] dark:text-gray-500">
              بعد از انتخاب «ساختن مرور پیشرفت»، نتیجه در همین قسمت نمایش داده
              می‌شود.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function IntakeSkeleton() {
  return (
    <div className="col-span-12 grid gap-5 lg:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-56 animate-pulse rounded-[26px] border border-[#E8EDF5] bg-white dark:border-white/10 dark:bg-[#202B3B]"
        />
      ))}
    </div>
  );
}

export default function AthleteIntake() {
  const [draft, setDraft] = useState(EMPTY);
  const [missing, setMissing] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkin, setCheckin] = useState({
    sleep_score: "3",
    soreness: "2",
    adherence: "full",
    note: "",
  });
  const [review, setReview] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadIntake() {
      setLoading(true);
      setError("");

      try {
        const body = await api("/api/v1/athlete/intake");

        if (!mounted) return;

        setDraft({ ...EMPTY, ...(body.dossier ?? {}) });
        setMissing(body.missing ?? []);
      } catch (caught) {
        if (mounted) setError(errorText(caught));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadIntake();

    return () => {
      mounted = false;
    };
  }, []);

  function updateDraft(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));

    setNotice("");
  }

  async function save(event) {
    event.preventDefault();

    if (busyAction) return;

    setBusyAction("save");
    setError("");
    setNotice("");

    try {
      const body = await api("/api/v1/athlete/intake", {
        method: "PUT",
        body: draft,
      });

      setMissing(body.missing ?? []);

      setNotice(
        body.missing?.length
          ? "پرونده ذخیره شد. موردهای باقی‌مانده هنوز لازم است."
          : "پرونده کامل شد. حالا می‌توانی برنامه بسازی."
      );
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusyAction("");
    }
  }

  async function sendCheckin(event) {
    event.preventDefault();

    if (busyAction) return;

    setBusyAction("checkin");
    setError("");
    setNotice("");

    try {
      const today = new Date();

      const checkedOn = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      await api("/api/v1/athlete/checkins", {
        method: "POST",
        body: {
          checked_on: checkedOn,
          sleep_score: Number(checkin.sleep_score),
          soreness: Number(checkin.soreness),
          adherence: checkin.adherence,
          note: checkin.note,
        },
      });

      setNotice("بازخورد امروز با موفقیت ثبت شد.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusyAction("");
    }
  }

  async function askReview() {
    if (busyAction) return;

    setBusyAction("review");
    setError("");
    setNotice("");
    setReview("");

    try {
      const body = await api("/api/v1/athlete/progress-reviews", {
        method: "POST",
      });

      setReview(body.summary || "");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusyAction("");
    }
  }

  const filled = useMemo(
    () =>
      FIELDS.filter(([key]) =>
        String(draft[key] ?? "").trim()
      ).length,
    [draft]
  );

  const percent = Math.round((filled / FIELDS.length) * 100);
  const complete = missing.length === 0 && filled === FIELDS.length;
  const labelOf = useMemo(() => Object.fromEntries(FIELDS), []);

  const busy = Boolean(busyAction);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#25364C] transition-colors dark:bg-[#111927] dark:text-white">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div className="min-w-0">
          <Navbar />
        </div>

        <main className="min-w-0 py-1 lg:py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-5">
            <HeaderDashBoard
              title="پرونده ورزشکار"
              description="اطلاعاتت را ثبت کن تا فیتو بتواند برنامه مناسب‌تری برایت آماده کند."
            />

            {error && (
              <Banner
                tone="error"
                onClose={() => setError("")}
              >
                {error}
              </Banner>
            )}

            {notice && (
              <Banner
                tone="success"
                onClose={() => setNotice("")}
              >
                {notice}
              </Banner>
            )}

            {/* Hero */}
            <section
              dir="rtl"
              className="relative col-span-12 overflow-hidden rounded-[28px] bg-[#10243E] shadow-[0_18px_50px_-30px_rgba(16,36,62,0.6)]"
            >
              <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-[75px]" />
              <div className="pointer-events-none absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px]" />

              <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_270px] lg:items-center lg:p-8">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-blue-200">
                    <Sparkles size={13} />
                    YOUR FITNESS PROFILE
                  </div>

                  <h1 className="text-2xl font-black leading-[1.7] text-white sm:text-3xl">
                    بدن تو، مسیر تو،
                    <span className="block text-[#65B4FF]">
                      برنامه مخصوص خودت
                    </span>
                  </h1>

                  <p className="mt-3 max-w-2xl text-xs leading-8 text-slate-300 sm:text-sm">
                    هرچه اطلاعات دقیق‌تری از شرایط، سابقه و هدفت ثبت کنی،
                    دستیار فیتو تصویر روشن‌تری از نیازهای تو خواهد داشت.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-200">
                      <ShieldCheck size={14} className="text-emerald-300" />
                      اطلاعات شخصی و ورزشی
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-200">
                      <Target size={14} className="text-blue-300" />
                      متناسب با هدف تو
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-300">
                        وضعیت پرونده
                      </p>

                      <p className="mt-1 text-lg font-black text-white">
                        {complete ? "تکمیل شده" : "در حال تکمیل"}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-200">
                      {complete ? (
                        <FileCheck2 size={25} />
                      ) : (
                        <ClipboardList size={25} />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-[#36B8FF] to-[#007BFF] transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300">
                    <span>{fa(filled)} از {fa(FIELDS.length)} بخش</span>
                    <span className="font-bold text-white">
                      {fa(percent)}٪
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Missing information */}
            {missing.length > 0 && !loading && (
              <section
                dir="rtl"
                className="col-span-12 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <AlertCircle size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      چند مورد هنوز تکمیل نشده است
                    </h3>

                    <p className="mt-1 text-xs leading-6 text-amber-800/80 dark:text-amber-300/80">
                      برای تکمیل پرونده، اطلاعات زیر را بررسی کن.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {missing.map((item) => (
                        <span
                          key={String(item)}
                          className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-[#2D2A20] dark:text-amber-200"
                        >
                          {labelOf[item]?.split(":")[0] ?? String(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Main Intake Form */}
            <form
              onSubmit={save}
              dir="rtl"
              className="col-span-12 overflow-hidden rounded-[28px] border border-[#E7ECF3] bg-white shadow-[0_10px_40px_-32px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#202B3B]"
            >
              <div className="border-b border-[#EEF1F6] p-5 dark:border-white/10 sm:p-7">
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                  <SectionHeading
                    Icon={ClipboardList}
                    eyebrow="PERSONAL PROFILE"
                    title="پرونده اطلاعات ورزشی"
                    description="اطلاعات زیر را با دقت وارد کن. این اطلاعات برای شخصی‌سازی برنامه‌های تو استفاده می‌شود."
                  />

                  <div className="w-full xl:max-w-[300px]">
                    <ProgressOverview
                      filled={filled}
                      total={FIELDS.length}
                      percent={percent}
                      complete={complete}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {complete && (
                  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <CheckCircle2
                      size={20}
                      className="shrink-0 text-emerald-600 dark:text-emerald-400"
                    />

                    <p className="text-xs font-semibold leading-6 text-emerald-800 dark:text-emerald-300">
                      پرونده تو کامل است. می‌توانی اطلاعات را همچنان ویرایش و
                      به‌روزرسانی کنی.
                    </p>
                  </div>
                )}

                {loading ? (
                  <IntakeSkeleton />
                ) : (
                  <div className="space-y-5">
                    {GROUPS.map((group) => {
                      const Icon = group.Icon;

                      return (
                        <section
                          key={group.id}
                          className="overflow-hidden rounded-[24px] border border-[#E9EEF5] bg-[#FBFCFE] dark:border-white/10 dark:bg-[#182333]"
                        >
                          <div className="flex items-center gap-3 border-b border-[#EDF1F6] px-4 py-4 dark:border-white/10 sm:px-5">
                            <IconTile
                              Icon={Icon}
                              tone={group.tone}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-black text-[#273950] dark:text-white">
                                  {group.title}
                                </h3>

                                <span className="rounded-md bg-[#EDF4FD] px-2 py-0.5 text-[9px] font-bold text-[#007BFF] dark:bg-blue-500/10 dark:text-blue-400">
                                  {group.number}
                                </span>
                              </div>

                              <p className="mt-1 text-[11px] leading-6 text-[#8794A5] dark:text-gray-400">
                                {group.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-2">
                            {group.keys.map((key) => (
                              <FieldCard
                                key={key}
                                field={key}
                                label={labelOf[key]}
                                value={draft[key]}
                                index={FIELDS.findIndex(
                                  ([fieldKey]) => fieldKey === key
                                ) + 1}
                                onChange={(value) =>
                                  updateDraft(key, value)
                                }
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-2 px-5 pb-4 text-[10px] leading-5 text-[#A0AAB8] dark:text-gray-500">
                            <ShieldCheck size={13} />
                            {group.description}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#EEF1F6] pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-6 text-[#98A3B2] dark:text-gray-500">
                    قبل از خروج، تغییرات خود را ذخیره کن.
                  </p>

                  <button
                    type="submit"
                    disabled={busy || loading}
                    aria-busy={busyAction === "save"}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-7 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(0,123,255,0.55)] transition hover:-translate-y-0.5 hover:bg-[#0069D9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyAction === "save" ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}
                    {busyAction === "save"
                      ? "در حال ذخیره..."
                      : "ذخیره اطلاعات پرونده"}
                    <ArrowLeft size={16} />
                  </button>
                </div>

                <Link
                  to="/AnalysisPage/tools?panel=sizes"
                  className="group mt-5 flex items-center gap-3 rounded-2xl border border-[#E6EDF5] bg-[#F9FBFE] p-4 transition hover:border-[#C9DFFF] hover:bg-[#F2F8FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] dark:border-white/10 dark:bg-[#182333] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
                >
                  <IconTile Icon={Activity} tone="slate" />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[#30435A] dark:text-white">
                      قدم بعدی: ثبت وزن و عکس بدن
                    </span>

                    <span className="mt-1 block text-[11px] leading-6 text-[#8794A5] dark:text-gray-400">
                      وزن فعلی و سه عکس جلو، بغل و پشت را برای تکمیل اطلاعات
                      بدنی ثبت کن.
                    </span>
                  </span>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#8290A2] transition group-hover:-translate-x-1 group-hover:text-[#007BFF] dark:bg-white/5">
                    <ChevronLeft size={19} />
                  </span>
                </Link>
              </div>
            </form>

            {/* Daily Check-in */}
            <form
              onSubmit={sendCheckin}
              dir="rtl"
              className="col-span-12 overflow-hidden rounded-[26px] border border-[#E7ECF3] bg-white shadow-[0_8px_30px_-25px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-[#202B3B] lg:col-span-6"
            >
              <div className="border-b border-[#EEF1F6] p-5 dark:border-white/10 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <SectionHeading
                    Icon={MoonStar}
                    eyebrow="DAILY CHECK-IN"
                    title="بازخورد روزانه"
                    description="در چند ثانیه وضعیت جسمی و میزان پایبندی به برنامه را ثبت کن."
                    tone="green"
                  />

                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <Clock3 size={12} />
                    روزانه
                  </span>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <div className="rounded-2xl border border-[#EAF0F5] bg-[#FAFBFD] p-4 dark:border-white/10 dark:bg-[#182333]">
                  <Scale
                    legend="خوابت دیشب چطور بود؟"
                    low="۱ = خیلی بد"
                    high="۵ = عالی"
                    value={checkin.sleep_score}
                    onChange={(next) =>
                      setCheckin((current) => ({
                        ...current,
                        sleep_score: next,
                      }))
                    }
                    disabled={busy}
                  />
                </div>

                <div className="rounded-2xl border border-[#EAF0F5] bg-[#FAFBFD] p-4 dark:border-white/10 dark:bg-[#182333]">
                  <Scale
                    legend="بدنت چقدر کوفته است؟"
                    low="۱ = اصلاً"
                    high="۵ = خیلی زیاد"
                    value={checkin.soreness}
                    onChange={(next) =>
                      setCheckin((current) => ({
                        ...current,
                        soreness: next,
                      }))
                    }
                    disabled={busy}
                  />
                </div>

                <AdherenceSelector
                  value={checkin.adherence}
                  onChange={(next) =>
                    setCheckin((current) => ({
                      ...current,
                      adherence: next,
                    }))
                  }
                  disabled={busy}
                />

                <div>
                  <label
                    htmlFor="checkin-note"
                    className="mb-2 block text-xs font-bold text-[#405168] dark:text-gray-200"
                  >
                    یادداشت روزانه
                    <span className="mr-1 font-normal text-[#9AA5B3]">
                      (اختیاری)
                    </span>
                  </label>

                  <textarea
                    id="checkin-note"
                    value={checkin.note}
                    onChange={(event) =>
                      setCheckin((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="اگر نکته‌ای درباره تمرین، تغذیه یا وضعیت بدنت وجود دارد بنویس..."
                    className="w-full resize-y rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] px-4 py-3 text-sm leading-7 text-[#25364C] outline-none transition placeholder:text-[#A5AFBC] focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/10 dark:border-white/10 dark:bg-[#172130] dark:text-white dark:placeholder:text-gray-600 dark:focus:bg-[#172130]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  aria-busy={busyAction === "checkin"}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#16845A] px-6 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,132,90,0.45)] transition hover:bg-[#126E4B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16845A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyAction === "checkin" ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {busyAction === "checkin"
                    ? "در حال ثبت..."
                    : "ثبت بازخورد امروز"}
                </button>

                <p className="text-center text-[10px] leading-6 text-[#A0AAB8] dark:text-gray-500">
                  این فرم فقط بازخورد روزانه را ثبت می‌کند و جایگزین ثبت تمرین
                  یا تغذیه نیست.
                </p>
              </div>
            </form>

            {/* AI Review */}
            <div className="col-span-12 lg:col-span-6">
              <ReviewPanel
                review={review}
                busy={busyAction === "review"}
                onGenerate={askReview}
              />
            </div>

            {/* Bottom navigation */}
            <div className="col-span-12 grid gap-3 sm:grid-cols-2">
              <Link
                to="/trainingpage"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#E6EDF5] bg-white p-4 transition hover:border-[#C9DFFF] hover:shadow-md dark:border-white/10 dark:bg-[#202B3B] dark:hover:border-blue-500/30"
              >
                <div className="flex items-center gap-3">
                  <IconTile Icon={Dumbbell} tone="blue" size="small" />

                  <div>
                    <p className="text-xs font-bold text-[#34445A] dark:text-white">
                      برنامه تمرینی
                    </p>
                    <p className="mt-1 text-[10px] text-[#929EAE] dark:text-gray-500">
                      مشاهده بخش ورزش
                    </p>
                  </div>
                </div>

                <ArrowUpLeft
                  size={17}
                  className="text-[#9AA5B3] transition group-hover:-translate-y-0.5 group-hover:text-[#007BFF]"
                />
              </Link>

              <Link
                to="/AnalysisPage/tools?panel=sizes"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#E6EDF5] bg-white p-4 transition hover:border-[#C9DFFF] hover:shadow-md dark:border-white/10 dark:bg-[#202B3B] dark:hover:border-blue-500/30"
              >
                <div className="flex items-center gap-3">
                  <IconTile Icon={Activity} tone="violet" size="small" />

                  <div>
                    <p className="text-xs font-bold text-[#34445A] dark:text-white">
                      تحلیل بدن
                    </p>
                    <p className="mt-1 text-[10px] text-[#929EAE] dark:text-gray-500">
                      ثبت اندازه‌ها و تصاویر
                    </p>
                  </div>
                </div>

                <ArrowUpLeft
                  size={17}
                  className="text-[#9AA5B3] transition group-hover:-translate-y-0.5 group-hover:text-[#007BFF]"
                />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
