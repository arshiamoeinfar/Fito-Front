import { useMemo, useState } from "react";
import { Search, PlusCircle, Play } from "lucide-react";
import imgExercise from "../../../assets/imges/image 13.png"
import ExerciseDetailsModal from "./ExerciseDetailsModal";
const muscleGroups = ["همه", "زیر بغل", "سینه", "پشت پا", "جلو پا", "سرشانه", "بازو", "شکم", "باسن", "ساق", "ساعد", "کول", "پشت", "کاردیو", "گردن", "تمام‌بدن", "عمومی"];
const PAGE_SIZE = 48;

const fallbackExercises = [
  { id: "ex-1", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: {imgExercise}, description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-2", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: "/images/exercises/side-crunch.jpg", description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-3", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: {imgExercise}, description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-4", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: "/images/exercises/side-crunch.jpg", description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-5", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: "/images/exercises/side-crunch.jpg", description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-6", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: "/images/exercises/side-crunch.jpg", description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-7", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: "/images/exercises/side-crunch.jpg", description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-8", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: "/images/exercises/side-crunch.jpg", description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-9", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: "/images/exercises/side-crunch.jpg", description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
  { id: "ex-10", name: "کرانچ جانبی", muscle: "زیر بغل", target: "عضله هدف: زیربغل، دوسر بازو", image: "/images/exercises/side-crunch.jpg", description: "برای مبتدیان با وزنه سبک عالی است. حتماً کتف‌ها را جمع نگه دارید." },
];

export default function ExerciseLibrary({
  exercises = fallbackExercises,
  search = "",
  onSearchChange = () => {},
  activeMuscle = "زیر بغل",
  onMuscleChange = () => {},
  onAddExercise = () => {},
  onPreviewExercise,
  studentId = "",
  studentName = "",
  loadSuggestion,
}) {
  const [localSearch, setLocalSearch] = useState("");
  const [localMuscle, setLocalMuscle] = useState("همه");
  const [shown, setShown] = useState(PAGE_SIZE);
  const isControlledSearch = typeof onSearchChange === "function" && search !== undefined;
  const query = search ?? localSearch;
  const selectedMuscle = activeMuscle ?? localMuscle;
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [manualName, setManualName] = useState("");
  const [manualMuscle, setManualMuscle] = useState("عمومی");
  const [manualDescription, setManualDescription] = useState("");

  const setQuery = (value) => {
    setShown(PAGE_SIZE);
    if (isControlledSearch) onSearchChange(value);
    else setLocalSearch(value);
  };

  const setMuscle = (value) => {
    setShown(PAGE_SIZE);
    onMuscleChange(value);
    setLocalMuscle(value);
  };

  const filteredExercises = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa");
    return exercises.filter((exercise) => {
      const muscle = exercise.muscle ?? exercise.category ?? "";
      const matchesMuscle = selectedMuscle === "همه" || muscle === selectedMuscle;
      const matchesQuery = !normalized ||
        `${exercise.name ?? ""} ${muscle} ${exercise.target ?? ""}`
          .toLocaleLowerCase("fa").includes(normalized);
      return matchesMuscle && matchesQuery;
    });
  }, [exercises, query, selectedMuscle]);

  const visibleExercises = filteredExercises.slice(0, shown);


  async function enrich(exercise) {
    if (!studentId || typeof loadSuggestion !== "function") {
      return exercise;
    }

    const suggestion = await loadSuggestion(exercise.id);

    if (!suggestion) {
      return exercise;
    }

    return {
      ...exercise,
      sets: suggestion.sets,
      reps: suggestion.reps,
      rest: suggestion.rest_seconds,
      weight: suggestion.weight_kg ?? "",
      reason: suggestion.reason,
    };
  }

  async function openExercise(exercise) {
    setBusyId(exercise.id);

    try {
      const ready = await enrich(exercise);
      setSelectedExercise(ready);
      onPreviewExercise?.(ready);
    } finally {
      setBusyId(null);
    }
  }

  async function addDirect(exercise) {
    if (busyId) {
      return;
    }

    setBusyId(exercise.id);

    try {
      onAddExercise(await enrich(exercise));
    } finally {
      setBusyId(null);
    }
  }

  function handleAddExercise(exercise) {
    onAddExercise(exercise);
    setSelectedExercise(null);
  }

  function addManual() {
    const name = manualName.trim() || query.trim();
    if (!name) return;
    onAddExercise({
      id: `custom-${Date.now()}`,
      name,
      muscle: manualMuscle,
      target: `عضله هدف: ${manualMuscle}`,
      description: manualDescription.trim(),
      image: imgExercise,
    });
    setManualName("");
    setManualDescription("");
    setQuery("");
  }
  return (
    <section dir="rtl" className="w-full rounded-[22px] bg-white px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="order-1 text-right">
          <h2 className="text-2xl font-primary text-[#666A70]">کتابخانه حرکات</h2>
          <p className="mt-2 text-sm text-[#a5a5a5]">برای افزودن به جدول، روی حرکت مورد نظر کلیک کنید.</p>
        </div>

        <div className="order-2 flex flex-wrap items-center gap-3">
          {muscleGroups.map((muscle) => (
            <button
              type="button"
              key={muscle}
              onClick={() => setMuscle(muscle)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedMuscle === muscle
                  ? "border-[#1685F8] bg-[#D9ECFF] text-[#087BEE]"
                  : "border-transparent bg-[#F1F6FC] text-[#707780] hover:border-blue-200"
              }`}
            >
              {muscle}
            </button>
          ))}
          <label className="relative order-first min-w-[190px] flex-1 sm:order-last sm:flex-none">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جست‌وجوی حرکت..."
              aria-label="جست‌وجوی حرکت"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pr-9 pl-3 text-sm outline-none focus:border-blue-400"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visibleExercises.map((exercise) => (
          <article
            key={exercise.id}
            className="group min-w-0 rounded-[27px] border border-[#C9C9C9] bg-white p-3 transition hover:border-[#1685F8] hover:shadow-[0_5px_18px_rgba(20,120,240,0.08)]"
          >
            <button
              type="button"
              onClick={() => openExercise(exercise)}
              aria-label={`پیش‌نمایش ${exercise.name}`}
              className="relative block w-full overflow-hidden rounded-[23px] bg-[#0D3B68] text-white"
            >
              <img
                src={exercise.image || imgExercise}
                alt={exercise.name}
                loading="lazy"
                onError={(event) => {
                  if (!event.currentTarget.dataset.fallback) {
                    event.currentTarget.dataset.fallback = "true";
                    event.currentTarget.src = imgExercise;
                  }
                }}
                className="aspect-[1.72/1] w-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-blue-950/10 transition group-hover:bg-blue-950/25">
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/90 bg-black/10">
                  <Play size={19} fill="white" className="translate-x-[-1px]" />
                </span>
              </span>
            </button>

            <div className="px-1 pt-3 text-center">
              <h3 className="truncate text-base font-primary text-[#686C72]" title={exercise.name}>
                {exercise.name}
              </h3>
              <p className="mt-1 truncate text-[13px] font-primary text-[#777B81]" title={exercise.target}>
                {exercise.target || `عضله هدف: ${exercise.muscle || "عمومی"}`}
              </p>

              <div className="relative mt-5 rounded-[17px] bg-[#E5F1FF] px-3 pb-4 pt-7 text-right">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#087FF5] px-5 py-1 text-xs font-medium text-white">
                  راهنما
                </span>
                <p
                  dir={/[\u0600-\u06FF]/.test(exercise.description || "") ? "rtl" : "ltr"}
                  className="line-clamp-2 min-h-[44px] text-xs leading-6 text-[#7A8797]"
                >
                  {exercise.description || "برای اجرای صحیح حرکت، فرم بدن را کنترل کنید و از وزنه مناسب استفاده کنید."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => addDirect(exercise)}
                disabled={busyId === exercise.id}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#087FF5] px-2 py-2.5 text-sm font-primary text-white transition hover:bg-blue-500 active:scale-[0.98] cursor-pointer disabled:cursor-wait disabled:opacity-70"
              >
                {busyId === exercise.id ? "در حال خواندن تحلیل" : "افزودن به لیست"}
                <PlusCircle size={21} strokeWidth={2} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-6 text-right sm:px-6">
          <p className="text-sm font-bold text-slate-600">
            حرکتی با این جست‌وجو یا دسته‌بندی پیدا نشد.
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-400">
            می‌توانی همین حرکت را دستی وارد کنی تا به لیست اضافه شود.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <input
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              placeholder={query.trim() ? `نام حرکت: ${query.trim()}` : "نام حرکت"}
              aria-label="نام حرکت جدید"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            />
            <select
              value={manualMuscle}
              onChange={(event) => setManualMuscle(event.target.value)}
              aria-label="گروه عضلانی حرکت جدید"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              {muscleGroups
                .filter((muscle) => muscle !== "همه")
                .map((muscle) => (
                  <option key={muscle} value={muscle}>
                    {muscle}
                  </option>
                ))}
            </select>
          </div>
          <input
            value={manualDescription}
            onChange={(event) => setManualDescription(event.target.value)}
            placeholder="توضیح کوتاه (اختیاری)"
            aria-label="توضیح حرکت جدید"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={addManual}
            disabled={!manualName.trim() && !query.trim()}
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#087FF5] px-6 py-2.5 text-sm font-primary text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            افزودن دستی به لیست
            <PlusCircle size={19} strokeWidth={2} />
          </button>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-400">
        Exercise data by{" "}
        <a href="https://repdb.co" rel="nofollow" className="underline">
          RepDB
        </a>
      </p>
      {shown < filteredExercises.length && (
        <button
          type="button"
          onClick={() => setShown((current) => current + PAGE_SIZE)}
          className="mx-auto mt-6 block rounded-full bg-[#F1F6FC] px-6 py-2.5 text-sm font-medium text-[#087BEE]"
        >
          {`نمایش بیشتر (${filteredExercises.length - shown} حرکت مانده)`}
        </button>
      )}
      <ExerciseDetailsModal
        exercise={selectedExercise}
        student={studentId ? { id: studentId, name: studentName } : null}
        onClose={() => setSelectedExercise(null)}
        onAdd={handleAddExercise}
      />
    </section>
  );
}
