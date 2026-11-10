import { useState } from "react";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#007BFF]";

export default function AuthDialog({ mode, onClose, onAuthenticated }) {
  const { refresh } = useSession();
  const [step, setStep] = useState(mode === "signup" ? "signup-phone" : "choose");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [panel, setPanel] = useState("");
  const [password, setPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function run(action) {
    setError(null);
    setPending(true);

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError("درخواست ناموفق بود.", { status: 0 }));
    } finally {
      setPending(false);
    }
  }

  async function finishLogin() {
    const account = await refresh();

    if (!account) {
      throw new ApiError("نشست ورود ساخته نشد.", { status: 401 });
    }

    if (account.password_is_initial) {
      setPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setStep("replace-password");
      return;
    }

    onClose();
    onAuthenticated?.(account);
  }

  function requestCode(purpose, nextStep) {
    return run(async () => {
      if (phone.trim() === "") {
        throw new ApiError("شماره موبایل را وارد کنید.", { status: 422, errors: { phone: ["شماره موبایل را وارد کنید."] } });
      }

      await api("/api/v1/auth/otp", {
        method: "POST",
        body: { phone, purpose },
      });
      setCode("");
      setStep(nextStep);
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 py-6 sm:items-center" dir="rtl">
      <button className="absolute inset-0 cursor-default" aria-label="بستن" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#07090d] p-6 text-white shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-title" className="text-xl font-bold">
              {titleFor(step, mode)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/45">{textFor(step)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:text-white"
          >
            بستن
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error.message}
          </p>
        )}

        {step === "choose" && (
          <div className="grid gap-3">
            <button type="button" className={primaryButton} onClick={() => setStep("login-phone")}>
              ورود با کد یکبارمصرف
            </button>
            <button type="button" className={secondaryButton} onClick={() => setStep("password")}>
              ورود با رمز
            </button>
          </div>
        )}

        {step === "signup-phone" && (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              requestCode("signup", "signup-code");
            }}
          >
            <Field label="شماره موبایل" error={fieldMessage(error, "phone")}>
              <input className={inputClass} inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <button className={primaryButton} disabled={pending}>دریافت کد</button>
          </form>
        )}

        {step === "signup-code" && (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                assertCode(code);
                await api("/api/v1/auth/otp/verify", {
                  method: "POST",
                  body: { phone, purpose: "signup", code },
                });
                setStep("profile");
              });
            }}
          >
            <CodeField code={code} setCode={setCode} error={fieldMessage(error, "code")} />
            <button className={primaryButton} disabled={pending}>تأیید شماره</button>
          </form>
        )}

        {step === "profile" && (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                if (displayName.trim() === "") {
                  throw new ApiError("نام را وارد کنید.", { status: 422, errors: { display_name: ["نام را وارد کنید."] } });
                }
                if (!/^\d{10}$/.test(nationalCode)) {
                  throw new ApiError("کد ملی باید ۱۰ رقم باشد.", { status: 422, errors: { national_code: ["کد ملی باید ۱۰ رقم باشد."] } });
                }
                if (panel !== "coach" && panel !== "athlete") {
                  throw new ApiError("یکی از دو پنل مربی یا ورزشکار را انتخاب کنید.", { status: 422, errors: { panel: ["پنل را انتخاب کنید."] } });
                }

                await api("/api/v1/auth/signup", {
                  method: "POST",
                  body: {
                    phone,
                    national_code: nationalCode,
                    display_name: displayName.trim(),
                    panel,
                  },
                });
                await api("/api/v1/auth/otp", {
                  method: "POST",
                  body: { phone, purpose: "login" },
                });
                setCode("");
                setStep("login-code");
              });
            }}
          >
            <Field label="نام" error={fieldMessage(error, "display_name")}>
              <input className={inputClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </Field>
            <Field label="کد ملی" error={fieldMessage(error, "national_code")}>
              <input className={inputClass} inputMode="numeric" maxLength={10} value={nationalCode} onChange={(event) => setNationalCode(event.target.value)} />
            </Field>
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="mb-2 text-xs text-white/50">پنل</legend>
              <PanelChoice value="coach" current={panel} onChange={setPanel}>مربی</PanelChoice>
              <PanelChoice value="athlete" current={panel} onChange={setPanel}>ورزشکار</PanelChoice>
            </fieldset>
            {fieldMessage(error, "panel") && <p className="text-xs text-red-200">{fieldMessage(error, "panel")}</p>}
            <button className={primaryButton} disabled={pending}>ساخت حساب</button>
          </form>
        )}

        {step === "login-phone" && (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              requestCode("login", "login-code");
            }}
          >
            <Field label="شماره موبایل" error={fieldMessage(error, "phone")}>
              <input className={inputClass} inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <button className={primaryButton} disabled={pending}>دریافت کد</button>
          </form>
        )}

        {step === "login-code" && (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                assertCode(code);
                await api("/api/v1/auth/otp/verify", {
                  method: "POST",
                  body: { phone, purpose: "login", code, client: "web" },
                });
                await finishLogin();
              });
            }}
          >
            <CodeField code={code} setCode={setCode} error={fieldMessage(error, "code")} />
            <button className={primaryButton} disabled={pending}>ورود</button>
          </form>
        )}

        {step === "password" && (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                if (phone.trim() === "" || password === "") {
                  throw new ApiError("شماره و رمز را وارد کنید.", { status: 422 });
                }
                await api("/api/v1/auth/password", {
                  method: "POST",
                  body: { phone, password, client: "web" },
                });
                await finishLogin();
              });
            }}
          >
            <Field label="شماره موبایل" error={fieldMessage(error, "phone")}>
              <input className={inputClass} inputMode="tel" autoComplete="username" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label="رمز" error={fieldMessage(error, "password")}>
              <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <button className={primaryButton} disabled={pending}>ورود</button>
          </form>
        )}

        {step === "replace-password" && (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                if (nextPassword.length < 8) {
                  throw new ApiError("رمز جدید حداقل ۸ کاراکتر است.", { status: 422, errors: { password: ["رمز جدید حداقل ۸ کاراکتر است."] } });
                }
                if (nextPassword !== confirmPassword) {
                  throw new ApiError("تکرار رمز با رمز جدید یکی نیست.", { status: 422 });
                }
                await api("/api/v1/me/password", {
                  method: "POST",
                  body: { current_password: password, password: nextPassword },
                });
                const account = await refresh();
                onClose();
                onAuthenticated?.(account);
              });
            }}
          >
            <Field label="رمز فعلی" error={fieldMessage(error, "current_password")}>
              <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <Field label="رمز جدید" error={fieldMessage(error, "password")}>
              <input className={inputClass} type="password" autoComplete="new-password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} />
            </Field>
            <Field label="تکرار رمز جدید">
              <input className={inputClass} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </Field>
            <button className={primaryButton} disabled={pending}>ذخیره رمز</button>
          </form>
        )}
      </section>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="grid gap-2 text-xs text-white/50">
      {label}
      {children}
      {error && <span className="text-red-200">{error}</span>}
    </label>
  );
}

