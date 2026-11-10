import { useEffect, useState } from "react";
import { useSession } from "../../../api/session";
import { useTheme } from "../../../context/ThemeContext.jsx";
import { api } from "../../../api/client";
import AccountSecurity from "../../shared/AccountSecurity";
import {
  User,
  CreditCard,
  Bell,
  ShieldCheck,
  Settings,
  Check,
  Crown,
  Dumbbell,
  Target,
  Activity,
  Mail,
  LockKeyhole,
  Smartphone,
  Monitor,
  LogOut,
  Eye,
  Moon,
  Sun,
  Globe,
  Save,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";

/* =========================================================
   TABS
========================================================= */

const tabs = [
  {
    id: "profile",
    title: "پروفایل من",
    icon: User,
  },
  {
    id: "subscription",
    title: "پلن اشتراک",
    icon: CreditCard,
  },
  {
    id: "notifications",
    title: "اعلانات",
    icon: Bell,
  },
  {
    id: "privacy",
    title: "حریم خصوصی",
    icon: ShieldCheck,
  },
  {
    id: "settings",
    title: "تنظیمات",
    icon: Settings,
  },
];

/* =========================================================
   TOGGLE
========================================================= */

const PREFERENCE_DEFAULTS = {
  workout: true,
  nutrition: true,
  coach: true,
  progress: true,
  messages: true,
  reminders: false,
  marketing: false,
  auto_play_videos: true,
  workout_reminders: true,
  nutrition_reminders: true,
  show_online_status: true,
  language: "fa",
};

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function when(value) {
  if (!value) return "زمانی ثبت نشده";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "زمانی ثبت نشده";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 ${
        enabled ? "bg-[#007BFF]" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
          enabled ? "right-1" : "right-6"
        }`}
      />
    </button>
  );
}

/* =========================================================
   SETTING ROW
========================================================= */

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-blue-100 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF]">
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <h4 className="font-semibold text-[#1F2937]">
            {title}
          </h4>

          {description && (
            <p className="mt-1 text-sm leading-6 text-[#8A919B]">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF]">
        <Icon size={20} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#1F2937]">
          {title}
        </h2>

        <p className="mt-1 text-sm text-[#8A919B]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#4B5563]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition placeholder:text-gray-300 focus:border-[#007BFF] focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

/* =========================================================
   DEVICE CARD
========================================================= */

function DeviceCard({
  icon: Icon,
  title,
  browser,
  location,
  lastActive,
  current,
  onLogout,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition hover:border-blue-100 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-[#4B5563]">
          <Icon size={22} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-[#1F2937]">
              {title}
            </h4>

            {current && (
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-600">
                دستگاه فعلی
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#8A919B]">
            <span>{browser}</span>
            <span>•</span>
            <span>{location}</span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-[#9CA3AF]">
            <span
              className={`h-2 w-2 rounded-full ${
                current ? "bg-green-500" : "bg-gray-300"
              }`}
            />

            {lastActive}
          </div>
        </div>
      </div>

      {!current && (
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-500 transition hover:bg-red-100"
        >
          <LogOut size={16} />
          خروج از دستگاه
        </button>
      )}
    </div>
  );
}

/* =========================================================
   SUBSCRIPTION CARD
========================================================= */

function SubscriptionCard({
  name,
  price,
  period,
  description,
  features,
  active,
  popular,
  onSelect,
}) {
  return (
    <div
      className={`relative flex flex-col rounded-[24px] border p-6 transition-all duration-300 ${
        active
          ? "border-[#007BFF] bg-blue-50/40 shadow-lg shadow-blue-100"
          : "border-gray-100 bg-white hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-gray-100"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 right-6 rounded-full bg-[#007BFF] px-4 py-1.5 text-[11px] font-bold text-white shadow-md shadow-blue-100">
          محبوب‌ترین پلن
        </div>
      )}

      {active && (
        <div className="absolute left-5 top-5 flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-medium text-green-600">
          <CheckCircle2 size={13} />
          پلن فعلی
        </div>
      )}

      <div className="mb-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF]">
          <Crown size={22} />
        </div>

        <h3 className="text-xl font-bold text-[#1F2937]">
          {name}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#8A919B]">
          {description}
        </p>
      </div>

      <div className="mb-6">
        <span className="text-3xl font-bold text-[#1F2937]">
          {price}
        </span>

        <span className="mr-1 text-sm text-[#8A919B]">
          {period}
        </span>
      </div>

      <div className="mb-7 space-y-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm text-[#5F6B7A]"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Check size={12} />
            </span>

            {feature}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSelect}
        disabled={active}
        className={`mt-auto flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
          active
            ? "cursor-default bg-green-50 text-green-600"
            : "bg-[#007BFF] text-white hover:bg-blue-600"
        }`}
      >
        {active ? (
          <>
            <Check size={17} />
            پلن فعلی شما
          </>
        ) : (
          <>
            انتخاب پلن
            <ChevronLeft size={17} />
          </>
        )}
      </button>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function AthleteSettings() {
  const { account, refresh } = useSession();
  const athlete = account?.profiles?.athlete;
  const [activeTab, setActiveTab] = useState(account?.password_is_initial ? "privacy" : "profile");
  const [displayName, setDisplayName] = useState(athlete?.display_name || "");
  const [city, setCity] = useState(athlete?.city || "");
  const [goal, setGoal] = useState(athlete?.goal || "");
  const [bloodGroup, setBloodGroup] = useState(athlete?.blood_group || "");
  const [relationships, setRelationships] = useState([]);
  const [weight, setWeight] = useState(null);
  const [trainingDays, setTrainingDays] = useState(0);
  const [hasMeals, setHasMeals] = useState(false);
  const [notices, setNotices] = useState([]);
  const [devices, setDevices] = useState([]);
  const [notifications, setNotifications] = useState(PREFERENCE_DEFAULTS);
  const { theme, setTheme } = useTheme();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!athlete) return;
    setDisplayName(athlete.display_name || "");
    setCity(athlete.city || "");
    setGoal(athlete.goal || "");
    setBloodGroup(athlete.blood_group || "");
    setNotifications({ ...PREFERENCE_DEFAULTS, ...(athlete.preferences || {}) });
  }, [athlete]);

  useEffect(() => {
    api("/api/v1/athlete/relationships").then(
      (body) => setRelationships(body.relationships ?? []),
      () => setRelationships([]),
    );
    api("/api/v1/athlete/body-observations").then(
      (body) => {
        const latest = (body.observations ?? []).find((item) => item.metrics?.weight_kg != null);
        setWeight(latest?.metrics?.weight_kg ?? null);
      },
      () => setWeight(null),
    );
    api("/api/v1/athlete/workout-assignments").then(
      (body) => {
        const titles = new Set();
        (body.assignments ?? []).forEach((assignment) => {
          (assignment.version?.days ?? []).forEach((day) => {
            if ((day.exercises ?? []).length) titles.add(day.title || day.id);
          });
        });
        setTrainingDays(titles.size);
      },
      () => setTrainingDays(0),
    );
    api("/api/v1/athlete/meal-assignments").then(
      (body) => setHasMeals((body.assignments ?? []).length > 0),
      () => setHasMeals(false),
    );
    api("/api/v1/notifications").then(
      (body) => setNotices(body.notifications ?? []),
      () => setNotices([]),
    );
    api("/api/v1/me/devices").then(
      (body) => setDevices(body.devices ?? []),
      () => setDevices([]),
    );
  }, []);

  function chooseTheme(next) {
    setTheme(next);
  }

  async function save() {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await api("/api/v1/athlete/profile", {
        method: "PATCH",
        body: {
          display_name: displayName,
          city: city || null,
          goal: goal || null,
          blood_group: bloodGroup || null,
          preferences: notifications,
        },
      });
      await refresh();
      setNotice("ذخیره شد.");
    } catch (caught) {
      setError(caught.message || "ذخیره نشد.");
    } finally {
      setPending(false);
    }
  }

  async function removeDevice(id) {
    setError("");
    try {
      const body = await api(`/api/v1/me/devices/${id}`, { method: "DELETE" });
      setDevices(body.devices ?? []);
    } catch (caught) {
      setError(caught.message || "خروج از دستگاه انجام نشد.");
    }
  }

  /* =========================================================
     PROFILE
  ========================================================= */

  const renderProfile = () => {
    return (
      <>
        <SectionHeader
          icon={User}
          title="پروفایل من"
          description="اطلاعات شخصی و ورزشی خود را مدیریت کنید."
        />

        {/* PROFILE IMAGE */}

        <div className="mb-7 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[22px] bg-blue-50 text-3xl font-bold text-[#007BFF]">
              {(displayName || "و").trim().slice(0, 1)}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[#1F2937]">
              {displayName || "ورزشکار"}
            </h3>

            <p className="mt-1 text-sm text-[#8A919B]">
              {account?.phone || "شماره ثبت نشده"}
            </p>
          </div>
        </div>

        {/* PERSONAL INFO */}

        <div className="mb-7">
          <h3 className="mb-4 font-bold text-[#1F2937]">
            اطلاعات شخصی
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <InputField
              label="نام"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4B5563]">گروه خون</label>
              <select
                value={bloodGroup}
                onChange={(event) => setBloodGroup(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#007BFF]"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group || "empty"} value={group}>{group || "ثبت نشده"}</option>
                ))}
              </select>
            </div>

            <InputField
              label="شهر"
              value={city}
              placeholder="ثبت نشده"
              onChange={(event) => setCity(event.target.value)}
            />

            <InputField
              label="شماره موبایل"
              value={account?.phone ?? ""}
              readOnly
            />

            <InputField
              label="وضعیت"
              value={account?.status === "active" ? "فعال" : (account?.status ?? "")}
              readOnly
            />

            <InputField
              label="هدف ورزشی"
              value={goal}
              placeholder="ثبت نشده"
              onChange={(event) => setGoal(event.target.value)}
            />
          </div>
        </div>

        {/* SPORT SUMMARY */}

        <div>
          <h3 className="mb-4 font-bold text-[#1F2937]">
            خلاصه وضعیت
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <Dumbbell
                size={21}
                className="mb-4 text-[#007BFF]"
              />

              <p className="text-sm text-[#8A919B]">
                تمرین در هفته
              </p>

              <p className="mt-2 text-xl font-bold text-[#1F2937]">
                {trainingDays ? `${trainingDays.toLocaleString("fa-IR")} روز` : "برنامه‌ای نیست"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <Activity
                size={21}
                className="mb-4 text-[#007BFF]"
              />

              <p className="text-sm text-[#8A919B]">
                وزن فعلی
              </p>

              <p className="mt-2 text-xl font-bold text-[#1F2937]">
                {weight == null ? "ثبت نشده" : `${Number(weight).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} kg`}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <Target
                size={21}
                className="mb-4 text-[#007BFF]"
              />

              <p className="text-sm text-[#8A919B]">
                هدف
              </p>

              <p className="mt-2 text-xl font-bold text-[#1F2937]">
                {goal || "ثبت نشده"}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  /* =========================================================
     SUBSCRIPTION
  ========================================================= */

  const renderSubscription = () => {
    const active = relationships.find((row) => row.status === "active");
    const features = [
      trainingDays ? "برنامه تمرین" : null,
      hasMeals ? "برنامه تغذیه" : null,
      "تحلیل بدن",
      "گفتگو با مربی",
    ].filter(Boolean);
    const statusText = { active: "فعال", ended: "پایان‌یافته" };

    return (
      <>
        <SectionHeader
          icon={CreditCard}
          title="رابطه با مربی"
          description="دسترسی ورزشکار از رابطه مربی است، نه از خرید جداگانه."
        />

        <div className="mb-7 overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-l from-blue-50 to-white p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#007BFF] text-white shadow-lg shadow-blue-100">
                <Crown size={25} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-[#1F2937]">
                    {active?.coach?.display_name || "مربی فعالی نیست"}
                  </h3>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${active ? "bg-green-50 text-green-600" : "bg-gray-100 text-[#6B6F77]"}`}>
                    {active ? "فعال" : "بدون رابطه"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#8A919B]">
                  {active ? "برنامه‌ها و تحلیل بدن از همین رابطه باز است." : "وقتی مربی دعوت را بپذیرد، اینجا دیده می‌شود."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {relationships.length === 0 ? (
          <p className="text-sm text-[#A0A4AA]">رابطه‌ای ثبت نشده است.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {relationships.map((row) => (
              <SubscriptionCard
                key={row.id}
                name={row.coach?.display_name || "مربی"}
                price={statusText[row.status] || row.status || "—"}
                period=""
                description="این کارت رابطه مربی‌گری است."
                features={row.status === "active" ? features : ["این رابطه فعال نیست"]}
                active={row.status === "active"}
                onSelect={() => {}}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const renderNotifications = () => {
    return (
      <>
        <SectionHeader
          icon={Bell}
          title="اعلانات"
          description="نوع اعلان‌هایی که از Fito دریافت می‌کنید را مدیریت کنید."
        />

        <div className="space-y-4">
          <SettingRow
            icon={Dumbbell}
            title="یادآوری تمرین"
            description="قبل از زمان تمرین به شما اطلاع داده شود."
          >
            <Toggle
              enabled={notifications.workout}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  workout: value,
                })
              }
            />
          </SettingRow>

          <SettingRow
            icon={Activity}
            title="پیشرفت ورزشی"
            description="گزارش‌ها و تغییرات پیشرفت شما."
          >
            <Toggle
              enabled={notifications.progress}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  progress: value,
                })
              }
            />
          </SettingRow>

          <SettingRow
            icon={User}
            title="پیام مربی"
            description="وقتی مربی برای شما پیامی ارسال می‌کند."
          >
            <Toggle
              enabled={notifications.coach}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  coach: value,
                })
              }
            />
          </SettingRow>

          <SettingRow
            icon={Mail}
            title="پیام‌ها"
            description="اعلان مربوط به پیام‌های جدید."
          >
            <Toggle
              enabled={notifications.messages}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  messages: value,
                })
              }
            />
          </SettingRow>

          <SettingRow
            icon={Target}
            title="یادآوری اهداف"
            description="برای رسیدن به اهداف روزانه خود یادآوری دریافت کنید."
          >
            <Toggle
              enabled={notifications.reminders}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  reminders: value,
                })
              }
            />
          </SettingRow>

          <SettingRow
            icon={Bell}
            title="اعلان‌های تبلیغاتی"
            description="پیشنهادها، تخفیف‌ها و اخبار Fito."
          >
            <Toggle
              enabled={notifications.marketing}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  marketing: value,
                })
              }
            />
          </SettingRow>
        </div>
        <div className="mt-6">
          <h3 className="mb-4 font-bold text-[#1F2937]">آخرین اعلان‌ها</h3>
          {notices.length === 0 ? <p className="text-sm text-[#A0A4AA]">اعلانی نیست.</p> : (
            <ul className="space-y-3">
              {notices.slice(0, 6).map((item) => (
                <li key={item.id} className="rounded-2xl border border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-[#1F2937]">{item.title}</p>
                  {item.body ? <p className="mt-1 text-sm leading-6 text-[#6B6F77]">{item.body}</p> : null}
                  <p className="mt-2 text-xs text-[#A0A4AA]">{when(item.created_at)}{item.read_at ? "" : " · خوانده نشده"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    );
  };

  /* =========================================================
     PRIVACY
  ========================================================= */

  const renderPrivacy = () => {
    return (
      <>
        <SectionHeader
          icon={ShieldCheck}
          title="حریم خصوصی"
          description="امنیت حساب و دستگاه‌های متصل خود را مدیریت کنید."
        />

        {/* PASSWORD */}

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF]">
              <LockKeyhole size={19} />
            </div>

            <div>
              <h3 className="font-bold text-[#1F2937]">
                تغییر رمز عبور
              </h3>

              <p className="mt-1 text-xs text-[#9CA3AF]">
                رمز عبور حساب خود را تغییر دهید.
              </p>
            </div>
          </div>

          <AccountSecurity profile="athlete" />
        </div>

        {/* ACTIVE DEVICES */}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1F2937]">
                دستگاه‌های فعال
              </h3>

              <p className="mt-1 text-sm text-[#8A919B]">
                دستگاه‌هایی که در حال حاضر به حساب شما دسترسی دارند.
              </p>
            </div>

            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600">
              {devices.length.toLocaleString("fa-IR")} دستگاه
            </span>
          </div>

          <div className="space-y-4">
            {devices.length === 0 ? <p className="text-sm text-[#A0A4AA]">نشست دیگری ثبت نشده است.</p> : null}
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                icon={device.kind === "token" || /Android|iPhone/.test(device.title || "") ? Smartphone : Monitor}
                title={device.title}
                browser={device.browser}
                location={device.current ? "همین نشست" : "نشست ذخیره‌شده"}
                lastActive={device.current ? "در حال استفاده" : when(device.last_active)}
                current={device.current}
                onLogout={() => removeDevice(device.id)}
              />
            ))}
          </div>
        </div>

        {/* PRIVACY OPTIONS */}

        <div className="mt-6 space-y-4">
          <SettingRow
            icon={Eye}
            title="نمایش وضعیت آنلاین"
            description="مربی بتواند وضعیت آنلاین شما را مشاهده کند."
          >
            <Toggle
              enabled={notifications.show_online_status}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  show_online_status: value,
                })
              }
            />
          </SettingRow>
        </div>
      </>
    );
  };

  /* =========================================================
     SETTINGS
  ========================================================= */

  const renderSettings = () => {
    return (
      <>
        <SectionHeader
          icon={Settings}
          title="تنظیمات"
          description="تنظیمات عمومی تجربه کاربری Fito."
        />

        {/* THEME */}

        <div className="mb-6">
          <h3 className="mb-4 font-bold text-[#1F2937]">
            ظاهر برنامه
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                id: "light",
                title: "روشن",
                icon: Sun,
              },
              {
                id: "dark",
                title: "تاریک",
                icon: Moon,
              },
              {
                id: "system",
                title: "سیستم",
                icon: Monitor,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseTheme(item.id)}
                  className={`relative rounded-2xl border p-5 text-right transition ${
                    active
                      ? "border-[#007BFF] bg-blue-50/50 ring-4 ring-blue-50"
                      : "border-gray-100 bg-white hover:border-blue-100"
                  }`}
                >
                  {active && (
                    <span className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#007BFF] text-white">
                      <Check size={14} />
                    </span>
                  )}

                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                      active
                        ? "bg-[#007BFF] text-white"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  <h4 className="font-bold text-[#1F2937]">
                    {item.title}
                  </h4>
                </button>
              );
            })}
          </div>
          {theme !== "light" ? <p className="mt-3 text-sm text-[#8A919B]">انتخاب ذخیره شد. رنگ‌های فعلی برنامه روشن است.</p> : null}
        </div>

        {/* GENERAL SETTINGS */}

        <div className="space-y-4">
          <SettingRow
            icon={Dumbbell}
            title="پخش خودکار ویدیوهای تمرین"
            description="ویدیوهای تمرینی هنگام ورود به صفحه پخش شوند."
          >
            <Toggle
              enabled={notifications.auto_play_videos}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  auto_play_videos: value,
                })
              }
            />
          </SettingRow>

          <SettingRow
            icon={Bell}
            title="یادآوری تمرین"
            description="یادآوری‌های تمرینی داخل برنامه فعال باشد."
          >
            <Toggle
              enabled={notifications.workout_reminders}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  workout_reminders: value,
                })
              }
            />
          </SettingRow>

          <SettingRow
            icon={Activity}
            title="یادآوری تغذیه"
            description="یادآوری وعده‌های غذایی در برنامه نمایش داده شود."
          >
            <Toggle
              enabled={notifications.nutrition_reminders}
              onChange={(value) =>
                setNotifications({
                  ...notifications,
                  nutrition_reminders: value,
                })
              }
            />
          </SettingRow>

          <SettingRow
            icon={Globe}
            title="زبان"
            description="زبان رابط کاربری Fito."
          >
            <select
              value={notifications.language}
              onChange={(event) =>
                setNotifications({
                  ...notifications,
                  language: event.target.value,
                })
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#007BFF]"
            >
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </SettingRow>
        </div>
      </>
    );
  };

  /* =========================================================
     CONTENT
  ========================================================= */

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfile();

      case "subscription":
        return renderSubscription();

      case "notifications":
        return renderNotifications();

      case "privacy":
        return renderPrivacy();

      case "settings":
        return renderSettings();

      default:
        return null;
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div dir="rtl" className="w-full min-w-0">
      <div className="w-full">

        {/* HEADER */}

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#6B6F77] sm:text-3xl">
              تنظیمات حساب
            </h1>

            <p className="mt-2 text-sm text-[#8A919B]">
              اطلاعات حساب و تجربه استفاده از Fito را مدیریت کنید.
            </p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-600 disabled:opacity-60 sm:w-auto"
          >
            <Save size={18} />
            {pending ? "در حال ذخیره" : "ذخیره تغییرات"}
          </button>
        </div>
        {error ? <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p> : null}

        {/* TABS */}

        <div className="mb-6 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex min-w-[8.5rem] flex-1 items-center justify-center gap-2.5 px-4 py-4 text-sm font-medium transition-all sm:px-5 sm:py-5 ${
                    active
                      ? "bg-blue-50/40 text-[#007BFF]"
                      : "text-[#7C8490] hover:bg-gray-50 hover:text-[#1F2937]"
                  }`}
                >
                  <Icon size={18} />

                  <span>{tab.title}</span>

                  {active && (
                    <span className="absolute bottom-0 right-5 left-5 h-[3px] rounded-full bg-[#007BFF]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}

        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_4px_30px_rgba(0,0,0,0.03)] md:p-8">
          {renderContent()}
        </div>

        {/* SAVE */}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-600 disabled:opacity-60 sm:w-auto"
          >
            <Save size={18} />
            ذخیره تغییرات
          </button>
        </div>
      </div>
    </div>
  );
}