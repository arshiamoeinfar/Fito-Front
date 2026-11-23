import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import ExerciseLibrary from "../../Components/CoachDashboard/programs/ExerciseLibrary";
import WorkoutHeader from "../../Components/CoachDashboard/programs/WorkoutHeader";
import WorkoutPlanTable from "../../Components/CoachDashboard/programs/WorkoutPlanTable";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import imgExercise from "../../assets/imges/image 13.png";
import { api, ApiError } from "../../api/client";
import JalaliField from "../../Components/shared/JalaliField/JalaliField";
import { showDate } from "../../lib/jalali";

const WEEK = [
  { weekday: 0, name: "شنبه", hint: "مثلاً روز پا" },
  { weekday: 1, name: "یکشنبه", hint: "مثلاً روز سینه" },
  { weekday: 2, name: "دوشنبه", hint: "مثلاً روز پشت" },
  { weekday: 3, name: "سه‌شنبه", hint: "مثلاً هوازی" },
  { weekday: 4, name: "چهارشنبه", hint: "مثلاً روز شانه" },
  { weekday: 5, name: "پنجشنبه", hint: "مثلاً روز دست" },
  { weekday: 6, name: "جمعه", hint: "مثلاً استراحت" },
];

// ارتفاع ۴۴ پیکسل برای لمس راحت، و text-base روی موبایل تا iOS هنگام فوکوس زوم نکند
const field =
  "min-h-11 w-full rounded-2xl border border-[#E3E8F0] bg-white px-4 py-3 text-base text-[#1F2937] outline-none transition focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/15 sm:text-sm";

function errorText(caught) {
  if (caught instanceof ApiError) {
    return caught.message;
  }

  if (caught instanceof Error && caught.message) {
    return caught.message;
  }

  return "درخواست ناموفق بود.";
}

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function blankMove() {
  return { name: "", sets: "3", reps: "10", rest: "", weight: "", note: "", muscle: "" };
}

function blankWeek() {
  return WEEK.map((day) => ({
    weekday: day.weekday,
    name: day.name,
    focus: "",
    moves: [blankMove()],
  }));
}

function slotIndex(day) {
  if (Number.isInteger(day?.weekday) && day.weekday >= 0 && day.weekday <= 6) {
    return day.weekday;
  }

  const byName = WEEK.findIndex((item) => item.name === day?.title);

  return byName === -1 ? null : byName;
}

function movesFrom(day) {
  const moves = (day?.exercises || []).map((item) => {
    const min = item.reps_min;
    const max = item.reps_max;
    let reps = "";

    if (item.tracking_type === "duration" && item.duration_seconds) {
      reps = String(item.duration_seconds);
    } else if (item.tracking_type === "distance" && item.distance_m) {
      reps = String(item.distance_m);
    } else if (min && max && min !== max) {
      reps = `${min}-${max}`;
    } else if (min) {
      reps = String(min);
    }

    return {
      name: item.exercise?.name || "",
      sets: item.prescribed_sets ? String(item.prescribed_sets) : "",
      reps,
      rest: item.rest_seconds != null ? String(item.rest_seconds) : "",
      weight: item.target_weight_g ? String(item.target_weight_g / 1000) : "",
      note: item.coach_note || "",
      muscle: "",
    };
  });

  return moves.length ? moves : [blankMove()];
}

function repsRange(text) {
  const parts = String(text).trim().split("-").map((part) => Number(part.trim()));

  if (parts.length === 2 && parts.every((part) => Number.isInteger(part) && part >= 1) && parts[0] <= parts[1]) {
    return { reps_min: parts[0], reps_max: parts[1] };
  }

  const single = Number(String(text).trim());

  if (Number.isInteger(single) && single >= 1) {
    return { reps_min: single, reps_max: single };
  }

  return null;
}

function versionToDays(version) {
  const slots = blankWeek();
  const extras = [];

  (version?.days || []).forEach((day) => {
    const index = slotIndex(day);
    const weekDay = index === null ? null : WEEK[index];
    const title = day.title || "";
    const slot = {
      weekday: weekDay ? weekDay.weekday : null,
      name: weekDay ? weekDay.name : (title || "روز"),
      focus: weekDay && title === weekDay.name ? "" : title,
      moves: movesFrom(day),
    };

    if (index === null || slots[index].focus || slots[index].moves.some((move) => move.name)) {
      extras.push(slot);
      return;
    }

    slots[index] = slot;
  });

  return [...slots, ...extras];
}

