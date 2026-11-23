
import { useEffect, useState } from "react";
import AddCircle from "../../../../assets/Icons/Add Circle.svg";

const initialNotes = [
  {
    id: 1,
    date: "امروز",
    title: "درد در ناحیه شانه راست",
    text: "هنگام پرس سرشانه کمی در شانه راست احساس درد داشتم. برای ست بعدی وزن را کاهش دادم.",
    type: "pain",
  },
  {
    id: 2,
    date: "۲۱ مرداد",
    title: "تمرین با انرژی بالا",
    text: "انرژی بالایی داشتم، همه ست‌های اسکوات را با رکورد کامل انجام دادم.",
    type: "training",
  },
  {
    id: 3,
    date: "۱۰ مرداد",
    title: "پیشرفت در وزنه‌ها",
    text: "وزنه تمرین امروز نسبت به هفته قبل بهتر بود و احساس قدرت بیشتری داشتم.",
    type: "progress",
  },
];

const NOTE_TYPES = {
  pain: {
    label: "درد و آسیب",
    icon: "🩹",
    color: "bg-red-50 text-red-600",
    border: "border-red-100",
  },
  training: {
    label: "وضعیت تمرین",
    icon: "🏋️",
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
  },
  progress: {
    label: "پیشرفت",
    icon: "📈",
    color: "bg-green-50 text-green-600",
    border: "border-green-100",
  },
  recovery: {
    label: "انرژی و ریکاوری",
    icon: "⚡",
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
  },
  other: {
    label: "سایر موارد",
    icon: "📝",
    color: "bg-gray-100 text-gray-600",
    border: "border-gray-200",
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
        ✕
      </button>
    </div>
  );
}

