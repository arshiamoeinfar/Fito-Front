import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import ExerciseLibrary from "../../Components/CoachDashboard/programs/ExerciseLibrary";
import imgExercise from "../../assets/imges/image 13.png";
import { api, ApiError } from "../../api/client";

function exerciseImage(exercise) {
  const media = (exercise.media || []).find((item) => item.media_type === "image" && item.path);

  return media ? `/storage/${media.path}` : imgExercise;
}

function toCard(exercise) {
  const muscles = exercise.muscles || [];
  const primary = muscles.find((muscle) => muscle.involvement === "primary") || muscles[0];
  const muscle = primary?.name_fa || "عمومی";
  const secondaryMuscles = muscles
    .filter((item) => item.involvement === "secondary" && item.name_fa && item.name_fa !== muscle)
    .map((item) => item.name_fa);
  const steps = String(exercise.instructions || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    id: exercise.id,
    name: exercise.name,
    muscle,
    secondaryMuscles,
    trackingType: exercise.tracking_type || "",
    goal: exercise.goal || "",
    target: `عضله هدف: ${muscle}`,
    description: exercise.goal || steps[0] || "",
    instructions: steps,
    image: exerciseImage(exercise),
  };
}

export default function CoachExerciseBank() {
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("همه");

  useEffect(() => {
    let active = true;

    api("/api/v1/coach/exercises").then(
      (body) => {
        if (active) {
          setExercises(Array.isArray(body?.exercises) ? body.exercises : []);
        }
      },
      (caught) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "درخواست ناموفق بود.");
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="بانک حرکات" description="کارت‌های بانک و آموزش حرکت، همان قالب اصلی." />
            <div dir="rtl" className="col-span-12">
              <Link to="/coach/programs" className="text-sm text-[#007BFF]">برگشت به برنامه‌ها</Link>
            </div>
            {error && <p dir="rtl" className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p>}
            <div className="col-span-12">
              <ExerciseLibrary
                exercises={exercises.map(toCard)}
                search={search}
                onSearchChange={setSearch}
                activeMuscle={muscle}
                onMuscleChange={setMuscle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
