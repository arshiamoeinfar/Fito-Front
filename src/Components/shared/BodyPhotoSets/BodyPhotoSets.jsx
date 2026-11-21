import { useEffect, useState } from "react";
import JalaliField from "../JalaliField/JalaliField";
import { nowDateTimeValue, showDateTime } from "../../../lib/jalali";

const VIEWS = [
  ["front", "جلو"],
  ["back", "پشت"],
  ["left", "بغل چپ"],
  ["right", "بغل راست"],
  ["other", "سایر"],
];

const MAX_PHOTOS = 8;

function viewLabel(value) {
  return VIEWS.find(([id]) => id === value)?.[1] || "";
}

function countLabel(count) {
  return `${count.toLocaleString("fa-IR")} عکس`;
}

/* ───────── کلاس‌های مشترک (روشن + تیره) ───────── */

const ring =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121A2B]";

const control =
  "w-full rounded-xl border border-[#E3E8F0] bg-white text-[#1F2937] outline-none transition placeholder:text-[#A0A4AA] focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 dark:border-[#2A3550] dark:bg-[#0B1220] dark:text-[#F3F4F6] dark:placeholder:text-[#6B7690] dark:[color-scheme:dark] dark:focus:ring-[#007BFF]/25";

const controlLg = `${control} min-h-12 px-4 py-3 text-base sm:text-sm`;
const controlSm = `${control} min-h-10 px-3 py-2 text-base sm:text-sm`;

