
import { useEffect, useRef, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import AccountMenu from "../../Components/DashBoardAuth/HeaderDashBoard/AccountMenu";
import { api, ApiError } from "../../api/client";

const fieldClass =
  "w-full min-w-0 rounded-2xl border border-[#E9EDF3] bg-[#F7F9FC] px-4 py-3 text-sm text-[#374151] outline-none transition focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-[#007BFF]/10";

function errorText(caught) {
  if (!(caught instanceof ApiError)) return "درخواست ناموفق بود.";
  return caught.message;
}

function richText(text) {
  return String(text || "").split("\n").map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) return <div key={index} className="h-2" />;

    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    const item = trimmed.match(/^[-*]\s+(.*)$/);
    const content = heading?.[1] || item?.[1] || trimmed;

    const pieces = content.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={partIndex}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={partIndex}>{part}</span>
      )
    );

    if (heading) {
      return (
        <p key={index} className="font-semibold">
          {pieces}
        </p>
      );
    }

    if (item) {
      return (
        <p key={index} className="pr-3">
          • {pieces}
        </p>
      );
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

  if (!quoted.length) return { quote: "", rest: String(body || "") };

  if (lines[index] === "") index += 1;

  return {
    quote: quoted.join("\n"),
    rest: lines.slice(index).join("\n"),
  };
}

