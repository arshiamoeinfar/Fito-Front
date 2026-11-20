
import { useEffect, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";

import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ArrowLeftRoundedIcon from "@mui/icons-material/ArrowLeftRounded";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  const fieldError = caught.errors
    ? Object.values(caught.errors)
        .flat()
        .find((item) => typeof item === "string")
    : null;

  return fieldError || caught.message;
}

function when(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
  }).format(date);
}

function statusLabel(status) {
  if (status === "active") return "فعال";
  if (status === "ended") return "پایان‌یافته";
  if (status === "pending") return "در انتظار";
  return status || "—";
}

function statusStyle(status) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-600";
  }

  if (status === "ended") {
    return "bg-slate-100 text-slate-500";
  }

  if (status === "pending") {
    return "bg-amber-50 text-amber-600";
  }

  return "bg-slate-100 text-slate-500";
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-[#FAFBFD] px-5 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF]">
        <Icon sx={{ fontSize: 30 }} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-[#374151]">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-7 text-[#9AA1AB]">
        {description}
      </p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description, count }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF]">
          <Icon sx={{ fontSize: 23 }} />
        </div>

        <div className="min-w-0">
          <h2 className="font-bold text-[#303741] sm:text-lg">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[#9AA1AB]">
            {description}
          </p>
        </div>
      </div>

      <span className="shrink-0 rounded-xl bg-[#F5F7FB] px-3 py-2 text-xs font-semibold text-[#6B6F77]">
        {count.toLocaleString("fa-IR")} مورد
      </span>
    </div>
  );
}

