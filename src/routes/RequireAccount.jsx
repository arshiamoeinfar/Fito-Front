import { Navigate } from "react-router-dom";
import { useSession } from "../api/session";

export default function RequireAccount({ profile, children }) {
  const { status, account, refresh } = useSession();

  if (status === "loading") {
    return <AccountNotice>در حال بررسی حساب</AccountNotice>;
  }

  if (status === "error") {
    return (
      <AccountNotice>
        <p>ارتباط با سرور برقرار نشد.</p>
        <button
          type="button"
          className="rounded-xl bg-[#007BFF] px-5 py-3 text-sm text-white"
          onClick={() => {
            refresh().catch(() => {});
          }}
        >
          تلاش دوباره
        </button>
      </AccountNotice>
    );
  }

  if (status !== "authenticated" || !account) {
    return <Navigate to="/" replace />;
  }

  const hasCoach = Boolean(account.profiles?.coach);
  const hasAthlete = Boolean(account.profiles?.athlete);
  const allowed = profile === "coach" ? hasCoach : hasAthlete;

  if (allowed) {
    return children;
  }

  if (hasAthlete) {
    return <Navigate to="/dashboardAthlete" replace />;
  }

  if (hasCoach) {
    return <Navigate to="/coach/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

function AccountNotice({ children }) {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-white px-6 font-primary text-[#1a1a1a]"
    >
      <div className="flex flex-col items-center gap-4 text-center">{children}</div>
    </div>
  );
}
