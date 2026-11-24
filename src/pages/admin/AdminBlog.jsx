import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";

const EMPTY_CATEGORY = { name: "", slug: "", parent_id: "", description: "", seo_title: "", meta_description: "", is_visible: true };
const EMPTY_POST = {
  title: "", slug: "", excerpt: "", body: "", blog_category_id: "", cover_url: "", cover_alt: "",
  author_name: "فیتو", status: "draft", seo_title: "", meta_description: "", focus_keyword: "",
  related_keywords: "", canonical_url: "", robots: "index,follow", schema_type: "BlogPosting",
  og_title: "", og_description: "", og_image_url: "", twitter_title: "", twitter_description: "", twitter_image_url: "",
  related_post_ids: [],
};

function errorText(caught) {
  return caught instanceof ApiError ? caught.message : "درخواست ناموفق بود.";
}

function flatten(nodes, depth = 0) {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flatten(node.children ?? [], depth + 1),
  ]);
}

export default function AdminBlog() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(EMPTY_CATEGORY);
  const [post, setPost] = useState(EMPTY_POST);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");

  const flat = flatten(categories);

  function load() {
    return Promise.all([
      api("/api/v1/admin/blog/categories"),
      api("/api/v1/admin/blog/posts"),
    ]).then(([categoryBody, postBody]) => {
      setCategories(categoryBody.categories ?? []);
      setPosts(postBody.posts ?? []);
    });
  }

  useEffect(() => {
    load().catch((caught) => setNotice(errorText(caught)));
  }, []);

  async function saveCategory(event) {
    event.preventDefault();
    await api("/api/v1/admin/blog/categories", {
      method: "POST",
      body: { ...category, parent_id: category.parent_id === "" ? null : Number(category.parent_id) },
    });
    setCategory(EMPTY_CATEGORY);
    setNotice("دسته ذخیره شد.");
    await load();
  }

  async function savePost(event) {
    event.preventDefault();
    const body = {
      ...post,
      blog_category_id: post.blog_category_id === "" ? null : Number(post.blog_category_id),
      related_keywords: post.related_keywords.split(/[,،]/).map((item) => item.trim()).filter(Boolean),
      related_post_ids: post.related_post_ids.map(Number),
    };
    await api(editingId ? `/api/v1/admin/blog/posts/${editingId}` : "/api/v1/admin/blog/posts", {
      method: editingId ? "PATCH" : "POST",
      body,
    });
    setPost(EMPTY_POST);
    setEditingId(null);
    setNotice(editingId ? "مقاله به‌روز شد." : "مقاله ساخته شد.");
    await load();
  }

  async function edit(id) {
    const detail = await api(`/api/v1/admin/blog/posts/${id}`);
    setEditingId(id);
    setPost({
      ...EMPTY_POST,
      ...detail,
      blog_category_id: detail.category?.id ?? "",
      related_keywords: (detail.seo?.keywords ?? []).filter((word) => word !== detail.seo?.focus_keyword).join("، "),
      seo_title: detail.seo?.title ?? "",
      meta_description: detail.seo?.description ?? "",
      focus_keyword: detail.seo?.focus_keyword ?? "",
      canonical_url: detail.seo?.canonical ?? "",
      robots: detail.seo?.robots ?? "index,follow",
      schema_type: detail.seo?.schema?.[0]?.["@type"] ?? "BlogPosting",
      og_title: detail.seo?.open_graph?.title ?? "",
      og_description: detail.seo?.open_graph?.description ?? "",
      og_image_url: detail.seo?.open_graph?.image ?? "",
      twitter_title: detail.seo?.twitter?.title ?? "",
      twitter_description: detail.seo?.twitter?.description ?? "",
      twitter_image_url: detail.seo?.twitter?.image ?? "",
      related_post_ids: (detail.related ?? []).map((item) => item.id),
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]" dir="rtl">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        <HeaderDashBoard title="بلاگ" description="دستهٔ تودرتو و مقاله با سئو. نمایش عمومی سایت بعداً از همین API خوانده می‌شود." />
        <Link to="/admin/plans" className="text-sm text-[#007BFF]">بازگشت به پلن‌ها</Link>
        {notice ? <p className="rounded-2xl bg-white px-4 py-3 text-sm">{notice}</p> : null}

        <section className="grid gap-4 rounded-[28px] bg-white p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <form onSubmit={saveCategory} className="grid gap-3">
            <h2 className="text-lg text-[#16324F]">دسته‌بندی</h2>
            <input className="rounded-2xl border px-4 py-3" placeholder="نام دسته" value={category.name} onChange={(event) => setCategory({ ...category, name: event.target.value })} required />
            <input className="rounded-2xl border px-4 py-3" placeholder="اسلاگ، خالی باشد از نام ساخته می‌شود" value={category.slug} onChange={(event) => setCategory({ ...category, slug: event.target.value })} />
            <select className="rounded-2xl border px-4 py-3" value={category.parent_id} onChange={(event) => setCategory({ ...category, parent_id: event.target.value })}>
              <option value="">بدون والد</option>
              {flat.map((item) => <option key={item.id} value={item.id}>{"—".repeat(item.depth)} {item.name}</option>)}
            </select>
            <textarea className="rounded-2xl border px-4 py-3" placeholder="توضیح دسته" value={category.description} onChange={(event) => setCategory({ ...category, description: event.target.value })} />
            <input className="rounded-2xl border px-4 py-3" placeholder="عنوان سئو دسته" value={category.seo_title} onChange={(event) => setCategory({ ...category, seo_title: event.target.value })} />
            <textarea className="rounded-2xl border px-4 py-3" placeholder="متا دیسکریپشن دسته" value={category.meta_description} onChange={(event) => setCategory({ ...category, meta_description: event.target.value })} />
            <button className="rounded-full bg-[#007BFF] px-4 py-3 text-sm text-white" type="submit">ذخیره دسته</button>
          </form>
          <ul className="grid content-start gap-2 text-sm">
            {flat.map((item) => (
              <li key={item.id} className="rounded-2xl bg-[#F7FAFE] px-4 py-3" style={{ marginRight: item.depth * 16 }}>
                {item.name} <span className="text-[#6B7280]">/{item.slug}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[28px] bg-white p-6">
          <h2 className="text-lg text-[#16324F]">مقاله‌ها</h2>
          <ul className="mt-4 grid gap-2">
            {posts.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-2xl bg-[#F7FAFE] px-4 py-3 text-sm">
                <span>{item.title} · {item.status} · {item.focus_keyword || "بدون کلمه"}</span>
                <button type="button" className="text-[#007BFF]" onClick={() => edit(item.id)}>ویرایش</button>
              </li>
            ))}
          </ul>
        </section>

        <form onSubmit={savePost} className="grid gap-4 rounded-[28px] bg-white p-6">
          <h2 className="text-lg text-[#16324F]">{editingId ? "ویرایش مقاله" : "ایجاد مقاله"}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border px-4 py-3" placeholder="عنوان مقاله" value={post.title} onChange={(event) => setPost({ ...post, title: event.target.value })} required />
            <input className="rounded-2xl border px-4 py-3" placeholder="اسلاگ" value={post.slug} onChange={(event) => setPost({ ...post, slug: event.target.value })} />
            <input className="rounded-2xl border px-4 py-3" placeholder="عنوان سئو، حداکثر ۷۰ نویسه" value={post.seo_title} onChange={(event) => setPost({ ...post, seo_title: event.target.value })} required />
            <input className="rounded-2xl border px-4 py-3" placeholder="کلمه کلیدی کانونی" value={post.focus_keyword} onChange={(event) => setPost({ ...post, focus_keyword: event.target.value })} required />
          </div>
          <textarea className="rounded-2xl border px-4 py-3" placeholder="خلاصه، برای کارت و اسلایدر" value={post.excerpt} onChange={(event) => setPost({ ...post, excerpt: event.target.value })} required />
          <textarea className="min-h-40 rounded-2xl border px-4 py-3" placeholder="متن مقاله" value={post.body} onChange={(event) => setPost({ ...post, body: event.target.value })} required />
          <textarea className="rounded-2xl border px-4 py-3" placeholder="متا دیسکریپشن، ۵۰ تا ۱۶۰ نویسه" value={post.meta_description} onChange={(event) => setPost({ ...post, meta_description: event.target.value })} required />
          <input className="rounded-2xl border px-4 py-3" placeholder="کلمات مرتبط، با ویرگول" value={post.related_keywords} onChange={(event) => setPost({ ...post, related_keywords: event.target.value })} />
          <div className="grid gap-3 md:grid-cols-3">
            <select className="rounded-2xl border px-4 py-3" value={post.blog_category_id} onChange={(event) => setPost({ ...post, blog_category_id: event.target.value })}>
              <option value="">بدون دسته</option>
              {flat.map((item) => <option key={item.id} value={item.id}>{"—".repeat(item.depth)} {item.name}</option>)}
            </select>
            <select className="rounded-2xl border px-4 py-3" value={post.status} onChange={(event) => setPost({ ...post, status: event.target.value })}>
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشر شده</option>
              <option value="archived">بایگانی</option>
            </select>
            <select className="rounded-2xl border px-4 py-3" value={post.schema_type} onChange={(event) => setPost({ ...post, schema_type: event.target.value })}>
              <option value="BlogPosting">BlogPosting</option>
              <option value="Article">Article</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border px-4 py-3" placeholder="آدرس تصویر شاخص" value={post.cover_url} onChange={(event) => setPost({ ...post, cover_url: event.target.value })} />
            <input className="rounded-2xl border px-4 py-3" placeholder="متن جایگزین تصویر" value={post.cover_alt} onChange={(event) => setPost({ ...post, cover_alt: event.target.value })} />
            <input className="rounded-2xl border px-4 py-3" placeholder="نام نویسنده برای اسکیما" value={post.author_name} onChange={(event) => setPost({ ...post, author_name: event.target.value })} />
            <input className="rounded-2xl border px-4 py-3" placeholder="نشانی کانونیکال، خالی یعنی /blog/اسلاگ" value={post.canonical_url} onChange={(event) => setPost({ ...post, canonical_url: event.target.value })} />
          </div>
          <select className="rounded-2xl border px-4 py-3" value={post.robots} onChange={(event) => setPost({ ...post, robots: event.target.value })}>
            <option value="index,follow">index, follow</option>
            <option value="noindex,follow">noindex, follow</option>
            <option value="index,nofollow">index, nofollow</option>
            <option value="noindex,nofollow">noindex, nofollow</option>
          </select>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border px-4 py-3" placeholder="عنوان Open Graph" value={post.og_title} onChange={(event) => setPost({ ...post, og_title: event.target.value })} />
            <input className="rounded-2xl border px-4 py-3" placeholder="توضیح Open Graph" value={post.og_description} onChange={(event) => setPost({ ...post, og_description: event.target.value })} />
            <input className="rounded-2xl border px-4 py-3" placeholder="تصویر Open Graph" value={post.og_image_url} onChange={(event) => setPost({ ...post, og_image_url: event.target.value })} />
            <input className="rounded-2xl border px-4 py-3" placeholder="عنوان توییتر" value={post.twitter_title} onChange={(event) => setPost({ ...post, twitter_title: event.target.value })} />
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm text-[#4B5563]">مقالات مرتبط برای اسلایدر</legend>
            {posts.filter((item) => item.id !== editingId).map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={post.related_post_ids.includes(item.id)}
                  onChange={(event) => {
                    const ids = event.target.checked
                      ? [...post.related_post_ids, item.id]
                      : post.related_post_ids.filter((id) => id !== item.id);
                    setPost({ ...post, related_post_ids: ids });
                  }}
                />
                {item.title}
              </label>
            ))}
          </fieldset>
          <button className="w-fit rounded-full bg-[#16845A] px-5 py-3 text-sm text-white" type="submit">{editingId ? "ذخیره ویرایش" : "ساخت مقاله"}</button>
        </form>
      </main>
    </div>
  );
}
