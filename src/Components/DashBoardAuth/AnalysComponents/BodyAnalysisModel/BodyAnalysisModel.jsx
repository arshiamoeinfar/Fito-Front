import React, { useMemo, useState } from "react";
import SegmentedControl from "../../../shared/SegmentedControl/SegmentedControl";

const STATUS_COLOR = {
  "عالی": "#007BFF",
  "خوب": "#63AF42",
  "متوسط": "#D5A329",
  "ضعیف": "#F04444",
  "ثبت نشده": "#CBD5E1",
};

const POINTS = {
  جلو: [
    { id: "chest-upper-l", label: "بالاسینه چپ", x: "58%", y: "22%" },
    { id: "chest-upper-r", label: "بالاسینه راست", x: "47%", y: "22%" },
    { id: "chest-middle-l", label: "وسط سینه چپ", x: "56%", y: "25%" },
    { id: "chest-middle-r", label: "وسط سینه راست", x: "49%", y: "25%" },
    { id: "chest-lower-l", label: "زیرسینه چپ", x: "56%", y: "28%" },
    { id: "chest-lower-r", label: "زیرسینه راست", x: "48%", y: "28%" },
    { id: "biceps-l", label: "دوسر چپ", x: "64%", y: "32%" },
    { id: "biceps-r", label: "دوسر راست", x: "40%", y: "32%" },
    { id: "abdomen-upper", label: "بالای شکم", x: "52%", y: "32%" },
    { id: "abdomen-middle", label: "وسط شکم", x: "52%", y: "37%" },
    { id: "abdomen-lower", label: "زیر شکم", x: "52%", y: "42%" },
    { id: "oblique-l", label: "پهلو چپ", x: "58%", y: "36%" },
    { id: "oblique-r", label: "پهلو راست", x: "46%", y: "36%" },
    { id: "quad-middle-l", label: "پهنی میانی چپ", x: "59%", y: "58%" },
    { id: "quad-front-l", label: "پهنی داخلی چپ", x: "56%", y: "64%" },
    { id: "quad-sartorius-l", label: "خیاطه چپ", x: "56%", y: "54%" },
    { id: "quad-front-r", label: "پهنی داخلی راست", x: "48%", y: "64%" },
    { id: "quad-side-l", label: "پهن خارجی چپ", x: "62%", y: "63%" },
    { id: "quad-side-r", label: "پهن خارجی راست", x: "42%", y: "64%" },
    { id: "quad-middle-r", label: "پهن میانی راست", x: "45%", y: "58%" },
    { id: "quad-sartorius-r", label: "خیاطه راست", x: "48%", y: "54%" },
    { id: "anterior-deltoid-r", label: "دلتویید قدامی راست", x: "42%", y: "22%" },
    { id: "lateral-deltoid-r", label: "دلتویید جانبی راست", x: "39%", y: "24%" },
    { id: "anterior-deltoid-l", label: "دلتویید قدامی چپ", x: "62%", y: "22%" },
    { id: "lateral-deltoid-l", label: "دلتویید جانبی چپ", x: "66%", y: "24%" },
    { id: "brachioradialis-l", label: "ساعد چپ", x: "68%", y: "44%" },
    { id: "brachioradialis-r", label: "ساعد راست", x: "36%", y: "44%" },
  ],
  پشت: [
    { id: "back-upper", label: "ذوزنقه ای راست", x: "54%", y: "18%" },
    { id: "back-upper-l", label: "ذوزنقه ای چپ", x: "47%", y: "18%" },
    { id: "back-middle", label: "پشتی بزرگ راست", x: "56%", y: "32%" },
    { id: "back-middle-l", label: "پشتی بزرگ چپ", x: "46%", y: "32%" },
    { id: "back-lower", label: "گرد بزرگ راست", x: "58%", y: "28%" },
    { id: "back-lower-l", label: "گرد بزرگ چپ", x: "44%", y: "28%" },
    { id: "posterior-deltoid-r", label: "دلتویید خلفی راست", x: "60%", y: "22%" },
    { id: "posterior-deltoid-l", label: "دلتویید خلفی چپ", x: "42%", y: "22%" },
    { id: "triceps-l", label: "سه‌سر چپ", x: "38%", y: "30%" },
    { id: "triceps-r", label: "سه‌سر راست", x: "62%", y: "28%" },
    { id: "hamstring-l", label: "پشت ران چپ", x: "45%", y: "62%" },
    { id: "hamstring-r", label: "پشت ران راست", x: "55%", y: "62%" },
    { id: "gastrocnemius-r", label: "ساق راست", x: "57%", y: "78%" },
    { id: "gastrocnemius-l", label: "ساق چپ", x: "44%", y: "78%" },
  ],
};

