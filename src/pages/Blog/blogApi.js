// لایه خواندن بلاگ عمومی فیتو — مطابق API واقعی بک‌اند
// بک‌اند (Fito-BackEnd-Dashboard) روت عمومی بلاگ را دارد:
//   GET /api/v1/blog/categories            -> { categories: [...] } درختی
//   GET /api/v1/blog/categories/{slug}     -> { category: {name, slug, seo_title, meta_description}, posts: [card] }
//   GET /api/v1/blog/posts                 -> { posts: [card] } — همه مقاله‌های published، بدون فیلتر سروری
//   GET /api/v1/blog/posts/{slug}          -> post کامل (بدون wrapper)
// شکل card (BlogDesk::card): id, title, slug, excerpt, cover_url, cover_alt,
//   author_name, published_at, category (نام، رشته), category_slug.
//   توجه: card نه reading_minutes دارد، نه امتیاز، نه نظر، نه تگ.
// شکل post کامل (BlogDesk::post): مثل card + body (رشته متنی ساده، نه sections)،
//   status, updated_at, category (آبجکت کامل)، category_ids،
//   reading_minutes (محاسبه‌شده از body)، related: [card]، و seo تو در تو.
// تگ‌ها فقط در seo.keywords و seo.article.tags هستند.
// اگر API در دسترس نبود (خطا/404)، بدون خطا به داده نمونه blogData.js برمی‌گردد.
// خروجی همیشه شکل blogData است تا صفحه‌ها عوض نشوند.

import { api } from '../../api/client';
import {
  categories as localCategories,
  posts as localPosts,
  categoryBySlug,
  getPostBySlug,
  getPostsByCategorySlug,
  getRelatedPosts,
} from './blogData';

// آیکون دسته از روی slug ساخته می‌شود؛ API آیکون برنمی‌گرداند.
export const CATEGORY_ICONS_BY_SLUG = {
  tamrin: 'Dumbbell',
  taghzieh: 'UtensilsCrossed',
  recovery: 'MoonStar',
  salamat: 'HeartPulse',
  zendegi: 'Sparkles',
};

function asArray(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload[key])) return payload[key];
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && payload.data && Array.isArray(payload.data[key])) return payload.data[key];
  return [];
}

function asObject(payload, key) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload[key] && typeof payload[key] === 'object') return payload[key];
    if (payload.data && typeof payload.data === 'object') return payload.data;
    return payload;
  }
  return null;
}

export function normalizeCategory(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id ?? index + 1,
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    icon: raw.icon ?? CATEGORY_ICONS_BY_SLUG[raw.slug] ?? 'Sparkles',
    description: raw.description ?? '',
    seo_title: raw.seo_title ?? raw.seo?.title ?? '',
    meta_description: raw.meta_description ?? raw.seo?.description ?? '',
    is_visible: raw.is_visible ?? true,
    parent_id: raw.parent_id ?? null,
    children: Array.isArray(raw.children) ? raw.children.map((c, i) => normalizeCategory(c, i)).filter(Boolean) : [],
  };
}

function sectionsFromBody(body) {
  if (Array.isArray(body)) return body;
  if (typeof body !== 'string' || body.trim() === '') {
    return [{ id: 'intro', heading: '', paragraphs: [], bullets: [], image: null }];
  }
  // بدنه واقعی ادمین یک رشته متنی ساده است. تیترها را از خط‌هایی می‌سازیم
  // که با # شروع می‌شوند (مارک‌داون)؛ اگر تیتر نبود، کل متن یک بخش می‌شود
  // و باکس «در این مقاله می‌خوانید» پنهان می‌ماند (BlogPostPage فقط وقتی
  // بیشتر از یک بخش با تیتر هست، فهرست را نشان می‌دهد).
  // برای اینکه فهرست داشته باشی، در ادمین بدنه را با تیترهای ## بنویس.
  const sections = [];
  let current = { id: 'intro', heading: '', paragraphs: [], bullets: [], image: null };
  const pushParagraphs = (text) => {
    text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => current.paragraphs.push(p));
  };
  body.split('\n').forEach((line) => {
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      if (current.paragraphs.length > 0 || current.heading) sections.push(current);
      current = {
        id: `section-${sections.length + 1}`,
        heading: heading[1].trim(),
        paragraphs: [],
        bullets: [],
        image: null,
      };
      return;
    }
    pushParagraphs(line);
  });
  sections.push(current);
  return sections.filter((s) => s.heading || s.paragraphs.length > 0);
}

