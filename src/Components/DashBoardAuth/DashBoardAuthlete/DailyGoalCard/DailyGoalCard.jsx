import imgRectangle from "../../../../assets/imges/Rectangle 9.png";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useNavigate } from "react-router-dom";

export default function DailyGoalCard({
  done = 1,
  total = 7,
  percent = 50,
  to = "/dashboardAthlete/start-training",
  summary,
}) {
  const navigate = useNavigate();
  const line = summary ?? `${done} از ${total} تمرین تکمیل شده`;

  return (
    <div className="flex justify-between overflow-hidden">
      <div className="absolute top-5 right-4 flex max-w-[58%] flex-col items-start justify-center gap-2 text-white sm:top-8 sm:right-8 sm:max-w-none">
        <h1 className="text-lg sm:text-2xl">تکمیل هدف روزانه</h1>
        <p className="font-primary-light text-sm leading-6 sm:text-base">{line}</p>
        <span
          onClick={() => navigate(to)}
          className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm text-[#007BFF] transition duration-300 hover:bg-gray-200"
        >
          شروع تمرین
        </span>
      </div>
      <img className="hidden h-full min-w-fit sm:block" src={imgRectangle} alt="" />
      <div className="absolute top-5 left-4 h-24 w-24 sm:left-10 sm:h-32 sm:w-32">
        <CircularProgressbar
          value={percent}
          text=""
          strokeWidth={14}
          styles={buildStyles({
            pathColor: "#FFFFFF",
            trailColor: "#FFFFFF63",
            strokeLinecap: "round",
          })}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xl text-white">
          {percent}%
        </div>
      </div>
    </div>
  );
}