const card =
  "rounded-2xl border border-[#E8ECF4] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-[#232D42] dark:bg-[#121A2B] dark:shadow-none";

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    camera: "M4 8a2 2 0 012-2h1.5l1.2-2h6.6l1.2 2H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8zM12 17a4 4 0 100-8 4 4 0 000 8z",
    upload: "M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19h14",
    close: "M6 6l12 12M18 6L6 18",
    note: "M5 4h14v12l-4 4H5V4zM15 20v-4h4M8 9h8M8 13h5",
    coach: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0",
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 motion-safe:animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function BodyPhotoSets({
  sets,
  previews,
  canUpload,
  canReview,
  pending,
  onUpload,
  onReview,
}) {
  const [takenAt, setTakenAt] = useState(nowDateTimeValue);
  const [note, setNote] = useState("");
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [limitNote, setLimitNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(null);

  function addFiles(list) {
    const chosen = [...list];
    const room = Math.max(MAX_PHOTOS - items.length, 0);
    const accepted = chosen.slice(0, room);
    setLimitNote(chosen.length > room ? "در هر مجموعه حداکثر ۸ عکس می‌شود." : "");
    setItems([
      ...items,
      ...accepted.map((file, offset) => ({
        key: `${file.name}-${file.size}-${items.length + offset}-${Date.now()}`,
        file,
        url: URL.createObjectURL(file),
        view: VIEWS[Math.min(items.length + offset, VIEWS.length - 1)][0],
        caption: "",
      })),
    ]);
  }

  function removeItem(key) {
    setItems((current) => {
      const found = current.find((item) => item.key === key);
      if (found) {
        URL.revokeObjectURL(found.url);
      }
      return current.filter((item) => item.key !== key);
    });
  }

  function updateItem(key, patch) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function submit(event) {
    event.preventDefault();
    if (items.length === 0) {
      return;
    }
    try {
      await onUpload({ takenAt, note, items });
    } catch {
      return;
    }
    items.forEach((item) => URL.revokeObjectURL(item.url));
    setItems([]);
    setNote("");
    setLimitNote("");
  }

  // بزرگ‌نمایی عکس: Escape می‌بندد و اسکرول صفحه قفل می‌شود
  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setZoom(null);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [zoom]);

  const full = items.length >= MAX_PHOTOS;

  return (
    <div className="mt-5 flex flex-col gap-6">
      {/* ───────── ثبت مجموعه‌ی جدید ───────── */}
      {canUpload ? (
        <form onSubmit={submit} aria-labelledby="photo-form-title" className={`${card} p-4 sm:p-5`}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#007BFF] dark:bg-[#12294A] dark:text-[#6CB0FF]">
              <Icon name="camera" />
            </span>
            <div className="min-w-0">
              <h4 id="photo-form-title" className="text-base font-semibold text-[#1F2937] dark:text-[#F3F4F6]">ثبت مجموعه‌ی عکس جدید</h4>
              <p className="mt-1 text-sm leading-7 text-[#6B6F77] dark:text-[#9AA3B2]">
                چند عکس از یک تاریخ را با هم بفرست: جلو، پشت و بغل. توضیح برای کل مجموعه است و هر عکس هم می‌تواند توضیح خودش را داشته باشد.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="min-w-0 text-sm font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
              زمان عکس‌ها
              <JalaliField required withTime value={takenAt} onChange={setTakenAt} className={`mt-2 ${controlLg}`} />
            </label>
            <label className="min-w-0 text-sm font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
              توضیح مجموعه
              <textarea
                className={`mt-2 min-h-24 ${controlLg}`}
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="مثلا شروع کات، یا چیزی که مربی باید در این عکس‌ها ببیند"
              />
            </label>
          </div>

          {/* ناحیه‌ی انتخاب عکس */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#6B6F77] dark:text-[#9AA3B2]">عکس‌ها</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${full ? "bg-amber-50 text-amber-800 dark:bg-[#3A2A10] dark:text-[#FBBF6B]" : "bg-[#EEF1F6] text-[#6B6F77] dark:bg-[#1E293B] dark:text-[#9AA3B2]"}`}>
                {items.length.toLocaleString("fa-IR")} از {MAX_PHOTOS.toLocaleString("fa-IR")}
              </span>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer?.files || []);
              }}
              className={`mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition focus-within:ring-2 focus-within:ring-[#007BFF] focus-within:ring-offset-2 dark:focus-within:ring-offset-[#121A2B] ${
                dragging
                  ? "border-[#007BFF] bg-[#EAF4FF] dark:bg-[#12294A]"
                  : "border-[#D5DCE8] bg-[#FAFBFD] hover:border-[#9CC4FF] hover:bg-[#F4F9FF] dark:border-[#2A3550] dark:bg-[#0F1626] dark:hover:border-[#35517F] dark:hover:bg-[#12203A]"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#007BFF] shadow-sm dark:bg-[#0B1220] dark:text-[#6CB0FF] dark:shadow-none">
                <Icon name="upload" />
              </span>
              <span className="text-sm font-medium text-[#007BFF] dark:text-[#6CB0FF]">انتخاب عکس‌ها</span>
              <span className="text-xs text-[#8A93A3] dark:text-[#8B97AD]">
                {items.length === 0 ? "هنوز عکسی انتخاب نشده." : `${items.length.toLocaleString("fa-IR")} عکس برای این مجموعه انتخاب شده.`}
                <span className="hidden sm:inline"> عکس را اینجا بکش و رها کن.</span>
              </span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => {
                  addFiles(event.target.files || []);
                  event.target.value = "";
                }}
              />
            </label>

            {limitNote ? (
              <p role="alert" className="mt-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:bg-[#3A1518] dark:text-[#FCA5A5]">{limitNote}</p>
            ) : null}
          </div>

          {items.length > 0 ? (
            <ul className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <li key={item.key} className="overflow-hidden rounded-2xl border border-[#EEF1F6] bg-[#F8FAFC] dark:border-[#232D42] dark:bg-[#0F1626]">
                  <div className="relative">
                    <img src={item.url} alt="" className="aspect-[4/3] w-full object-cover min-[480px]:aspect-[3/4]" />
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label="حذف این عکس از مجموعه"
                      className={`absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 ${ring}`}
                    >
                      <Icon name="close" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 p-3">
                    <label className="block text-xs font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
                      نما
                      <select className={`mt-1 ${controlSm}`} value={item.view} onChange={(event) => updateItem(item.key, { view: event.target.value })}>
                        {VIEWS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
                      توضیح این عکس
                      <input className={`mt-1 ${controlSm}`} maxLength={500} value={item.caption} onChange={(event) => updateItem(item.key, { caption: event.target.value })} />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="submit"
            disabled={pending || items.length === 0}
            aria-busy={pending}
            className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgba(0,123,255,0.5)] transition hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:shadow-none ${ring}`}
          >
            {pending ? <Spinner /> : null}
            {pending ? "در حال ثبت" : "ثبت مجموعه"}
          </button>
        </form>
      ) : null}

      {/* ───────── مجموعه‌های ثبت‌شده ───────── */}
      {sets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#DDE3EE] bg-[#FAFBFD] px-4 py-10 text-center dark:border-[#2A3550] dark:bg-[#0F1626]">
          <span className="text-3xl" aria-hidden="true">📷</span>
          <p className="text-sm font-medium text-[#4B5563] dark:text-[#B6C2D6]">عکسی برای نمایش نیست.</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {sets.map((set) => {
            const photos = Array.isArray(set.photos) ? set.photos : [];
            const review = drafts[set.id] ?? set.review ?? "";
            return (
              <li key={set.id} className={`${card} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">{showDateTime(set.taken_at)}</p>
                  <span className="rounded-full bg-[#EEF1F6] px-2.5 py-1 text-xs font-medium text-[#6B6F77] dark:bg-[#1E293B] dark:text-[#9AA3B2]">{countLabel(photos.length)}</span>
                </div>

                {set.note ? (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#F5F7FB] px-3.5 py-3 dark:bg-[#0F1626]">
                    <Icon name="note" className="mt-1 h-4 w-4 shrink-0 text-[#8A93A3] dark:text-[#8B97AD]" />
                    <p className="break-words text-sm leading-7 text-[#4B5563] dark:text-[#B6C2D6]">{set.note}</p>
                  </div>
                ) : null}

                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {photos.map((photo) => {
                    const label = viewLabel(photo.view);
                    const src = previews[photo.id];
                    return (
                      <li key={photo.id} className="min-w-0">
                        {src ? (
                          <button
                            type="button"
                            onClick={() => setZoom({ src, label, caption: photo.caption })}
                            aria-label={`بزرگ‌نمایی عکس${label ? ` ${label}` : ""}`}
                            className={`group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#EEF1F6] dark:bg-[#0B1220] ${ring}`}
                          >
                            <img src={src} alt={label} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                            {label ? (
                              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">{label}</span>
                            ) : null}
                          </button>
                        ) : (
                          <div className="aspect-[3/4] w-full rounded-2xl bg-[#EEF1F6] motion-safe:animate-pulse dark:bg-[#172036]" role="img" aria-label="در حال بارگذاری عکس" />
                        )}
                        {photo.caption ? <p className="mt-1.5 break-words text-xs leading-5 text-[#6B6F77] dark:text-[#9AA3B2]">{photo.caption}</p> : null}
                      </li>
                    );
                  })}
                </ul>

                {canReview ? (
                  <div className="mt-5 border-t border-[#EEF1F6] pt-4 dark:border-[#232D42]">
                    <label className="block text-sm font-medium text-[#6B6F77] dark:text-[#9AA3B2]">
                      تحلیل مربی
                      <textarea
                        className={`mt-2 min-h-24 ${controlLg}`}
                        maxLength={2000}
                        value={review}
                        onChange={(event) => setDrafts((current) => ({ ...current, [set.id]: event.target.value }))}
                        placeholder="آنچه در این مجموعه دیده می‌شود"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onReview(set.id, review)}
                      className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${ring}`}
                    >
                      ثبت تحلیل
                    </button>
                  </div>
                ) : set.review ? (
                  <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#F2F8FF] px-4 py-3.5 dark:bg-[#0F2038]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#007BFF] dark:bg-[#0B1220] dark:text-[#6CB0FF]">
                      <Icon name="coach" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#0B63CE] dark:text-[#7CB4FF]">تحلیل مربی</p>
                      <p className="mt-1 break-words text-sm leading-7 text-[#1F2937] dark:text-[#E5E7EB]">{set.review}</p>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {/* ───────── بزرگ‌نمایی ───────── */}
      {zoom ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="نمایش بزرگ عکس"
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-black/85 p-4"
          onClick={() => setZoom(null)}
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label="بستن"
            autoFocus
            className={`absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 ${ring}`}
          >
            <Icon name="close" />
          </button>
          <img
            src={zoom.src}
            alt={zoom.label}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[80dvh] max-w-full rounded-xl object-contain"
          />
          {zoom.label || zoom.caption ? (
            <p onClick={(event) => event.stopPropagation()} className="max-w-md break-words text-center text-sm leading-7 text-white/90">
              {zoom.label}{zoom.label && zoom.caption ? " · " : ""}{zoom.caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}