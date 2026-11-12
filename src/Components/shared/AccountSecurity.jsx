import { useState } from "react";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";

export default function AccountSecurity({ profile, hideFacts = false }) {
  const { account, refresh } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const name = profile === "coach"
    ? account?.profiles?.coach?.display_name
    : account?.profiles?.athlete?.display_name;
  const phone = account?.phone ?? "";
  const status = account?.status === "active" ? "فعال" : (account?.status || "");

  async function submit(event) {
    event.preventDefault();
    setSaved(false);

    if (password.length < 8) {
      setError("رمز جدید حداقل ۸ کاراکتر است.");
      return;
    }

    if (password !== confirmPassword) {
      setError("تکرار رمز با رمز جدید یکی نیست.");
      return;
    }

    setError(null);
    setPending(true);

    try {
      await api("/api/v1/me/password", {
        method: "POST",
        body: {
          current_password: currentPassword,
          password,
        },
      });
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setSaved(true);
      await refresh();
    } catch (caught) {
      const reason = caught instanceof ApiError
        ? caught
        : new ApiError("درخواست ناموفق بود.", { status: 0 });
      const fieldError = reason.errors?.current_password?.[0] || reason.errors?.password?.[0];
      setError(fieldError || reason.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="account-password" onSubmit={submit} className="grid gap-4" dir="rtl">
      {hideFacts ? null : (
        <dl className="grid gap-3 md:grid-cols-3">
          <Fact label="نام" value={name || "—"} />
          <Fact label="تلفن" value={phone || "—"} />
          <Fact label="وضعیت" value={status || "—"} />
        </dl>
      )}

      {account?.password_is_initial && (
        <p className="rounded-xl bg-[#EEF6FF] px-4 py-3 text-sm text-[#007BFF]">
          این رمز اولیه است و قبل از ادامه باید عوض شود.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <PasswordField label="رمز فعلی" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
        <PasswordField label="رمز جدید" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField label="تکرار رمز جدید" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">رمز عوض شد.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
      >
        تغییر رمز عبور
      </button>
    </form>
  );
}

function Fact({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 py-3">
      <dt className="text-xs text-[#9CA3AF]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#1F2937]">{value}</dd>
    </div>
  );
}

function PasswordField({ label, value, onChange, autoComplete }) {
  return (
    <label className="grid gap-2 text-xs text-[#4B5563]">
      {label}
      <input
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#007BFF]"
      />
    </label>
  );
}