export function normalizePost(raw) {
  if (!raw || typeof raw !== 'object') return null;
  // category در card یک رشته (نام دسته) است، در post کامل یک آبجکت است.
  const category = typeof raw.category === 'string' ? null : raw.category || null;
  const categoryName = typeof raw.category === 'string' ? raw.category : category?.name ?? '';
  const categorySlug =
    raw.category_slug || category?.slug || '';
  const seo = raw.seo || {};
  const openGraph = seo.open_graph || {};
  const twitter = seo.twitter || {};
  const sections = Array.isArray(raw.sections) && raw.sections.length > 0
    ? raw.sections
    : sectionsFromBody(raw.body);
  // تگ‌ها در API فقط در seo.keywords و seo.article.tags هستند؛
  // نه در related_keywords سطح بالا و نه در فیلد tags.
  const tags = [
    ...(Array.isArray(raw.tags) ? raw.tags : []),
    ...(Array.isArray(seo.keywords) ? seo.keywords : []),
    ...(Array.isArray(seo.article?.tags) ? seo.article.tags : []),
  ].filter((t, i, arr) => typeof t === 'string' && t.trim() && arr.indexOf(t) === i);
  // related در post کامل، کارت‌های کامل است نه فقط id؛ نگه‌شان می‌داریم
  // تا BlogPostPage مجبور نباشد از روی id در لیست پیداشان کند.
  const related = Array.isArray(raw.related)
    ? raw.related.map(normalizePost).filter(Boolean)
    : [];

  return {
    id: raw.id,
    title: raw.title ?? '',
    slug: raw.slug ?? '',
    excerpt: raw.excerpt ?? '',
    cover_url: raw.cover_url ?? '',
    cover_alt: raw.cover_alt ?? raw.title ?? '',
    blog_category_id: raw.blog_category_id ?? category?.id ?? null,
    category: categoryName,
    category_slug: categorySlug,
    author_name: raw.author_name ?? 'تیم فیتو',
    published_at: raw.published_at ?? raw.created_at ?? '',
    // reading_minutes فقط در post کامل برمی‌گردد؛ در card نیست.
    // هیچ عدد ساختگی نمی‌گذاریم تا کارت‌ها «۵ دقیقه» دروغین نشان ندهند.
    reading_minutes: raw.reading_minutes ?? null,
    // API امتیاز و نظر ندارد؛ null یعنی «نامشخص»، نه صفر.
    rating: raw.rating ?? null,
    comments_count: raw.comments_count ?? null,
    tags,
    status: raw.status ?? 'published',
    seo_title: raw.seo_title ?? seo.title ?? '',
    meta_description: raw.meta_description ?? seo.description ?? '',
    focus_keyword: raw.focus_keyword ?? seo.focus_keyword ?? '',
    related_keywords: Array.isArray(raw.related_keywords) ? raw.related_keywords : [],
    canonical_url: raw.canonical_url ?? seo.canonical ?? (raw.slug ? `/blog/${raw.slug}` : ''),
    robots: raw.robots ?? seo.robots ?? 'index,follow',
    schema_type: raw.schema_type ?? seo.schema?.[0]?.['@type'] ?? 'BlogPosting',
    og_title: raw.og_title ?? openGraph.title ?? '',
    og_description: raw.og_description ?? openGraph.description ?? '',
    og_image_url: raw.og_image_url ?? openGraph.image ?? '',
    twitter_title: raw.twitter_title ?? twitter.title ?? '',
    twitter_description: raw.twitter_description ?? twitter.description ?? '',
    twitter_image_url: raw.twitter_image_url ?? twitter.image ?? '',
    related_post_ids: Array.isArray(raw.related_post_ids)
      ? raw.related_post_ids
      : related.map((r) => r.id),
    related,
    body: typeof raw.body === 'string' ? raw.body : '',
    sections,
  };
}