function NoteTypeBadge({ type }) {
  const config = NOTE_TYPES[type] || NOTE_TYPES.other;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${config.color}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

function NoteCard({ note, onClick, onDelete }) {
  const config = NOTE_TYPES[note.type] || NOTE_TYPES.other;

  return (
    <div className="group min-w-0 rounded-2xl border border-gray-100 bg-[#F8FAFD] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/40 hover:shadow-md hover:shadow-blue-100/30 sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-center gap-3 text-right"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
            {config.icon}
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
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label="حذف یادداشت"
          title="حذف یادداشت"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 7h12m-10 0V5h8v2m-9 0 1 13h8l1-13M10 11v5m4-5v5"
            />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="mt-4 block w-full text-right"
      >
        <p className="line-clamp-3 text-xs leading-7 text-[#6B6F77] sm:text-sm sm:leading-8">
          {note.text}
        </p>
      </button>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <NoteTypeBadge type={note.type} />

        <button
          type="button"
          onClick={onClick}
          className="text-[11px] font-medium text-[#007BFF] transition hover:text-blue-700"
        >
          مشاهده جزئیات ←
        </button>
      </div>
    </div>
  );
}

export default function WorkoutNotes({
  notes: provided,
  emptyLabel = "هنوز یادداشتی ثبت نکرده‌اید.",
  onAddNote,
  onDeleteNote,
}) {
  const controlled = Array.isArray(provided);

  const [notes, setNotes] = useState(
    controlled ? provided : initialNotes
  );

  const [selectedNote, setSelectedNote] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingNote, setDeletingNote] = useState(null);

  const [newNote, setNewNote] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteType, setNewNoteType] = useState("training");

  useEffect(() => {
    if (controlled) {
      setNotes(provided);
    }
  }, [controlled, provided]);

  const addNote = () => {
    if (!newNote.trim() || !newNoteTitle.trim()) return;

    const note = {
      id: Date.now(),
      date: "امروز",
      title: newNoteTitle.trim(),
      text: newNote.trim(),
      type: newNoteType,
    };

    setNotes((previousNotes) => [note, ...previousNotes]);

    onAddNote?.(note);

    setNewNote("");
    setNewNoteTitle("");
    setNewNoteType("training");
    setIsAdding(false);
  };

  const deleteNote = () => {
    if (!deletingNote) return;

    const noteId = deletingNote.id;

    setNotes((previousNotes) =>
      previousNotes.filter((note) => note.id !== noteId)
    );

    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }

    onDeleteNote?.(noteId);
    setDeletingNote(null);
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
              <h2 className="text-lg text-[#6B6F77] sm:text-xl">
                یادداشت‌های من
              </h2>
            </div>

            <p className="mt-2 pr-3 text-xs leading-6 text-gray-400 sm:text-sm">
              وضعیت تمرین و احساساتت رو با مربیت به اشتراک بذار.
            </p>
          </div>

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
            <span>افزودن</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5">
          <span className="mt-0.5 text-lg">💬</span>

          <div className="min-w-0">
            <p className="text-xs font-bold text-blue-700">
              با مربیت در ارتباط باش
            </p>
            <p className="mt-1 text-[11px] leading-6 text-blue-600">
              هر تغییری در وضعیت بدنی، درد عضلانی یا انرژی خودت رو یادداشت کن تا مربیت بتونه بهتر راهنماییت کنه.
            </p>
          </div>
        </div>

        {/* Notes Count */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">
            یادداشت‌های ثبت‌شده
          </h3>

          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#007BFF]">
            {notes.length} یادداشت
          </span>
        </div>

        {/* Notes */}
        <div className="flex-1 space-y-3">
          {notes.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 px-5 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                📝
              </div>

              <p className="text-sm font-bold text-gray-700">
                هنوز یادداشتی نداری
              </p>

              <p className="mt-2 max-w-xs text-xs leading-6 text-gray-400">
                {emptyLabel}
              </p>

              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="mt-4 rounded-xl bg-[#007BFF] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-blue-700"
              >
                ثبت اولین یادداشت
              </button>
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setSelectedNote(note)}
                onDelete={() => setDeletingNote(note)}
              />
            ))
          )}
        </div>
      </section>

      {/* Add Note Modal */}
      {isAdding && (
        <ModalShell onClose={() => setIsAdding(false)}>
          <ModalHeader
            eyebrow="ثبت تجربه جدید"
            title="یادداشت جدید"
            icon="📝"
            onClose={() => setIsAdding(false)}
          />

          <div className="p-4 sm:p-6">
            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-xs leading-6 text-blue-700">
                هر چیزی که درباره تمرین یا وضعیت بدنی‌ات مهمه اینجا بنویس. مربیت می‌تونه این یادداشت رو در پنل خودش مشاهده کنه.
              </p>
            </div>

            {/* Category */}
            <label className="mb-3 block text-xs font-bold text-gray-700">
              موضوع یادداشت
            </label>

            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(NOTE_TYPES).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewNoteType(key)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 text-[11px] font-medium transition ${
                    newNoteType === key
                      ? `${config.color} ${config.border} ring-2 ring-current/10`
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <span>{config.icon}</span>
                  {config.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <label
              htmlFor="workout-note-title"
              className="mb-2 block text-xs font-bold text-gray-700"
            >
              عنوان یادداشت
            </label>

            <input
              id="workout-note-title"
              autoFocus
              value={newNoteTitle}
              onChange={(event) => setNewNoteTitle(event.target.value)}
              placeholder="مثلاً درد شانه بعد از تمرین"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/10"
            />

            {/* Description */}
            <label
              htmlFor="workout-note-text"
              className="mb-2 block text-xs font-bold text-gray-700"
            >
              توضیحات
            </label>

            <textarea
              id="workout-note-text"
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              placeholder="امروز در تمرین چه احساسی داشتی؟ آیا درد، خستگی یا پیشرفت خاصی تجربه کردی؟"
              className="min-h-36 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/70 p-4 text-sm leading-7 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/10 sm:min-h-40"
            />

            <div className="mt-2 text-left text-[11px] text-gray-400">
              {newNote.length} کاراکتر
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote("");
                  setNewNoteTitle("");
                  setNewNoteType("training");
                }}
                className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={addNote}
                disabled={!newNote.trim() || !newNoteTitle.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#007BFF] py-3.5 text-sm font-medium text-white transition hover:bg-[#0067D6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>💾</span>
                ثبت یادداشت
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
            title={selectedNote.title}
            icon={(NOTE_TYPES[selectedNote.type] || NOTE_TYPES.other).icon}
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
              <p className="mb-3 text-sm font-bold text-gray-700">
                توضیحات یادداشت
              </p>

              <p className="whitespace-pre-wrap break-words text-sm leading-8 text-[#6B6F77]">
                {selectedNote.text}
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setDeletingNote(selectedNote);
                  setSelectedNote(null);
                }}
                className="flex-1 rounded-xl border border-red-100 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                🗑 حذف یادداشت
              </button>

              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
              >
                بستن
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete Confirmation */}
      {deletingNote && (
        <ModalShell
          onClose={() => setDeletingNote(null)}
          maxWidth="max-w-md"
        >
          <div className="p-5 text-center sm:p-7">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
              🗑️
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-800">
              حذف یادداشت؟
            </h3>

            <p className="mt-2 text-xs leading-7 text-gray-500">
              آیا مطمئنی می‌خوای یادداشت «{deletingNote.title}» رو حذف کنی؟
              این عملیات قابل بازگشت نیست.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={deleteNote}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white transition hover:bg-red-600"
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  );
}
