import { useEffect, useRef, useState } from "react";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

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
  const wrapperRef = useRef(null);
  const closeTimer = useRef(null);

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
        <div className="absolute left-0 top-full mt-3 w-96 bg-white rounded-3xl shadow-xl p-4 z-50 text-right">
          <div className="flex items-center justify-between px-2 pb-3 border-b border-[#EEEEEE]">
            <span className="text-xs text-[#A0A4AA]">{items.length} مورد</span>
            <h3 className="text-base font-medium text-[#4F5965]">{title}</h3>
          </div>

          <div className="max-h-96 overflow-y-auto mt-2 flex flex-col">
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