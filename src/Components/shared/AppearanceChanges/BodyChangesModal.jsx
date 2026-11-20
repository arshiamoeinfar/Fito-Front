
import { useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";

const INITIAL_VIEWS = [
  {
    id: "front",
    title: "نمای روبرو",
    shortTitle: "روبرو",
    before: "/images/body-before-front.jpg",
    after: "/images/body-after-front.jpg",
  },
  {
    id: "back",
    title: "نمای پشت",
    shortTitle: "پشت",
    before: "/images/body-before-back.jpg",
    after: "/images/body-after-back.jpg",
  },
  {
    id: "right",
    title: "نمای سمت راست",
    shortTitle: "سمت راست",
    before: "/images/body-before-right.jpg",
    after: "/images/body-after-right.jpg",
  },
  {
    id: "left",
    title: "نمای سمت چپ",
    shortTitle: "سمت چپ",
    before: "/images/body-before-left.jpg",
    after: "/images/body-after-left.jpg",
  },
];

const EMPTY_PHOTOS = {
  before: null,
  after: null,
};

const BodyChangesModal = ({ isOpen, onClose }) => {
  const [selectedView, setSelectedView] = useState("front");
  const [photos, setPhotos] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const inputRefs = useRef({});
  const previewUrlsRef = useRef({});

  const currentView = INITIAL_VIEWS.find(
    (view) => view.id === selectedView
  );

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((view) => {
        Object.values(view || {}).forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
      });
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getImage = (viewId, type) => {
    return (
      photos[viewId]?.[type] ||
      INITIAL_VIEWS.find((view) => view.id === viewId)?.[type]
    );
  };

  const hasPhoto = (viewId, type) => {
    return Boolean(photos[viewId]?.[type]);
  };

  const handlePhotoChange = (event, viewId, type) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    const newUrl = URL.createObjectURL(file);
    const oldUrl = previewUrlsRef.current[viewId]?.[type];

    if (oldUrl) URL.revokeObjectURL(oldUrl);

    setPhotos((prev) => ({
      ...prev,
      [viewId]: {
        ...EMPTY_PHOTOS,
        ...prev[viewId],
        [type]: file,
      },
    }));

    setPreviewUrls((prev) => ({
      ...prev,
      [viewId]: {
        ...prev[viewId],
        [type]: newUrl,
      },
    }));

    event.target.value = "";
  };

  const removePhoto = (viewId, type) => {
    const oldUrl = previewUrlsRef.current[viewId]?.[type];

    if (oldUrl) URL.revokeObjectURL(oldUrl);

    setPhotos((prev) => ({
      ...prev,
      [viewId]: {
        ...EMPTY_PHOTOS,
        ...prev[viewId],
        [type]: null,
      },
    }));

    setPreviewUrls((prev) => ({
      ...prev,
      [viewId]: {
        ...prev[viewId],
        [type]: null,
      },
    }));

    if (inputRefs.current[`${viewId}-${type}`]) {
      inputRefs.current[`${viewId}-${type}`].value = "";
    }
  };

  const completedViews = INITIAL_VIEWS.filter(
    (view) =>
      getImage(view.id, "before") &&
      getImage(view.id, "after")
  ).length;

  const totalPhotos = Object.values(photos).reduce(
    (total, view) =>
      total +
      Object.values(view || {}).filter(Boolean).length,
    0
  );

  const renderPhotoCard = (type, title, subtitle) => {
    const image = getImage(currentView.id, type);
    const uploaded = hasPhoto(currentView.id, type);
    const inputKey = `${currentView.id}-${type}`;

    return (
      <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-100 bg-white p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  type === "before" ? "bg-orange-400" : "bg-[#007BFF]"
                }`}
              />
              <h3 className="font-bold text-[#303741]">{title}</h3>
            </div>
            <p className="mt-1 text-xs text-[#9AA1AB]">{subtitle}</p>
          </div>

          {uploaded && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-[#007BFF]">
              عکس جدید
            </span>
          )}
        </div>

        <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F1F4F8] sm:aspect-[3/4]">
          {image ? (
            <>
              <img
                src={image}
                alt={title}
                className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/65 to-transparent p-3 pt-12 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() =>
                    inputRefs.current[inputKey]?.click()
                  }
                  className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-[#303741] transition hover:bg-white"
                >
                  <CameraAltOutlinedIcon sx={{ fontSize: 16 }} />
                  جایگزینی
                </button>

                {uploaded && (
                  <button
                    type="button"
                    onClick={() => removePhoto(currentView.id, type)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-red-500 transition hover:bg-red-50"
                    aria-label="حذف عکس"
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 19 }} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                inputRefs.current[inputKey]?.click()
              }
              className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center transition hover:bg-blue-50/60"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#007BFF] shadow-sm">
                <AddAPhotoOutlinedIcon sx={{ fontSize: 26 }} />
              </span>

              <div>
                <p className="text-sm font-bold text-[#3D424A]">
                  افزودن عکس {title}
                </p>
                <p className="mt-1 text-xs leading-6 text-[#9AA1AB]">
                  برای انتخاب تصویر کلیک کنید
                </p>
              </div>

              <span className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#007BFF] shadow-sm">
                انتخاب تصویر
              </span>
            </button>
          )}

          <input
            ref={(element) => {
              inputRefs.current[inputKey] = element;
            }}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) =>
              handlePhotoChange(event, currentView.id, type)
            }
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-[#9299A3]">
            {uploaded ? "تصویر انتخاب شده" : "بدون تصویر جدید"}
          </span>

          {uploaded && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircleRoundedIcon sx={{ fontSize: 15 }} />
              آماده
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="body-changes-title"
        className="relative z-10 flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden bg-[#F5F7FB] shadow-2xl sm:rounded-[32px] sm:border sm:border-white/20"
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-slate-100 bg-white px-4 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -left-10 -top-20 h-48 w-48 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF]">
                <CompareArrowsRoundedIcon sx={{ fontSize: 27 }} />
              </div>

              <div className="min-w-0">
                <h2
                  id="body-changes-title"
                  className="text-lg font-extrabold text-[#303741] sm:text-2xl"
                >
                  تغییرات ظاهری بدن
                </h2>

                <p className="mt-1 text-xs leading-6 text-[#9299A3] sm:text-sm">
                  مقایسه پیشرفت فیزیکی در بازه‌های زمانی مختلف
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F7FB] text-[#6B6F77] transition hover:bg-red-50 hover:text-red-500"
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Progress */}
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F5F8FD] p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#007BFF] shadow-sm">
                <ImageOutlinedIcon />
              </div>

              <div>
                <p className="text-sm font-bold text-[#303741]">
                  وضعیت تصاویر
                </p>
                <p className="mt-1 text-xs text-[#9299A3]">
                  {completedViews.toLocaleString("fa-IR")} از ۴ زاویه تکمیل شده
                </p>
              </div>
            </div>

            <div className="min-w-[110px]">
              <div className="mb-2 flex justify-between text-[10px] text-[#9299A3]">
                <span>پیشرفت</span>
                <span>
                  {Math.round((completedViews / 4) * 100).toLocaleString("fa-IR")}٪
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#007BFF] transition-all duration-500"
                  style={{ width: `${(completedViews / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          {/* View selector */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#303741] sm:text-base">
                  انتخاب زاویه بدن
                </h3>
                <p className="mt-1 text-xs text-[#9299A3]">
                  برای مشاهده و مدیریت تصاویر هر زاویه انتخاب کنید
                </p>
              </div>

              <span className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[10px] text-[#9299A3]">
                {totalPhotos.toLocaleString("fa-IR")} عکس جدید
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INITIAL_VIEWS.map((view) => {
                const active = selectedView === view.id;
                const hasBefore = getImage(view.id, "before");
                const hasAfter = getImage(view.id, "after");
                const completed = hasBefore && hasAfter;

                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setSelectedView(view.id)}
                    className={`relative flex min-w-0 items-center justify-between gap-2 rounded-2xl border p-3 text-right transition duration-200 ${
                      active
                        ? "border-[#007BFF] bg-blue-50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-bold ${
                          active ? "text-[#007BFF]" : "text-[#505762]"
                        }`}
                      >
                        {view.shortTitle}
                      </p>

                      <p className="mt-1 text-[10px] text-[#A0A6AF]">
                        {completed
                          ? "هر دو تصویر موجود"
                          : `${hasBefore ? "قبل ✓" : "قبل —"}  |  ${hasAfter ? "بعد ✓" : "بعد —"}`}
                      </p>
                    </div>

                    {completed ? (
                      <CheckCircleRoundedIcon
                        sx={{
                          fontSize: 19,
                          color: "#16A36A",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          active ? "bg-[#007BFF]" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison title */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#303741]">
                مقایسه {currentView.title}
              </h3>
              <p className="mt-1 text-xs text-[#9299A3]">
                تصاویر مربوط به این زاویه را انتخاب یا جایگزین کنید
              </p>
            </div>

            <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-[#007BFF]">
              {currentView.title}
            </span>
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {renderPhotoCard(
              "before",
              "قبل",
              "تصویر در شروع دوره"
            )}

            {renderPhotoCard(
              "after",
              "بعد",
              "تصویر در وضعیت فعلی"
            )}
          </div>

          {/* Hint */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 sm:p-4">
            <CameraAltOutlinedIcon
              sx={{ fontSize: 20, color: "#007BFF" }}
            />
            <p className="text-xs leading-6 text-[#64748B]">
              برای مقایسه دقیق‌تر، عکس‌های قبل و بعد را با زاویه،
              فاصله و نورپردازی مشابه ثبت کنید. تصاویر انتخاب‌شده
              فعلاً به‌صورت پیش‌نمایش نمایش داده می‌شوند.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-7">
            <div className="mb-3">
              <h3 className="font-bold text-[#303741]">
                خلاصه تغییرات بدنی
              </h3>
              <p className="mt-1 text-xs text-[#9299A3]">
                آمار ثبت‌شده در طول دوره
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9299A3]">
                    کاهش وزن
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF]">
                    <TrendingDownRoundedIcon />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-[#007BFF]">
                  -5
                  <span className="mr-1 text-xs font-medium text-[#9299A3]">
                    کیلوگرم
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9299A3]">
                    کاهش چربی
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingDownRoundedIcon />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-emerald-600">
                  -8.6
                  <span className="mr-1 text-xs font-medium text-[#9299A3]">
                    درصد
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9299A3]">
                    مدت زمان
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <CompareArrowsRoundedIcon />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-violet-600">
                  120
                  <span className="mr-1 text-xs font-medium text-[#9299A3]">
                    روز
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-center text-xs text-[#9299A3] sm:text-right">
            {totalPhotos > 0
              ? `${totalPhotos.toLocaleString("fa-IR")} تصویر جدید انتخاب شده است`
              : "می‌توانید تصاویر هر زاویه را جداگانه اضافه کنید"}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#007BFF] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 sm:w-auto"
          >
            بستن و بازگشت
          </button>
        </div>
      </div>
    </div>
  );
};

export default BodyChangesModal;
