export default function PreviewNote({ tone = "muted" }) {
  const color = tone === "light" ? "text-white/80" : "text-[#9CA3AF]";

  return <p className={`text-xs ${color}`}>پیش‌نمایش، به حساب وصل نیست</p>;
}