const ALL_IDS = [
  "chest-upper-l", "chest-upper-r", "chest-middle-l", "chest-middle-r", "chest-lower-l", "chest-lower-r",
  "biceps-l", "biceps-r", "abdomen-upper", "abdomen-middle", "abdomen-lower", "oblique-l", "oblique-r",
  "quad-middle-l", "quad-front-l", "quad-sartorius-l", "quad-front-r", "quad-side-l", "quad-side-r", "quad-middle-r", "quad-sartorius-r",
  "anterior-deltoid-r", "lateral-deltoid-r", "anterior-deltoid-l", "lateral-deltoid-l",
  "brachioradialis-l", "brachioradialis-r",
  "back-upper", "back-upper-l", "back-middle", "back-middle-l", "back-lower", "back-lower-l",
  "posterior-deltoid-r", "posterior-deltoid-l",
  "triceps-l", "triceps-r", "hamstring-l", "hamstring-r", "gastrocnemius-r", "gastrocnemius-l",
];

function statusFor(score) {
  if (score === null || score === undefined || score === "") return "ثبت نشده";
  const value = Number(score);
  if (Number.isNaN(value)) return "ثبت نشده";
  if (value >= 80) return "عالی";
  if (value >= 60) return "خوب";
  if (value >= 40) return "متوسط";
  return "ضعیف";
}

function fa(value, digits = 0) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return number.toLocaleString("fa-IR", { maximumFractionDigits: digits });
}

function deltaText(delta, suffix = "") {
  if (delta === null || delta === undefined || delta === "") return "—";
  const number = Number(delta);
  if (Number.isNaN(number) || number === 0) return "بدون تغییر";
  return `${number > 0 ? "+" : "−"}${fa(Math.abs(number), 1)}${suffix ? ` ${suffix}` : ""}`;
}

