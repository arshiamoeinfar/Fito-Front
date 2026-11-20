
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Flesh from "../../../../assets/imges/flesh.svg";
import ImgSquat from "../../../../assets/imges/image 13.png";
import Dumbel from "../../../../assets/imges/Dumbbell Large Minimalistic.png";
import Refresh from "../../../../assets/imges/Refresh.svg";
import ClockCircle from "../../../../assets/imges/Clock Circle.svg";
import ElementLeg from "../../../../assets/imges/elements.png";
import WorkoutProgramModal from "../WorkoutProgramModal/WorkoutProgramModal";

const SAMPLE = [
  { id: 1, name: "اسکوات با هالتر", sets: 4, reps: 8, rest: 10, image: ImgSquat },
  { id: 2, name: "اسکوات با هالتر", sets: 4, reps: 8, rest: 10, image: ImgSquat },
  { id: 3, name: "اسکوات با هالتر", sets: 4, reps: 8, rest: 10, image: ImgSquat },
  { id: 4, name: "اسکوات با هالتر", sets: 4, reps: 8, rest: 10, image: ImgSquat },
];

export default function Mytrain({
  showRecord = false,
  startTraining = false,
  showDetail = false,
  hrTrue = false,
  exercises,
  dayTitle = "روز پا",
  startTo = "/dashboardAthlete/start-training",
  assignments = [],
  sessions = [],
  selectedId = "",
  loadError = "",
  ready = true,
  emptyLabel = "برای امروز حرکتی ثبت نشده.",
}) {
  const rows = exercises ?? SAMPLE;
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      dir="rtl"
      className="h-fit w-full min-w-0 overflow-hidden rounded-2xl bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6"
    >
      {/* Header */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
        <h2 className="font-primary min-w-0 text-base font-medium text-[#6B6F77] sm:text-lg lg:text-xl">
          تمرینات امروز
        </h2>

        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-[#F5F9FD] px-3 py-2">
          <img src={ElementLeg} alt="" className="h-4 w-4 object-contain" />
          <span className="text-xs text-[#6B6F77] sm:text-sm">{dayTitle}</span>
        </div>

        {startTraining ? (
          <button
            type="button"
            className="w-full cursor-pointer rounded-full bg-[#007BFF] px-4 py-2.5 text-sm text-white transition hover:bg-[#0056A3] sm:w-auto"
            onClick={() => navigate(startTo)}
          >
            شروع تمرین
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/trainingpage")}
            className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-[#6B6F77] transition hover:text-gray-700 sm:text-sm"
          >
            جزئیات تمرین
            <img src={Flesh} alt="" className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Exercises */}
      <div className="mt-5 min-w-0 space-y-3 sm:mt-7 sm:space-y-4">
        <hr className="border-0 border-t border-gray-200" />

        {rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#A0A4AA] sm:text-sm">
            {emptyLabel}
          </p>
        ) : null}

        {rows.map((exercise, index) => (
          <div key={exercise.id} className="flex min-w-0 flex-col gap-3">
            <div
              className={`flex min-w-0 w-full flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center ${
                hrTrue ? "py-3 sm:py-4" : "pt-1 sm:mt-2"
              }`}
            >
              {/* Exercise info */}
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <img
                  onClick={() => navigate(exercise.to || startTo)}
                  src={exercise.image || ImgSquat}
                  className="h-14 w-20 shrink-0 cursor-pointer rounded-xl object-cover sm:h-16 sm:w-24 lg:w-28"
                  alt=""
                />

                <div className="min-w-0 flex-1">
                  <h3
                    onClick={() => navigate(exercise.to || startTo)}
                    className="font-primary mb-2 cursor-pointer break-words text-sm font-medium text-[#6B6F77] sm:text-base"
                  >
                    {exercise.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
                    <Stat icon={Dumbel} label={`${exercise.sets} ست`} />
                    <Stat icon={Refresh} label={`${exercise.reps} تکرار`} />
                    {exercise.rest != null && exercise.rest !== "—" ? (
                      <Stat
                        icon={ClockCircle}
                        label={`${exercise.rest} ثانیه استراحت`}
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Records */}
              {showRecord ? (
                <div className="grid w-full shrink-0 grid-cols-3 gap-2 rounded-2xl bg-[#F2F8FD] p-3 sm:gap-4 sm:rounded-3xl sm:p-4 lg:w-auto lg:min-w-[310px] lg:gap-6">
                  <Record label="رکورد قبلی" value={exercise.previous ?? "—"} />
                  <Record label="رکورد فعلی" value={exercise.current ?? "—"} />
                  <Record label="پیشرفت" value={exercise.progress ?? "—"} />
                </div>
              ) : null}
            </div>

            {hrTrue && index !== rows.length - 1 ? (
              <hr className="border-0 border-t border-gray-200" />
            ) : null}
          </div>
        ))}

        {/* Show all */}
        {showDetail ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsProgramModalOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsProgramModalOpen(true);
              }
            }}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 pt-3 text-xs text-[#9AA0A8] transition hover:text-[#6B6F77] sm:text-sm"
          >
            <span>مشاهده همه تمرینات</span>
            <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
          </div>
        ) : null}

        <WorkoutProgramModal
          showModal={isProgramModalOpen}
          setShowModal={setIsProgramModalOpen}
          assignments={assignments}
          sessions={sessions}
          selectedId={selectedId}
          loadError={loadError}
          ready={ready}
        />
      </div>
    </div>
  );
}

function Stat({ icon, label }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <img className="h-3.5 w-3.5 shrink-0 object-contain" src={icon} alt="" />
      <p className="font-primary-ExtraLight whitespace-nowrap text-[10px] font-medium text-[#6B6F77] sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function Record({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 text-center">
      <h3 className="whitespace-nowrap text-[10px] font-medium text-[#007BFF] sm:text-xs">
        {label}
      </h3>
      <p className="break-words text-xs text-[#6B6F77] sm:text-sm">{value}</p>
    </div>
  );
}
