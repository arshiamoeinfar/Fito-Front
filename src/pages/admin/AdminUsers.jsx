import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function statusLabel(status) {
  if (status === "active") return "فعال";
  if (status === "suspended") return "تعلیق‌شده";
  return status || "—";
}

export default function AdminUsers() {
  const { status, account, refresh } = useSession();

  if (status === "loading") {
    return <Notice>در حال بررسی حساب</Notice>;
  }

  if (status === "error") {
    return (
      <Notice>
        <p>ارتباط با سرور برقرار نشد.</p>
        <button type="button" className="rounded-xl bg-[#007BFF] px-5 py-3 text-sm text-white" onClick={() => refresh().catch(() => {})}>
          تلاش دوباره
        </button>
      </Notice>
    );
  }

  if (status !== "authenticated" || !account) {
    return <Navigate to="/" replace />;
  }

  return <UserDesk selfId={account.user_id} />;
}

function UserDesk({ selfId }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let active = true;

    api("/api/v1/admin/users").then(
      (body) => {
        if (!active) {
          return;
        }

        setUsers(Array.isArray(body?.users) ? body.users : []);
        setForbidden(false);
      },
      (caught) => {
        if (!active) {
          return;
        }

        setForbidden(caught instanceof ApiError && caught.status === 403);
        setError(errorText(caught));
      },
    );

    return () => {
      active = false;
    };
  }, []);

  async function change(user, action) {
    setError(null);
    setNotice(null);
    setPendingId(user.id);

    try {
      const saved = await api(`/api/v1/admin/users/${user.id}/${action}`, { method: "POST", body: {} });
      setUsers((rows) => rows.map((row) => (row.id === saved.id ? saved : row)));
      setNotice(saved.status === "suspended" ? "حساب تعلیق شد. پروفایل و تاریخچه حذف نشد." : "تعلیق برداشته شد.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-1 gap-6 bg-[#F5F7FB] px-4 pb-6 pt-24 lg:grid-cols-[90px_1fr] lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6">
            <HeaderDashBoard title="حساب کاربران" description="تعلیق فقط وضعیت ورود را می‌بندد و پروفایل را حذف نمی‌کند." />
            <div className="col-span-12 flex gap-4">
              <Link to="/admin/plans" className="text-sm text-[#007BFF]">پلن‌ها</Link>
              <Link to="/admin/settings" className="text-sm text-[#007BFF]">تنظیمات دستیار</Link>
              <Link to="/admin/homepage" className="text-sm text-[#007BFF]">صفحه اصلی</Link>
            </div>
            {error ? <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-sm text-red-700">{error}</p> : null}
            {notice ? <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-sm text-green-700">{notice}</p> : null}
            {forbidden ? null : (
              <section className="col-span-12 rounded-3xl bg-white p-7">
                <h2 className="text-xl text-[#6B6F77]">کاربران</h2>
                <div className="mt-5 grid gap-3">
                  {users.map((user) => (
                    <article key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F5F7FB] px-4 py-3">
                      <div>
                        <p className="text-sm text-[#4B5563]">{user.phone}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {user.coach?.display_name || "بدون پروفایل مربی"} · {user.athlete?.display_name || "بدون پروفایل ورزشکار"} · {statusLabel(user.status)}
                        </p>
                      </div>
                      {user.id === selfId ? (
                        <span className="text-xs text-[#9CA3AF]">حساب خودت</span>
                      ) : (
                        <button
                          type="button"
                          disabled={pendingId === user.id}
                          onClick={() => change(user, user.status === "suspended" ? "restore" : "suspend")}
                          className="rounded-2xl bg-[#007BFF] px-4 py-2 text-sm text-white disabled:opacity-60"
                        >
                          {user.status === "suspended" ? "رفع تعلیق" : "تعلیق"}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Notice({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 text-[#1a1a1a]">
      <div className="flex flex-col items-center gap-4 text-center">{children}</div>
    </div>
  );
}
