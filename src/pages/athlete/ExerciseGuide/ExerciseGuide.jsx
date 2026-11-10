import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api } from "../../../api/client";

function mediaSrc(path) {
  if (typeof path !== "string") return "";
  const value = path.trim();
  if (value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/")) return value;
  return "";
}

function placementsFor(assignments, exerciseId) {
  const rows = [];
  for (const assignment of assignments) {
    for (const day of assignment.version?.days ?? []) {
      for (const item of day.exercises ?? []) {
        const id = item.exercise?.id ?? item.exercise_id;
        if (String(id) === String(exerciseId)) {
          rows.push({ assignment, day, item });
        }
      }
    }
  }
  return rows;
}

function doseLine(item) {
  const parts = [];
  if (item.prescribed_sets) parts.push(`${item.prescribed_sets} ست`);
  if (item.reps_min != null && item.reps_max != null && item.reps_min !== item.reps_max) {
    parts.push(`${item.reps_min} تا ${item.reps_max} تکرار`);
  } else if (item.reps_min != null || item.reps_max != null) {
    parts.push(`${item.reps_min ?? item.reps_max} تکرار`);
  }
  if (item.rest_seconds) parts.push(`${item.rest_seconds} ثانیه استراحت`);
  if (item.target_weight_g != null) parts.push(`${item.target_weight_g / 1000} کیلوگرم`);
  if (item.duration_seconds) parts.push(`${item.duration_seconds} ثانیه`);
  if (item.distance_m) parts.push(`${item.distance_m} متر`);
  return parts.join(" · ");
}

export default function ExerciseGuide() {
  const { exerciseId } = useParams();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    api("/api/v1/athlete/workout-assignments").then((body) => {
      if (!active) return;
      setRows(placementsFor(body.assignments ?? [], exerciseId));
      setReady(true);
    }).catch((caught) => {
      if (!active) return;
      setError(caught.message);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [exerciseId]);

  const first = rows[0] ?? null;
  const exercise = first?.item?.exercise ?? null;
  const fromBank = Boolean(exercise?.from_bank);
  const muscles = exercise?.muscles ?? [];
  const primary = muscles.filter((muscle) => muscle.involvement === "primary").map((muscle) => muscle.name_fa);
  const secondary = muscles.filter((muscle) => muscle.involvement !== "primary").map((muscle) => muscle.name_fa);
  const media = (exercise?.media ?? [])
    .map((item) => ({ ...item, src: mediaSrc(item.path) }))
    .filter((item) => item.src);
  const paragraphs = String(exercise?.instructions ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6" dir="rtl">
            <HeaderDashBoard title="آموزش حرکت" description={fromBank ? "از بانک حرکات" : "حرکت برنامه تو"} />
            <div className="col-span-12">
              <Link className="text-sm text-[#007BFF]" to="/trainingpage">بازگشت به برنامه</Link>
            </div>
            {error ? <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-sm text-red-700">{error}</p> : null}
            {!ready ? <p className="col-span-12 rounded-3xl bg-white px-6 py-5 text-sm text-[#6B6F77]">در حال خواندن آموزش</p> : null}
            {ready && !error && !exercise ? (
              <section className="col-span-12 rounded-3xl bg-white px-6 py-10">
                <h2 className="text-2xl text-[#4B5563]">این حرکت در برنامه تو نیست</h2>
                <p className="mt-2 text-sm text-[#A0A4AA]">آموزش فقط برای حرکت‌هایی باز می‌شود که در برنامه تمرین تو آمده‌اند.</p>
              </section>
            ) : null}
            {exercise ? (
              <section className="col-span-12 overflow-hidden rounded-3xl bg-white shadow-sm xl:col-span-8">
                {media[0]?.media_type === "image" ? <img className="h-72 w-full object-cover" src={media[0].src} alt="" /> : null}
                {media[0]?.media_type === "video" ? <video className="h-72 w-full bg-black" src={media[0].src} controls /> : null}
                <div className="p-6">
                  <p className="text-sm text-[#007BFF]">{fromBank ? "بانک حرکات" : "حرکت اختصاصی مربی"}</p>
                  <h2 className="mt-2 text-3xl text-[#1F2937]">{exercise.name}</h2>
                  {exercise.goal ? (
                    <div className="mt-6">
                      <h3 className="text-sm text-[#A0A4AA]">هدف</h3>
                      <p className="mt-2 text-sm leading-7 text-[#4B5563]">{exercise.goal}</p>
                    </div>
                  ) : null}
                  <div className="mt-6">
                    <h3 className="text-sm text-[#A0A4AA]">چطور انجام شود</h3>
                    {paragraphs.length ? (
                      <div className="mt-2 space-y-3">
                        {paragraphs.map((line, index) => <p key={`${index}-${line}`} className="text-sm leading-7 text-[#4B5563]">{line}</p>)}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#A0A4AA]">برای این حرکت هنوز متن آموزش ثبت نشده.</p>
                    )}
                  </div>
                  {primary.length || secondary.length ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {primary.map((name) => <span key={`p-${name}`} className="rounded-full bg-[#E8F1FF] px-3 py-1 text-xs text-[#007BFF]">{name}</span>)}
                      {secondary.map((name) => <span key={`s-${name}`} className="rounded-full bg-[#F5F7FB] px-3 py-1 text-xs text-[#6B6F77]">{name}</span>)}
                    </div>
                  ) : null}
                  {media.length > 1 ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {media.slice(1).map((item) => (
                        item.media_type === "video"
                          ? <video key={item.id} className="w-full rounded-2xl bg-black" src={item.src} controls />
                          : <img key={item.id} className="h-40 w-full rounded-2xl object-cover" src={item.src} alt="" />
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
            {rows.length ? (
              <aside className="col-span-12 rounded-3xl bg-white p-6 shadow-sm xl:col-span-4">
                <h3 className="text-lg text-[#4B5563]">در برنامه تو</h3>
                <ul className="mt-4 space-y-3">
                  {rows.map(({ assignment, day, item }) => (
                    <li key={item.id} className="rounded-2xl bg-[#F5F7FB] px-4 py-3">
                      <p className="text-sm text-[#1F2937]">{assignment.program?.title || "برنامه تمرین"}</p>
                      <p className="mt-1 text-xs text-[#6B6F77]">{day.title || "روز تمرین"}</p>
                      {doseLine(item) ? <p className="mt-2 text-xs text-[#A0A4AA]">{doseLine(item)}</p> : null}
                      {item.coach_note ? <p className="mt-2 text-xs text-[#6B6F77]">{item.coach_note}</p> : null}
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
