import { useEffect, useRef, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import AccountMenu from "../../Components/DashBoardAuth/HeaderDashBoard/AccountMenu";
import { api, ApiError } from "../../api/client";

const fieldClass = "rounded-2xl border border-[#F0F2F5] bg-[#F5F7FB] px-4 py-3 text-sm text-[#4B5563] outline-none";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
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

function splitQuoted(body) {
  const lines = String(body || "").split("\n");
  const quoted = [];
  let index = 0;

  while (index < lines.length && lines[index].startsWith("> ")) {
    quoted.push(lines[index].slice(2));
    index += 1;
  }

  if (quoted.length === 0) {
    return { quote: "", rest: String(body || "") };
  }

  if (lines[index] === "") {
    index += 1;
  }

  return { quote: quoted.join("\n"), rest: lines.slice(index).join("\n") };
}

function MessageText({ body, light = false }) {
  const parts = splitQuoted(body);

  return (
    <>
      {parts.quote && (
        <blockquote className={`mb-2 border-r-2 pr-3 text-xs leading-6 ${light ? "border-white/50 text-white/80" : "border-[#D1D5DB] text-[#6B7280]"}`}>
          {parts.quote}
        </blockquote>
      )}
      {richText(parts.rest)}
    </>
  );
}

function statusLabel(status) {
  if (status === "active") return "فعال";
  if (status === "ended") return "پایان‌یافته";
  if (status === "draft") return "پیش‌نویس";
  if (status === "materialized") return "ساخته‌شده";
  if (status === "rejected") return "ردشده";
  return status || "—";
}

function draftPreview(generation) {
  const proposal = generation?.proposal;
  if (!proposal || typeof proposal !== "object") return "چیزی برای نمایش نیست.";
  if (typeof proposal.summary === "string" && proposal.summary.trim() !== "") return proposal.summary;
  if (typeof proposal.reply === "string" && proposal.reply.trim() !== "") {
    return `این خروجی برنامه نیست:\n${proposal.reply}`;
  }
  return "عنوان و روز در این پیش‌نویس نیست. یک پیش‌نویس تازه بساز.";
}

function DraftOutline({ generation }) {
  const outline = Array.isArray(generation?.outline) ? generation.outline : [];
  const title = typeof generation?.proposal?.title === "string" ? generation.proposal.title : "";

  if (outline.length === 0) {
    return <p className="mt-2 whitespace-pre-wrap text-sm text-[#1F2937]">{draftPreview(generation)}</p>;
  }

  return (
    <div className="mt-3 grid gap-2">
      {title !== "" && <p className="text-sm text-[#1F2937]">{title}</p>}
      {outline.map((day, index) => (
        <div key={`${day.weekday ?? "day"}-${index}`} className="rounded-2xl bg-white p-3">
          <p className="text-sm text-[#1F2937]">{day.label}</p>
          {Array.isArray(day.lines) && day.lines.length > 0 ? (
            day.lines.map((line, lineIndex) => (
              <p key={`${index}-${lineIndex}`} className="mt-1 text-xs text-[#4B5563]">{line}</p>
            ))
          ) : (
            <p className="mt-1 text-xs text-[#A0A4AA]">استراحت</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CoachAssistant() {
  const scrollerRef = useRef(null);
  const [relationships, setRelationships] = useState([]);
  const [selectedId, setSelectedId] = useState("general");
  const [conversations, setConversations] = useState([]);
  const [methodology, setMethodology] = useState("");
  const [preferences, setPreferences] = useState("");
  const [constraints, setConstraints] = useState("");
  const [settingsReady, setSettingsReady] = useState(false);
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeBody, setKnowledgeBody] = useState("");
  const [documents, setDocuments] = useState([]);
  const [chatBody, setChatBody] = useState("");
  const [draftKind, setDraftKind] = useState("workout_program");
  const [draftBody, setDraftBody] = useState("");
  const [generation, setGeneration] = useState(null);
  const [panel, setPanel] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [quote, setQuote] = useState("");
  const [selectionAsk, setSelectionAsk] = useState(null);
  const fileRef = useRef(null);
  const composerRef = useRef(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/coach/relationships"),
      api("/api/v1/coach/ai/workspace"),
    ]).then(([relBody, workspace]) => {
      if (!active) {
        return;
      }

      const rows = Array.isArray(relBody?.relationships) ? relBody.relationships : [];
      const settings = workspace?.settings;
      setRelationships(rows);
      setConversations(Array.isArray(workspace?.conversations) ? workspace.conversations : []);
      setDocuments(Array.isArray(workspace?.documents) ? workspace.documents : []);
      setSelectedId(String(rows.find((row) => row.status === "active")?.id ?? "general"));

      if (settings) {
        setMethodology(settings.methodology || "");
        setPreferences(settings.preferences || "");
        setConstraints(settings.constraints || "");
        setSettingsReady(true);
      }
    }, (caught) => {
      if (active) {
        setError(errorText(caught));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const selected = relationships.find((row) => String(row.id) === selectedId);
  const threads = conversations.filter((row) => (
    selectedId === "general"
      ? row.coaching_relationship_id == null
      : String(row.coaching_relationship_id) === selectedId
  ));
  const messages = threads.flatMap((thread) => (thread.messages || [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({ ...message, key: `${thread.id}-${message.id}` })));
  const latestThread = threads.at(-1);
  const canChat = settingsReady && (selectedId === "general" || selected?.status === "active");

  useEffect(() => {
    const node = scrollerRef.current;

    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages.length, selectedId, live?.assistant, live?.statuses.length]);

  useEffect(() => {
    const node = composerRef.current;

    if (!node) {
      return;
    }

    node.style.height = "auto";
    node.style.height = `${Math.min(Math.max(node.scrollHeight, 112), 220)}px`;
  }, [chatBody]);

  async function run(action) {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      await action();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  function saveSettings(event) {
    event.preventDefault();
    run(async () => {
      const saved = await api("/api/v1/coach/ai/settings", {
        method: "POST",
        body: { methodology, preferences, constraints },
      });
      setSettingsReady(true);
      setNotice(`روش کار نسخه ${saved.version_number} ذخیره شد.`);
    });
  }

  function saveKnowledge(event) {
    event.preventDefault();
    run(async () => {
      const saved = await api("/api/v1/coach/ai/knowledge", {
        method: "POST",
        body: { title: knowledgeTitle, body: knowledgeBody },
      });
      setDocuments((rows) => [saved, ...rows.filter((row) => row.id !== saved.id)]);
      setKnowledgeTitle("");
      setKnowledgeBody("");
      setNotice("سند دانش ذخیره شد.");
    });
  }

  function rememberThread(thread) {
    setConversations((rows) => {
      const index = rows.findIndex((row) => row.id === thread.id);

      if (index === -1) {
        return [...rows, thread];
      }

      const next = rows.slice();
      next[index] = thread;
      return next;
    });
  }

  useEffect(() => {
    setQuote("");
    setSelectionAsk(null);
  }, [selectedId]);

  function takeQuote(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim().slice(0, 500);

    if (clean === "") {
      return;
    }

    setQuote(clean);
    setSelectionAsk(null);
    window.getSelection()?.removeAllRanges();
    composerRef.current?.focus();
  }

  function captureSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().replace(/\s+/g, " ").trim() ?? "";
    const holder = selection?.anchorNode?.parentElement?.closest("[data-quoteable]");

    if (!selection || selection.isCollapsed || text === "" || !holder || !scrollerRef.current) {
      setSelectionAsk(null);
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const host = scrollerRef.current.getBoundingClientRect();
    setSelectionAsk({
      text: text.slice(0, 500),
      top: rect.top - host.top + scrollerRef.current.scrollTop - 40,
      left: Math.max(8, rect.left - host.left),
    });
  }

  function choosePhoto(event) {
    const picked = [...(event.target.files || [])];
    event.target.value = "";

    if (picked.length === 0) {
      return;
    }

    const room = 5 - photos.length;

    if (room <= 0 || picked.length > room) {
      setError("در هر پیام حداکثر ۵ عکس می‌توانی بفرستی.");
    }

    const accepted = picked.slice(0, Math.max(room, 0)).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...accepted]);
  }

  function removePhoto(index) {
    setPhotos((current) => {
      const target = current[index];

      if (target?.url) {
        URL.revokeObjectURL(target.url);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function sendChat(event) {
    event?.preventDefault();
    const note = chatBody.trim();
    const quoted = quote.trim();

    if ((note === "" && photos.length === 0 && quoted === "") || !canChat || sending) {
      return;
    }

    setSending(true);

    const imageUrls = photos.map((item) => item.url);
    const files = photos.map((item) => item.file);
    const followUp = note || (files.length > 1 ? "این عکس‌ها را با هم تحلیل کن." : files.length === 1 ? "این عکس را تحلیل کن." : "درباره این بخش توضیح بده.");
    const body = quoted === "" ? followUp : `${quoted.split("\n").map((line) => `> ${line}`).join("\n")}\n\n${followUp}`;
    setChatBody("");
    setPhotos([]);
    setQuote("");
    setSelectionAsk(null);
    setError(null);
    setLive({
      userBody: body,
      imageUrls,
      statuses: [],
      assistant: "",
    });

    const form = new FormData();
    form.append("body", body);
    files.forEach((file) => form.append("images[]", file));

    if (!latestThread && selectedId !== "general") {
      form.append("coaching_relationship_id", String(selectedId));
    }

    const path = latestThread
      ? `/api/v1/coach/ai/conversations/${latestThread.id}/messages`
      : "/api/v1/coach/ai/conversations";

    try {
      const response = await fetch(path, {
        method: "POST",
        body: form,
        credentials: "include",
        headers: { Accept: "text/event-stream" },
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "درخواست ناموفق بود.");
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

          const payload = JSON.parse(line.slice(5).trim());

          if (payload.type === "status") {
            setLive((current) => (current ? { ...current, statuses: [...current.statuses, payload.text] } : current));
          } else if (payload.type === "replace") {
            assistant = payload.text || "";
            const snapshot = assistant;
            setLive((current) => (current ? { ...current, assistant: snapshot } : current));
          } else if (payload.type === "delta") {
            assistant += payload.text || "";
            const snapshot = assistant;
            setLive((current) => (current ? { ...current, assistant: snapshot } : current));
          } else if (payload.type === "done" && payload.conversation) {
            finished = true;
            rememberThread(payload.conversation);
            if (payload.generation) {
              setGeneration(payload.generation);
              setDraftKind(payload.generation.kind || "workout_program");
              setPanel("draft");
              setNotice("پیش‌نویس از گفتگو ساخته شد. روزها پایین صفحه است. تا تأیید نکنی منتشر نمی‌شود.");
            }
            setLive(null);

            imageUrls.forEach((url) => URL.revokeObjectURL(url));
          } else if (payload.type === "error") {
            finished = true;
            setError(payload.message || "درخواست ناموفق بود.");
          }
        }
      }

      if (!finished) {
        setError("اتصال پاسخ قطع شد.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "درخواست ناموفق بود.");
    } finally {
      setSending(false);
    }
  }

  function createDraft(event) {
    event.preventDefault();
    run(async () => {
      const created = await api("/api/v1/coach/ai/generations", {
        method: "POST",
        body: {
          kind: draftKind,
          coaching_relationship_id: Number(selectedId),
          body: draftBody,
        },
      });
      setGeneration(created);
      setPanel("draft");
      setNotice("پیش‌نویس هفته ساخته شد. تا تأیید نکنی منتشر نمی‌شود و به شاگرد داده نشده.");
    });
  }

  function review(path, done) {
    run(async () => {
      const updated = await api(path, { method: "POST", body: {} });
      setGeneration(updated);
      setNotice(done);
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="flex h-[calc(100vh-48px)] min-h-0 min-w-0 flex-col overflow-hidden py-3">
            <section dir="rtl" className="grid h-full min-h-0 overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="max-h-44 min-h-0 overflow-y-auto border-b border-[#EEF2F6] bg-[#FBFCFD] p-3 lg:max-h-none lg:border-b-0 lg:border-l">
                <p className="px-2 pb-2 text-xs text-[#A0A4AA]">گفتگوها</p>
                <button type="button" onClick={() => setSelectedId("general")} className={`mb-1 w-full rounded-2xl px-3 py-3 text-right text-sm ${selectedId === "general" ? "bg-white text-[#007BFF] shadow-sm" : "text-[#4B5563] hover:bg-white"}`}>
                  گفتگوی کلی
                </button>
                {relationships.map((row) => {
                  const count = conversations.filter((item) => String(item.coaching_relationship_id) === String(row.id))
                    .reduce((sum, item) => sum + (item.messages || []).filter((message) => message.role === "user").length, 0);

                  return (
                    <button key={row.id} type="button" onClick={() => setSelectedId(String(row.id))} className={`mb-1 flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-3 text-right text-sm ${selectedId === String(row.id) ? "bg-white text-[#007BFF] shadow-sm" : "text-[#4B5563] hover:bg-white"}`}>
                      <span className="min-w-0 truncate">{row.athlete?.display_name || "شاگرد"}</span>
                      <span className="shrink-0 text-[11px] text-[#A0A4AA]">{count > 0 ? count : statusLabel(row.status)}</span>
                    </button>
                  );
                })}
              </aside>

              <div className="flex min-h-0 min-w-0 flex-col bg-[#F7F8FA]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2F6] bg-white px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="text-lg text-[#1F2937]">{selected?.athlete?.display_name || "گفتگوی کلی"}</h2>
                    <p className="mt-1 text-sm text-[#9CA3AF]">
                      {live ? "در حال پاسخ" : selected ? `گفتگو درباره ${selected.athlete?.display_name || "این شاگرد"}` : "گفتگو بدون شاگرد مشخص"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AccountMenu />
                    <button type="button" onClick={() => setPanel((current) => current === "settings" ? null : "settings")} className={`rounded-full px-4 py-2 text-sm ${panel === "settings" ? "bg-[#007BFF] text-white" : "bg-[#F5F7FB] text-[#4B5563]"} ${!settingsReady && panel !== "settings" ? "ring-2 ring-[#F59E0B]" : ""}`}>
                      روش کار
                    </button>
                    <button type="button" onClick={() => setPanel((current) => current === "draft" ? null : "draft")} className={`rounded-full px-4 py-2 text-sm ${panel === "draft" ? "bg-[#007BFF] text-white" : "bg-[#F5F7FB] text-[#4B5563]"}`}>
                      پیش‌نویس{generation?.status === "draft" ? " · آماده" : ""}
                    </button>
                  </div>
                </div>
                {error && <p className="bg-red-50 px-5 py-3 text-right text-sm text-red-700">{error}</p>}
                {notice && <p className="bg-green-50 px-5 py-3 text-right text-sm text-green-700">{notice}</p>}
                <div className="flex min-h-0 flex-1">
                <div ref={scrollerRef} onMouseUp={captureSelection} onScroll={() => setSelectionAsk(null)} className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-6 sm:px-8">
                  {selectionAsk && (
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => takeQuote(selectionAsk.text)}
                      style={{ top: selectionAsk.top, left: selectionAsk.left }}
                      className="absolute z-10 rounded-full bg-[#111827] px-3 py-1.5 text-xs text-white shadow-lg"
                    >
                      پاسخ به این بخش
                    </button>
                  )}
                  {messages.length === 0 && !live && (
                    <div className="m-auto max-w-md text-center">
                      <p className="text-base text-[#374151]">از دستیار بپرس</p>
                      <p className="mt-2 text-sm leading-7 text-[#9CA3AF]">پیام یا عکس بفرست. پاسخ همان لحظه نوشته می‌شود و سابقهٔ هر شاگرد جدا می‌ماند.</p>
                    </div>
                  )}
                  {messages.map((message) => (
                    message.role === "assistant" ? (
                      <div key={message.key} className="flex max-w-[min(46rem,88%)] flex-col items-end self-end">
                        <article data-quoteable="assistant" className="rounded-3xl rounded-bl-md bg-white px-5 py-4 text-base leading-8 text-[#1F2937] shadow-sm">
                          {richText(message.body)}
                        </article>
                        {message.key === messages.filter((item) => item.role === "assistant").at(-1)?.key && (
                          <button type="button" onClick={() => takeQuote(message.body)} className="mt-1 px-2 text-[11px] text-[#9CA3AF]">پاسخ</button>
                        )}
                      </div>
                    ) : (
                      <article key={message.key} className="max-w-[min(46rem,88%)] self-start rounded-3xl rounded-br-md bg-[#007BFF] px-5 py-4 text-base leading-8 text-white">
                        {(message.image_count > 0 || message.has_image) && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {Array.from({ length: message.image_count || 1 }, (_, index) => (
                              <img key={index} src={`/api/v1/coach/ai/messages/${message.id}/file/${index}`} alt="" className="max-h-40 rounded-2xl" />
                            ))}
                          </div>
                        )}
                        <MessageText body={message.body} light />
                      </article>
                    )
                  ))}
                  {live && (
                    <>
                      <article className="max-w-[min(46rem,88%)] self-start rounded-3xl rounded-br-md bg-[#007BFF] px-5 py-4 text-base leading-8 text-white">
                        {live.imageUrls?.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {live.imageUrls.map((url) => (
                              <img key={url} src={url} alt="" className="max-h-40 rounded-2xl" />
                            ))}
                          </div>
                        )}
                        <MessageText body={live.userBody} light />
                      </article>
                      <div data-quoteable="assistant" className="max-w-[min(46rem,88%)] self-end rounded-3xl rounded-bl-md bg-white px-5 py-4 text-base leading-8 text-[#1F2937] shadow-sm">
                        {live.statuses.length > 0 && (
                          <div className="mb-2 space-y-1 border-b border-[#F3F4F6] pb-2 text-xs">
                            {live.statuses.map((line, index) => (
                              <p key={`${line}-${index}`} className={index === live.statuses.length - 1 && live.assistant === "" ? "text-[#007BFF]" : "text-[#9CA3AF]"}>
                                {index === live.statuses.length - 1 && live.assistant === "" ? "●" : "✓"} {line}
                              </p>
                            ))}
                          </div>
                        )}
                        {live.assistant === "" ? (
                          <span className="inline-flex gap-1 py-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:0ms]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:150ms]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:300ms]" />
                          </span>
                        ) : (
                          <div>{richText(live.assistant)}<span className="mr-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#007BFF] align-middle" /></div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {panel && (
                  <aside className="min-h-0 w-[min(420px,46%)] overflow-y-auto border-s border-[#EEF2F6] bg-white p-5 text-right">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-base text-[#1F2937]">{panel === "settings" ? "روش کار و دانش" : "پیش‌نویس برنامه"}</h3>
                      <button type="button" onClick={() => setPanel(null)} className="text-sm text-[#6B6F77]">بستن</button>
                    </div>
                    {panel === "settings" ? (
                      <div className="grid gap-4">
                        <form onSubmit={saveSettings} className="grid gap-3">
                          <label className="grid gap-2 text-xs text-[#6B6F77]">
                            روش
                            <textarea value={methodology} onChange={(event) => setMethodology(event.target.value)} rows={4} className={fieldClass} />
                          </label>
                          <label className="grid gap-2 text-xs text-[#6B6F77]">
                            ترجیح‌ها
                            <textarea value={preferences} onChange={(event) => setPreferences(event.target.value)} rows={3} className={fieldClass} />
                          </label>
                          <label className="grid gap-2 text-xs text-[#6B6F77]">
                            محدودیت‌ها
                            <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} rows={3} className={fieldClass} />
                          </label>
                          <button type="submit" disabled={pending || methodology.trim() === "" || preferences.trim() === "" || constraints.trim() === ""} className="w-fit rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60">
                            ذخیره روش
                          </button>
                        </form>
                        <form onSubmit={saveKnowledge} className="grid gap-3">
                          <input value={knowledgeTitle} onChange={(event) => setKnowledgeTitle(event.target.value)} placeholder="عنوان دانش" className={fieldClass} />
                          <textarea value={knowledgeBody} onChange={(event) => setKnowledgeBody(event.target.value)} rows={4} placeholder="متن دانش مربی" className={fieldClass} />
                          <button type="submit" disabled={pending || knowledgeTitle.trim() === "" || knowledgeBody.trim() === ""} className="w-fit rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60">
                            ذخیره دانش
                          </button>
                          <div className="flex flex-wrap gap-2">
                            {documents.map((document) => (
                              <span key={document.id} className="rounded-full bg-[#F5F7FB] px-3 py-1 text-xs text-[#4B5563]">{document.title}</span>
                            ))}
                          </div>
                        </form>
                      </div>
                    ) : (
                      <form onSubmit={createDraft} className="grid gap-3">
                        <p className="text-sm leading-7 text-[#6B6F77]">برای {selected?.athlete?.display_name || "شاگرد انتخاب‌شده"}، با جمله تو و گفتگوی همین صفحه. خروجی شنبه تا جمعه است. تأیید یعنی انتشار، نه دادن به شاگرد.</p>
                        <select value={draftKind} onChange={(event) => setDraftKind(event.target.value)} className={fieldClass}>
                          <option value="workout_program">تمرین</option>
                          <option value="meal_plan">غذا</option>
                          <option value="progress_review">مرور پیشرفت</option>
                        </select>
                        <textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} rows={4} placeholder="مثلاً هفته قدرت برای این شاگرد" className={fieldClass} />
                        <button type="submit" disabled={pending || selected?.status !== "active" || draftBody.trim() === ""} className="w-fit rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60">
                          ساخت پیش‌نویس
                        </button>
                        {generation && (
                          <div className="rounded-2xl bg-[#F5F7FB] p-4">
                            <p className="text-sm text-[#4B5563]">وضعیت: {statusLabel(generation.status)}</p>
                            <DraftOutline generation={generation} />
                            {generation.status === "draft" && (
                              <div className="mt-3 flex flex-wrap gap-3">
                                <button type="button" disabled={pending} onClick={() => review(`/api/v1/coach/ai/generations/${generation.id}/approve`, "پیش‌نویس تأیید و منتشر شد و در فهرست برنامه‌هاست. هنوز به شاگرد داده نشده.")} className="rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60">تأیید و انتشار</button>
                                <button type="button" disabled={pending} onClick={() => review(`/api/v1/coach/ai/generations/${generation.id}/reject`, "پیش‌نویس رد شد.")} className="rounded-2xl border border-[#F0F2F5] bg-white px-5 py-2 text-sm text-[#6B6F77] disabled:opacity-60">رد</button>
                              </div>
                            )}
                          </div>
                        )}
                      </form>
                    )}
                  </aside>
                )}
                </div>
                <form onSubmit={sendChat} className="border-t border-[#EEF2F6] bg-white px-5 py-4 sm:px-8">
                  {quote && (
                    <div className="mb-3 flex items-start gap-2 rounded-2xl border-r-2 border-[#007BFF] bg-[#F5F7FB] px-4 py-3">
                      <p className="min-w-0 flex-1 text-sm leading-7 text-[#4B5563]">{quote}</p>
                      <button type="button" onClick={() => setQuote("")} className="text-sm text-[#9CA3AF]">×</button>
                    </div>
                  )}
                  {photos.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {photos.map((item, index) => (
                        <div key={item.url} className="relative">
                          <img src={item.url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                          <button type="button" onClick={() => removePhoto(index)} className="absolute -left-1 -top-1 rounded-full bg-white px-1.5 text-xs text-[#6B7280] shadow">×</button>
                        </div>
                      ))}
                      <span className="self-center text-sm text-[#9CA3AF]">{photos.length} از ۵</span>
                    </div>
                  )}
                  <div className="rounded-[28px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={choosePhoto} />
                    <textarea
                      ref={composerRef}
                      value={chatBody}
                      onChange={(event) => setChatBody(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendChat();
                        }
                      }}
                      rows={3}
                      placeholder={!settingsReady ? "اول از دکمه روش کار، روش مربی را ذخیره کن" : selected && selected.status !== "active" ? "این رابطه فعال نیست." : "پیام را اینجا بنویس"}
                      disabled={!canChat || sending}
                      className="min-h-28 w-full resize-none bg-transparent py-1 text-base leading-8 text-[#1F2937] outline-none disabled:opacity-60"
                    />
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={!canChat || sending || photos.length >= 5} className="rounded-full px-3 py-2 text-sm text-[#4B5563] disabled:opacity-40">
                        عکس
                      </button>
                      <p className="min-w-0 text-xs text-[#9CA3AF]">Enter ارسال می‌کند و Shift+Enter خط بعد می‌سازد</p>
                      <button type="submit" disabled={sending || !canChat || (chatBody.trim() === "" && photos.length === 0 && quote.trim() === "")} className="rounded-full bg-[#007BFF] px-6 py-2.5 text-sm text-white disabled:opacity-40">
                        {sending ? "..." : "ارسال"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>
        </div>
      </div>
    </div>
  );
}
