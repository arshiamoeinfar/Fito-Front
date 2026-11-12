import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import ExerciseLibrary from "../../Components/CoachDashboard/programs/ExerciseLibrary";
import WorkoutHeader from "../../Components/CoachDashboard/programs/WorkoutHeader";
import WorkoutPlanTable from "../../Components/CoachDashboard/programs/WorkoutPlanTable";
import { Check, ChevronLeft } from "lucide-react";
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
const field = "w-full rounded-2xl border border-[#F0F2F5] bg-white px-4 py-3 text-sm text-[#1F2937]";

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

function toCard(exercise) {
  const primary = (exercise.muscles || []).find((muscle) => muscle.involvement === "primary") || exercise.muscles?.[0];
  const muscle = primary?.name_fa || "عمومی";

  return {
    id: exercise.id,
    name: exercise.name,
    muscle,
    target: `عضله هدف: ${muscle}`,
    description: exercise.instructions || "",
    instructions: exercise.instructions ? [exercise.instructions] : undefined,
    image: imgExercise,
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

  function addFromBank(exercise) {
    const move = {
      name: exercise.name || "",
      sets: "4",
      reps: "12",
      rest: "60",
      weight: "",
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

  function updatePlanItem(id, fieldName, value) {
    const index = Number(String(id).split("-")[1]);
    updateMove(bankDay, index, { [fieldName]: value === "" || value == null ? "" : String(value) });
  }

  function removePlanItem(id) {
    removeMove(bankDay, Number(String(id).split("-")[1]));
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title={isNew ? "ساخت برنامه تمرینی" : (title || "ساخت برنامه تمرینی")} description="برنامه تمرینی و تغذیه‌ای شاگرد را بسازید." />
            <div dir="rtl" className="col-span-12">
              {forStudent ? (
                <Link to={`/coach/athletes/${forStudent.id}`} className="text-sm text-[#007BFF]">برگشت به صفحهٔ این شاگرد</Link>
              ) : (
                <Link to="/coach/programs" className="text-sm text-[#007BFF]">برگشت به برنامه‌ها</Link>
              )}
            </div>
            {error && <p dir="rtl" className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p>}
            {notice && <p dir="rtl" className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700">{notice}</p>}
            {!loaded && <p dir="rtl" className="col-span-12 text-sm text-[#6B7280]">در حال آوردن برنامه...</p>}

            {loaded && (isNew || program) && (
              <div dir="rtl" className="col-span-12 flex flex-col gap-4">
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
                />
                <WorkoutPlanTable
                  day={activeDay?.name || "شنبه"}
                  items={planItems}
                  onUpdate={updatePlanItem}
                  onRemove={removePlanItem}
                />
                <div className="flex flex-col gap-3 rounded-2xl border border-[#E7EBF0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-[#6B6F77]">
                    {`روز ${activeDay?.name || "شنبه"} · ${planItems.length} حرکت انتخاب شده`}
                  </div>
                  <button
                    type="button"
                    onClick={markReady}
                    disabled={pending || moveCount === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0069d9] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check size={16} />
                    ذخیره برنامه
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {program?.current_version_id && (
              <section dir="rtl" className="col-span-12 rounded-2xl border border-[#E7EBF0] bg-white p-4 text-right shadow-sm sm:p-5">
                <h2 className="text-base font-semibold text-[#1F2937]">دادن همین برنامه به شاگرد</h2>
                <p className="mt-1 text-xs text-[#6B6F77]">همین هفته را می‌توانی به یک شاگرد بدهی یا به چند شاگرد. اگر کسی برنامهٔ دیگری می‌خواهد، از فهرست یک برنامهٔ جدا بنویس.</p>
                <form onSubmit={give} className="mt-4 grid gap-3 lg:grid-cols-4">
                  <label className="grid gap-2 text-xs text-[#6B6F77]">
                    شاگرد
                    <select required value={studentId} onChange={(event) => setStudentId(event.target.value)} className={field}>
                      <option value="">شاگرد</option>
                      {students.map((row) => (
                        <option key={row.id} value={row.id}>{row.athlete?.display_name || "شاگرد"}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-xs text-[#6B6F77]">
                    شروع
                    <JalaliField required value={startsOn} onChange={setStartsOn} className={field} />
                  </label>
                  <label className="grid gap-2 text-xs text-[#6B6F77]">
                    اتمام، اگر از الان معلوم است
                    <JalaliField value={endsOn} onChange={setEndsOn} className={field} />
                  </label>
                  <button type="submit" disabled={pending || students.length === 0} className="self-end rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0069d9] disabled:opacity-60">بده به این شاگرد</button>
                </form>
                <ul className="mt-4 space-y-2">
                  {holders.map((row) => {
                    const student = students.find((item) => String(item.id) === String(row.coaching_relationship_id));
                    const name = student?.athlete?.display_name || "شاگرد";

                    return (
                      <li key={row.id} className="rounded-xl bg-[#F5F7FB] px-4 py-3 text-sm text-[#4B5563]">
                        <Link to={`/coach/athletes/${row.coaching_relationship_id}`} className="font-semibold text-[#007BFF]">{name}</Link>
                        {` · ${periodText(row)} · ${row.status === "active" ? "الان دست اوست" : "تمام شده"}`}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
