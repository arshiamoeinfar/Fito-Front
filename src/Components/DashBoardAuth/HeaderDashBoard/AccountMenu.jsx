import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/client";
import { useSession } from "../../../api/session";
import UserProfile from "./UserProfile/UserProfile";

export default function AccountMenu() {
  const navigate = useNavigate();
  const { refresh } = useSession();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    try {
      await api("/api/v1/auth/logout", { method: "POST" });
    } finally {
      await refresh().catch(() => {});
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="flex items-center gap-3">
      <UserProfile />
      <button
        type="button"
        onClick={logout}
        disabled={leaving}
        className="rounded-full bg-white px-4 py-2 text-sm text-[#6B6F77] ring-1 ring-[#E5E7EB] transition hover:text-[#007BFF] disabled:opacity-50"
      >
        خروج
      </button>
    </div>
  );
}
