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
    <div className="h-fit rounded-3xl bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
        <h2 className="text-xl font-medium text-[#6B6F77]">تمرینات امروز</h2>
        <div className="flex items-end gap-2 px-4 py-2">
          <img src={ElementLeg} alt="" className="h-4 w-4" />
          <span className="text-sm text-[#6B6F77]">{dayTitle}</span>
        </div>
        {startTraining ? (
          <button
            type="button"
            className="cursor-pointer rounded-full bg-[#007BFF] px-4 py-2 text-white transition hover:bg-[#0056A3]"
            onClick={() => navigate(startTo)}
          >
            شروع تمرین
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/trainingpage")}
            className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-[#6B6F77] transition hover:text-gray-700"
          >
            جزئیات تمرین
            <img src={Flesh} alt="" />
          </button>
        )}
      </div>

      <div className="mt-8 space-y-4">
        <hr className="text-gray-200" />
        {rows.length === 0 ? <p className="py-6 text-sm text-[#A0A4AA]">{emptyLabel}</p> : null}
        {rows.map((exercise, index) => (
          <div key={exercise.id} className="flex flex-col gap-3">
            <div className={`flex w-full flex-col gap-4 lg:flex-row lg:items-center ${hrTrue ? "py-4" : "mt-2"}`}>
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <img
                onClick={() => navigate(exercise.to || startTo)}
                src={exercise.image || ImgSquat}
                className="h-14 w-24 shrink-0 cursor-pointer rounded-xl object-cover sm:h-16 sm:w-28"
                alt=""
              />
              <div className="min-w-0">
                <h3
                  onClick={() => navigate(exercise.to || startTo)}
                  className="font-primary mb-2 cursor-pointer font-medium text-[#6B6F77]"
                >
                  {exercise.name}
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Stat icon={Dumbel} label={`${exercise.sets} ست`} />
                  <Stat icon={Refresh} label={`${exercise.reps} تکرار`} />
                  {exercise.rest != null && exercise.rest !== "—" ? <Stat icon={ClockCircle} label={`${exercise.rest} ثانیه استراحت`} /> : null}
                </div>
              </div>
              </div>
              {showRecord ? (
                <div className="flex w-full shrink-0 items-center justify-around gap-3 rounded-3xl bg-[#F2F8FD] p-4 sm:gap-8 lg:w-auto lg:justify-center">
                  <Record label="رکورد قبلی" value={exercise.previous ?? "—"} />
                  <Record label="رکورد فعلی" value={exercise.current ?? "—"} />
                  <Record label="پیشرفت" value={exercise.progress ?? "—"} />
                </div>
              ) : null}
            </div>
            {hrTrue && index !== rows.length - 1 ? <hr className="w-full text-gray-200" /> : null}
          </div>
        ))}
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
            className="flex cursor-pointer items-center justify-center gap-1.5 pt-1 text-sm text-[#9AA0A8] hover:text-[#6B6F77]"
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
    <div className="flex items-center gap-0.5">
      <img className="size-3.5" src={icon} alt="" />
      <p className="font-primary-ExtraLight text-[12px] font-medium text-[#6B6F77]">{label}</p>
    </div>
  );
}

function Record({ label, value }) {
  return (
    <div className="flex-col items-center justify-center">
      <h1 className="text-[#007BFF]">{label}</h1>
      <p className="text-sm text-[#6B6F77]">{value}</p>
    </div>
  );
}
