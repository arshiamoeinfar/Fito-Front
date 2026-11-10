import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthDialog from "../../Components/auth/AuthDialog";
import { api } from "../../api/client";
import { useSession } from "../../api/session";
import CustomSection from "./CustomSection";
import {
  customSections,
  items,
  regionStyle,
  text,
  useHomepage,
  useLiveHome,
} from "./homepage";
import imgDash from "../../assets/imges/dash.png";
import {
  Users,
  Bell,
  Check,
  UserRound,
  Plus,
  Pencil,
  Target,
  Dumbbell,
  UserPlus,
  Clock,
  Timer,
  TrendingDown,
  TrendingUp,
  Zap,
  Rocket,
  MessageCircle,
  Activity,
  Weight,
} from "lucide-react";
import ProfileImg from "../../assets/imges/image 11.png";
import imgBody from "../../assets/imges/auth.png";
import ImgAnatomi from "../../assets/imges/image 24 (1).png";
import FitoImgCoach from "../../assets/imges/Futuristic AI Fitness Coach Mascot.png";
import ThemeSwitcher from "../../Components/shared/ThemeSwitcher/ThemeSwitcher";

/* =========================
   Fade In Up (unchanged)
========================= */

function FadeInUp({ children, delay = 0, className = "" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transform transition-all duration-1000 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

/* =========================
   Icons (inline, no dependency)
========================= */

const ICONS = {
  arrow: "M19 12H5M12 19L5 12L12 5",
  check: "M5 12L10 17L19 7",
  activity: "M3 12H7L10 4L14 20L17 12H21",
  dumbbell: "M6 9V15M18 9V15M3 10V14M21 10V14M6 12H18M8 7V17M16 7V17",
  flame:
    "M12 22C16.4 22 20 18.7 20 14.5C20 10.8 17.8 8.1 15.3 5.4C14.5 4.5 13.5 3.2 13.1 2C10.7 4.2 9.5 6.3 9.7 9C8.4 8.3 7.5 7.2 7 6C5.4 8 4 10.5 4 13.7C4 18.3 7.5 22 12 22Z",
  water:
    "M12 3C12 3 6 10 6 14.5C6 18.1 8.7 21 12 21C15.3 21 18 18.1 18 14.5C18 10 12 3 12 3Z",
  chat: "M20 11.5C20 15.64 16.42 19 12 19C10.7 19 9.48 18.7 8.42 18.15L4 20L5.35 16.2C4.5 14.9 4 13.4 4 11.8C4 7.5 7.58 4 12 4C16.42 4 20 7.36 20 11.5Z",
  grid: "M4 4H10V10H4ZM14 4H20V10H14ZM4 14H10V20H4ZM14 14H20V20H14Z",
  users:
    "M9 11A3 3 0 1 0 9 5A3 3 0 0 0 9 11ZM3 20C3 16.7 5.7 14 9 14S15 16.7 15 20M16 6A3 3 0 0 1 16 12M17 14C19.4 14.4 21 16.4 21 20",
  star: "M12 3L14.6 8.6L21 9.5L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.5L9.4 8.6Z",
  send: "M21 3L10 14M21 3L14 21L10 14L3 10Z",
  bolt: "M13 2L4 14H11L10 22L20 9H13Z",
  scan: "M4 8V5H7M17 4H20V7M20 16V19H17M7 20H4V17M4 12H20",
  trend: "M3 17L9 11L13 15L21 6M15 6H21V12",
  apple:
    "M12 8C10 6 5 7 5 12C5 16 8 21 10.5 21C11.3 21 11.7 20.5 12 20.5S12.7 21 13.5 21C16 21 19 16 19 12C19 7 14 6 12 8ZM12 8C12 5.5 13.5 4 15 3",
  mail: "M4 6H20V18H4ZM4 7L12 13L20 7",
  phone:
    "M5 4H9L11 9L8.5 10.5C9.6 12.7 11.3 14.4 13.5 15.5L15 13L20 15V19C20 19.6 19.6 20 19 20C10.7 20 4 13.3 4 5C4 4.4 4.4 4 5 4Z",
  pin: "M12 21C12 21 5 14.5 5 10A7 7 0 0 1 19 10C19 14.5 12 21 12 21Z",
};

const Ico = ({ n, s = 18, className = "" }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={ICONS[n] || ICONS.activity} />
  </svg>
);

/* =========================
   Shared UI
========================= */

const INK = "text-[#0b1530]";
const CARD =
  "rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-[0_10px_40px_-18px_rgba(15,40,100,0.22)]";
const BTN =
  "group inline-flex items-center justify-center gap-3 rounded-xl px-7 py-3.5 text-sm font-bold transition hover:-translate-y-0.5";
const PRIMARY = `${BTN} bg-[#007BFF] text-white shadow-[0_12px_32px_rgba(0,123,255,0.3)] hover:bg-[#006fe6]`;
const GHOST = `${BTN} bg-white ${INK} ring-1 ring-slate-200 hover:ring-[#007BFF]`;
const SMALL = "!px-5 !py-2.5";

function FitoLogo({ name = "Fito", light = false, sub = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007BFF] text-white shadow-[0_8px_24px_rgba(0,123,255,0.35)]">
        <Ico n="bolt" s={20} />
      </div>
      <span className="text-start leading-tight">
        <b
          className={`block text-lg font-black tracking-widest ${light ? "text-white" : INK}`}
        >
          {name}
        </b>
        {sub && <small className="text-[10px] text-slate-400">{sub}</small>}
      </span>
    </div>
  );
}

const Badge = ({ children, className = "" }) => (
  <span className={`inline-block rounded-full bg-[#007BFF]/10 px-3 py-1 text-xs font-bold text-[#007BFF] ${className}`}>
    {children}
  </span>
);

function SecHead({ eyebrow, title, lead }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge>{eyebrow}</Badge>
      <h2
        className={`mt-4 text-3xl font-black leading-[1.5] sm:text-4xl ${INK}`}
      >
        {title}
      </h2>
      {lead && <p className="mt-4 text-sm leading-8 text-slate-500">{lead}</p>}
    </div>
  );
}

const Float = ({ className = "", children }) => (
  <div
    className={`absolute z-10 rounded-2xl bg-white p-3 text-xs shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 ${className}`}
  >
    {children}
  </div>
);

const Bar = ({ w, c = "bg-[#007BFF]" }) => (
  <div className="h-2 flex-1 rounded-full bg-slate-100">
    <div className={`h-full rounded-full ${c}`} style={{ width: w }} />
  </div>
);

function Ring({ v, size = 48, children }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#007BFF ${v}%, #e6edf7 0)`,
      }}
    >
      <div
        className="grid place-items-center rounded-full bg-white text-[10px] font-black text-[#0b1530]"
        style={{ width: size - 12, height: size - 12 }}
      >
        {children}
      </div>
    </div>
  );
}

function FHead({ icon, title, text: desc, dark }) {
  return (
    <>
      <span
        className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${dark ? "bg-[#007BFF] text-white" : "bg-[#007BFF]/10 text-[#007BFF]"}`}
      >
        <Ico n={icon} s={20} />
      </span>
      <h3
        className={`mb-1 text-lg font-extrabold ${dark ? "text-white" : INK}`}
      >
        {title}
      </h3>
      <p
        className={`mb-5 text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-500"}`}
      >
        {desc}
      </p>
    </>
  );
}

