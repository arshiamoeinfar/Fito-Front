import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import WorkoutBuilder from "../../Components/CoachDashboard/programs/WorkoutBuilder";
import { api, ApiError } from "../../api/client";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  const fieldError = caught.errors
    ? Object.values(caught.errors).flat().find((item) => typeof item === "string")
    : null;

  return fieldError || caught.message;
}

function toLibrary(exercise) {
  const primary = (exercise.muscles || []).find((muscle) => muscle.involvement === "primary") || exercise.muscles?.[0];
  const owner = exercise.coach_profile_id ? "خصوصی" : "بانک";

  return {
    id: exercise.id,
    name: exercise.name,
    muscle: primary?.name_fa || "—",
    target: `${owner} · ${exercise.goal || ""}`,
    description: exercise.instructions || "",
  };
}

const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

function programBody(title, payload) {
  const days = weekdays.map((dayTitle, position) => {
    const items = (payload.plan || []).filter((item) => item.dayId === dayTitle);
    if (items.length === 0) {
      return null;
    }

    return {
      position,
      title: dayTitle,
      weekday: position,
      exercises: items.map((item, index) => ({
        position: index,
        exercise_id: Number(item.exerciseId),
        tracking_type: "weight_reps",
        prescribed_sets: Number(item.sets) || 1,
        reps_min: Number(item.reps) || 1,
        reps_max: Number(item.reps) || 1,
        rest_seconds: Number(item.rest) || 0,
        coach_note: item.note || null,
      })),
    };
  }).filter(Boolean);

  return { title, note: null, days };
}

const emptyPrivate = { name: "", instructions: "", goal: "", tracking_type: "weight_reps", muscle_id: "" };
const emptyRequest = { proposed_name: "", instructions: "", goal: "", tracking_type: "weight_reps" };