function withCategorySlug(post) {
  if (post.category_slug) return post;
  const local = localPosts.find((p) => p.id === post.id || p.slug === post.slug);
  return { ...post, category_slug: local?.category_slug || '' };
}

export async function fetchCategories() {
  try {
    const payload = await api('/api/v1/blog/categories');
    const list = asArray(payload, 'categories').map(normalizeCategory).filter(Boolean);
    if (list.length > 0) return list;
    return localCategories;
  } catch {
    return localCategories;
  }
}

export async function fetchPosts({ categorySlug = '', search = '' } = {}) {
  try {
    // سرور پارامتر category/search را نمی‌خواند و همیشه همه مقاله‌های
    // published را برمی‌گرداند؛ فیلتر را سمت فرانت انجام می‌دهیم.
    const payload = await api('/api/v1/blog/posts');
    const list = asArray(payload, 'posts').map(normalizePost).filter(Boolean).map(withCategorySlug);
    if (list.length > 0) return filterList(list, { categorySlug, search });
    // اگر API خالی برگرداند، نمونه محلی را نشان بده تا صفحه خالی نماند.
    return filterLocal({ categorySlug, search });
  } catch {
    return filterLocal({ categorySlug, search });
  }
}

function filterList(list, { categorySlug = '', search = '' } = {}) {
  let out = [...list];
  if (categorySlug) out = out.filter((p) => p.category_slug === categorySlug);
  if (search.trim()) {
    const q = search.trim();
    out = out.filter(
      (p) =>
        p.title.includes(q) ||
        p.excerpt.includes(q) ||
        (p.tags || []).some((t) => t.includes(q)),
    );
  }
  return out;
}

function filterLocal({ categorySlug = '', search = '' } = {}) {
  let list = [...localPosts];
  if (categorySlug) list = list.filter((p) => p.category_slug === categorySlug);
  if (search.trim()) {
    const q = search.trim();
    list = list.filter(
      (p) =>
        p.title.includes(q) ||
        p.excerpt.includes(q) ||
        (p.tags || []).some((t) => t.includes(q)),
    );
  }
  return list;
}

export async function fetchPostsByCategory(categorySlug) {
  try {
    // اندپوینت واقعی دسته: GET /api/v1/blog/categories/{slug}
    // -> { category: {name, slug, seo_title, meta_description}, posts: [card] }
    // قبلاً اشتباه به /api/v1/blog/posts?category=... می‌زد که سرور نادیده می‌گیرد
    // و همه مقاله‌ها را برمی‌گرداند.
    const payload = await api(`/api/v1/blog/categories/${encodeURIComponent(categorySlug)}`);
    const list = asArray(payload, 'posts').map(normalizePost).filter(Boolean).map(withCategorySlug);
    if (list.length > 0) return list;
    return getPostsByCategorySlug(categorySlug);
  } catch {
    return getPostsByCategorySlug(categorySlug);
  }
}

export async function fetchPostBySlug(slug) {
  try {
    const payload = await api(`/api/v1/blog/posts/${encodeURIComponent(slug)}`);
    const raw = asObject(payload, 'post');
    const post = normalizePost(raw);
    if (post && post.slug) return withCategorySlug(post);
    return getPostBySlug(slug);
  } catch {
    return getPostBySlug(slug);
  }
}

export function getRelatedPostsLocal(post, limit = 3) {
  return getRelatedPosts(post, limit);
}

export { categoryBySlug };
