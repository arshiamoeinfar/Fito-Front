// ============================================================
// صفحه مقاله تکی /blog/:slug — بازطراحی کامل
// ============================================================
// نسخه قبلی یک ستون وسط‌چین ساده بود: کاور، تیتر وسط،
// متن، و همه بخش‌ها پشت سر هم. این نسخه یک تجربه مطالعه است:
//   - نوار پیشرفت مطالعه در بالای صفحه
//   - دسکتاپ دو ستونه: ستون مقاله + سایدبار چسبان (فهرست مقاله،
//     دسته‌بندی، اشتراک‌گذاری)؛ موبایل فهرست به‌شکل باکس جمع‌شونده
//     بالای مقاله می‌آید
//   - کاور بزرگ با چیپ دسته روی عکس، تیتر بزرگ، ردیف متا با آواتار
//     نویسنده، تیترهای بخش با نوار آبی، بولت‌های چک‌دار، تصاویر گرد
// ترتیب بخش‌ها بعد از مقاله حفظ شده: نویسنده، اشتراک‌گذاری، دیدگاه‌ها
// و فرم نظر، دسته + برچسب‌ها، مطالب مرتبط، مطالب پیشنهادی.
// منطق و API عوض نشده است (fetchPostBySlug + fetchPosts، ادغام related
// و suggested، rating فقط وقتی واقعی است). نظرها فعلاً فقط محلی ثبت
// می‌شوند تا API نظرها ساخته شود؛ «۰ از ۵ (۰ دیدگاه)» نشان نمی‌دهیم.
// ایمپورت‌ها مطابق پروژه ارشیا: BlogCard و BlogNavbar از همین پوشه
// (./BlogCard ،./BlogNavbar)؛ نوبار داشبورد حذف شده است.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Link2,
  ListOrdered,
  MessageSquare,
  Send,
  Share2,
  Star,
  Tag,
  User,
} from 'lucide-react';
import BlogCard from './BlogCard';
import BlogNavbar from './BlogNavbar';
import { fetchPostBySlug, fetchPosts } from './blogApi';
import { categoryById, categoryBySlug, getRelatedPosts, relatedPrograms, sampleComments } from './blogData';

function MetaChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-muted">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      {children}
    </span>
  );
}