export default function WorkoutProgramBuilder() {
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [privateForm, setPrivateForm] = useState(emptyPrivate);
  const [requestForm, setRequestForm] = useState(emptyRequest);
  const [programTitle, setProgramTitle] = useState("برنامه تمرین");
  const [program, setProgram] = useState(null);
  const [canWrite, setCanWrite] = useState(false);

  useEffect(() => {
    let active = true;

    api("/api/v1/coach/access").then(
      (body) => {
        if (active) {
          setCanWrite(Array.isArray(body?.features) && body.features.includes("workout_programs"));
        }
      },
      () => {
        if (active) {
          setCanWrite(false);
        }
      },
    );

    api("/api/v1/coach/exercises").then(
      (body) => {
        if (active) {
          setExercises(Array.isArray(body?.exercises) ? body.exercises : []);
        }
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
        }
      },
    );

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const muscleChoices = [];
  exercises.forEach((exercise) => {
    (exercise.muscles || []).forEach((muscle) => {
      if (!muscleChoices.some((item) => item.muscle_id === muscle.muscle_id)) {
        muscleChoices.push(muscle);
      }
    });
  });

  async function run(action) {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await action();
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  function savePrivate(event) {
    event.preventDefault();
    run(async () => {
      await api("/api/v1/coach/exercises", {
        method: "POST",
        body: {
          name: privateForm.name.trim(),
          instructions: privateForm.instructions.trim(),
          goal: privateForm.goal.trim(),
          tracking_type: privateForm.tracking_type,
          muscles: [{ muscle_id: Number(privateForm.muscle_id), involvement: "primary" }],
        },
      });
      setPrivateForm(emptyPrivate);
      setNotice("حرکت خصوصی ذخیره شد.");
    });
  }

  async function saveDraft(payload) {
    if (!canWrite) {
      setError("نوشتن برنامه تمرین قفل است.");
      return;
    }
    const body = programBody(programTitle.trim() || "برنامه تمرین", payload);
    if (body.days.length === 0) {
      setError("حداقل یک حرکت در یک روز لازم است.");
      return;
    }

    await run(async () => {
      let current = program;
      if (current?.status === "published" && current.draft === null) {
        current = await api(`/api/v1/coach/workout-programs/${current.id}/draft`, { method: "POST" });
      }

      const saved = current?.draft
        ? await api(`/api/v1/coach/workout-programs/${current.id}`, { method: "PATCH", body })
        : await api("/api/v1/coach/workout-programs", { method: "POST", body });
      setProgram(saved);
      setNotice("پیش‌نویس ذخیره شد. نسخه منتشرشده درجا عوض نمی‌شود.");
    });
  }

  function publishProgram() {
    if (!program?.id) {
      return;
    }

    run(async () => {
      const saved = await api(`/api/v1/coach/workout-programs/${program.id}/publish`, { method: "POST" });
      setProgram(saved);
      setNotice(`نسخه ${saved.current_version?.version_number} منتشر شد.`);
    });
  }

  function sendRequest(event) {
    event.preventDefault();
    run(async () => {
      await api("/api/v1/coach/exercise-requests", {
        method: "POST",
        body: {
          proposed_name: requestForm.proposed_name.trim(),
          instructions: requestForm.instructions.trim(),
          goal: requestForm.goal.trim(),
          tracking_type: requestForm.tracking_type,
        },
      });
      setRequestForm(emptyRequest);
      setNotice("درخواست ورود به بانک ثبت شد و تا تأیید مدیر در بانک نیست.");
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="نوشتن برنامه" description="روزها و حرکت‌ها را اینجا بچین. بعد از تمام شدن، از صفحه برنامه‌ها آن را به شاگرد بده." />
            <p dir="rtl" className="col-span-12 text-right text-sm text-[#6B7280]">
              <Link to="/coach/programs" className="text-[#007BFF]">برگشت به برنامه‌ها</Link>
            </p>
            {error && <p dir="rtl" className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p>}
            {notice && <p dir="rtl" className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700">{notice}</p>}
            <section dir="rtl" className="col-span-12 grid gap-4 rounded-3xl bg-white p-7 text-right lg:grid-cols-2">
              <form onSubmit={savePrivate} className="grid gap-3">
                <h2 className="text-lg font-primary text-[#6B6F77]">حرکت خصوصی</h2>
                <input required value={privateForm.name} onChange={(event) => setPrivateForm({ ...privateForm, name: event.target.value })} placeholder="نام" className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                <input required value={privateForm.goal} onChange={(event) => setPrivateForm({ ...privateForm, goal: event.target.value })} placeholder="هدف" className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                <textarea required value={privateForm.instructions} onChange={(event) => setPrivateForm({ ...privateForm, instructions: event.target.value })} placeholder="آموزش" className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                <select value={privateForm.tracking_type} onChange={(event) => setPrivateForm({ ...privateForm, tracking_type: event.target.value })} className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm">
                  <option value="weight_reps">وزن و تکرار</option>
                  <option value="reps">تکرار</option>
                  <option value="duration">زمان</option>
                  <option value="distance">مسافت</option>
                </select>
                <input required inputMode="numeric" value={privateForm.muscle_id} onChange={(event) => setPrivateForm({ ...privateForm, muscle_id: event.target.value })} placeholder="شناسه عضله" className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                {muscleChoices.length > 0 && (
                  <p className="text-xs text-[#A0A4AA]">
                    عضله‌های دیده‌شده: {muscleChoices.map((muscle) => `${muscle.name_fa} (${muscle.muscle_id})`).join("، ")}
                  </p>
                )}
                <button type="submit" disabled={pending} className="w-fit rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60">ذخیره خصوصی</button>
              </form>
              <form onSubmit={sendRequest} className="grid gap-3">
                <h2 className="text-lg font-primary text-[#6B6F77]">درخواست ورود به بانک</h2>
                <input required value={requestForm.proposed_name} onChange={(event) => setRequestForm({ ...requestForm, proposed_name: event.target.value })} placeholder="نام پیشنهادی" className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                <input required value={requestForm.goal} onChange={(event) => setRequestForm({ ...requestForm, goal: event.target.value })} placeholder="هدف" className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                <textarea required value={requestForm.instructions} onChange={(event) => setRequestForm({ ...requestForm, instructions: event.target.value })} placeholder="آموزش" className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
                <select value={requestForm.tracking_type} onChange={(event) => setRequestForm({ ...requestForm, tracking_type: event.target.value })} className="rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm">
                  <option value="weight_reps">وزن و تکرار</option>
                  <option value="reps">تکرار</option>
                  <option value="duration">زمان</option>
                  <option value="distance">مسافت</option>
                </select>
                <button type="submit" disabled={pending} className="w-fit rounded-2xl border border-[#F0F2F5] bg-white px-5 py-2 text-sm text-[#6B6F77] disabled:opacity-60">ثبت درخواست</button>
              </form>
            </section>
          </div>
          <section dir="rtl" className="mb-4 rounded-3xl bg-white p-5 text-right">
            <h2 className="text-lg font-primary text-[#6B6F77]">تمام کردن برنامه</h2>
            <p className="mt-2 text-sm text-[#6B7280]">تا این دکمه را نزنی، برنامه آماده نیست و در فهرست دادن به شاگرد نمی‌آید.</p>
            {!canWrite && <p className="mt-2 text-sm text-[#6B6F77]">نوشتن برنامه تمرین قفل است.</p>}
            <input value={programTitle} onChange={(event) => setProgramTitle(event.target.value)} className="mt-3 w-full max-w-sm rounded-2xl border border-[#F0F2F5] px-4 py-3 text-sm" />
            <button type="button" disabled={!canWrite || pending || !program?.draft} onClick={publishProgram} className="mt-3 rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60">تمام شد، برنامه آماده است</button>
            {program?.current_version && (
              <div className="mt-4 rounded-2xl bg-[#F5F7FB] p-4 text-sm text-[#6B6F77]">
                <p>نسخه منتشرشده {program.current_version.version_number} فقط خواندنی است.</p>
                {program.current_version.days.map((day) => (
                  <p key={day.id} className="mt-1">{day.title}: {day.exercises.map((item) => item.exercise?.name || item.exercise_id).join("، ")}</p>
                ))}
              </div>
            )}
          </section>
          <WorkoutBuilder exercises={exercises.map(toLibrary)} students={[]} onSave={saveDraft} />
        </div>
      </div>
    </div>
  );
}
