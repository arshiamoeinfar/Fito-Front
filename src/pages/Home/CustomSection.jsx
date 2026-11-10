function Icon({ name }) {
  if (name === "dumbbell") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 9v6M18 9v6M3 10v4M21 10v4M6 12h12" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "flame") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-2 2-3 2-5 0 3 2 3 2 3s0-3 0-6z" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "spark") {
    return <span className="text-xl font-bold">✦</span>;
  }

  if (name === "chat") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path d="M20 11.5C20 15.64 16.42 19 12 19C10.7 19 9.48 18.7 8.42 18.15L4 20L5.35 16.2C4.5 14.9 4 13.4 4 11.8C4 7.5 7.58 4 12 4C16.42 4 20 7.36 20 11.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 12h16M12 4v16" strokeLinecap="round" />
    </svg>
  );
}

function Heading({ eyebrow, title, muted }) {
  if (!eyebrow && !title && !muted) {
    return null;
  }

  return (
    <>
      {eyebrow ? <span className="text-xs font-medium text-[#007BFF]">{eyebrow}</span> : null}
      {title || muted ? (
        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          {title}
          {muted ? (
            <>
              <br />
              <span className="text-white/35">{muted}</span>
            </>
          ) : null}
        </h2>
      ) : null}
    </>
  );
}

function Cards({ content }) {
  const cards = Array.isArray(content.items) ? content.items : [];

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-14 text-center">
        <Heading eyebrow={content.eyebrow} title={content.title} muted={content.title_muted} />
        {content.lead ? <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/35">{content.lead}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <article key={`${card.title}-${index}`} className="rounded-3xl border border-white/8 bg-white/[0.025] p-6">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#007BFF]/20 bg-[#007BFF]/10 text-[#007BFF]">
              <Icon name={card.icon} />
            </div>
            <h3 className="mb-3 text-lg font-bold text-white">{card.title}</h3>
            <p className="text-sm leading-7 text-white/40">{card.description}</p>
            {content.more ? <div className="mt-6 text-xs text-[#007BFF]">{content.more}</div> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function Numbers({ content }) {
  const rows = Array.isArray(content.items) ? content.items : [];

  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-2 lg:grid-cols-4">
      {rows.map((item, index) => (
        <div key={`${item.label}-${index}`} className="px-5 py-10 text-center">
          <div className="text-3xl font-black text-white lg:text-4xl">{item.number}</div>
          <div className="mt-2 text-xs text-white/30">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function Showcase({ content }) {
  const rows = Array.isArray(content.items) ? content.items : [];

  return (
    <div className="mx-auto grid max-w-[1200px] items-center gap-16 lg:grid-cols-2">
      <div>
        <Heading eyebrow={content.eyebrow} title={content.title} muted={content.title_muted} />
        {content.lead ? <p className="mt-6 max-w-lg text-sm leading-8 text-white/35">{content.lead}</p> : null}
      </div>
      <div className="space-y-3">
        {rows.map((item, index) => (
          <article key={`${item.title}-${index}`} className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
            <p className="text-sm font-medium">{item.title}</p>
            {item.text ? <p className="mt-2 text-xs leading-6 text-white/35">{item.text}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function Banner({ content, onAction }) {
  return (
    <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[36px] border border-[#007BFF]/20 bg-[#007BFF]/[0.06] px-6 py-20 text-center">
      <div className="relative">
        {content.eyebrow ? <span className="text-xs text-[#4da3ff]">{content.eyebrow}</span> : null}
        <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-6xl">
          {content.title}
          {content.title_muted ? (
            <>
              <br />
              {content.title_muted}
            </>
          ) : null}
        </h2>
        {content.lead ? <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-white/35">{content.lead}</p> : null}
        {content.button ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-9 rounded-xl bg-[#007BFF] px-8 py-4 text-sm font-bold shadow-[0_15px_50px_rgba(0,123,255,0.3)] transition hover:-translate-y-1 hover:bg-[#006fe6]"
          >
            {content.button}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Prose({ content }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Heading eyebrow={content.eyebrow} title={content.title} />
      {content.body ? <p className="mt-6 text-sm leading-8 text-white/40">{content.body}</p> : null}
    </div>
  );
}

const VIEWS = {
  cards: Cards,
  numbers: Numbers,
  showcase: Showcase,
  banner: Banner,
  prose: Prose,
};

export default function CustomSection({ section, onAction }) {
  const content = section.content || {};
  const View = VIEWS[section.template] || Cards;
  const framed = section.template === "numbers";

  return (
    <section
      id={section.key}
      style={{ order: section.sort }}
      className={framed
        ? "border-y border-white/5 bg-white/[0.015]"
        : "px-5 py-28 lg:px-8"}
    >
      <View content={content} onAction={onAction} />
    </section>
  );
}
