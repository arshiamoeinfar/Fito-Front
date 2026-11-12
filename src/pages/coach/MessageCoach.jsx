import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import InsertEmoticonOutlinedIcon from "@mui/icons-material/InsertEmoticonOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";
import { faDigits, showDate } from "../../lib/jalali";

const EMOJIS = ["😊", "😂", "❤️", "👍", "💪", "🔥", "👏", "✅", "🙏", "🏋️‍♂️", "🥗", "💧"];

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function clock(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status) {
  if (status === "open") return "باز";
  if (status === "resolved") return "بسته‌شده";
  if (status === "active") return "فعال";
  if (status === "ended") return "پایان‌یافته";
  return status || "—";
}

export default function MessageCoach() {
  const { account } = useSession();
  const [searchParams] = useSearchParams();
  const requestedRelationship = searchParams.get("relationship") || "";
  const [relationships, setRelationships] = useState([]);
  const [threads, setThreads] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [relationshipId, setRelationshipId] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("shared");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [listQuery, setListQuery] = useState("");
  const [messageQuery, setMessageQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/coach/relationships"),
      api("/api/v1/coach/feedback-threads"),
    ]).then(
      ([relationshipBody, threadBody]) => {
        if (!active) {
          return;
        }

        const rows = Array.isArray(relationshipBody?.relationships) ? relationshipBody.relationships : [];
        const threadRows = Array.isArray(threadBody?.threads) ? threadBody.threads : [];
        const requested = rows.some((row) => String(row.id) === requestedRelationship) ? requestedRelationship : "";
        const preferred = relationshipId || requested || String(rows.find((row) => row.status === "active")?.id ?? rows[0]?.id ?? "");
        const own = threadRows.filter((thread) => String(thread.coaching_relationship_id) === preferred);

        setRelationships(rows);
        setThreads(threadRows);
        setRelationshipId(preferred);
        setThreadId((current) => {
          if (current && own.some((thread) => thread.id === current)) {
            return current;
          }

          return own.find((thread) => thread.status === "open")?.id ?? own[0]?.id ?? null;
        });
        setLoaded(true);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
          setLoaded(true);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [relationshipId, reloadKey, requestedRelationship]);

  useEffect(() => {
    if (!relationshipId) {
      return undefined;
    }

    let active = true;

    api(`/api/v1/coach/relationships/${relationshipId}/workout-sessions`).then(
      (sessionBody) => {
        if (active) {
          setSessions(Array.isArray(sessionBody?.sessions) ? sessionBody.sessions : []);
        }
      },
      () => {
        if (active) {
          setSessions([]);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [relationshipId]);

  useEffect(() => {
    if (!threadId) {
      return undefined;
    }

    let active = true;

    api(`/api/v1/coach/feedback-threads/${threadId}`).then(
      (thread) => {
        if (active) {
          setDetail(thread);
        }
      },
      (caught) => {
        if (active) {
          setDetail(null);
          setError(errorText(caught));
        }
      },
    );

    return () => {
      active = false;
    };
  }, [threadId, reloadKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [detail, messageQuery]);

  const relationship = relationships.find((row) => String(row.id) === String(relationshipId)) ?? null;
  const visibleThreads = threads.filter((thread) => String(thread.coaching_relationship_id) === String(relationshipId));
  const activeRelationship = relationship?.status === "active";
  const query = listQuery.trim();
  const visibleStudents = relationships.filter((row) => {
    const name = row.athlete?.display_name || "شاگرد";
    return !query || name.includes(query);
  });
  const messages = (detail?.messages ?? []).filter((message) => {
    const text = messageQuery.trim();
    return !text || String(message.body || "").includes(text);
  });

  function latestThread(id) {
    return threads
      .filter((thread) => String(thread.coaching_relationship_id) === String(id))
      .sort((left, right) => String(left.created_at).localeCompare(String(right.created_at)))
      .at(-1) ?? null;
  }

  function selectStudent(id) {
    const own = threads.filter((thread) => String(thread.coaching_relationship_id) === String(id));
    setRelationshipId(String(id));
    setThreadId(own.find((thread) => thread.status === "open")?.id ?? own[0]?.id ?? null);
    setDetail(null);
    setSessionId("");
    setBody("");
    setShowEmoji(false);
  }

  async function openThread(event) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const payload = {
        coaching_relationship_id: Number(relationshipId),
        body,
        visibility,
      };

      if (sessionId) {
        payload.workout_session_id = Number(sessionId);
      }

      const created = await api("/api/v1/coach/feedback-threads", { method: "POST", body: payload });
      setBody("");
      setSessionId("");
      setThreadId(created.id);
      setNotice(visibility === "coach_only" ? "یادداشت داخلی ثبت شد." : "موضوع برای ورزشکار ثبت شد.");
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
      await api(`/api/v1/coach/feedback-threads/${threadId}/messages`, {
        method: "POST",
        body: { body, visibility },
      });
      setBody("");
      setNotice(visibility === "coach_only" ? "یادداشت داخلی ثبت شد." : "پاسخ برای ورزشکار ثبت شد.");
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function resolveThread() {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await api(`/api/v1/coach/feedback-threads/${threadId}/resolve`, { method: "POST", body: {} });
      setNotice("موضوع بسته شد.");
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F7FB]">
      <div className="grid w-full max-w-[1600px] grid-cols-1 gap-4 bg-[#F5F7FB] px-4 py-4 sm:px-6 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <HeaderDashBoard title="پیام ها" description="گفنگو با شاگردان" />
            {error && <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700">{error}</p>}
            {notice && <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700">{notice}</p>}

            <div className="col-span-12 lg:col-span-4">
              <div className="flex h-full flex-col rounded-3xl bg-white p-5">
                <h2 className="px-1 text-right text-xl text-[#4F5965]">گفتگوهای شاگردان</h2>
                <div className="relative mt-4">
                  <input
                    value={listQuery}
                    onChange={(event) => setListQuery(event.target.value)}
                    placeholder="جستجوی شاگرد..."
                    className="h-11 w-full rounded-2xl bg-[#F5F7FB] pr-10 pl-4 text-sm text-[#4F5965] outline-none placeholder:text-[#A0A4AA]"
                  />
                  <SearchRoundedIcon className="absolute top-1/2 right-3 -translate-y-1/2 text-[#A0A4AA]" sx={{ fontSize: 18 }} />
                </div>
                <hr className="my-5 text-gray-100" />
                <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
                  {loaded && visibleStudents.length === 0 && (
                    <p className="px-2 text-sm text-[#A0A4AA]">شاگردی پیدا نشد</p>
                  )}
                  {visibleStudents.map((row) => {
                    const latest = latestThread(row.id);
                    const name = row.athlete?.display_name || "شاگرد";
                    const active = String(row.id) === String(relationshipId);

                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => selectStudent(row.id)}
                        className={`w-full cursor-pointer rounded-3xl px-4 py-3.5 text-right transition ${active ? "bg-[#EAF3FF]" : "hover:bg-[#F5F7FB]"}`}
                      >
                        <div className="flex w-full items-center gap-2">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0F4FA] text-sm text-[#4F5965]">
                            {name.slice(0, 1)}
                          </div>
                          <div className="flex w-full min-w-0 items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-[#4F5965]">{name}</p>
                            <span className="shrink-0 text-xs text-[#A0A4AA]">{latest ? clock(latest.created_at) : ""}</span>
                          </div>
                        </div>
                        <p className="mt-1 truncate text-xs text-[#A0A4AA]">
                          {latest ? `موضوع ${statusLabel(latest.status)}` : "بدون گفتگو"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-span-12 min-w-0 lg:col-span-8">
              {!relationship && (
                <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl bg-white p-8">
                  <SendRoundedIcon sx={{ fontSize: 28 }} className="text-[#A0A4AA]" />
                  <p className="mt-3 text-sm text-[#4F5965]">یک گفتگو را انتخاب کنید</p>
                </div>
              )}
              {relationship && (
                <div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-3xl bg-white lg:h-[calc(100vh-220px)] lg:max-h-[820px]">
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8ECF1] bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E8ECF1] bg-[#F0F4FA] text-sm text-[#4F5965]">
                        {(relationship.athlete?.display_name || "ش").slice(0, 1)}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#4F5965]">{relationship.athlete?.display_name || "شاگرد"}</p>
                        <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${activeRelationship ? "text-[#16A34A]" : "text-[#A0A4AA]"}`}>
                          {statusLabel(relationship.status)}
                          <span className={`h-2 w-2 rounded-full ${activeRelationship ? "bg-[#16A34A]" : "bg-[#E8ECF1]"}`} />
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSearch((current) => !current);
                          setMessageQuery("");
                        }}
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full ${showSearch ? "bg-[#007BFF] text-white" : "bg-[#F5F7FB] text-[#A0A4AA]"}`}
                      >
                        <SearchRoundedIcon sx={{ fontSize: 20 }} />
                      </button>
                      {showSearch && (
                        <input
                          value={messageQuery}
                          onChange={(event) => setMessageQuery(event.target.value)}
                          placeholder="جستجو در پیام‌ها..."
                          className="w-36 rounded-full bg-[#F5F7FB] px-3 py-2 text-xs text-[#4F5965] outline-none sm:w-56"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto border-b border-[#E8ECF1] px-6 py-3">
                    {visibleThreads.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => setThreadId(thread.id)}
                        className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs ${threadId === thread.id ? "bg-[#EAF3FF] text-[#007BFF]" : "bg-[#F5F7FB] text-[#6B6F77]"}`}
                      >
                        موضوع {faDigits(thread.id)} · {statusLabel(thread.status)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setThreadId(null);
                        setDetail(null);
                        setSessionId("");
                      }}
                      className="shrink-0 cursor-pointer rounded-full bg-[#F5F7FB] px-3 py-1.5 text-xs text-[#007BFF]"
                    >
                      موضوع تازه
                    </button>
                    {detail?.status === "open" && activeRelationship && (
                      <button type="button" disabled={pending} onClick={resolveThread} className="shrink-0 cursor-pointer rounded-full bg-[#F5F7FB] px-3 py-1.5 text-xs text-[#6B6F77] disabled:opacity-60">
                        بستن موضوع
                      </button>
                    )}
                  </div>

                  <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
                    {messages.length === 0 && (
                      <div className="my-auto text-center">
                        <p className="text-sm text-[#A0A4AA]">
                          {messageQuery ? "پیامی با این عبارت پیدا نشد." : "هنوز پیامی ثبت نشده — اولین پیام رو بفرست 👋"}
                        </p>
                      </div>
                    )}
                    {messages.map((message) => {
                      const mine = account?.user_id != null && message.author_user_id === account.user_id;

                      return (
                        <div key={message.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-7 sm:max-w-[75%] ${mine ? "rounded-tl-sm bg-[#007BFF] text-white" : "rounded-tr-sm bg-[#F0F4FA] text-[#4F5965]"}`}>
                            <p className="text-right whitespace-pre-wrap break-words">{message.body}</p>
                            {message.visibility === "coach_only" && (
                              <p className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-[#A0A4AA]"}`}>یادداشت داخلی</p>
                            )}
                            {message.pain_level != null && (
                              <p className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-[#A0A4AA]"}`}>درد {faDigits(message.pain_level)}</p>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1 px-1">
                            {mine && <DoneAllRoundedIcon sx={{ fontSize: 14 }} className="text-[#007BFF]" />}
                            <span className="text-[11px] text-[#A0A4AA]">{clock(message.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={detail ? reply : openThread} className="shrink-0 border-t border-[#E8ECF1] bg-white px-5 py-4">
                    {!activeRelationship && <p className="mb-3 text-right text-sm text-[#A0A4AA]">رابطه فعال نیست؛ پیام تازه ثبت نمی‌شود.</p>}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <select
                        value={visibility}
                        onChange={(event) => setVisibility(event.target.value)}
                        className="rounded-full bg-[#F5F7FB] px-3 py-2 text-xs text-[#4F5965] outline-none"
                      >
                        <option value="shared">برای ورزشکار</option>
                        <option value="coach_only">یادداشت داخلی</option>
                      </select>
                      {!detail && (
                        <select
                          value={sessionId}
                          onChange={(event) => setSessionId(event.target.value)}
                          className="rounded-full bg-[#F5F7FB] px-3 py-2 text-xs text-[#4F5965] outline-none"
                        >
                          <option value="">بدون جلسه</option>
                          {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                              جلسه {faDigits(session.id)} — {showDate(session.performed_on)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={pending || !activeRelationship || body.trim() === ""}
                        className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#007BFF] px-6 py-3 text-sm text-white transition hover:bg-[#0066D6] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {detail ? "ارسال پیام" : "شروع موضوع"}
                        <SendRoundedIcon sx={{ fontSize: 16 }} />
                      </button>
                      <div className="relative flex flex-1 items-center rounded-full bg-[#F5F7FB] px-2 py-1.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007BFF] text-white" title="پیام صوتی در این گفتگو ثبت نمی‌شود">
                          <MicNoneOutlinedIcon sx={{ fontSize: 18 }} />
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowEmoji((current) => !current)}
                          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full ${showEmoji ? "bg-[#007BFF]/10 text-[#007BFF]" : "text-[#A0A4AA]"}`}
                        >
                          <InsertEmoticonOutlinedIcon sx={{ fontSize: 20 }} />
                        </button>
                        <span className="flex h-9 w-9 items-center justify-center text-[#A0A4AA]" title="فایل در این گفتگو ثبت نمی‌شود">
                          <AttachFileOutlinedIcon sx={{ fontSize: 18 }} />
                        </span>
                        <input
                          value={body}
                          onChange={(event) => setBody(event.target.value)}
                          placeholder="پیام خود را بنویسید..."
                          className="flex-1 bg-transparent px-2 text-right text-sm text-[#4F5965] outline-none"
                        />
                        {showEmoji && (
                          <div className="absolute bottom-14 right-0 z-20 grid w-56 grid-cols-6 gap-1 rounded-2xl border border-[#E8ECF1] bg-white p-3 shadow-xl">
                            {EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setBody((current) => current + emoji)}
                                className="cursor-pointer rounded-lg p-1.5 text-xl hover:bg-[#F5F7FB]"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
