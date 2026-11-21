import { useEffect, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";

import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function when(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status) {
  if (status === "open") return "باز";
  if (status === "resolved") return "بسته‌شده";
  if (status === "active") return "فعال";
  if (status === "ended") return "پایان‌یافته";
  return status || "—";
}

function statusStyle(status) {
  if (status === "open" || status === "active") {
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
  }

  if (status === "resolved" || status === "ended") {
    return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  }

  return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
}

function sharedMessages(thread) {
  return (thread?.messages ?? []).filter(
    (message) => message.visibility !== "coach_only"
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-[#FAFBFD] px-5 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-400">
        <Icon sx={{ fontSize: 30 }} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-[#374151] dark:text-slate-100">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-7 text-[#9AA1AB] dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function AthleteFeedback() {
  const [relationships, setRelationships] = useState([]);
  const [threads, setThreads] = useState([]);
  const [relationshipId, setRelationshipId] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    let active = true;

    setLoaded(false);

    Promise.all([
      api("/api/v1/athlete/relationships"),
      api("/api/v1/athlete/feedback-threads"),
    ]).then(
      ([relationshipBody, threadBody]) => {
        if (!active) return;

        const rows = Array.isArray(relationshipBody?.relationships)
          ? relationshipBody.relationships
          : [];

        setRelationships(rows);
        setThreads(
          Array.isArray(threadBody?.threads)
            ? threadBody.threads
            : []
        );

        setRelationshipId((current) =>
          current ||
          String(
            rows.find((row) => row.status === "active")?.id ??
              rows[0]?.id ??
              ""
          )
        );

        setLoaded(true);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
          setLoaded(true);
        }
      }
    );

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!threadId) {
      setDetail(null);
      return undefined;
    }

    let active = true;

    setDetailLoading(true);
    setDetail(null);

    api(`/api/v1/athlete/feedback-threads/${threadId}`).then(
      (thread) => {
        if (active) {
          setDetail(thread);
          setDetailLoading(false);
        }
      },
      (caught) => {
        if (active) {
          setDetail(null);
          setDetailLoading(false);
          setError(errorText(caught));
        }
      }
    );

    return () => {
      active = false;
    };
  }, [threadId, reloadKey]);

  const relationship =
    relationships.find(
      (row) => String(row.id) === String(relationshipId)
    ) ?? null;

  const visibleThreads = threads.filter(
    (thread) =>
      String(thread.coaching_relationship_id) ===
      String(relationshipId)
  );

  const activeRelationship = relationship?.status === "active";
  const messages = sharedMessages(detail);

  const openCount = visibleThreads.filter(
    (thread) => thread.status === "open"
  ).length;

  const resolvedCount = visibleThreads.filter(
    (thread) => thread.status === "resolved"
  ).length;

  async function openThread(event) {
    event.preventDefault();

    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const created = await api(
        "/api/v1/athlete/feedback-threads",
        {
          method: "POST",
          body: {
            coaching_relationship_id: Number(relationshipId),
            body,
          },
        }
      );

      setBody("");
      setThreadId(created.id);
      setMobileChatOpen(true);
      setNotice("موضوع جدید با موفقیت برای مربی ثبت شد.");
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function reply(event) {
    event.preventDefault();

    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await api(
        `/api/v1/athlete/feedback-threads/${threadId}/messages`,
        {
          method: "POST",
          body: { body },
        }
      );

      setBody("");
      setNotice("پاسخ شما با موفقیت ثبت شد.");
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  function createNewThread() {
    setThreadId(null);
    setDetail(null);
    setBody("");
    setNotice(null);
    setError(null);
    setMobileChatOpen(true);
  }

  function selectThread(id) {
    setThreadId(id);
    setBody("");
    setNotice(null);
    setError(null);
    setMobileChatOpen(true);
  }

  const canWrite =
    activeRelationship &&
    (!detail || detail.status === "open");

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB] dark:bg-slate-950">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 px-3 py-4 sm:px-5 md:grid-cols-[90px_minmax(0,1fr)] md:gap-6 md:px-8 md:py-6">
        {/* Navbar */}
        <div className="">
          <Navbar />
        </div>

        {/* Main */}
        <main className="min-w-0 py-1 md:py-3">
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            <HeaderDashBoard
              title="بازخورد"
              description="گفت‌وگو و ارتباط مستقیم با مربی خود"
            />

            {/* Notifications */}
            {error && (
              <div
                dir="rtl"
                className="col-span-12 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-right dark:border-red-900/60 dark:bg-red-950/30"
              >
                <InfoOutlinedIcon
                  sx={{ fontSize: 21 }}
                  className="shrink-0 text-red-500"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    خطا در انجام عملیات
                  </p>
                  <p className="mt-1 break-words text-xs leading-6 text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 text-xs text-red-500 dark:text-red-400"
                >
                  بستن
                </button>
              </div>
            )}

            {notice && (
              <div
                dir="rtl"
                className="col-span-12 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-right dark:border-emerald-900/60 dark:bg-emerald-950/30"
              >
                <CheckCircleOutlineRoundedIcon
                  sx={{ fontSize: 22 }}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {notice}
                </p>
              </div>
            )}

            {/* Relationship selector */}
            <section
              dir="rtl"
              className="col-span-12 flex min-w-0 flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/30 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-400">
                  <PersonOutlineRoundedIcon sx={{ fontSize: 24 }} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-[#9AA1AB] dark:text-slate-400">
                    گفت‌وگو با مربی
                  </p>

                  <h2 className="mt-1 truncate text-sm font-bold text-[#303741] dark:text-slate-100">
                    {relationship?.coach?.display_name || "انتخاب مربی"}
                  </h2>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-2 sm:w-72">
                <label className="text-xs text-[#9299A3] dark:text-slate-400">
                  انتخاب رابطه
                </label>

                <select
                  value={relationshipId}
                  onChange={(event) => {
                    setRelationshipId(event.target.value);
                    setThreadId(null);
                    setDetail(null);
                    setBody("");
                    setMobileChatOpen(false);
                    setError(null);
                    setNotice(null);
                  }}
                  className="w-full min-w-0 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#4B5563] outline-none transition focus:border-[#007BFF] focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-900/40"
                >
                  {relationships.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.coach?.display_name || "مربی"} —{" "}
                      {statusLabel(row.status)}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Stats */}
            <section
              dir="rtl"
              className="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#9299A3] dark:text-slate-400">
                      کل موضوع‌ها
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-[#303741] dark:text-slate-100">
                      {visibleThreads.length.toLocaleString("fa-IR")}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-400">
                    <ForumOutlinedIcon />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#9299A3] dark:text-slate-400">
                      موضوع‌های باز
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {openCount.toLocaleString("fa-IR")}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <ChatBubbleOutlineRoundedIcon />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#9299A3] dark:text-slate-400">
                      موضوع‌های بسته
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-500 dark:text-slate-400">
                      {resolvedCount.toLocaleString("fa-IR")}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <CheckCircleOutlineRoundedIcon />
                  </div>
                </div>
              </div>
            </section>

            {/* Chat application */}
            <section
              dir="rtl"
              className="col-span-12 min-w-0 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm shadow-slate-200/30 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10"
            >
              <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
                {/* Threads sidebar */}
                <aside
                  className={`min-w-0 border-l border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 ${
                    mobileChatOpen ? "hidden lg:block" : "block"
                  }`}
                >
                  <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-[#303741] dark:text-slate-100">
                          پیام‌ها و موضوع‌ها
                        </h2>
                        <p className="mt-1 text-xs text-[#9AA1AB] dark:text-slate-400">
                          تاریخچه گفت‌وگوهای شما
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={createNewThread}
                        disabled={!activeRelationship}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007BFF] text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="موضوع جدید"
                      >
                        <AddRoundedIcon />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={createNewThread}
                      disabled={!activeRelationship}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-semibold text-[#007BFF] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/70"
                    >
                      <AddRoundedIcon sx={{ fontSize: 19 }} />
                      شروع موضوع جدید
                    </button>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-[#6B6F77] dark:text-slate-300">
                        فهرست موضوع‌ها
                      </span>

                      <span className="text-[11px] text-[#A0A4AA] dark:text-slate-500">
                        {visibleThreads.length.toLocaleString("fa-IR")} مورد
                      </span>
                    </div>

                    {!loaded ? (
                      <div className="grid gap-3">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="h-20 animate-pulse rounded-2xl bg-[#F5F7FB] dark:bg-slate-800"
                          />
                        ))}
                      </div>
                    ) : visibleThreads.length === 0 ? (
                      <div className="rounded-2xl bg-[#F8FAFC] px-4 py-8 text-center dark:bg-slate-800">
                        <ForumOutlinedIcon
                          sx={{
                            fontSize: 28,
                            color: "#A0A4AA",
                          }}
                        />
                        <p className="mt-3 text-xs font-semibold text-[#6B6F77] dark:text-slate-300">
                          موضوعی وجود ندارد
                        </p>
                        <p className="mt-2 text-[11px] leading-6 text-[#A0A4AA] dark:text-slate-500">
                          اولین موضوع خود را با مربی شروع کنید.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {visibleThreads.map((thread) => {
                          const active = threadId === thread.id;

                          return (
                            <button
                              key={thread.id}
                              type="button"
                              onClick={() => selectThread(thread.id)}
                              className={`group w-full min-w-0 rounded-2xl border p-3 text-right transition ${
                                active
                                  ? "border-blue-100 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40"
                                  : "border-transparent bg-[#F8FAFC] hover:border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-700/70"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                      active
                                        ? "bg-white text-[#007BFF] dark:bg-slate-800 dark:text-blue-400"
                                        : "bg-white text-[#9299A3] dark:bg-slate-700 dark:text-slate-400"
                                    }`}
                                  >
                                    <ForumOutlinedIcon
                                      sx={{ fontSize: 19 }}
                                    />
                                  </div>

                                  <span
                                    className={`truncate text-sm font-bold ${
                                      active
                                        ? "text-[#007BFF] dark:text-blue-400"
                                        : "text-[#4B5563] dark:text-slate-200"
                                    }`}
                                  >
                                    موضوع {thread.id}
                                  </span>
                                </div>

                                <span
                                  className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${statusStyle(
                                    thread.status
                                  )}`}
                                >
                                  {statusLabel(thread.status)}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-1 truncate text-[10px] text-[#A0A4AA] dark:text-slate-500">
                                  <AccessTimeRoundedIcon
                                    sx={{ fontSize: 13 }}
                                  />
                                  {when(thread.created_at)}
                                </span>

                                <ArrowBackRoundedIcon
                                  sx={{
                                    fontSize: 16,
                                    color: active ? "#007BFF" : "#B8BEC7",
                                  }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </aside>

                {/* Chat area */}
                <div
                  className={`flex min-w-0 flex-col bg-[#FAFBFD] dark:bg-slate-950/60 ${
                    mobileChatOpen ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {!threadId && !mobileChatOpen ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-400">
                        <ForumOutlinedIcon sx={{ fontSize: 38 }} />
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-[#303741] dark:text-slate-100">
                        گفت‌وگوی خود را شروع کنید
                      </h3>

                      <p className="mt-2 max-w-sm text-sm leading-7 text-[#9299A3] dark:text-slate-400">
                        یکی از موضوع‌های قبلی را انتخاب کنید یا برای مطرح کردن یک مسئله جدید، گفت‌وگوی تازه‌ای بسازید.
                      </p>

                      <button
                        type="button"
                        onClick={createNewThread}
                        disabled={!activeRelationship}
                        className="mt-6 flex items-center gap-2 rounded-2xl bg-[#007BFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:opacity-50"
                      >
                        <AddRoundedIcon sx={{ fontSize: 19 }} />
                        شروع گفت‌وگوی جدید
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Chat header */}
                      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setMobileChatOpen(false)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F7FB] text-[#6B6F77] dark:bg-slate-800 dark:text-slate-300 lg:hidden"
                            aria-label="بازگشت به فهرست"
                          >
                            <ArrowForwardRoundedIcon />
                          </button>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-400">
                            <PersonOutlineRoundedIcon />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-[#303741] dark:text-slate-100">
                              {threadId
                                ? `موضوع ${threadId}`
                                : "موضوع جدید"}
                            </h3>

                            <p className="mt-1 truncate text-xs text-[#9299A3] dark:text-slate-400">
                              {relationship?.coach?.display_name ||
                                "گفت‌وگو با مربی"}
                            </p>
                          </div>
                        </div>

                        {detail && (
                          <span
                            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${statusStyle(
                              detail.status
                            )}`}
                          >
                            {statusLabel(detail.status)}
                          </span>
                        )}
                      </div>

                      {/* Messages */}
                      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                        {detailLoading ? (
                          <div className="grid gap-4">
                            {[1, 2, 3].map((item) => (
                              <div
                                key={item}
                                className={`h-20 max-w-[75%] animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/60 ${
                                  item % 2 === 0 ? "mr-auto" : "ml-auto"
                                }`}
                              />
                            ))}
                          </div>
                        ) : !detail ? (
                          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-400">
                              <ChatBubbleOutlineRoundedIcon
                                sx={{ fontSize: 30 }}
                              />
                            </div>

                            <h3 className="mt-4 text-sm font-bold text-[#303741] dark:text-slate-100">
                              موضوع جدید
                            </h3>

                            <p className="mt-2 max-w-xs text-xs leading-7 text-[#9299A3] dark:text-slate-400">
                              پیام خود را بنویسید تا موضوع جدیدی برای مربی ایجاد شود.
                            </p>
                          </div>
                        ) : messages.length === 0 ? (
                          <EmptyState
                            icon={ChatBubbleOutlineRoundedIcon}
                            title="هنوز پیامی وجود ندارد"
                            description="می‌توانید اولین پیام این گفت‌وگو را ارسال کنید."
                          />
                        ) : (
                          <div className="grid content-start gap-4">
                            {messages.map((message) => (
                              <article
                                key={message.id}
                                className="max-w-[90%] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/10 sm:max-w-[80%]"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#007BFF] dark:bg-blue-950/50 dark:text-blue-400">
                                    <PersonOutlineRoundedIcon
                                      sx={{ fontSize: 16 }}
                                    />
                                  </div>

                                  <span className="text-xs font-semibold text-[#6B6F77] dark:text-slate-300">
                                    پیام مشترک
                                  </span>
                                </div>

                                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-8 text-[#4B5563] dark:text-slate-200">
                                  {message.body}
                                </p>

                                <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-[#A0A4AA] dark:text-slate-500">
                                  <AccessTimeRoundedIcon
                                    sx={{ fontSize: 13 }}
                                  />
                                  {when(message.created_at)}
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Composer */}
                      <div className="shrink-0 border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                        {!activeRelationship && (
                          <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <InfoOutlinedIcon sx={{ fontSize: 18 }} />
                            رابطه فعال نیست؛ امکان ارسال پیام وجود ندارد.
                          </div>
                        )}

                        {detail && detail.status !== "open" && (
                          <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <LockOutlinedIcon sx={{ fontSize: 17 }} />
                            این موضوع بسته شده و امکان ارسال پاسخ ندارد.
                          </div>
                        )}

                        <form
                          onSubmit={detail ? reply : openThread}
                          className="grid gap-3"
                        >
                          <label className="text-xs font-medium text-[#9299A3] dark:text-slate-400">
                            {detail ? "پاسخ شما" : "متن موضوع"}
                          </label>

                          <textarea
                            value={body}
                            onChange={(event) =>
                              setBody(event.target.value)
                            }
                            rows={3}
                            maxLength={5000}
                            disabled={!canWrite || pending}
                            placeholder={
                              detail
                                ? "پاسخ خود را برای مربی بنویسید..."
                                : "موضوع یا بازخورد خود را با مربی در میان بگذارید..."
                            }
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm leading-7 text-[#4B5563] outline-none transition placeholder:text-[#B2B8C2] focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:focus:ring-blue-900/40"
                          />

                          <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
                            <p className="text-[10px] text-[#A0A4AA] dark:text-slate-500">
                              {body.length.toLocaleString("fa-IR")} / ۵۰۰۰ کاراکتر
                            </p>

                            <button
                              type="submit"
                              disabled={
                                pending ||
                                !canWrite ||
                                body.trim() === "" ||
                                detailLoading
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#007BFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                              {pending ? (
                                <>
                                  <RefreshRoundedIcon
                                    className="animate-spin"
                                    sx={{ fontSize: 18 }}
                                  />
                                  در حال ارسال
                                </>
                              ) : (
                                <>
                                  <SendRoundedIcon
                                    sx={{ fontSize: 18 }}
                                  />
                                  {detail ? "ارسال پاسخ" : "ثبت موضوع"}
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Guide */}
            <section
              dir="rtl"
              className="col-span-12 flex items-start gap-3 rounded-3xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/30 sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#007BFF] dark:bg-slate-800 dark:text-blue-400">
                <FitnessCenterRoundedIcon />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#3D424A] dark:text-slate-100">
                  ارتباط بهتر با مربی
                </h3>

                <p className="mt-1 text-xs leading-7 text-[#7B8795] dark:text-slate-400">
                  برای دریافت پاسخ دقیق‌تر، موضوع خود را واضح و با جزئیات کافی مطرح کنید. هر موضوع یک گفت‌وگوی مستقل است و می‌توانید برای مسائل مختلف، موضوع‌های جداگانه ایجاد کنید.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}