import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../../../api/client";
import { useSession } from "../../../../api/session";
import AIImage from "../../../../assets/imges/image 12.png";
import Send from "../../../../assets/imges/Plain 3.png";
import SegmentedControl from "../../../shared/SegmentedControl/SegmentedControl";

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

function visibleMessages(rows) {
  return (Array.isArray(rows) ? rows : []).filter((message) => message.role === "user" || message.role === "assistant");
}

export default function AIChat() {
  const scrollerRef = useRef(null);
  const composerRef = useRef(null);
  const [relationshipId, setRelationshipId] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [chatBody, setChatBody] = useState("");
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(null);

  useEffect(() => {
    let active = true;

    api("/api/v1/athlete/relationships").then(
      (body) => {
        if (!active) {
          return;
        }

        const rows = Array.isArray(body?.relationships) ? body.relationships : [];
        const match = rows.find(
          (row) => row.status === "active" && Array.isArray(row.features) && row.features.includes("ai_athlete_access"),
        );

        setRelationshipId(match ? match.id : null);
        setAllowed(Boolean(match));
        setReady(true);

        if (!match) {
          setError("این دوره قابلیت دستیار ندارد.");
          return;
        }

        api("/api/v1/athlete/ai/conversations").then((history) => {
          if (!active) return;
          const threads = (history?.conversations ?? []).filter((row) => String(row.coaching_relationship_id) === String(match.id));
          const latest = threads.at(-1);
          setThreadId(latest?.id ?? null);
          setMessages(visibleMessages(latest?.messages));
        }, () => {});
      },
      (caught) => {
        if (!active) {
          return;
        }

        setReady(true);
        setAllowed(false);
        setError(errorText(caught));
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
  }, [messages.length, live?.assistant, live?.statuses.length]);

  function applyThread(thread) {
    setThreadId(thread?.id ?? threadId);
    setMessages(visibleMessages(thread?.messages));
    setLive(null);
  }

  async function send(event) {
    event?.preventDefault();
    const note = chatBody.trim();

    if (!allowed || relationshipId == null || sending || note === "") {
      return;
    }

    const localId = `local-${Date.now()}`;
    setMessages((current) => [...current, { id: localId, role: "user", body: note }]);
    setLive({ statuses: ["در حال تحلیل"], assistant: "" });
    setChatBody("");
    setError(null);
    setSending(true);

    const path = threadId
      ? `/api/v1/athlete/ai/conversations/${threadId}/messages`
      : "/api/v1/athlete/ai/conversations";
    const payload = threadId
      ? { body: note }
      : { coaching_relationship_id: relationshipId, body: note };

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
        applyThread(await response.json());
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
            applyThread(eventPayload.conversation);
          } else if (eventPayload.type === "error") {
            finished = true;
            setLive(null);
            setError(eventPayload.message || "درخواست ناموفق بود.");
          }
        }
      }

      if (!finished) {
        setLive(null);
        setError("اتصال پاسخ قطع شد.");
      }
    } catch (caught) {
      setLive(null);
      setError(errorText(caught));
    } finally {
      setSending(false);
      composerRef.current?.focus();
    }
  }

  const statusLine = live == null
    ? ""
    : live.assistant === ""
      ? (live.statuses.at(-1) || "در حال تحلیل")
      : "در حال نوشتن";
  const { account } = useSession();
  const name = account?.profiles?.athlete?.display_name || "ورزشکار";
  const showWelcome = ready && messages.length === 0 && !live;

  return (
    <div dir="rtl" className="mt-5 flex h-[min(70vh,570px)] flex-col overflow-hidden rounded-3xl bg-white lg:h-[570px]">
      <div className="flex items-center justify-center border-b border-[#E3E8F0] p-5">
        <SegmentedControl item1="چت با مربی" item2="هوش مصنوعی" />
      </div>

      {error ? <p className="bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p> : null}

      <div ref={scrollerRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
        {showWelcome ? (
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
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
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
        )}
      </div>

      <form className="p-5" onSubmit={send}>
        <div className="flex items-center rounded-full border border-[#E3E8F0] px-5 py-3">
          <input
            ref={composerRef}
            value={chatBody}
            onChange={(event) => setChatBody(event.target.value)}
            placeholder={allowed ? "از من هر چیزی بپرس..." : "دستیار این دوره بسته است"}
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