const Window = ({ children }) => (
  <div className="overflow-hidden rounded-3xl bg-white shadow-[0_40px_90px_-30px_rgba(0,90,255,0.35)] ring-1 ring-slate-200">
    <div className="flex items-center gap-1.5 border-b border-slate-100 px-5 py-3">
      <i className="h-3 w-3 rounded-full bg-red-400" />
      <i className="h-3 w-3 rounded-full bg-amber-400" />
      <i className="h-3 w-3 rounded-full bg-emerald-400" />
    </div>
    {children}
  </div>
);

/* =========================
   Dashboard preview
========================= */

function DashboardPreview({ blocks, overrides = null }) {
  const line = (key, fallback) =>
    overrides && Object.prototype.hasOwnProperty.call(overrides, key)
      ? overrides[key]
      : text(blocks, key, fallback);
  const chart = Array.isArray(overrides?.preview_chart)
    ? overrides.preview_chart
    : items(
        blocks,
        "preview_chart",
        [35, 42, 39, 50, 47, 63, 58, 72, 67, 82, 78, 92],
      );
  const bodyDelta = line("preview_body_delta", "+2.4%");

  return (
    <div className="relative mx-auto w-full max-w-[620px] py-6">
      <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#007BFF]/25 blur-[110px]" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220] p-4 shadow-[0_40px_90px_-25px_rgba(0,90,255,0.55)]">
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-[10px] text-white/25">
            {line("preview_url", "fito.app/dashboard")}
          </span>
        </div>

        <img className="w-full" src={imgDash} alt="" />
      </div>

      <div className="absolute -top-20 -right-5 hidden w-48 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-100 sm:block">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007BFF] text-xs text-white">
            ✦
          </div>
          <div>
            <p className={`text-[10px] font-bold ${INK}`}>
              {line("preview_ai_title", "Fito AI")}
            </p>
            <p className="text-[8px] text-slate-400">
              {line("preview_ai_subtitle", "دستیار هوشمند")}
            </p>
          </div>
        </div>
        <p className="text-[9px] leading-5 text-slate-500">
          {line(
            "preview_ai_text",
            "بر اساس تمرین امروز، زمان مناسبی برای وعده بعدی شماست.",
          )}
        </p>
      </div>

      <div className="absolute -top-2 -left-5 hidden w-60 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-100 sm:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#007BFF]">
            م
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-xs font-bold text-slate-800">
                محمد رضایی
              </p>
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <Check size={11} strokeWidth={3} />
              </div>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              تمرین امروز را تکمیل کرد
            </p>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-9 -left-5 hidden w-56 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-100 sm:block">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className={`text-xs font-bold ${INK}`}>وضعیت شاگردان</p>
            <p className="text-[9px] text-slate-400">گزارش عملکرد هفتگی</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF]">
            <Users size={16} />
          </div>
        </div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-slate-800">۸۴</p>
            <p className="text-[9px] text-slate-400">شاگرد فعال</p>
          </div>
          <span className="rounded-lg bg-green-50 px-2 py-1 text-[9px] font-bold text-green-600">
            +۱۲٪ رشد
          </span>
        </div>
        <div className="flex h-12 items-end gap-1.5">
          {[35, 55, 42, 75, 58, 90, 100].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-blue-100"
              style={{ height: `${height}%` }}
            >
              <div
                className="w-full rounded-t-md bg-[#007BFF]"
                style={{ height: "65%" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroVisual({ blocks, overrides }) {
  const [failed, setFailed] = useState(false);
  const src = text(blocks, "preview_image", "/images/dash.png");

  if (overrides || !src || failed) {
    return <DashboardPreview blocks={blocks} overrides={overrides} />;
  }

  return (
    <div className="relative mx-auto w-full max-w-[640px] py-12">
      <img
        src={src}
        alt="داشبورد فیتو"
        onError={() => setFailed(true)}
        className="w-full rounded-2xl shadow-[0_40px_90px_-25px_rgba(0,90,255,0.55)] ring-1 ring-white/10"
      />

      <Float className="-top-1 left-0 flex items-center gap-3 sm:-left-6">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <Ico n="check" s={16} />
        </span>
        <span>
          <b className={`block ${INK}`}>
            {text(blocks, "hero_float_done", "مریم تمرین امروز را تمام کرد")}
          </b>
          <span className="text-slate-400">
            {text(blocks, "hero_float_done_sub", "روز پا · ۵۸ دقیقه · ۴۲۰ کالری")}
          </span>
        </span>
      </Float>

      <Float className="-top-6 right-0 flex items-center gap-3 sm:-right-4">
        <span>
          <b className={`block text-sm ${INK}`}>
            {text(blocks, "hero_float_goal", "هدف هفتگی")}
          </b>
          <span className="text-slate-400">
            {text(blocks, "hero_float_goal_sub", "۲۴ از ۳۲ جلسه انجام شد")}
          </span>
        </span>
        <Ring v={75} size={54}>
          75%
        </Ring>
      </Float>

      <Float className="-bottom-2 left-0 w-44 sm:-left-6">
        <div className="mb-2 flex justify-between font-bold">
          <span className={INK}>
            {text(blocks, "hero_float_cal", "کالری امروز")}
          </span>
          <span dir="ltr" className="text-[#007BFF]">
            1,850 / 2,400
          </span>
        </div>
        {[
          ["پروتئین", "70%", "bg-[#007BFF]"],
          ["کربوهیدرات", "55%", "bg-sky-400"],
          ["چربی", "35%", "bg-amber-400"],
        ].map(([l, w, c]) => (
          <div
            key={l}
            className="mb-1.5 flex items-center gap-2 text-[10px] text-slate-400"
          >
            <span className="w-14">{l}</span>
            <Bar w={w} c={c} />
          </div>
        ))}
      </Float>

      <div className="absolute -bottom-6 right-0 z-10 w-60 rounded-2xl bg-[#0b1530] p-4 text-xs text-white shadow-2xl sm:-right-4">
        <b className="mb-1 flex items-center gap-1.5">
          <span className="text-sky-300">✦</span>
          {text(blocks, "hero_float_ai_title", "پیشنهاد دستیار AI")}
        </b>
        <p className="leading-6 text-slate-300">
          {text(
            blocks,
            "hero_float_ai_text",
            "پیشرفت قدرتی علی ۲ هفته ثابت مانده. حجم تمرین پا را ۱۰٪ افزایش دهید.",
          )}
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-lg bg-[#007BFF] px-3 py-1.5 font-bold">
            {text(blocks, "hero_float_apply", "اعمال در برنامه")}
          </span>
          <span className="rounded-lg bg-white/10 px-3 py-1.5">جزئیات</span>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Features
========================= */

function Features({ blocks, sections, athleteLive, coachLive }) {
  const students = (
    coachLive
      ? coachLive.students
      : items(blocks, "coach_students", [
          { avatar: "AR", name: "علی رضایی", status: "فعال", percent: "88%" },
          { avatar: "MK", name: "مریم کریمی", status: "فعال", percent: "74%" },
          {
            avatar: "RM",
            name: "رضا محمدی",
            status: "نیاز به بررسی",
            percent: "40%",
          },
        ])
  ).slice(0, 3);
  const exercises = (
    athleteLive?.exercises?.length
      ? athleteLive.exercises
      : items(blocks, "workout_exercises", [
          { name: "اسکوات با هالتر", sets: "۳ ست × ۸ تکرار", done: "1" },
          { name: "ددلیفت رومانیایی", sets: "۳ ست × ۱۰ تکرار", done: "0" },
        ])
  ).slice(0, 2);
  const macros =
    athleteLive?.macros ||
    items(blocks, "nutrition_macros", [
      { label: "پروتئین", value: "142g", percent: "70%" },
      { label: "کربوهیدرات", value: "188g", percent: "55%" },
      { label: "چربی", value: "54g", percent: "35%" },
    ]);
  const barColors = ["bg-[#007BFF]", "bg-sky-400", "bg-amber-400"];

  return (
  <section
  id="features"
  style={regionStyle(sections, "features")}
  className="mx-auto max-w-[1200px] px-5 py-24 lg:px-8"
>
  <FadeInUp className="mb-12">
    <SecHead
      eyebrow={text(blocks, "features_eyebrow", "امکانات فیتو")}
      title={`${text(blocks, "features_title", "یک اکوسیستم کامل،")} ${text(blocks, "features_title_muted", "نه فقط یک برنامه‌ساز تمرین")}`}
      lead={text(
        blocks,
        "features_lead",
        "هر چیزی که برای مربیگری حرفه‌ای لازم دارید، به‌صورت یکپارچه و متصل به هم در اختیار شماست.",
      )}
    />
  </FadeInUp>

  <div className="grid gap-5 md:grid-cols-3">
    {/* 1. مدیریت شاگردان - ۲ ستون */}
    <div
      id="coaches"
      className={`${CARD} md:col-span-2 dark:border dark:border-slate-800 dark:bg-[--surface]`}
    >
      <div className="grid items-center gap-7 md:grid-cols-2">
        <div className="space-y-5">
          <FHead
            icon="users"
            title={text(blocks, "coaches_title", "مدیریت شاگردان")}
            text={text(
              blocks,
              "coaches_lead",
              "همه‌ی شاگردان در یک داشبورد متمرکز؛ وضعیت، اهداف، پرداخت‌ها و میزان پایبندی هر نفر در یک نگاه.",
            )}
          />
          <ul className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {[
              "پروفایل کامل و سوابق هر شاگرد",
              "فیلتر بر اساس هدف و وضعیت",
              "هشدار خودکار برای شاگردان غیرفعال",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#007BFF] dark:bg-blue-500/15 dark:text-blue-400">
                  <Ico n="check" s={11} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/50 dark:bg-blue-500/5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-100 text-[#007BFF] dark:bg-blue-500/15 dark:text-blue-400">
              <Ico n="users" s={17} />
            </span>
            <div>
              <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                تمام شاگردانت، یک‌جا
              </p>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                مدیریت ساده‌تر، پیگیری دقیق‌تر
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                شاگردان من
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                مدیریت و پیگیری عملکرد
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-xl bg-[#007BFF] px-3 py-2 text-[10px] font-bold text-white shadow-lg shadow-blue-500/20">
              <Ico n="plus" s={12} />
              شاگرد جدید
            </span>
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
            <Ico n="search" s={13} />
            جستجوی شاگرد...
            <span className="mr-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] dark:bg-slate-700">
              <Ico n="sliders-horizontal" s={11} />
            </span>
          </div>

          <ul className="space-y-2">
            {students.map((s) => {
              const ok = s.status !== "نیاز به بررسی";
              return (
                <li
                  key={s.name}
                  className="rounded-xl border border-slate-100 bg-white p-3 transition-colors hover:border-blue-200 dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:border-blue-500/40"
                >
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[10px] font-extrabold text-[#007BFF] dark:bg-blue-500/15 dark:text-blue-400">
                      <img src={imgBody} alt="" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                        {s.name}
                      </p>
                      <p className="mt-1 text-[9px] text-slate-400">
                        میزان پیشرفت
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold ${
                        ok
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full ${
                          ok ? "bg-[#007BFF]" : "bg-amber-400"
                        }`}
                        style={{ width: s.percent || "70%" }}
                      />
                    </div>
                    <span className="w-8 text-left text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      {s.percent || "70%"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>

    {/* 2. طراحی برنامه تمرینی - ۱ ستون */}
    <div
      id="workout"
      className={`${CARD} dark:border dark:border-slate-800 dark:bg-[--surface]`}
    >
      <FHead
        icon="dumbbell"
        title="طراحی برنامه تمرینی"
        text={text(
          blocks,
          "workout_lead",
          "برنامه‌های حرفه‌ای را بسازید، شخصی‌سازی کنید و با یک کلیک برای شاگرد ارسال کنید.",
        )}
      />
      <div className="mb-4 flex gap-2">
        {["شنبه", "یکشنبه", "دوشنبه"].map((d, i) => (
          <span
            key={d}
            className={`flex-1 rounded-xl px-2 py-2.5 text-center text-[10px] font-bold transition-colors ${
              i === 0
                ? "bg-[#007BFF] text-white shadow-md shadow-blue-500/20"
                : "border border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            }`}
          >
            {d}
          </span>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <b className="text-xs text-slate-800 dark:text-white">
            برنامه تمرینی
          </b>
          <p className="mt-1 text-[9px] text-slate-400">تمرینات روز شنبه</p>
        </div>
        <span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-bold text-[#007BFF] dark:bg-blue-950/40 dark:text-blue-400">
          {exercises.length} حرکت
        </span>
      </div>
      <div className="space-y-2">
        {exercises.map((e, i) => (
          <div
            key={e.name}
            className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  i === 0
                    ? "bg-blue-100 text-[#007BFF] dark:bg-blue-950/60 dark:text-blue-400"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <img src={imgBody} alt="" />
              </div>
              <div className="min-w-0">
                <b className="block truncate text-xs text-slate-800 dark:text-white">
                  {e.name}
                </b>
                <span className="mt-1 block text-[10px] text-slate-400">
                  {e.sets}
                </span>
              </div>
            </div>
            <Ico
              n="chevron-left"
              s={15}
              className="shrink-0 text-slate-300 transition-colors group-hover:text-[#007BFF]"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/40 py-3 text-[10px] font-bold text-[#007BFF] transition-colors hover:bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40">
        <Ico n="plus" s={15} />
        افزودن تمرین
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-[#0b1530] px-3 py-3 dark:bg-slate-900 dark:ring-1 dark:ring-slate-700">
        <div className="flex items-center gap-2">
          <Ico n="check-circle" s={16} className="text-emerald-400" />
          <span className="text-[10px] font-medium text-slate-200">
            برنامه آماده ارسال است
          </span>
        </div>
        <span className="text-[10px] font-bold text-blue-400">Fito</span>
      </div>
    </div>

    {/* 3. برنامه تغذیه - ۱ ستون */}
    <div
      id="nutrition"
      className={`${CARD} dark:border dark:border-slate-800 dark:bg-[--surface]`}
    >
      <FHead
        icon="apple"
        title="برنامه تغذیه"
        text={text(
          blocks,
          "nutrition_lead",
          "برنامه غذایی شخصی‌سازی‌شده بسازید و کالری و درشت‌مغذی‌های روزانه را دنبال کنید.",
        )}
      />
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/50 p-4 dark:border-slate-800 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-950">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-[#007BFF] dark:bg-blue-950/60 dark:text-blue-400">
              <Ico n="utensils" s={16} />
            </div>
            <div>
              <b className="block text-xs text-slate-800 dark:text-white">
                کالری روزانه
              </b>
              <span className="text-[9px] text-slate-400">
                میزان مصرف امروز
              </span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Ico n="activity" s={11} className="me-1 inline" />
            ۷۷٪ تکمیل
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <Ring v={77} size={88}>
              <div className="text-center">
                <b
                  dir="ltr"
                  className="block text-sm font-black text-slate-800 dark:text-white"
                >
                  {athleteLive?.kcalLabel ||
                    text(blocks, "nutrition_card_value", "1,850")}
                </b>
                <span className="text-[8px] text-slate-400">kcal</span>
              </div>
            </Ring>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            {macros.map((m, i) => {
              const colors = [
                { dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
                { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
                { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
              ][i % 3];
              return (
                <div key={m.label}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                      {m.label}
                    </span>
                    <b className={`text-[10px] ${colors.text}`}>
                      {m.percent}%
                    </b>
                  </div>
                  <Bar w={m.percent} c={barColors[i % 3]} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2.5 dark:bg-emerald-950/20">
        <Ico n="check-circle" s={15} className="shrink-0 text-emerald-500" />
        <span className="text-[10px] leading-5 text-emerald-700 dark:text-emerald-400">
          برنامه غذایی متناسب با اهداف شاگرد تنظیم شده است.
        </span>
      </div>
    </div>

    {/* 4. آنالیز بدن - ۱ ستون */}
    <div className={`${CARD} dark:border dark:border-slate-800 dark:bg-[--surface]`}>
      <FHead
        icon="scan"
        title="آنالیز بدن"
        text="اندازه‌های ترکیب بدنی و پیشرفت ظاهری را با عکس‌های دوره‌ای ثبت و مقایسه کنید."
      />
      <div className="relative grid h-40 place-items-center overflow-hidden rounded-2xl border border-blue-100/70 bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:border-blue-900/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute h-32 w-32 rounded-full bg-blue-200/30 blur-2xl dark:bg-blue-500/10" />
        <img src={ImgAnatomi} alt="آنالیز بدن" className="relative z-10 h-36 drop-shadow-lg" />
        {[[-20, 40], [20, 40], [-10, 112], [10, 112]].map(([dx, dy]) => (
          <i
            key={`${dx}${dy}`}
            className="absolute z-20 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#007BFF] shadow-[0_0_12px_#007BFF] dark:border-slate-900"
            style={{ left: `calc(50% + ${dx}px)`, top: dy }}
          />
        ))}
        <span className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-[#0b1530] shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 dark:text-white">
          <Activity size={13} className="text-[#007BFF]" />
          18.6٪ چربی
        </span>
        <span className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-[#0b1530] shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 dark:text-white">
          <Weight size={13} className="text-emerald-500" />
          78.4 kg
        </span>
        <span className="absolute bottom-3 right-3 z-20 rounded-lg bg-blue-100/80 px-2 py-1 text-[9px] font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
          Body Scan
        </span>
      </div>
    </div>

    {/* 5. گزارش پیشرفت - ۱ ستون */}
    <div className={`${CARD} dark:border dark:border-slate-800 dark:bg-[--surface]`}>
      <FHead
        icon="trend"
        title="گزارش پیشرفت"
        text="نمودارها و آمار تصویری برای پایش دقیق روند رشد هر شاگرد در طول زمان."
      />
      <div className="relative overflow-hidden rounded-2xl border border-blue-100/70 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-4 dark:border-blue-900/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-950">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-[#007BFF] dark:bg-blue-900/50 dark:text-blue-400">
              <TrendingUp size={16} />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              روند تغییرات وزن
            </span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <TrendingUp size={11} className="me-1 inline" />
            روند صعودی
          </span>
        </div>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <b dir="ltr" className="block text-2xl font-black text-slate-900 dark:text-white">
              {athleteLive?.bodyValue || "125 kg"}
            </b>
            <span className="text-[9px] text-slate-400">آخرین اندازه‌گیری</span>
          </div>
          <span className="text-[10px] font-semibold text-[#007BFF]">گزارش هفتگی</span>
        </div>
        <svg viewBox="0 0 200 80" className="w-full overflow-visible">
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007BFF" stopOpacity=".3" />
              <stop offset="100%" stopColor="#007BFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 40, 60].map((y) => (
            <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="currentColor" strokeOpacity=".08" strokeDasharray="3 4" />
          ))}
          <polygon points="0,70 0,60 30,52 60,56 90,40 120,32 150,22 200,6 200,70" fill="url(#progressGradient)" />
          <polyline points="0,60 30,52 60,56 90,40 120,32 150,22 200,6" fill="none" stroke="#007BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="200" cy="6" r="4" fill="#007BFF" stroke="white" strokeWidth="2" />
        </svg>
        <div className="mt-2 flex justify-between text-[9px] font-medium text-slate-400">
          <span>شروع</span>
          <span>هفته دوم</span>
          <span>هفته چهارم</span>
          <span>اکنون</span>
        </div>
      </div>
    </div>

    {/* 6. ارتباط مستقیم - ۱ ستون */}
    <div className={`${CARD} dark:border dark:border-slate-800 dark:bg-[--surface]`}>
      <FHead
        icon="chat"
        title="ارتباط مستقیم"
        text="گفتگوی داخلی بین مربی و شاگرد، بدون نیاز به پیام‌رسان‌های بیرونی."
      />
      <div className="space-y-3">
        {[
          { sender: "coach", name: "مربی", message: "امروز تمرین سینه چطور پیش رفت؟", time: "۱۰:۳۰" },
          { sender: "athlete", name: "شاگرد", message: "عالی بود، فقط ست آخر دمبل کمی سنگین بود.", time: "۱۰:۳۲" },
          { sender: "coach", name: "مربی", message: "دفعه بعد ۲ کیلو کمتر بزن و روی تکنیک تمرکز کن.", time: "۱۰:۳۳" },
          { sender: "athlete", name: "شاگرد", message: "حتماً مربی، ممنون از راهنماییت 🙌", time: "۱۰:۳۴" },
        ].map((item, index) => {
          const isCoach = item.sender === "coach";
          return (
            <div key={index} className={`flex ${isCoach ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2.5 ${
                  isCoach
                    ? "rounded-se-sm bg-blue-50 text-slate-700 dark:bg-blue-950/40 dark:text-slate-200"
                    : "rounded-ss-sm bg-[#007BFF] text-white"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-5">
                  <span className={`text-[9px] font-bold ${isCoach ? "text-[#007BFF] dark:text-blue-400" : "text-blue-100"}`}>
                    {item.name}
                  </span>
                  <span className={`text-[8px] ${isCoach ? "text-slate-400 dark:text-slate-500" : "text-blue-100"}`}>
                    {item.time}
                  </span>
                </div>
                <p className="text-[11px] leading-6">{item.message}</p>
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
          <span className="text-[10px] text-slate-400">پیام خود را بنویسید...</span>
          <Ico n="send" s={15} className="text-[#007BFF]" />
        </div>
      </div>
    </div>

    {/* 7. دستیار هوشمند AI - ۲ ستون */}
    <div
      className="relative isolate overflow-hidden rounded-3xl border border-blue-900/40 bg-gradient-to-br from-[#0b1530] via-[#10234b] to-[#0b2a6b] p-6 text-white shadow-xl shadow-blue-950/10 md:col-span-2"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

      {/* متن سمت راست (1.2fr) و ربات سمت چپ (0.8fr) */}
      <div className="relative grid items-center gap-7 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <FHead
            dark
            icon="bolt"
            title={text(blocks, "ai_name", "دستیار هوشمند AI")}
            text={text(
              blocks,
              "ai_lead",
              "دستیار هوشمند فیتو داده‌های تمرین، تغذیه و آنالیز بدن را تحلیل می‌کند و پیشنهاد عملی برای هر شاگرد می‌دهد.",
            )}
          />
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-blue-300">
                <Ico n="user-round" s={15} />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tr-sm border border-white/10 bg-white/[0.06] p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-300">مربی</span>
                  <span className="text-[9px] text-slate-500">پیام جدید</span>
                </div>
                <p className="text-xs leading-6 text-slate-200">
                  {text(blocks, "ai_user", "⚠ رضا ۳ روز است تمرین ثبت نکرده؛ پیام یادآوری بفرستم؟")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/20 text-blue-300">
                <Ico n="bot" s={16} />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-blue-400/20 bg-blue-500/10 p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-300">فیتو AI</span>
                  <Ico n="sparkles" s={11} className="text-cyan-300" />
                </div>
                <p className="text-xs leading-6 text-slate-200">
                  {text(blocks, "ai_reply", "پیشرفت مریم برای این هفته ۱۵٪ بیشتر از هفته قبل است.")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 transition hover:border-blue-400/40">
              <Ico n="message-circle" s={16} className="text-slate-400" />
              <span className="flex-1 text-xs text-slate-400">
                {text(blocks, "ai_placeholder", "از من هر چیزی بپرس…")}
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#007BFF] text-white shadow-lg shadow-blue-500/20">
                <Ico n="send" s={14} />
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: "activity", label: "تحلیل عملکرد" },
              { icon: "utensils", label: "تحلیل تغذیه" },
              { icon: "brain", label: "پیشنهاد هوشمند" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[9px] font-semibold text-slate-300">
                <Ico n={item.icon} s={12} className="text-blue-300" />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />
          <img
            src={FitoImgCoach}
            alt="دستیار هوشمند فیتو"
            loading="lazy"
            className="relative mx-auto max-w-[250px] drop-shadow-[0_0_20px_rgba(59,130,246,0.35)] [mask-image:radial-gradient(closest-side,#000_80%,transparent)]"
          />
          <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-bold text-emerald-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Fito AI Online
          </span>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}

/* =========================
   Steps / Showcase / Why / Pricing
========================= */

function Steps({ blocks, sections }) {
  const steps = items(blocks, "steps", [
    { title: "پروفایل مربیگری بسازید", text: "اهداف، تخصص‌ها و سوابق‌تان را ثبت کنید تا شاگردان شما را بهتر بشناسند." },
    { title: "شاگردان را اضافه کنید", text: "شاگردانتان را دعوت کنید یا از طریق فیتو شاگرد جدید پیدا کنید." },
    { title: "پیشرفت را پایش کنید", text: "برنامه تمرین و تغذیه بسازید و روند پیشرفت هر نفر را لحظه‌ای دنبال کنید." },
  ]);

  return (
    <section
      id="how"
      style={regionStyle(sections, "how")}
      className="bg-gradient-to-b from-transparent to-blue-50/70 px-5 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <FadeInUp className="mb-12">
          <SecHead
            eyebrow={text(blocks, "steps_eyebrow", "نحوه کار")}
            title={text(blocks, "steps_title", "در سه قدم ساده شروع کنید")}
            lead={text(blocks, "steps_lead", "راه‌اندازی فیتو کمتر از ۱۰ دقیقه زمان می‌برد.")}
          />
        </FadeInUp>
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className={`${CARD} relative overflow-hidden`}>
              <span className="absolute end-4 top-1 text-7xl font-black text-[#007BFF]/[0.06]">{i + 1}</span>
              <span className="relative mb-4 grid h-9 w-9 place-items-center rounded-xl bg-[#007BFF] font-black text-white">{i + 1}</span>
              <h3 className={`relative mb-2 font-extrabold ${INK}`}>{s.title}</h3>
              <p className="relative text-sm leading-7 text-slate-500">{s.text}</p>
              <div className="relative mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                {i === 0 && (
                  <div className="flex justify-between items-center gap-3 w-full">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#007BFF]">
                        <img className="w-full" src={ProfileImg} alt="" />
                      </div>
                      <span className="flex-1 text-xs font-bold text-slate-700">محمد رضایی</span>
                    </div>
                    <span className="rounded-lg bg-green-50 px-2.5 py-1.5 text-[9px] font-bold text-green-600 ">حساب ایجاد شده</span>
                  </div>
                )}
                {i === 1 && (
                  <div className="flex flex-col items-center justify-between gap-2">
                    <div className="flex items-center">
                      {[0, 1, 2].map((k) => (
                        <span key={k} className={`-ms-2 h-7 w-7 overflow-hidden rounded-full ring-2 ring-white first:ms-0 ${["bg-sky-300", "bg-[#007BFF]", "bg-amber-300"][k]}`}>
                          <img className="h-full w-full object-cover" src={ProfileImg} alt="پروفایل شاگرد" />
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="flex items-center gap-0.5 rounded-full bg-transparent w-11 h-11 px-0.5 text-[7px] border border-dashed text-center justify-center font-bold text-white">
                        <Plus size={11} /> افزودن
                      </button>
                      <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[9px] font-bold text-slate-600">
                        <Pencil size={11} /> ویرایش
                      </button>
                    </div>
                  </div>
                )}
                {i === 2 && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-2.5 dark:border-blue-900/50 dark:bg-blue-950/30">
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#007BFF] dark:bg-blue-900/50 dark:text-blue-400"><Target size={15} /></div>
                      <p className="text-lg font-black text-slate-800 dark:text-white">92%</p>
                      <p className="mt-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">پایبندی به برنامه</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"><Dumbbell size={15} /></div>
                      <p className="text-lg font-black text-slate-800 dark:text-white">78%</p>
                      <p className="mt-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">تکمیل تمرین‌ها</p>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50/80 p-2.5 dark:border-violet-900/50 dark:bg-violet-950/30">
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400"><UserPlus size={15} /></div>
                      <p className="text-lg font-black text-slate-800 dark:text-white">+۳</p>
                      <p className="mt-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">شاگرد جدید</p>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Showcase({ blocks, sections }) {
  const [tab, setTab] = useState(1);
  const tabs = items(blocks, "showcase_tabs", [
    { label: "داشبورد شاگرد", image: "dashboard.png" },
    { label: "داشبورد مربی", image: "progress.png" },
    { label: "آنالیز بدن", image: "body-analysis.png" },
  ]);
  const cur = tabs[tab] || tabs[0];
  if (!cur) return null;

  return (
    <section
      id="product"
      style={regionStyle(sections, "showcase")}
      className="px-5 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-[1000px]">
        <FadeInUp>
          <SecHead
            eyebrow={text(blocks, "showcase_eyebrow", "یک پلتفرم")}
            title={text(blocks, "showcase_title", "یک پلتفرم، برای مربی و شاگرد")}
            lead={text(blocks, "showcase_lead", "رابط کاربری دقیق، سریع و زیبا؛ طراحی‌شده برای روزمرگی مربیان حرفه‌ای.")}
          />
        </FadeInUp>

        <div role="tablist" className="mx-auto mb-8 mt-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow ring-1 ring-slate-100">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab === i ? "bg-[#007BFF] text-white" : "text-slate-500 hover:text-[#0b1530]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Window>
            <img key={cur.image} src={imgDash} alt={cur.label} className={`w-full ${cur.image === "dashboard.png" ? "" : "max-h-[800px]"}`} />
          </Window>
          {cur.image !== "body-analysis.png" && (
            <img src="/images/body-analysis.png" alt="" className="absolute -bottom-8 -left-4 hidden w-44 rounded-2xl shadow-2xl ring-1 ring-slate-200 md:block" />
          )}
          <span className="absolute -top-3 left-6 hidden items-center gap-2 rounded-xl bg-[#0b1530] px-3 py-2 text-[11px] font-bold text-white shadow-xl md:flex">
            <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {text(blocks, "showcase_chip", "دستیار AI فعال")}
          </span>
          <div className="absolute -bottom-6 -right-3 hidden items-center gap-3 rounded-2xl bg-white p-3 text-xs shadow-xl ring-1 ring-slate-100 md:flex">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-500">
              <Ico n="activity" s={18} />
            </span>
            <span>
              <b className={`block ${INK}`}>{text(blocks, "showcase_stat", "۲,۱۰۰ کالری")}</b>
              <span className="text-slate-400">{text(blocks, "showcase_stat_sub", "مصرف امروز")}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Why({ blocks, sections }) {
  const list = items(blocks, "why_items", [
    { icon: "activity", title: "صرفه‌جویی در زمان", text: "کارهای تکراری مثل ساخت برنامه و پیگیری پیشرفت را خودکار کنید." },
    { icon: "grid", title: "همه‌چیز در یک‌جا", text: "برنامه، تغذیه، پیام‌ها و گزارش‌ها بدون جابه‌جایی بین ابزارها." },
    { icon: "trend", title: "تصمیم‌گیری مبتنی بر داده", text: "با نمودارها و تحلیل AI بدانید هر شاگرد کجاست و چه چیزی باید تغییر کند." },
    { icon: "star", title: "تجربه‌ای حرفه‌ای‌تر", text: "شاگردانتان اپلیکیشنی مرتب و یکپارچه از مربی‌شان دریافت می‌کنند." },
    { icon: "users", title: "رشد کسب‌وکار مربیگری", text: "شاگردان بیشتری را با همان کیفیت مدیریت کنید." },
  ]);

  return (
  <section
      id="why"
      style={regionStyle(sections, "why")}
      className="px-5 py-24 lg:px-8"
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-2">
        <FadeInUp>
          <Badge>{text(blocks, "why_eyebrow", "چرا فیتو؟")}</Badge>
          <h2
            className={`mt-4 text-3xl font-black leading-[1.5] sm:text-4xl ${INK}`}
          >
            {text(
              blocks,
              "why_title",
              "مربیگری را بزرگ کنید، بدون از دست دادن کنترل",
            )}
          </h2>
          <p className="mt-4 text-sm leading-8 text-slate-500">
            {text(
              blocks,
              "why_lead",
              "فیتو جایگزین فایل‌های اکسل، پیام‌رسان‌ها و یادداشت‌های پراکنده می‌شود.",
            )}
          </p>
          <ul className="mt-8 space-y-5">
            {list.map((w) => (
              <li key={w.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#007BFF]/10 text-[#007BFF]">
                  <Ico n={w.icon} s={20} />
                </span>
                <span>
                  <b className={`block ${INK}`}>{w.title}</b>
                  <span className="text-sm leading-7 text-slate-500">
                    {w.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </FadeInUp>

        <FadeInUp delay={200}>
          <img className="rounded-3xl" src={imgBody} alt="" />
        </FadeInUp>
      </div>
    </section>
  );
}

function Pricing({ blocks, sections, onSelect }) {
  const [yearly, setYearly] = useState(false);
  const plans = items(blocks, "pricing_plans", [
    {
      name: "شروع",
      price: "رایگان",
      desc: "برای مربی‌هایی که تازه شروع کرده‌اند",
      cta: "شروع رایگان",
      features: ["تعداد محدود شاگرد", "طراحی برنامه تمرینی", "برنامه تغذیه پایه", "گزارش پیشرفت ساده"],
    },
    {
      name: "مربی حرفه‌ای",
      price: "[ قیمت ]",
      desc: "برای مربی‌هایی که کسب‌وکارشان در حال رشد است",
      cta: "شروع ۱۴ روز رایگان",
      hot: true,
      features: ["شاگرد نامحدود", "آنالیز بدن با هوش مصنوعی", "دستیار هوشمند AI", "پیام‌رسان داخلی", "گزارش‌های پیشرفته"],
    },
    {
      name: "مربی پیشرفته",
      price: "[ قیمت ]",
      desc: "برای باشگاه‌ها و تیم‌های مربیگری",
      cta: "ارتباط با فروش",
      features: ["همه امکانات حرفه‌ای", "چند مربی در یک حساب", "برند اختصاصی", "پشتیبانی اولویت‌دار"],
    },
  ]);

  return (
    <section
      id="pricing"
      style={regionStyle(sections, "pricing")}
      className="bg-blue-50/70 px-5 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-[1100px]">
        <FadeInUp>
          <SecHead
            eyebrow={text(blocks, "pricing_eyebrow", "تعرفه‌ها")}
            title={text(blocks, "pricing_title", "پلنی متناسب با مسیر مربیگری شما")}
            lead={text(blocks, "pricing_lead", "رایگان شروع کنید و هر زمان که رشد کردید، ارتقا دهید.")}
          />
        </FadeInUp>

        <div className="mx-auto mb-10 mt-8 flex w-fit gap-1 rounded-xl bg-white p-1 text-xs font-bold shadow ring-1 ring-slate-100">
          {[["ماهانه", false], ["سالانه", true]].map(([l, y]) => (
            <button key={l} type="button" onClick={() => setYearly(y)} className={`rounded-lg px-5 py-2 ${yearly === y ? "bg-[#0b1530] text-white" : "text-slate-500"}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-3xl p-7 ${p.hot ? "bg-gradient-to-b from-[#007BFF] to-[#0856cc] text-white shadow-2xl shadow-[#007BFF]/40 md:-mt-4 md:pb-10" : "bg-white ring-1 ring-slate-100"}`}>
              {p.hot && <span className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#007BFF]">پیشنهاد ویژه</span>}
              <h3 className="text-lg font-extrabold">{p.name}</h3>
              <p className={`mt-1 text-sm ${p.hot ? "text-blue-100" : "text-slate-400"}`}>{p.desc}</p>
              <div className="my-6 text-4xl font-black">
                {p.price}
                {p.price !== "رایگان" && (
                  <small className={`ms-2 text-xs font-medium ${p.hot ? "text-blue-100" : "text-slate-400"}`}>تومان / {yearly ? "سال" : "ماه"}</small>
                )}
              </div>
              <button type="button" onClick={onSelect} className={`${BTN} w-full ${p.hot ? "bg-white text-[#007BFF] hover:bg-blue-50" : "bg-white text-[#0b1530] ring-1 ring-slate-200 hover:ring-[#007BFF]"}`}>
                {p.cta}
              </button>
              <ul className="mt-6 space-y-3 text-sm">
                {(p.features || []).map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Ico n="check" s={16} className={p.hot ? "text-sky-200" : "text-[#007BFF]"} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================
   Home
========================= */

function panelsFor(account) {
  const links = [];
  if (account?.profiles?.coach) links.push({ to: "/coach/dashboard", label: "پنل مربی" });
  if (account?.profiles?.athlete) links.push({ to: "/dashboardAthlete", label: "پنل ورزشکار" });
  if (Array.isArray(account?.roles) && account.roles.includes("platform_admin")) {
    links.push({ to: "/admin/plans", label: "پنل مدیر" });
  }
  if (links.length === 1) return [{ ...links[0], label: "ورود به پنل" }];
  return links;
}

export default function Home() {
  const { blocks, sections, loading } = useHomepage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const { status, account, refresh } = useSession();
  const live = useLiveHome(account);
  const athleteLive = live?.athlete ?? null;
  const coachLive = live?.coach ?? null;
  const previewOverrides = athleteLive
    ? {
        preview_initials: athleteLive.initials,
        preview_name: athleteLive.name,
        preview_role: "ورزشکار",
        preview_status: "فعال",
        preview_workout_title: athleteLive.workoutTitle,
        preview_bar: String(athleteLive.percent),
        preview_moves: athleteLive.moves,
        preview_duration: "",
        preview_calories_value: athleteLive.kcal,
        preview_water_value: athleteLive.waterLiters,
        preview_goal_percent: String(athleteLive.percent),
        preview_goal_title: athleteLive.percent >= 100 ? "امروز کامل شد" : "تمرین امروز",
        preview_goal_remain: athleteLive.remain,
        preview_body_value: athleteLive.bodyValue,
        preview_body_delta: athleteLive.bodyDelta,
        preview_chart: athleteLive.chart,
      }
    : null;
  const navigation = items(blocks, "nav_items", [
    { label: "امکانات", target: "features" },
    { label: "نحوه کار", target: "how" },
    { label: "محصول", target: "product" },
    { label: "چرا فیتو؟", target: "why" },
    { label: "تعرفه‌ها", target: "pricing" },
  ]);
  const signedIn = status === "authenticated" && account;
  const panels = panelsFor(account);

  function openPanel(to) {
    setMenuOpen(false);
    navigate(to);
  }
  const accountName = account?.profiles?.coach?.display_name || account?.profiles?.athlete?.display_name || "حساب من";

  const openAuth = (mode) => {
    setMenuOpen(false);
    setAuthMode(mode);
  };

  const logout = async () => {
    setMenuOpen(false);
    try {
      await api("/api/v1/auth/logout", { method: "POST" });
    } finally {
      await refresh().catch(() => {});
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const mainAction = () => signedIn && panels[0] ? openPanel(panels[0].to) : openAuth("signup");
  const mainLabel = (fallback) => signedIn && panels[0] ? panels[0].label : fallback;
  const footerCols = items(blocks, "footer_columns", [
    { title: "محصول", links: ["امکانات", "داشبورد مربی", "اپلیکیشن شاگرد", "تعرفه‌ها"] },
    { title: "منابع", links: ["مرکز آموزش", "وبلاگ", "سوالات متداول", "راهنمای شروع"] },
    { title: "شرکت", links: ["درباره ما", "فرصت‌های شغلی", "قوانین و مقررات", "حریم خصوصی"] },
  ]);

  if (loading) {
    return <div className="min-h-screen bg-white dark:bg-[#0B1120]" />;
  }

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-[#f4f8ff] text-[#0b1530]">
      {/* ================= NAVBAR ================= */}
      <nav style={regionStyle(sections, "nav")} className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
        <div className={`mx-auto max-w-[1200px] rounded-2xl ring-1 ring-slate-100 backdrop-blur-xl transition-all duration-300 ${scrolled ? "bg-white/90 shadow-lg shadow-slate-900/5" : "bg-white/70"}`}>
          <div className="flex h-16 items-center justify-between px-4 lg:px-5">
            <button onClick={() => scrollTo("home")}>
              <FitoLogo name={text(blocks, "logo_name", "FITO")} sub={text(blocks, "logo_sub", "پلتفرم مدیریت مربیگری")} />
            </button>
            <div className="hidden items-center gap-8 md:flex">
              {navigation.map((item) => (
                <button key={item.target} onClick={() => scrollTo(item.target)} className="text-sm font-semibold text-slate-500 transition hover:text-[#007BFF]">
                  {item.label}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {signedIn ? (
                <>
                  <span className="text-sm font-semibold text-slate-600">{accountName}</span>
                  {panels.map((panel, index) => (
                    <button key={panel.to} type="button" onClick={() => openPanel(panel.to)} className={index === 0 ? `${PRIMARY} ${SMALL}` : `${GHOST} ${SMALL}`}>
                      {panel.label}
                    </button>
                  ))}
                  <button type="button" onClick={logout} className="rounded-xl px-4 py-2.5 text-sm text-slate-500 transition hover:text-[#0b1530]">
                    {text(blocks, "logout_label", "خروج")}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => openAuth("login")} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-[#007BFF]">
                    {text(blocks, "login_label", "ورود")}
                  </button>
                  <button type="button" onClick={() => openAuth("signup")} className={`${PRIMARY} ${SMALL}`}>
                    {text(blocks, "signup_label", "شروع رایگان")}
                    <Ico n="arrow" s={16} className="transition-transform group-hover:-translate-x-1" />
                  </button>
                </>
              )}
              <ThemeSwitcher />
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="منو" className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-slate-200 md:hidden">
              <div className="space-y-1.5">
                <span className="block h-px w-5 bg-[#0b1530]" />
                <span className="block h-px w-5 bg-[#0b1530]" />
                <span className="block h-px w-3 bg-[#0b1530]" />
              </div>
            </button>
          </div>

          {menuOpen && (
            <div className="border-t border-slate-100 px-5 py-5 md:hidden">
              <div className="flex flex-col gap-4">
                {navigation.map((item) => (
                  <button key={item.target} onClick={() => scrollTo(item.target)} className="border-b border-slate-100 pb-3 text-right text-sm font-semibold text-slate-600">
                    {item.label}
                  </button>
                ))}
                {signedIn ? (
                  <>
                    {panels.map((panel) => (
                      <button key={panel.to} type="button" onClick={() => openPanel(panel.to)} className={`${PRIMARY} mt-2`}>
                        {panel.label}
                      </button>
                    ))}
                    <button type="button" onClick={logout} className={`${GHOST} mt-2`}>
                      خروج از {accountName}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => openAuth("login")} className={`${GHOST} mt-2`}>
                      {text(blocks, "login_label", "ورود")}
                    </button>
                    <button type="button" onClick={() => openAuth("signup")} className={PRIMARY}>
                      {text(blocks, "signup_label", "شروع رایگان")}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 
        ================= MAIN CONTENT =================
        کلاس flex flex-col را حذف کردم تا ترتیب سکشن‌ها دقیقاً طبق کد HTML باشد
        و ویژگی order که از دیتابیس (regionStyle) می‌آید نتواند چینش را به هم بزند.
      */}
      <main id="home" className="w-full">
        
        {/* 1. HERO */}
        <section style={regionStyle(sections, "hero")} className="relative overflow-hidden bg-gradient-to-b from-[#dbe9ff] via-[#eef4ff] to-[#f4f8ff] px-5 pb-28 pt-36 lg:px-8 lg:pt-40">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,123,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,123,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
          <div className="relative mx-auto max-w-[1200px]">
            <div className="grid items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
              <FadeInUp className="order-2 text-center lg:order-1 lg:text-right">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                  <b className="rounded-full bg-[#007BFF] px-2 py-0.5 text-white">{text(blocks, "hero_badge_tag", "جدید")}</b>
                  {text(blocks, "hero_badge", "دستیار هوشمند AI به فیتو اضافه شد")}
                </div>
                <h1 className="max-w-2xl text-5xl font-black leading-[1.45] tracking-tight sm:text-6xl lg:text-[64px]">
                  {text(blocks, "hero_title", "مدیریت هوشمند مربیگری،")}
                  <br />
                  <span className="text-[#007BFF]">{text(blocks, "hero_accent", "یک قدم جلوتر")}</span>{" "}
                  {text(blocks, "hero_title_tail", "از همیشه")}
                </h1>
                <p className="mt-7 max-w-xl text-base leading-8 text-slate-500">
                  {text(blocks, "hero_lead", "فیتو همه‌ی ابزارهای یک مربی حرفه‌ای را در یک‌جا جمع کرده است؛ از مدیریت شاگردان و طراحی برنامه تمرینی تا برنامه تغذیه، آنالیز بدن و گزارش پیشرفت. کمتر درگیر کارهای تکراری شوید و بیشتر روی نتیجه‌ی شاگردانتان تمرکز کنید.")}
                </p>
                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <button type="button" onClick={mainAction} className={PRIMARY}>
                    {mainLabel(text(blocks, "signup_label", "شروع رایگان"))}
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-white/20">
                      <Ico n="arrow" s={14} className="transition-transform group-hover:-translate-x-1" />
                    </span>
                  </button>
                  <button onClick={() => scrollTo("features")} className={GHOST}>
                    <Ico n="grid" s={16} />
                    {text(blocks, "hero_secondary", "مشاهده امکانات")}
                  </button>
                </div>
                <div className="mt-9 flex items-center justify-center gap-3 lg:justify-start">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#007BFF] text-[11px] font-bold text-white">1k+</span>
                  <div className="text-start text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-bold text-[#0b1530]">
                      4.9 {[0, 1, 2, 3, 4].map((i) => <Ico key={i} n="star" s={12} className="fill-amber-400 text-amber-400" />)}
                    </div>
                    {text(blocks, "hero_note_1", "مورد اعتماد مربیان و باشگاه‌های حرفه‌ای")}
                  </div>
                </div>
              </FadeInUp>
              <FadeInUp delay={250} className="order-1 lg:order-2">
                <HeroVisual blocks={blocks} overrides={previewOverrides} />
              </FadeInUp>
            </div>
          </div>
        </section>

        {/* 2. STATS */}
        <section style={regionStyle(sections, "stats")} className="relative z-10 -mt-12 px-5 lg:px-8">
          <div className={`${CARD} mx-auto grid max-w-[1100px] grid-cols-2 !p-2 lg:grid-cols-4 lg:divide-x lg:divide-x-reverse lg:divide-slate-100`}>
            {items(blocks, "stats", [
              { number: "1,200+", label: "مربی فعال" },
              { number: "35,000+", label: "شاگرد مدیریت‌شده" },
              { number: "12 ساعت", label: "صرفه‌جویی هفتگی هر مربی" },
              { number: "98%", label: "رضایت مربیان" },
            ]).map((item, index) => (
              <FadeInUp key={item.label} delay={index * 100} className="px-5 py-7 text-center">
                <div dir="ltr" className={`text-3xl font-black ${index === 2 ? "text-[#007BFF]" : ""}`}>{item.number}</div>
                <div className="mt-2 text-xs text-slate-400">{item.label}</div>
              </FadeInUp>
            ))}
          </div>
        </section>

        {/* 3. FEATURES */}
        <Features blocks={blocks} sections={sections} athleteLive={athleteLive} coachLive={coachLive} />

        {/* 4. STEPS */}
        <Steps blocks={blocks} sections={sections} />

        {/* 5. SHOWCASE */}
        <Showcase blocks={blocks} sections={sections} />

        {/* 6. WHY */}
        <Why blocks={blocks} sections={sections} />

        {/* 7. PRICING */}
        <Pricing blocks={blocks} sections={sections} onSelect={mainAction} />

        {/* 8. FINAL CTA */}
        <section style={regionStyle(sections, "cta")} className="px-5 py-24 lg:px-8">
          <FadeInUp>
            <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[36px] bg-gradient-to-br from-[#007BFF] to-[#0856cc] px-6 py-16 text-center text-white">
              <span className="absolute -bottom-24 -start-16 h-64 w-64 rounded-full border-[28px] border-white/10" />
              <span className="absolute -end-10 -top-16 h-52 w-52 rounded-full border-[24px] border-white/10" />
              <div className="relative">
                <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold">
                  {text(blocks, "cta_eyebrow", "راه‌اندازی در کمتر از ۱۰ دقیقه")}
                </span>
                <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-black leading-[1.5] sm:text-5xl">
                  {text(blocks, "cta_title", "مربیگری حرفه‌ای، با ابزارهای حرفه‌ای شروع می‌شود.")}
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-sm leading-8 text-blue-100">
                  {text(blocks, "cta_lead", "همین امروز به جمع مربیانی بپیوندید که با فیتو هوشمندتر کار می‌کنند و نتایج بهتری می‌گیرند.")}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={mainAction} className={`${BTN} bg-white text-[#007BFF] hover:bg-blue-50`}>
                    {mainLabel(text(blocks, "cta_button", "همین حالا به فیتو بپیوند"))}
                  </button>
                  <button type="button" onClick={() => scrollTo("product")} className={`${BTN} text-white ring-1 ring-white/30 hover:bg-white/10`}>
                    {text(blocks, "cta_secondary", "مشاهده دمو")}
                  </button>
                </div>
              </div>
            </div>
          </FadeInUp>
        </section>

        {/* 9. CUSTOM SECTIONS */}
        {customSections(sections).map((section) => (
          <div key={section.key} className="w-full">
            <CustomSection section={section} onAction={mainAction} />
          </div>
        ))}

      </main>

      {authMode && (
        <AuthDialog
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onAuthenticated={(nextAccount) => {
            const next = panelsFor(nextAccount);
            if (next.length === 1) navigate(next[0].to);
          }}
        />
      )}

      {/* ================= FOOTER ================= */}
      <footer style={regionStyle(sections, "footer")} className="bg-gradient-to-b from-[#0b1530] to-[#07101f] px-5 pt-16 text-slate-300 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)_1.3fr]">
          <div>
            <FitoLogo light name={text(blocks, "logo_name", "FITO")} />
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {text(blocks, "footer_about", "فیتو، پلتفرم جامع مدیریت مربیگری برای مربیان حرفه‌ای و شاگردانشان؛ از برنامه تمرینی و تغذیه تا آنالیز بدن و دستیار هوشمند.")}
            </p>
            <div className="mt-5 flex gap-2">
              {["IG", "TG", "IN", "X"].map((s) => (
                <span key={s} className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[10px] font-bold">{s}</span>
              ))}
            </div>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <b className="mb-4 block text-white">{col.title}</b>
              <ul className="space-y-2.5 text-sm">
                {(col.links || []).map((l) => (
                  <li key={l}>
                    <button type="button" className="transition hover:text-white">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="text-sm">
            <b className="mb-4 block text-white">{text(blocks, "footer_contact_title", "ارتباط با ما")}</b>
            {[
              ["mail", text(blocks, "footer_email", "hello@fito.ir")],
              ["phone", text(blocks, "footer_phone", "021 - XXXX XXXX")],
              ["pin", text(blocks, "footer_address", "تهران، ایران")],
            ].map(([i, t]) => (
              <p key={i} className="mb-2.5 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
                  <Ico n={i} s={15} />
                </span>
                <span dir={i === "pin" ? "rtl" : "ltr"}>{t}</span>
              </p>
            ))}
            <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="ایمیل برای خبرنامه" aria-label="ایمیل" className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs placeholder:text-slate-500 focus:outline focus:outline-[#007BFF]" />
              <button className="rounded-lg bg-[#007BFF] px-3 py-2 text-xs font-bold text-white">عضویت</button>
            </form>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-[1200px] border-t border-white/10 py-6 text-center text-[11px] text-slate-500">
          {text(blocks, "footer_copyright", "© 2026 Fito. All rights reserved.")}
        </p>
      </footer>
    </div>
  );
}