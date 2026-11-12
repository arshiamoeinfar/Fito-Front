import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

  function renderItem(item, index, compact) {
    const locked = (item.to === "/coach/programs" && programsLocked) || (item.to === "/coach/nutrition" && nutritionLocked);
    const current = item.to === "/trainingpage"
      ? location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
      : location.pathname === item.to;
    const className = compact
      ? `flex w-16 shrink-0 flex-col items-center justify-center gap-1 py-1 ${current ? "text-[#007BFF]" : "text-[#A0A4AA]"}`
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
          <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
            {navItems.map((item, index) => renderItem(item, index, true))}
            <button type="button" onClick={openProfile} className="ms-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#007BFF]">
              <img src={userIcon} alt="حساب" />
            </button>
          </div>
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
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
        {navItems.map((item, index) => renderItem(item, index, true))}
        <button type="button" onClick={openProfile} className="ms-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#007BFF]">
          <img src={userIcon} alt="حساب" />
        </button>
      </div>
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
