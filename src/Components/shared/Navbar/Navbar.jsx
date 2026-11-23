import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSession } from "../../../api/session";
import { api } from "../../../api/client";

import HomeIcon1 from "../../../assets/Icons/category.svg";
import Home1Img from "../../../assets/Icons/category (1).svg";
import DountIcon from "../../../assets/Icons/CallBell (1).svg";
import NutritionIcon from "../../../assets/Icons/CallBell.svg";
import DumbelIcon from "../../../assets/Icons/Barbell (1).svg";
import TrainingIcon from "../../../assets/Icons/Barbell.svg";
import AnalyzIcon from "../../../assets/Icons/Pie Chart Not 3.svg";
import AnalyzeIcon from "../../../assets/Icons/Pie Chart 3.svg";
import SettingIcon from "../../../assets/Icons/Settings.svg";
import SettingNot from "../../../assets/Icons/SettingsNot.svg";
import userIcon from "../../../assets/Icons/User Rounded.svg";

import CoachHomeActive from "../../../assets/Icons/category.svg";
import CoachHomeInactive from "../../../assets/Icons/category (1).svg";
import CoachAthletesActive from "../../../assets/Icons/profile-2user (1).svg";
import CoachAthletesInactive from "../../../assets/Icons/profile-2user.svg";
import CoachProgramsActive from "../../../assets/Icons/menu-board (1).svg";
import CoachProgramsInactive from "../../../assets/Icons/menu-board.svg";
import CoachMessagesActive from "../../../assets/Icons/messages (1).svg";
import CoachMessagesInactive from "../../../assets/Icons/messages.svg";
import CoachAnalyzeIcon from "../../../assets/Icons/Pie Chart 3.svg";
import CoachAnalyzIcon from "../../../assets/Icons/Pie Chart Not 3.svg";

 const BAR_GAP = 4;
const BAR_PADDING_X = 12;

function MoreIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="5" cy="12" r="2.4" fill={color} />
      <circle cx="12" cy="12" r="2.4" fill={color} />
      <circle cx="19" cy="12" r="2.4" fill={color} />
    </svg>
  );
}

function MoreButton({ innerRef, open, onClick }) {
  return (
    <button
      ref={innerRef}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-haspopup={onClick ? "menu" : undefined}
      aria-expanded={onClick ? open : undefined}
      className="fito-nav-item flex h-10 shrink-0 items-center gap-1.5 rounded-full  px-3 text-white shadow-sm"
    >
      <MoreIcon color="#FFFFFF" />
      {/* <span className="font-primary text-xs">بیشتر</span> */}
    </button>
  );
}

