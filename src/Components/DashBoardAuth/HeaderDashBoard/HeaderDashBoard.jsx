import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AccountMenu from "./AccountMenu";
import HeadeeMessage from "./HeadeeMessage/HeadeeMessage";
import BellImg from "../../../assets/Icons/Bell.svg";
import LetterImg from "../../../assets/Icons/Letter.svg";
import BtnHeader from "./BtnHeader/BtnHeader";
import ThemeSwitcher from "../../shared/ThemeSwitcher/ThemeSwitcher";
import { api } from "../../../api/client";
function isMessageNotice(row) {
  return (
    row?.type === "feedback_replied" || row?.subject_type === "feedback_message"
  );
}

function when(value) {
  if (!value) {
    return "";
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

function HeaderSearch({ value, onChange, results = [], onPick, hint = "" }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const query = String(value || "").trim();
  const list = Array.isArray(results) ? results : [];

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (box.current && !box.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={box} className="relative w-full sm:max-w-sm sm:flex-1">
      <div className="flex items-center gap-2 rounded-full border border-[#E4E7EC] bg-white px-4 py-2.5">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-[#A0A4AA]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "Enter" && list[0]) {
              event.preventDefault();
              onPick?.(list[0]);
              setOpen(false);
            }
          }}
          placeholder="جستجو در تمرین‌ها"
          aria-label="جستجو در تمرین‌ها"
          className="w-full bg-transparent text-sm text-[#4F5965] outline-none placeholder:text-[#A0A4AA]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="cursor-pointer text-xs text-[#A0A4AA]"
            aria-label="پاک کردن جستجو"
          >
            ×
          </button>
        ) : null}
      </div>
      {open && query ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white p-1.5 shadow-xl">
          {hint ? (
            <p className="px-3 py-3 text-sm text-[#8A8F98]">{hint}</p>
          ) : null}
          {!hint && list.length === 0 ? (
            <p className="px-3 py-3 text-sm text-[#8A8F98]">چیزی پیدا نشد</p>
          ) : null}
          {list.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onPick?.(item);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-[#F5F7FB]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-[#2C3138]">
                  {item.title}
                </span>
                {item.detail ? (
                  <span className="block truncate text-xs text-[#8A8F98]">
                    {item.detail}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 rounded-full bg-[#E8F1FF] px-2 py-1 text-[11px] text-[#007BFF]">
                {item.kind}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function HeaderDashBoard({
  title,
  description,
  date,
  newStatus,
  btnTrue = false,
  imgBtn,
  onAction,
  actionLabel,
  searchValue,
  onSearchChange,
  searchResults,
  onSearchPick,
  searchHint = "",

}) {
  const [notifications, setNotifications] = useState([]);
  const [noticeError, setNoticeError] = useState("");
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    let active = true;

    api("/api/v1/notifications").then(
      (body) => {
        if (active) {
          setNotifications(
            Array.isArray(body?.notifications) ? body.notifications : [],
          );
          setNoticeError("");
        }
      },
      () => {
        if (active) {
          setNotifications([]);
          setNoticeError("اعلان‌ها خوانده نشد.");
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  async function markRead(item) {
    if (!item?.unread) {
      return;
    }

    try {
      const updated = await api(`/api/v1/notifications/${item.id}/read`, {
        method: "POST",
        body: {},
      });
      setNotifications((rows) =>
        rows.map((row) => (row.id === item.id ? updated : row)),
      );
    } catch {
      setNoticeError("خواندن اعلان ثبت نشد.");
    }
  }

  function toItem(row) {
    const text = row?.title
      ? `${row.title} — ${row.body || ""}`
      : row?.body || "اعلان";
    return {
      id: row?.id,
      text,
      time: when(row?.created_at),
      unread: row?.read_at == null,
      category: isMessageNotice(row) ? "coach" : undefined,
    };
  }

  const messageItems = notifications.filter(isMessageNotice).map(toItem);
  const noticeItems = notifications
    .filter((row) => !isMessageNotice(row))
    .map(toItem);
  const messageUnread = messageItems.filter((item) => item.unread).length;
  const noticeUnread = noticeItems.filter((item) => item.unread).length;
  const messageBox = location.pathname.startsWith("/coach")
    ? "/coach/message"
    : "/feedback";

  return (
    <div className="col-span-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="min-w-0 lg:flex-1">
          <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl lg:text-3xl">
            {title}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:mt-2 sm:text-sm">
            {description ? (
              <span className="text-muted">{description}</span>
            ) : null}
            {date ? (
              <span className="font-medium text-foreground">{date}</span>
            ) : null}
            {newStatus ? (
              <span className="text-success">{newStatus}</span>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:shrink-0">
          {typeof onSearchChange === "function" ? (
            <HeaderSearch
              value={searchValue}
              onChange={onSearchChange}
              results={searchResults}
              onPick={onSearchPick}
              hint={searchHint}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start sm:gap-3">
            {btnTrue && (
              <BtnHeader
                imgBtn={imgBtn}
                onClick={() => navigate("/AnalysisPage/tools")}
                onAction={onAction}
                label={actionLabel}
              />
            )}
            <div className="flex gap-5">
              <ThemeSwitcher />
              <HeadeeMessage
                img={LetterImg}
                value={messageUnread}
                title="پیام‌ها"
                label="پیام‌ها"
                items={messageItems}
                emptyText={noticeError || "پیامی ثبت نشده"}
                actionLabel="رفتن به پیام‌ها"
                onAction={() => navigate(messageBox)}
                onSelect={(item) => {
                  markRead(item);
                  navigate(messageBox);
                }}
              />
              <HeadeeMessage
                img={BellImg}
                value={noticeUnread}
                items={noticeItems}
                emptyText={noticeError || "چیزی برای نمایش نیست"}
                onSelect={markRead}
              />
            </div>
            <div className="flex">
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
