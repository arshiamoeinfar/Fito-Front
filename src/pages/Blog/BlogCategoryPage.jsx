// ============================================================
// صفحه مجموعه بلاگ /blog/category/:slug — بازطراحی کامل
// ============================================================
// نسخه قبلی با بقیه صفحات بلاگ هماهنگ نبود: نوبار داشبورد
// (shared/Navbar) را استفاده می‌کرد، کادر هدر بزرگ و گرید
// سه‌ستونه داشت و BlogCard را از مسیر Components می‌گرفت.
// این نسخه هم‌زبان صفحه لیست بلاگ است:
//   - BlogNavbar مخصوص بلاگ (نه نوبار داشبورد)
//   - نوار بالای فشرده مثل صفحه لیست: آیکون دسته + تیتر + توضیح
//     و تعداد مقاله‌ها
//   - چیپ‌های دسته‌ها برای جابه‌جایی بین دسته‌ها
//   - مقاله‌ها با همان BlogCard و همان گرید دو ستونه صفحه لیست
// منطق و API عوض نشده است: fetchCategories +
// fetchPostsByCategory، notFound، زیردسته‌ها و document.title
// همان‌های قبلی‌اند. ایمپورت‌ها مطابق پروژه آرشیا: BlogCard و
// BlogNavbar در همین پوشه‌اند (./BlogCard ،./BlogNavbar).
// ============================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Dumbbell,
  HeartPulse,
  MoonStar,
  SearchX,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import BlogCard from './BlogCard';
import BlogNavbar from './BlogNavbar';
import { fetchCategories, fetchPostsByCategory } from './blogApi';

const CATEGORY_ICONS = {
  Dumbbell,
  UtensilsCrossed,
  MoonStar,
  HeartPulse,
  Sparkles,
};

export default function BlogCategoryPage() {
  const { categorySlug } = useParams();
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    Promise.all([fetchCategories(), fetchPostsByCategory(categorySlug)])
      .then(([cats, list]) => {
        if (!alive) return;
        setCategories(cats);
        const found = cats.find((c) => c.slug === categorySlug) || null;
        setCategory(found);
        setPosts(list);
        if (!found) setNotFound(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [categorySlug]);

  useEffect(() => {
    if (category) document.title = `${category.seo_title || category.name} | فیتو`;
  }, [category]);

  const Icon = category ? CATEGORY_ICONS[category.icon] || Sparkles : Sparkles;
  const children = category?.children || [];

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <BlogNavbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          بازگشت به همه مقالات
        </Link>

        {loading ? (
          <div className="mt-6 space-y-4" aria-busy="true">
            <div className="h-28 animate-pulse rounded-2xl bg-surface-secondary" />
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-secondary" />
              ))}
            </div>
          </div>
        ) : notFound ? (
          <div className="mt-6 rounded-2xl border border-border bg-surface p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-secondary text-primary">
              <SearchX className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-lg font-bold">این دسته پیدا نشد</p>
            <p className="mt-2 text-sm leading-7 text-muted">ممکن است آدرس دسته تغییر کرده باشد.</p>
            <Link
              to="/blog"
              className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              مشاهده همه مقالات
            </Link>
          </div>
        ) : (
          <>
            {/* ---------- نوار بالای فشرده: دسته + توضیح ---------- */}
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-primary">مجله فیتو</p>
                  <h1 className="mt-1 text-2xl font-black text-foreground">{category.name}</h1>
                  {category.description ? (
                    <p className="mt-1 text-sm leading-7 text-muted">{category.description}</p>
                  ) : null}
                </div>
              </div>
              <span className="w-fit shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                {posts.length} مقاله در این دسته
              </span>
            </div>

            {/* ---------- زیردسته‌ها ---------- */}
            {children.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {children.map((child) => (
                  <span
                    key={child.id || child.slug}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted"
                  >
                    {child.name}
                  </span>
                ))}
              </div>
            ) : null}

            {/* ---------- چیپ‌های دسته‌ها ---------- */}
            <div className="mb-6 mt-6 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/blog/category/${cat.slug}`}
                  className={
                    cat.slug === categorySlug
                      ? 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white'
                      : 'rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary'
                  }
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {posts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-10 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-secondary text-primary">
                  <SearchX className="h-7 w-7" aria-hidden="true" />
                </span>
                <p className="mt-4 text-lg font-bold">هنوز مقاله‌ای در این دسته نیست</p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  به‌زودی مقاله‌های تازه این دسته اضافه می‌شود.
                </p>
                <Link
                  to="/blog"
                  className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  مشاهده همه مقالات
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
