import { useEffect, useLayoutEffect, useRef, useState } from "react";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

// فاصله دراپ‌داون از دکمه و از لبه‌های صفحه (پیکسل)
const PANEL_GAP = 12;
const VIEWPORT_GAP = 12;
// بیشترین ارتفاع لیست، معادل کلاس max-h-96
const LIST_MAX_HEIGHT = 384;

// تنظیمات هر دسته: آیکون، رنگ پس‌زمینه و رنگ آیکون
const CATEGORY_CONFIG = {
  nutrition: {
    icon: RestaurantOutlinedIcon,
    bg: "#E9FFD9",
    color: "#4CAF50",
  },
  water: {
    icon: WaterDropOutlinedIcon,
    bg: "#E3F2FD",
    color: "#2196F3",
  },
  workout: {
    icon: FitnessCenterOutlinedIcon,
    bg: "#FFE9E9",
    color: "#FF5C5C",
  },
  sleep: {
    icon: BedtimeOutlinedIcon,
    bg: "#EFE7FF",
    color: "#8B5CF6",
  },
  supplement: {
    icon: MedicationOutlinedIcon,
    bg: "#FFF6E0",
    color: "#F5A623",
  },
  weight: {
    icon: MonitorWeightOutlinedIcon,
    bg: "#E8F1FF",
    color: "#007BFF",
  },
  coach: {
    icon: SupportAgentOutlinedIcon,
    bg: "#E8F1FF",
    color: "#007BFF",
  },
  ai: {
    icon: SmartToyOutlinedIcon,
    bg: "#F0E9FF",
    color: "#8B5CF6",
  },
};

export default function HeadeeMessage({
  img,
  value = 0,
  title = "اعلانات",
  label,
  items = [],
  emptyText = "چیزی برای نمایش نیست",
  actionLabel,
  onAction,
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  // موقعیت محاسبه‌شده دراپ‌داون تا همیشه داخل صفحه بماند
  const [position, setPosition] = useState(null);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const closeTimer = useRef(null);
  const lastPosition = useRef("");

  // بستن دراپ‌داون با کلیک بیرون از آن
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // محاسبه پویا: جابه‌جایی افقی، انتقال به بالا و کوتاه‌کردن لیست تا پنل از صفحه بیرون نزند
  useLayoutEffect(() => {
    if (!isOpen) {
      lastPosition.current = "";
      return undefined;
    }

    const update = () => {
      const trigger = buttonRef.current;
      const panel = panelRef.current;
      const list = listRef.current;
      if (!trigger || !panel || !list) return;

      const rect = trigger.getBoundingClientRect();
      const viewWidth = document.documentElement.clientWidth;
      const viewHeight = document.documentElement.clientHeight;

      // ارتفاع ثابت پنل (هدر و دکمه) مستقل از ارتفاع لیست به‌دست می‌آید
      const chrome = panel.offsetHeight - list.offsetHeight;
      const naturalHeight = chrome + Math.min(list.scrollHeight, LIST_MAX_HEIGHT);

      // افقی: پیش‌فرض لبه چپ پنل با دکمه هم‌تراز است
      let shift = 0;
      const overflowRight = rect.left + panel.offsetWidth - (viewWidth - VIEWPORT_GAP);
      if (overflowRight > 0) shift -= overflowRight;
      const overflowLeft = rect.left + shift - VIEWPORT_GAP;
      if (overflowLeft < 0) shift -= overflowLeft;

      // عمودی: اگر پایین فضای کافی نبود، پنل بالای دکمه نمایش داده می‌شود
      const spaceBelow = viewHeight - rect.bottom - PANEL_GAP - VIEWPORT_GAP;
      const spaceAbove = rect.top - PANEL_GAP - VIEWPORT_GAP;
      const flipUp = spaceBelow < Math.min(naturalHeight, 200) && spaceAbove > spaceBelow;
      const available = Math.max(flipUp ? spaceAbove : spaceBelow, 96);
      // ارتفاع لیست طوری کوتاه می‌شود که کل پنل در فضای موجود جا شود
      const listHeight = Math.min(LIST_MAX_HEIGHT, Math.max(available - chrome, 48));

      const key = `${Math.round(shift)}|${flipUp}|${Math.round(listHeight)}`;
      if (lastPosition.current === key) return;
      lastPosition.current = key;
      setPosition({ shift, flipUp, listHeight });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [isOpen]);

  const panelStyle = position
    ? {
        transform: position.shift ? `translateX(${position.shift}px)` : undefined,
        ...(position.flipUp
          ? { top: "auto", bottom: "100%", marginTop: 0, marginBottom: PANEL_GAP }
          : null),
      }
    : undefined;

  const handleMouseEnter = () => {
    clearTimeout(closeTimer.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-white p-3 rounded-full relative cursor-pointer block"
        aria-label={label || title}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {value > 0 && (
          <span className="flex items-center justify-center bottom-8 left-8 text-[12px] bg-[#007BFF] w-5.5 h-5.5 text-white rounded-full absolute">
            {value}
          </span>
        )}
        <img src={img} alt="" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="absolute left-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] rounded-3xl bg-white p-4 text-right shadow-xl"
        >
          <div className="flex items-center justify-between px-2 pb-3 border-b border-[#EEEEEE]">
            <span className="text-xs text-[#A0A4AA]">{items.length} مورد</span>
            <h3 className="text-base font-medium text-[#4F5965]">{title}</h3>
          </div>

          <div
            ref={listRef}
            style={position ? { maxHeight: position.listHeight } : undefined}
            className="max-h-96 overflow-y-auto mt-2 flex flex-col"
          >
            {items.length === 0 ? (
              <p className="text-sm text-[#A0A4AA] text-center py-8">
                {emptyText}
              </p>
            ) : (
              items.map((item, index) => {
                const config = CATEGORY_CONFIG[item.category];
                const Icon = config?.icon;

                return (
                  <button
                    key={item.id ?? index}
                    type="button"
                    onClick={() => onSelect?.(item)}
                    className={`flex w-full items-start gap-3 px-2 py-3 rounded-2xl text-right hover:bg-[#F5F7FB] transition cursor-pointer ${
                      item.unread ? "" : "opacity-60"
                    }`}
                  >
                    {Icon ? (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: config.bg }}
                      >
                        <Icon style={{ color: config.color, fontSize: 18 }} />
                      </div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#007BFF] mt-2 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-[#4F5965] leading-6">
                        {item.text}
                      </p>
                      {item.time && (
                        <span className="text-[11px] text-[#A0A4AA]">
                          {item.time}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {actionLabel ? (
            <button type="button" onClick={onAction} className="mt-2 w-full cursor-pointer rounded-2xl bg-[#F5F7FB] py-2.5 text-sm text-[#007BFF]">
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}