function num(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deltaOf(latest, previous, key) {
  const left = num(previous?.metrics?.[key]);
  const right = num(latest?.metrics?.[key]);
  if (left === null || right === null) return null;
  return Math.round((right - left) * 10) / 10;
}

function symmetryPoints(diff) {
  if (diff === null) return 0;
  if (diff <= 0.1) return 3;
  if (diff <= 0.5) return 1;
  if (diff <= 1) return 0;
  if (diff <= 1.5) return -2;
  return -5;
}

function compositionPoints(fatDelta, muscleDelta) {
  let points = 0;
  if (fatDelta !== null) points += fatDelta < 0 ? 2 : fatDelta > 0 ? -2 : 0;
  if (muscleDelta !== null) points += muscleDelta > 0 ? 2 : muscleDelta < 0 ? -2 : 0;
  return points;
}

function groupScore({ size, sizeDelta, symmetryDiff, fatDelta, muscleDelta, invert }) {
  if (size === null) return null;
  const progress = sizeDelta === null ? 0 : clamp((invert ? -sizeDelta : sizeDelta) * 3, -9, 9);
  const composition = compositionPoints(fatDelta, muscleDelta);
  const score = clamp(Math.round(35 + progress + symmetryPoints(symmetryDiff) + composition), 0, 100);
  return { score, delta: progress + composition, size_cm: size, size_delta: sizeDelta };
}

export function buildBodyMuscles(latestObs, previousObs) {
  const latest = latestObs?.metrics ?? {};
  const fatDelta = deltaOf(latestObs, previousObs, "body_fat_percent");
  const muscleDelta = deltaOf(latestObs, previousObs, "muscle_mass_kg");
  const chest = num(latest.chest_cm);
  const chestDelta = deltaOf(latestObs, previousObs, "chest_cm");
  const leftArm = num(latest.left_arm_cm);
  const rightArm = num(latest.right_arm_cm);
  const leftArmDelta = deltaOf(latestObs, previousObs, "left_arm_cm");
  const rightArmDelta = deltaOf(latestObs, previousObs, "right_arm_cm");
  const armDiff = leftArm !== null && rightArm !== null ? Math.abs(leftArm - rightArm) : null;
  const leftThigh = num(latest.left_thigh_cm);
  const rightThigh = num(latest.right_thigh_cm);
  const leftThighDelta = deltaOf(latestObs, previousObs, "left_thigh_cm");
  const rightThighDelta = deltaOf(latestObs, previousObs, "right_thigh_cm");
  const thighDiff = leftThigh !== null && rightThigh !== null ? Math.abs(leftThigh - rightThigh) : null;
  const waist = num(latest.waist_cm);
  const waistDelta = deltaOf(latestObs, previousObs, "waist_cm");
  const neck = num(latest.neck_cm);
  const neckDelta = deltaOf(latestObs, previousObs, "neck_cm");
  const chestGroup = groupScore({ size: chest, sizeDelta: chestDelta, symmetryDiff: null, fatDelta, muscleDelta, invert: false });
  const armLeftGroup = groupScore({ size: leftArm, sizeDelta: leftArmDelta, symmetryDiff: armDiff, fatDelta, muscleDelta, invert: false });
  const armRightGroup = groupScore({ size: rightArm, sizeDelta: rightArmDelta, symmetryDiff: armDiff, fatDelta, muscleDelta, invert: false });
  const thighLeftGroup = groupScore({ size: leftThigh, sizeDelta: leftThighDelta, symmetryDiff: thighDiff, fatDelta, muscleDelta, invert: false });
  const thighRightGroup = groupScore({ size: rightThigh, sizeDelta: rightThighDelta, symmetryDiff: thighDiff, fatDelta, muscleDelta, invert: false });
  const waistGroup = groupScore({ size: waist, sizeDelta: waistDelta, symmetryDiff: null, fatDelta, muscleDelta, invert: true });
  const neckGroup = groupScore({ size: neck, sizeDelta: neckDelta, symmetryDiff: null, fatDelta, muscleDelta, invert: false });
  const muscles = Object.fromEntries(ALL_IDS.map((id) => [id, { score: null, delta: null, size_cm: null, size_delta: null }]));
  if (chestGroup) {
    ["chest-upper-l", "chest-upper-r", "chest-middle-l", "chest-middle-r", "chest-lower-l", "chest-lower-r"].forEach((id) => { muscles[id] = { ...chestGroup }; });
  }
  if (armLeftGroup) {
    muscles["biceps-l"] = { ...armLeftGroup };
    muscles["triceps-l"] = { ...armLeftGroup };
  }
  if (armRightGroup) {
    muscles["biceps-r"] = { ...armRightGroup };
    muscles["triceps-r"] = { ...armRightGroup };
  }
  if (thighLeftGroup) {
    ["quad-middle-l", "quad-front-l", "quad-sartorius-l", "quad-side-l", "hamstring-l"].forEach((id) => { muscles[id] = { ...thighLeftGroup }; });
  }
  if (thighRightGroup) {
    ["quad-middle-r", "quad-front-r", "quad-sartorius-r", "quad-side-r", "hamstring-r"].forEach((id) => { muscles[id] = { ...thighRightGroup }; });
  }
  if (waistGroup) {
    ["abdomen-upper", "abdomen-middle", "abdomen-lower", "oblique-l", "oblique-r"].forEach((id) => { muscles[id] = { ...waistGroup }; });
  }
  if (neckGroup) {
    muscles["back-upper"] = { ...neckGroup };
    muscles["back-upper-l"] = { ...neckGroup };
  }
  return muscles;
}

export default function BodyAnalysisModel({ frontImage, backImage, title, muscles: musclesProp, observations, latestObs, previousObs, onSelect }) {
  const [active, setActive] = useState("جلو");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const muscles = useMemo(() => {
    if (musclesProp && Object.keys(musclesProp).length > 0) return musclesProp;
    if (latestObs || previousObs) return buildBodyMuscles(latestObs, previousObs);
    if (observations && observations.length > 0) {
      const ordered = [...observations].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
      return buildBodyMuscles(ordered.at(-1) ?? null, ordered.length > 1 ? ordered.at(-2) : null);
    }
    return {};
  }, [musclesProp, observations, latestObs, previousObs]);

  const getStatusColor = (status) => {
    switch (status) {
      case "عالی":
        return "text-[#007BFF]";
      case "خوب":
        return "text-[#63AF42]";
      case "متوسط":
        return "text-[#D5A329]";
      case "ضعیف":
        return "text-[#F04444]";
      case "ثبت نشده":
        return "text-[#94A3B8]";
      default:
        return "text-[#63AF42]";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "عالی":
        return "bg-[#007BFF]";
      case "خوب":
        return "bg-[#63AF42]";
      case "متوسط":
        return "bg-[#D5A329]";
      case "ضعیف":
        return "bg-[#F04444]";
      case "ثبت نشده":
        return "bg-[#CBD5E1]";
      default:
        return "bg-[#63AF42]";
    }
  };

  const currentPoints = POINTS[active] || [];

  return (
    <div className="bg-white rounded-3xl flex flex-col justify-between p-4 h-full">
      <div className="flex justify-between items-center">
        <div className="text-2xl text-[#6B6F77] font-primary">{title}</div>
        <div className="p-5 flex justify-center items-center">
          <SegmentedControl item1={"جلو"} item2={"پشت"} onChange={(value) => { setActive(value); setSelectedId(null); }} />
        </div>
      </div>

      <div className="flex justify-center items-center mt-2">
        <div className="relative w-full overflow-hidden flex justify-center items-center">
          <div>
            <style>{`
              @keyframes bodyBreathe {
                0%, 100% { transform: scale(1) translateY(0); }
                50% { transform: scale(1.015) translateY(-4px); }
              }
              .body-breathe {
                animation: bodyBreathe 4.2s ease-in-out infinite;
                transform-origin: center bottom;
              }

              @keyframes pulse-ring {
                0% { transform: scale(0.8); opacity: 0.7; }
                100% { transform: scale(1.6); opacity: 0; }
              }
              .point-ring {
                animation: pulse-ring 2s ease-out infinite;
              }
            `}</style>

            <div className="body-breathe size-[850px] relative">
              {active === "جلو" ? (
                <img
                  className="w-full h-full p-1"
                  src={frontImage}
                  alt="جلو بدن"
                />
              ) : (
                <img
                  className="w-full h-full p-1"
                  src={backImage}
                  alt="پشت بدن"
                />
              )}

              {currentPoints.map((point) => {
                const data = muscles[point.id] || null;
                const status = statusFor(data?.score);
                const color = STATUS_COLOR[status];
                const isOpen = hoveredPoint === point.id || selectedId === point.id;
                return (
                  <div
                    key={point.id}
                    className="absolute group cursor-pointer"
                    style={{
                      left: point.x,
                      top: point.y,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => setHoveredPoint(point.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => { setSelectedId(point.id); if (onSelect) onSelect(point.id, data); }}
                  >
                    <div
                      className="absolute rounded-full point-ring"
                      style={{
                        width: "22px",
                        height: "22px",
                        left: "-25%",
                        top: "-12%",
                        border: `2px solid ${color}66`,
                        borderRadius: "50%",
                      }}
                    />

                    <div
                      className={`relative w-4 h-4 rounded-full ${getStatusBg(status)} shadow-[0_0_20px_rgba(0,123,255,0.6)] 
                                hover:shadow-[0_0_30px_rgba(0,123,255,0.9)] hover:scale-110 
                                transition-all duration-200 flex items-center justify-center`}
                      style={{ boxShadow: `0 0 20px ${color}99` }}
                    >
                      <div className="w-1 h-1 rounded-full bg-white opacity-80" />
                    </div>

                    <div
                      className={`
                      w-40 flex flex-col py-2 px-4 rounded-3xl absolute z-99
                      bg-white border-2 border-gray-200 shadow-xl
                      transition-all duration-200
                      ${
                        isOpen
                          ? "opacity-100 visible scale-100"
                          : "opacity-0 invisible scale-95"
                      }
                      group-hover:opacity-100 group-hover:visible group-hover:scale-100
                      bottom-full left-1/2 -translate-x-1/2 mb-3
                    `}
                    >
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 
                                  w-3 h-3 bg-white border-r-2 border-b-2 border-gray-200 
                                  rotate-45 z-99"
                      />

                      <h2 className="text-[#007BFF] font-bold text-sm text-center">
                        {point.label}
                      </h2>

                      <h3
                        className={`${getStatusColor(status)} font-semibold text-center text-sm`}
                      >
                        {status}
                        {data?.score !== null && data?.score !== undefined && data?.score !== "" ? ` · ${fa(data.score)} از ۱۰۰` : ""}
                      </h3>

                      <span className="text-gray-500 text-xs flex justify-end">
                        {data?.delta !== null && data?.delta !== undefined && data?.delta !== "" ? `تغییر: ${deltaText(data.delta, "امتیاز")}` : "تغییر ثبت نشده"}
                      </span>
                      {data?.size_cm ? (
                        <span className="text-gray-500 text-xs flex justify-end">
                          {fa(data.size_cm, 1)} سانتی‌متر
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-end gap-8 text-[#6B6F77] px-4 mt-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#007BFF]" />
          عالی
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#63AF42]" />
          خوب
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#D5A329]" />
          متوسط
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#F04444]" />
          ضعیف
        </div>
      </div>
    </div>
  );
}
