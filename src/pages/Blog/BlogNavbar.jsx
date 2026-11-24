// ============================================================
// BlogNavbar — نوبار صفحات بلاگ فیتو (نسخه درست‌شده)
// ============================================================
// نوبار بلاگ، نوبار Home نیست و نباید آیتم‌های Home را داشته باشد.
// «امکانات، نحوه کار، دمو، چرا فیتو؟، تمرین، تغذیه، مربیان، تعرفه‌ها»
// سکشن‌های صفحه اصلی‌اند و به مقاله ربطی ندارند — برای همین از
// نوبار بلاگ حذف شدند.
//
// نوبار بلاگ فقط این‌هاست:
//   لوگو (→ خانه) | خانه | بلاگ (فعال) | دسته‌ها (دراپ‌دان با ۵ دسته
//   واقعی بلاگ) | ورود به پنل / شروع رایگان
//
// دسته‌ها از blogData می‌آیند و به /blog/category/:slug می‌روند:
//   تمرین (tamrin) | تغذیه (taghzieh) | ریکاوری (recovery) |
//   سلامت و مکمل (salamat) | سبک زندگی (zendegi)
//
// نصب — این فایل در src/pages/Blog/ کنار BlogListPage می‌نشیند:
//   import BlogNavbar from './BlogNavbar';
//   <BlogNavbar />
// به‌جای Navbar داشبورد در صفحات بلاگ. نوبار sticky است، نه fixed —
// با pt-8 صفحات بلاگ تداخل ندارد.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Dumbbell,
  HeartPulse,
  Menu,
  MoonStar,
  Sparkles,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react';
import ThemeSwitcher from '../../Components/shared/ThemeSwitcher/ThemeSwitcher';

const CATEGORIES = [
  { name: 'تمرین', slug: 'tamrin', Icon: Dumbbell },
  { name: 'تغذیه', slug: 'taghzieh', Icon: UtensilsCrossed },
  { name: 'ریکاوری', slug: 'recovery', Icon: MoonStar },
  { name: 'سلامت و مکمل', slug: 'salamat', Icon: HeartPulse },
  { name: 'سبک زندگی', slug: 'zendegi', Icon: Sparkles },
];

export default function BlogNavbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  function goCategory(slug) {
    setCatsOpen(false);
    setMenuOpen(false);
    navigate(`/blog/category/${slug}`);
  }

  return (
    <header className="sticky top-0 z-50 px-3 pt-3" dir="rtl">
      <div className="mx-auto max-w-[1200px] rounded-2xl bg-white/70 ring-1 ring-slate-100 backdrop-blur-xl transition-all duration-300 dark:bg-surface/90">
        <div className="flex h-16 items-center justify-between px-4 lg:px-5">
          <Link to="/" className="flex items-center gap-2" aria-label="فیتو — صفحه اصلی">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#007BFF] text-white">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-black text-[#0b1530] dark:text-foreground">Fito</span>
              <span className="block text-[11px] text-slate-500">مقالات فیتو</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="نوبار بلاگ">
            <Link to="/" className="text-sm font-semibold text-slate-500 transition hover:text-[#007BFF]">
              خانه
            </Link>
            <Link
              to="/blog"
              aria-current="page"
              className="text-sm font-semibold text-[#007BFF] transition hover:text-[#007BFF]"
            >
              بلاگ
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setCatsOpen(!catsOpen)}
                aria-expanded={catsOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-[#007BFF]"
              >
                دسته‌ها
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${catsOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {catsOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-100 dark:bg-surface dark:ring-border">
                  {CATEGORIES.map(({ name, slug, Icon }) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => goCategory(slug)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm font-semibold text-slate-600 transition hover:bg-[#F5F7FB] hover:text-[#007BFF] dark:text-foreground dark:hover:bg-surface-secondary"
                    >
                      <Icon className="h-5 w-5 text-[#007BFF]" aria-hidden="true" />
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => navigate('/dashboardAthlete')}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-[#007BFF]"
            >
              ورود به پنل
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-xl bg-[#007BFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0066d6]"
            >
              شروع رایگان
            </button>
            <ThemeSwitcher />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="منو"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-slate-200 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4">
              <Link to="/" onClick={() => setMenuOpen(false)} className="border-b border-slate-100 pb-3 text-right text-sm font-semibold text-slate-600">
                خانه
              </Link>
              <Link
                to="/blog"
                onClick={() => setMenuOpen(false)}
                aria-current="page"
                className="border-b border-slate-100 pb-3 text-right text-sm font-semibold text-[#007BFF]"
              >
                بلاگ
              </Link>
              <p className="text-xs font-bold text-slate-400">دسته‌ها</p>
              {CATEGORIES.map(({ name, slug, Icon }) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => goCategory(slug)}
                  className="flex items-center gap-3 border-b border-slate-100 pb-3 text-right text-sm font-semibold text-slate-600"
                >
                  <Icon className="h-5 w-5 text-[#007BFF]" aria-hidden="true" />
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/dashboardAthlete');
                }}
                className="mt-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                ورود به پنل
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/');
                }}
                className="rounded-xl bg-[#007BFF] px-4 py-2.5 text-sm font-semibold text-white"
              >
                شروع رایگان
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
