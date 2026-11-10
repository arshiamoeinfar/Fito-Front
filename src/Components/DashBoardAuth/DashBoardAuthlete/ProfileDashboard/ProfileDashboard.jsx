import EditProf from "../../../../assets/Icons/Pen New Square.svg";
import UserProfile from "../../HeaderDashBoard/UserProfile/UserProfile";
import { useNavigate } from "react-router-dom";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfileCard({
  name = "ارشیا معین فر",
  detail = "ایران، سقز",
  age = "۱۸ سال",
  height = "178",
  weight = "82",
  extraLabel = "گروه خون",
  extra = "+A",
  onExtraChange,
}) {
  const navigate = useNavigate();

  return (
    <div className="relative rounded-4xl bg-white p-5 sm:p-7">
      <img
        onClick={() => navigate("/settings")}
        src={EditProf}
        alt="ویرایش پروفایل"
        className="absolute top-4 left-4 h-6 w-6 cursor-pointer transition hover:opacity-70"
      />
      <div className="flex flex-col items-center">
        <UserProfile />
        <h2 className="mt-2 text-xl font-semibold text-[#007BFF]">{name}</h2>
        {detail || age ? (
          <div className="mt-2 flex items-center gap-2">
            {detail ? <span className="font-primary-ExtraLight text-[15px] font-medium text-[#6B6F77]">{detail}</span> : null}
            {detail && age ? <div className="h-4 w-px bg-[#ECECEC]" /> : null}
            {age ? <span className="font-primary-ExtraLight text-[15px] font-medium text-[#6B6F77]">{age}</span> : null}
          </div>
        ) : null}
      </div>
      <div className="mt-5 grid grid-cols-3">
        <div className="text-center">
          <p className="mt-1 text-sm text-[#6B6F77]">قد</p>
          <h3 className="text-2xl font-bold text-[#6B6F77]">{height}</h3>
        </div>
        <div className="border-x border-[#ECECEC] text-center">
          <p className="mt-1 text-sm text-[#6B6F77]">وزن</p>
          <h3 className="text-2xl font-bold text-[#6B6F77]">{weight}</h3>
        </div>
        <div className="text-center">
          <p className="mt-1 text-sm text-[#6B6F77]">{extraLabel}</p>
          {onExtraChange ? (
            <select
              dir="ltr"
              aria-label={extraLabel}
              value={BLOOD_GROUPS.includes(extra) ? extra : ""}
              onChange={(event) => onExtraChange(event.target.value)}
              className={`mt-1 w-full appearance-none bg-transparent text-center font-bold text-[#6B6F77] outline-none ${BLOOD_GROUPS.includes(extra) ? "text-2xl" : "text-sm"}`}
            >
              <option value="">ثبت نشده</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          ) : (
            <h3 dir="ltr" className={`font-bold text-[#6B6F77] ${extra ? "text-2xl" : "text-sm"}`}>{extra || "ثبت نشده"}</h3>
          )}
        </div>
      </div>
    </div>
  );
}
