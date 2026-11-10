import { useEffect, useState } from "react";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  const fieldError = caught.errors
    ? Object.values(caught.errors).flat().find((item) => typeof item === "string")
    : null;

  return fieldError || caught.message;
}

function when(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

function statusLabel(status) {
  if (status === "active") return "فعال";
  if (status === "ended") return "پایان‌یافته";
  if (status === "pending") return "در انتظار";
  return status || "—";
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
        if (!active) {
          return;
        }

        setInvitations(Array.isArray(invitationBody?.invitations) ? invitationBody.invitations : []);
        setRelationships(Array.isArray(relationshipBody?.relationships) ? relationshipBody.relationships : []);
      },
      (caught) => {
        if (active) {
          setError(errorText(caught));
        }
      },
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
    });
  }

  function accept(event) {
    event.preventDefault();

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
      setNotice("دعوت پذیرفته شد.");
    });
  }

  function decline(invitation) {
    run(async () => {
      await api(`/api/v1/athlete/invitations/${invitation.id}/decline`, { method: "POST" });
      if (acceptingId === invitation.id) {
        setAcceptingId(null);
        setCode("");
      }
      setNotice("دعوت رد شد.");
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-[90px_1fr] gap-6 px-8 py-6 bg-[#F5F7FB]">
        <div>
          <Navbar />
        </div>
        <div className="py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="دعوت‌ها" description="دعوت مربی را بپذیرید یا رد کنید." />

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

            <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
              <h2 className="text-xl font-primary text-[#6B6F77]">دعوت‌های باز</h2>
              {invitations.length === 0 && <p className="mt-4 text-sm text-[#A0A4AA]">دعوت بازی نیست.</p>}
              <div className="mt-4 grid gap-4">
                {invitations.map((invitation) => (
                  <article key={invitation.id} className="rounded-2xl bg-[#F5F7FB] p-5">
                    <p className="text-sm text-[#4B5563]">مربی: {invitation.coach?.display_name || "—"}</p>
                    <p className="mt-1 text-xs text-[#A0A4AA]">تا {when(invitation.expires_at)}</p>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => requestCode(invitation)}
                        className="rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60"
                      >
                        پذیرش
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => decline(invitation)}
                        className="rounded-2xl border border-[#F0F2F5] bg-white px-5 py-2 text-sm text-[#6B6F77] disabled:opacity-60"
                      >
                        رد
                      </button>
                    </div>
                    {acceptingId === invitation.id && (
                      <form onSubmit={accept} className="mt-4 grid max-w-xs gap-3">
                        <label className="grid gap-2 text-xs text-[#6B6F77]">
                          کد پنج‌رقمی
                          <input
                            value={code}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={5}
                            onChange={(event) => setCode(event.target.value)}
                            className="rounded-2xl border border-[#F0F2F5] bg-white px-4 py-3 text-left text-sm"
                            dir="ltr"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={pending}
                          className="w-fit rounded-2xl bg-[#007BFF] px-5 py-2 text-sm text-white disabled:opacity-60"
                        >
                          تأیید کد
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section dir="rtl" className="col-span-12 rounded-3xl bg-white p-7 text-right">
              <h2 className="text-xl font-primary text-[#6B6F77]">رابطه‌ها</h2>
              {relationships.length === 0 && <p className="mt-4 text-sm text-[#A0A4AA]">رابطه‌ای نیست.</p>}
              <div className="mt-4 grid gap-3">
                {relationships.map((relationship) => (
                  <p key={relationship.id} className="text-sm text-[#4B5563]">
                    {relationship.coach?.display_name || "—"}، {statusLabel(relationship.status)}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
