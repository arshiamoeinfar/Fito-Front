import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../../../api/client";
import { useSession } from "../../../../api/session";
import AIImage from "../../../../assets/imges/image 12.png";
import Send from "../../../../assets/imges/Plain 3.png";
import SegmentedControl from "../../../shared/SegmentedControl/SegmentedControl";

const COACH_TAB = "چت با مربی";
const AI_TAB = "هوش مصنوعی";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return caught instanceof Error && caught.message ? caught.message : "درخواست ناموفق بود.";
  }

  return caught.message;
}

function richText(text) {
  return String(text || "").split("\n").map((line, index) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      return <div key={index} className="h-2" />;
    }

    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    const item = trimmed.match(/^[-*]\s+(.*)$/);
    const content = heading?.[1] || item?.[1] || trimmed;
    const pieces = content.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => (
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
        : <span key={partIndex}>{part}</span>
    ));

    if (heading) {
      return <p key={index} className="font-semibold">{pieces}</p>;
    }

    if (item) {
      return <p key={index} className="pr-3">{pieces}</p>;
    }

    return <p key={index}>{pieces}</p>;
  });
}

function visibleAiMessages(rows) {
  return (Array.isArray(rows) ? rows : []).filter((message) => message.role === "user" || message.role === "assistant");
}

function sharedCoachMessages(thread) {
  return (thread?.messages ?? []).filter((message) => message.visibility !== "coach_only");
}

