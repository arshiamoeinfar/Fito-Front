import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const styles = {
  warning: {
    icon: "bg-[#FFF7E6] text-[#E9A820]",
    badge: "bg-[#FFF3CD] text-[#C58A12]",
  },
  blue: {
    icon: "bg-[#EEF6FF] text-[#1683F7]",
    badge: "bg-[#EAF4FF] text-[#007BFF]",
  },
  green: {
    icon: "bg-[#EFFBEA] text-[#68B43F]",
    badge: "bg-[#EFFBEA] text-[#5FA93A]",
  },
};

export default function TodayActions({ actions = [] }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const visibleActions = showAll ? actions : actions.slice(0, 3);

  return (
    <section dir="rtl" className="h-fit w-full rounded-[24px] bg-white p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="font-primary text-xl text-[#6B6F77]">اقدامات امروز</h2>
          <p className="mt-1 text-[12px] text-[#9AA1AA]">مواردی که نیاز به توجه شما دارند</p>
        </div>
        <span className="rounded-full bg-[#FFF4D6] px-2.5 py-1 text-[11px] font-medium text-[#C79218]">
          {new Intl.NumberFormat("fa-IR").format(actions.length)} مورد
        </span>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-[#A0A4AA]">موردی برای امروز نیست.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleActions.map((action, index) => {
            const Icon = action.icon;
            const style = styles[action.type] || styles.blue;

            return (
              <div
                key={action.id}
                className={`group flex items-center gap-3 rounded-md px-1 py-4 transition-colors duration-200 hover:bg-[#F5F7FB] ${
                  showAll || index !== visibleActions.length - 1 ? "border-b border-[#F0F2F5]" : ""
                }`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
                  <Icon size={21} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-[#4B5563]">{action.title}</h3>
                    <span className={`rounded-full px-2 py-[3px] text-[10px] font-medium ${style.badge}`}>{action.count}</span>
                  </div>
                  <p className="truncate text-[11px] leading-5 text-[#A0A6AE]">{action.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(action.to)}
                  className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-medium text-[#1683F7] transition-all duration-200 hover:text-[#006FE6]"
                >
                  {action.button}
                  <ChevronLeft size={13} strokeWidth={1.8} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {actions.length > 3 && (
        <div className="mt-3 flex justify-start">
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="cursor-pointer text-[11px] font-medium text-[#8B929C] transition-colors hover:text-[#007BFF]"
          >
            {showAll ? "نمایش کمتر" : "مشاهده همه"}
          </button>
        </div>
      )}
    </section>
  );
}
