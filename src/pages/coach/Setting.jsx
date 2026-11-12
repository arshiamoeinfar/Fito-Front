import { useEffect, useState } from "react";
import {
  User,
  BadgeCheck,
  Users,
  Bell,
  Dumbbell,
  Bot,
  ShieldCheck,
  Save,
  LockKeyhole,
  MessageCircle,
  Utensils,
  Mail,
  Smartphone,
  Camera,
  ChevronLeft,
} from "lucide-react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import AccountSecurity from "../../Components/shared/AccountSecurity";
import { useSession } from "../../api/session";
import { api } from "../../api/client";

const FEATURE_LABELS = {
  workout_programs: "برنامه تمرین",
  nutrition_programs: "تغذیه",
  body_analysis: "آنالیز بدن",
  ai_coach_assistant: "دستیار مربی",
  ai_athlete_access: "دستیار ورزشکار",
  progress_reports: "گزارش پیشرفت",
};

const settingsItems = [
  { id: "account", title: "حساب کاربری", icon: User },
  { id: "profile", title: "پروفایل مربی", icon: BadgeCheck },
  { id: "students", title: "شاگردان", icon: Users },
  { id: "notifications", title: "اعلان‌ها", icon: Bell },
  { id: "programs", title: "برنامه‌ها", icon: Dumbbell },
  { id: "ai", title: "هوش مصنوعی", icon: Bot },
  { id: "security", title: "امنیت", icon: ShieldCheck },
];

function when(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

function fa(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-200 ${checked ? "bg-[#007BFF]" : "bg-[#DCE2E9]"}`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? "right-1" : "right-6"}`} />
    </button>
  );
}