function periodText(row) {
  const end = row.ends_on || (row.status === "active" ? "باز" : "ثبت نشده");

  return `شروع ${showDate(row.starts_on)} · اتمام ${row.ends_on ? showDate(row.ends_on) : end}`;
}

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

function muscleIdFrom(library) {
  for (const exercise of library) {
    const muscleId = exercise.muscles?.[0]?.muscle_id;

    if (muscleId) {
      return muscleId;
    }
  }

  return null;
}

/* ───────────── اجزای کوچک رابط ───────────── */

function Banner({ tone, onClose, children }) {
  const styles =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-400"
      : "border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus-visible:ring-emerald-500";

  return (
    <div
      dir="rtl"
      role={tone === "error" ? "alert" : "status"}
      className={`col-span-12 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 text-right text-sm leading-7 sm:rounded-3xl sm:px-6 sm:py-4 ${styles.split(" hover:")[0]}`}
    >
      <p className="min-w-0 break-words">{children}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن پیام"
        className={`-m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition focus:outline-none focus-visible:ring-2 ${styles
          .split(" ")
          .filter((cls) => cls.startsWith("hover:") || cls.startsWith("focus-visible:"))
          .join(" ")}`}
      >
        <X size={18} />
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div dir="rtl" className="col-span-12 flex animate-pulse flex-col gap-4" role="status" aria-label="در حال آوردن برنامه">
      <div className="h-24 rounded-2xl bg-white sm:h-28" />
      <div className="h-64 rounded-2xl bg-white sm:h-80" />
      <div className="h-48 rounded-2xl bg-white" />
    </div>
  );
}