export default function Invitations() {
  const { account } = useSession();
  const phone = account?.phone ?? "";

  const [invitations, setInvitations] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/athlete/invitations"),
      api("/api/v1/athlete/relationships"),
    ]).then(
      ([invitationBody, relationshipBody]) => {
        if (!active) return;

        setInvitations(
          Array.isArray(invitationBody?.invitations)
            ? invitationBody.invitations
            : []
        );

        setRelationships(
          Array.isArray(relationshipBody?.relationships)
            ? relationshipBody.relationships
            : []
        );
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
        }
      }
    );

    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function run(action) {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await action();
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  function requestCode(invitation) {
    setCode("");

    run(async () => {
      await api("/api/v1/auth/otp", {
        method: "POST",
        body: {
          phone,
          purpose: "invitation",
          invitation_id: invitation.id,
        },
      });

      setAcceptingId(invitation.id);
      setNotice("کد تأیید برای شماره همراه شما ارسال شد.");
    });
  }

  function accept(event) {
    event.preventDefault();

    if (code.length !== 5) {
      setError("لطفاً کد پنج‌رقمی را کامل وارد کنید.");
      return;
    }

    run(async () => {
      await api("/api/v1/auth/otp/verify", {
        method: "POST",
        body: {
          phone,
          purpose: "invitation",
          code,
          invitation_id: acceptingId,
        },
      });

      setAcceptingId(null);
      setCode("");
      setNotice("دعوت با موفقیت پذیرفته شد.");
    });
  }

  function decline(invitation) {
    run(async () => {
      await api(
        `/api/v1/athlete/invitations/${invitation.id}/decline`,
        { method: "POST" }
      );

      if (acceptingId === invitation.id) {
        setAcceptingId(null);
        setCode("");
      }

      setNotice("دعوت رد شد.");
    });
  }

  const activeRelationships = relationships.filter(
    (item) => item.status === "active"
  );

  const pendingRelationships = relationships.filter(
    (item) => item.status === "pending"
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-1 md:grid-cols-[90px_minmax(0,1fr)] gap-4 md:gap-6 px-3 py-4 sm:px-5 md:px-8 md:py-6">
        {/* Navbar */}
        <div className="">
          <Navbar />
        </div>

        {/* Main */}
        <main className="min-w-0 py-1 md:py-3">
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            <HeaderDashBoard
              title="دعوت‌ها"
              description="دعوت‌های مربیان و ارتباط‌های ورزشی خود را مدیریت کنید."
            />

            {/* Messages */}
            {error && (
              <div
                dir="rtl"
                className="col-span-12 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-right"
              >
                <InfoOutlinedIcon
                  sx={{ fontSize: 21 }}
                  className="shrink-0 text-red-500"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-700">
                    مشکلی پیش آمده
                  </p>
                  <p className="mt-1 break-words text-xs leading-6 text-red-600">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 text-xs text-red-500"
                >
                  بستن
                </button>
              </div>
            )}

            {notice && (
              <div
                dir="rtl"
                className="col-span-12 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-right"
              >
                <CheckCircleOutlineRoundedIcon
                  sx={{ fontSize: 22 }}
                  className="shrink-0 text-emerald-600"
                />

                <p className="text-sm text-emerald-700">
                  {notice}
                </p>
              </div>
            )}

            {/* Summary */}
            <section
              dir="rtl"
              className="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/40">
                <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-blue-50" />

                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#9299A3]">
                      دعوت‌های دریافتی
                    </p>
                    <p className="mt-3 text-2xl font-extrabold text-[#303741]">
                      {invitations.length.toLocaleString("fa-IR")}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF]">
                    <MarkEmailUnreadOutlinedIcon sx={{ fontSize: 25 }} />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/40">
                <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-emerald-50" />

                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#9299A3]">
                      مربیان فعال
                    </p>
                    <p className="mt-3 text-2xl font-extrabold text-[#303741]">
                      {activeRelationships.length.toLocaleString("fa-IR")}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <GroupsOutlinedIcon sx={{ fontSize: 25 }} />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/40">
                <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-amber-50" />

                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#9299A3]">
                      ارتباط‌های در انتظار
                    </p>
                    <p className="mt-3 text-2xl font-extrabold text-[#303741]">
                      {pendingRelationships.length.toLocaleString("fa-IR")}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <HourglassEmptyRoundedIcon sx={{ fontSize: 25 }} />
                  </div>
                </div>
              </div>
            </section>

            {/* Invitations */}
            <section
              dir="rtl"
              className="col-span-12 min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/30 sm:p-6 md:p-7"
            >
              <SectionHeader
                icon={MarkEmailUnreadOutlinedIcon}
                title="دعوت‌های مربیان"
                description="درخواست همکاری مربیان را بررسی کنید."
                count={invitations.length}
              />

              {invitations.length === 0 ? (
                <EmptyState
                  icon={MarkEmailUnreadOutlinedIcon}
                  title="دعوت جدیدی ندارید"
                  description="در حال حاضر هیچ مربی برای شروع همکاری دعوتی ارسال نکرده است. دعوت‌های جدید در همین بخش نمایش داده می‌شوند."
                />
              ) : (
                <div className="grid gap-4">
                  {invitations.map((invitation) => {
                    const isAccepting =
                      acceptingId === invitation.id;

                    return (
                      <article
                        key={invitation.id}
                        className="overflow-hidden rounded-3xl border border-slate-100 bg-[#FAFBFD] transition hover:border-blue-100"
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-[#007BFF]">
                                <PersonOutlineRoundedIcon
                                  sx={{ fontSize: 27 }}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs text-[#9299A3]">
                                  دعوت از طرف مربی
                                </p>

                                <h3 className="mt-1 break-words text-base font-bold text-[#303741]">
                                  {invitation.coach?.display_name || "مربی"}
                                </h3>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-600">
                                <AccessTimeRoundedIcon
                                  sx={{ fontSize: 15 }}
                                />
                                در انتظار پاسخ
                              </span>

                              <span className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs text-[#9299A3]">
                                <CalendarTodayOutlinedIcon
                                  sx={{ fontSize: 14 }}
                                />
                                تا {when(invitation.expires_at)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => requestCode(invitation)}
                              className="flex items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                              <CheckCircleOutlineRoundedIcon
                                sx={{ fontSize: 18 }}
                              />
                              پذیرش دعوت
                            </button>

                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => decline(invitation)}
                              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-[#6B6F77] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                              <CancelOutlinedIcon
                                sx={{ fontSize: 18 }}
                              />
                              رد دعوت
                            </button>
                          </div>
                        </div>

                        {/* OTP */}
                        {isAccepting && (
                          <div className="border-t border-blue-100 bg-blue-50/70 p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF]">
                                <KeyOutlinedIcon />
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[#303741]">
                                  تأیید شماره همراه
                                </h4>
                                <p className="mt-1 text-xs leading-6 text-[#8490A0]">
                                  کد پنج‌رقمی ارسال‌شده به شماره همراه خود را وارد کنید تا دعوت تأیید شود.
                                </p>
                              </div>
                            </div>

                            <form
                              onSubmit={accept}
                              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                            >
                              <label className="grid flex-1 gap-2 text-xs font-medium text-[#6B6F77]">
                                کد تأیید
                                <input
                                  value={code}
                                  inputMode="numeric"
                                  autoComplete="one-time-code"
                                  maxLength={5}
                                  onChange={(event) =>
                                    setCode(
                                      event.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 5)
                                    )
                                  }
                                  placeholder="مثلاً ۱۲۳۴۵"
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.5em] text-[#303741] outline-none transition placeholder:tracking-normal placeholder:text-sm focus:border-[#007BFF] focus:ring-4 focus:ring-blue-100"
                                  dir="ltr"
                                />
                              </label>

                              <button
                                type="submit"
                                disabled={pending || code.length !== 5}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {pending ? (
                                  <>
                                    <RefreshRoundedIcon className="animate-spin" sx={{ fontSize: 18 }} />
                                    در حال بررسی
                                  </>
                                ) : (
                                  <>
                                    <VerifiedOutlinedIcon
                                      sx={{ fontSize: 18 }}
                                    />
                                    تأیید و پذیرش
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => {
                                  setAcceptingId(null);
                                  setCode("");
                                  setError(null);
                                }}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-[#6B6F77] transition hover:bg-slate-50 disabled:opacity-50"
                              >
                                انصراف
                              </button>
                            </form>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Relationships */}
            <section
              dir="rtl"
              className="col-span-12 min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/30 sm:p-6 md:p-7"
            >
              <SectionHeader
                icon={GroupsOutlinedIcon}
                title="ارتباط‌های من"
                description="وضعیت همکاری شما با مربیان"
                count={relationships.length}
              />

              {relationships.length === 0 ? (
                <EmptyState
                  icon={FitnessCenterRoundedIcon}
                  title="هنوز با مربی‌ای ارتباط ندارید"
                  description="پس از پذیرفتن دعوت یک مربی، اطلاعات ارتباط شما در این قسمت نمایش داده می‌شود."
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {relationships.map((relationship) => (
                    <article
                      key={relationship.id}
                      className="flex min-w-0 flex-col justify-between gap-4 rounded-3xl border border-slate-100 bg-[#FAFBFD] p-4 transition hover:border-blue-100 sm:p-5"
                    >
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF]">
                            <PersonOutlineRoundedIcon
                              sx={{ fontSize: 26 }}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] text-[#9AA1AB]">
                              مربی شما
                            </p>
                            <h3 className="mt-1 truncate text-sm font-bold text-[#303741]">
                              {relationship.coach?.display_name || "—"}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${statusStyle(
                            relationship.status
                          )}`}
                        >
                          {statusLabel(relationship.status)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 text-xs text-[#9299A3]">
                          <CalendarTodayOutlinedIcon
                            sx={{ fontSize: 16 }}
                          />
                          وضعیت ارتباط
                        </div>

                        <span className="text-xs font-medium text-[#6B6F77]">
                          {statusLabel(relationship.status)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Help */}
            <div
              dir="rtl"
              className="col-span-12 flex items-start gap-3 rounded-3xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF]">
                <InfoOutlinedIcon />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3D424A]">
                  راهنمای دعوت‌ها
                </h3>
                <p className="mt-1 text-xs leading-7 text-[#7B8795]">
                  برای شروع همکاری، دعوت مربی را انتخاب و کد تأیید ارسال‌شده به شماره همراه خود را وارد کنید. پس از تأیید، ارتباط شما در بخش ارتباط‌های من نمایش داده می‌شود.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