export default function AIChat() {
  const scrollerRef = useRef(null);
  const composerRef = useRef(null);
  const { account } = useSession();
  const name = account?.profiles?.athlete?.display_name || "ورزشکار";
  const userId = account?.user_id;
  const [mode, setMode] = useState(COACH_TAB);
  const [chatBody, setChatBody] = useState("");

  const [coachRelationshipId, setCoachRelationshipId] = useState(null);
  const [coachAllowed, setCoachAllowed] = useState(false);
  const [coachReady, setCoachReady] = useState(false);
  const [coachThreadId, setCoachThreadId] = useState(null);
  const [coachMessages, setCoachMessages] = useState([]);
  const [coachError, setCoachError] = useState(null);
  const [coachSending, setCoachSending] = useState(false);

  const [aiRelationshipId, setAiRelationshipId] = useState(null);
  const [aiAllowed, setAiAllowed] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiThreadId, setAiThreadId] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiSending, setAiSending] = useState(false);
  const [selfAi, setSelfAi] = useState(false);
  const [live, setLive] = useState(null);

  useEffect(() => {
    let active = true;

    api("/api/v1/athlete/relationships").then(
      async (body) => {
        if (!active) {
          return;
        }

        const rows = Array.isArray(body?.relationships) ? body.relationships : [];
        const activeRow = rows.find((row) => row.status === "active") ?? null;
        const aiRow = rows.find(
          (row) => row.status === "active" && Array.isArray(row.features) && row.features.includes("ai_athlete_access"),
        ) ?? null;

        setCoachRelationshipId(activeRow ? activeRow.id : null);
        setCoachAllowed(Boolean(activeRow));
        setCoachReady(true);
        setAiRelationshipId(aiRow ? aiRow.id : null);
        setAiAllowed(Boolean(aiRow));
        setAiReady(true);

        if (!activeRow) {
          setCoachError("دوره یا پکیج تمام شده است.");
        }

        if (!aiRow) {
          try {
            const access = await api("/api/v1/athlete/access");
            const features = Array.isArray(access?.features) ? access.features : [];

            if (active && features.includes("ai_athlete_access")) {
              const history = await api("/api/v1/athlete/assistant/messages");

              if (!active) {
                return;
              }

              setSelfAi(true);
              setAiAllowed(true);
              setAiError(null);
              setAiMessages(history.messages ?? []);
            } else if (active) {
              setAiError(activeRow ? "این دوره قابلیت دستیار ندارد." : "برای چت با هوش مصنوعی باید پلن ورزشکار را بخری.");
            }
          } catch (caught) {
            if (active) {
              setAiError(errorText(caught));
            }
          }
        }

        if (activeRow) {
          try {
            const history = await api(`/api/v1/athlete/feedback-threads?coaching_relationship_id=${activeRow.id}`);
            const threads = Array.isArray(history?.threads) ? history.threads : [];
            const open = threads.find((thread) => thread.status === "open");

            if (open && active) {
              const detail = await api(`/api/v1/athlete/feedback-threads/${open.id}`);

              if (!active) {
                return;
              }

              setCoachThreadId(detail.id);
              setCoachMessages(sharedCoachMessages(detail));
            }
          } catch (caught) {
            if (active) {
              setCoachError(errorText(caught));
            }
          }
        }

        if (aiRow) {
          api("/api/v1/athlete/ai/conversations").then((history) => {
            if (!active) {
              return;
            }

            const threads = (history?.conversations ?? []).filter(
              (row) => String(row.coaching_relationship_id) === String(aiRow.id),
            );
            const latest = threads.at(-1);
            setAiThreadId(latest?.id ?? null);
            setAiMessages(visibleAiMessages(latest?.messages));
          }, () => {});
        }
      },
      (caught) => {
        if (!active) {
          return;
        }

        setCoachReady(true);
        setAiReady(true);
        setCoachAllowed(false);
        setAiAllowed(false);
        const message = errorText(caught);
        setCoachError(message);
        setAiError(message);
      },
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;

    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [mode, coachMessages.length, aiMessages.length, live?.assistant, live?.statuses.length]);

  function applyAiThread(thread) {
    setAiThreadId(thread?.id ?? aiThreadId);
    setAiMessages(visibleAiMessages(thread?.messages));
    setLive(null);
  }

  async function sendCoach(note) {
    if (!coachAllowed || coachRelationshipId == null || coachSending) {
      return;
    }

    const localId = `local-${Date.now()}`;
    setCoachMessages((current) => [
      ...current,
      { id: localId, author_user_id: userId, visibility: "shared", body: note },
    ]);
    setChatBody("");
    setCoachError(null);
    setCoachSending(true);

    try {
      if (coachThreadId == null) {
        const created = await api("/api/v1/athlete/feedback-threads", {
          method: "POST",
          body: { coaching_relationship_id: coachRelationshipId, body: note },
        });
        setCoachThreadId(created.id);
        setCoachMessages(sharedCoachMessages(created));
        return;
      }

      await api(`/api/v1/athlete/feedback-threads/${coachThreadId}/messages`, {
        method: "POST",
        body: { body: note },
      });
      const detail = await api(`/api/v1/athlete/feedback-threads/${coachThreadId}`);
      setCoachMessages(sharedCoachMessages(detail));
    } catch (caught) {
      setCoachMessages((current) => current.filter((message) => message.id !== localId));
      setChatBody(note);
      setCoachError(errorText(caught));
    } finally {
      setCoachSending(false);
      composerRef.current?.focus();
    }
  }

  async function sendAi(note) {
    if (!aiAllowed || aiSending || (!selfAi && aiRelationshipId == null)) {
      return;
    }

    if (selfAi) {
      const localId = `local-${Date.now()}`;
      setAiMessages((current) => [...current, { id: localId, role: "user", body: note }]);
      setLive({ statuses: ["در حال تحلیل"], assistant: "" });
      setChatBody("");
      setAiError(null);
      setAiSending(true);

      try {
        const response = await fetch("/api/v1/athlete/assistant/messages", {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "text/event-stream",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: note }),
        });

        if (!response.ok) {
          const failed = await response.json().catch(() => null);
          throw new Error(failed?.message || "درخواست ناموفق بود.");
        }

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error("درخواست ناموفق بود.");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let assistant = "";
        let finished = false;

        while (true) {
          const chunk = await reader.read();

          if (chunk.done) {
            break;
          }

          buffer += decoder.decode(chunk.value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const line = part.split("\n").find((item) => item.startsWith("data:"));

            if (!line) {
              continue;
            }

            const eventPayload = JSON.parse(line.slice(5).trim());

            if (eventPayload.type === "status" && eventPayload.text) {
              setLive((current) => (current ? { ...current, statuses: [...current.statuses, eventPayload.text] } : current));
            } else if (eventPayload.type === "replace") {
              assistant = eventPayload.text || "";
              const snapshot = assistant;
              setLive((current) => (current ? { ...current, assistant: snapshot } : current));
            } else if (eventPayload.type === "delta") {
              assistant += eventPayload.text || "";
              const snapshot = assistant;
              setLive((current) => (current ? { ...current, assistant: snapshot } : current));
            } else if (eventPayload.type === "done") {
              finished = true;
              setLive(null);
              setAiMessages(eventPayload.messages ?? []);
            } else if (eventPayload.type === "error") {
              finished = true;
              setLive(null);
              setAiMessages((current) => current.filter((message) => message.id !== localId));
              setChatBody(note);
              setAiError(eventPayload.message || "درخواست ناموفق بود.");
            }
          }
        }

        if (!finished) {
          setLive(null);
          setAiError("اتصال پاسخ قطع شد.");
        }
      } catch (caught) {
        setLive(null);
        setAiMessages((current) => current.filter((message) => message.id !== localId));
        setChatBody(note);
        setAiError(errorText(caught));
      } finally {
        setAiSending(false);
        composerRef.current?.focus();
      }

      return;
    }

    const localId = `local-${Date.now()}`;
    setAiMessages((current) => [...current, { id: localId, role: "user", body: note }]);
    setLive({ statuses: ["در حال تحلیل"], assistant: "" });
    setChatBody("");
    setAiError(null);
    setAiSending(true);

    const path = aiThreadId
      ? `/api/v1/athlete/ai/conversations/${aiThreadId}/messages`
      : "/api/v1/athlete/ai/conversations";
    const payload = aiThreadId
      ? { body: note }
      : { coaching_relationship_id: aiRelationshipId, body: note };

    try {
      const response = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const type = response.headers.get("content-type") || "";

      if (!response.ok) {
        const failed = await response.json().catch(() => null);
        throw new Error(failed?.message || "درخواست ناموفق بود.");
      }

      if (!type.includes("text/event-stream") || !response.body) {
        applyAiThread(await response.json());
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let finished = false;

      while (true) {
        const chunk = await reader.read();

        if (chunk.done) {
          break;
        }

        buffer += decoder.decode(chunk.value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.split("\n").find((item) => item.startsWith("data:"));

          if (!line) {
            continue;
          }

          const eventPayload = JSON.parse(line.slice(5).trim());

          if (eventPayload.type === "status" && eventPayload.text) {
            setLive((current) => (current ? { ...current, statuses: [...current.statuses, eventPayload.text] } : current));
          } else if (eventPayload.type === "replace") {
            assistant = eventPayload.text || "";
            const snapshot = assistant;
            setLive((current) => (current ? { ...current, assistant: snapshot } : current));
          } else if (eventPayload.type === "delta") {
            assistant += eventPayload.text || "";
            const snapshot = assistant;
            setLive((current) => (current ? { ...current, assistant: snapshot } : current));
          } else if (eventPayload.type === "done" && eventPayload.conversation) {
            finished = true;
            applyAiThread(eventPayload.conversation);
          } else if (eventPayload.type === "error") {
            finished = true;
            setLive(null);
            setAiError(eventPayload.message || "درخواست ناموفق بود.");
          }
        }
      }

      if (!finished) {
        setLive(null);
        setAiError("اتصال پاسخ قطع شد.");
      }
    } catch (caught) {
      setLive(null);
      setAiError(errorText(caught));
    } finally {
      setAiSending(false);
      composerRef.current?.focus();
    }
  }

  function send(event) {
    event?.preventDefault();
    const note = chatBody.trim();

    if (note === "") {
      return;
    }

    if (coachRelationshipId != null && mode === COACH_TAB) {
      sendCoach(note);
      return;
    }

    sendAi(note);
  }

  const independent = coachReady && coachRelationshipId == null;
  const coachMode = !independent && mode === COACH_TAB;
  const allowed = coachMode ? coachAllowed : aiAllowed;
  const sending = coachMode ? coachSending : aiSending;
  const error = coachMode ? coachError : aiError;
  const ready = coachMode ? coachReady : aiReady;
  const statusLine = live == null
    ? ""
    : live.assistant === ""
      ? (live.statuses.at(-1) || "در حال تحلیل")
      : "در حال نوشتن";
  const showCoachWelcome = coachMode && ready && coachMessages.length === 0;
  const showAiWelcome = !coachMode && ready && aiMessages.length === 0 && !live;

  return (
    <div dir="rtl" className="mt-5 flex h-[min(70vh,570px)] flex-col overflow-hidden rounded-3xl bg-white lg:h-[570px]">
      <div className="flex items-center justify-center border-b border-[#E3E8F0] p-5">
        {independent ? (
          <h2 className="text-sm font-semibold text-[#6B6F77]">دستیار هوشمند</h2>
        ) : (
          <SegmentedControl item1={COACH_TAB} item2={AI_TAB} initial={COACH_TAB} onChange={setMode} />
        )}
      </div>

      {error ? <p className="bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p> : null}

      <div ref={scrollerRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
        {showCoachWelcome ? (
          <div className="flex flex-1 flex-col items-center justify-center px-3">
            <h2 className="text-2xl font-semibold text-[#6B6F77]">سلام {name} 👋</h2>
            <p className="font-primary-ExtraLight mt-2 text-center leading-8 text-[#6B6F77]">
              {coachAllowed
                ? "از اینجا می‌توانی برای مربی‌ات پیام بفرستی."
                : "دوره یا پکیج تمام شده و ارسال پیام بسته است."}
            </p>
          </div>
        ) : null}

        {showAiWelcome ? (
          <div className="flex flex-1 flex-col items-center justify-center px-3">
            <img src={AIImage} className="mb-8 w-40" alt="" />
            <h2 className="text-2xl font-semibold text-[#6B6F77]">سلام {name} 👋</h2>
            <p className="font-primary-ExtraLight mt-2 text-center leading-8 text-[#6B6F77]">
              من دستیار هوشمند فیتو هستم.
              <br />
              می‌توانم تمرینات، تغذیه،
              <br />
              خواب و پیشرفت بدنت را تحلیل کنم.
            </p>
          </div>
        ) : null}

        {coachMode && coachMessages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {coachMessages.map((message) => (
              String(message.author_user_id) === String(userId) ? (
                <article key={message.id} className="max-w-[92%] self-start rounded-3xl rounded-br-md bg-[#007BFF] px-4 py-3 text-sm leading-7 text-white">
                  {richText(message.body)}
                </article>
              ) : (
                <article key={message.id} className="font-primary-light max-w-[92%] self-end rounded-3xl rounded-bl-md bg-[#F5F7FB] px-4 py-3 text-sm leading-7 text-[#6B6F77]">
                  {richText(message.body)}
                </article>
              )
            ))}
          </div>
        ) : null}

        {!coachMode && !showAiWelcome ? (
          <div className="flex flex-col gap-3">
            {aiMessages.map((message) => (
              message.role === "assistant" ? (
                <article key={message.id} className="font-primary-light max-w-[92%] self-end rounded-3xl rounded-bl-md bg-[#F5F7FB] px-4 py-3 text-sm leading-7 text-[#6B6F77]">
                  {richText(message.body)}
                </article>
              ) : (
                <article key={message.id} className="max-w-[92%] self-start rounded-3xl rounded-br-md bg-[#007BFF] px-4 py-3 text-sm leading-7 text-white">
                  {richText(message.body)}
                </article>
              )
            ))}
            {live ? (
              <article className="font-primary-light max-w-[92%] self-end rounded-3xl rounded-bl-md bg-[#F5F7FB] px-4 py-3 text-sm leading-7 text-[#6B6F77]">
                {live.assistant === "" ? <p className="text-[#007BFF]">{statusLine}</p> : (
                  <div>
                    {richText(live.assistant)}
                    <span className="mr-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#007BFF] align-middle" />
                  </div>
                )}
              </article>
            ) : null}
          </div>
        ) : null}
      </div>

      <form className="p-5" onSubmit={send}>
        <div className="flex items-center rounded-full border border-[#E3E8F0] px-5 py-3">
          <input
            ref={composerRef}
            value={chatBody}
            onChange={(event) => setChatBody(event.target.value)}
            placeholder={
              coachMode
                ? (allowed ? "پیام خود را برای مربی بنویس..." : "دوره یا پکیج تمام شده است")
                : (allowed ? "از من هر چیزی بپرس..." : "دستیار این دوره بسته است")
            }
            disabled={!allowed || sending}
            className="flex-1 bg-transparent text-[#6B6F77] outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!allowed || sending || chatBody.trim() === ""}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007BFF] disabled:opacity-50"
          >
            <img className="size-4" src={Send} alt="" />
          </button>
        </div>
      </form>
    </div>
  );
}