export default function CoachProgram() {
  const { programId } = useParams();
  const [searchParams] = useSearchParams();
  const forId = searchParams.get("for");
  const navigate = useNavigate();
  const isNew = programId === "new";
  const [forStudent, setForStudent] = useState(null);
  const [title, setTitle] = useState("برنامه تمرین");
  const [days, setDays] = useState(blankWeek);
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [holders, setHolders] = useState([]);
  const [studentId, setStudentId] = useState("");
  const suggestionCache = useRef(new Map());
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState("");
  const [bankDay, setBankDay] = useState(0);
  const [bankSearch, setBankSearch] = useState("");
  const [bankMuscle, setBankMuscle] = useState("همه");
  const [studentSearch, setStudentSearch] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    let active = true;

    const extras = Promise.all([
      api("/api/v1/coach/exercises"),
      api("/api/v1/coach/relationships"),
      api("/api/v1/coach/workout-assignments"),
    ]);

    const programRequest = isNew ? Promise.resolve(null) : api(`/api/v1/coach/workout-programs/${programId}`);

    Promise.all([programRequest, extras]).then(
      ([body, [exerciseBody, relationshipBody, assignmentBody]]) => {
        if (!active) {
          return;
        }

        const library = Array.isArray(exerciseBody?.exercises) ? exerciseBody.exercises : [];
        const relationships = Array.isArray(relationshipBody?.relationships) ? relationshipBody.relationships : [];
        const assignments = Array.isArray(assignmentBody?.assignments) ? assignmentBody.assignments : [];

        setExercises(library);
        setStudents(relationships.filter((row) => row.status === "active"));
        const target = forId ? relationships.find((row) => String(row.id) === String(forId)) : null;
        setForStudent(target?.status === "active" ? target : null);

        if (target?.status === "active") {
          setStudentId(String(target.id));
          if (!body) {
            const name = target.athlete?.display_name || "این شاگرد";
            setTitle(`برنامه تمرین ${name}`);
          }
        }

        if (forId && !target) {
          setError("این شاگرد پیدا نشد.");
        }

        if (target && target.status !== "active") {
          setError("رابطه این شاگرد فعال نیست. برنامه برای او ثبت نمی‌شود.");
        }

        if (body) {
          const source = body.draft || body.current_version;
          setProgram(body);
          setTitle(body.title || "برنامه تمرین");
          setDays(versionToDays(source));
          setHolders(assignments.filter((row) => String(row.program?.id) === String(body.id)));
        }

        setLoaded(true);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
          setLoaded(true);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [forId, isNew, programId]);

  function updateDay(index, patch) {
    setDays((current) => current.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)));
  }

  function updateMove(dayIndex, moveIndex, patch) {
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) {
        return day;
      }

      return {
        ...day,
        moves: day.moves.map((move, itemIndex) => (itemIndex === moveIndex ? { ...move, ...patch } : move)),
      };
    }));
  }

  useEffect(() => {
    suggestionCache.current.clear();
  }, [studentId]);

  async function loadSuggestion(exerciseId) {
    if (!studentId) {
      return null;
    }

    const key = `${studentId}:${exerciseId}`;

    if (suggestionCache.current.has(key)) {
      return suggestionCache.current.get(key);
    }

    try {
      const body = await api(`/api/v1/coach/relationships/${studentId}/exercise-suggestions?exercise_id=${exerciseId}`);
      suggestionCache.current.set(key, body);
      return body;
    } catch {
      return null;
    }
  }

  function addFromBank(exercise) {
    const move = {
      name: exercise.name || "",
      sets: exercise.sets != null && exercise.sets !== "" ? String(exercise.sets) : "3",
      reps: exercise.reps != null && exercise.reps !== "" ? String(exercise.reps) : "10",
      rest: exercise.rest != null && exercise.rest !== "" ? String(exercise.rest) : "60",
      weight: exercise.weight != null && exercise.weight !== "" ? String(exercise.weight) : "",
      note: "",
      muscle: exercise.muscle || "",
    };

    setDays((current) => current.map((day, index) => {
      if (index !== bankDay) {
        return day;
      }

      const empty = day.moves.findIndex((item) => !item.name.trim());

      if (empty >= 0) {
        return {
          ...day,
          moves: day.moves.map((item, moveIndex) => (moveIndex === empty ? move : item)),
        };
      }

      return { ...day, moves: [...day.moves, move] };
    }));
  }

  function addMove(dayIndex) {
    setDays((current) => current.map((day, index) => (
      index === dayIndex ? { ...day, moves: [...day.moves, blankMove()] } : day
    )));
  }

  function removeMove(dayIndex, moveIndex) {
    setDays((current) => current.map((day, index) => {
      if (index !== dayIndex) {
        return day;
      }

      const moves = day.moves.filter((_, itemIndex) => itemIndex !== moveIndex);

      return { ...day, moves: moves.length ? moves : [blankMove()] };
    }));
  }

  async function exerciseFor(name, library) {
    const trimmed = name.trim();
    const found = library.find((item) => item.name.trim() === trimmed);

    if (found) {
      return found;
    }

    const muscleId = muscleIdFrom(library);

    if (!muscleId) {
      throw new Error("این نام در حرکت‌های موجود نیست. یک نام آشنا بنویس، یا اول یک حرکت با عضله در سامانه داشته باش.");
    }

    const created = await api("/api/v1/coach/exercises", {
      method: "POST",
      body: {
        name: trimmed,
        instructions: trimmed,
        goal: "تمرین",
        tracking_type: "weight_reps",
        muscles: [{ muscle_id: muscleId, involvement: "primary" }],
      },
    });

    library.push(created);

    return created;
  }

  async function daysPayload(library) {
    const prepared = [];

    for (const day of days) {
      const named = day.moves.filter((move) => move.name.trim());

      if (!named.length) {
        if (day.focus.trim()) {
          throw new Error(`${day.name} را «${day.focus.trim()}» گذاشتی ولی حرکتی ننوشتی. یک حرکت اضافه کن، یا عنوان را پاک کن تا آن روز استراحت بماند.`);
        }

        continue;
      }

      const exercisesForDay = [];

      for (const move of named) {
        const exercise = await exerciseFor(move.name, library);
        const tracking = exercise.tracking_type || "weight_reps";
        const row = {
          position: exercisesForDay.length,
          exercise_id: exercise.id,
          tracking_type: tracking,
        };

        if (move.note.trim()) {
          row.coach_note = move.note.trim();
        }

        const rest = Number(move.rest);
        if (move.rest !== "" && move.rest != null && Number.isInteger(rest) && rest >= 0) {
          row.rest_seconds = rest;
        }

        const kilos = Number(String(move.weight ?? "").replace(",", "."));
        if (move.weight !== "" && move.weight != null && Number.isFinite(kilos) && kilos > 0) {
          row.target_weight_g = Math.round(kilos * 1000);
        }

        if (tracking === "duration") {
          const seconds = Number(move.reps);

          if (!Number.isInteger(seconds) || seconds < 1) {
            throw new Error(`برای «${move.name}» ثانیه را با عدد بنویس.`);
          }

          row.duration_seconds = seconds;
        } else if (tracking === "distance") {
          const meters = Number(move.reps);

          if (!Number.isInteger(meters) || meters < 1) {
            throw new Error(`برای «${move.name}» متر را با عدد بنویس.`);
          }

          row.distance_m = meters;
        } else {
          const reps = repsRange(move.reps || "10");

          if (!reps) {
            throw new Error(`تکرار «${move.name}» را مثل ۱۰ یا ۸-۱۲ بنویس.`);
          }

          row.reps_min = reps.reps_min;
          row.reps_max = reps.reps_max;

          if (String(move.sets).trim() !== "") {
            const sets = Number(move.sets);

            if (!Number.isInteger(sets) || sets < 1) {
              throw new Error(`ست «${move.name}» باید عدد باشد.`);
            }

            row.prescribed_sets = sets;
          }
        }

        exercisesForDay.push(row);
      }

      prepared.push({
        position: prepared.length,
        weekday: day.weekday,
        title: day.focus.trim() || day.name,
        exercises: exercisesForDay,
      });
    }

    if (!prepared.length) {
      throw new Error("حداقل یک روز و یک حرکت بنویس.");
    }

    return prepared;
  }

  async function persist() {
    const library = exercises.slice();
    const payload = {
      title: title.trim() || "برنامه تمرین",
      days: await daysPayload(library),
    };
    let saved;

    if (isNew) {
      saved = await api("/api/v1/coach/workout-programs", { method: "POST", body: payload });
    } else {
      let current = program;

      if (!current) {
        throw new Error("برنامه پیدا نشد.");
      }

      if (current.current_version_id && !current.draft) {
        current = await api(`/api/v1/coach/workout-programs/${current.id}/draft`, { method: "POST" });
      }

      saved = await api(`/api/v1/coach/workout-programs/${current.id}`, { method: "PATCH", body: payload });
    }

    setExercises(library);
    setProgram(saved);
    setTitle(saved.title || payload.title);
    setDays(versionToDays(saved.draft || saved.current_version));

    return saved;
  }

  async function save(event) {
    event?.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const saved = await persist();

      if (isNew) {
        navigate(`/coach/programs/${saved.id}${forId ? `?for=${forId}` : ""}`, { replace: true });
        return;
      }

      setNotice("ذخیره شد. تا وقتی برای شاگرد ثبتش نکنی، او این ویرایش را نمی‌بیند.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function markReady() {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const saved = await persist();
      const published = await api(`/api/v1/coach/workout-programs/${saved.id}/publish`, { method: "POST" });
      setProgram(published);
      setDays(versionToDays(published.current_version));

      const assignee = students.find((row) => String(row.id) === String(studentId)) || forStudent;
      if (assignee) {
        const name = assignee.athlete?.display_name || "این شاگرد";
        await api("/api/v1/coach/workout-assignments", {
          method: "POST",
          body: {
            coaching_relationship_id: assignee.id,
            workout_program_version_id: published.current_version_id,
            starts_on: today(),
          },
        });
        navigate(`/coach/athletes/${assignee.id}`, { state: { programNotice: `برنامه تمرین برای ${name} ثبت شد.` } });
        return;
      }

      if (isNew) {
        navigate(`/coach/programs/${published.id}`, { replace: true });
        return;
      }

      setNotice("برنامه آماده شد. از پایین آن را به شاگرد بده.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function give(event) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await api("/api/v1/coach/workout-assignments", {
        method: "POST",
        body: {
          coaching_relationship_id: Number(studentId),
          workout_program_version_id: program.current_version_id,
          starts_on: startsOn,
          ...(endsOn ? { ends_on: endsOn } : {}),
        },
      });
      const body = await api("/api/v1/coach/workout-assignments");
      const assignments = Array.isArray(body?.assignments) ? body.assignments : [];
      setHolders(assignments.filter((row) => String(row.program?.id) === String(program.id)));
      setNotice("از این تاریخ این برنامه دست شاگرد است.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  const activeDay = days[bankDay] || days[0];
  const planItems = (activeDay?.moves || [])
    .map((move, index) => ({ move, index }))
    .filter(({ move }) => move.name.trim())
    .map(({ move, index }) => {
      const known = exercises.find((item) => item.name.trim() === move.name.trim());

      return {
        id: `${bankDay}-${index}`,
        name: move.name,
        muscle: move.muscle || (known ? toCard(known).muscle : ""),
        sets: move.sets,
        reps: move.reps,
        rest: move.rest,
        weight: move.weight || "",
        note: move.note || "",
        system: "",
      };
    });
  const moveCount = days.reduce((sum, day) => sum + day.moves.filter((move) => move.name.trim()).length, 0);
  const builderStudents = students.map((row) => ({
    id: String(row.id),
    name: row.athlete?.display_name || "شاگرد",
    subtitle: "شاگرد فعال",
  }));
  const selectedStudent = builderStudents.find((row) => row.id === String(studentId || ""));

  function updatePlanItem(id, fieldName, value) {
    const index = Number(String(id).split("-")[1]);
    updateMove(bankDay, index, { [fieldName]: value === "" || value == null ? "" : String(value) });
  }

  function removePlanItem(id) {
    removeMove(bankDay, Number(String(id).split("-")[1]));
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-3 bg-[#F5F7FB] px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-1 lg:py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard title={isNew ? "ساخت برنامه تمرینی" : (title || "ساخت برنامه تمرینی")} description="برنامه تمرینی و تغذیه‌ای شاگرد را بسازید." />

            <div dir="rtl" className="col-span-12">
              <Link
                to={forStudent ? `/coach/athletes/${forStudent.id}` : "/coach/programs"}
                className="-mx-2 inline-flex min-h-10 items-center gap-1 rounded-xl px-2 text-sm font-medium text-[#007BFF] transition hover:bg-[#EEF6FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
              >
                <ChevronRight size={18} aria-hidden="true" />
                {forStudent ? "برگشت به صفحهٔ این شاگرد" : "برگشت به برنامه‌ها"}
              </Link>
            </div>

            {error && <Banner tone="error" onClose={() => setError(null)}>{error}</Banner>}
            {notice && <Banner tone="success" onClose={() => setNotice(null)}>{notice}</Banner>}
            {!loaded && <LoadingSkeleton />}

            {loaded && (isNew || program) && (
              <div dir="rtl" className="col-span-12 flex min-w-0 flex-col gap-4">
                <WorkoutHeader
                  weekdays={WEEK.map((day) => day.name)}
                  activeDay={activeDay?.name || "شنبه"}
                  onDayChange={(name) => {
                    const index = days.findIndex((day) => day.name === name);
                    if (index >= 0) setBankDay(index);
                  }}
                  students={builderStudents}
                  selectedStudentId={String(studentId || "")}
                  onStudentChange={(id) => setStudentId(String(id))}
                  studentSearch={studentSearch}
                  onStudentSearchChange={setStudentSearch}
                />
                <ExerciseLibrary
                  exercises={exercises.map(toCard)}
                  search={bankSearch}
                  onSearchChange={setBankSearch}
                  activeMuscle={bankMuscle}
                  onMuscleChange={setBankMuscle}
                  onAddExercise={addFromBank}
                  studentId={String(studentId || "")}
                  studentName={selectedStudent?.name || ""}
                  loadSuggestion={loadSuggestion}
                />
                <WorkoutPlanTable
                  day={activeDay?.name || "شنبه"}
                  items={planItems}
                  onUpdate={updatePlanItem}
                  onRemove={removePlanItem}
                />

                {/* نوار ذخیره: روی موبایل و تبلت پایین صفحه می‌چسبد تا همیشه در دسترس باشد */}
                <div className="sticky bottom-2 z-20 flex flex-col gap-3 rounded-2xl border border-[#E7EBF0] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_8px_30px_-12px_rgba(16,24,40,0.25)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4 lg:static lg:shadow-sm">
                  <div className="text-xs leading-6 text-[#6B6F77]" aria-live="polite">
                    <p className="font-medium text-[#1F2937]">
                      {`روز ${activeDay?.name || "شنبه"} · ${planItems.length} حرکت`}
                    </p>
                    <p>{`در کل هفته ${moveCount} حرکت`}</p>
                  </div>
                  <button
                    type="button"
                    onClick={markReady}
                    disabled={pending || moveCount === 0}
                    aria-busy={pending}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0069d9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    {pending ? (
                      <>
                        <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />
                        در حال ذخیره
                      </>
                    ) : (
                      <>
                        <Check size={16} aria-hidden="true" />
                        ذخیره برنامه
                        <ChevronLeft size={16} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {program?.current_version_id && (
              <section
                dir="rtl"
                aria-labelledby="give-title"
                className="col-span-12 rounded-2xl border border-[#E7EBF0] bg-white p-4 text-right shadow-sm sm:p-5 lg:p-6"
              >
                <h2 id="give-title" className="text-base font-semibold text-[#1F2937]">دادن همین برنامه به شاگرد</h2>
                <p className="mt-1 max-w-2xl text-xs leading-6 text-[#6B6F77]">
                  همین هفته را می‌توانی به یک شاگرد بدهی یا به چند شاگرد. اگر کسی برنامهٔ دیگری می‌خواهد، از فهرست یک برنامهٔ جدا بنویس.
                </p>

                <form onSubmit={give} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="grid min-w-0 gap-2 text-xs text-[#6B6F77] sm:col-span-2 lg:col-span-1">
                    شاگرد
                    <select required value={studentId} onChange={(event) => setStudentId(event.target.value)} className={field}>
                      <option value="">انتخاب شاگرد</option>
                      {students.map((row) => (
                        <option key={row.id} value={row.id}>{row.athlete?.display_name || "شاگرد"}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid min-w-0 gap-2 text-xs text-[#6B6F77]">
                    شروع
                    <JalaliField required value={startsOn} onChange={setStartsOn} className={field} />
                  </label>
                  <label className="grid min-w-0 gap-2 text-xs text-[#6B6F77]">
                    اتمام، اگر از الان معلوم است
                    <JalaliField value={endsOn} onChange={setEndsOn} className={field} />
                  </label>
                  <button
                    type="submit"
                    disabled={pending || students.length === 0}
                    className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0069d9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 lg:col-span-1"
                  >
                    {pending && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
                    بده به این شاگرد
                  </button>
                </form>

                {students.length === 0 && (
                  <p className="mt-3 rounded-xl bg-[#F5F7FB] px-4 py-3 text-xs leading-6 text-[#6B6F77]">
                    هنوز شاگرد فعالی نداری. بعد از فعال‌شدن رابطه با یک شاگرد، اینجا می‌توانی برنامه را به او بدهی.
                  </p>
                )}

                {holders.length > 0 && (
                  <ul className="mt-4 grid gap-2">
                    {holders.map((row) => {
                      const student = students.find((item) => String(item.id) === String(row.coaching_relationship_id));
                      const name = student?.athlete?.display_name || "شاگرد";
                      const isActive = row.status === "active";

                      return (
                        <li
                          key={row.id}
                          className="flex flex-col gap-1.5 rounded-xl bg-[#F5F7FB] px-4 py-3 text-sm text-[#4B5563] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3"
                        >
                          <Link
                            to={`/coach/athletes/${row.coaching_relationship_id}`}
                            className="font-semibold text-[#007BFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]"
                          >
                            {name}
                          </Link>
                          <span className="min-w-0 break-words text-xs leading-6 text-[#6B6F77] sm:text-sm">{periodText(row)}</span>
                          <span
                            className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium sm:mr-auto ${
                              isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#E8ECF4] text-[#6B6F77]"
                            }`}
                          >
                            {isActive ? "الان دست اوست" : "تمام شده"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}