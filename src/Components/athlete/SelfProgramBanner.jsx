import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../api/client";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

export default function SelfProgramBanner({ onDone }) {
  const [access, setAccess] = useState(undefined);
  const [missing, setMissing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;

    api("/api/v1/athlete/access").then(
      (body) => {
        if (live) setAccess(body);
      },
      () => {
        if (live) setAccess(null);
      },
    );
    api("/api/v1/athlete/intake").then(
      (body) => {
        if (live) setMissing(body.missing ?? []);
      },
      () => {
        if (live) setMissing([]);
      },
    );

    return () => {
      live = false;
    };
  }, []);

  const open = access != null && Array.isArray(access.features) && access.features.includes("workout_programs") && access.features.includes("nutrition_programs");

  if (access === undefined || access === null || (open && missing === null)) {
    return null;
  }

  async function build() {
    setBusy(true);
    setError("");
    setNote("");

    try {
      await api("/api/v1/athlete/self-programs", { method: "POST" });
      setNote("برنامه تمرین و غذا ساخته شد. هر دو کنار برنامه مربی می‌مانند.");
      onDone?.();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="col-span-12 rounded-3xl bg-white px-6 py-5 text-right" dir="rtl">
      {open && missing?.length ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-7 text-[#4B5563]">
            قبل از برنامه باید پرونده‌ات کامل شود: {missing.join("، ")}.
          </p>
          <Link to="/athlete-intake" className="rounded-full bg-[#16845A] px-5 py-3 text-center text-sm text-white">
            تکمیل پرونده
          </Link>
        </div>
      ) : open && Array.isArray(missing) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-7 text-[#4B5563]">
            برنامه از پرونده، عکس بدن و تحلیل‌های قبلی ساخته می‌شود. اگر مربی هم برنامه داده باشد، هر دو دیده می‌شوند.
          </p>
          <button
            type="button"
            onClick={build}
            disabled={busy}
            className="rounded-full bg-[#16845A] px-5 py-3 text-sm text-white disabled:opacity-60"
          >
            {busy ? "در حال ساخت" : "ساخت برنامه با هوش مصنوعی"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-7 text-[#4B5563]">
            برای گرفتن برنامه تمرین و غذا از هوش مصنوعی، یک پلن ورزشکار لازم است. تا قبل از خرید، صفحه‌ها بازند و این بخش قفل است.
          </p>
          <Link to="/athlete-plan" className="rounded-full bg-[#007BFF] px-5 py-3 text-center text-sm text-white">
            دیدن پلن‌ها
          </Link>
        </div>
      )}
      {note ? <p className="mt-3 text-sm text-[#16845A]">{note}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