function TocList({ sections }) {
  return (
    <ol className="mt-4 space-y-1">
      {sections.filter((s) => s.heading).map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="group flex items-start gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-primary/5 hover:text-primary"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary transition group-hover:bg-primary group-hover:text-white">
              {i + 1}
            </span>
            <span className="leading-6">{s.heading}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function ShareButtons({ post, copied, onCopy }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        تلگرام
      </a>
      <button
        type="button"
        onClick={onCopy}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
          copied
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-background text-foreground hover:border-primary hover:text-primary'
        }`}
      >
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        {copied ? 'کپی شد' : 'کپی لینک'}
      </button>
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [commentSent, setCommentSent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setCommentSent(false);
    Promise.all([fetchPostBySlug(slug), fetchPosts()])
      .then(([found, all]) => {
        if (!alive) return;
        if (!found) {
          setNotFound(true);
          setPost(null);
          return;
        }
        setPost(found);
        document.title = `${found.seo_title || found.title} | فیتو`;
        // related کامل از خود API می‌آید (post.related)؛ اگر نبود، از idها
        // در لیست همه مقاله‌ها پیداشان می‌کنیم، و اگر آن هم نبود، نمونه محلی.
        const rel = [...(found.related || []), ...getRelatedPosts(found, 3)];
        const relIds = new Set(rel.map((p) => p.id));
        const fromApi = (all || []).filter((p) => (found.related_post_ids || []).includes(p.id));
        const merged = [...fromApi, ...rel].filter(
          (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
        );
        const finalRelated = merged.length > 0 ? merged.slice(0, 3) : rel;
        setRelated(finalRelated);
        const relatedIds = new Set(finalRelated.map((p) => p.id));
        setSuggested((all || []).filter((p) => p.id !== found.id && !relatedIds.has(p.id)).slice(0, 3));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  // نوار پیشرفت مطالعه — فقط UI، به منطق داده کاری ندارد.
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (el.scrollTop / total) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const category = useMemo(() => {
    if (!post) return null;
    return categoryBySlug(post.category_slug) || categoryById(post.blog_category_id) || null;
  }, [post]);

  const sections = post?.sections || [];
  const intro = sections[0]?.paragraphs?.[0] || post?.excerpt || '';
  const tags = post?.tags || [];
  const visibleTags = showAllTags ? tags : tags.slice(0, 6);
  // API واقعی امتیاز و نظر ندارد؛ rating/comments_count در آن حالت null است.
  // پس «۰ از ۵ (۰ دیدگاه)» نشان نمی‌دهیم و نظرهای نمونه را هم به‌جای
  // نظر واقعی مقاله جا نمی‌زنیم — فقط برای مقاله‌های نمونه محلی که
  // rating دارند، نظرهای نمونه نشان داده می‌شوند.
  const averageRating = post?.rating ?? null;
  const hasRating = averageRating != null && (post?.comments_count ?? 0) > 0;
  const showSampleComments = averageRating != null;
  const tocSections = sections.filter((s) => s.heading);

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
    }
    window.setTimeout(() => setCopied(false), 2000);
  }

  function submitComment(event) {
    event.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    // فعلاً فقط محلی ثبت می‌شود؛ وقتی API نظرها ساخته شد، اینجا POST شود.
    setCommentSent(true);
    setName('');
    setPhone('');
    setComment('');
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        <BlogNavbar />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
          <div className="h-72 animate-pulse rounded-3xl bg-surface-secondary md:h-96" />
          <div className="mx-auto mt-6 h-8 w-2/3 animate-pulse rounded-full bg-surface-secondary" />
          <div className="mt-8 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-5 animate-pulse rounded-full bg-surface-secondary" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground">
        <BlogNavbar />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-secondary text-2xl font-black text-primary">
            ؟
          </span>
          <h1 className="mt-5 text-2xl font-black">این مقاله پیدا نشد</h1>
          <p className="mt-3 text-muted">ممکن است آدرس مقاله تغییر کرده یا حذف شده باشد.</p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            بازگشت به مقالات
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* نوار پیشرفت مطالعه */}
      <div
        className="fixed right-0 top-0 z-[60] h-1 bg-primary transition-[width] duration-150"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
      <BlogNavbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        {/* مسیر: همه مقالات / دسته */}
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="مسیر">
          <Link to="/blog" className="font-semibold transition hover:text-primary">
            همه مقالات
          </Link>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {category ? (
            <Link to={`/blog/category/${category.slug}`} className="font-semibold text-primary">
              {category.name}
            </Link>
          ) : null}
        </nav>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          {/* ---------- ستون مقاله ---------- */}
          <div className="min-w-0">
            {/* کاور با چیپ دسته روی عکس */}
            {post.cover_url ? (
              <div className="relative overflow-hidden rounded-3xl shadow-lg shadow-black/5">
                <img
                  src={post.cover_url}
                  alt={post.cover_alt || post.title}
                  className="h-72 w-full object-cover md:h-[26rem]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden="true" />
                {category ? (
                  <Link
                    to={`/blog/category/${category.slug}`}
                    className="absolute bottom-4 right-4 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white shadow-lg transition hover:bg-primary/90"
                  >
                    {category.name}
                  </Link>
                ) : null}
              </div>
            ) : null}

            {/* تیتر + متا */}
            <header className="mt-7">
              <h1 className="text-3xl font-black leading-[1.4] md:text-[2.5rem] md:leading-[1.35]">
                {post.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold">{post.author_name || 'تیم فیتو'}</span>
                </span>
                <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
                {post.published_at ? (
                  <MetaChip icon={Calendar}>{post.published_at}</MetaChip>
                ) : null}
                {post.reading_minutes ? (
                  <MetaChip icon={Clock}>{post.reading_minutes} دقیقه مطالعه</MetaChip>
                ) : null}
                {hasRating ? (
                  <MetaChip icon={Star}>
                    {averageRating} ({post.comments_count} دیدگاه)
                  </MetaChip>
                ) : null}
              </div>
            </header>

            {/* مقدمه */}
            {intro ? (
              <p className="mt-7 rounded-3xl border border-border bg-surface p-6 text-base leading-9 text-foreground md:text-lg md:leading-10">
                {intro}
              </p>
            ) : null}

            {/* فهرست مقاله — موبایل: باکس جمع‌شونده بالای مقاله */}
            {tocSections.length > 1 ? (
              <div className="mt-7 overflow-hidden rounded-3xl border border-border bg-surface lg:hidden">
                <button
                  type="button"
                  onClick={() => setTocOpen((v) => !v)}
                  aria-expanded={tocOpen}
                  className="flex w-full items-center justify-between p-5 text-right"
                >
                  <span className="flex items-center gap-2 text-base font-bold">
                    <ListOrdered className="h-5 w-5 text-primary" aria-hidden="true" />
                    در این مقاله می‌خوانید
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted transition-transform ${tocOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {tocOpen ? (
                  <div className="border-t border-border px-2 pb-4 pt-1">
                    <TocList sections={sections} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* متن مقاله */}
            <article className="mt-8">
              {sections.map((s, index) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  {s.heading && index > 0 ? (
                    <h2 className="mb-5 mt-12 flex items-center gap-3 text-2xl font-black leading-10">
                      <span className="h-8 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      {s.heading}
                    </h2>
                  ) : null}
                  {(s.paragraphs || []).map((p, i) => (
                    <p key={i} className="mb-5 text-[17px] leading-9 text-foreground">
                      {p}
                    </p>
                  ))}
                  {(s.bullets || []).length > 0 ? (
                    <ul className="mb-7 space-y-3 rounded-3xl border border-border bg-surface p-5">
                      {s.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-3 text-[15px] leading-8 text-foreground">
                          <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {s.image ? (
                    <figure className="mb-7">
                      <img
                        src={s.image.src}
                        alt={s.image.alt || ''}
                        loading="lazy"
                        className="w-full rounded-3xl object-cover shadow-md shadow-black/5"
                      />
                      {s.image.alt ? (
                        <figcaption className="mt-2 text-center text-xs text-muted">{s.image.alt}</figcaption>
                      ) : null}
                    </figure>
                  ) : null}

                  {index === 1 ? (
                    <aside className="my-10 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-surface to-surface p-6">
                      <p className="text-xs font-black tracking-wide text-primary">پیشنهاد فیتو</p>
                      <h2 className="mt-1 text-xl font-black">پیشنهادهایی برای شما</h2>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        مقاله را خواندی؛ حالا قدم بعدی را با برنامه فیتو بردار.
                      </p>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {relatedPrograms.map((program) => (
                          <div
                            key={program.id}
                            className="rounded-3xl border border-border bg-background p-5 shadow-sm"
                          >
                            <h3 className="font-black">{program.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-muted">{program.description}</p>
                            <Link
                              to={program.to}
                              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90"
                            >
                              {program.cta}
                              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </aside>
                  ) : null}
                </section>
              ))}
            </article>

            {/* نویسنده */}
            <section className="mt-12 flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-center">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <User className="h-8 w-8" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted">نویسنده</p>
                <p className="mt-0.5 text-lg font-black">{post.author_name || 'تیم فیتو'}</p>
                <p className="mt-1 text-sm leading-7 text-muted">
                  تیم فیتو؛ مربی و کارشناس تمرین و تغذیه. مقاله‌ها را بر اساس تجربه باشگاه و منابع علمی می‌نویسیم.
                </p>
              </div>
            </section>

            {/* اشتراک‌گذاری */}
            <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
              <span className="inline-flex items-center gap-2 font-black">
                <Share2 className="h-5 w-5 text-primary" aria-hidden="true" />
                اشتراک‌گذاری
              </span>
              <ShareButtons post={post} copied={copied} onCopy={copyLink} />
            </section>

            {/* دیدگاه‌ها */}
            <section className="mt-12" aria-label="دیدگاه‌ها">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-black">
                  <MessageSquare className="h-6 w-6 text-primary" aria-hidden="true" />
                  دیدگاه شما
                </h2>
                {hasRating ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold shadow-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    میانگین {averageRating} از ۵ ({post.comments_count} دیدگاه)
                  </span>
                ) : null}
              </div>

              {showSampleComments ? (
                <>
                  <p className="mt-3 text-xs text-muted">دیدگاه‌های نمونه از خوانندگان</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {sampleComments.map((c) => (
                      <article key={c.id} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-black">{c.name}</p>
                          <span className="inline-flex items-center gap-1 text-sm font-bold">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                            {c.rating}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{c.date}</p>
                        <p className="mt-3 text-sm leading-7 text-foreground">{c.text}</p>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-5 rounded-3xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
                  هنوز دیدگاهی برای این مقاله ثبت نشده است. اولین نظر را تو بنویس.
                </p>
              )}

              <form onSubmit={submitComment} className="mt-6 rounded-3xl border border-border bg-surface p-6 shadow-sm">
                <h3 className="text-lg font-black">نظر خود را بنویسید</h3>
                {commentSent ? (
                  <p className="mt-4 flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-sm font-bold text-primary">
                    <Check className="h-5 w-5" aria-hidden="true" />
                    نظر شما ثبت شد. نظر شما پس از تایید مدیریت درج خواهد شد.
                  </p>
                ) : null}
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="نام"
                    aria-label="نام"
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    placeholder="شماره تماس (اختیاری)"
                    aria-label="شماره تماس"
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
                  />
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={4}
                  placeholder="دیدگاه شما…"
                  aria-label="دیدگاه شما"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
                />
                <p className="mt-3 text-xs leading-6 text-muted">نظر شما پس از تایید مدیریت درج خواهد شد.</p>
                <button
                  type="submit"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-black text-white transition hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  ثبت دیدگاه
                </button>
              </form>
            </section>

            {/* دسته + برچسب‌ها */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {category ? (
                <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-black">
                    <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
                    دسته‌بندی
                  </h2>
                  <Link
                    to={`/blog/category/${category.slug}`}
                    className="mt-4 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
                  >
                    {category.name}
                  </Link>
                  {category.description ? (
                    <p className="mt-3 text-sm leading-7 text-muted">{category.description}</p>
                  ) : null}
                </section>
              ) : null}

              {tags.length > 0 ? (
                <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-black">
                    <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
                    برچسب‌ها
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visibleTags.map((tag) => (
                      <span key={tag} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {tags.length > 6 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllTags((v) => !v)}
                      className="mt-4 text-sm font-bold text-primary"
                    >
                      {showAllTags ? 'مشاهده کمتر' : 'مشاهده بیشتر'}
                    </button>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>

          {/* ---------- سایدبار چسبان (دسکتاپ) ---------- */}
          <aside className="mt-10 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {tocSections.length > 1 ? (
                <nav className="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-label="فهرست مقاله">
                  <h2 className="flex items-center gap-2 text-base font-black">
                    <ListOrdered className="h-5 w-5 text-primary" aria-hidden="true" />
                    در این مقاله می‌خوانید
                  </h2>
                  <TocList sections={sections} />
                </nav>
              ) : null}

              <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-black">
                  <Share2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  اشتراک‌گذاری
                </h2>
                <div className="mt-4">
                  <ShareButtons post={post} copied={copied} onCopy={copyLink} />
                </div>
              </div>

              {category ? (
                <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-black">
                    <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
                    دسته‌بندی
                  </h2>
                  <Link
                    to={`/blog/category/${category.slug}`}
                    className="mt-4 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
                  >
                    {category.name}
                  </Link>
                  {category.description ? (
                    <p className="mt-3 text-sm leading-7 text-muted">{category.description}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        {/* ---------- مطالب مرتبط ---------- */}
        {related.length > 0 ? (
          <section className="mt-14">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">مطالب مرتبط</h2>
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                همه مقالات
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {related.map((p) => (
                <div key={p.id} className="w-80 shrink-0">
                  <BlogCard post={p} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ---------- مطالب پیشنهادی ---------- */}
        {suggested.length > 0 ? (
          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-black">مطالب پیشنهادی</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {suggested.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group flex gap-4 rounded-3xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary hover:shadow-md"
                >
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={p.cover_alt || p.title}
                      loading="lazy"
                      className="h-24 w-32 shrink-0 rounded-2xl object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <h3 className="font-black leading-7 transition group-hover:text-primary">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{p.excerpt}</p>
                    <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted">
                      {p.published_at ? <span>{p.published_at}</span> : null}
                      {p.reading_minutes ? <span>• {p.reading_minutes} دقیقه مطالعه</span> : null}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
