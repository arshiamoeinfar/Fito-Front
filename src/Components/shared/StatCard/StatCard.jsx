import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import PreviewNote from "../PreviewNote/PreviewNote";

export default function StatCard({
  title,
  value,
  img,
  type = "image",
  progress = 50,
  color = "#6BAF41",
  colorBg = "#E9FFDB",
  preview = false,
}) {
  return (
    <div className={`bg-white rounded-[28px] flex items-center ${preview ? "min-h-23 py-2" : "h-23"}`}>
      <div className="flex mr-3">
        {type === "circle" ? (
          <div className="w-13 h-13 flex items-center justify-center">
            <CircularProgressbar
              value={progress}
              text=""
              strokeWidth={20}
              styles={buildStyles({
                pathColor: color,
                trailColor: colorBg,
                strokeLinecap: "round",
              })}
            />
          </div>
        ) : (
          <img src={img} alt={title} />
        )}
        <div className="flex flex-col justify-center mr-3">
          <span className="text-lg text-[#6B6F77] font-medium">{value}</span>
          <p className="text-sm text-[#6B6F77] Modam-Medium">{title}</p>
          {preview ? <PreviewNote /> : null}
        </div>
      </div>
    </div>
  );
}
