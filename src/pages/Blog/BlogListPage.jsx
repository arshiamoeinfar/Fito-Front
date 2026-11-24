// ============================================================
// صفحه بلاگ /blog — چیدمان بنتو + سایدبار
// ============================================================
// نه هیروی ادیتوریال قبلی، نه ستون وسط ساده نیوتن. این نسخه:
//   - نوار بالای فشرده (تیتر + جستجو) زیر BlogNavbar
//   - دسکتاپ: ستون اصلی + سایدبار چسبان (دسته‌ها، خبرنامه،
//     دوره‌های مرتبط)؛ موبایل: سایدبار زیر محتوا می‌آید
//   - مقاله شاخص: کاشی بنتو بزرگ — عکس یک طرف، متن طرف دیگر
//   - دو مقاله بعدی: کاشی‌های کوچک‌تر بنتو
//   - «مقالات اخیر»: گرید ۲ ستونه کارت‌های فشرده
//   - «قدیمی تر»: دکمه تمام‌عرض پایین ستون اصلی
// محتوا و رنگ‌ها فیتو می‌مانند (آبی #007BFF، توکن‌های تم، فونت Modam).
// منطق و API عوض نشده است: همان fetch، فیلتر سرچ، PAGE_SIZE و خبرنامه
// محلی. ایمپورت‌ها مطابق پروژه آرشیا هستند: BlogCard و BlogNavbar
// در همین پوشه‌اند (./BlogCard ،./BlogNavbar) و نوبار داشبورد
// (shared/Navbar) اینجا استفاده نمی‌شود.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  Clock,
  Dumbbell,
  HeartPulse,
  Mail,
  MoonStar,
  Search,
  SearchX,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import BlogCard from './BlogCard';
import { fetchCategories, fetchPosts } from './blogApi';
import { relatedPrograms } from './blogData';
import BlogNavbar from './BlogNavbar';

const CATEGORY_ICONS = {
  Dumbbell,
  UtensilsCrossed,
  MoonStar,
  HeartPulse,
  Sparkles,
};

const PROGRAM_ICONS = {
  'beginner-program': Dumbbell,
  'nutrition-plan': UtensilsCrossed,
};

const PAGE_SIZE = 6;

function Meta({ post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {post.published_at ? (
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {post.published_at}
        </span>
      ) : null}
      {post.reading_minutes ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {post.reading_minutes} دقیقه مطالعه
        </span>
      ) : null}
      {post.rating ? (
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          {post.rating}
        </span>
      ) : null}
      <span>{post.author_name || 'تیم فیتو'}</span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <h2 className="text-lg font-black text-foreground">{children}</h2>
    </div>
  );
}