function SettingRow({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-[#F0F2F5] py-5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F8FF] text-[#007BFF]">
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h4 className="text-[12px] font-semibold text-[#454C55]">{title}</h4>
          <p className="mt-1 text-[10px] leading-5 text-[#9AA1AA]">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", readOnly = false }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-medium text-[#68717D]">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[#E7EBF0] bg-[#FCFDFE] px-4 text-[12px] text-[#454C55] outline-none transition-all placeholder:text-[#B2B8C0] focus:border-[#8CC3FF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/5"
      />
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="font-primary text-[18px] text-[#6B6F77]">{title}</h2>
      <p className="mt-1 text-[10px] text-[#9AA1AA]">{description}</p>
    </div>
  );
}

export default function Setting() {
  const { account } = useSession();
  const coach = account?.profiles?.coach;
  const [section, setSection] = useState("account");
  const [access, setAccess] = useState(null);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [showDevices, setShowDevices] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ title: "", experience: "", bio: "" });
  const [settings, setSettings] = useState({
    autoAccept: false,
    studentMessages: true,
    onlineStatus: true,
    newMessage: true,
    workout: true,
    expiredProgram: true,
    emailNotification: false,
    autoSaveWorkout: true,
    nutritionValues: true,
    confirmBeforePublish: true,
    aiEnabled: false,
    useStudentData: false,
    aiWorkout: false,
    aiNutrition: false,
    aiApproval: true,
  });

  useEffect(() => {
    let active = true;
    api("/api/v1/coach/access").then((body) => {
      if (!active) return;
      setAccess(body);
      const features = Array.isArray(body?.features) ? body.features : [];
      const has = (key) => features.includes(key);
      setSettings((current) => ({
        ...current,
        aiEnabled: has("ai_coach_assistant"),
        useStudentData: has("ai_athlete_access"),
        aiWorkout: has("workout_programs"),
        aiNutrition: has("nutrition_programs"),
      }));
    }, (caught) => {
      if (active) setError(caught.message || "دوره خوانده نشد.");
    });
    api("/api/v1/coach/relationships").then((body) => {
      if (active) setStudents(Array.isArray(body?.relationships) ? body.relationships : []);
    }, () => {
      if (active) setStudents([]);
    });
    api("/api/v1/me/devices").then((body) => {
      if (active) setDevices(body.devices ?? []);
    }, () => {
      if (active) setDevices([]);
    });
    return () => {
      active = false;
    };
  }, []);

  async function removeDevice(id) {
    setError("");
    try {
      const body = await api(`/api/v1/me/devices/${id}`, { method: "DELETE" });
      setDevices(body.devices ?? []);
    } catch (caught) {
      setError(caught.message || "خروج از دستگاه انجام نشد.");
    }
  }

  const period = access?.access;
  const features = Array.isArray(access?.features) ? access.features : [];
  const activeStudents = students.filter((item) => item.status === "active").length;
  const capacity = Number(period?.athlete_capacity);
  const percent = Number.isFinite(capacity) && capacity > 0 ? Math.min(100, Math.round((activeStudents / capacity) * 100)) : 0;
  const displayName = coach?.display_name || "";
  const phone = account?.phone || "";

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3" dir="rtl">
          <HeaderDashBoard title="تنظیمات" description="حساب کاربری و تنظیمات پنل مربی را مدیریت کنید" />
          {error ? <p className="mt-4 rounded-3xl bg-red-50 px-6 py-4 text-sm text-red-700">{error}</p> : null}
          <div className="mb-5 mt-4 overflow-x-auto rounded-3xl bg-white p-2">
            <div className="flex min-w-max items-center gap-1">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`relative flex cursor-pointer items-center gap-2 rounded-[15px] px-5 py-3.5 text-[13px] font-medium transition-all ${active ? "bg-[#EEF6FF] text-[#007BFF]" : "text-[#7D858F] hover:bg-[#F8FAFC] hover:text-[#007BFF]"}`}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    {item.title}
                    {active ? <span className="absolute bottom-0 left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-[#007BFF]" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <section className="rounded-3xl bg-white p-5 sm:p-7">
            {section === "account" ? (
              <>
                <SectionHeader title="حساب کاربری" description="اطلاعات حساب و روش‌های ارتباطی خود را مدیریت کنید." />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <InputField label="نام و نام خانوادگی" value={displayName} readOnly />
                  <InputField label="ایمیل" value="" placeholder="ثبت نشده" readOnly />
                  <InputField label="شماره موبایل" value={phone} readOnly />
                  <InputField label="نام کاربری" value="" placeholder="ثبت نشده" readOnly />
                </div>
                <div className="mt-6 rounded-2xl border border-[#E7EBF0] bg-[#F7FAFD] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F8FF] text-[#007BFF]">
                        <LockKeyhole size={18} />
                      </div>
                      <div>
                        <h3 className="text-[12px] font-semibold text-[#454C55]">رمز عبور</h3>
                        <p className="mt-1 text-[10px] text-[#9AA1AA]">رمز عبور حساب خود را تغییر دهید.</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="rounded-xl border border-[#E7EBF0] bg-white px-4 py-2.5 text-[10px] font-medium text-[#007BFF]">
                      تغییر رمز عبور
                    </button>
                  </div>
                  {showPassword ? <div className="mt-5"><AccountSecurity profile="coach" hideFacts /></div> : null}
                </div>
              </>
            ) : null}

            {section === "profile" ? (
              <>
                <SectionHeader title="پروفایل مربی" description="اطلاعاتی که شاگردان در پروفایل مربی مشاهده می‌کنند." />
                <div className="mb-7 flex items-center gap-5">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#EAF4FF] text-[#007BFF] shadow-sm">
                      <User size={30} strokeWidth={1.5} />
                    </div>
                    <span className="absolute bottom-0 left-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#007BFF] text-white shadow-sm">
                      <Camera size={13} />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#343A40]">{displayName || "نام مربی"}</h3>
                    <p className="mt-1 text-[10px] text-[#9AA1AA]">تصویر پروفایل مربی</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <InputField label="عنوان تخصصی" value={profileForm.title} placeholder="مثلاً مربی بدنسازی" onChange={(value) => setProfileForm((current) => ({ ...current, title: value }))} />
                  <InputField label="سابقه مربیگری" value={profileForm.experience} placeholder="مثلاً ۵ سال" onChange={(value) => setProfileForm((current) => ({ ...current, experience: value }))} />
                </div>
                <div className="mt-5">
                  <label className="mb-2 block text-[11px] font-medium text-[#68717D]">درباره من</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                    rows={4}
                    placeholder="توضیح کوتاهی درباره خودتان و تخصصتان..."
                    className="w-full resize-none rounded-xl border border-[#E7EBF0] bg-[#FCFDFE] px-4 py-3 text-[11px] leading-6 text-[#454C55] outline-none placeholder:text-[#B2B8C0] focus:border-[#8CC3FF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/5"
                  />
                </div>
              </>
            ) : null}

            {section === "students" ? (
              <>
                <SectionHeader title="مدیریت شاگردان" description="نحوه مدیریت و ارتباط با شاگردان را تنظیم کنید." />
                <div className="rounded-2xl border border-[#E8EDF3] bg-white px-5">
                  <SettingRow icon={Users} title="تأیید خودکار درخواست شاگرد" description="درخواست‌های عضویت شاگردان به صورت خودکار تأیید شوند." checked={settings.autoAccept} onChange={(value) => setSettings((current) => ({ ...current, autoAccept: value }))} />
                  <SettingRow icon={MessageCircle} title="اجازه ارسال پیام" description="شاگردان بتوانند مستقیماً برای شما پیام ارسال کنند." checked={settings.studentMessages} onChange={(value) => setSettings((current) => ({ ...current, studentMessages: value }))} />
                  <SettingRow icon={Users} title="نمایش وضعیت آنلاین" description="وضعیت آنلاین بودن شما برای شاگردان نمایش داده شود." checked={settings.onlineStatus} onChange={(value) => setSettings((current) => ({ ...current, onlineStatus: value }))} />
                </div>
                <div className="mt-5 rounded-2xl bg-[#F7FAFD] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-[#9AA1AA]">تعداد شاگردان</span>
                      <div className="mt-1 text-[20px] font-bold text-[#343A40]">
                        {fa(activeStudents)}
                        <span className="mx-1 text-[12px] font-normal text-[#A5ABB3]">/</span>
                        <span className="text-[13px] font-medium text-[#007BFF]">{Number.isFinite(capacity) ? fa(capacity) : "—"}</span>
                      </div>
                      <p className="mt-2 text-[10px] text-[#9AA1AA]">
                        {period?.status === "active" ? `شروع ${when(period.starts_at)} · پایان ${when(period.ends_at)}` : "دوره فعالی نیست."}
                      </p>
                    </div>
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-[#E7EEF5]">
                      <div className="h-full rounded-full bg-[#007BFF]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {section === "notifications" ? (
              <>
                <SectionHeader title="اعلان‌ها" description="اعلان‌هایی که می‌خواهید از Fito دریافت کنید." />
                <div className="rounded-2xl border border-[#E8EDF3] bg-white px-5">
                  <SettingRow icon={MessageCircle} title="پیام جدید شاگرد" description="هنگام دریافت پیام جدید از شاگرد اطلاع داده شود." checked={settings.newMessage} onChange={(value) => setSettings((current) => ({ ...current, newMessage: value }))} />
                  <SettingRow icon={Dumbbell} title="ثبت تمرین جدید" description="وقتی شاگرد یک جلسه تمرینی را ثبت می‌کند." checked={settings.workout} onChange={(value) => setSettings((current) => ({ ...current, workout: value }))} />
                  <SettingRow icon={Bell} title="منقضی شدن برنامه" description="قبل از پایان برنامه شاگرد اطلاع داده شود." checked={settings.expiredProgram} onChange={(value) => setSettings((current) => ({ ...current, expiredProgram: value }))} />
                  <SettingRow icon={Mail} title="اعلان ایمیلی" description="اعلان‌های مهم از طریق ایمیل ارسال شوند." checked={settings.emailNotification} onChange={(value) => setSettings((current) => ({ ...current, emailNotification: value }))} />
                </div>
              </>
            ) : null}

            {section === "programs" ? (
              <>
                <SectionHeader title="برنامه‌ها" description="تنظیمات پیش‌فرض ساخت برنامه‌های تمرینی و تغذیه." />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#E8EDF3] bg-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#007BFF]"><Dumbbell size={18} /></div>
                      <div>
                        <h3 className="text-[12px] font-bold text-[#454C55]">تمرین</h3>
                        <p className="mt-1 text-[9px] text-[#A0A6AE]">تنظیمات Workout Builder</p>
                      </div>
                    </div>
                    <SettingRow icon={Dumbbell} title="ذخیره خودکار برنامه" description="برنامه هنگام ساخت به صورت خودکار ذخیره شود." checked={settings.autoSaveWorkout} onChange={(value) => setSettings((current) => ({ ...current, autoSaveWorkout: value }))} />
                  </div>
                  <div className="rounded-2xl border border-[#E8EDF3] bg-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFFBEA] text-[#68B43F]"><Utensils size={18} /></div>
                      <div>
                        <h3 className="text-[12px] font-bold text-[#454C55]">تغذیه</h3>
                        <p className="mt-1 text-[9px] text-[#A0A6AE]">تنظیمات برنامه غذایی</p>
                      </div>
                    </div>
                    <SettingRow icon={Utensils} title="نمایش ارزش غذایی" description="پروتئین، کربوهیدرات و چربی نمایش داده شود." checked={settings.nutritionValues} onChange={(value) => setSettings((current) => ({ ...current, nutritionValues: value }))} />
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-[#E8EDF3] bg-white px-5">
                  <SettingRow icon={ShieldCheck} title="تأیید قبل از انتشار" description="قبل از ارسال برنامه برای شاگرد، تأیید مربی درخواست شود." checked={settings.confirmBeforePublish} onChange={(value) => setSettings((current) => ({ ...current, confirmBeforePublish: value }))} />
                </div>
              </>
            ) : null}

            {section === "ai" ? (
              <>
                <SectionHeader title="هوش مصنوعی" description="نحوه استفاده Fito AI از اطلاعات و داده‌های شاگردان." />
                <div className="mb-5 rounded-2xl border border-[#DCEBFF] bg-[#F5FAFF] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#007BFF] text-white"><Bot size={21} /></div>
                      <div>
                        <h3 className="text-[13px] font-bold text-[#343A40]">Fito AI</h3>
                        <p className="mt-1 text-[9px] text-[#7E8995]">دستیار هوشمند برای تحلیل و پیشنهاد برنامه</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#6B6F77]">سهمیه دستیار: {period?.ai_request_quota == null ? "—" : fa(period.ai_request_quota)}</p>
                  </div>
                  {features.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {features.map((feature) => (
                        <span key={feature} className="rounded-full bg-white px-3 py-1 text-[10px] text-[#4B5563]">{FEATURE_LABELS[feature] || feature}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-[#E8EDF3] bg-white px-5">
                  <SettingRow icon={Bot} title="فعال بودن دستیار AI" description="دستیار هوشمند در پنل مربی فعال باشد." checked={settings.aiEnabled} onChange={(value) => setSettings((current) => ({ ...current, aiEnabled: value }))} />
                  <SettingRow icon={Users} title="استفاده از اطلاعات شاگرد" description="AI بتواند از اطلاعات و تحلیل‌های شاگرد استفاده کند." checked={settings.useStudentData} onChange={(value) => setSettings((current) => ({ ...current, useStudentData: value }))} />
                  <SettingRow icon={Dumbbell} title="پیشنهاد برنامه تمرینی" description="AI بتواند برای ساخت برنامه تمرینی پیشنهاد ارائه دهد." checked={settings.aiWorkout} onChange={(value) => setSettings((current) => ({ ...current, aiWorkout: value }))} />
                  <SettingRow icon={Utensils} title="پیشنهاد برنامه تغذیه" description="AI بتواند برای برنامه غذایی پیشنهاد ارائه دهد." checked={settings.aiNutrition} onChange={(value) => setSettings((current) => ({ ...current, aiNutrition: value }))} />
                  <SettingRow icon={ShieldCheck} title="تأیید مربی قبل از ارسال" description="پیشنهادهای AI قبل از ارسال برای شاگرد نیاز به تأیید شما داشته باشند." checked={settings.aiApproval} onChange={(value) => setSettings((current) => ({ ...current, aiApproval: value }))} />
                </div>
              </>
            ) : null}

            {section === "security" ? (
              <>
                <SectionHeader title="امنیت" description="امنیت حساب و دسترسی‌های فعال خود را مدیریت کنید." />
                <div className="rounded-2xl border border-[#E8EDF3] bg-white px-5">
                  <div className="flex items-center justify-between gap-5 border-b border-[#F0F2F5] py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#007BFF]"><ShieldCheck size={18} /></div>
                      <div>
                        <h4 className="text-[12px] font-semibold text-[#454C55]">ورود دو مرحله‌ای</h4>
                        <p className="mt-1 text-[10px] text-[#9AA1AA]">یک لایه امنیتی بیشتر برای حساب شما.</p>
                      </div>
                    </div>
                    <span className="rounded-xl bg-[#EEF6FF] px-4 py-2.5 text-[10px] font-medium text-[#007BFF]">فعال نیست</span>
                  </div>
                  <div className="flex items-center justify-between gap-5 border-b border-[#F0F2F5] py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F6F8] text-[#737B85]"><Smartphone size={18} /></div>
                      <div>
                        <h4 className="text-[12px] font-semibold text-[#454C55]">دستگاه‌های فعال</h4>
                        <p className="mt-1 text-[10px] text-[#9AA1AA]">مدیریت دستگاه‌هایی که به حساب شما وارد شده‌اند.</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowDevices((current) => !current)} className="flex items-center gap-1 text-[10px] font-medium text-[#007BFF]">
                      مشاهده
                      <ChevronLeft size={13} />
                    </button>
                  </div>
                  {showDevices ? (
                    <ul className="space-y-2 border-b border-[#F0F2F5] py-4">
                      {devices.length === 0 ? <li className="text-[12px] text-[#A0A4AA]">نشستی ثبت نشده است.</li> : null}
                      {devices.map((device) => (
                        <li key={device.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7FAFD] px-4 py-3">
                          <div>
                            <p className="text-[12px] text-[#454C55]">{device.title || "دستگاه"}{device.current ? " · همین نشست" : ""}</p>
                            <p className="mt-1 text-[10px] text-[#9AA1AA]">{device.browser || "—"} · {device.current ? "در حال استفاده" : when(device.last_active)}</p>
                          </div>
                          {device.current ? null : (
                            <button type="button" onClick={() => removeDevice(device.id)} className="text-[10px] text-[#D95353]">خروج</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex items-center justify-between gap-5 py-5">
                    <div>
                      <h4 className="text-[12px] font-semibold text-[#454C55]">نشست‌های فعال</h4>
                      <p className="mt-1 text-[10px] text-[#9AA1AA]">مدیریت دسترسی دستگاه‌های متصل به حساب</p>
                    </div>
                    <button type="button" onClick={() => setShowDevices(true)} className="rounded-xl border border-[#F0D4D4] bg-white px-4 py-2.5 text-[10px] font-medium text-[#D95353]">
                      خروج از همه
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t border-[#F0F2F5] pt-6 sm:flex-row">
              <p className="text-[12px] text-[#d30000]">تغییرات شما تا زمان ذخیره شدن اعمال نمی‌شوند.</p>
              <button type="button" className="flex items-center gap-2 rounded-xl bg-[#007BFF] px-6 py-3 text-[12px] font-medium text-white shadow-[0_5px_15px_rgba(0,123,255,0.18)]">
                <Save size={15} strokeWidth={1.8} />
                ذخیره تغییرات
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