function CodeField({ code, setCode, error }) {
  return (
    <Field label="کد پنج‌رقمی" error={error}>
      <input
        className={inputClass}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={5}
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />
    </Field>
  );
}

function PanelChoice({ value, current, onChange, children }) {
  const selected = current === value;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-xl border px-4 py-3 text-sm transition ${
        selected ? "border-[#007BFF] bg-[#007BFF]/15 text-white" : "border-white/10 text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function assertCode(code) {
  if (!/^\d{5}$/.test(code)) {
    throw new ApiError("کد باید ۵ رقم باشد.", { status: 422, errors: { code: ["کد باید ۵ رقم باشد."] } });
  }
}

function fieldMessage(error, field) {
  const message = error?.errors?.[field];
  return Array.isArray(message) ? message[0] : null;
}

function titleFor(step, mode) {
  if (step === "replace-password") return "تعویض رمز اولیه";
  if (step === "password" || step === "login-phone" || step === "login-code") return "ورود";
  if (mode === "signup" || step === "profile" || step.startsWith("signup")) return "ثبت‌نام";
  return "ورود";
}

function textFor(step) {
  const copy = {
    choose: "با کد یکبارمصرف یا با رمز وارد شوید.",
    "signup-phone": "شماره موبایل را وارد کنید تا کد تأیید بیاید.",
    "signup-code": "کد پیامک‌شده را وارد کنید. کد را از قبل در صفحه پر نمی‌کنیم.",
    profile: "فقط یکی از دو پنل مربی یا ورزشکار را انتخاب کنید.",
    "login-phone": "کد ورود برای همین شماره فرستاده می‌شود.",
    "login-code": "اگر تازه ثبت‌نام کرده‌اید، این کد ورود است و با کد ساخت حساب فرق دارد.",
    password: "حسابی که رمز دارد از اینجا وارد می‌شود.",
    "replace-password": "این رمز اولیه است و قبل از ادامه باید عوض شود.",
  };

  return copy[step] ?? "";
}

const primaryButton =
  "rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#006fe6] disabled:cursor-wait disabled:opacity-60";

const secondaryButton =
  "rounded-xl border border-white/10 px-5 py-3 text-sm text-white/80 transition hover:bg-white/5";
