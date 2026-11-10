import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../../Components/shared/Navbar/Navbar";
import HeaderDashBoard from "../../Components/DashBoardAuth/HeaderDashBoard/HeaderDashBoard";
import { api, ApiError } from "../../api/client";
import { useSession } from "../../api/session";

const fieldClass = "mt-2 w-full rounded-2xl border border-[#E6EAF0] bg-white px-4 py-3 text-sm text-[#374151] outline-none";

const FIELD_LABELS = {
  label: "متن",
  target: "مقصد",
  icon: "نماد",
  title: "عنوان",
  description: "توضیح",
  number: "عدد",
  name: "نام",
  sets: "ست",
  done: "انجام‌شده",
  avatar: "حروف",
  status: "وضعیت",
  value: "مقدار",
  percent: "درصد",
  text: "توضیح",
};

const ICONS = [
  ["dumbbell", "وزنه"],
  ["flame", "شعله"],
  ["activity", "فعالیت"],
  ["spark", "ستاره"],
  ["chat", "گفتگو"],
];

function errorText(caught) {
  if (!(caught instanceof ApiError)) {
    return "درخواست ناموفق بود.";
  }

  return caught.message;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function blankRow(fields) {
  const row = {};
  fields.forEach((field) => {
    const key = typeof field === "string" ? field : field.key;
    row[key] = key === "done" ? "0" : (key === "icon" ? "spark" : "");
  });
  return row;
}

export default function AdminHomepage() {
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

  if (status !== "authenticated" || !account) {
    return <Navigate to="/" replace />;
  }

  return <HomepageDesk />;
}

function HomepageDesk() {
  const [sections, setSections] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    api("/api/v1/admin/homepage").then(
      (body) => {
        if (!active) {
          return;
        }

        const rows = Array.isArray(body?.sections) ? body.sections : [];
        setSections(rows);
        setTemplates(Array.isArray(body?.templates) ? body.templates : []);
        setSelectedKey((current) => current || rows.find((row) => row.key === "hero")?.key || rows[0]?.key || null);
        setForbidden(false);
      },
      (caught) => {
        if (!active) {
          return;
        }

        setForbidden(caught instanceof ApiError && caught.status === 403);
        setError(errorText(caught));
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const selected = sections.find((section) => section.key === selectedKey) || null;

  function replace(saved) {
    setSections((rows) => rows.map((row) => (row.key === saved.key ? saved : row)));
  }

  async function run(action) {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      await action();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  function toggle(section) {
    run(async () => {
      const saved = await api(`/api/v1/admin/homepage/sections/${section.key}`, {
        method: "PATCH",
        body: { visible: !section.visible },
      });
      replace(saved.section);
      setNotice(saved.section.visible ? "بخش در صفحه نشان داده می‌شود." : "بخش از صفحه مخفی شد. محتوا پاک نشده است.");
    });
  }

  function move(section, direction) {
    const body = sections.filter((item) => item.placement === "body");
    const index = body.findIndex((item) => item.key === section.key);
    const next = index + direction;

    if (index < 0 || next < 0 || next >= body.length) {
      return;
    }

    const keys = body.map((item) => item.key);
    const [picked] = keys.splice(index, 1);
    keys.splice(next, 0, picked);

    run(async () => {
      const saved = await api("/api/v1/admin/homepage/sections/order", {
        method: "PUT",
        body: { keys },
      });
      setSections(Array.isArray(saved?.sections) ? saved.sections : []);
      setNotice("ترتیب صفحه ذخیره شد.");
    });
  }

  function save(section, draft) {
    run(async () => {
      const saved = await api(`/api/v1/admin/homepage/sections/${section.key}`, {
        method: "PATCH",
        body: draft,
      });
      replace(saved.section);
      setNotice("ذخیره شد.");
    });
  }

  function create(template, name) {
    run(async () => {
      const saved = await api("/api/v1/admin/homepage/sections", {
        method: "POST",
        body: { template, name },
      });
      setSections((rows) => [...rows, saved.section]);
      setSelectedKey(saved.section.key);
      setCreating(false);
      setNotice("بخش جدید آخر صفحه اضافه شد. می‌توانید جایش را بالا ببرید.");
    });
  }

  function copy(section) {
    run(async () => {
      const saved = await api(`/api/v1/admin/homepage/sections/${section.key}/copy`, { method: "POST", body: {} });
      setSections((rows) => [...rows, saved.section]);
      setSelectedKey(saved.section.key);
      setNotice("یک کپی از این بخش ساخته شد.");
    });
  }

  function remove(section) {
    run(async () => {
      await api(`/api/v1/admin/homepage/sections/${section.key}`, { method: "DELETE" });
      const rest = sections.filter((item) => item.key !== section.key);
      setSections(rest);
      setSelectedKey(rest.find((item) => item.placement === "body")?.key || rest[0]?.key || null);
      setNotice("بخش سفارشی حذف شد.");
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-1 gap-6 bg-[#F5F7FB] px-4 pb-6 pt-24 lg:grid-cols-[90px_1fr] lg:px-8 lg:py-6">
        <div>
          <Navbar />
        </div>
        <div className="min-w-0 py-3">
          <div className="grid grid-cols-12 gap-6" dir="rtl">
            <HeaderDashBoard title="صفحه اصلی" description="بخش بسازید، جابه‌جا کنید یا مخفی کنید. تا وقتی خودتان تغییر ندهید، صفحه عمومی همان شکل فعلی را دارد." />
            <div className="col-span-12 flex flex-wrap gap-4 text-sm text-[#007BFF]">
              <Link to="/admin/plans">پلن‌ها</Link>
              <Link to="/admin/users">کاربران</Link>
              <Link to="/admin/settings">تنظیمات دستیار</Link>
              <a href="/" target="_blank" rel="noreferrer">دیدن صفحه</a>
            </div>
            {error ? <p className="col-span-12 rounded-3xl bg-red-50 px-6 py-4 text-sm text-red-700">{error}</p> : null}
            {notice ? <p className="col-span-12 rounded-3xl bg-green-50 px-6 py-4 text-sm text-green-700">{notice}</p> : null}
            {forbidden ? null : (
              <>
                <SectionList
                  sections={sections}
                  selectedKey={selectedKey}
                  pending={pending}
                  onSelect={setSelectedKey}
                  onMove={move}
                  onToggle={toggle}
                  onCreate={() => setCreating(true)}
                />
                <div className="col-span-12 lg:col-span-8">
                  {selected ? (
                    <SectionEditor
                      key={selected.key}
                      section={selected}
                      template={templates.find((item) => item.key === selected.template)}
                      pending={pending}
                      onSave={(draft) => save(selected, draft)}
                      onCopy={() => copy(selected)}
                      onDelete={() => remove(selected)}
                      onToggle={() => toggle(selected)}
                    />
                  ) : (
                    <p className="rounded-3xl bg-white p-7 text-sm text-[#6B6F77]">بخشی برای ویرایش نیست.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {creating ? (
        <TemplateDialog
          templates={templates}
          pending={pending}
          onClose={() => setCreating(false)}
          onCreate={create}
        />
      ) : null}
    </div>
  );
}

function SectionList({ sections, selectedKey, pending, onSelect, onMove, onToggle, onCreate }) {
  const body = sections.filter((section) => section.placement === "body");
  const chrome = sections.filter((section) => section.placement !== "body");

  return (
    <aside className="col-span-12 lg:col-span-4">
      <div className="rounded-3xl bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg text-[#374151]">بخش‌های صفحه</h2>
          <button type="button" onClick={onCreate} className="rounded-2xl bg-[#007BFF] px-4 py-2 text-sm text-white">
            بخش جدید
          </button>
        </div>
        <p className="mt-2 text-xs leading-6 text-[#9CA3AF]">جابه‌جایی فقط بخش‌های میانی را عوض می‌کند. منو بالا و پاورقی پایین می‌مانند.</p>
        <div className="mt-4 grid gap-2">
          {body.map((section, index) => (
            <SectionRow
              key={section.key}
              section={section}
              active={section.key === selectedKey}
              pending={pending}
              onSelect={onSelect}
              onToggle={onToggle}
              onUp={index === 0 ? null : () => onMove(section, -1)}
              onDown={index === body.length - 1 ? null : () => onMove(section, 1)}
            />
          ))}
        </div>
        <h3 className="mt-6 text-sm text-[#6B6F77]">ثابت‌های صفحه</h3>
        <div className="mt-3 grid gap-2">
          {chrome.map((section) => (
            <SectionRow
              key={section.key}
              section={section}
              active={section.key === selectedKey}
              pending={pending}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function SectionRow({ section, active, pending, onSelect, onToggle, onUp, onDown }) {
  return (
    <div className={`rounded-2xl border px-3 py-3 ${active ? "border-[#007BFF] bg-[#F3F8FF]" : "border-[#F0F2F5] bg-[#F5F7FB]"}`}>
      <button type="button" onClick={() => onSelect(section.key)} className="w-full text-right">
        <span className="block text-sm text-[#374151]">{section.name}</span>
        <span className="mt-1 block text-[11px] text-[#9CA3AF]">
          {section.system ? "بخش اصلی" : "بخش سفارشی"}
          {section.visible ? "" : " · مخفی"}
        </span>
      </button>
      <div className="mt-3 flex gap-2 text-xs">
        {onUp ? <button type="button" disabled={pending} onClick={onUp} className="rounded-xl bg-white px-3 py-1 text-[#007BFF]">بالا</button> : null}
        {onDown ? <button type="button" disabled={pending} onClick={onDown} className="rounded-xl bg-white px-3 py-1 text-[#007BFF]">پایین</button> : null}
        <button type="button" disabled={pending} onClick={() => onToggle(section)} className="mr-auto rounded-xl bg-white px-3 py-1 text-[#6B6F77]">
          {section.visible ? "مخفی کردن" : "نشان دادن"}
        </button>
      </div>
    </div>
  );
}

function SectionEditor({ section, template, pending, onSave, onCopy, onDelete, onToggle }) {
  const [name, setName] = useState(section.name);
  const [groups, setGroups] = useState(() => clone(section.groups || []));
  const [content, setContent] = useState(() => clone(section.content || {}));
  const [opened, setOpened] = useState(section.groups?.[0]?.title || "");
  const [confirming, setConfirming] = useState(false);

  function save(event) {
    event.preventDefault();
    const blocks = {};
    groups.forEach((group) => {
      group.blocks.forEach((block) => {
        blocks[block.key] = block.payload;
      });
    });
    onSave(section.system
      ? { name, visible: section.visible, blocks }
      : { name, visible: section.visible, content });
  }

  function changeBlock(groupIndex, blockIndex, next) {
    setGroups((rows) => rows.map((group, current) => (
      current === groupIndex
        ? { ...group, blocks: group.blocks.map((block, index) => (index === blockIndex ? next : block)) }
        : group
    )));
  }

  return (
    <form onSubmit={save} className="rounded-3xl bg-white p-6 text-right">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label className="text-xs text-[#6B6F77]">
            نام در فهرست مدیریت
            <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          </label>
          <p className="mt-3 text-xs leading-6 text-[#9CA3AF]">
            کلید بخش: <span className="text-[#374151]">{section.key}</span>
            {section.system ? "" : " — این کلید را در مقصد منو بگذارید تا همان بخش باز شود."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onToggle} className="rounded-2xl bg-[#F5F7FB] px-4 py-2 text-sm text-[#374151]">
            {section.visible ? "مخفی کردن" : "نشان دادن"}
          </button>
          <button type="submit" disabled={pending} className="rounded-2xl bg-[#007BFF] px-4 py-2 text-sm text-white disabled:opacity-60">
            ذخیره بخش
          </button>
        </div>
      </div>

      {section.key === "nav" ? (
        <p className="mt-4 rounded-2xl bg-[#F5F7FB] px-4 py-3 text-xs leading-6 text-[#6B6F77]">
          مقصد هر پیوند منو همان شناسه بخش در صفحه است: features، workout، nutrition، coaches. برای بخش سفارشی، کلید همان بخش را بنویسید.
        </p>
      ) : null}

      {section.system ? (
        <div className="mt-6 grid gap-3">
          {groups.map((group, groupIndex) => {
            const list = group.blocks.find((block) => Array.isArray(block.payload?.items));
            const count = list ? list.payload.items.length : null;

            return (
              <div key={group.title} className="rounded-2xl border border-[#F0F2F5]">
                <button
                  type="button"
                  onClick={() => setOpened(opened === group.title ? "" : group.title)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm text-[#374151]"
                >
                  <span>{group.title}{count === null ? "" : ` · ${count}`}</span>
                  <span className="text-xs text-[#9CA3AF]">{opened === group.title ? "بستن" : "ویرایش"}</span>
                </button>
                {opened === group.title ? (
                  <div className="grid gap-4 border-t border-[#F0F2F5] px-4 py-4">
                    {group.blocks.map((block, blockIndex) => (
                      <BlockEditor
                        key={block.key}
                        block={block}
                        onChange={(next) => changeBlock(groupIndex, blockIndex, next)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <CustomEditor template={template} content={content} onChange={setContent} />
      )}

      {section.system ? null : (
        <div className="mt-6 flex flex-wrap gap-3 border-t border-[#F0F2F5] pt-4">
          <button type="button" onClick={onCopy} disabled={pending} className="rounded-2xl bg-[#F5F7FB] px-4 py-2 text-sm text-[#007BFF]">
            کپی این بخش
          </button>
          <button
            type="button"
            onClick={() => (confirming ? onDelete() : setConfirming(true))}
            className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            {confirming ? "حذف قطعی" : "حذف بخش"}
          </button>
        </div>
      )}
    </form>
  );
}

function BlockEditor({ block, onChange }) {
  if (block.element === "text") {
    return (
      <label className="text-xs text-[#6B6F77]">
        {block.label}
        <textarea
          value={block.payload?.text ?? ""}
          rows={(block.payload?.text || "").length > 80 ? 3 : 1}
          onChange={(event) => onChange({ ...block, payload: { text: event.target.value } })}
          className={fieldClass}
        />
      </label>
    );
  }

  if (block.element === "numbers") {
    return <NumberEditor block={block} onChange={onChange} />;
  }

  return <ItemEditor block={block} onChange={onChange} />;
}

function NumberEditor({ block, onChange }) {
  const rows = Array.isArray(block.payload?.items) ? block.payload.items : [];

  function update(next) {
    onChange({ ...block, payload: { items: next } });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B6F77]">{block.label}</p>
        {rows.length < 24 ? (
          <button type="button" onClick={() => update([...rows, 50])} className="text-xs text-[#007BFF]">ستون جدید</button>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2 md:grid-cols-6">
        {rows.map((item, index) => (
          <div key={index}>
            <input
              type="number"
              min="0"
              max="100"
              value={item}
              onChange={(event) => update(rows.map((row, rowIndex) => (rowIndex === index ? Number(event.target.value) : row)))}
              className={fieldClass}
            />
            {rows.length > 1 ? (
              <button type="button" onClick={() => update(rows.filter((_, rowIndex) => rowIndex !== index))} className="mt-1 text-[11px] text-red-600">حذف</button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemEditor({ block, onChange }) {
  const fields = block.fields || [];
  const rows = Array.isArray(block.payload?.items) ? block.payload.items : [];

  function update(next) {
    onChange({ ...block, payload: { items: next } });
  }

  function change(index, field, value) {
    update(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  }

  function move(index, direction) {
    const next = index + direction;
    if (next < 0 || next >= rows.length) {
      return;
    }
    const copy = rows.slice();
    const [picked] = copy.splice(index, 1);
    copy.splice(next, 0, picked);
    update(copy);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#374151]">{block.label}</p>
        <button type="button" onClick={() => update([...rows, blankRow(fields)])} className="text-sm text-[#007BFF]">
          مورد جدید
        </button>
      </div>
      <div className="mt-3 grid gap-3">
        {rows.map((row, index) => (
          <article key={index} className="rounded-2xl bg-[#F5F7FB] p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-[#9CA3AF]">
              <span>ردیف {index + 1}</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => move(index, -1)} className="text-[#007BFF]">بالا</button>
                <button type="button" onClick={() => move(index, 1)} className="text-[#007BFF]">پایین</button>
                <button type="button" onClick={() => update(rows.filter((_, rowIndex) => rowIndex !== index))} className="text-red-600">حذف</button>
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((field) => (
                <FieldControl
                  key={field}
                  field={{ key: field, label: FIELD_LABELS[field] || field, type: field === "icon" ? "icon" : (field === "description" ? "textarea" : "text") }}
                  value={row[field]}
                  onChange={(value) => change(index, field, value)}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function CustomEditor({ template, content, onChange }) {
  if (!template) {
    return <p className="mt-6 text-sm text-[#6B6F77]">قالب این بخش شناخته نشد.</p>;
  }

  const rows = Array.isArray(content.items) ? content.items : [];
  const fields = template.items?.fields || [];

  function changeItem(index, key, value) {
    onChange({
      ...content,
      items: rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    });
  }

  return (
    <div className="mt-6 grid gap-4">
      <p className="text-xs leading-6 text-[#9CA3AF]">{template.hint}</p>
      {template.texts.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          value={content[field.key]}
          onChange={(value) => onChange({ ...content, [field.key]: value })}
        />
      ))}
      {template.items ? (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#374151]">{template.items.label}</p>
            <button
              type="button"
              onClick={() => onChange({ ...content, items: [...rows, blankRow(fields)] })}
              className="text-sm text-[#007BFF]"
            >
              مورد جدید
            </button>
          </div>
          <div className="mt-3 grid gap-3">
            {rows.map((row, index) => (
              <article key={index} className="rounded-2xl bg-[#F5F7FB] p-3">
                <div className="mb-2 text-left">
                  <button
                    type="button"
                    onClick={() => onChange({ ...content, items: rows.filter((_, rowIndex) => rowIndex !== index) })}
                    className="text-[11px] text-red-600"
                  >
                    حذف
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {fields.map((field) => (
                    <FieldControl
                      key={field.key}
                      field={field}
                      value={row[field.key]}
                      onChange={(value) => changeItem(index, field.key, value)}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldControl({ field, value, onChange }) {
  if (field.key === "done" || field.type === "done") {
    return (
      <label className="flex items-center gap-2 text-xs text-[#6B6F77]">
        <input
          type="checkbox"
          checked={value === "1" || value === true}
          onChange={(event) => onChange(event.target.checked ? "1" : "0")}
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "icon" || field.key === "icon") {
    return (
      <div className="text-xs text-[#6B6F77]">
        {field.label}
        <div className="mt-2 flex flex-wrap gap-2">
          {ICONS.map(([icon, label]) => (
            <button
              key={icon}
              type="button"
              onClick={() => onChange(icon)}
              className={`rounded-xl px-3 py-2 ${value === icon ? "bg-[#007BFF] text-white" : "bg-white text-[#374151]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const long = field.type === "textarea" || String(value || "").length > 80;

  return (
    <label className="text-xs text-[#6B6F77]">
      {field.label}
      {long ? (
        <textarea value={value ?? ""} rows={3} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
      ) : (
        <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
      )}
    </label>
  );
}

function TemplateDialog({ templates, pending, onClose, onCreate }) {
  const [template, setTemplate] = useState(templates[0]?.key || "cards");
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(template, name);
        }}
        className="w-full max-w-2xl rounded-3xl bg-white p-6 text-right"
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-[#374151]">بخش جدید</h2>
          <button type="button" onClick={onClose} className="text-sm text-[#6B6F77]">بستن</button>
        </div>
        <label className="mt-4 block text-xs text-[#6B6F77]">
          نام بخش
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلا امکانات باشگاه" className={fieldClass} />
        </label>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {templates.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTemplate(item.key)}
              className={`rounded-2xl border p-4 text-right ${template === item.key ? "border-[#007BFF] bg-[#F3F8FF]" : "border-[#F0F2F5]"}`}
            >
              <span className="block text-sm text-[#374151]">{item.label}</span>
              <span className="mt-2 block text-xs leading-6 text-[#6B6F77]">{item.hint}</span>
            </button>
          ))}
        </div>
        <button type="submit" disabled={pending || !template} className="mt-5 rounded-2xl bg-[#007BFF] px-5 py-3 text-sm text-white disabled:opacity-60">
          ساخت بخش
        </button>
      </form>
    </div>
  );
}
