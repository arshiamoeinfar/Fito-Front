import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";

const fieldClass = "mt-2 w-full rounded-2xl border border-[#F0F2F5] bg-[#F5F7FB] px-4 py-3 text-sm text-[#4B5563] outline-none";

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

export default function AdminSettings() {
  const { status, account, refresh } = useSession();

  if (status === "loading") {
    return <p className="p-8 text-sm text-[#6B6F77]">در حال بررسی حساب</p>;
  }

  if (status === "error") {
    return (
      <div className="p-8">
        <button type="button" className="rounded-xl bg-[#007BFF] px-5 py-3 text-sm text-white" onClick={() => refresh().catch(() => {})}>
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (status !== "authenticated" || !account?.roles?.includes("platform_admin")) {
    return <Navigate to="/" replace />;
  }

  return <ProviderForm />;
}

function ProviderForm() {
  const [provider, setProvider] = useState("openai");
  const [modelName, setModelName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hint, setHint] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    api("/api/v1/admin/ai-provider").then((body) => {
      if (!active || !body) {
        return;
      }

      setConfigured(Boolean(body.configured));
      setProvider(body.provider || "openai");
      setModelName(body.model_name || "");
      setBaseUrl(body.base_url || "");
      setHint(body.key_hint || null);
    }, (caught) => {
      if (active) {
        setError(errorText(caught));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function save(event) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const saved = await api("/api/v1/admin/ai-provider", {
        method: "PUT",
        body: {
          provider,
          model_name: modelName,
          base_url: baseUrl,
          api_key: apiKey,
        },
      });
      setConfigured(Boolean(saved.configured));
      setBaseUrl(saved.base_url || "");
      setHint(saved.key_hint || null);
      setApiKey("");
      setNotice("اتصال مدل ذخیره شد. دستیار از این آدرس و کلید استفاده می‌کند.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-1 gap-6 bg-[#F5F7FB] px-4 pb-6 pt-24 lg:grid-cols-[90px_1fr] lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6" dir="rtl">
            <HeaderDashBoard title="تنظیمات دستیار" description="آدرس پایه و کلید API مدل" />
            <div className="col-span-12 flex gap-4 text-sm text-[#007BFF]">
              <Link to="/admin/plans">پلن‌ها</Link>
              <Link to="/admin/users">کاربران</Link>
              <Link to="/admin/homepage">صفحه اصلی</Link>
            </div>
            {error ? <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-sm text-red-700">{error}</p> : null}
            {notice ? <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-sm text-green-700">{notice}</p> : null}
            <form onSubmit={save} className="col-span-12 rounded-3xl bg-white p-7 text-right">
              <p className="text-sm text-[#6B6F77]">
                {configured ? `کلید ذخیره شده با پایان ${hint || "—"}` : "هنوز مدلی وصل نشده است."}
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[#6B6F77]">
                  ارائه‌دهنده
                  <select value={provider} onChange={(event) => setProvider(event.target.value)} className={fieldClass}>
                    <option value="openai">OpenAI و سازگار با آن</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </label>
                <label className="text-sm text-[#6B6F77]">
                  نام مدل
                  <input value={modelName} onChange={(event) => setModelName(event.target.value)} className={fieldClass} placeholder="gpt-4o-mini" required />
                </label>
                <label className="text-sm text-[#6B6F77] md:col-span-2">
                  Base API URL
                  <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} className={fieldClass} placeholder="https://api.openai.com/v1" dir="ltr" />
                </label>
                <label className="text-sm text-[#6B6F77] md:col-span-2">
                  API Key
                  <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} className={fieldClass} type="password" autoComplete="off" placeholder={configured ? "خالی بماند تا کلید قبلی بماند" : "کلید API"} dir="ltr" />
                </label>
              </div>
              <button type="submit" disabled={pending || modelName.trim() === ""} className="mt-5 rounded-2xl bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-60">
                ذخیره اتصال
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