export default function BlogListPage() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    document.title = 'مقالات | فیتو';
    let alive = true;
    setLoading(true);
    Promise.all([fetchCategories(), fetchPosts({ search: '' })])
      .then(([cats, list]) => {
        if (!alive) return;
        setCategories(cats);
        setPosts(list);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.includes(q) ||
        p.excerpt.includes(q) ||
        (p.tags || []).some((t) => t.includes(q)),
    );
  }, [posts, search]);

  const top = filtered[0] || null;
  const topNext = filtered.slice(1, 3);
  const recent = filtered.slice(3);
  const visible = recent.slice(0, page * PAGE_SIZE);
  const hasMore = recent.length > visible.length;
  const isSearching = search.trim() !== '';

  function loadOlder() {
    setPage((p) => p + 1);
    document.getElementById('recent')?.scrollIntoView({ behavior: 'smooth' });
  }

  function subscribe(event) {
    event.preventDefault();
    // خبرنامه فعلاً فقط محلی ثبت می‌شود؛ وقتی اندپوینت بک‌اند ساخته شد،
    // همین فرم به آن وصل می‌شود.
    if (email.trim()) setSubscribed(true);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <BlogNavbar />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        {/* ---------- نوار بالای فشرده: تیتر + جستجو ---------- */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">مجله فیتو</p>
            <h1 className="mt-1 text-2xl font-black text-foreground">مقالات فیتو</h1>
            <p className="mt-1 text-sm leading-7 text-muted">
              آموزش تمرین، تغذیه، ریکاوری و سلامت؛ ساده، کاربردی و متناسب با برنامه
              تمرینی و غذایی تو در فیتو.
            </p>
          </div>
          <div className="relative w-full shrink-0 sm:w-80">
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              type="search"
              placeholder="جستجو در مقالات"
              aria-label="جستجو در مقالات"
              className="w-full rounded-full border border-border bg-background py-3 pl-11 pr-11 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="پاک کردن جستجو"
                className="absolute left-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
        {isSearching ? (
          <p className="mt-4 text-sm text-muted">
            {filtered.length} نتیجه برای «{search.trim()}»
          </p>
        ) : null}

        {loading ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" aria-busy="true">
            <div className="space-y-6">
              <div className="h-72 animate-pulse rounded-2xl bg-surface-secondary" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-secondary" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-64 animate-pulse rounded-2xl bg-surface-secondary" />
              <div className="h-48 animate-pulse rounded-2xl bg-surface-secondary" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-surface p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-secondary text-primary">
              <SearchX className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-lg font-bold">مقاله‌ای پیدا نشد</p>
            <p className="mt-2 text-sm leading-7 text-muted">عبارت دیگری جستجو کن یا به همه مقالات برگرد.</p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              پاک کردن جستجو
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* ---------- ستون اصلی ---------- */}
            <div className="min-w-0 space-y-10">
              {/* ---------- مقالات برتر: کاشی بنتو بزرگ + ۲ کاشی کوچک ---------- */}
              <section aria-label="مقالات برتر">
                <SectionTitle>مقالات برتر</SectionTitle>

                {top ? (
                  <article className="mt-4 grid overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:grid-cols-2">
                    <Link to={`/blog/${top.slug}`} className="block h-56 md:h-full md:min-h-72">
                      {top.cover_url ? (
                        <img
                          src={top.cover_url}
                          alt={top.cover_alt || top.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-secondary text-4xl font-black text-primary">
                          فیتو
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-col justify-center gap-3 p-6">
                      {top.category_slug ? (
                        <Link
                          to={`/blog/category/${top.category_slug}`}
                          className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                        >
                          {(categories.find((c) => c.slug === top.category_slug) || {}).name || ''}
                        </Link>
                      ) : null}
                      <Link to={`/blog/${top.slug}`}>
                        <h3 className="text-xl font-black leading-9 text-foreground md:text-2xl md:leading-10">
                          {top.title}
                        </h3>
                      </Link>
                      {top.excerpt ? (
                        <p className="line-clamp-3 text-sm leading-8 text-muted">{top.excerpt}</p>
                      ) : null}
                      <Meta post={top} />
                      <Link
                        to={`/blog/${top.slug}`}
                        className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-bold text-primary"
                      >
                        خواندن مقاله
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                ) : null}

                {topNext.length > 0 ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {topNext.map((post) => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : null}
              </section>

              {/* ---------- مقالات اخیر: گرید ۲ ستونه ---------- */}
              <section id="recent" aria-label="مقالات اخیر">
                <SectionTitle>مقالات اخیر</SectionTitle>
                {visible.length > 0 ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {visible.map((post) => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-muted">
                    مقاله دیگری نیست؛ همه مقالات بالا نمایش داده شده‌اند.
                  </p>
                )}

                {/* ---------- قدیمی تر ---------- */}
                <div className="mt-6">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={loadOlder}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-8 py-3 text-sm font-bold text-foreground shadow-sm transition hover:border-primary hover:text-primary"
                    >
                      قدیمی تر
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : (
                    <p className="text-center text-sm text-muted">به انتهای مقالات رسیدی</p>
                  )}
                </div>
              </section>
            </div>

            {/* ---------- سایدبار چسبان ---------- */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* ---------- دسته بندی مطالب ---------- */}
              {categories.length > 0 ? (
                <section
                  className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                  aria-label="دسته بندی مطالب"
                >
                  <SectionTitle>دسته بندی مطالب</SectionTitle>
                  <div className="mt-4 divide-y divide-border">
                    {categories.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.icon] || Sparkles;
                      return (
                        <Link
                          key={cat.slug}
                          to={`/blog/category/${cat.slug}`}
                          className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-foreground">{cat.name}</span>
                            {cat.description ? (
                              <span className="block truncate text-xs leading-6 text-muted">
                                {cat.description}
                              </span>
                            ) : null}
                          </span>
                          <ChevronLeft className="h-4 w-4 shrink-0 text-muted transition group-hover:text-primary" aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {/* ---------- خبرنامه ---------- */}
              <section
                className="rounded-2xl bg-primary p-5 text-white shadow-sm"
                aria-label="عضویت در خبرنامه فیتو"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-3 text-lg font-black">عضویت در خبرنامه فیتو</h2>
                <p className="mt-1 text-sm leading-7 text-white/85">
                  مقاله‌های تازه تمرین، تغذیه و ریکاوری را هر هفته در ایمیلت داشته باش.
                </p>
                {subscribed ? (
                  <p className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-sm font-bold">
                    عضویتت ثبت شد؛ مقاله‌های تازه را برایت می‌فرستیم.
                  </p>
                ) : (
                  <form onSubmit={subscribe} className="mt-4 flex flex-col gap-2">
                    <label htmlFor="blog-newsletter-email" className="sr-only">
                      ایمیل
                    </label>
                    <input
                      id="blog-newsletter-email"
                      type="email"
                      required
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ایمیلت را بنویس"
                      className="w-full rounded-full border-0 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-white/60"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[#0b1530] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black/60"
                    >
                      عضویت
                    </button>
                  </form>
                )}
              </section>

              {/* ---------- دوره های مرتبط آموزشی ---------- */}
              <section
                className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                aria-label="دوره های مرتبط آموزشی"
              >
                <SectionTitle>دوره های مرتبط آموزشی</SectionTitle>
                <div className="mt-4 grid gap-3">
                  {relatedPrograms.map((program) => {
                    const Icon = PROGRAM_ICONS[program.id] || Dumbbell;
                    return (
                      <div key={program.id} className="rounded-2xl border border-border p-4">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="mt-3 text-base font-bold text-foreground">{program.title}</h3>
                        <p className="mt-1 text-sm leading-7 text-muted">{program.description}</p>
                        <Link
                          to={program.to}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                        >
                          {program.cta}
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
