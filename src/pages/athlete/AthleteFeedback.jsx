import { useEffect, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function when(value) {
  if (!value) {
    return "—";
  }

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

function sharedMessages(thread) {
  return (thread?.messages ?? []).filter((message) => message.visibility !== "coach_only");
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
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/athlete/relationships"),
      api("/api/v1/athlete/feedback-threads"),
    ]).then(
      ([relationshipBody, threadBody]) => {
        if (!active) {
          return;
        }

        const rows = Array.isArray(relationshipBody?.relationships) ? relationshipBody.relationships : [];
        setRelationships(rows);
        setThreads(Array.isArray(threadBody?.threads) ? threadBody.threads : []);
        setRelationshipId((current) => current || String(rows.find((row) => row.status === "active")?.id ?? rows[0]?.id ?? ""));
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
  }, [reloadKey]);

  useEffect(() => {
    if (!threadId) {
      return undefined;
    }

    let active = true;

    api(`/api/v1/athlete/feedback-threads/${threadId}`).then(
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

  const relationship = relationships.find((row) => String(row.id) === String(relationshipId)) ?? null;
  const visibleThreads = threads.filter((thread) => String(thread.coaching_relationship_id) === String(relationshipId));
  const activeRelationship = relationship?.status === "active";
  const messages = sharedMessages(detail);

  async function openThread(event) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const created = await api("/api/v1/athlete/feedback-threads", {
        method: "POST",
        body: {
          coaching_relationship_id: Number(relationshipId),
          body,
        },
      });
      setBody("");
      setThreadId(created.id);
      setNotice("موضوع برای مربی ثبت شد.");
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
      await api(`/api/v1/athlete/feedback-threads/${threadId}/messages`, {
        method: "POST",
        body: { body },
      });
      setBody("");
      setNotice("پاسخ ثبت شد.");
      setReloadKey((value) => value + 1);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="بازخورد" description="موضوع‌های رابطه با مربی" />
            {error && (
              <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-right text-sm text-red-700" dir="rtl">
                {error}
              </p>
            )}
            {notice && (
              <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-right text-sm text-green-700" dir="rtl">
                {notice}
              </p>
            )}

            <section dir="rtl" className="col-span-4 rounded-3xl bg-white p-6 text-right">
              <label className="grid gap-2 text-xs text-[#6B6F77]">
                رابطه
                <select
                  value={relationshipId}
                  onChange={(event) => {
                    setRelationshipId(event.target.value);
                    setThreadId(null);
                    setDetail(null);
                  }}
                  className="rounded-2xl border border-[#F0F2F5] bg-[#F5F7FB] px-4 py-3 text-sm text-[#4B5563]"
                >
                  {relationships.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.coach?.display_name || "مربی"} — {statusLabel(row.status)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-6 flex items-center justify-between">
                <h2 className="text-lg font-primary text-[#6B6F77]">موضوع‌ها</h2>
                <button
                  type="button"
                  onClick={() => {
                    setThreadId(null);
                    setDetail(null);
                  }}
                  className="text-xs text-[#007BFF]"
                >
                  موضوع تازه
                </button>
              </div>
              {loaded && visibleThreads.length === 0 && (
                <p className="mt-4 text-sm text-[#A0A4AA]">موضوعی برای این رابطه نیست.</p>
              )}
              <div className="mt-4 grid gap-3">
                {visibleThreads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setThreadId(thread.id)}
                    className={`rounded-2xl px-4 py-3 text-right text-sm ${
                      threadId === thread.id ? "bg-[#EBF5FF] text-[#007BFF]" : "bg-[#F5F7FB] text-[#4B5563]"
                    }`}
                  >
                    موضوع {thread.id} — {statusLabel(thread.status)}
                    <span className="mt-1 block text-xs text-[#A0A4AA]">{when(thread.created_at)}</span>
                  </button>
                ))}
              </div>
            </section>

            <section dir="rtl" className="col-span-8 rounded-3xl bg-white p-6 text-right">
              {!detail && <p className="text-sm text-[#A0A4AA]">یک موضوع را انتخاب کنید یا موضوع تازه بسازید.</p>}
              {detail && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-primary text-[#6B6F77]">موضوع {detail.id}</h2>
                    <span className="text-xs text-[#A0A4AA]">{statusLabel(detail.status)}</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {messages.length === 0 && <p className="text-sm text-[#A0A4AA]">پیام مشترکی در این موضوع نیست.</p>}
                    {messages.map((message) => (
                      <article key={message.id} className="rounded-2xl bg-[#F5F7FB] px-4 py-3">
                        <p className="text-sm text-[#4B5563]">{message.body}</p>
                        <p className="mt-2 text-xs text-[#A0A4AA]">{when(message.created_at)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={detail ? reply : openThread} className="mt-6 grid gap-3">
                {!activeRelationship && (
                  <p className="text-sm text-[#A0A4AA]">رابطه فعال نیست؛ پیام تازه ثبت نمی‌شود.</p>
                )}
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={3}
                  placeholder="متن بازخورد"
                  className="rounded-2xl border border-[#F0F2F5] bg-[#F5F7FB] px-4 py-3 text-sm text-[#4B5563]"
                />
                <button
                  type="submit"
                  disabled={pending || !activeRelationship || body.trim() === "" || (detail && detail.status !== "open")}
                  className="w-fit rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60"
                >
                  {detail ? "ثبت پاسخ" : "شروع موضوع"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