// منوی کشویی آیتم‌های پنهان؛ پنل با position: fixed همیشه داخل viewport می‌ماند
function MoreMenu({ items, isLocked, isCurrent }) {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const lastCoords = useRef("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (!panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        setOpen(false);
        setEntered(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setEntered(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      lastCoords.current = "";
      return undefined;
    }

    const update = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const viewWidth = document.documentElement.clientWidth;
      const viewHeight = document.documentElement.clientHeight;
      const gap = 8;
      const edge = 12;
      const width = panel.offsetWidth;
      const naturalHeight = panel.scrollHeight;
      const available = viewHeight - edge * 2;
      const maxHeight = naturalHeight > available ? available : null;
      const height = maxHeight ?? naturalHeight;

      let left = rect.left + rect.width / 2 - width / 2;
      let top = rect.bottom + gap;

      // اگر پایین فضا نبود، پنل به بالای دکمه منتقل می‌شود
      if (top + height > viewHeight - edge && rect.top - gap - height > edge) {
        top = rect.top - gap - height;
      }

      left = Math.min(Math.max(left, edge), Math.max(viewWidth - width - edge, edge));
      top = Math.min(Math.max(top, edge), Math.max(viewHeight - height - edge, edge));

      const key = `${Math.round(left)}|${Math.round(top)}|${Math.round(height)}`;
      if (lastCoords.current === key) {
        return;
      }
      lastCoords.current = key;
      setCoords({ left, top, maxHeight });
    };

    update();

    const raf = requestAnimationFrame(() => setEntered(true));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setEntered(false);
  }

  return (
    <div className="relative shrink-0">
      <MoreButton
        innerRef={triggerRef}
        open={open}
        onClick={() => (open ? close() : setOpen(true))}
      />

      {open && (
        <div
          ref={panelRef}
          role="menu"
          style={{
            left: coords ? coords.left : 0,
            top: coords ? coords.top : 0,
            maxHeight: coords?.maxHeight ?? undefined,
            visibility: coords ? "visible" : "hidden",
            opacity: entered ? 1 : 0,
            transform: entered ? "scale(1)" : "scale(0.96)",
            transformOrigin: "top center",
          }}
          className="fixed z-50 w-56 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-3xl bg-white p-2 shadow-xl transition-[opacity,transform] duration-150 ease-out"
        >
          {items.map((item) => {
            if (isLocked(item)) {
              return (
                <div key={item.to} className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2 opacity-60">
                  <img className="h-6 w-6" src={item.inactive} alt="" />
                  <p className="font-primary text-sm">قفل</p>
                </div>
              );
            }

            const current = isCurrent(item);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                role="menuitem"
                onClick={close}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[#F5F7FB] ${current ? "text-[#007BFF]" : "text-[#6B6F77]"}`}
              >
                <img className="h-6 w-6" src={current ? item.active : item.inactive} alt={item.label} />
                <p className="font-primary text-sm">{item.label}</p>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ADMIN_NAV_ITEMS = [
  {
    to: "/admin/plans",
    label: "پلن",
    active: SettingIcon,
    inactive: SettingNot,
  },
  {
    to: "/admin/users",
    label: "کاربران",
    active: CoachAthletesActive,
    inactive: CoachAthletesInactive,
  },
  {
    to: "/admin/settings",
    label: "مدل",
    active: SettingIcon,
    inactive: SettingNot,
  },
  {
    to: "/admin/homepage",
    label: "صفحه",
    active: HomeIcon1,
    inactive: Home1Img,
  },
];

const ATHLETE_NAV_ITEMS = [
  {
    to: "/dashboardAthlete",
    label: "خانه",
    active: HomeIcon1,
    inactive: Home1Img,
  },
  {
    to: "/trainingpage",
    label: "ورزش",
    active: DumbelIcon,
    inactive: TrainingIcon,
  },
  {
    to: "/dashboardnutrition",
    label: "تغذیه",
    active: DountIcon,
    inactive: NutritionIcon,
  },
  {
    to: "/AnalysisPage",
    label: "تحلیل",
    active: AnalyzeIcon,
    inactive: AnalyzIcon,
  },
  {
    to: "/invitations",
    label: "دعوت‌ها",
    active: CoachMessagesActive,
    inactive: CoachMessagesInactive,
  },
  {
    to: "/feedback",
    label: "بازخورد",
    active: CoachMessagesActive,
    inactive: CoachMessagesInactive,
  },
  {
    to: "/athlete-plan",
    label: "پلن",
    active: CoachProgramsActive,
    inactive: CoachProgramsInactive,
  },
  {
    to: "/settings",
    label: "تنظیمات",
    active: SettingIcon,
    inactive: SettingNot,
  },
];

const COACH_NAV_ITEMS = [
  {
    to: "/coach/dashboard",
    label: "داشبورد",
    active: CoachHomeActive,
    inactive: CoachHomeInactive,
  },
  {
    to: "/coach/athletes",
    label: "شاگردها",
    active: CoachAthletesActive,
    inactive: CoachAthletesInactive,
  },
  {
    to: "/coach/plans",
    label: "پلن",
    active: CoachHomeActive,
    inactive: CoachHomeInactive,
  },
  {
    to: "/coach/programs",
    label: "برنامه‌ها",
    active: CoachProgramsActive,
    inactive: CoachProgramsInactive,
  },
  {
    to: "/coach/nutrition",
    label: "غذا",
    active: DountIcon,
    inactive: NutritionIcon,
  },
  {
    to: "/coach/assistant",
    label: "دستیار",
    active: CoachMessagesActive,
    inactive: CoachMessagesInactive,
  },
  {
    to: "/coach/report",
    label: "گزارش ها",
    active: CoachAnalyzeIcon,
    inactive: CoachAnalyzIcon,
  },
  {
    to: "/coach/message",
    label: "پیام‌ها",
    active: CoachMessagesActive,
    inactive: CoachMessagesInactive,
  },
  {
    to: "/coach/settings",
    label: "تنظیمات",
    active: SettingIcon,
    inactive: SettingNot,
  },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { account } = useSession();
  const hasCoach = Boolean(account?.profiles?.coach);
  const hasAthlete = Boolean(account?.profiles?.athlete);
  const showCoach = hasCoach && (location.pathname.startsWith("/coach") || !hasAthlete);
  const isAdmin = Array.isArray(account?.roles) && account.roles.includes("platform_admin");
  const sectionItems = showCoach ? COACH_NAV_ITEMS : hasAthlete ? ATHLETE_NAV_ITEMS : [];
  const navItems = isAdmin ? [...ADMIN_NAV_ITEMS, ...sectionItems] : sectionItems;
  const profileRoute = showCoach ? "/coach/settings" : hasAthlete ? "/settings" : null;
  const [features, setFeatures] = useState([]);
  const programsLocked = showCoach && !features.includes("workout_programs");
  const nutritionLocked = showCoach && !features.includes("nutrition_programs");
  const [visibleCount, setVisibleCount] = useState(navItems.length);
  const mobileBarRef = useRef(null);
  const measureRowRef = useRef(null);
  const lastCount = useRef(-1);
  const itemCount = navItems.length;
  const itemsSignature = navItems.map((item) => item.to).join("|");
  const visibleItems = navItems.slice(0, visibleCount);
  const hiddenItems = navItems.slice(visibleCount);

  useEffect(() => {
    if (!showCoach) {
      return undefined;
    }

    let active = true;

    api("/api/v1/coach/access").then(
      (body) => {
        if (active) {
          setFeatures(Array.isArray(body?.features) ? body.features : []);
        }
      },
      () => {
        if (active) {
          setFeatures([]);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [showCoach]);

  // توزیع پویا: با اندازه‌گیری عرض واقعی نوار و آیتم‌ها، آیتم‌های جا نشده به یک منوی «بیشتر» می‌روند
  useLayoutEffect(() => {
    const bar = mobileBarRef.current;
    const measure = measureRowRef.current;
    if (!bar || !measure) {
      return undefined;
    }

    const compute = () => {
      const barWidth = bar.clientWidth;
      // نوار در این عرض نمایش داده نمی‌شود (چیدمان دسکتاپ)
      if (barWidth <= 0) {
        return;
      }

      const cells = Array.from(measure.children);
      if (cells.length < itemCount + 2) {
        return;
      }

      const widths = cells.slice(0, itemCount).map((cell) => cell.offsetWidth);
      const withMoreTail = cells[itemCount].offsetWidth;
      const aloneTail = cells[itemCount + 1].offsetWidth;
      const container = barWidth - BAR_PADDING_X * 2;
      const itemsWidth = widths.reduce((sum, width) => sum + width, 0);
      let count = 0;

      if (itemCount > 0 && itemsWidth + BAR_GAP * itemCount + aloneTail <= container) {
        // همه آیتم‌ها جا می‌شوند و نیازی به دکمه «بیشتر» نیست
        count = itemCount;
      } else {
        let used = 0;
        for (let i = 0; i < itemCount; i += 1) {
          const nextUsed = used + widths[i] + (i > 0 ? BAR_GAP : 0);
          if (nextUsed + BAR_GAP + withMoreTail > container) {
            break;
          }
          used = nextUsed;
          count = i + 1;
        }
      }

      // جلوگیری از به‌روزرسانی‌های تکراری
      if (lastCount.current === count) {
        return;
      }
      lastCount.current = count;
      setVisibleCount(count);
    };

    compute();

    const observer = new ResizeObserver(compute);
    observer.observe(bar);

    return () => {
      observer.disconnect();
    };
  }, [itemCount, itemsSignature]);

  function isItemLocked(item) {
    return (item.to === "/coach/programs" && programsLocked) || (item.to === "/coach/nutrition" && nutritionLocked);
  }

  function isItemCurrent(item) {
    return item.to === "/trainingpage"
      ? location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
      : location.pathname === item.to;
  }

  // ردیف نامرئی برای اندازه‌گیری عرض واقعی آیتم‌ها، دکمه «بیشتر» و دکمه پروفایل
  function renderMeasureRow() {
    return (
      <div
        ref={measureRowRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute inset-x-0 top-0 flex items-center gap-1"
      >
        {navItems.map((item, index) => renderItem(item, index, true))}
        <div className="flex items-center gap-1">
          <MoreButton />
          <span className="ms-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full" />
        </div>
        <div className="flex items-center gap-1">
          <span className="ms-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full" />
        </div>
      </div>
    );
  }

  function renderItem(item, index, compact) {
    const locked = isItemLocked(item);
    const current = isItemCurrent(item);
    const className = compact
      ? `fito-nav-item flex w-16 shrink-0 flex-col items-center justify-center gap-1 py-1 ${current ? "text-[#007BFF]" : "text-[#A0A4AA]"}`
      : `flex flex-col items-center justify-center gap-1 transition ${index > 0 ? "mt-2" : ""} ${current ? "text-[#007BFF]" : "text-[#A0A4AA]"}`;

    if (locked) {
      return (
        <button key={item.to} type="button" disabled className={`${className} cursor-not-allowed`}>
          <img className="h-6 w-6" src={item.inactive} alt="" />
          <p className="font-primary text-xs">قفل</p>
        </button>
      );
    }

    return (
      <NavLink key={item.to} to={item.to} className={className}>
        <img className="h-6 w-6" src={current ? item.active : item.inactive} alt={item.label} />
        <p className="font-primary max-w-16 truncate text-xs">{item.label}</p>
      </NavLink>
    );
  }

  function openProfile() {
    if (profileRoute) {
      navigate(profileRoute);
    }
  }

  if (isAdmin) {
    return (
      <>
        <div className="fixed inset-x-0 top-0 z-40 border-b border-[#F0F2F5] bg-white shadow-md lg:hidden">
          <div ref={mobileBarRef} className="flex items-center gap-1 overflow-x-hidden px-3 py-2">
            {visibleItems.map((item, index) => renderItem(item, index, true))}
            {hiddenItems.length > 0 && (
              <MoreMenu items={hiddenItems} isLocked={isItemLocked} isCurrent={isItemCurrent} />
            )}
            <button type="button" onClick={openProfile} className="fito-nav-item ms-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#007BFF]">
              <img src={userIcon} alt="حساب" />
            </button>
          </div>
          {renderMeasureRow()}
        </div>
        <div className="fixed z-40 hidden lg:block">
          <div className="mr-3 mt-3 flex max-h-[calc(100dvh-1.5rem)] w-18 flex-col items-center justify-between overflow-hidden rounded-[56px] bg-white py-3 shadow-md">
            <div className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-1">
              {navItems.map((item, index) => renderItem(item, index, false))}
            </div>
            <button type="button" onClick={openProfile} className="mt-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#007BFF]">
              <img src={userIcon} alt="حساب" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <div className="fito-mobile-nav fixed inset-x-0 top-0 z-40 border-b border-[#F0F2F5] bg-white shadow-md lg:hidden">
      <div ref={mobileBarRef} className="flex items-center gap-1 overflow-x-hidden px-3 py-2">
        {visibleItems.map((item, index) => renderItem(item, index, true))}
        {hiddenItems.length > 0 && (
          <MoreMenu items={hiddenItems} isLocked={isItemLocked} isCurrent={isItemCurrent} />
        )}
        {/* <button type="button" onClick={openProfile} className="fito-nav-item ms-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#007BFF] ">
          <img src={userIcon} alt="حساب" />
        </button> */}
      </div>
      {renderMeasureRow()}
    </div>
    <div className="fixed z-40 hidden lg:block">
      <div className="w-18 h-160 bg-white flex flex-col shadow-md items-center justify-between rounded-[56px] py-3 mt-3 mr-3">
        <div className="flex flex-col items-center justify-center gap-2">
          {navItems.map((item, index) => renderItem(item, index, false))}
        </div>

        <div className="w-full flex justify-center">
          <div className="flex flex-col items-center justify-center bg-blue-500 rounded-full w-14 h-14 cursor-pointer">
            <img
              onClick={openProfile}
              src={userIcon}
              alt="User"
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