function MessageText({ body, light = false }) {
  const parts = splitQuoted(body);

  return (
    <>
      {parts.quote && (
        <blockquote
          className={`mb-3 border-r-2 pr-3 text-xs leading-6 ${
            light
              ? "border-white/50 text-white/80"
              : "border-[#D1D5DB] text-[#6B7280]"
          }`}
        >
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

  if (!proposal || typeof proposal !== "object") {
    return "چیزی برای نمایش نیست.";
  }

  if (typeof proposal.summary === "string" && proposal.summary.trim()) {
    return proposal.summary;
  }

  if (typeof proposal.reply === "string" && proposal.reply.trim()) {
    return `این خروجی برنامه نیست:\n${proposal.reply}`;
  }

  return "عنوان و روز در این پیش‌نویس نیست. یک پیش‌نویس تازه بساز.";
}

function DraftOutline({ generation }) {
  const outline = Array.isArray(generation?.outline)
    ? generation.outline
    : [];

  const title =
    typeof generation?.proposal?.title === "string"
      ? generation.proposal.title
      : "";

  if (!outline.length) {
    return (
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#374151]">
        {draftPreview(generation)}
      </p>
    );
  }

  return (
    <div className="mt-3 grid gap-3">
      {title && (
        <p className="text-sm font-semibold text-[#1F2937]">{title}</p>
      )}

      {outline.map((day, index) => (
        <div
          key={`${day.weekday ?? "day"}-${index}`}
          className="rounded-2xl border border-[#EDF0F4] bg-white p-4"
        >
          <p className="text-sm font-semibold text-[#1F2937]">
            {day.label}
          </p>

          {Array.isArray(day.lines) && day.lines.length > 0 ? (
            day.lines.map((line, lineIndex) => (
              <p
                key={`${index}-${lineIndex}`}
                className="mt-2 text-xs leading-6 text-[#6B7280]"
              >
                {line}
              </p>
            ))
          ) : (
            <p className="mt-2 text-xs text-[#A0A4AA]">استراحت</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ArrowIcon({ direction = "up" }) {
  const path =
    direction === "up"
      ? "M12 19V5m-7 7 7-7 7 7"
      : "M12 5v14m-7-7 7 7 7-7";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export default function CoachAssistant() {
  const scrollerRef = useRef(null);
  const fileRef = useRef(null);
  const composerRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
  const previousSelectedIdRef = useRef("general");

  const [relationships, setRelationships] = useState([]);
  const [selectedId, setSelectedId] = useState("general");
  const [studentSearch, setStudentSearch] = useState("");

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

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      api("/api/v1/coach/relationships"),
      api("/api/v1/coach/ai/workspace"),
    ]).then(
      ([relBody, workspace]) => {
        if (!active) return;

        const rows = Array.isArray(relBody?.relationships)
          ? relBody.relationships
          : [];

        const settings = workspace?.settings;

        setRelationships(rows);
        setConversations(
          Array.isArray(workspace?.conversations)
            ? workspace.conversations
            : []
        );
        setDocuments(
          Array.isArray(workspace?.documents) ? workspace.documents : []
        );

        setSelectedId(
          String(rows.find((row) => row.status === "active")?.id ?? "general")
        );

        if (settings) {
          setMethodology(settings.methodology || "");
          setPreferences(settings.preferences || "");
          setConstraints(settings.constraints || "");
          setSettingsReady(true);
        }
      },
      (caught) => {
        if (active) setError(errorText(caught));
      }
    );

    return () => {
      active = false;
    };
  }, []);

  const selected = relationships.find(
    (row) => String(row.id) === selectedId
  );

  const threads = conversations.filter((row) =>
    selectedId === "general"
      ? row.coaching_relationship_id == null
      : String(row.coaching_relationship_id) === selectedId
  );

  const messages = threads.flatMap((thread) =>
    (thread.messages || [])
      .filter(
        (message) =>
          message.role === "user" || message.role === "assistant"
      )
      .map((message) => ({
        ...message,
        key: `${thread.id}-${message.id}`,
      }))
  );

  const latestThread = threads.at(-1);

  const canChat =
    settingsReady &&
    (selectedId === "general" || selected?.status === "active");

  const filteredRelationships = relationships.filter((row) => {
    const name = row.athlete?.display_name || "شاگرد";
    return name.toLowerCase().includes(studentSearch.trim().toLowerCase());
  });

  const totalStudentMessages = threads.reduce(
    (sum, thread) =>
      sum +
      (thread.messages || []).filter((message) => message.role === "user")
        .length,
    0
  );

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  function scrollToBottom(behavior = "smooth") {
    const node = scrollerRef.current;
    if (!node) return;

    node.scrollTo({
      top: node.scrollHeight,
      behavior,
    });

    shouldStickToBottomRef.current = true;
  }

  function scrollToTop() {
    const node = scrollerRef.current;
    if (!node) return;

    node.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    shouldStickToBottomRef.current = false;
  }

  function handleScrollerScroll() {
    const node = scrollerRef.current;
    if (!node) return;

    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;

    const nearBottom = distanceFromBottom < 140;
    const hasScrollableContent = node.scrollHeight > node.clientHeight + 100;

    shouldStickToBottomRef.current = nearBottom;

    setShowScrollTop(node.scrollTop > 350 && hasScrollableContent);
    setShowScrollBottom(!nearBottom && hasScrollableContent);

    if (selectionAsk) setSelectionAsk(null);
  }

  useEffect(() => {
    const selectedChanged =
      previousSelectedIdRef.current !== selectedId;

    previousSelectedIdRef.current = selectedId;

    if (selectedChanged) {
      shouldStickToBottomRef.current = true;
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }

    if (shouldStickToBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom("auto"));
    }
  }, [messages.length, selectedId, live?.assistant, live?.statuses.length]);

  useEffect(() => {
    const node = composerRef.current;
    if (!node) return;

    node.style.height = "auto";
    node.style.height = `${Math.min(Math.max(node.scrollHeight, 112), 220)}px`;
  }, [chatBody]);

  useEffect(() => {
    return () => {
      photos.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  useEffect(() => {
    setQuote("");
    setSelectionAsk(null);
  }, [selectedId]);

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
        body: {
          title: knowledgeTitle,
          body: knowledgeBody,
        },
      });

      setDocuments((rows) => [
        saved,
        ...rows.filter((row) => row.id !== saved.id),
      ]);

      setKnowledgeTitle("");
      setKnowledgeBody("");
      setNotice("سند دانش ذخیره شد.");
    });
  }

  function rememberThread(thread) {
    setConversations((rows) => {
      const index = rows.findIndex((row) => row.id === thread.id);

      if (index === -1) return [...rows, thread];

      const next = rows.slice();
      next[index] = thread;
      return next;
    });
  }

  function takeQuote(text) {
    const clean = String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);

    if (!clean) return;

    setQuote(clean);
    setSelectionAsk(null);
    window.getSelection()?.removeAllRanges();
    composerRef.current?.focus();
  }

  function captureSelection() {
    const selection = window.getSelection();

    const text =
      selection?.toString().replace(/\s+/g, " ").trim() ?? "";

    const holder = selection?.anchorNode?.parentElement?.closest(
      "[data-quoteable]"
    );

    if (
      !selection ||
      selection.isCollapsed ||
      !text ||
      !holder ||
      !scrollerRef.current
    ) {
      setSelectionAsk(null);
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const host = scrollerRef.current.getBoundingClientRect();

    setSelectionAsk({
      text: text.slice(0, 500),
      top:
        rect.top -
        host.top +
        scrollerRef.current.scrollTop -
        40,
      left: Math.max(8, rect.left - host.left),
    });
  }

  function choosePhoto(event) {
    const picked = [...(event.target.files || [])];
    event.target.value = "";

    if (!picked.length) return;

    const room = 5 - photos.length;

    if (room <= 0 || picked.length > room) {
      setError("در هر پیام حداکثر ۵ عکس می‌توانی بفرستی.");
    }

    const accepted = picked
      .slice(0, Math.max(room, 0))
      .map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

    setPhotos((current) => [...current, ...accepted]);
  }

  function removePhoto(index) {
    setPhotos((current) => {
      const target = current[index];

      if (target?.url) URL.revokeObjectURL(target.url);

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function sendChat(event) {
    event?.preventDefault();

    const note = chatBody.trim();
    const quoted = quote.trim();

    if (
      (note === "" && photos.length === 0 && quoted === "") ||
      !canChat ||
      sending
    ) {
      return;
    }

    setSending(true);
    shouldStickToBottomRef.current = true;

    const imageUrls = photos.map((item) => item.url);
    const files = photos.map((item) => item.file);

    const followUp =
      note ||
      (files.length > 1
        ? "این عکس‌ها را با هم تحلیل کن."
        : files.length === 1
          ? "این عکس را تحلیل کن."
          : "درباره این بخش توضیح بده.");

    const body =
      quoted === ""
        ? followUp
        : `${quoted
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n")}\n\n${followUp}`;

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
        if (chunk.done) break;

        buffer += decoder.decode(chunk.value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part
            .split("\n")
            .find((item) => item.startsWith("data:"));

          if (!line) continue;

          const payload = JSON.parse(line.slice(5).trim());

          if (payload.type === "status") {
            setLive((current) =>
              current
                ? {
                    ...current,
                    statuses: [...current.statuses, payload.text],
                  }
                : current
            );
          } else if (payload.type === "replace") {
            assistant = payload.text || "";

            const snapshot = assistant;

            setLive((current) =>
              current ? { ...current, assistant: snapshot } : current
            );
          } else if (payload.type === "delta") {
            assistant += payload.text || "";

            const snapshot = assistant;

            setLive((current) =>
              current ? { ...current, assistant: snapshot } : current
            );
          } else if (
            payload.type === "done" &&
            payload.conversation
          ) {
            finished = true;

            rememberThread(payload.conversation);

            if (payload.generation) {
              setGeneration(payload.generation);
              setDraftKind(payload.generation.kind || "workout_program");
              setPanel("draft");
              setNotice(
                "پیش‌نویس از گفتگو ساخته شد. روزها پایین صفحه است. تا تأیید نکنی منتشر نمی‌شود."
              );
            }

            setLive(null);
            imageUrls.forEach((url) => URL.revokeObjectURL(url));
          } else if (payload.type === "error") {
            finished = true;
            setError(payload.message || "درخواست ناموفق بود.");
          }
        }
      }

      if (!finished) setError("اتصال پاسخ قطع شد.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "درخواست ناموفق بود."
      );
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
      setNotice(
        "پیش‌نویس هفته ساخته شد. تا تأیید نکنی منتشر نمی‌شود و به شاگرد داده نشده."
      );
    });
  }

  function review(path, done) {
    run(async () => {
      const updated = await api(path, {
        method: "POST",
        body: {},
      });

      setGeneration(updated);
      setNotice(done);
    });
  }

  function studentMessageCount(row) {
    return conversations
      .filter(
        (item) =>
          String(item.coaching_relationship_id) === String(row.id)
      )
      .reduce(
        (sum, item) =>
          sum +
          (item.messages || []).filter(
            (message) => message.role === "user"
          ).length,
        0
      );
  }

  return (
    <div className="min-h-dvh bg-[#F5F7FB]">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1600px] grid-cols-1 gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:grid-cols-[90px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-6">
        <div className="min-w-0">
          <Navbar />
        </div>

        <main className="flex min-h-0 min-w-0 flex-col lg:h-[calc(100dvh-48px)]">
          <section
            dir="rtl"
            className="relative flex min-h-[calc(100dvh-110px)] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:rounded-3xl lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[260px_minmax(0,1fr)] lg:rounded-[28px]"
          >
            {/* فهرست شاگردان */}
            <aside className="z-10 flex min-w-0 flex-col border-b border-[#EEF2F6] bg-[#FBFCFD] p-3 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-l lg:p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">
                    گفتگوها
                  </h3>
                  <p className="mt-1 text-[11px] text-[#9CA3AF]">
                    {relationships.length} شاگرد
                  </p>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#007BFF]">
                  <SearchIcon />
                </span>
              </div>

              {/* جستجوی شاگرد */}
              <div className="relative mb-3">
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                  <SearchIcon />
                </span>

                <input
                  type="text"
                  value={studentSearch}
                  onChange={(event) =>
                    setStudentSearch(event.target.value)
                  }
                  placeholder="جستجوی نام شاگرد..."
                  aria-label="جستجوی شاگرد"
                  className="h-11 w-full rounded-xl border border-[#E9EDF3] bg-white pr-10 pl-9 text-xs text-[#374151] outline-none transition placeholder:text-[#A0A4AA] focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10"
                />

                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch("")}
                    aria-label="پاک کردن جستجو"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#9CA3AF] hover:text-[#374151]"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] text-[#9CA3AF]">
                  {filteredRelationships.length} نتیجه
                </span>
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch("")}
                    className="text-[11px] text-[#007BFF]"
                  >
                    پاک کردن فیلتر
                  </button>
                )}
              </div>

              <div className="flex min-w-0 gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedId("general")}
                  className={`flex min-w-[155px] shrink-0 items-center gap-3 rounded-2xl border px-3 py-3 text-right transition lg:mb-1 lg:min-w-0 lg:w-full ${
                    selectedId === "general"
                      ? "border-[#DCEBFF] bg-[#EFF6FF] text-[#007BFF]"
                      : "border-transparent bg-white text-[#4B5563] hover:border-[#E9EDF3] hover:bg-white"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E5F0FF] text-sm text-[#007BFF]">
                    ✦
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">
                      گفتگوی کلی
                    </span>
                    <span className="mt-1 block text-[10px] text-[#9CA3AF]">
                      بدون شاگرد مشخص
                    </span>
                  </span>

                  {selectedId === "general" && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#007BFF]" />
                  )}
                </button>

                {filteredRelationships.map((row) => {
                  const active = selectedId === String(row.id);
                  const count = studentMessageCount(row);
                  const name = row.athlete?.display_name || "شاگرد";

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedId(String(row.id))}
                      className={`flex min-w-[170px] shrink-0 items-center gap-3 rounded-2xl border px-3 py-3 text-right transition lg:mb-1 lg:min-w-0 lg:w-full ${
                        active
                          ? "border-[#DCEBFF] bg-[#EFF6FF] text-[#007BFF]"
                          : "border-transparent bg-white text-[#4B5563] hover:border-[#E9EDF3]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          active
                            ? "bg-[#DCEBFF] text-[#007BFF]"
                            : "bg-[#F0F2F5] text-[#6B7280]"
                        }`}
                      >
                        {name.trim().slice(0, 1)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">
                          {name}
                        </span>

                        <span className="mt-1 flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              row.status === "active"
                                ? "bg-emerald-500"
                                : "bg-[#C4C8CE]"
                            }`}
                          />
                          {statusLabel(row.status)}
                        </span>
                      </span>

                      <span className="shrink-0 text-[10px] text-[#9CA3AF]">
                        {count > 0 ? `${count} پیام` : ""}
                      </span>
                    </button>
                  );
                })}

                {filteredRelationships.length === 0 && (
                  <div className="flex min-w-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E9EF] bg-white px-4 py-6 text-center lg:min-w-0">
                    <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F6FA] text-[#9CA3AF]">
                      <SearchIcon />
                    </span>
                    <p className="text-xs font-semibold text-[#4B5563]">
                      شاگردی پیدا نشد
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-[#9CA3AF]">
                      نام دیگری جستجو کن.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStudentSearch("")}
                      className="mt-3 text-xs text-[#007BFF]"
                    >
                      نمایش همه شاگردها
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* فضای اصلی گفتگو */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F8FA]">
              {/* هدر گفتگو */}
              <header className="z-[5] flex shrink-0 flex-col gap-3 border-b border-[#EEF2F6] bg-white px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#007BFF]">
                      ✦
                    </span>

                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-[#1F2937] sm:text-base">
                        {selected?.athlete?.display_name || "گفتگوی کلی"}
                      </h2>

                      <p className="mt-1 truncate text-[11px] text-[#9CA3AF]">
                        {live
                          ? "دستیار در حال پاسخ‌گویی است..."
                          : selected
                            ? `گفتگو درباره ${selected.athlete?.display_name || "این شاگرد"}`
                            : "گفتگو بدون شاگرد مشخص"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <AccountMenu />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPanel((current) =>
                        current === "settings" ? null : "settings"
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                      panel === "settings"
                        ? "bg-[#007BFF] text-white"
                        : "bg-[#F3F6FA] text-[#4B5563] hover:bg-[#EAF3FF] hover:text-[#007BFF]"
                    } ${
                      !settingsReady && panel !== "settings"
                        ? "ring-1 ring-amber-400"
                        : ""
                    }`}
                  >
                    ⚙ روش کار
                    {!settingsReady && (
                      <span className="mr-1 text-amber-500">●</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPanel((current) =>
                        current === "draft" ? null : "draft"
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                      panel === "draft"
                        ? "bg-[#007BFF] text-white"
                        : "bg-[#F3F6FA] text-[#4B5563] hover:bg-[#EAF3FF] hover:text-[#007BFF]"
                    }`}
                  >
                    پیش‌نویس
                    {generation?.status === "draft" && (
                      <span className="mr-1 text-emerald-500">●</span>
                    )}
                  </button>

                  <span className="mr-auto hidden text-[11px] text-[#9CA3AF] sm:block">
                    {totalStudentMessages > 0
                      ? `${totalStudentMessages} پیام از طرف شما`
                      : "گفتگوی تازه"}
                  </span>
                </div>
              </header>

              {/* خطا و اعلان */}
              {error && (
                <div
                  role="alert"
                  className="flex shrink-0 items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-right text-xs leading-6 text-red-700 sm:px-5"
                >
                  <span className="font-bold">!</span>
                  <p className="min-w-0 flex-1 break-words">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="shrink-0 text-base leading-none"
                    aria-label="بستن خطا"
                  >
                    ×
                  </button>
                </div>
              )}

              {notice && (
                <div
                  role="status"
                  className="flex shrink-0 items-start gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-right text-xs leading-6 text-emerald-700 sm:px-5"
                >
                  <span>✓</span>
                  <p className="min-w-0 flex-1 break-words">{notice}</p>
                  <button
                    type="button"
                    onClick={() => setNotice(null)}
                    className="shrink-0 text-base leading-none"
                    aria-label="بستن اعلان"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* محتوای گفتگو و پنل */}
              <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
                {/* پیام‌ها */}
                <div
                  ref={scrollerRef}
                  onMouseUp={captureSelection}
                  onScroll={handleScrollerScroll}
                  className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-3 py-5 sm:px-5 sm:py-6 lg:px-8"
                >
                  {selectionAsk && (
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => takeQuote(selectionAsk.text)}
                      style={{
                        top: selectionAsk.top,
                        left: selectionAsk.left,
                      }}
                      className="absolute z-10 rounded-full bg-[#111827] px-4 py-2 text-xs text-white shadow-xl transition hover:bg-[#374151]"
                    >
                      ↩ پاسخ به این بخش
                    </button>
                  )}

                  {messages.length === 0 && !live && (
                    <div className="m-auto flex w-full max-w-md flex-col items-center px-5 py-10 text-center">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#EAF3FF] text-2xl text-[#007BFF] shadow-sm">
                        ✦
                      </div>

                      <h3 className="text-base font-bold text-[#1F2937]">
                        از دستیار فیتو بپرس
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                        می‌توانی درباره تمرین، تغذیه، وضعیت شاگرد یا تحلیل
                        تصاویر سؤال بپرسی. پاسخ‌ها و سابقه هر شاگرد جداگانه
                        نگهداری می‌شوند.
                      </p>

                      {!settingsReady && (
                        <button
                          type="button"
                          onClick={() => setPanel("settings")}
                          className="mt-5 rounded-xl bg-[#007BFF] px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-[#007BFF]/15 transition hover:bg-[#006BE0]"
                        >
                          ابتدا تنظیم روش کار
                        </button>
                      )}
                    </div>
                  )}

                  {messages.map((message) => {
                    if (message.role === "assistant") {
                      return (
                        <div
                          key={message.key}
                          className="flex w-fit max-w-[96%] flex-col items-end self-end sm:max-w-[88%] lg:max-w-[min(46rem,88%)]"
                        >
                          <article
                            data-quoteable="assistant"
                            className="min-w-0 max-w-full break-words rounded-3xl rounded-bl-md border border-[#EEF0F3] bg-white px-4 py-4 text-sm leading-8 text-[#1F2937] shadow-sm sm:px-5 sm:text-base"
                          >
                            {richText(message.body)}
                          </article>

                          {message.key === lastAssistantMessage?.key && (
                            <button
                              type="button"
                              onClick={() => takeQuote(message.body)}
                              className="mt-2 rounded-lg px-2 py-1 text-[11px] text-[#9CA3AF] transition hover:bg-white hover:text-[#007BFF]"
                            >
                              ↩ پاسخ به این پیام
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <article
                        key={message.key}
                        className="w-fit max-w-[96%] self-start break-words rounded-3xl rounded-br-md bg-[#007BFF] px-4 py-4 text-sm leading-8 text-white shadow-sm shadow-[#007BFF]/10 sm:max-w-[88%] sm:px-5 sm:text-base lg:max-w-[min(46rem,88%)]"
                      >
                        {(message.image_count > 0 || message.has_image) && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {Array.from(
                              { length: message.image_count || 1 },
                              (_, index) => (
                                <img
                                  key={index}
                                  src={`/api/v1/coach/ai/messages/${message.id}/file/${index}`}
                                  alt="تصویر پیوست‌شده"
                                  className="max-h-48 max-w-full rounded-2xl object-cover"
                                />
                              )
                            )}
                          </div>
                        )}

                        <MessageText body={message.body} light />
                      </article>
                    );
                  })}

                  {live && (
                    <>
                      <article className="w-fit max-w-[96%] self-start break-words rounded-3xl rounded-br-md bg-[#007BFF] px-4 py-4 text-sm leading-8 text-white sm:max-w-[88%] sm:px-5 sm:text-base lg:max-w-[min(46rem,88%)]">
                        {live.imageUrls?.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {live.imageUrls.map((url) => (
                              <img
                                key={url}
                                src={url}
                                alt="تصویر ارسالی"
                                className="max-h-48 max-w-full rounded-2xl object-cover"
                              />
                            ))}
                          </div>
                        )}

                        <MessageText body={live.userBody} light />
                      </article>

                      <div
                        data-quoteable="assistant"
                        className="w-fit max-w-[96%] self-end break-words rounded-3xl rounded-bl-md border border-[#EEF0F3] bg-white px-4 py-4 text-sm leading-8 text-[#1F2937] shadow-sm sm:max-w-[88%] sm:px-5 sm:text-base lg:max-w-[min(46rem,88%)]"
                      >
                        {live.statuses.length > 0 && (
                          <div className="mb-3 space-y-2 border-b border-[#F3F4F6] pb-3 text-xs">
                            {live.statuses.map((line, index) => (
                              <p
                                key={`${line}-${index}`}
                                className={`flex items-center gap-2 ${
                                  index === live.statuses.length - 1 &&
                                  live.assistant === ""
                                    ? "text-[#007BFF]"
                                    : "text-[#9CA3AF]"
                                }`}
                              >
                                <span>
                                  {index === live.statuses.length - 1 &&
                                  live.assistant === ""
                                    ? "●"
                                    : "✓"}
                                </span>
                                {line}
                              </p>
                            ))}
                          </div>
                        )}

                        {live.assistant === "" ? (
                          <div className="flex items-center gap-2 py-2">
                            <span className="text-xs text-[#9CA3AF]">
                              در حال آماده‌سازی پاسخ
                            </span>
                            <span className="flex gap-1">
                              {[0, 150, 300].map((delay) => (
                                <span
                                  key={delay}
                                  style={{
                                    animationDelay: `${delay}ms`,
                                  }}
                                  className="h-2 w-2 animate-bounce rounded-full bg-[#007BFF]"
                                />
                              ))}
                            </span>
                          </div>
                        ) : (
                          <div>
                            {richText(live.assistant)}
                            <span className="mr-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#007BFF] align-middle" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* دکمه‌های شناور کنترل اسکرول */}
                <div className="pointer-events-none absolute bottom-5 left-4 z-10 flex flex-col gap-2 sm:bottom-6 sm:left-6">
                  {showScrollTop && (
                    <button
                      type="button"
                      onClick={scrollToTop}
                      title="رفتن به ابتدای گفتگو"
                      aria-label="رفتن به ابتدای گفتگو"
                      className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E8EDF4] bg-white text-[#4B5563] shadow-lg shadow-slate-900/10 transition hover:-translate-y-1 hover:border-[#007BFF] hover:text-[#007BFF] active:scale-95"
                    >
                      <ArrowIcon direction="up" />
                    </button>
                  )}

                  {showScrollBottom && (
                    <button
                      type="button"
                      onClick={() => scrollToBottom("smooth")}
                      title="رفتن به آخرین پیام"
                      aria-label="رفتن به آخرین پیام"
                      className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#007BFF] text-white shadow-lg shadow-[#007BFF]/25 transition hover:-translate-y-1 hover:bg-[#006BE0] active:scale-95"
                    >
                      <ArrowIcon direction="down" />
                    </button>
                  )}
                </div>

                {/* پنل کناری / تمام‌صفحه موبایل */}
                {panel && (
                  <aside className="absolute inset-0 z-20 flex min-h-0 min-w-0 flex-col overflow-hidden border-[#EEF2F6] bg-white text-right shadow-2xl shadow-slate-900/10 lg:static lg:w-[min(420px,42%)] lg:shrink-0 lg:border-r lg:shadow-none">
                    <div className="flex shrink-0 items-center justify-between border-b border-[#EEF2F6] px-4 py-4 sm:px-5">
                      <div>
                        <h3 className="text-sm font-bold text-[#1F2937]">
                          {panel === "settings"
                            ? "روش کار و دانش مربی"
                            : "مدیریت پیش‌نویس"}
                        </h3>
                        <p className="mt-1 text-[11px] text-[#9CA3AF]">
                          {panel === "settings"
                            ? "شخصی‌سازی پاسخ‌های دستیار"
                            : "ساخت و بررسی برنامه"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPanel(null)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F6FA] text-lg text-[#6B7280] transition hover:bg-[#E9EDF3]"
                        aria-label="بستن پنل"
                      >
                        ×
                      </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
                      {panel === "settings" ? (
                        <div className="grid gap-5">
                          <div className="rounded-2xl border border-[#E5F0FF] bg-[#F3F8FF] p-4">
                            <p className="text-xs font-semibold text-[#007BFF]">
                              تنظیمات دستیار
                            </p>
                            <p className="mt-2 text-xs leading-6 text-[#6B7280]">
                              این اطلاعات به دستیار کمک می‌کند پاسخ‌ها را
                              مطابق روش مربی و محدودیت‌های تعریف‌شده ارائه
                              کند.
                            </p>
                          </div>

                          <form
                            onSubmit={saveSettings}
                            className="grid gap-4"
                          >
                            <label className="grid gap-2 text-xs font-medium text-[#4B5563]">
                              روش مربی
                              <textarea
                                value={methodology}
                                onChange={(event) =>
                                  setMethodology(event.target.value)
                                }
                                rows={5}
                                placeholder="روش تمرین، اصول برنامه‌ریزی و رویکرد مربی..."
                                className={fieldClass}
                              />
                            </label>

                            <label className="grid gap-2 text-xs font-medium text-[#4B5563]">
                              ترجیح‌ها
                              <textarea
                                value={preferences}
                                onChange={(event) =>
                                  setPreferences(event.target.value)
                                }
                                rows={4}
                                placeholder="ترجیح‌های مربی در نحوه پاسخ‌گویی..."
                                className={fieldClass}
                              />
                            </label>

                            <label className="grid gap-2 text-xs font-medium text-[#4B5563]">
                              محدودیت‌ها
                              <textarea
                                value={constraints}
                                onChange={(event) =>
                                  setConstraints(event.target.value)
                                }
                                rows={4}
                                placeholder="محدودیت‌ها و مواردی که باید رعایت شوند..."
                                className={fieldClass}
                              />
                            </label>

                            <button
                              type="submit"
                              disabled={
                                pending ||
                                methodology.trim() === "" ||
                                preferences.trim() === "" ||
                                constraints.trim() === ""
                              }
                              className="rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007BFF]/15 transition hover:bg-[#006BE0] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {pending ? "در حال ذخیره..." : "ذخیره روش کار"}
                            </button>
                          </form>

                          <div className="h-px bg-[#EEF2F6]" />

                          <div>
                            <div className="mb-3">
                              <h4 className="text-sm font-bold text-[#1F2937]">
                                دانش اختصاصی مربی
                              </h4>
                              <p className="mt-1 text-xs leading-6 text-[#9CA3AF]">
                                نکته‌ها و اطلاعاتی که می‌خواهی دستیار در
                                پاسخ‌هایش در نظر بگیرد.
                              </p>
                            </div>

                            <form
                              onSubmit={saveKnowledge}
                              className="grid gap-3"
                            >
                              <input
                                value={knowledgeTitle}
                                onChange={(event) =>
                                  setKnowledgeTitle(event.target.value)
                                }
                                placeholder="عنوان دانش"
                                className={fieldClass}
                              />

                              <textarea
                                value={knowledgeBody}
                                onChange={(event) =>
                                  setKnowledgeBody(event.target.value)
                                }
                                rows={5}
                                placeholder="متن دانش مربی..."
                                className={fieldClass}
                              />

                              <button
                                type="submit"
                                disabled={
                                  pending ||
                                  knowledgeTitle.trim() === "" ||
                                  knowledgeBody.trim() === ""
                                }
                                className="rounded-xl border border-[#DCEBFF] bg-[#EFF6FF] px-5 py-3 text-sm font-semibold text-[#007BFF] transition hover:bg-[#E1EEFF] disabled:opacity-50"
                              >
                                ذخیره دانش
                              </button>
                            </form>
                          </div>

                          <div>
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-[#374151]">
                                اسناد ذخیره‌شده
                              </h4>
                              <span className="text-[11px] text-[#9CA3AF]">
                                {documents.length} سند
                              </span>
                            </div>

                            {documents.length > 0 ? (
                              <div className="grid gap-2">
                                {documents.map((document) => (
                                  <div
                                    key={document.id}
                                    className="flex items-center gap-3 rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] px-3 py-3"
                                  >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#007BFF]">
                                      ▤
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#4B5563]">
                                      {document.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-xl bg-[#F7F9FC] px-4 py-5 text-center text-xs text-[#9CA3AF]">
                                هنوز سندی ذخیره نشده است.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <form
                          onSubmit={createDraft}
                          className="grid gap-4"
                        >
                          <div className="rounded-2xl border border-[#E5F0FF] bg-[#F3F8FF] p-4">
                            <p className="text-xs font-semibold text-[#007BFF]">
                              ساخت برنامه با دستیار
                            </p>
                            <p className="mt-2 text-xs leading-6 text-[#6B7280]">
                              برای{" "}
                              {selected?.athlete?.display_name ||
                                "شاگرد انتخاب‌شده"}
                              ، با توجه به توضیحات و گفتگوی همین صفحه
                              پیش‌نویس بساز.
                            </p>
                          </div>

                          <label className="grid gap-2 text-xs font-medium text-[#4B5563]">
                            نوع خروجی
                            <select
                              value={draftKind}
                              onChange={(event) =>
                                setDraftKind(event.target.value)
                              }
                              className={fieldClass}
                            >
                              <option value="workout_program">تمرین</option>
                              <option value="meal_plan">غذا</option>
                              <option value="progress_review">
                                مرور پیشرفت
                              </option>
                            </select>
                          </label>

                          <label className="grid gap-2 text-xs font-medium text-[#4B5563]">
                            توضیحات برنامه
                            <textarea
                              value={draftBody}
                              onChange={(event) =>
                                setDraftBody(event.target.value)
                              }
                              rows={5}
                              placeholder="مثلاً هفته قدرت برای این شاگرد..."
                              className={fieldClass}
                            />
                          </label>

                          <button
                            type="submit"
                            disabled={
                              pending ||
                              selected?.status !== "active" ||
                              draftBody.trim() === ""
                            }
                            className="rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007BFF]/15 transition hover:bg-[#006BE0] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {pending
                              ? "در حال ساخت..."
                              : "ساخت پیش‌نویس"}
                          </button>

                          {selected?.status !== "active" && (
                            <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-700">
                              برای ساخت پیش‌نویس ابتدا یک شاگرد با رابطه
                              فعال انتخاب کن.
                            </p>
                          )}

                          {generation && (
                            <div className="rounded-2xl border border-[#E9EDF3] bg-[#F7F9FC] p-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-[#374151]">
                                  نتیجه پیش‌نویس
                                </p>
                                <span className="rounded-full bg-white px-3 py-1 text-[10px] text-[#6B7280]">
                                  {statusLabel(generation.status)}
                                </span>
                              </div>

                              <DraftOutline generation={generation} />

                              {generation.status === "draft" && (
                                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() =>
                                      review(
                                        `/api/v1/coach/ai/generations/${generation.id}/approve`,
                                        "پیش‌نویس تأیید و منتشر شد و در فهرست برنامه‌هاست. هنوز به شاگرد داده نشده."
                                      )
                                    }
                                    className="rounded-xl bg-[#007BFF] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#006BE0] disabled:opacity-50"
                                  >
                                    تأیید و انتشار
                                  </button>

                                  <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() =>
                                      review(
                                        `/api/v1/coach/ai/generations/${generation.id}/reject`,
                                        "پیش‌نویس رد شد."
                                      )
                                    }
                                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs text-[#6B7280] transition hover:bg-[#F9FAFB] disabled:opacity-50"
                                  >
                                    رد پیش‌نویس
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </form>
                      )}
                    </div>
                  </aside>
                )}
              </div>

              {/* بخش ارسال پیام */}
              <form
                onSubmit={sendChat}
                className="z-[4] shrink-0 border-t border-[#EEF2F6] bg-white px-3 py-3 sm:px-5 sm:py-4 lg:px-8"
              >
                {quote && (
                  <div className="mb-3 flex items-start gap-3 rounded-2xl border-r-[3px] border-[#007BFF] bg-[#F3F8FF] px-3 py-3 sm:px-4">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[10px] font-semibold text-[#007BFF]">
                        پاسخ به پیام
                      </p>
                      <p className="line-clamp-3 break-words text-xs leading-6 text-[#4B5563]">
                        {quote}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setQuote("")}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-lg text-[#9CA3AF] hover:text-red-500"
                      aria-label="حذف نقل‌قول"
                    >
                      ×
                    </button>
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    {photos.map((item, index) => (
                      <div key={item.url} className="relative">
                        <img
                          src={item.url}
                          alt="پیش‌نمایش تصویر"
                          className="h-16 w-16 rounded-xl border border-[#E9EDF3] object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm text-red-500 shadow-md"
                          aria-label="حذف تصویر"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <span className="text-xs text-[#9CA3AF]">
                      {photos.length} از ۵ تصویر
                    </span>
                  </div>
                )}

                <div className="rounded-2xl border border-[#E5E9EF] bg-[#F9FAFB] p-3 transition focus-within:border-[#B9D7FF] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#007BFF]/5 sm:rounded-[24px] sm:p-4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={choosePhoto}
                  />

                  <textarea
                    ref={composerRef}
                    value={chatBody}
                    onChange={(event) => setChatBody(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        sendChat();
                      }
                    }}
                    rows={3}
                    placeholder={
                      !settingsReady
                        ? "ابتدا روش کار مربی را ذخیره کن..."
                        : selected && selected.status !== "active"
                          ? "این رابطه فعال نیست."
                          : "پیام خود را برای دستیار بنویس..."
                    }
                    disabled={!canChat || sending}
                    className="min-h-24 max-h-56 w-full resize-none bg-transparent py-1 text-sm leading-7 text-[#1F2937] outline-none placeholder:text-[#A0A4AA] disabled:opacity-50 sm:text-base"
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF2F6] pt-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={
                          !canChat || sending || photos.length >= 5
                        }
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition hover:bg-[#EFF6FF] hover:text-[#007BFF] disabled:opacity-40"
                      >
                        <span className="text-base">＋</span>
                        افزودن عکس
                      </button>

                      <span className="hidden text-[10px] text-[#B0B6BF] sm:block">
                        Enter ارسال · Shift + Enter خط جدید
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        sending ||
                        !canChat ||
                        (chatBody.trim() === "" &&
                          photos.length === 0 &&
                          quote.trim() === "")
                      }
                      className="flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-[#007BFF] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#007BFF]/15 transition hover:bg-[#006BE0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          در حال ارسال
                        </>
                      ) : (
                        <>
                          ارسال
                          <span className="text-base">↑</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!canChat && (
                  <p className="mt-2 text-center text-[10px] leading-5 text-[#9CA3AF]">
                    {!settingsReady
                      ? "برای شروع گفتگو، ابتدا روش کار مربی را تنظیم و ذخیره کن."
                      : "برای گفتگو با دستیار، یک شاگرد با رابطه فعال انتخاب کن."}
                  </p>
                )}
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
