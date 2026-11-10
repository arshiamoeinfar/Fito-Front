import { useState } from "react";
import JalaliField from "../JalaliField/JalaliField";
import { nowDateTimeValue, showDateTime } from "../../../lib/jalali";

const VIEWS = [
  ["front", "جلو"],
  ["back", "پشت"],
  ["left", "بغل چپ"],
  ["right", "بغل راست"],
  ["other", "سایر"],
];

function viewLabel(value) {
  return VIEWS.find(([id]) => id === value)?.[1] || "";
}

function countLabel(count) {
  return `${count.toLocaleString("fa-IR")} عکس`;
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

  function addFiles(list) {
    const chosen = [...list];
    const room = Math.max(8 - items.length, 0);
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

  return (
    <div className="mt-5">
      {canUpload ? (
        <form onSubmit={submit} className="grid gap-3">
          <p className="text-sm leading-7 text-[#6B6F77]">چند عکس از یک تاریخ را با هم بفرست: جلو، پشت و بغل. توضیح برای کل مجموعه است و هر عکس هم می‌تواند توضیح خودش را داشته باشد.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-[#6B6F77]">
              زمان عکس‌ها
              <JalaliField required withTime value={takenAt} onChange={setTakenAt} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </label>
            <label className="text-sm text-[#6B6F77]">
              توضیح مجموعه
              <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="مثلا شروع کات، یا چیزی که مربی باید در این عکس‌ها ببیند" />
            </label>
          </div>
          <div className="text-sm text-[#6B6F77]">
            <span>عکس‌ها</span>
            <label className="mt-2 flex w-fit cursor-pointer items-center rounded-2xl bg-white px-4 py-3 text-[#007BFF] ring-1 ring-[#E5E7EB]">
              انتخاب عکس‌ها
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
            <p className="mt-2 text-xs text-[#A0A4AA]">{items.length === 0 ? "هنوز عکسی انتخاب نشده." : `${items.length.toLocaleString("fa-IR")} عکس برای این مجموعه انتخاب شده.`}</p>
            {limitNote ? <p className="mt-1 text-xs text-red-700">{limitNote}</p> : null}
          </div>
          {items.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <li key={item.key} className="rounded-2xl bg-[#F5F7FB] p-3">
                  <img src={item.url} alt="" className="h-32 w-full rounded-2xl object-cover" />
                  <label className="mt-2 block text-xs text-[#6B6F77]">
                    نما
                    <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={item.view} onChange={(event) => updateItem(item.key, { view: event.target.value })}>
                      {VIEWS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  </label>
                  <label className="mt-2 block text-xs text-[#6B6F77]">
                    توضیح این عکس
                    <input className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" maxLength={500} value={item.caption} onChange={(event) => updateItem(item.key, { caption: event.target.value })} />
                  </label>
                  <button type="button" onClick={() => removeItem(item.key)} className="mt-2 text-xs text-[#007BFF]">حذف از مجموعه</button>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="submit" disabled={pending || items.length === 0} className="w-fit rounded-2xl bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-50">ثبت مجموعه</button>
        </form>
      ) : null}

      {sets.length === 0 ? <p className="mt-3 text-sm text-[#A0A4AA]">عکسی برای نمایش نیست.</p> : (
        <ul className="mt-4 space-y-3">
          {sets.map((set) => {
            const photos = Array.isArray(set.photos) ? set.photos : [];
            const review = drafts[set.id] ?? set.review ?? "";
            return (
              <li key={set.id} className="rounded-2xl bg-[#F5F7FB] p-4">
                <p className="text-sm text-[#1F2937]">{showDateTime(set.taken_at)} · {countLabel(photos.length)}</p>
                {set.note ? <p className="mt-2 text-sm leading-7 text-[#6B6F77]">{set.note}</p> : null}
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {photos.map((photo) => (
                    <li key={photo.id}>
                      {previews[photo.id] ? <img src={previews[photo.id]} alt={viewLabel(photo.view)} className="h-36 w-full rounded-2xl object-cover bg-white" /> : <div className="h-36 rounded-2xl bg-white" />}
                      {viewLabel(photo.view) ? <p className="mt-1 text-xs text-[#007BFF]">{viewLabel(photo.view)}</p> : null}
                      {photo.caption ? <p className="mt-1 text-xs leading-5 text-[#6B6F77]">{photo.caption}</p> : null}
                    </li>
                  ))}
                </ul>
                {canReview ? (
                  <label className="mt-4 block text-sm text-[#6B6F77]">
                    تحلیل مربی
                    <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" maxLength={2000} value={review} onChange={(event) => setDrafts((current) => ({ ...current, [set.id]: event.target.value }))} placeholder="آنچه در این مجموعه دیده می‌شود" />
                    <button type="button" disabled={pending} onClick={() => onReview(set.id, review)} className="mt-2 rounded-2xl bg-[#007BFF] px-4 py-2 text-sm text-white disabled:opacity-50">ثبت تحلیل</button>
                  </label>
                ) : set.review ? (
                  <p className="mt-3 text-sm leading-7 text-[#1F2937]">تحلیل مربی: {set.review}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
