// کارت مقاله — نسخه‌ای که در پوشه src/pages/Blog/ کنار BlogListPage می‌نشیند
// (در پروژه آرشیا BlogCard و BlogNavbar در همین پوشه‌اند، نه در Components).
// عکس گرد، تیتر ساده، خلاصه کوتاه و متا (تاریخ، زمان مطالعه، امتیاز
// فقط وقتی داده واقعاً دارد). نه گرادیان روی عکس، نه زوم و لیفت هاور،
// نه بج امتیاز روی کاور، نه چیپ تگ.
// row: ردیف افقی برای «مقالات اخیر» و مقالات دوم «مقالات برتر» —
// عکس کوچک سمت راست، متن سمت چپ. پیش‌فرض کارت عمودی است.
// wide: فقط برای سازگاری با نسخه قبلی نگه داشته شده؛ رفتارش مثل
// کارت عمودی معمولی است.

import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Star } from 'lucide-react';
import { categoryById, categoryBySlug } from './blogData';

function PostMeta({ post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      {post.published_at ? (
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {post.published_at}
        </span>
      ) : null}
      {post.reading_minutes ? (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {post.reading_minutes} دقیقه مطالعه
        </span>
      ) : null}
      {post.rating ? (
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          {post.rating}
        </span>
      ) : null}
      {post.comments_count ? <span>{post.comments_count} نظر</span> : null}
    </div>
  );
}

export default function BlogCard({ post, row = false, wide = false }) {
  if (!post) return null;
  const category =
    categoryBySlug(post.category_slug) || categoryById(post.blog_category_id) || null;

  const cover = post.cover_url ? (
    <img
      src={post.cover_url}
      alt={post.cover_alt || post.title}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-surface-secondary text-2xl font-black text-primary">
      فیتو
    </div>
  );

  if (row) {
    return (
      <article dir="rtl" className="flex gap-4 rounded-2xl border border-border bg-surface p-3">
        <Link
          to={`/blog/${post.slug}`}
          className="block h-24 w-28 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-36"
        >
          {cover}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
          {category ? (
            <Link
              to={`/blog/category/${category.slug}`}
              className="w-fit text-xs font-bold text-primary"
            >
              {category.name}
            </Link>
          ) : null}
          <Link to={`/blog/${post.slug}`}>
            <h3 className="line-clamp-2 text-sm font-bold leading-7 text-foreground sm:text-base sm:leading-8">
              {post.title}
            </h3>
          </Link>
          {post.excerpt ? (
            <p className="hidden truncate text-xs leading-6 text-muted sm:block">{post.excerpt}</p>
          ) : null}
          <div className="mt-auto">
            <PostMeta post={post} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article dir="rtl" className="overflow-hidden rounded-2xl border border-border bg-surface">
      <Link to={`/blog/${post.slug}`} className="block h-48 overflow-hidden">
        {cover}
      </Link>
      <div className="flex flex-col gap-2 p-5">
        {category ? (
          <Link
            to={`/blog/category/${category.slug}`}
            className="w-fit text-xs font-bold text-primary"
          >
            {category.name}
          </Link>
        ) : null}
        <Link to={`/blog/${post.slug}`}>
          <h3 className="text-lg font-bold leading-8 text-foreground">{post.title}</h3>
        </Link>
        {post.excerpt ? (
          <p className="line-clamp-2 text-sm leading-7 text-muted">{post.excerpt}</p>
        ) : null}
        <PostMeta post={post} />
        <div className="mt-1 flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="font-semibold text-foreground">{post.author_name || 'تیم فیتو'}</span>
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 font-semibold text-primary"
          >
            خواندن مقاله
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
