
import { useEffect, useState } from "react";
import AddCircle from "../../../../assets/Icons/Add Circle.svg";

const initialNotes = [
  {
    id: 1,
    date: "امروز",
    title: "امروز",
    text: "هنگام پرس سرشانه کمی در شانه راست احساس درد داشتم. برای ست بعدی وزن را کاهش دادم.",
    type: "training",
  },
  {
    id: 2,
    date: "۲۱ مرداد",
    title: "۲۱ مرداد",
    text: "انرژی بالایی داشتم، همه ست‌های اسکوات را با رکورد کامل انجام دادم.",
    type: "record",
  },
  {
    id: 3,
    date: "۱۰ مرداد",
    title: "۱۰ مرداد",
    text: "وزنه تمرین امروز نسبت به هفته قبل بهتر بود و احساس قدرت بیشتری داشتم.",
    type: "progress",
  },
];

const NOTE_TYPES = {
  training: {
    label: "تمرین",
    icon: "🏋️",
    color: "bg-blue-50 text-blue-600",
  },
  record: {
    label: "رکورد جدید",
    icon: "🏆",
    color: "bg-amber-50 text-amber-600",
  },
  progress: {
    label: "پیشرفت",
    icon: "📈",
    color: "bg-green-50 text-green-600",
  },
};

function ModalShell({ children, onClose, maxWidth = "max-w-xl" }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`my-auto w-full ${maxWidth} overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl`}
      >
        {children}
      </div>
    </div>
  );
}

function NoteTypeBadge({ type }) {
  const config = NOTE_TYPES[type] || NOTE_TYPES.training;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${config.color}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

function NoteCard({ note, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full min-w-0 rounded-2xl border border-slate-100 bg-[#F8FAFD] p-4 text-right transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-100/40 sm:rounded-3xl sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm sm:h-11 sm:w-11">
            📝
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-gray-800 sm:text-base">
              {note.title}
            </h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-400">
              <span>📅</span>
              <span>{note.date}</span>
            </div>
          </div>
        </div>

        <NoteTypeBadge type={note.type} />
      </div>

      <p className="mt-4 line-clamp-3 text-right text-xs leading-7 text-[#6B6F77] sm:text-sm sm:leading-8">
        {note.text}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[11px] font-medium text-[#007BFF] transition group-hover:text-blue-700">
          مشاهده جزئیات
        </span>

        <svg
          className="h-4 w-4 text-gray-400 transition group-hover:-translate-x-1 group-hover:text-[#007BFF]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </div>
    </button>
  );
}

function ModalHeader({ eyebrow, title, onClose, icon = "📝" }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#007BFF]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-bold text-gray-800 sm:text-lg">
            {title}
          </h2>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="بستن"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition hover:bg-red-50 hover:text-red-500"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export default function WorkoutNotes({
  notes: provided,
  emptyLabel = "یادداشتی از مربی برای این برنامه نیست.",
}) {
  const controlled = Array.isArray(provided);

  const [notes, setNotes] = useState(
    controlled ? provided : initialNotes
  );

  const [selectedNote, setSelectedNote] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (controlled) {
      setNotes(provided);
    }
  }, [controlled, provided]);

  const addNote = () => {
    if (!newNote.trim()) return;

    const note = {
      id: Date.now(),
      date: "امروز",
      title: "امروز",
      text: newNote.trim(),
      type: "training",
    };

    setNotes((previousNotes) => [note, ...previousNotes]);
    setNewNote("");
    setIsAdding(false);
  };

  return (
    <>
      <section
        dir="rtl"
        className="flex h-full min-w-0 flex-col rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-[#007BFF]" />
              <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                یادداشت تمرین
              </h2>
            </div>

            <p className="mt-2 pr-3 text-xs text-gray-400 sm:text-sm">
              ثبت و مرور نکات مهم جلسات تمرینی
            </p>
          </div>

          {!controlled && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#007BFF] px-3 py-2.5 text-xs font-medium text-white shadow-sm shadow-blue-200 transition hover:bg-[#0067D6] active:scale-95 sm:px-4 sm:text-sm"
            >
              <img
                src={AddCircle}
                alt=""
                className="h-5 w-5 brightness-0 invert"
              />
              <span>افزودن یادداشت</span>
            </button>
          )}
        </div>

        {/* Notes Count */}
        {notes.length > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-blue-50/60 px-3 py-2.5">
            <span className="text-xs font-medium text-gray-600">
              یادداشت‌های ثبت‌شده
            </span>

            <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-white px-2 text-xs font-bold text-[#007BFF]">
              {notes.length}
            </span>
          </div>
        )}

        {/* Notes */}
        <div className="flex-1 space-y-3">
          {notes.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 px-5 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                📝
              </div>

              <p className="text-sm font-bold text-gray-700">
                هنوز یادداشتی ثبت نشده
              </p>

              <p className="mt-2 max-w-xs text-xs leading-6 text-gray-400">
                {emptyLabel}
              </p>

              {!controlled && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-[#007BFF] transition hover:bg-blue-100"
                >
                  افزودن اولین یادداشت
                </button>
              )}
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setSelectedNote(note)}
              />
            ))
          )}
        </div>
      </section>

      {/* Add Note Modal */}
      {isAdding && (
        <ModalShell onClose={() => setIsAdding(false)}>
          <ModalHeader
            eyebrow="یادداشت جدید"
            title="ثبت یادداشت تمرین"
            onClose={() => setIsAdding(false)}
          />

          <div className="p-4 sm:p-6">
            <div className="mb-4 rounded-2xl bg-blue-50/70 p-3">
              <p className="text-xs leading-6 text-blue-700">
                نکات مهم تمرین، وضعیت بدنی، میزان انرژی یا اتفاقات جلسه را اینجا ثبت کنید.
              </p>
            </div>

            <label
              htmlFor="workout-note"
              className="mb-2 block text-xs font-bold text-gray-700"
            >
              متن یادداشت
            </label>

            <textarea
              id="workout-note"
              autoFocus
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              placeholder="یادداشت خود را درباره تمرین امروز بنویسید..."
              className="min-h-36 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/70 p-4 text-sm leading-7 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/10 sm:min-h-44 sm:p-5"
            />

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                متن یادداشت را وارد کنید
              </span>

              <span className="text-[11px] text-gray-400">
                {newNote.length} کاراکتر
              </span>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote("");
                }}
                className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={addNote}
                disabled={!newNote.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#007BFF] py-3.5 text-sm font-medium text-white transition hover:bg-[#0067D6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>💾</span>
                ذخیره یادداشت
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Note Details Modal */}
      {selectedNote && (
        <ModalShell onClose={() => setSelectedNote(null)}>
          <ModalHeader
            eyebrow={selectedNote.date}
            title="جزئیات یادداشت تمرین"
            onClose={() => setSelectedNote(null)}
          />

          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <NoteTypeBadge type={selectedNote.type} />

              <span className="text-xs text-gray-400">
                📅 {selectedNote.date}
              </span>
            </div>

            <div className="rounded-2xl border border-blue-50 bg-[#F7FAFE] p-4 sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">📝</span>
                <span className="text-sm font-bold text-gray-700">
                  متن یادداشت
                </span>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm leading-8 text-[#6B6F77]">
                {selectedNote.text}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 rounded-xl bg-green-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                  ✓
                </span>
                یادداشت ثبت شده است
              </div>

              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-white"
              >
                بستن
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}
