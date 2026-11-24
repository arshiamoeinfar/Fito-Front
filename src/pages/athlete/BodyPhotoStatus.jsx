import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Check, ChevronLeft, X } from "lucide-react";
import { api } from "../../api/client";

function collectViews(body) {
  const views = new Set();
  const sets = Array.isArray(body?.sets) ? body.sets : [];
  const photos = Array.isArray(body?.photos) ? body.photos : [];
  sets.forEach((set) => {
    (Array.isArray(set.photos) ? set.photos : []).forEach((photo) => {
      if (photo?.view) views.add(photo.view);
    });
  });
  photos.forEach((photo) => {
    if (photo?.view) views.add(photo.view);
  });
  return views;
}

export default function BodyPhotoStatus() {
  const [views, setViews] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api("/api/v1/athlete/body-photos")
      .then((body) => {
        if (mounted) setViews(collectViews(body));
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const front = views.has("front");
  const back = views.has("back");
  const side = views.has("left") || views.has("right");
  const done = front && back && side;

  const chip = (label, ok) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
        ok
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
      }`}
    >
      {ok ? <Check size={13} /> : <X size={13} />}
      {label}
      {ok ? " ثبت شده" : " ثبت نشده"}
    </span>
  );

  return (
    <Link
      to="/AnalysisPage/tools?panel=photos"
      className="group mt-5 flex items-center gap-3 rounded-2xl border border-[#E6EDF5] bg-[#F9FBFE] p-4 transition hover:border-[#C9DFFF] hover:bg-[#F2F8FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] dark:border-white/10 dark:bg-[#182333] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300">
        <Camera className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#30435A] dark:text-white">
          قدم بعدی: ثبت وزن و عکس بدن
        </span>

        <span className="mt-1 block text-[11px] leading-6 text-[#8794A5] dark:text-gray-400">
          {loading
            ? "در حال بررسی عکس‌های ثبت‌شده..."
            : done
              ? "عکس جلو، پشت و بغل ثبت شده است."
              : "وزن فعلی و سه عکس جلو، بغل و پشت را برای تکمیل اطلاعات بدنی ثبت کن."}
        </span>

        {!loading && (
          <span className="mt-2 flex flex-wrap gap-2">
            {chip("جلو", front)}
            {chip("پشت", back)}
            {chip("بغل", side)}
          </span>
        )}
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#8290A2] transition group-hover:-translate-x-1 group-hover:text-[#007BFF] dark:bg-white/5">
        <ChevronLeft size={19} />
      </span>
    </Link>
  );
}
